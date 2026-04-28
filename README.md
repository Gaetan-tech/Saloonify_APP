# Saloonify

Plateforme de réservation de salons de coiffure. Les clients trouvent et réservent des créneaux ; les coiffeurs gèrent leur boutique, agenda et avis depuis un espace pro dédié.

---

## Fonctionnalités implémentées

### Authentification
- Inscription avec choix de rôle (CLIENT / COIFFEUR)
- Connexion JWT — access token 15 min + refresh token httpOnly 7 jours
- Rafraîchissement et révocation du token
- Rate limiting sur les routes auth

### Gestion des utilisateurs
- Création de compte avec hachage bcrypt du mot de passe
- Modification du profil (nom, prénom, avatar)
- Tableau de bord pro : RDV du jour / semaine, note moyenne, total clients, total avis, revenus du mois

### Salons
- Création d'une boutique (1 par coiffeur) avec horaires par défaut générés automatiquement
- Modification et suppression du salon
- Gestion des horaires par jour de la semaine (ouvert/fermé, heure de début/fin)
- CRUD des prestations (avec blocage si réservations actives en cours)
- Recherche avec filtres combinés : catégorie, prix max, note min
- Filtrage géographique par rayon (calcul Haversine) + tri par distance
- Pagination des résultats

### Réservations
- Tunnel de réservation : choix de la prestation → créneau → confirmation
- Génération des créneaux disponibles par tranche de 30 min selon les horaires du salon
- Vérification des conflits de créneaux à la création
- Cycle de vie complet : EN_ATTENTE → CONFIRME → TERMINE / ANNULE
- Historique client (à venir / passées / annulées)
- Vue pro des réservations avec filtre par date

### Avis
- Dépôt d'un avis (note 1–5 + commentaire) avec vérification de doublon par salon
- Recalcul automatique de la note moyenne du salon à chaque avis
- Liste des avis paginée avec note moyenne

### Upload & géolocalisation
- Upload de photos (max 10 fichiers, 5 Mo chacun, images uniquement)
- Recherche d'adresse et géocodage inverse via Nominatim (OpenStreetMap)

### Event Bus (Redis pub/sub)
- `booking.created` — réservation créée
- `booking.confirmed` — réservation confirmée
- `booking.cancelled` — réservation annulée
- `booking.terminated` — prestation terminée
- `review.added` — avis déposé
- `salon.updated` — boutique modifiée

### Frontend
- Page d'accueil avec salons mis en avant
- Explore : carte Leaflet interactive + liste filtrables
- Page salon : galerie photos, prestations, avis, horaires, carte
- Espace pro complet : dashboard, boutique, prestations, agenda semaine, réservations, avis
- Protection des routes par rôle (CLIENT, COIFFEUR, ADMIN)

---

## TODO

