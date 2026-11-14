/**
 * Configuración legal centralizada del titular del portal (LSSI-CE Art. 10, RGPD Art. 13, TRLGDCU Art. 97).
 * Fuente única de verdad compartida por Aviso Legal, Términos, Política de Privacidad y respuestas legales.
 */
export const LEGAL_CONFIG = {
  brandName: 'Portal Trabajo IT',
  domain: 'portalempleoit.com',
  owner: process.env.NEXT_PUBLIC_LEGAL_OWNER || 'Raúl Mateo (Portal Trabajo IT)',
  nif: process.env.NEXT_PUBLIC_LEGAL_NIF || 'Pendiente de publicación en entorno (solicitar identificador fiscal directo en contacto@portalempleoit.com)',
  address: process.env.NEXT_PUBLIC_LEGAL_ADDRESS || 'Madrid, España (domicilio de notificaciones: contacto@portalempleoit.com)',
  email: process.env.NEXT_PUBLIC_LEGAL_EMAIL || 'contacto@portalempleoit.com',
  registry: process.env.NEXT_PUBLIC_LEGAL_REGISTRY || 'Actividad profesional / servicio digital en España (no sujeta a inscripción obligatoria en Registro Mercantil salvo constitución societaria)',
} as const;
