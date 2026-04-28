import { gql } from '@apollo/client';

export const SALON_FRAGMENT = gql`
  fragment SalonFields on Salon {
    id nom description adresse lat lng photos note totalAvis
    coiffeurId coiffeurNom coiffeurPrenom distance
    prestations { id nom description duree prix categorie salonId }
    horaires { id jour ouvert heureDebut heureFin salonId }
  }
`;

export const GET_SALONS = gql`
  ${SALON_FRAGMENT}
  query GetSalons($filter: SalonFilterInput) {
    salons(filter: $filter) {
      salons { ...SalonFields }
      total
    }
  }
`;

export const GET_SALON = gql`
  ${SALON_FRAGMENT}
  query GetSalon($id: ID!) {
    salon(id: $id) { ...SalonFields }
  }
`;

export const GET_MY_SALON = gql`
  ${SALON_FRAGMENT}
  query GetMySalon { mySalon { ...SalonFields } }
`;

export const GET_AVAILABLE_SLOTS = gql`
  query GetAvailableSlots($salonId: ID!, $prestationId: ID!, $date: String!) {
    availableSlots(salonId: $salonId, prestationId: $prestationId, date: $date) {
      dateHeure disponible
    }
  }
`;

export const GET_MY_BOOKINGS = gql`
  query GetMyBookings {
    myBookings {
      id clientId clientNom clientPrenom salonId salonNom
      prestationId prestationNom prestationDuree prestationPrix
      coiffeurId dateHeure statut createdAt
    }
  }
`;

export const GET_PRO_BOOKINGS = gql`
  query GetProBookings($date: String) {
    proBookings(date: $date) {
      id clientId clientNom clientPrenom clientEmail salonId salonNom
      prestationId prestationNom prestationDuree prestationPrix
      coiffeurId dateHeure statut createdAt
    }
  }
`;

export const GET_REVIEWS = gql`
  query GetReviews($salonId: ID!, $limit: Int, $offset: Int) {
    reviews(salonId: $salonId, limit: $limit, offset: $offset) {
      reviews {
        id clientId clientNom clientPrenom clientAvatar salonId note commentaire createdAt
      }
      noteMoyenne total
    }
  }
`;

export const GET_DASHBOARD_PRO = gql`
  query GetDashboardPro {
    dashboardPro {
      rdvAujourdhui rdvSemaine noteMoyenne totalClients totalAvis revenusMois
    }
  }
`;

export const GET_ME = gql`
  query GetMe {
    me { id email role nom prenom avatar }
  }
`;
