export const typeDefs = /* GraphQL */ `
  type User {
    id: ID!
    email: String!
    role: String!
    nom: String!
    prenom: String!
    avatar: String
  }

  type Salon {
    id: ID!
    nom: String!
    description: String!
    adresse: String!
    lat: Float!
    lng: Float!
    photos: [String!]!
    note: Float!
    totalAvis: Int!
    coiffeurId: String!
    coiffeurNom: String!
    coiffeurPrenom: String!
    prestations: [Prestation!]!
    horaires: [Horaire!]!
    distance: Float
  }

  type Prestation {
    id: ID!
    nom: String!
    description: String
    duree: Int!
    prix: Float!
    categorie: String!
    salonId: String!
  }

  type Horaire {
    id: ID!
    jour: String!
    ouvert: Boolean!
    heureDebut: String
    heureFin: String
    salonId: String!
  }

  type Booking {
    id: ID!
    clientId: String!
    clientNom: String!
    clientPrenom: String!
    clientEmail: String!
    salonId: String!
    salonNom: String!
    prestationId: String!
    prestationNom: String!
    prestationDuree: Int!
    prestationPrix: Float!
    coiffeurId: String!
    dateHeure: String!
    statut: String!
    createdAt: String!
  }

  type Review {
    id: ID!
    clientId: String!
    clientNom: String!
    clientPrenom: String!
    clientAvatar: String
    salonId: String!
    note: Int!
    commentaire: String
    createdAt: String!
  }

  type TimeSlot {
    dateHeure: String!
    disponible: Boolean!
  }

  type ReviewsResult {
    reviews: [Review!]!
    noteMoyenne: Float!
    total: Int!
  }

  type SalonsResult {
    salons: [Salon!]!
    total: Int!
  }

  type DashboardPro {
    rdvAujourdhui: Int!
    rdvSemaine: Int!
    noteMoyenne: Float!
    totalClients: Int!
    totalAvis: Int!
    revenusMois: Float!
  }

  input SalonFilterInput {
    lat: Float
    lng: Float
    rayon: Float
    categorie: String
    prixMax: Float
    noteMin: Float
    limit: Int
    offset: Int
  }

  input CreateSalonInput {
    nom: String!
    description: String!
    adresse: String!
    lat: Float!
    lng: Float!
    photos: [String!]
  }

  input UpdateSalonInput {
    nom: String
    description: String
    adresse: String
    lat: Float
    lng: Float
    photos: [String!]
  }

  input PrestationInput {
    nom: String!
    description: String
    duree: Int!
    prix: Float!
    categorie: String!
  }

  input HoraireInput {
    jour: String!
    ouvert: Boolean!
    heureDebut: String
    heureFin: String
  }

  type Query {
    me: User
    salons(filter: SalonFilterInput): SalonsResult!
    salon(id: ID!): Salon
    salonsByCoiffeur: [Salon!]!
    mySalon: Salon
    availableSlots(salonId: ID!, prestationId: ID!, date: String!): [TimeSlot!]!
    myBookings: [Booking!]!
    proBookings(date: String): [Booking!]!
    reviews(salonId: ID!, limit: Int, offset: Int): ReviewsResult!
    dashboardPro: DashboardPro!
  }

  type Mutation {
    updateProfile(nom: String, prenom: String, avatar: String): User!
    createSalon(input: CreateSalonInput!): Salon!
    updateSalon(id: ID!, input: UpdateSalonInput!): Salon!
    createPrestation(salonId: ID!, input: PrestationInput!): Prestation!
    updatePrestation(id: ID!, input: PrestationInput!): Prestation!
    deletePrestation(id: ID!): Boolean!
    setHoraires(salonId: ID!, horaires: [HoraireInput!]!): [Horaire!]!
    createBooking(salonId: ID!, prestationId: ID!, dateHeure: String!): Booking!
    cancelBooking(id: ID!): Booking!
    confirmBooking(id: ID!): Booking!
    terminateBooking(id: ID!): Booking!
    addReview(salonId: ID!, note: Int!, commentaire: String): Review!
  }
`;
