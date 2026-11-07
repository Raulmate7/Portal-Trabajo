const proxyUrl = process.env.DB_PROXY_URL || 'https://mail.portalempleoit.com/db_proxy.php';
const proxyToken = process.env.DB_PROXY_TOKEN || '';

async function run() {
  try {
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Proxy-Token': proxyToken,
      },
      body: JSON.stringify({
        sql: 'SHOW COLUMNS FROM subscribers',
        params: []
      })
    });

    const resJson = await response.json();
    console.log('Result from proxy:', resJson);
  } catch (err) {
    console.error('Error connecting to proxy:', err);
  }
}

run();
