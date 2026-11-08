const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
function app(){
 const storage=new Map();
 const c=vm.createContext({console,FeeLedger:require('../fee-ledger.js'),document:{addEventListener(){},getElementById(){return null}},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},setTimeout,crypto:globalThis.crypto});
 vm.runInContext(fs.readFileSync('app.js','utf8'),c);
 vm.runInContext("renderFeeWidget=()=>{};toast=()=>{};state.students=[{id:'a'},{id:'b'}];state.currentUser={role:'teacher'};",c);
 return code=>vm.runInContext(code,c);
}
test('teacher selection and automatic explicit student target stay isolated',()=>{
 const run=app();
 run("selectedFeeStudentId='a';adjustFee(100,'A');selectedFeeStudentId='b';adjustFee(250,'B');adjustFee(-20,'reward','reward','a')");
 assert.equal(run('feeTotals().balance'),250);
 run("selectedFeeStudentId='a'"); assert.equal(run('feeTotals().balance'),80);
 run("state.students=state.students.filter(s=>s.id!=='a');FeeLedger.deleteStudent(feeState,'a')");
 assert.equal(run('feeStudentId()'),'b'); assert.equal(run('feeTotals().balance'),250);
});
test('student cannot write or choose another account',()=>{
 const run=app(); run("adjustFee(100,'A');state.currentUser={role:'student',studentId:'b'};selectedFeeStudentId='a'");
 assert.equal(run('feeTotals().balance'),0);
 assert.equal(run("adjustFee(500,'forbidden','manual','a')"),false);
 assert.equal(run("FeeLedger.totals(feeState,'a').balance"),100);
});
test('cloud writes are blocked until migration/schema is ready',()=>{
 const run=app();run('isCloudEnabled=true');
 assert.equal(run("adjustFee(100,'blocked')"),false);assert.equal(run('feeState.log.length'),0);
});
test('automatic event keys deduplicate transactions and hydrate cloud markers',()=>{
 const run=app();
 run("adjustFee(100,'late','penalty_late','a',null,'late:task1');adjustFee(100,'late','penalty_late','a',null,'late:task1')");
 assert.equal(run("FeeLedger.totals(feeState,'a').balance"),100);
 run("feeState.lateCharged={};restoreFeeMarkers()");assert.ok(run('feeState.lateCharged.task1'));
});
test('failed automatic cloud insert rolls back transaction and consumed marker',async()=>{
 const run=app();
 run("isCloudEnabled=true;feeCloudReady=true;supabaseClient={from:()=>({insert:()=>Promise.resolve({error:{message:'network unavailable'}})})};feeState.lateCharged.task1='now';adjustFee(100,'late','penalty_late','a',null,'late:task1')");
 await new Promise(r=>setTimeout(r,0));
 assert.equal(run('feeState.log.length'),0);assert.equal(run('feeState.lateCharged.task1'),undefined);
});
test('cloud hydration recognizes legacy task penalties and refunds without guessing collisions',()=>{
 const run=app();
 run("state.students[0].name='An';state.tasks=[{id:'t',studentId:'a',title:'Reading'}];feeState.log=[{id:'old',student_id:'a',amount:10000,type:'penalty_late',reason:'An trễ hạn bài tập: Reading'}];restoreFeeMarkers()");
 assert.ok(run('feeState.lateCharged.t'));assert.equal(run('feeState.legacyEventAmbiguity'),undefined);
 run("state.tasks.push({id:'other',studentId:'a',title:'Reading'});feeState.log[0].event_key=null;restoreFeeMarkers()");
 assert.equal(run('feeState.legacyEventAmbiguity'),true);assert.equal(run('automaticFeeWritable()'),false);
});
test('failed approval credit is persisted for retry and stale cloud markers are removed',async()=>{
 const run=app();
 run("isCloudEnabled=true;feeCloudReady=true;supabaseClient={from:()=>({insert:()=>Promise.resolve({error:{message:'network unavailable'}})})};adjustFee(-2500,'approval','reward','a',null,'reward:t__single')");
 await new Promise(r=>setTimeout(r,0));
 assert.equal(run('Object.keys(feeState.pendingFees).length'),1);
 run("supabaseClient={from:()=>({insert:()=>Promise.resolve({error:null})})};feeCloudReady=true");
 await run('retryPendingFees()');
 assert.equal(run('Object.keys(feeState.pendingFees).length'),0);
 assert.equal(run("FeeLedger.totals(feeState,'a').balance"),-2500);
 run("feeState.log=[];restoreFeeMarkers(true)");assert.equal(run("feeState.rewardedApprovals['t__single']"),undefined);
});
