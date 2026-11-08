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
