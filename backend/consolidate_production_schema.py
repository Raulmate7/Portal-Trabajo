#!/usr/bin/env python3
"""
Script unificado e idempotente de verificación y migración de esquema MySQL para producción.
Soporta ejecución directa (PyMySQL / DATABASE_URL) o a través de db_proxy.php (DB_PROXY_URL / DB_PROXY_TOKEN).
Garantiza que todas las tablas, columnas e índices requeridos por Next.js y los scrapers de Python estén presentes.
"""

import os
import sys
import json
import urllib.request
import urllib.error
from dotenv import load_dotenv

load_dotenv()

def get_executor():
    """Conecta directamente a MySQL; falla rápido si se intenta migrar DDL a través de db_proxy.php (SEC-013)."""
    if os.getenv("DB_PROXY_URL") and not os.getenv("MYSQL_HOST") and not os.getenv("DATABASE_URL"):
        print("❌ Error crítico (SEC-013): Las migraciones DDL (ALTER/CREATE INDEX) no pueden ejecutarse mediante db_proxy.php (bloqueado con 403).")
        print("   Ejecute este script con conexión directa a MySQL (MYSQL_HOST/MYSQL_USER/MYSQL_PASSWORD o DATABASE_URL).")
        sys.exit(1)

    if os.getenv("DB_PROXY_URL") and os.getenv("ALLOW_PROXY_MIGRATION") != "true":
        print("❌ Error crítico (SEC-013): Se detectó DB_PROXY_URL en el entorno. Las migraciones DDL requieren conexión directa a MySQL.")
        sys.exit(1)

    try:
        from db_helper import get_db_connection
        conn = get_db_connection()
        print("🔌 Conectando directamente a MySQL con credenciales de entorno...")

        def run_direct(sql, params=None):
            with conn.cursor() as cursor:
                parsed_sql = sql
                if params:
                    import re
                    parsed_sql = re.sub(r'\$\d+', '%s', sql)
                    cursor.execute(parsed_sql, params)
                else:
                    cursor.execute(parsed_sql)
                try:
                    return cursor.fetchall()
                except Exception:
                    return []

        return run_direct, conn
    except Exception as e:
        print(f"⚠️ No se pudo conectar directamente a MySQL ({e}).")
        print("Configure MYSQL_USER/MYSQL_DATABASE o DATABASE_URL directa en .env")
        sys.exit(1)

def run_migration():
    execute, conn = get_executor()
    try:
        _run_migration_steps(execute)
    finally:
        try:
            conn.close()
        except Exception:
            pass

