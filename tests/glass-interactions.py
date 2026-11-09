"""Behavioral browser regressions against tests/preview_server.py only."""
from marionette_client import Browser
from pathlib import Path
import json,time
OUT=Path('docs/verification/bright-glass');b=Browser();results=[]
seed=Path('tests/glass-seed.js').read_text();audit=Path('tests/glass-audit.js').read_text()
def check(name,code):
 result=b.js(code);assert result,(name,result);results.append(name);print('PASS',name,flush=True)
def do(code):b.js(code);time.sleep(.08)
def fill(id,value,event='input'):
 do('document.getElementById('+json.dumps(id)+').value='+json.dumps(value)+';document.getElementById('+json.dumps(id)+').dispatchEvent(new Event('+json.dumps(event)+',{bubbles:true}));')
def click(selector):
 el=b.call('WebDriver:FindElement',{'using':'css selector','value':selector});b.call('WebDriver:ElementClick',{'id':el['element-6066-11e4-a52e-4f735466cecf']});time.sleep(.08)
def modal_audit(name):
 data=b.js(audit);(OUT/(name+'-audit.json')).write_text(json.dumps(data,ensure_ascii=False,indent=2));b.shot(str(OUT/(name+'.png')))
 for key in ['tooSmall','dark','lime','wrap','headingClips','contrastFailures']:assert not data[key],(name,key,data[key])
 results.append(name+' visual audit')
def wait_for(code):
 for _ in range(80):
  if b.js(code):return
  time.sleep(.05)
 raise AssertionError('Timed out: '+code)
