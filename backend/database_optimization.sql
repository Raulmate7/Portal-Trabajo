-- Habilitar la extensión de trigramas si no existe para búsquedas rápidas con ILIKE
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Índices GIN de trigrama para consultas rápidas por título y ubicación (búsqueda y SEO)
CREATE INDEX IF NOT EXISTS jobs_title_trgm_idx ON jobs USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS jobs_location_trgm_idx ON jobs USING gin (location gin_trgm_ops);

-- Índices B-Tree estándar para filtros comunes
CREATE INDEX IF NOT EXISTS jobs_category_idx ON jobs (category);
CREATE INDEX IF NOT EXISTS jobs_is_featured_idx ON jobs (is_featured);

-- Índice B-Tree para ordenamiento (todas las consultas ordenan por fecha descendente)
CREATE INDEX IF NOT EXISTS jobs_created_at_idx ON jobs (created_at DESC);
