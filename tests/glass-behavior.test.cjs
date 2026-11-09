const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
function fixture() {
 const elements = new Map();
 const element = id => { if (!elements.has(id)) elements.set(id, { value: '', innerHTML: '', addEventListener(){}, querySelectorAll(){return [];} }); return elements.get(id); };
 const document = { addEventListener(){}, getElementById: element, createElement(){return {set textContent(v){this.innerHTML=String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');}};} };
 const c = vm.createContext({console, FeeLedger:require('../fee-ledger.js'),document,localStorage:{getItem(){return null;},setItem(){}},setTimeout,crypto:globalThis.crypto});
 vm.runInContext(fs.readFileSync('app.js','utf8'),c);
 const run = code => vm.runInContext(code,c);
 run("state.students=[{id:'a',name:'Nguyễn Thị Lượng'},{id:'b',name:'Bình'},{id:'c',name:'Chi'}];state.currentUser={role:'teacher'};toast=()=>{};selectedFeeStudentId='a';FeeLedger.add(feeState,state.students,{id:'a1',student_id:'a',amount:100000,type:'manual',reason:'Only A'});FeeLedger.add(feeState,state.students,{id:'b1',student_id:'b',amount:250000,type:'manual',reason:'Only B'});");
 return {element,run};
}
test('teacher fee overview shows each student including an empty account, with scoped history',()=>{
 const {element,run}=fixture();run('renderFeeWidget()');const html=element('fee-widget').innerHTML;
 assert.equal((html.match(/class="fee-student-tile/g)||[]).length,3);
 assert.match(html,/data-fee-student="c"/);assert.match(html,/Only A/);assert.doesNotMatch(html,/Only B/);
});
test('student fee view contains only their tile and history even with stale teacher selection',()=>{
 const {element,run}=fixture();run("state.currentUser={role:'student',studentId:'b'};renderFeeWidget()");const html=element('fee-widget').innerHTML;
 assert.equal((html.match(/class="fee-student-tile/g)||[]).length,1);
 assert.match(html,/Only B/);assert.doesNotMatch(html,/Only A|Nguyễn Thị Lượng|btn-fee-pay|fee-student-select/);
});
test('assignment filters combine student, status, due date and text while preserving role scoping',()=>{
 const {element,run}=fixture();
 run("state.tasks=[{id:'one',studentId:'a',title:'Reading',status:'pending',dueDate:'2099-11-09'},{id:'two',studentId:'a',title:'Writing',status:'pending',dueDate:'2099-11-10'},{id:'three',studentId:'b',title:'Reading',status:'pending',dueDate:'2099-11-09'}];renderTaskCard=t=>t.id;");
 element('task-filter-student').value='all';element('task-filter-status').value='all';element('task-filter-date').value='2099-11-09';element('task-search').value='Reading';
 run('applyTaskFilters()');assert.equal(element('tasks-list').innerHTML,'onethree');
 run("state.currentUser={role:'student',studentId:'a'};applyTaskFilters()");assert.equal(element('tasks-list').innerHTML,'one');
 element('task-search').value='Writing';run('applyTaskFilters()');assert.doesNotMatch(element('tasks-list').innerHTML,/one|two|three/);
});
test('dashboard clears a stale detail when the last task disappears or filters match nothing',()=>{
 const {run}=fixture();
 run("selectedDashTaskId='deleted';renderDashDetail=id=>{globalThis.detailShown=id;};renderDashTable();");
 assert.equal(run('globalThis.detailShown'),null);
 assert.equal(run('selectedDashTaskId'),null);
});