def _run_migration_steps(execute):

    print("\n📦 [1/10] Verificando tabla 'sectors'...")
    execute("""
        CREATE TABLE IF NOT EXISTS sectors (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            slug VARCHAR(255) UNIQUE NOT NULL,
            keywords JSON NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """)

    print("\n📦 [2/10] Verificando tabla 'jobs'...")
    execute("""
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
    """)

    job_columns = [
        ('salary_min', 'DECIMAL(12, 2) NULL'),
        ('salary_max', 'DECIMAL(12, 2) NULL'),
        ('salary_currency', "VARCHAR(10) DEFAULT 'EUR'"),
        ('title_es', 'VARCHAR(500) NULL'),
        ('description_snippet_es', 'MEDIUMTEXT NULL'),
        ('company_email', 'VARCHAR(255) NULL'),
        ('is_featured', 'BOOLEAN DEFAULT FALSE'),
        ('plan', "VARCHAR(50) DEFAULT 'basico'"),
        ('featured_expires_at', 'TIMESTAMP NULL'),
        ('stripe_session_id', 'VARCHAR(255) NULL'),
        ('views_count', 'INT DEFAULT 0'),
        ('applications_count', 'INT DEFAULT 0'),
        ('impressions_count', 'INT DEFAULT 0'),
        ('clicks_count', 'INT DEFAULT 0'),
        ('last_tweeted_at', 'TIMESTAMP NULL'),
        ('last_linkedin_posted_at', 'TIMESTAMP NULL'),
        ('last_tooted_at', 'TIMESTAMP NULL'),
        ('last_bluesky_posted_at', 'TIMESTAMP NULL'),
        ('last_pinterest_posted_at', 'TIMESTAMP NULL'),
        ('last_threads_posted_at', 'TIMESTAMP NULL'),
        ('last_youtube_posted_at', 'TIMESTAMP NULL'),
        ('last_instant_alert_sent_at', 'TIMESTAMP NULL'),
        ('google_indexed_at', 'TIMESTAMP NULL'),
    ]
    for col, col_def in job_columns:
        try:
            cols = execute(f"SHOW COLUMNS FROM jobs LIKE '{col}'")
            if not cols:
                execute(f"ALTER TABLE jobs ADD COLUMN {col} {col_def}")
                print(f"  + Columna '{col}' añadida a jobs.")
        except Exception as err:
            print(f"  * Nota sobre jobs.{col}: {err}")

    print("\n📦 [3/10] Verificando tabla 'subscribers'...")
    execute("""
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
    """)

    sub_columns = [
        ('is_premium', 'BOOLEAN DEFAULT FALSE'),
        ('tech_keywords_json', 'JSON NULL'),
        ('stripe_customer_id', 'VARCHAR(255) NULL'),
        ('stripe_subscription_id', 'VARCHAR(255) NULL'),
        ('referrals_count', 'INT DEFAULT 0'),
        ('referrals_notified_count', 'INT DEFAULT 0'),
        ('last_sent_at', 'TIMESTAMP NULL'),
        ('onboarding_stage', 'INT DEFAULT 0'),
        ('onboarding_last_sent_at', 'TIMESTAMP NULL'),
        ('last_activity_at', 'TIMESTAMP NULL'),
        ('reactivation_stage', 'INT DEFAULT 0'),
        ('reactivation_last_sent_at', 'TIMESTAMP NULL'),
        ('source', 'VARCHAR(100) NULL'),
        ('is_active', 'BOOLEAN DEFAULT TRUE'),
        ('consent_timestamp', 'TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP'),
        ('consent_ip_hash', 'VARCHAR(64) NULL'),
        ('consent_policy_version', 'VARCHAR(50) DEFAULT "v2026.11"'),
        ('marketing_accepted', 'BOOLEAN DEFAULT FALSE'),
        ('consent_alerts_at', 'TIMESTAMP NULL'),
        ('consent_marketing_at', 'TIMESTAMP NULL'),
        ('confirmed_at', 'TIMESTAMP NULL'),
        ('unsubscribed_at', 'TIMESTAMP NULL'),
        ('status', 'VARCHAR(50) DEFAULT "active"'),
        ('is_premium', 'BOOLEAN DEFAULT FALSE'),
    ]
    for col, col_def in sub_columns:
        try:
            cols = execute(f"SHOW COLUMNS FROM subscribers LIKE '{col}'")
            if not cols:
                execute(f"ALTER TABLE subscribers ADD COLUMN {col} {col_def}")
                print(f"  + Columna '{col}' añadida a subscribers.")
        except Exception as err:
            print(f"  * Nota sobre subscribers.{col}: {err}")

    print("\n📦 [4/10] Verificando tabla 'sponsored_jobs'...")
    execute("""
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
    """)

    print("\n📦 [5/10] Verificando tabla 'premium_leads'...")
    execute("""
        CREATE TABLE IF NOT EXISTS premium_leads (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            stack VARCHAR(500) NOT NULL,
            experience VARCHAR(100) NOT NULL,
            linkedin VARCHAR(500) NULL,
            consent_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            consent_ip_hash VARCHAR(64) NULL,
            consent_policy_version VARCHAR(50) DEFAULT 'v2026.11',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """)

    lead_columns = [
        ('consent_timestamp', 'TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP'),
        ('consent_ip_hash', 'VARCHAR(64) NULL'),
        ('consent_policy_version', 'VARCHAR(50) DEFAULT "v2026.11"'),
    ]
    for col, col_def in lead_columns:
        try:
            cols = execute(f"SHOW COLUMNS FROM premium_leads LIKE '{col}'")
            if not cols:
                execute(f"ALTER TABLE premium_leads ADD COLUMN {col} {col_def}")
                print(f"  + Columna '{col}' añadida a premium_leads.")
        except Exception as err:
            print(f"  * Nota sobre premium_leads.{col}: {err}")

    print("\n📦 [6/10] Verificando tabla 'newsletter_sponsors'...")
    execute("""
        CREATE TABLE IF NOT EXISTS newsletter_sponsors (
            id INT AUTO_INCREMENT PRIMARY KEY,
            company_name VARCHAR(255) NOT NULL,
            company_email VARCHAR(255) NOT NULL,
            plan VARCHAR(50) DEFAULT 'newsletter_sponsorship',
            status VARCHAR(50) DEFAULT 'pendiente',
            stripe_session_id VARCHAR(255) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """)

    print("\n📦 [7/10] Verificando tabla 'recruiter_affiliates'...")
    execute("""
        CREATE TABLE IF NOT EXISTS recruiter_affiliates (
            id INT AUTO_INCREMENT PRIMARY KEY,
            recruiter_email VARCHAR(255) NOT NULL,
            affiliate_code VARCHAR(100) NOT NULL,
            referred_company_name VARCHAR(255) NULL,
            commission_paid BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_affiliate_code (affiliate_code)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """)

    print("\n📦 [8/10] Verificando tabla 'stripe_processed_events'...")
    execute("""
        CREATE TABLE IF NOT EXISTS stripe_processed_events (
            event_id VARCHAR(255) PRIMARY KEY,
            event_type VARCHAR(100) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """)

    print("\n📦 [9/10] Verificando tabla 'report_downloads'...")
    execute("""
        CREATE TABLE IF NOT EXISTS report_downloads (
            session_id VARCHAR(255) PRIMARY KEY,
            email VARCHAR(255) NOT NULL,
            plan VARCHAR(50) NOT NULL,
            download_count INT DEFAULT 1,
            max_downloads INT DEFAULT 5,
            last_downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """)

    print("\n📦 [10/11] Verificando tabla 'job_reactions'...")
    execute("""
        CREATE TABLE IF NOT EXISTS job_reactions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            job_id VARCHAR(255) NOT NULL,
            reaction_type VARCHAR(50) NOT NULL,
            client_ip_hash VARCHAR(64) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_reaction_job (job_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """)

    print("\n📦 [11/15] Verificando tabla 'blog_posts'...")
    execute("""
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
    """)

    print("\n📦 [12/15] Verificando tabla 'company_reviews'...")
    execute("""
        CREATE TABLE IF NOT EXISTS company_reviews (
            id INT AUTO_INCREMENT PRIMARY KEY,
            company_slug VARCHAR(255) NOT NULL,
            rating INT NOT NULL,
            review_text TEXT NOT NULL,
            role VARCHAR(255) DEFAULT 'Anónimo',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_company_slug (company_slug)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """)

    print("\n📦 [13/15] Verificando tabla 'email_tracking'...")
    execute("""
        CREATE TABLE IF NOT EXISTS email_tracking (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) NOT NULL,
            campaign VARCHAR(100) NOT NULL,
            clicked_url VARCHAR(1000) NULL,
            opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_tracking_email (email),
            INDEX idx_tracking_campaign (campaign)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """)

    print("\n📦 [14/17] Verificando tabla 'email_suppression_list'...")
    execute("""
        CREATE TABLE IF NOT EXISTS email_suppression_list (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email_hash VARCHAR(64) UNIQUE NOT NULL,
            reason VARCHAR(100) DEFAULT 'unsubscribe',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_suppression_hash (email_hash)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """)

    print("\n📦 [15/17] Verificando tabla 'consent_audit_log'...")
    execute("""
        CREATE TABLE IF NOT EXISTS consent_audit_log (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email_hash VARCHAR(64) NOT NULL,
            action VARCHAR(50) NOT NULL,
            policy_version VARCHAR(50) NULL,
            marketing_accepted BOOLEAN DEFAULT FALSE,
            ip_hash VARCHAR(64) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_consent_audit_hash (email_hash)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """)

    print("\n📦 [16/17] Verificando tabla 'saved_jobs_reminders'...")
    execute("""
        CREATE TABLE IF NOT EXISTS saved_jobs_reminders (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) NOT NULL,
            sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_saved_jobs_email (email)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """)

    print("\n📦 [15/15] Verificando tabla 'streak_reminders'...")
    execute("""
        CREATE TABLE IF NOT EXISTS streak_reminders (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) NOT NULL,
            sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            date_sent DATE NULL,
            INDEX idx_streak_reminders_email (email),
            UNIQUE KEY uq_streak_email_date (email, date_sent)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """)

    print("\n📦 [16/16] Verificando tabla 'review_reports' (SEC-028)...")
    execute("""
        CREATE TABLE IF NOT EXISTS review_reports (
            id INT AUTO_INCREMENT PRIMARY KEY,
            review_id INT NOT NULL,
            company_slug VARCHAR(100) NOT NULL,
            reason VARCHAR(100) NOT NULL,
            explanation TEXT NOT NULL,
            reporter_email VARCHAR(150) NOT NULL,
            status VARCHAR(30) DEFAULT 'pendiente_moderacion',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            KEY idx_review_id (review_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """)

    print("\n📦 [17/19] Verificando tabla maestra 'companies' (FUNC-049)...")
    execute("""
        CREATE TABLE IF NOT EXISTS companies (
            id INT AUTO_INCREMENT PRIMARY KEY,
            canonical_name VARCHAR(255) NOT NULL,
            slug VARCHAR(255) UNIQUE NOT NULL,
            domain VARCHAR(255) NULL,
            logo_url VARCHAR(500) NULL,
            verified BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_companies_domain (domain)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """)

    print("\n📦 [18/19] Verificando tabla 'email_tracking_daily' (FUNC-058)...")
    execute("""
        CREATE TABLE IF NOT EXISTS email_tracking_daily (
            campaign VARCHAR(100) NOT NULL,
            summary_date DATE NOT NULL,
            opens_count INT DEFAULT 0,
            clicks_count INT DEFAULT 0,
            PRIMARY KEY (campaign, summary_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """)

    print("\n📦 [19/19] Verificando tabla 'subscriber_skills' (FUNC-053)...")
    execute("""
        CREATE TABLE IF NOT EXISTS subscriber_skills (
            subscriber_email VARCHAR(255) NOT NULL,
            skill VARCHAR(100) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (subscriber_email, skill),
            INDEX idx_subscriber_skills_skill (skill)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """)

    def ensure_column(table_name: str, column_name: str, col_def: str):
        rows = execute(
            "SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = %s AND COLUMN_NAME = %s",
            (table_name, column_name),
        )
        if not rows or int(rows[0][0]) == 0:
            execute(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {col_def}")
            print(f"  + Columna '{table_name}.{column_name}' añadida.")

    print("\n📦 [20/21] Verificando tabla 'email_deliveries' (checkpoints SMTP, FUNC-046)...")
    execute("""
        CREATE TABLE IF NOT EXISTS email_deliveries (
            id INT AUTO_INCREMENT PRIMARY KEY,
            campaign_key VARCHAR(120) NOT NULL,
            subscriber_email VARCHAR(255) NOT NULL,
            status VARCHAR(30) DEFAULT 'sent',
            sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uq_delivery_campaign_email (campaign_key, subscriber_email),
            INDEX idx_delivery_campaign (campaign_key)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """)

    print("\n📦 [21/21] Verificando tabla 'subscriber_job_notifications' (dedup alertas, FUNC-055)...")
    execute("""
        CREATE TABLE IF NOT EXISTS subscriber_job_notifications (
            subscriber_email VARCHAR(255) NOT NULL,
            job_id VARCHAR(255) NOT NULL,
            channel VARCHAR(40) DEFAULT 'email',
            sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (subscriber_email, job_id, channel)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """)

    ensure_column("jobs", "dedup_hash", "VARCHAR(64) NULL")
    ensure_column("jobs", "company_id", "INT NULL")
    ensure_column("jobs", "work_mode", "ENUM('remote', 'hybrid', 'onsite') NULL")
    ensure_column("company_reviews", "company_id", "INT NULL")

    print("\n⚡ Optimizando índices de rendimiento (idempotente vía INFORMATION_SCHEMA, FUNC-036/037)...")
    indexes = [
        ("jobs", "idx_jobs_category", "CREATE INDEX idx_jobs_category ON jobs (category)"),
        ("jobs", "idx_jobs_is_featured", "CREATE INDEX idx_jobs_is_featured ON jobs (is_featured)"),
        ("jobs", "idx_jobs_is_active", "CREATE INDEX idx_jobs_is_active ON jobs (is_active)"),
        ("jobs", "idx_jobs_created_at", "CREATE INDEX idx_jobs_created_at ON jobs (created_at DESC)"),
        ("jobs", "idx_jobs_active_created", "CREATE INDEX idx_jobs_active_created ON jobs (is_active, created_at DESC)"),
        ("jobs", "idx_jobs_active_cat_created", "CREATE INDEX idx_jobs_active_cat_created ON jobs (is_active, category, created_at DESC)"),
        ("jobs", "idx_jobs_active_feat_created", "CREATE INDEX idx_jobs_active_feat_created ON jobs (is_active, is_featured, created_at DESC)"),
        ("jobs", "idx_jobs_active_work_mode", "CREATE INDEX idx_jobs_active_work_mode ON jobs (is_active, work_mode, created_at DESC)"),
        ("jobs", "idx_jobs_company_id", "CREATE INDEX idx_jobs_company_id ON jobs (company_id)"),
        ("jobs", "ft_jobs_search", "CREATE FULLTEXT INDEX ft_jobs_search ON jobs (title, company, description_snippet)"),
    ]
    for table_name, idx_name, idx_sql in indexes:
        try:
            exists = execute(
                "SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = %s AND INDEX_NAME = %s",
                (table_name, idx_name),
            )
            if not exists or int(exists[0][0]) == 0:
                execute(idx_sql)
                print(f"  + Índice '{idx_name}' creado.")
            else:
                print(f"  = Índice '{idx_name}' ya existe.")
        except Exception as e:
            print(f"  ⚠️ No se pudo crear índice '{idx_name}': {e}")

    print("\n✅ Todas las tablas, columnas e índices están sincronizados y preparados para producción.")

if __name__ == "__main__":
    run_migration()
