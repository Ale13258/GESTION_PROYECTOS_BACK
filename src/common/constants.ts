export const PERMISSIONS = [
  'manageUsers',
  'manageProjects',
  'manageInventory',
  'manageSuppliers',
  'manageMatrices',
  'manageQuotations',
  'manageApprovals',
  'viewReports',
  'manageSettings',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const ROLE = {
  ADMIN: 'admin',
  COLLABORATOR: 'collaborator',
} as const;

export type Role = (typeof ROLE)[keyof typeof ROLE];

export function permissionsForRole(role: Role): Permission[] {
  if (role === ROLE.ADMIN) return [...PERMISSIONS];
  return PERMISSIONS.filter((p) => p !== 'manageUsers');
}

export const PROJECT_STATUS = ['Activo', 'En revisión', 'Cerrado'] as const;
export type ProjectStatus = (typeof PROJECT_STATUS)[number];

export const EQUIPMENT_STATUS = [
  'Registrado',
  'En evaluación',
  'Pendiente',
  'Aprobado',
  'Rechazado',
] as const;
export type EquipmentStatus = (typeof EQUIPMENT_STATUS)[number];

export const QUOTATION_STATUS = ['Pendiente', 'En revisión', 'Aprobada', 'Rechazada'] as const;
export type QuotationStatus = (typeof QUOTATION_STATUS)[number];

export const APPROVAL_STATUS = ['En revisión', 'Aprobada', 'Rechazada'] as const;
export type ApprovalStatus = (typeof APPROVAL_STATUS)[number];

export const DOCUMENT_FOLDERS = [
  'Documentos',
  'Planos',
  'Fichas Técnicas',
  'Cotizaciones',
  'Presupuestos',
  'Solicitudes de Aprobación',
  'Fotografías',
  'Logo cliente',
  'Reportes',
] as const;
export type DocumentFolder = (typeof DOCUMENT_FOLDERS)[number];

export const FILE_CATEGORIES = ['imagen', 'ficha', 'plano', 'manual', 'cotizacion', 'otro'] as const;
export type FileCategory = (typeof FILE_CATEGORIES)[number];

export const PLANT_PROCESSES = [
  { code: 1, name: 'Entrada / Canal de aproximación' },
  { code: 2, name: 'Cribado fino' },
  { code: 3, name: 'Filtro percolador' },
  { code: 4, name: 'Bombeo de lodos' },
  { code: 5, name: 'Aireación' },
  { code: 6, name: 'Clarificación secundaria' },
  { code: 7, name: 'Otro' },
] as const;

export const CURRENCY = 'COP';
export const LOCALE = 'es';
export const TIMEZONE = 'America/Bogota';
