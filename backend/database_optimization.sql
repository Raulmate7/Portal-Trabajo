-- ==============================================================================
-- DEFINITIVE PRODUCTION SCHEMA & DATABASE OPTIMIZATIONS (MySQL / MariaDB)
-- Portal Trabajo IT - Raiola Networks & Vercel
-- ==============================================================================

-- 0. TABLA: sectors (Categorías y sectores tecnológicos)
CREATE TABLE IF NOT EXISTS sectors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    keywords JSON NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1. TABLA PRINCIPAL: jobs
CREATE TABLE IF NOT EXISTS jobs (
    id VARCHAR(255) PRIMARY KEY,
    sector_id INT NULL,
    title VARCHAR(500) NOT NULL,
    title_es VARCHAR(500) NULL,
    company VARCHAR(255) NOT NULL,
    company_email VARCHAR(255) NULL,
    location VARCHAR(255) DEFAULT 'Remoto',
    salary VARCHAR(100) DEFAULT 'Consultar',
    salary_min DECIMAL(12, 2) NULL,
    salary_max DECIMAL(12, 2) NULL,
    salary_currency VARCHAR(10) DEFAULT 'EUR',
    description_snippet MEDIUMTEXT NULL,
    description_snippet_es MEDIUMTEXT NULL,
    url_source VARCHAR(1000) NOT NULL,
    category VARCHAR(100) DEFAULT 'Otros',
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    plan VARCHAR(50) DEFAULT 'basico',
    featured_expires_at TIMESTAMP NULL,
    stripe_session_id VARCHAR(255) NULL,
    views_count INT DEFAULT 0,
    applications_count INT DEFAULT 0,
    impressions_count INT DEFAULT 0,
    clicks_count INT DEFAULT 0,
    last_tweeted_at TIMESTAMP NULL,
    last_linkedin_posted_at TIMESTAMP NULL,
    last_tooted_at TIMESTAMP NULL,
    last_bluesky_posted_at TIMESTAMP NULL,
    last_pinterest_posted_at TIMESTAMP NULL,
    last_threads_posted_at TIMESTAMP NULL,
    last_youtube_posted_at TIMESTAMP NULL,
    last_instant_alert_sent_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_jobs_sector_id (sector_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. TABLA: subscribers (Boletín de alertas y candidatos premium)
CREATE TABLE IF NOT EXISTS subscribers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    tech_keywords VARCHAR(500) DEFAULT 'todas',
    tech_keywords_json JSON NULL,
    location_pref VARCHAR(255) DEFAULT 'todas',
    frequency VARCHAR(50) DEFAULT 'daily',
    referred_by VARCHAR(255) NULL,
    referrals_count INT DEFAULT 0,
    referrals_notified_count INT DEFAULT 0,
    is_premium BOOLEAN DEFAULT FALSE,
    stripe_customer_id VARCHAR(255) NULL,
    stripe_subscription_id VARCHAR(255) NULL,
    last_sent_at TIMESTAMP NULL,
    onboarding_stage INT DEFAULT 0,
    onboarding_last_sent_at TIMESTAMP NULL,
    last_activity_at TIMESTAMP NULL,
    reactivation_stage INT DEFAULT 0,
    reactivation_last_sent_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. TABLA: sponsored_jobs (Publicación de ofertas patrocinadas y moderación)
CREATE TABLE IF NOT EXISTS sponsored_jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    company_email VARCHAR(255) NOT NULL,
    company_phone VARCHAR(100) NULL,
    job_title VARCHAR(500) NOT NULL,
    job_location VARCHAR(255) NULL,
    job_salary VARCHAR(100) NULL,
    job_description MEDIUMTEXT NULL,
    job_url VARCHAR(1000) NULL,
    plan VARCHAR(50) DEFAULT 'basico',
    status VARCHAR(50) DEFAULT 'pendiente',
    stripe_session_id VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. TABLA: premium_leads (Captura de talento senior/tech leads)
CREATE TABLE IF NOT EXISTS premium_leads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    stack VARCHAR(500) NOT NULL,
    experience VARCHAR(100) NOT NULL,
    linkedin VARCHAR(500) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. TABLA: newsletter_sponsors (Patrocinadores corporativos del boletín)
CREATE TABLE IF NOT EXISTS newsletter_sponsors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    company_email VARCHAR(255) NOT NULL,
    plan VARCHAR(50) DEFAULT 'newsletter_sponsorship',
    status VARCHAR(50) DEFAULT 'pendiente',
    stripe_session_id VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. TABLA: recruiter_affiliates (Programa de afiliados B2B)
CREATE TABLE IF NOT EXISTS recruiter_affiliates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recruiter_email VARCHAR(255) NOT NULL,
    affiliate_code VARCHAR(100) NOT NULL,
    referred_company_name VARCHAR(255) NULL,
    commission_paid BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_affiliate_code (affiliate_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. TABLA: stripe_processed_events (Idempotencia estricta para webhooks de Stripe)
CREATE TABLE IF NOT EXISTS stripe_processed_events (
    event_id VARCHAR(255) PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. TABLA: report_downloads (Auditoría y control de descargas del informe de mercado)
CREATE TABLE IF NOT EXISTS report_downloads (
    session_id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    plan VARCHAR(50) NOT NULL,
    download_count INT DEFAULT 1,
    max_downloads INT DEFAULT 5,
    last_downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. TABLA: job_reactions (Reacciones y engagement en ofertas)
CREATE TABLE IF NOT EXISTS job_reactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_id VARCHAR(255) NOT NULL,
    reaction_type VARCHAR(50) NOT NULL,
    client_ip_hash VARCHAR(64) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_reaction_job (job_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. TABLA: blog_posts (Artículos editoriales, tendencias y noticias IT)
CREATE TABLE IF NOT EXISTS blog_posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(500) NOT NULL,
    excerpt TEXT NULL,
    content MEDIUMTEXT NULL,
    date DATE NULL,
    author VARCHAR(100) DEFAULT 'Equipo Editorial',
    is_evergreen BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_blog_date (date DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. TABLA: company_reviews (Reseñas verificadas de empresas)
CREATE TABLE IF NOT EXISTS company_reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_slug VARCHAR(255) NOT NULL,
    rating INT NOT NULL,
    review_text TEXT NOT NULL,
    role VARCHAR(255) DEFAULT 'Anónimo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_company_slug (company_slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. TABLA: email_tracking (Analítica de aperturas y clics de campañas)
CREATE TABLE IF NOT EXISTS email_tracking (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    campaign VARCHAR(100) NOT NULL,
    clicked_url VARCHAR(1000) NULL,
    opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_tracking_email (email),
    INDEX idx_tracking_campaign (campaign)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. TABLA: saved_jobs_reminders (Registro de recordatorios de ofertas guardadas)
CREATE TABLE IF NOT EXISTS saved_jobs_reminders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_saved_jobs_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. TABLA: streak_reminders (Registro de recordatorios de rachas de visita)
CREATE TABLE IF NOT EXISTS streak_reminders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_sent DATE NULL,
    INDEX idx_streak_reminders_email (email),
    UNIQUE KEY uq_streak_email_date (email, date_sent)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- MIGRACIONES DEFENSIVAS DE COLUMNAS (Para bases de datos existentes)
-- ==============================================================================

-- jobs
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'jobs' AND COLUMN_NAME = 'salary_min');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE jobs ADD COLUMN salary_min DECIMAL(12, 2) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'jobs' AND COLUMN_NAME = 'salary_max');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE jobs ADD COLUMN salary_max DECIMAL(12, 2) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'jobs' AND COLUMN_NAME = 'salary_currency');
SET @sql = IF(@col_exists = 0, "ALTER TABLE jobs ADD COLUMN salary_currency VARCHAR(10) DEFAULT 'EUR'", 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'jobs' AND COLUMN_NAME = 'title_es');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE jobs ADD COLUMN title_es VARCHAR(500) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'jobs' AND COLUMN_NAME = 'description_snippet_es');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE jobs ADD COLUMN description_snippet_es MEDIUMTEXT NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'jobs' AND COLUMN_NAME = 'company_email');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE jobs ADD COLUMN company_email VARCHAR(255) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'jobs' AND COLUMN_NAME = 'is_featured');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE jobs ADD COLUMN is_featured BOOLEAN DEFAULT FALSE', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'jobs' AND COLUMN_NAME = 'plan');
SET @sql = IF(@col_exists = 0, "ALTER TABLE jobs ADD COLUMN plan VARCHAR(50) DEFAULT 'basico'", 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'jobs' AND COLUMN_NAME = 'featured_expires_at');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE jobs ADD COLUMN featured_expires_at TIMESTAMP NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'jobs' AND COLUMN_NAME = 'stripe_session_id');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE jobs ADD COLUMN stripe_session_id VARCHAR(255) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'jobs' AND COLUMN_NAME = 'impressions_count');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE jobs ADD COLUMN impressions_count INT DEFAULT 0', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'jobs' AND COLUMN_NAME = 'clicks_count');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE jobs ADD COLUMN clicks_count INT DEFAULT 0', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'jobs' AND COLUMN_NAME = 'google_indexed_at');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE jobs ADD COLUMN google_indexed_at TIMESTAMP NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- subscribers
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'subscribers' AND COLUMN_NAME = 'is_premium');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE subscribers ADD COLUMN is_premium BOOLEAN DEFAULT FALSE', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'subscribers' AND COLUMN_NAME = 'source');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE subscribers ADD COLUMN source VARCHAR(100) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'subscribers' AND COLUMN_NAME = 'is_active');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE subscribers ADD COLUMN is_active BOOLEAN DEFAULT TRUE', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'subscribers' AND COLUMN_NAME = 'tech_keywords_json');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE subscribers ADD COLUMN tech_keywords_json JSON NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'subscribers' AND COLUMN_NAME = 'stripe_customer_id');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE subscribers ADD COLUMN stripe_customer_id VARCHAR(255) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'subscribers' AND COLUMN_NAME = 'stripe_subscription_id');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE subscribers ADD COLUMN stripe_subscription_id VARCHAR(255) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'subscribers' AND COLUMN_NAME = 'referrals_count');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE subscribers ADD COLUMN referrals_count INT DEFAULT 0', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'subscribers' AND COLUMN_NAME = 'referrals_notified_count');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE subscribers ADD COLUMN referrals_notified_count INT DEFAULT 0', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ==============================================================================
-- ÍNDICES DE RENDIMIENTO Y BÚSQUEDA
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_jobs_category ON jobs (category);
CREATE INDEX IF NOT EXISTS idx_jobs_is_featured ON jobs (is_featured);
CREATE INDEX IF NOT EXISTS idx_jobs_is_active ON jobs (is_active);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_salary_range ON jobs (salary_min, salary_max);
