import socket, json, base64, time, os, subprocess, shutil, sys
from http.server import HTTPServer, SimpleHTTPRequestHandler

screenshot_dir = '/home/djokov1c/.gemini/antigravity/brain/5d05e88d-e046-49e5-a88b-40aea2947076/screenshots'
os.makedirs(screenshot_dir, exist_ok=True)
os.makedirs('/tmp/screenshots', exist_ok=True)

# Clean profile
shutil.rmtree('/tmp/ffprofile', ignore_errors=True)
os.makedirs('/tmp/ffprofile', exist_ok=True)

# Custom HTTP handler with no-cache headers
class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

server = HTTPServer(('127.0.0.1', 8765), NoCacheHandler)
import threading
server_thread = threading.Thread(target=server.serve_forever, daemon=True)
server_thread.start()

firefox_proc = subprocess.Popen([
    'firefox', '--headless', '--marionette',
    '--profile', '/tmp/ffprofile',
    '--no-remote'
], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

time.sleep(3)

try:
    s = socket.create_connection(('127.0.0.1', 2828))
    counter = 0

    def recv():
        n = b''
        while (c := s.recv(1)) != b':':
            n += c
        size = int(n)
        data = b''
        while len(data) < size:
            data += s.recv(size - len(data))
        return json.loads(data)

    recv()

    def call(name, args={}):
        global counter
        counter += 1
        d = json.dumps([0, counter, name, args]).encode()
        s.sendall(str(len(d)).encode() + b':' + d)
        r = recv()
        if r[2]:
            raise RuntimeError(r)
        return r[3]

    def js(script):
        source = 'try { window.__checkResult=(()=>{' + script + '})() } catch(e) {window.__checkResult={error:e.stack}}'
        wrapper = "const el=document.createElement('script');el.textContent=" + json.dumps(source) + ";document.head.append(el);el.remove();return window.__checkResult;"
        res = call('WebDriver:ExecuteScript', {'script': wrapper, 'args': [], 'sandbox': None})
        if isinstance(res.get('value'), dict) and 'error' in res['value']:
            raise RuntimeError(res['value']['error'])
        return res.get('value')

    call('WebDriver:NewSession', {'capabilities': {'alwaysMatch': {'acceptInsecureCerts': True}}})
    call('WebDriver:Navigate', {'url': 'http://127.0.0.1:8765'})
    time.sleep(1)

    # Populate state
    js("""
        isCloudEnabled = false;
        supabaseClient = null;
        state.students = [
            { id: 'st1', name: 'Nguyễn Văn An', grade: 'Lớp 8A', pin: '1234', color: '#FFFFFF' },
            { id: 'st2', name: 'Trần Thị Bình', grade: 'Lớp 9B', pin: '5678', color: '#FFFFFF' },
            { id: 'st3', name: 'Lê Hoàng Cúc', grade: 'Lớp 7C', pin: '0000', color: '#FFFFFF' }
        ];
        state.tasks = [
            { id: 't1', title: 'Ôn tập Grammar Unit 5', studentId: 'st1', dueDate: '2026-11-15', status: 'pending', isRecurring: false },
            { id: 't2', title: 'Bài tập từ vựng hằng ngày', studentId: 'st1', dueDate: '2026-11-09', status: 'submitted', isRecurring: true, submissions: [{ data: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23FFFFFF" stroke="%231B1B1B" width="100" height="100"/><text y="50" x="10" fill="%231B1B1B">Bài tập</text></svg>', date: '2026-11-09T08:00:00Z' }] },
            { id: 't3', title: 'Giải bài tập Toán hình chương 2', studentId: 'st2', dueDate: '2026-11-10', status: 'approved', isRecurring: false },
            { id: 't4', title: 'Viết bài luận tiếng Anh 200 từ', studentId: 'st3', dueDate: '2026-11-07', status: 'pending', isRecurring: false }
        ];
        state.currentUser = { role: 'teacher' };
        feeState = FeeLedger.empty();
        FeeLedger.add(feeState, state.students, { student_id: 'st1', amount: 500000, reason: 'Học phí tháng 11', type: 'opening' });
        FeeLedger.add(feeState, state.students, { student_id: 'st1', amount: -2500, reason: 'Thưởng nộp bài đúng hạn', type: 'reward' });
        FeeLedger.add(feeState, state.students, { student_id: 'st2', amount: 800000, reason: 'Học phí tháng 11', type: 'opening' });
        closeModal('modal-login');
        navigateTo('dashboard');
    """)

    views = ['dashboard', 'students', 'tasks', 'streaks', 'tuition', 'settings']
    resolutions = [(1366, 768), (1440, 900)]

    results = []

    for width, height in resolutions:
        call('WebDriver:SetWindowRect', {'width': width, 'height': height})
        time.sleep(0.5)

        for view in views:
            js(f"navigateTo('{view}');")
            time.sleep(0.3)

            info = js("""
                const viewEl = document.querySelector('.view.active');
                const mainEl = document.getElementById('main');
                const winH = window.innerHeight;
                const docScroll = document.documentElement.scrollHeight;
                const mainScroll = mainEl ? mainEl.scrollHeight : 0;
                const mainClient = mainEl ? mainEl.clientHeight : 0;
                
                const bodyBg = getComputedStyle(document.body).backgroundColor;
                const viewBg = getComputedStyle(viewEl).backgroundColor;

                // Elements with font-size < 12px with actual text
                const all = [...document.querySelectorAll('*')];
                const tiny = all.filter(el => {
                    const fs = parseFloat(getComputedStyle(el).fontSize);
                    return fs > 0 && fs < 12 && el.childNodes.length && [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
                }).map(el => ({ tag: el.tagName, cls: el.className, fs: getComputedStyle(el).fontSize, txt: el.innerText.slice(0, 20) }));

                return {
                    docScroll,
                    winH,
                    mainScroll,
                    mainClient,
                    bodyBg,
                    viewBg,
                    tinyCount: tiny.length,
                    tinySample: tiny.slice(0, 3)
                };
            """)

            # Outer page scroll check: docScroll <= winH
            page_scrolls = info['docScroll'] > info['winH'] + 2
            
            # Record
            record = {
                'res': f"{width}x{height}",
                'view': view,
                'page_scrolls': page_scrolls,
                'body_bg': info['bodyBg'],
                'view_bg': info['viewBg'],
                'tiny_count': info['tinyCount'],
                'tiny_sample': info['tinySample']
            }
            results.append(record)
            print(f"[{width}x{height}] {view}: PageScrolls={page_scrolls} (docScroll={info['docScroll']}, winH={info['winH']}), bodyBg={info['bodyBg']}, tinyCount={info['tinyCount']}")

            shot = call('WebDriver:TakeScreenshot', {'full': False})
            data = base64.b64decode(shot['value'])
            for p in [f"{screenshot_dir}/{view}-{width}x{height}.png", f"/tmp/screenshots/{view}-{width}x{height}.png"]:
                with open(p, 'wb') as f:
                    f.write(data)

        # Login Modal at this desktop resolution
        js("openLoginDialog();")
        time.sleep(0.3)
        login_info = js("""
            const modal = document.querySelector('#modal-login .modal');
            return {
                bg: getComputedStyle(modal).backgroundColor,
                border: getComputedStyle(modal).border
            };
        """)
        print(f"[{width}x{height}] login modal: bg={login_info['bg']}, border={login_info['border']}")
        shot = call('WebDriver:TakeScreenshot', {'full': False})
        data = base64.b64decode(shot['value'])
        for p in [f"{screenshot_dir}/login-{width}x{height}.png", f"/tmp/screenshots/login-{width}x{height}.png"]:
            with open(p, 'wb') as f:
                f.write(data)
        js("closeModal('modal-login');")

    # Mobile Verification at 390px
    js("""
        const frame = document.createElement('iframe');
        frame.id = 'mobile-verify-frame';
        frame.src = 'http://127.0.0.1:8765';
        frame.style = 'position:fixed;inset:0;width:390px;height:844px;border:none;z-index:99999;background:#F8F6F0;';
        document.body.append(frame);
    """)
    time.sleep(2)
    call('WebDriver:SwitchToFrame', {'id': 0})
    
    js("""
        isCloudEnabled = false;
        supabaseClient = null;
        state.students = [
            { id: 'st1', name: 'Nguyễn Văn An', grade: 'Lớp 8A', pin: '1234', color: '#FFFFFF' },
            { id: 'st2', name: 'Trần Thị Bình', grade: 'Lớp 9B', pin: '5678', color: '#FFFFFF' }
        ];
        state.tasks = [
            { id: 't1', title: 'Ôn tập Grammar Unit 5', studentId: 'st1', dueDate: '2026-11-15', status: 'pending', isRecurring: false }
        ];
        state.currentUser = { role: 'teacher' };
        closeModal('modal-login');
    """)

    for view in views:
        js(f"navigateTo('{view}');")
        time.sleep(0.3)
        call('WebDriver:SwitchToFrame', {'id': None})
        shot = call('WebDriver:TakeScreenshot', {'full': False})
        data = base64.b64decode(shot['value'])
        for p in [f"{screenshot_dir}/{view}-mobile-390.png", f"/tmp/screenshots/{view}-mobile-390.png"]:
            with open(p, 'wb') as f:
                f.write(data)
        call('WebDriver:SwitchToFrame', {'id': 0})

    js("openLoginDialog();")
    time.sleep(0.3)
    call('WebDriver:SwitchToFrame', {'id': None})
    shot = call('WebDriver:TakeScreenshot', {'full': False})
    data = base64.b64decode(shot['value'])
    for p in [f"{screenshot_dir}/login-mobile-390.png", f"/tmp/screenshots/login-mobile-390.png"]:
        with open(p, 'wb') as f:
            f.write(data)

    # Tuition multi-student fee interaction tests
    js("feeState=FeeLedger.empty();navigateTo('tuition');selectedFeeStudentId='st1';adjustFee(100000,'An charge');selectedFeeStudentId='st2';adjustFee(200000,'Binh charge');renderFeeWidget();")
    fee_b = js("return {balance:feeTotals().balance,logs:document.getElementById('fee-log-body').innerText};")
    assert fee_b['balance']==200000 and 'An charge' not in fee_b['logs'], fee_b
    print('Tuition student B verified:', fee_b)

    js("selectedFeeStudentId='st1';renderFeeWidget();")
    fee_a = js("return {balance:feeTotals().balance,logs:document.getElementById('fee-log-body').innerText};")
    assert fee_a['balance']==100000 and 'Binh charge' not in fee_a['logs'], fee_a
    print('Tuition student A verified:', fee_a)

    js("document.getElementById('fee-student-select').value='st2';document.getElementById('fee-student-select').dispatchEvent(new Event('change'));document.getElementById('fee-manual-input').value='50000';document.getElementById('btn-fee-pay').click();")
    assert js('return feeTotals().balance;')==150000
    print('Tuition payment verified balance=150000')

    js("state.currentUser={role:'student',studentId:'st1'};renderFeeWidget();")
    assert js("return !document.getElementById('btn-fee-pay') && feeTotals().balance===100000;")
    print('Student role tuition view verified (read-only, correct balance)')

    call('WebDriver:DeleteSession')
    print("\nALL VERIFICATIONS PASSED & SCREENSHOTS SAVED.")

finally:
    firefox_proc.terminate()
    server.shutdown()
