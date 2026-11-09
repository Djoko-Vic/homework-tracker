"""Firefox Marionette UI proof. Run with a local server and disposable Firefox profile.
python3 tests/preview_server.py
firefox --headless --no-remote --profile /tmp/homework-glass-firefox --marionette
python3 tests/glass-browser.py
External data is disabled before fixtures are installed; no production writes.
"""
from marionette_client import Browser
from pathlib import Path
import json,time,os
OUT=Path(os.environ.get('HOMEWORK_QA_DIR','docs/verification/bright-glass'));OUT.mkdir(parents=True,exist_ok=True)
b=Browser()
seed=(Path(__file__).parent/'glass-seed.js').read_text()
audit=(Path(__file__).parent/'glass-audit.js').read_text()
report=[]
try:
 b.call('WebDriver:Navigate',{'url':'http://127.0.0.1:8766'});time.sleep(2)
 # Fonts are local and must actually finish loading, rather than merely be declared.
 for _ in range(50):
  if b.js("return typeof state!=='undefined'&&document.fonts.status==='loaded';"):break
  time.sleep(.1)
 b.js(seed);time.sleep(.4);assert b.js("return renderFeeWidget.toString().includes('fee-student-overview') && !window.supabase;")
 for width,height in ([(1366,768)] if os.environ.get('HOMEWORK_QA_FAST') else [(1366,768),(1440,900),(1920,1080),(390,844)]):
  mobile=width<900
  if not mobile:
   b.call('WebDriver:SetWindowRect',{'width':width,'height':height+86})
   size=b.js('return {w:innerWidth,h:innerHeight,ow:outerWidth,oh:outerHeight};')
   b.call('WebDriver:SetWindowRect',{'width':width+size['ow']-size['w'],'height':height+size['oh']-size['h']})
  else:
   b.js("const f=document.createElement('iframe');f.id='qa-mobile';f.src='/';f.style='position:fixed;left:0;top:0;width:390px;height:844px;border:0;z-index:30000;background:#FFF8F1';document.body.append(f);")
   time.sleep(2);b.call('WebDriver:SwitchToFrame',{'id':0});b.js(seed);time.sleep(.4);assert b.js("return renderFeeWidget.toString().includes('fee-student-overview') && !window.supabase;")
  for view in ['dashboard','students','tasks','streaks','tuition','settings','login']:
   if view=='login': b.js('openLoginDialog();')
   else:b.js("document.querySelectorAll('.modal-overlay').forEach(e=>e.classList.remove('open'));navigateTo('"+view+"');")
   time.sleep(.3)
   assert b.js("return !window.supabase && state.students.length===6 && state.tasks.length===24;");metrics=b.js(audit);metrics['view']=view;metrics['target']=[width,height]
   report.append(metrics)
   name=f'{view}-{width}x{height}.png'
   if mobile:
    b.call('WebDriver:SwitchToFrame',{'id':None})
    frame=b.call('WebDriver:FindElement',{'using':'css selector','value':'#qa-mobile'})
    b.shot(str(OUT/name),id=frame['element-6066-11e4-a52e-4f735466cecf'])
    b.call('WebDriver:SwitchToFrame',{'id':0})
   else:b.shot(str(OUT/name))
   print(width,height,view,'actual',metrics['innerWidth'],metrics['innerHeight'],'scroll',metrics['scrollHeight'],'issues',{k:len(metrics[k]) for k in ['tooSmall','dark','lime','edges','wrap','headingClips','layoutClips','glyphOverflow','navOverlap','contrastFailures']},flush=True)
  if mobile:b.call('WebDriver:SwitchToFrame',{'id':None});b.js("document.getElementById('qa-mobile').remove();")
 (OUT/'metrics.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
 for metrics in report:
  assert [metrics['innerWidth'],metrics['innerHeight']]==metrics['target'],metrics
  assert metrics['scrollWidth']<=metrics['innerWidth'],metrics
  if metrics['innerWidth']>=900 and metrics['view']!='tasks':assert metrics['scrollHeight']<=metrics['innerHeight'],metrics
  assert all(d['loaded'] and d['inkHeight']<=d['verticalSpace'] for d in metrics['diacritics']),metrics['diacritics']
  for key in ['tooSmall','dark','lime','edges','wrap','headingClips','layoutClips','glyphOverflow','navOverlap','contrastFailures']:assert not metrics[key],(metrics['target'],metrics['view'],key,metrics[key])
finally:b.close()
