export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://portalempleoit.com';

export const CITIES = [
  'madrid', 'barcelona', 'valencia', 'sevilla', 'bilbao', 'malaga', 'zaragoza',
  'valladolid', 'alicante', 'vigo', 'coruna', 'pamplona', 'san-sebastian', 'murcia', 'santander', 'palma', 'las-palmas',
  'remoto'
];

// List of contract types (example values)
export const CONTRACTS = ['full-time', 'part-time', 'freelance', 'contract', 'internship'];

// List of seniority levels
export const LEVELS = ['junior', 'mid', 'senior'];

/** Helper to retrieve all cities */
export function getAllCities(): string[] {
  return CITIES;
}
/** Helper to retrieve all contracts */
export function getAllContracts(): string[] {
  return CONTRACTS;
}
/** Helper to retrieve all levels */
export function getAllLevels(): string[] {
  return LEVELS;
}
