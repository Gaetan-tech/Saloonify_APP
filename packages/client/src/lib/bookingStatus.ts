export const STATUT_LABEL: Record<string, string> = {
  EN_ATTENTE: 'En attente',
  CONFIRME: 'Confirmé',
  ANNULE: 'Annulé',
  TERMINE: 'Terminé',
};

// With border classes — used in lists with bordered badge chips
export const STATUT_COLOR: Record<string, string> = {
  EN_ATTENTE: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  CONFIRME: 'bg-green-100 text-green-700 border-green-200',
  ANNULE: 'bg-red-50 text-red-400 border-red-200',
  TERMINE: 'bg-gray-100 text-gray-500 border-gray-200',
};

// Without border — used in compact inline badges
export const STATUT_COLOR_SIMPLE: Record<string, string> = {
  EN_ATTENTE: 'bg-yellow-100 text-yellow-700',
  CONFIRME: 'bg-green-100 text-green-700',
  ANNULE: 'bg-red-100 text-red-500',
  TERMINE: 'bg-gray-100 text-gray-600',
};

// Full config — used in MyBookings card backgrounds
export const STATUT_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  EN_ATTENTE: { label: 'En attente', color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' },
  CONFIRME: { label: 'Confirmé', color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
  ANNULE: { label: 'Annulé', color: 'text-red-500', bg: 'bg-red-50 border-red-200' },
  TERMINE: { label: 'Terminé', color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200' },
};
