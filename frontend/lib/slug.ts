export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Reemplaza espacios con -
    .replace(/[^\w\-]+/g, '')       // Elimina caracteres especiales
    .replace(/\-\-+/g, '-')         // Evita guiones dobles
    .replace(/^-+/, '')             // Quita guión inicial
    .replace(/-+$/, '');            // Quita guión final
}

export function getJobSlug(job: {
  id: string | number;
  title: string;
  title_es?: string | null;
  company?: string | null;
  location?: string | null;
}): string {
  const titlePart = slugify(job.title_es || job.title || '');
  const locationPart = job.location ? slugify(job.location) : '';
  const companyPart = job.company && job.company !== 'Desconocida' ? slugify(job.company) : '';
  
  const slugParts = [titlePart, locationPart, companyPart].filter(Boolean).join('-');
  return `${slugParts}-${job.id}`;
}

export function getNumericId(idParam: string): string {
  // 1. Intentar emparejar UUID al final del slug (ej: nombre-empresa-6c11124d-1428-4ef3-9dbd-f6cd879097b0)
  const uuidMatch = idParam.match(/-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i);
  if (uuidMatch) return uuidMatch[1];
  
  // 2. Intentar emparejar ID numérico al final del slug (ej: nombre-empresa-123)
  const numericMatch = idParam.match(/-(\d+)$/);
  if (numericMatch) return numericMatch[1];
  
  return idParam;
}
