# Saloonify ✂️

> Marketplace de réservation chez des coiffeurs indépendants — inspirée de Doctolib × Treatwell

## Démarrage en 3 commandes

```bash
# 1. Installer les dépendances (workspaces)
npm install

# 2. Copier les variables d'environnement
cp packages/api-gateway/.env.example packages/api-gateway/.env
cp packages/graphql-service/.env.example packages/graphql-service/.env
cp packages/grpc-service/.env.example packages/grpc-service/.env
cp packages/client/.env.example packages/client/.env

# 3. Démarrer l'infrastructure + migrer + seeder + lancer les services
docker compose up -d postgres redis
npm run db:migrate && npm run db:seed
npm run dev
```

**Ou tout via Docker (production-like) :**

```bash
docker compose up -d
docker compose run --rm db-migrate
```

---

## Architecture

```
saloonify/
├── packages/
│   ├── client/             React 18 + Vite + TailwindCSS + Apollo Client
│   ├── api-gateway/        Express — auth JWT, rate limit, proxy → GraphQL
│   ├── graphql-service/    Apollo Server 4 — résolveurs → gRPC
│   └── grpc-service/       gRPC server — logique métier + Prisma + Redis events
├── packages/event-bus/     Redis Pub/Sub partagé
├── proto/                  .proto partagés entre services
├── prisma/                 Schema PostgreSQL + seeds
└── docker-compose.yml
```

### Flux de données

```
Client (React)
  → API Gateway :3000  (JWT, rate-limit, CORS, upload)
    → GraphQL Service :4000  (Apollo, résolveurs)
      → gRPC Service :50051  (métier, Prisma, events)
        → PostgreSQL :5432
        → Redis :6379  (Event Bus Pub/Sub)
```

---

## Comptes de test (après seed)

| Rôle | Email | Mot de passe |
|---|---|---|
| Coiffeur | `marie.dupont@saloonify.fr` | `password123` |
| Coiffeur | `ahmed.benali@saloonify.fr` | `password123` |
| Coiffeur | `sofia.martin@saloonify.fr` | `password123` |
| Client | `client1@example.com` | `password123` |

---

## Pages disponibles

### Client
| Route | Description |
|---|---|
| `/` | Home — hero, salons populaires, comment ça marche |
| `/explore` | Carte Leaflet + liste filtrables (note, prix, catégorie, rayon) |
| `/salon/:id` | Page salon — galerie, prestations, avis, horaires, carte |
| `/booking/:salonId` | Tunnel de réservation (prestation → créneau → confirmation) |
| `/my-bookings` | Mes rendez-vous (à venir / passés / annulés) |
| `/profile` | Mon profil |

### Espace Pro (COIFFEUR)
| Route | Description |
|---|---|
| `/pro/dashboard` | Stats du jour, RDV aujourd'hui, navigation rapide |
| `/pro/boutique` | Créer/modifier boutique + horaires |
| `/pro/prestations` | CRUD prestations |
| `/pro/agenda` | Vue semaine avec RDV |
| `/pro/reservations` | Confirmer / annuler / terminer les RDV |
| `/pro/avis` | Avis clients + distribution des notes |

---

## API

### Auth (API Gateway)
```
POST /auth/register    Corps: { email, password, role, nom, prenom }
POST /auth/login       Corps: { email, password }
POST /auth/refresh     Cookie: refresh_token
POST /auth/logout
```

### GraphQL `/graphql`
Explorateur disponible sur `http://localhost:4000` en développement.

**Queries principales :**
```graphql
salons(filter: { lat, lng, rayon, categorie, prixMax, noteMin })
salon(id: ID!)
availableSlots(salonId, prestationId, date)
myBookings
proBookings(date)
reviews(salonId)
dashboardPro
```

**Mutations principales :**
```graphql
register(input) / login(email, password)
createSalon(input) / updateSalon(id, input)
createPrestation(salonId, input) / updatePrestation / deletePrestation
setHoraires(salonId, horaires)
createBooking(salonId, prestationId, dateHeure)
cancelBooking(id) / confirmBooking(id)
addReview(salonId, note, commentaire)
```

---

## Stack technique

| Couche | Technologie |
|---|---|
| Frontend | React 18, Vite, TailwindCSS, Apollo Client, React Router v6 |
| Carte | Leaflet + React-Leaflet + OpenStreetMap |
| API Gateway | Express 4, JWT, multer, http-proxy-middleware, winston |
| GraphQL | Apollo Server 4 |
| gRPC | @grpc/grpc-js + proto-loader |
| Event Bus | Redis Pub/Sub (ioredis) |
| ORM | Prisma 5 |
| Base de données | PostgreSQL 16 |
| Cache | Redis 7 |
| Auth | JWT (access 15min + refresh 7j httpOnly cookie) |
| Monorepo | npm workspaces |

---

## Variables d'environnement clés

```env
# api-gateway
JWT_SECRET=...
JWT_REFRESH_SECRET=...
GRAPHQL_URL=http://localhost:4000
GRPC_HOST=localhost:50051

# grpc-service
DATABASE_URL=postgresql://...
REDIS_URL=redis://localhost:6379

# client
VITE_GRAPHQL_URL=http://localhost:3000/graphql
```

---

## Scripts npm

```bash
npm run dev           # Lance tous les services en parallèle
npm run db:generate   # Génère le client Prisma
npm run db:migrate    # Applique les migrations
npm run db:seed       # Seed les données de test
npm run db:studio     # Lance Prisma Studio
npm run build         # Build tous les packages
```

---

## Event Bus — événements Redis

| Événement | Publisher | Subscriber | Action |
|---|---|---|---|
| `booking.created` | BookingService | NotifService | Email confirmation client + coiffeur |
| `booking.confirmed` | BookingService | NotifService | Email confirmation |
| `booking.cancelled` | BookingService | BookingService + Notif | Libère créneau + email |
| `review.added` | ReviewService | SalonService | Recalcule note moyenne |
| `salon.updated` | SalonService | CacheService | Invalide cache |
