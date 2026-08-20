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

export function projectDocumentStoragePath(projectId: string, folder: string): string {
  const segment = PROJECT_FOLDERS[folder] ?? slug(folder);
  return `proyectos/${projectId}/${segment}`;
}

export function equipmentFileStoragePath(
  projectId: string,
  equipmentId: string,
  category: string,
): string {
  const segment = EQUIPMENT_FOLDERS[category] ?? slug(category);
  return `proyectos/${projectId}/equipos/${equipmentId}/${segment}`;
}

export function systemStoragePath(area: string): string {
  return `sistema/${slug(area)}`;
}
