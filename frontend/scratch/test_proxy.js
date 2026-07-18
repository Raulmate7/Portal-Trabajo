const proxyUrl = 'https://mail.portalempleoit.com/db_proxy.php';
const proxyToken = 'a6f021f1d19d675b8e998a44d187764d';

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
