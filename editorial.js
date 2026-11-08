/* Original study engravings and shared interface behavior. No external assets. */
'use strict';
const STUDY_DRAWINGS = {
  book: `<path d="M65 83Q128 61 192 104Q254 61 319 83L309 246Q249 228 192 265Q129 228 74 246Z"/><path d="M192 104V265M65 83L52 96L62 258Q128 245 192 280Q251 247 321 258L332 96L319 83M62 258V269L192 290L321 269V258"/><path d="M84 101Q135 87 174 118M83 113Q132 100 174 130M81 127Q130 112 174 143M80 141Q128 128 174 157M79 158Q131 143 174 174M78 173Q132 159 174 190M77 188Q132 174 174 205M77 207Q132 190 174 222M210 118Q255 87 300 101M210 132Q255 101 298 116M210 146Q255 115 297 132M210 162Q255 131 296 148M210 179Q255 147 294 166M210 196Q255 166 292 184M210 213Q253 185 291 203M210 230Q253 203 290 221"/><path d="M90 251L86 265M108 253L103 268M126 258L120 271M143 264L136 274M160 270L153 279M214 274L222 265M233 270L241 259M252 266L261 253M273 264L283 252"/>`,
  pencil: `<path d="M110 261L132 191L252 58Q267 43 285 61Q300 77 285 91L165 224Z M132 191L165 224M144 202L273 66M153 214L282 77M110 261L128 248L116 239M252 58L285 91M243 69L276 101M130 229L139 237M133 221L144 231M138 215L148 225"/><path d="M79 283Q162 278 226 286T326 282M72 292H306M211 175L267 230L237 260L181 205ZM223 188L214 198M236 201L227 211M249 214L240 224M258 225L249 234M199 214L204 209M209 224L214 219M219 234L224 229M229 244L234 239"/>`,
  hourglass: `<path d="M111 63H278V79H111ZM111 263H278V279H111ZM125 79Q123 138 174 166L177 177Q123 204 125 263M264 79Q265 138 213 166L211 177Q267 203 264 263M139 96H251M140 110Q151 139 191 157Q235 138 249 110ZM140 251Q167 218 192 205Q224 218 250 251ZM192 162V194"/><path d="M149 118L172 126M157 130L182 139M218 130L233 121M151 246L181 230M167 247L191 235M192 245L204 238M215 249L224 244M116 68H143M157 68H178M194 68H215M232 68H253M116 269H143M157 269H178M194 269H215M232 269H253"/>`,
  backpack: `<path d="M118 123Q118 69 192 69Q266 69 266 123L282 264H102ZM161 75V55Q190 32 221 55V75M118 123Q191 98 266 123M139 170H245V242H139ZM139 184H245M234 184V198M119 137L110 239M264 137L274 239M105 159L87 174V225L105 239M274 159L292 174V225L275 239M140 98L150 107M155 92L165 103M171 89L180 100M190 87L198 99M211 89L218 103M232 94L239 108M150 201V230M160 201V230M170 201V230M180 201V230M190 201V230M200 201V230M210 201V230M220 201V230"/>`,
  owl: `<path d="M120 111L111 61L160 84Q192 72 224 84L272 61L263 111Q293 166 267 229Q238 271 192 272Q145 271 117 229Q91 166 120 111ZM130 138Q133 95 174 111Q192 121 192 147Q192 121 213 111Q253 95 256 138Q260 179 222 181Q204 180 192 161Q179 181 160 181Q124 178 130 138ZM185 177L192 195L200 177M126 187Q123 226 159 248M258 187Q260 225 227 248M165 270L160 288M175 272V289M211 272V289M222 270L228 288M97 290H283"/><circle cx="159" cy="143" r="13"/><circle cx="225" cy="143" r="13"/><path d="M154 137V148M220 137V148M155 201L164 211L173 201M181 205L190 216L199 205M208 201L217 211L226 201M164 222L173 233L182 222M196 224L205 235L214 224M180 242L190 251L201 242M119 76L135 99M129 76L143 94M253 76L242 96M264 75L251 99"/>`
};
function studyArt(subject) {
  return `<svg class="study-art" viewBox="0 0 384 330" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g>${STUDY_DRAWINGS[subject]}</g><g class="ink-dots" fill="var(--accent)" stroke="none"><circle cx="67" cy="66" r="5"/><circle cx="321" cy="186" r="8"/><circle cx="91" cy="210" r="3"/><circle cx="294" cy="39" r="3"/><circle cx="43" cy="156" r="3"/></g></svg>`;
}
document.addEventListener('DOMContentLoaded', () => {
  const sections = [
    ['dashboard','book','Mỗi ngày, một bước tiến.','Theo dõi bài tập, xem lại tiến độ và dành thời gian cho điều quan trọng: học tập.','Xem tổng quan'],
    ['tasks','pencil','Viết tiếp hành trình.','Bài tập hằng ngày, bài nộp và nhận xét — tất cả trong cùng một nơi.','Xem bài tập'],
    ['tuition','hourglass','Từng khoản, rõ ràng.','Theo dõi học phí, thanh toán và phần thưởng học tập của từng học sinh.','Xem học phí'],
    ['students','backpack','Mỗi người, một hành trình.','Quản lý hồ sơ và theo sát tiến độ của từng học sinh.','Xem học sinh'],
    ['streaks','owl','Bền bỉ thành thói quen.','Nhìn lại những ngày đã học và tiếp tục xây dựng chuỗi học tập của bạn.','Xem chuỗi học tập'],
    ['settings','pencil','Không gian của bạn.','Điều chỉnh cỡ chữ và chuyển động để đọc, học và làm việc thoải mái hơn.','Tùy chỉnh']
  ];
  for (const [id,art,title,desc,action] of sections) {
    const view=document.getElementById('view-'+id); if(!view) continue;
    const existing=document.createElement('div'); existing.className='section-workspace'; existing.id='workspace-'+id;
    while(view.firstChild) existing.append(view.firstChild);
    view.append(existing);
    const hero=document.createElement('header'); hero.className='editorial-intro';
    hero.innerHTML=`<div class="intro-art">${studyArt(art)}</div><div class="intro-copy"><p class="intro-label">HomeworkHub / ${id==='tuition'?'Fees':id==='tasks'?'Assignments':id}</p><h2>${title}</h2><p>${desc}</p><a class="ink-button" href="#workspace-${id}">${action}</a></div>`;
    view.prepend(hero);
  }
  document.querySelectorAll('.modal-overlay').forEach(overlay=>{
    const heading=overlay.querySelector('h3');
    overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');
    if(heading){heading.id=heading.id || overlay.id+'-title';overlay.setAttribute('aria-labelledby',heading.id);}
  });
  document.querySelector('#modal-login .modal-body').insertAdjacentHTML('afterbegin',`<div class="login-engraving">${studyArt('book')}<p>Học hôm nay.<br>Tiến xa ngày mai.</p></div>`);
  const menu=document.getElementById('editorial-menu');
  const trigger=document.getElementById('editorial-menu-toggle');
  let previousFocus;
  function closeMenu() { menu.close();trigger.setAttribute('aria-expanded','false');previousFocus?.focus(); }
  trigger.addEventListener('click',()=>{previousFocus=document.activeElement;menu.showModal();trigger.setAttribute('aria-expanded','true');});
  document.getElementById('editorial-menu-close').addEventListener('click',closeMenu);
  menu.addEventListener('cancel',()=>trigger.setAttribute('aria-expanded','false'));
  menu.addEventListener('click',e=>{
    const nav=e.target.closest('[data-go]');
    if(nav) {closeMenu();navigateTo(nav.dataset.go);}
    if(e.target===menu) closeMenu();
  });
  document.getElementById('scroll-top').addEventListener('click',()=>window.scrollTo({top:0,behavior:(document.body.classList.contains('reduce-motion') || window.matchMedia('(prefers-reduced-motion: reduce)').matches)?'instant':'smooth'}));
  const motion=document.getElementById('setting-motion'), text=document.getElementById('setting-text');
  function preferences() {
    document.body.classList.toggle('reduce-motion',motion.checked);
    document.body.classList.toggle('large-text',text.checked);
    localStorage.setItem('homeworkhub_display',JSON.stringify({motion:motion.checked,text:text.checked}));
  }
  try { const saved=JSON.parse(localStorage.getItem('homeworkhub_display') || '{}'); motion.checked=!!saved.motion;text.checked=!!saved.text; } catch(_) {}
  preferences(); motion.addEventListener('change',preferences);text.addEventListener('change',preferences);
  if('IntersectionObserver' in window) {
    const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting) {e.target.classList.add('is-visible');observer.unobserve(e.target);}}),{threshold:0.05});
    document.querySelectorAll('.section-workspace').forEach(e=>{e.classList.add('reveal');observer.observe(e);});
  }
});
