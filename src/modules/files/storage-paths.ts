const PROJECT_FOLDERS: Record<string, string> = {
  Documentos: 'documentos-proyecto',
  Planos: 'planos',
  'Fichas Técnicas': 'fichas-tecnicas',
  Cotizaciones: 'cotizaciones',
  Presupuestos: 'presupuestos',
  'Solicitudes de Aprobación': 'solicitudes-aprobacion',
  Fotografías: 'fotografias',
  'Logo cliente': 'logo-cliente',
  Reportes: 'reportes',
};

const EQUIPMENT_FOLDERS: Record<string, string> = {
  imagen: 'imagenes',
  plano: 'planos',
  ficha: 'fichas-tecnicas',
  manual: 'manuales',
  cotizacion: 'cotizaciones',
  otro: 'otros',
};

function slug(value: string): string {
  return (
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'otros'
  );
}

export const PROJECT_FOLDER_SEGMENTS = [
  'documentos-proyecto',
  'planos',
  'fichas-tecnicas',
  'cotizaciones',
  'presupuestos',
  'solicitudes-aprobacion',
  'fotografias',
  'logo-cliente',
  'reportes',
] as const;

function shortId(id: string): string {
  return id.replace(/-/g, '').slice(0, 8);
}

export function projectStorageKey(projectId: string, projectName?: string): string {
  if (!projectName?.trim()) return projectId;
  return `${slug(projectName)}--${shortId(projectId)}`;
}

export function equipmentStorageKey(equipmentId: string, equipmentName?: string): string {
  if (!equipmentName?.trim()) return equipmentId;
  return `${slug(equipmentName)}--${shortId(equipmentId)}`;
}

export function projectDocumentStoragePath(
  projectId: string,
  folder: string,
  projectName?: string,
): string {
  const segment = PROJECT_FOLDERS[folder] ?? slug(folder);
  return `proyectos/${projectStorageKey(projectId, projectName)}/${segment}`;
}

export function equipmentFileStoragePath(
  projectId: string,
  equipmentId: string,
  category: string,
  projectName?: string,
  equipmentName?: string,
): string {
  const segment = EQUIPMENT_FOLDERS[category] ?? slug(category);
  return `proyectos/${projectStorageKey(projectId, projectName)}/equipos/${equipmentStorageKey(equipmentId, equipmentName)}/${segment}`;
}

export function systemStoragePath(area: string): string {
  return `sistema/${slug(area)}`;
}
