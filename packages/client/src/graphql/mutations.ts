import { gql } from '@apollo/client';

export const CREATE_SALON = gql`
  mutation CreateSalon($input: CreateSalonInput!) {
    createSalon(input: $input) {
      id nom description adresse lat lng photos note totalAvis
      coiffeurId coiffeurNom coiffeurPrenom distance
      prestations { id nom description duree prix categorie salonId }
      horaires { id jour ouvert heureDebut heureFin salonId }
    }
  }
`;

export const UPDATE_SALON = gql`
  mutation UpdateSalon($id: ID!, $input: UpdateSalonInput!) {
    updateSalon(id: $id, input: $input) {
      id nom description adresse lat lng photos
    }
  }
`;

export const CREATE_PRESTATION = gql`
  mutation CreatePrestation($salonId: ID!, $input: PrestationInput!) {
    createPrestation(salonId: $salonId, input: $input) {
      id nom description duree prix categorie salonId
    }
  }
`;

export const UPDATE_PRESTATION = gql`
  mutation UpdatePrestation($id: ID!, $input: PrestationInput!) {
    updatePrestation(id: $id, input: $input) {
      id nom description duree prix categorie salonId
    }
  }
`;

export const DELETE_PRESTATION = gql`
  mutation DeletePrestation($id: ID!) {
    deletePrestation(id: $id)
  }
`;

export const SET_HORAIRES = gql`
  mutation SetHoraires($salonId: ID!, $horaires: [HoraireInput!]!) {
    setHoraires(salonId: $salonId, horaires: $horaires) {
      id jour ouvert heureDebut heureFin salonId
    }
  }
`;

export const CREATE_BOOKING = gql`
  mutation CreateBooking($salonId: ID!, $prestationId: ID!, $dateHeure: String!) {
    createBooking(salonId: $salonId, prestationId: $prestationId, dateHeure: $dateHeure) {
      id salonNom prestationNom dateHeure statut
    }
  }
`;

export const CANCEL_BOOKING = gql`
  mutation CancelBooking($id: ID!) {
    cancelBooking(id: $id) { id statut }
  }
`;

export const CONFIRM_BOOKING = gql`
  mutation ConfirmBooking($id: ID!) {
    confirmBooking(id: $id) { id statut }
  }
`;

export const TERMINATE_BOOKING = gql`
  mutation TerminateBooking($id: ID!) {
    terminateBooking(id: $id) { id statut }
  }
`;

export const ADD_REVIEW = gql`
  mutation AddReview($salonId: ID!, $note: Int!, $commentaire: String) {
    addReview(salonId: $salonId, note: $note, commentaire: $commentaire) {
      id note commentaire createdAt clientNom clientPrenom
    }
  }
`;

export const UPDATE_PROFILE = gql`
  mutation UpdateProfile($nom: String, $prenom: String, $avatar: String) {
    updateProfile(nom: $nom, prenom: $prenom, avatar: $avatar) {
      id nom prenom avatar
    }
  }
`;
