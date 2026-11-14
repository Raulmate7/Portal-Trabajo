"""
Tarea cron de retención y supresión de datos personales (Art. 5.1.e RGPD, LEG-019).
Ejecución mensual recomendada para anonimizar métricas históricas y purgar registros expirados.
"""

import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()


def run_retention_cleanup():
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("❌ DATABASE_URL no configurado.")
        return

    conn = psycopg2.connect(db_url)
    cur = conn.cursor()

    tasks = [
        (
            "Agregación diaria de email_tracking > 180 días en email_tracking_daily",
            """
            INSERT INTO email_tracking_daily (campaign, summary_date, opens_count, clicks_count)
            SELECT
                campaign,
                DATE(opened_at) AS summary_date,
                SUM(CASE WHEN clicked_url IS NULL THEN 1 ELSE 0 END) AS opens_count,
                SUM(CASE WHEN clicked_url IS NOT NULL THEN 1 ELSE 0 END) AS clicks_count
            FROM email_tracking
            WHERE opened_at < NOW() - INTERVAL '180 days'
            GROUP BY campaign, DATE(opened_at)
            ON DUPLICATE KEY UPDATE
                opens_count = opens_count + VALUES(opens_count),
                clicks_count = clicks_count + VALUES(clicks_count)
            """,
        ),
        (
            "Purga de eventos granulares de email_tracking > 180 días (FUNC-058)",
            "DELETE FROM email_tracking WHERE opened_at < NOW() - INTERVAL '180 days'",
        ),
        (
            "Purga de tokens de confirmación / baja expirados > 30 días",
            "UPDATE subscribers SET double_opt_in_token = NULL WHERE confirmed_at IS NULL AND created_at < NOW() - INTERVAL '30 days' AND double_opt_in_token IS NOT NULL",
        ),
        (
            "Purga de reportes de reseñas resueltos > 12 meses",
            "DELETE FROM review_reports WHERE status IN ('resolved', 'dismissed') AND created_at < NOW() - INTERVAL '365 days'",
        ),
    ]

    try:
        for label, sql in tasks:
            try:
                cur.execute(sql)
                conn.commit()
                print(f"✅ {label}: {cur.rowcount} filas procesadas.")
            except Exception as exc:
                conn.rollback()
                print(f"⚠️ {label}: omitido ({exc})")
    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    run_retention_cleanup()
