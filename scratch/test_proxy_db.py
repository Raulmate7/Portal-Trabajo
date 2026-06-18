import requests
import json

proxy_url = 'https://mail.portalempleoit.com/db_proxy.php'
proxy_token = 'a6f021f1d19d675b8e998a44d187764d'

def query_proxy(sql, params=[]):
    headers = {
        'Content-Type': 'application/json',
        'X-Proxy-Token': proxy_token,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    payload = {
        'sql': sql,
        'params': params
    }
    response = requests.post(proxy_url, json=payload, headers=headers)
    if response.status_code == 200:
        return response.json()
    else:
        return {'success': False, 'error': f"HTTP status {response.status_code}: {response.text}"}

if __name__ == "__main__":
    url = "https://www.getonbrd.com/api/v1/categories/programming/jobs"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    res = requests.get(url, headers=headers)
    print("Status code:", res.status_code)
    print("Content preview:")
    print(res.text[:1000])
