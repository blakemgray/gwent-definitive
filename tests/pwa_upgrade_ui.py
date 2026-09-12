import json
import mimetypes
import os
import re
import socket
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
QA = ROOT / 'qa' / 'pass11_pwa_upgrade'
QA.mkdir(parents=True, exist_ok=True)


class ReleaseState:
    phase = 'old'  # old | new-broken | new | offline


STATE = ReleaseState()


def release_name():
    return 'old' if STATE.phase == 'old' else 'new'


def versioned_sw():
    source = (ROOT / 'sw.js').read_text(encoding='utf-8')
    build = 'qa-old' if STATE.phase == 'old' else 'qa-new'
    source, count = re.subn(r"const BUILD='[^']+';", f"const BUILD='{build}';", source, count=1)
    if count != 1:
        raise AssertionError('service worker BUILD declaration not found exactly once')
    return source.encode('utf-8')


class Handler(BaseHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'

    def log_message(self, *_):
        pass

    def abort_connection(self):
        try:
            self.connection.shutdown(socket.SHUT_RDWR)
        except OSError:
            pass
        try:
            self.connection.close()
        except OSError:
            pass
        self.close_connection = True

    def send_bytes(self, body, content_type, status=200):
        self.send_response(status)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store, max-age=0')
        if self.path.split('?', 1)[0].endswith('/sw.js'):
            self.send_header('Service-Worker-Allowed', '/')
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        rel = self.path.split('?', 1)[0].lstrip('/')
        if rel == '':
            rel = 'index.html'

        # An offline relaunch must be served entirely by the already-installed
        # coherent core cache. Force every origin network request to reject.
        if STATE.phase == 'offline':
            self.abort_connection()
            return

        if rel == 'sw.js':
            self.send_bytes(versioned_sw(), 'application/javascript; charset=utf-8')
            return

        # The adversarial partial deployment: fresh app.js is reachable while
        # one updated core dependency fails at the transport layer. This makes
        # fetch() reject rather than merely returning an HTTP error response.
        if STATE.phase == 'new-broken' and rel == 'src/gwent-engine.js':
            self.abort_connection()
            return

        target = (ROOT / rel).resolve()
        try:
            target.relative_to(ROOT)
        except ValueError:
            self.send_error(404)
            return
        if not target.is_file():
            self.send_error(404)
            return

        body = target.read_bytes()
        if rel in ('app.js', 'src/gwent-engine.js'):
            marker = f'// QA_RELEASE:{release_name()}\n'.encode('utf-8')
            body = marker + body
        ctype = mimetypes.guess_type(str(target))[0] or 'application/octet-stream'
        if ctype.startswith('text/') or rel.endswith(('.js', '.css', '.webmanifest')):
            ctype += '; charset=utf-8'
        self.send_bytes(body, ctype)


def get_release(page, rel):
    return page.evaluate("""async rel=>{
      const response=await fetch(rel,{cache:'no-store'});
      if(!response.ok)throw new Error(`${rel} returned ${response.status}`);
      const text=await response.text();
      const match=text.match(/QA_RELEASE:(old|new)/);
      if(!match)throw new Error(`release marker missing for ${rel}`);
      return match[1];
    }""", rel)


def wait_for_controller(page):
    page.wait_for_function("navigator.serviceWorker && navigator.serviceWorker.controller", timeout=12000)


def update_registration(page):
    page.evaluate("""async()=>{
      const registration=await navigator.serviceWorker.getRegistration();
      if(!registration)throw new Error('service worker registration missing');
      await registration.update();
    }""")


def wait_for_waiting(page):
    page.wait_for_function("navigator.serviceWorker.getRegistration().then(r=>!!r?.waiting)", timeout=12000)


server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
thread = threading.Thread(target=server.serve_forever, daemon=True)
thread.start()
BASE = f'http://127.0.0.1:{server.server_address[1]}/'

matrix = {
    'oldInstalled': False,
    'partialUpdateKeptCoherent': False,
    'healthyUpdateActivated': False,
    'offlineRelaunchCoherent': False,
    'saveRetainedExactly': False,
}

try:
    with sync_playwright() as p:
        exe = os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE')
        kwargs = {'args': ['--no-sandbox']}
        if not exe and Path('/usr/bin/chromium').exists():
            exe = '/usr/bin/chromium'
        if exe:
            kwargs['executable_path'] = exe
        browser = p.chromium.launch(**kwargs)
        context = browser.new_context(service_workers='allow')
        page = context.new_page()

        # Install and control an OLD release using the repository's actual shell,
        # scripts, styles, and service-worker algorithm.
        STATE.phase = 'old'
        page.goto(BASE, wait_until='load')
        wait_for_controller(page)
        old_app = get_release(page, './app.js')
        old_engine = get_release(page, './src/gwent-engine.js')
        assert old_app == old_engine == 'old', (old_app, old_engine)
        matrix['oldInstalled'] = True

        # Retain a real schema-v2 match save across the worker upgrade. The app's
        # own Quick Start/finalize path writes it, so this is not a fabricated
        # storage envelope.
        page.evaluate("""()=>{
          const api=window.__GWENT_PASS11__;
          api.quickStart();api.finalizeMatchFromPrepared();
        }""")
        page.wait_for_timeout(80)
        save_key = page.evaluate('window.GwentStorage.SAVE_KEY')
        saved_raw = page.evaluate('key=>localStorage.getItem(key)', save_key)
        assert saved_raw and json.loads(saved_raw)['schema'] == 2

        # Publish NEW, but fail the engine transport while the new worker tries
        # to install. The incumbent old worker must serve ALL-OLD core content;
        # it may not network-refresh app.js while falling back to OLD engine.
        STATE.phase = 'new-broken'
        update_registration(page)
        page.wait_for_timeout(1400)
        controller_after_failed_install = page.evaluate('navigator.serviceWorker.controller.scriptURL')
        mixed_app = get_release(page, './app.js')
        mixed_engine = get_release(page, './src/gwent-engine.js')
        assert mixed_app == mixed_engine == 'old', (
            'F2 reproduced: installed worker mixed core releases under partial deployment',
            mixed_app,
            mixed_engine,
            controller_after_failed_install,
        )
        matrix['partialUpdateKeptCoherent'] = True

        # Make NEW healthy. A complete new worker may install, but activation must
        # wait for a safe lifecycle boundary rather than replacing a live match.
        STATE.phase = 'new'
        update_registration(page)
        wait_for_waiting(page)
        assert get_release(page, './app.js') == 'old'
        assert get_release(page, './src/gwent-engine.js') == 'old'

        # Leave the controlled client. With no live old client, the complete
        # waiting worker can activate naturally; the next launch must be all-new.
        page.goto('about:blank')
        time.sleep(1.0)
        page.goto(BASE, wait_until='load')
        wait_for_controller(page)
        new_app = get_release(page, './app.js')
        new_engine = get_release(page, './src/gwent-engine.js')
        assert new_app == new_engine == 'new', (new_app, new_engine)
        matrix['healthyUpdateActivated'] = True

        restored_raw = page.evaluate('key=>localStorage.getItem(key)', save_key)
        assert restored_raw == saved_raw
        matrix['saveRetainedExactly'] = True

        # Full origin outage: after the new complete shell is active, a relaunch
        # must still load a coherent NEW shell without touching the network.
        STATE.phase = 'offline'
        page.goto('about:blank')
        page.goto(BASE, wait_until='load', timeout=12000)
        wait_for_controller(page)
        offline_app = get_release(page, './app.js')
        offline_engine = get_release(page, './src/gwent-engine.js')
        assert offline_app == offline_engine == 'new', (offline_app, offline_engine)
        assert page.evaluate('key=>localStorage.getItem(key)', save_key) == saved_raw
        matrix['offlineRelaunchCoherent'] = True

        context.close()
        browser.close()
finally:
    server.shutdown()
    server.server_close()
    thread.join(timeout=2)
    (QA / 'pwa_upgrade_matrix.json').write_text(json.dumps(matrix, indent=2), encoding='utf-8')

print('pwa-upgrade-ui: old install stays all-old during partial release; complete update activates only after client boundary; next/offline launch is all-new with exact save retained')