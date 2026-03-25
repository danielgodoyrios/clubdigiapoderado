
// DATOS DE PRUEBA — reemplazar con llamadas reales al backend

// Roles posibles: 'apoderado' | 'profesor' | 'admin'
// Un mismo usuario puede tener múltiples roles (ej: apoderado + profesor)
export const mockUser = {
  id: 'usr_001',
  name: 'Carlos Muñoz',
  initials: 'CM',
  rut: '18.234.567-k',
  phone: '+56 9 8765 4321',
  email: 'carlos@email.com',
  // Roles activos del usuario en el sistema
  roles: ['apoderado', 'profesor'] as Array<'apoderado' | 'profesor' | 'admin'>,
  // Último rol seleccionado (para sesiones futuras)
  lastRole: 'apoderado' as 'apoderado' | 'profesor' | 'admin',
  // Contexto por rol
  profesorInfo: {
    club: 'C.D. Santo Domingo',
    club_id: 'club_001',
    categories: ['Alevín', 'Sub-14'],
    licenseNumber: 'PROF-2026-042',
  },
};

export const mockPupils = [
  {
    id: 'pup_001',
    name: 'Carlos Muñoz Jr.',
    initials: 'CM',
    number: 8,
    category: 'Alevín',
    club: 'C.D. Santo Domingo',
    attendance: 0.92,
    licenseId: 'LIC-2026-0892',
  },
  {
    id: 'pup_002',
    name: 'Ana Muñoz',
    initials: 'AM',
    number: 5,
    category: 'Sub-14',
    club: 'C.D. Santo Domingo',
    attendance: 0.88,
    licenseId: 'LIC-2026-0991',
  },
];

export const mockMatches = [
  {
    id: 'match_001',
    home: 'Sto. Domingo',
    away: 'Quilpué BC',
    date: '2026-03-25T20:00:00',
    venue: 'Gim. Municipal',
    league: 'Liga Regional Valparaíso',
    status: 'upcoming',
  },
  {
    id: 'match_002',
    home: 'Sto. Domingo',
    away: 'Valpo BC',
    date: '2026-03-28T19:30:00',
    venue: 'Polideportivo',
    league: 'Copa Chile FEBA',
    status: 'upcoming',
  },
];

export const mockBenefits = [
  { id: 'ben_001', name: 'GymMax · 30% descuento', emoji: '🏋️', type: 'carnet',   active: true },
  { id: 'ben_002', name: 'Pizza Sport · 2x1',      emoji: '🍕', type: 'qr',       active: true },
  { id: 'ben_003', name: 'SportShop · 15% off',    emoji: '👟', type: 'code',     code: 'IDEBASKET15', active: true },
];
