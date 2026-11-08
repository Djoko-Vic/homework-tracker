/* Student-owned fee records. Runs in browsers and Node without dependencies. */
(function (root) {
  'use strict';
  const copy = value => JSON.parse(JSON.stringify(value));
  const empty = () => ({version: 2, log: [], studentStreaks: {}, lateCharged: {}, dailyCharged: {}, rewardedApprovals: {}});
  function validate(students, entry) {
    if (!students.some(s => s.id === entry.student_id)) throw Error('Chọn học sinh hợp lệ.');
    if (!Number.isSafeInteger(entry.amount)) throw Error('Số tiền phải là số nguyên hợp lệ.');
    if (!entry.reason || !entry.reason.trim()) throw Error('Nhập ghi chú giao dịch.');
    if (entry.due_date && (!/^\d{4}-\d{2}-\d{2}$/.test(entry.due_date) || new Date(entry.due_date).toISOString().slice(0,10) !== entry.due_date)) throw Error('Ngày đến hạn không hợp lệ.');
  }
  function add(state, students, input) {
    const entry = {id: globalThis.crypto?.randomUUID?.() || 'fee-' + Date.now() + '-' + Math.random().toString(36).slice(2), type: 'manual', created_at: new Date().toISOString(), due_date: null, ...input};
    validate(students, entry);
    if (state.log.some(e => e.id === entry.id)) throw Error('Giao dịch đã tồn tại.');
    state.log.unshift(entry);
    return entry;
  }
  function owned(state, studentId, id) {
    const entry = state.log.find(e => e.id === id && e.student_id === studentId);
    if (!studentId || !entry) throw Error('Giao dịch không thuộc học sinh này.');
    return entry;
  }
  function edit(state, students, studentId, id, patch) {
    const entry = owned(state, studentId, id);
    const next = {...entry, amount: patch.amount ?? entry.amount, reason: patch.reason ?? entry.reason, due_date: patch.due_date === undefined ? entry.due_date : patch.due_date};
    validate(students, next); Object.assign(entry, next); return entry;
  }
  function remove(state, studentId, id) { owned(state,studentId,id); state.log = state.log.filter(e => e.id !== id); }
  function totals(state, studentId, today = new Date().toISOString().slice(0,10)) {
    let due=0, paid=0, pastDue=0;
    for (const e of state.log.filter(e => studentId && e.student_id === studentId)) {
      if (e.amount > 0) { due += e.amount; if (e.due_date && e.due_date < today) pastDue += e.amount; }
      else paid -= e.amount;
    }
    // Credits (payments, rewards and refunds) settle oldest charges first.
    return {due, paid, balance: due-paid, overdue: Math.max(0,pastDue-paid)};
  }
  function migrate(input, students, owner) {
    if (input.version === 2) return copy(input);
    const state = {...empty(), studentStreaks: copy(input.studentStreaks || {}), lateCharged: copy(input.lateCharged || {}), dailyCharged: copy(input.dailyCharged || {}), rewardedApprovals: copy(input.rewardedApprovals || {})};
    state.legacyBackup = copy(input);
    owner = owner || (students.length === 1 ? students[0].id : null);
    if (!owner || !students.some(s=>s.id===owner)) { state.legacy=copy(input); return state; }
    // Tagged rows retain their owners. Only unassigned rows go to the confirmed owner.
    for (const e of input.log || []) {
      const student_id=e.student_id || owner;
      if (!students.some(s=>s.id===student_id)) { (state.orphans ||= []).push(copy(e)); continue; }
      add(state,students,{...e,student_id});
    }
    const sum=state.log.reduce((n,e)=>n+e.amount,0);
    const opening=(Number.isSafeInteger(input.balance) ? input.balance : 1000000)-sum;
    if(opening) add(state,students,{student_id:owner,amount:opening,reason:'Số dư đầu kỳ — chuyển dữ liệu cũ',type:'opening'});
    return state;
  }
  function deleteStudent(state,id) { state.log=state.log.filter(e=>e.student_id!==id); delete state.studentStreaks[id]; }
  const api={empty,validate,add,edit,remove,totals,migrate,deleteStudent};
  if(typeof module !== 'undefined' && module.exports) module.exports=api;
  else root.FeeLedger=api;
})(globalThis);
