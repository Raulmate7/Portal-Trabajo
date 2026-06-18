const proxyUrl = 'https://mail.portalempleoit.com/db_proxy.php';
const proxyToken = 'a6f021f1d19d675b8e998a44d187764d';

console.log('Sending query to proxy:', proxyUrl);

const sql = `
CREATE TABLE IF NOT EXISTS company_reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_slug VARCHAR(255) NOT NULL,
    rating INT NOT NULL,
    review_text TEXT NOT NULL,
    role VARCHAR(255) DEFAULT 'Anónimo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY idx_company_slug (company_slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

async function run() {
  try {
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Proxy-Token': proxyToken,
      },
      body: JSON.stringify({ sql, params: [] }),
    });

    const resJson = await response.json();
    console.log('Response JSON:', resJson);
  } catch (error) {
    console.error('Error executing query via proxy:', error);
  }
}

run();
