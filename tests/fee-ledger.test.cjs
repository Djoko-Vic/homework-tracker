const {test}=require('node:test');
const assert=require('node:assert/strict');
const L=require('../fee-ledger.js');
const students=[{id:'a'},{id:'b'}];
test('two students retain independent charges, payments, overdue and empty totals',()=>{
 const s=L.empty();
 L.add(s,students,{id:'1',student_id:'a',amount:100,type:'manual',reason:'charge',due_date:'2020-01-01'});
 L.add(s,students,{id:'2',student_id:'a',amount:-30,type:'payment',reason:'paid'});
 assert.deepEqual(L.totals(s,'a','2026-01-01'),{due:100,paid:30,balance:70,overdue:70});
 assert.deepEqual(L.totals(s,'b'),{due:0,paid:0,balance:0,overdue:0});
 L.add(s,students,{id:'3',student_id:'b',amount:40,type:'manual',reason:'other'});
 assert.equal(L.totals(s,'a').balance,70); assert.equal(L.totals(s,'b').balance,40);
});
test('validation and scoped edit/delete reject wrong owners',()=>{
 const s=L.empty();
 for(const amount of [NaN,Infinity,1.2,Number.MAX_SAFE_INTEGER+1]) assert.throws(()=>L.add(s,students,{student_id:'a',amount,reason:'x'}));
 assert.throws(()=>L.add(s,students,{student_id:null,amount:1,reason:'x'}));
 assert.throws(()=>L.add(s,students,{student_id:'a',amount:1,reason:'x',due_date:'2026-02-31'}));
 L.add(s,students,{id:'x',student_id:'a',amount:10,reason:'x'});
 assert.throws(()=>L.edit(s,students,'b','x',{amount:99}));
 assert.throws(()=>L.remove(s,'b','x'));
 L.edit(s,students,'a','x',{amount:20,reason:'edited',due_date:'2026-12-01'});
 assert.equal(L.totals(s,'a').balance,20);
 L.remove(s,'a','x'); assert.equal(L.totals(s,'a').balance,0);
});
test('migration preserves balance and history, is idempotent and flags ambiguity',()=>{
 const old={balance:1050000,log:[{id:'old',amount:50000,reason:'legacy'}]};
 const pending=L.migrate(old,students); assert.ok(pending.legacy); assert.equal(pending.log.length,0);
 const s=L.migrate(old,students,'a'); assert.equal(L.totals(s,'a').balance,1050000);
 assert.equal(s.log.find(x=>x.id==='old').student_id,'a');
 assert.deepEqual(L.migrate(s,students),s); assert.equal(old.log[0].student_id,undefined);
 assert.equal(L.totals(L.migrate(old,[students[0]]),'a').balance,1050000);
});
test('deleting student removes only their ledger and preserves backup',()=>{
 const s=L.migrate({balance:10,log:[]},students,'a');
 L.add(s,students,{student_id:'b',amount:30,reason:'other'});
 L.deleteStudent(s,'a'); assert.equal(L.totals(s,'a').balance,0); assert.equal(L.totals(s,'b').balance,30);
 assert.ok(s.legacyBackup);
});
