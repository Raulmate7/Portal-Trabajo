import json
import urllib.request
import urllib.error

def execute_proxy_query(sql, params=[]):
    proxy_url = "https://mail.portalempleoit.com/db_proxy.php"
    proxy_token = "a6f021f1d19d675b8e998a44d187764d"
    
    headers = {
        "Content-Type": "application/json",
        "X-Proxy-Token": proxy_token,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    body = {
        "sql": sql,
        "params": params
    }
    
    req = urllib.request.Request(
        proxy_url, 
        data=json.dumps(body).encode('utf-8'), 
        headers=headers, 
        method='POST'
    )
    
    try:
        with urllib.request.urlopen(req) as res:
            res_body = res.read().decode('utf-8')
            res_data = json.loads(res_body)
            if not res_data.get("success"):
                raise Exception(res_data.get("error", "Unknown proxy error"))
            return res_data.get("rows", [])
    except urllib.error.HTTPError as e:
        print(f"HTTP Error: {e.code} - {e.read().decode('utf-8')}")
        raise e

def migrate_b2b_monetization():
    try:
        print("🔨 Conectando al Proxy DB para migración...")
        
        # 1. Crear tabla newsletter_sponsors
        print("🔨 Creando tabla 'newsletter_sponsors' en MySQL...")
        execute_proxy_query("""
            CREATE TABLE IF NOT EXISTS newsletter_sponsors (
                id INT AUTO_INCREMENT PRIMARY KEY,
                company_name VARCHAR(255) NOT NULL,
                company_email VARCHAR(255) NOT NULL,
                plan VARCHAR(50) DEFAULT 'newsletter_sponsorship',
                status VARCHAR(50) DEFAULT 'pendiente',
                stripe_session_id VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """)

        # 2. Agregar columna is_premium a la tabla subscribers
        print("🛠️ Agregando columna 'is_premium' a la tabla 'subscribers' si no existe...")
        columns = execute_proxy_query("SHOW COLUMNS FROM subscribers LIKE 'is_premium'")
        if not columns:
            execute_proxy_query("""
                ALTER TABLE subscribers 
                ADD COLUMN is_premium BOOLEAN DEFAULT FALSE;
            """)
            print("✅ Columna 'is_premium' agregada con éxito.")
        else:
            print("ℹ️ La columna 'is_premium' ya existe en 'subscribers'.")
            
        # 3. Crear tabla recruiter_affiliates (G4)
        print("🔨 Creando tabla 'recruiter_affiliates' en MySQL...")
        execute_proxy_query("""
            CREATE TABLE IF NOT EXISTS recruiter_affiliates (
                id INT AUTO_INCREMENT PRIMARY KEY,
                recruiter_email VARCHAR(255) NOT NULL,
                affiliate_code VARCHAR(100) UNIQUE NOT NULL,
                referred_company_name VARCHAR(255),
                commission_paid BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """)
        
        print("🎉 Migración de monetización B2B/B2C completada con éxito.")

    except Exception as e:
        print(f"❌ Error durante la migración: {e}")

if __name__ == "__main__":
    migrate_b2b_monetization()
