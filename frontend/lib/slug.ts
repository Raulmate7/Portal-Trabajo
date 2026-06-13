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
  const match = idParam.match(/-(\d+)$/);
  return match ? match[1] : idParam;
}
