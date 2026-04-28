export interface User {
  id: string;
  email: string;
  role: 'CLIENT' | 'COIFFEUR' | 'ADMIN';
  nom: string;
  prenom: string;
  avatar?: string;
}

export interface Salon {
  id: string;
  nom: string;
  description: string;
  adresse: string;
  lat: number;
  lng: number;
  photos: string[];
  note: number;
  totalAvis: number;
  coiffeurId: string;
  coiffeurNom: string;
  coiffeurPrenom: string;
  prestations: Prestation[];
  horaires: Horaire[];
  distance?: number;
}

export interface Prestation {
  id: string;
  nom: string;
  description?: string;
  duree: number;
  prix: number;
  categorie: string;
  salonId: string;
}

export interface Horaire {
  id: string;
  jour: string;
  ouvert: boolean;
  heureDebut?: string;
  heureFin?: string;
  salonId: string;
}

export interface Booking {
  id: string;
  clientId: string;
  clientNom: string;
  clientPrenom: string;
  clientEmail: string;
  salonId: string;
  salonNom: string;
  prestationId: string;
  prestationNom: string;
  prestationDuree: number;
  prestationPrix: number;
  coiffeurId: string;
  dateHeure: string;
  statut: 'EN_ATTENTE' | 'CONFIRME' | 'ANNULE' | 'TERMINE';
  createdAt: string;
}

export interface Review {
  id: string;
  clientId: string;
  clientNom: string;
  clientPrenom: string;
  clientAvatar?: string;
  salonId: string;
  note: number;
  commentaire?: string;
  createdAt: string;
}

export interface TimeSlot {
  dateHeure: string;
  disponible: boolean;
}

export interface DashboardPro {
  rdvAujourdhui: number;
  rdvSemaine: number;
  noteMoyenne: number;
  totalClients: number;
  totalAvis: number;
  revenusMois: number;
}