- [ ] Service de notifications email (l'event bus publie les événements, aucun consommateur n'envoie encore d'emails)
- [ ] Rappels de RDV par SMS / email
- [ ] Paiement en ligne (Stripe)
- [ ] Codes promo et programme de fidélité
- [ ] Multi-salon par coiffeur (actuellement limité à 1)
- [ ] Messagerie entre client et coiffeur
- [ ] Favoris / salons sauvegardés
- [ ] Recherche full-text des salons
- [ ] Requêtes géographiques via PostGIS (remplacer le filtre Haversine en mémoire)
- [ ] Cache Redis sur les lectures fréquentes
- [ ] Notation des clients par les coiffeurs
- [ ] Export de l'agenda en iCal
- [ ] Mode sombre
- [ ] PWA / application mobile
- [ ] Support multi-langue

---

## Architecture

Monorepo **npm workspaces** — 6 packages, communication interne via gRPC et Redis.

```
Saloonify/
├── packages/
│   ├── api-gateway/       Express — auth JWT, rate-limit, CORS, upload, proxy GraphQL
│   ├── client/            React 18 + Vite + Tailwind CSS + Apollo Client
│   └── event-bus/         Lib partagée Redis pub/sub
├── Services/
│   ├── service-user/      Microservice gRPC — utilisateurs & profils
│   ├── service-salon/     Microservice gRPC — salons, prestations & horaires
│   ├── service-booking/   Microservice gRPC — réservations & créneaux
│   └── service-review/    Microservice gRPC — avis & notes
├── prisma/                Schéma Prisma + migrations + seed
└── proto/                 Contrats gRPC partagés (.proto)
```

### Flux de données

```
Client React (5173)
  └─► API Gateway (3000)  — JWT · rate-limit · CORS · upload
        ├─► GraphQL /graphql  — Apollo Server 4 → résolveurs gRPC
        │     ├─► service-user    (50051)
        │     ├─► service-salon   (50052)
        │     ├─► service-booking (50053)
        │     └─► service-review  (50054)
        └─► REST  /auth  /api/upload  /api/geo
```

---

## Prérequis

- Node.js 18+
- PostgreSQL (port 5434 par défaut)
- Redis (port 6379)

---

## Installation

```bash
npm install
```

---

## Configuration

Chaque package dispose d'un `.env.example`. Copier et renseigner :

```bash
cp packages/api-gateway/.env.example   packages/api-gateway/.env
cp packages/client/.env.example        packages/client/.env
cp prisma/.env.example                 prisma/.env
```

Variables essentielles :

```env
# prisma/.env
DATABASE_URL=postgresql://postgres:password@localhost:5434/saloonify

# packages/api-gateway/.env
PORT=3000
JWT_SECRET=<clé secrète>
JWT_REFRESH_SECRET=<clé secrète>
REDIS_URL=redis://localhost:6379
CORS_ORIGINS=http://localhost:5173

# packages/client/.env
VITE_GRAPHQL_URL=http://localhost:3000/graphql
```

---

## Base de données

```bash
npm run db:generate   # Génère le client Prisma
npm run db:migrate    # Applique les migrations
npm run db:seed       # Données de démonstration
npm run db:studio     # Ouvre Prisma Studio
```

---

## Démarrage

```bash
npm run dev
```

Lance tous les services en parallèle :

| Service | Adresse |
|---|---|
| Client | http://localhost:5173 |
| API Gateway | http://localhost:3000 |
| GraphQL Playground | http://localhost:3000/graphql |
| service-user | gRPC `localhost:50051` |
| service-salon | gRPC `localhost:50052` |
| service-booking | gRPC `localhost:50053` |
| service-review | gRPC `localhost:50054` |

---

## API REST

| Méthode | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | — | Inscription |
| `POST` | `/auth/login` | — | Connexion |
| `POST` | `/auth/refresh` | cookie | Rafraîchir le token |
| `POST` | `/auth/logout` | — | Déconnexion |
| `POST` | `/api/upload` | Bearer | Upload photos (max 5 Mo, images uniquement) |
| `GET` | `/api/geo/search` | — | Géocodage (Nominatim) |

---

## GraphQL

### Queries

```graphql
me
salons(filter: { lat, lng, rayon, categorie, prixMax, noteMin, limit, offset })
salon(id: ID!)
salonsByCoiffeur
mySalon
availableSlots(salonId, prestationId, date)
myBookings
proBookings(date)
reviews(salonId, limit, offset)
dashboardPro
```

### Mutations

```graphql
updateProfile(nom, prenom, avatar)
createSalon(input)   /   updateSalon(id, input)
createPrestation(salonId, input)   /   updatePrestation   /   deletePrestation
setHoraires(salonId, horaires)
createBooking(salonId, prestationId, dateHeure)
cancelBooking(id)   /   confirmBooking(id)   /   terminateBooking(id)
addReview(salonId, note, commentaire)
```

---

## Rôles & pages

### CLIENT

| Route | Page |
|---|---|
| `/` | Accueil — salons populaires, géolocalisation |
| `/explore` | Carte Leaflet + filtres (note, prix, catégorie, rayon) |
| `/salon/:id` | Galerie, prestations, avis, horaires |
| `/booking/:salonId` | Tunnel de réservation (prestation → créneau → confirmation) |
| `/my-bookings` | Mes rendez-vous (à venir / passés / annulés) |
| `/profile` | Mon profil |

### COIFFEUR (espace pro)

| Route | Page |
|---|---|
| `/pro/dashboard` | Stats du jour, RDV aujourd'hui |
| `/pro/boutique` | Créer / modifier sa boutique + horaires |
| `/pro/prestations` | CRUD prestations |
| `/pro/agenda` | Vue semaine avec créneaux |
| `/pro/reservations` | Confirmer / annuler / terminer les RDV |
| `/pro/avis` | Avis clients + distribution des notes |

---

## Comptes de test (après seed)

| Rôle | Email | Mot de passe |
|---|---|---|
| Coiffeur | `marie.dupont@saloonify.fr` | `password123` |
| Coiffeur | `ahmed.benali@saloonify.fr` | `password123` |
| Client | `client1@example.com` | `password123` |

---

## Stack technique

| Couche | Technologie |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Apollo Client, React Router v6 |
| Carte | Leaflet + React-Leaflet + OpenStreetMap / Nominatim |
| API Gateway | Express 4, JWT, multer, winston, express-rate-limit |
| GraphQL | Apollo Server 4 |
| Transport inter-services | gRPC (`@grpc/grpc-js`) |
| Event Bus | Redis pub/sub |
| ORM | Prisma 5 |
| Base de données | PostgreSQL |
| Auth | JWT access (15 min) + refresh httpOnly cookie (7 j) |
| Monorepo | npm workspaces |

---

## Scripts npm racine

```bash
npm run dev           # Lance tous les services en parallèle
npm run build         # Build tous les packages
npm run db:generate   # Client Prisma
npm run db:migrate    # Migrations
npm run db:seed       # Seed
npm run db:studio     # Prisma Studio
```
