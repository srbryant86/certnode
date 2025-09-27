import json
import os
import subprocess
import sys
import time
import urllib.request
import urllib.error

project_dir = r"C:\Dev\certnode\nextjs-pricing"
cmd = ['C:\\Program Files\\nodejs\\npx.cmd', 'next', 'dev', '--hostname', '127.0.0.1', '--port', '3201']
env = os.environ.copy()

def start_server():
    return subprocess.Popen(cmd, cwd=project_dir, env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)

proc = start_server()


def wait_for_ready(process, timeout=120):
    start = time.time()
    while time.time() - start < timeout:
        line = process.stdout.readline()
        if line:
            sys.stdout.write(line)
            sys.stdout.flush()
            lower = line.lower()
            if 'started server on' in lower or 'ready - local' in lower or 'url:' in lower:
                return True
        elif process.poll() is not None:
            raise RuntimeError('Dev server exited early with code {}'.format(process.poll()))
    return False


def post(payload):
    req = urllib.request.Request(
        'http://127.0.0.1:3201/api/checkout',
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            body = resp.read().decode('utf-8')
            return resp.status, body
    except urllib.error.HTTPError as exc:
        return exc.code, exc.read().decode('utf-8')
    except Exception as exc:
        return None, str(exc)

try:
    if not wait_for_ready(proc):
        raise RuntimeError('Dev server did not become ready within timeout')

    time.sleep(3)

    yearly_status, yearly_body = post({'tier': 'starter', 'billing': 'yearly', 'email': None})
    print('Yearly checkout response:', yearly_status, yearly_body)

    monthly_status, monthly_body = post({'tier': 'starter', 'billing': 'monthly', 'email': None})
    print('Monthly checkout response:', monthly_status, monthly_body)
finally:
    try:
        proc.terminate()
        proc.wait(timeout=10)
    except subprocess.TimeoutExpired:
        proc.kill()
        proc.wait(timeout=10)