try:
 b.call('WebDriver:SetWindowRect',{'width':1366,'height':854});b.call('WebDriver:Navigate',{'url':'http://127.0.0.1:8766/'});time.sleep(1);do(seed)
 check('SDK is absent; no live cloud access',"return !window.supabase&&!isCloudEnabled&&supabaseClient===null;")
 # Actual card scrolling, not merely document overflow hiding.
 check('all pending items are in the action queue',"return document.querySelectorAll('#dash-action-cards .action-card').length===18;")
 check('detail body scrolls while its heading stays pinned',"const body=document.querySelector('#dash-detail-body'),heading=document.querySelector('#detail-task-title');const before=heading.getBoundingClientRect().top;body.scrollTop=body.scrollHeight;return body.scrollTop>0&&heading.getBoundingClientRect().top===before&&body.lastElementChild.getBoundingClientRect().bottom<=body.getBoundingClientRect().bottom+2;")
 check('dashboard queue and table reach their final items',"return ['#dash-action-cards','.master-table-scroll'].every(selector=>{const e=document.querySelector(selector);e.scrollTop=e.scrollHeight;return e.scrollTop>0;});")
 do("navigateTo('tuition');window.beforeA=FeeLedger.totals(feeState,'a').balance;")
 click('[data-fee-student="b"]');check('teacher switches account using student tile',"return feeStudentId()==='b'&&feeTotals().balance===750000&&!document.getElementById('fee-log-body').textContent.includes('Phát sinh bài tập');")
 fill('fee-manual-input','50000');fill('fee-manual-reason','QA payment B');click('#btn-fee-pay')
 check('payment affects B only and updates summary tile',"return feeTotals().balance===700000&&FeeLedger.totals(feeState,'a').balance===window.beforeA&&document.querySelector('[data-fee-student=b]').textContent.includes('700.000đ');")
 fill('fee-manual-input','20000');fill('fee-manual-reason','QA charge B');fill('fee-due-date','2099-11-12','change');click('#btn-fee-add')
 check('dated charge retained for selected account',"return feeTotals().balance===720000&&feeState.log.some(e=>e.student_id==='b'&&e.reason==='QA charge B'&&e.due_date==='2099-11-12');")
 do("window.savedPrompt=window.prompt;window.savedConfirm=window.confirm;window.promptAnswers=['30000','QA edited charge','2099-11-13'];window.prompt=()=>window.promptAnswers.shift();window.confirm=()=>true;")
 click('[data-fee-edit]');wait_for("return feeState.log.some(e=>e.reason==='QA edited charge'&&e.amount===30000&&e.due_date==='2099-11-13');")
 check('fee edit retains owner and updates balance',"return feeTotals().balance===730000&&FeeLedger.totals(feeState,'a').balance===window.beforeA;")
 click('[data-fee-delete]');wait_for("return !feeState.log.some(e=>e.reason==='QA edited charge');")
 check('fee deletion updates only selected account',"return feeTotals().balance===700000&&FeeLedger.totals(feeState,'a').balance===window.beforeA;")
 click('[data-fee-student="f"]');check('new student has zero totals and empty history',"return feeTotals().balance===0&&document.querySelector('#fee-log-body .fee-log-empty')!==null;")
 do("window.prompt=window.savedPrompt;window.confirm=window.savedConfirm;navigateTo('tasks');")
 fill('task-filter-student','a','change');fill('task-filter-status','submitted','change');fill('task-search','chấm điểm')
 check('combined assignment filters return correct student and status',"return document.querySelectorAll('#tasks-list .task-card').length===2&&[...document.querySelectorAll('#tasks-list .task-card')].every(e=>e.textContent.includes('Nguyễn Thị Lượng'));")
 fill('task-filter-date','2099-01-01','change');check('date filter produces meaningful empty state',"return document.querySelector('#tasks-list .empty-state')!==null;")
 for id,val in [('task-filter-date',''),('task-search',''),('task-filter-student','all'),('task-filter-status','all')]:fill(id,val,'change' if id!='task-search' else 'input')
 # Menu and modal affordances use the existing real click handlers.
 click('#editorial-menu-toggle');check('menu opens with expanded trigger',"return document.getElementById('editorial-menu').open&&document.getElementById('editorial-menu-toggle').getAttribute('aria-expanded')==='true';")
 modal_audit('menu');click('[data-go="settings"]');check('menu navigation closes dialog',"return currentView==='settings'&&!document.getElementById('editorial-menu').open;")
 click('#setting-text');check('large type preference persists',"return document.body.classList.contains('large-text')&&JSON.parse(localStorage.getItem('homeworkhub_display')).text;");click('#setting-text')
 click('#setting-motion');check('motion preference persists',"return JSON.parse(localStorage.getItem('homeworkhub_display')).motion===true;")
 do("openCmd();document.getElementById('cmd-input').value='Học phí';document.getElementById('cmd-input').dispatchEvent(new Event('input')); ")
 modal_audit('command-palette');check('command search finds fee navigation',"return document.getElementById('cmd-results').textContent.includes('Học phí');");do('closeCmd();')
 do("navigateTo('students');openAddStudent();");modal_audit('student-form');fill('input-student-name','QA Nguyễn Thị Thử');fill('input-student-grade','Lớp 9');fill('input-student-passcode','1234');click('#btn-save-student')
 check('student creation survives redesigned form',"return state.students.some(s=>s.name==='QA Nguyễn Thị Thử'&&s.pin==='1234');")
 do("window.qaStudentId=state.students.find(s=>s.name==='QA Nguyễn Thị Thử').id;editStudent(window.qaStudentId);");fill('input-student-name','QA Nguyễn Thị Thử sửa');click('#btn-save-student');check('student edit retains identity',"return state.students.some(s=>s.id===window.qaStudentId&&s.name==='QA Nguyễn Thị Thử sửa');")
 do("navigateTo('tasks');openAddTaskFor('a');");modal_audit('assignment-form');fill('input-task-title','QA bài tập mới');fill('input-task-desc','Nộp ảnh và tệp tài liệu');fill('input-task-due','2099-11-13','change');click('#btn-save-task')
 check('assignment creation survives redesigned form',"window.qaTaskId=state.tasks.find(t=>t.title==='QA bài tập mới')?.id;return !!window.qaTaskId;")
 # Login via the real PIN handler, including a stale teacher-selected account.
 do("selectedFeeStudentId='b';openLoginDialog();");click('#role-btn-student');fill('login-student-select','a','change');fill('input-student-pin','0000');click('#btn-do-login');wait_for("return state.currentUser?.role==='student';")
 do("navigateTo('tuition');")
 check('student only sees own fee tile, history and no write controls',"return feeStudentId()==='a'&&document.querySelectorAll('.fee-student-tile').length===1&&!document.getElementById('fee-student-select')&&!document.getElementById('btn-fee-pay')&&!document.getElementById('fee-widget').textContent.includes('QA payment B');")
 check('student cannot write another fee account',"return adjustFee(100,'forbidden','manual','b')===false;")
 do("navigateTo('tasks');document.getElementById('task-search').value='QA bài tập mới';applyTaskFilters();window.uploadDone=false;processFiles([new File(['sample document'],'homework.txt',{type:'text/plain'}),new File(['<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\"><rect width=\"24\" height=\"24\" fill=\"white\"/></svg>'],'homework.svg',{type:'image/svg+xml'})],window.qaTaskId).then(()=>window.uploadDone=true);")
 wait_for('return window.uploadDone;');check('student image and document upload handlers work locally',"const t=state.tasks.find(t=>t.id===window.qaTaskId);return t.submissions.length===1&&t.submittedFiles.length===1&&t.status==='draft';")
 modal_audit('student-upload');do('submitHomework(window.qaTaskId);');wait_for("return state.tasks.find(t=>t.id===window.qaTaskId).status==='submitted';");results.append('student submits uploaded homework')
 do("openLoginDialog();document.getElementById('input-teacher-pass').value=TEACHER_PASSWORD;document.getElementById('btn-do-login').click();");wait_for("return state.currentUser?.role==='teacher';")
 do("state.tasks.forEach(t=>{if(t.dueDate)t.dueDate='2099-11-13';});window.beforeReward=FeeLedger.totals(feeState,'a').balance;approveTask(window.qaTaskId);");wait_for("return state.tasks.find(t=>t.id===window.qaTaskId).status==='approved';")
 check('teacher approval records reward on correct student',"return FeeLedger.totals(feeState,'a').balance===window.beforeReward-2500&&FeeLedger.totals(feeState,'b').balance===700000;")
 do("openTaskSubmissionViewer(window.qaTaskId,0);");modal_audit('submission-viewer');do("closeModal('modal-image-viewer');")
 do("confirmDeleteStudent(window.qaStudentId);");modal_audit('delete-confirmation');click('#btn-confirm-delete');wait_for("return !state.students.some(s=>s.id===window.qaStudentId);");results.append('student deletion removes selected account');do("document.getElementById('toast-container').replaceChildren();")
 do("state.tasks=[];navigateTo('dashboard');");check('empty cards shrink instead of filling blank viewport',"return [...document.querySelectorAll('.dashboard-split .dash-card')].every(e=>e.getBoundingClientRect().height<400);");b.shot(str(OUT/'dashboard-empty.png'))
 # Probe the dense dashboard between the specified desktop sizes.
 do(seed)
 for width in [1280,1100,1000,900]:
  b.call('WebDriver:SetWindowRect',{'width':width,'height':854});do("navigateTo('dashboard');")
  geometry=b.js(audit);assert not geometry['layoutClips'],(width,geometry['layoutClips']);
  check('dashboard remains usable at '+str(width),"return document.querySelector('.master-table-scroll').clientHeight>=80&&document.querySelector('#dash-action-cards').clientHeight>=80&&document.querySelector('#dash-detail-body').clientHeight>=80;")
  check('header remains in bounds at '+str(width),"return document.documentElement.scrollWidth<=innerWidth&&[...document.querySelectorAll('#topnav > *')].every(e=>e.getBoundingClientRect().right<=innerWidth-10);")
 b.call('WebDriver:SetWindowRect',{'width':1366,'height':854})
 for amount in [1000000,100000000,-10000000]:
  do("feeState=FeeLedger.empty();selectedFeeStudentId='a';FeeLedger.add(feeState,state.students,{student_id:'a',amount:"+str(amount)+",reason:'large account'});navigateTo('dashboard');")
  check('large fee metric remains inside its tile: '+str(amount),"return [...document.querySelectorAll('.metric-val')].every(e=>e.scrollWidth<=e.clientWidth+1&&e.getBoundingClientRect().right<=e.parentElement.getBoundingClientRect().right-15);")
 (OUT/'interactions.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
finally:b.close()
