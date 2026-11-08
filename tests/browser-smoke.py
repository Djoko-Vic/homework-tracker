import socket,json,base64,time
s=socket.create_connection(('127.0.0.1',2828));counter=0
def recv():
 n=b''
 while (c:=s.recv(1))!=b':': n+=c
 size=int(n);data=b''
 while len(data)<size:data+=s.recv(size-len(data))
 return json.loads(data)
print(recv())
def call(name,args={}):
 global counter
 counter+=1;data=json.dumps([0,counter,name,args]).encode();s.sendall(str(len(data)).encode()+b':'+data)
 result=recv()
 if result[2]:raise RuntimeError(result)
 return result[3]
def js(script):
 source='try { window.__checkResult=(()=>{'+script+'})() } catch(e) {window.__checkResult={error:e.stack}}'
 wrapper="const el=document.createElement('script');el.textContent="+json.dumps(source)+";document.head.append(el);el.remove();return window.__checkResult;"
 result=call('WebDriver:ExecuteScript',{'script':wrapper,'args':[],'sandbox':None})
 if isinstance(result.get('value'),dict) and 'error' in result['value']:raise RuntimeError(result)
 return result
call('WebDriver:NewSession',{'capabilities':{'alwaysMatch':{'acceptInsecureCerts':True}}})
call('WebDriver:Navigate',{'url':'http://127.0.0.1:8765'})
time.sleep(2)
print(js('return {title:document.title,art:document.querySelectorAll(".study-art").length,settings:!!document.getElementById("view-settings"),login:document.getElementById("modal-login").className};'))
# Avoid all live cloud writes: replace client and populate temporary browser state.
js("isCloudEnabled=false;supabaseClient=null;state.students=[{id:'a',name:'An',grade:'English',pin:'0000'},{id:'b',name:'Bình',grade:'English',pin:'0000'}];state.tasks=[];feeState=FeeLedger.empty();state.currentUser={role:'teacher'};closeModal('modal-login');navigateTo('dashboard');")
for width,height in [(1440,1000),(375,850)]:
 call('WebDriver:SetWindowRect',{'width':width,'height':height})
 for view in ['dashboard','tasks','tuition','students','streaks','settings']:
  js(f"navigateTo('{view}');")
  time.sleep(.3)
  if view=='dashboard': print('overflow',js('return [...document.querySelectorAll(".view.active *")].filter(e=>e.getBoundingClientRect().right>innerWidth+5).slice(0,12).map(e=>[e.className,e.getBoundingClientRect().width]);'))
  print(width,view,js('return {width:innerWidth,scroll:document.documentElement.scrollWidth,hero:getComputedStyle(document.querySelector(".view.active")).backgroundColor,heading:document.querySelector(".view.active h2").innerText};'))
  data=call('WebDriver:TakeScreenshot',{'full':False})
  with open(f'/tmp/homework-{view}-{width}.png','wb') as f:f.write(base64.b64decode(data['value']))
js("navigateTo('tuition');selectedFeeStudentId='a';adjustFee(100000,'An charge');selectedFeeStudentId='b';adjustFee(200000,'Binh charge');renderFeeWidget();")
result=js("return {balance:feeTotals().balance,logs:document.getElementById('fee-log-body').innerText};")['value']
assert result['balance']==200000 and 'An charge' not in result['logs'],result
print('fee B',result)
js("selectedFeeStudentId='a';renderFeeWidget();")
result=js("return {balance:feeTotals().balance,logs:document.getElementById('fee-log-body').innerText};")['value']
assert result['balance']==100000 and 'Binh charge' not in result['logs'],result
print('fee A',result)
js("document.getElementById('fee-student-select').value='b';document.getElementById('fee-student-select').dispatchEvent(new Event('change'));document.getElementById('fee-manual-input').value='50000';document.getElementById('btn-fee-pay').click();")
assert js('return feeTotals().balance;')['value']==150000
js("state.currentUser={role:'student',studentId:'a'};renderFeeWidget();")
assert js("return !document.getElementById('btn-fee-pay') && feeTotals().balance===100000;")['value']
js("state.currentUser={role:'teacher'};renderFeeWidget();document.getElementById('editorial-menu-toggle').click();")
print('menu',js("return document.getElementById('editorial-menu').open;"))
js("document.querySelector('[data-go=settings]').click();document.getElementById('setting-motion').click();")
print('settings',js("return {view:currentView,motion:document.body.classList.contains('reduce-motion'),menu:document.getElementById('editorial-menu').open};"))
# Render a genuine 375px viewport in an iframe (desktop Firefox has a 500px window minimum).
js("const frame=document.createElement('iframe');frame.id='mobile-check';frame.src='http://127.0.0.1:8765';frame.style='position:fixed;inset:0;width:375px;height:850px;border:0;z-index:20000';document.body.append(frame);")
time.sleep(2)
call('WebDriver:SwitchToFrame',{'id':0})
js("isCloudEnabled=false;supabaseClient=null;state.students=[{id:'a',name:'An',grade:'English',pin:'0000'},{id:'b',name:'Bình',grade:'English',pin:'0000'}];state.currentUser={role:'teacher'};closeModal('modal-login');")
for view in ['dashboard','tasks','tuition','students','streaks','settings']:
 js(f"navigateTo('{view}');")
 time.sleep(.3)
 result=js('return {width:innerWidth,scroll:document.documentElement.scrollWidth};')['value']
 print('actual mobile',view,result)
 assert result['width']==375 and result['scroll']<=375, result
js("openLoginDialog();")
call('WebDriver:SwitchToFrame',{'id':None})
data=call('WebDriver:TakeScreenshot',{'full':False})
with open('/tmp/homework-login-mobile.png','wb') as f:f.write(base64.b64decode(data['value']))
call('WebDriver:DeleteSession')
