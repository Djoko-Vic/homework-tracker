
isCloudEnabled=false;supabaseClient=null;isSyncing=false;feeCloudReady=false;
state.students=[['a','Nguyễn Thị Lượng','Tiếng Anh · Lớp 9'],['b','Trần Minh Anh','Tiếng Anh · Lớp 8'],['c','Lê Hoàng Nam','Tiếng Anh · Lớp 9'],['d','Phạm Ngọc Linh','Tiếng Anh · Lớp 7'],['e','Đỗ Đức Huy','Tiếng Anh · Lớp 8'],['f','Vũ Bảo Ngọc','Tiếng Anh · Lớp 9']].map(([id,name,grade])=>({id,name,grade,pin:'0000',color:'#FF7A1A'}));
state.currentUser={role:'teacher',name:'Giáo viên'};document.body.classList.add('reduce-motion');document.body.classList.remove('large-text');for(const id of ['setting-motion','setting-text'])document.getElementById(id).checked=false;localStorage.setItem('homeworkhub_display',JSON.stringify({motion:false,text:false}));
const today=getVNDate();const future=new Date(Date.now()+86400000*2).toISOString().slice(0,10);
const yesterday=new Date(Date.now()-86400000).toISOString().slice(0,10);
const picture='data:image/svg+xml;base64,'+btoa('<svg xmlns="http://www.w3.org/2000/svg" width="180" height="120"><rect width="180" height="120" fill="white"/><text x="12" y="30" font-size="14">Homework submission</text><path d="M12 50h140M12 70h110M12 90h135" stroke="gray"/></svg>');
state.tasks=Array.from({length:24},(_,i)=>({id:'task'+i,studentId:state.students[i%6].id,title:['Bài tập cần chấm điểm','Ôn tập thì hiện tại hoàn thành','Luyện viết: Một ngày đáng nhớ','Đọc hiểu và trả lời câu hỏi','Từ vựng: Trường học của em','Nghe và ghi lại ý chính'][i%6]+(i>5?' · Phần '+(Math.floor(i/6)+1):''),description:'Hoàn thành các câu hỏi trong tài liệu. Đọc kỹ yêu cầu và nộp bài trước hạn để giữ chuỗi học tập.',status:i%4===0?'submitted':i%4===1?'approved':'pending',dueDate:i%4===3?yesterday:future,createdAt:new Date(Date.now()-i*3600000).toISOString(),isRecurring:i===5,submissions:i%4===0?[{id:'sub'+i,data:picture,date:new Date().toISOString(),approved:false}]:[],submittedFiles:[],attachments:[]}));
feeState=FeeLedger.empty();selectedFeeStudentId='a';
for(const student of state.students.slice(0,5)){
 FeeLedger.add(feeState,state.students,{student_id:student.id,amount:1000000,reason:'Học phí tháng 11',type:'manual',due_date:future});
 FeeLedger.add(feeState,state.students,{student_id:student.id,amount:-250000,reason:'Thanh toán đợt 1',type:'payment'});
}
for(let i=0;i<14;i++)FeeLedger.add(feeState,state.students,{student_id:'a',amount:i%2?10000:-2500,reason:i%2?'Phát sinh bài tập · '+i:'Thưởng nộp bài · '+i,type:i%2?'manual':'reward'});
document.querySelectorAll('.modal-overlay').forEach(e=>e.classList.remove('open'));
document.body.style.overflow='';selectedDashTaskId=null;navigateTo('dashboard');
