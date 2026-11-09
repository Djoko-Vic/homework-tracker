
const overlay=document.querySelector('.modal-overlay.open')||document.querySelector('.cmd-overlay.open')||document.querySelector('dialog[open]');
const roots=overlay?[overlay]:[document.querySelector('#topnav'),document.querySelector('.view.active')];
const visible=e=>{const r=e.getBoundingClientRect();if(!r.width||!r.height)return false;for(let p=e;p;p=p.parentElement){const s=getComputedStyle(p);if(s.display==='none'||s.visibility==='hidden'||+s.opacity===0)return false;}return true;};
const elements=roots.flatMap(root=>[root,...root.querySelectorAll('*')]).filter(visible);
const textElements=elements.filter(e=>[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()));
const describe=e=>({tag:e.tagName,id:e.id,cls:typeof e.className==='string'?e.className:'',text:e.textContent.trim().slice(0,80)});
const tooSmall=textElements.filter(e=>parseFloat(getComputedStyle(e).fontSize)<12).map(e=>({...describe(e),size:getComputedStyle(e).fontSize}));
const rgba=color=>(color.match(/[\d.]+/g)||[]).map(Number);
const dark=elements.filter(e=>{const c=rgba(getComputedStyle(e).backgroundColor);return c.length&&c[3]>.45&&Math.max(...c.slice(0,3))<90;}).map(describe);
const lime=elements.filter(e=>[getComputedStyle(e).backgroundColor,getComputedStyle(e).color].some(c=>{const [r,g,bb,a]=rgba(c);return a>.1&&g>140&&g>r*1.25&&bb<g*.65;})).map(describe);
const inScroll=e=>{for(let p=e.parentElement;p;p=p.parentElement){const s=getComputedStyle(p);if(p.id!=='main'&&/(auto|scroll)/.test(s.overflowX+' '+s.overflowY))return true;}return false;};
const edges=elements.filter(e=>{if(e.tagName==='SECTION'||e===roots[0]||inScroll(e))return false;const r=e.getBoundingClientRect();return r.top>=0&&r.top<innerHeight&&(r.left<4||r.right>innerWidth-4);}).map(describe);
const wrap=elements.filter(e=>e.matches('.topnav-item,.status-chip,.fee-badge,.card-badge,.hero-count-badge')).filter(e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return r.height>parseFloat(s.lineHeight)+parseFloat(s.paddingTop)+parseFloat(s.paddingBottom)+3||e.scrollWidth>e.clientWidth+2;}).map(describe);
const layoutClips=innerWidth>=900&&!document.querySelector('#view-tasks.active')?elements.filter(e=>e.matches('.view.active,.dashboard-split,.dash-card,.fee-workspace,.fee-account-panel,.fee-history-panel,.view-scroll-card')).filter(e=>e.getBoundingClientRect().bottom>innerHeight-10).map(describe):[];
const headingClips=elements.filter(e=>e.matches('h1,h2,h3')).filter(e=>{const r=e.getBoundingClientRect();for(let p=e.parentElement;p&&p!==document.body;p=p.parentElement){const s=getComputedStyle(p),pr=p.getBoundingClientRect();if(s.overflowY==='hidden'&&(r.top<pr.top-1||r.bottom>pr.bottom+1))return true;}return false;}).map(describe);
const blend=(fg,bg)=>{const a=fg[3]??1;return fg.slice(0,3).map((n,i)=>n*a+bg[i]*(1-a));};
const lum=c=>{const rgb=c.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;};
const failures=[];let minContrast=100;
for(const e of textElements){
 const s=getComputedStyle(e),fg=rgba(s.color);let chain=[];for(let p=e;p&&p!==document.body;p=p.parentElement)chain.unshift(p);
 // The brightest and darkest extreme mesh stops, composited through every surface.
 const ratios=[[255,248,241],[255,210,174],[214,232,255],[255,230,204]].map(base=>{
  let bg=base;for(const p of chain){const ps=getComputedStyle(p);bg=blend(rgba(ps.backgroundColor),bg);const colors=ps.backgroundImage.match(/rgba?\([^)]+\)/g);if(colors&&ps.backgroundImage.startsWith('linear-gradient'))bg=blend(rgba(colors[0]),bg);}
  const foreground=blend(fg,bg),a=lum(foreground),bb=lum(bg);return (Math.max(a,bb)+.05)/(Math.min(a,bb)+.05);
 });
 const ratio=Math.min(...ratios);minContrast=Math.min(minContrast,ratio);
 const large=parseFloat(s.fontSize)>=24||(parseFloat(s.fontSize)>=18.66&&parseFloat(s.fontWeight)>=700);const required=large?3:4.5;
 if(ratio<required)failures.push({...describe(e),ratio:+ratio.toFixed(2),required,color:s.color,background:s.backgroundColor});
}
const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
const diacritics=['BÀI TẬP CẦN CHẤM ĐIỂM','Hạn nộp','Chưa duyệt','Nguyễn Thị Lượng'].map((text,i)=>{const font=i===0?'800 32px Montserrat':'400 16px "Be Vietnam Pro"';ctx.font=font;const m=ctx.measureText(text);return {text,font,loaded:document.fonts.check(font,text),inkHeight:m.actualBoundingBoxAscent+m.actualBoundingBoxDescent,lineHeight:i===0?36.8:24,verticalSpace:i===0?43.2:24};});
const glyphOverflow=elements.filter(e=>e.matches('h1,h2,h3')).flatMap(e=>{const s=getComputedStyle(e);ctx.font=s.fontWeight+' '+s.fontSize+' '+s.fontFamily;const m=ctx.measureText(e.textContent.toLocaleUpperCase('vi'));const available=parseFloat(s.lineHeight)+parseFloat(s.paddingTop)+parseFloat(s.paddingBottom);return m.actualBoundingBoxAscent+m.actualBoundingBoxDescent>available+1?[{...describe(e),ink:m.actualBoundingBoxAscent+m.actualBoundingBoxDescent,available}]:[];});
const nav=elements.filter(e=>e.matches('.topnav-item,.topnav-right > *, .topnav-brand')).map(e=>{const r=e.getBoundingClientRect();return {...describe(e),left:r.left,right:r.right,top:r.top,bottom:r.bottom};});
const navOverlap=[];for(let i=0;i<nav.length;i++)for(let j=i+1;j<nav.length;j++){const a=nav[i],bb=nav[j];if(Math.min(a.right,bb.right)-Math.max(a.left,bb.left)>1&&Math.min(a.bottom,bb.bottom)-Math.max(a.top,bb.top)>1)navOverlap.push([a.text,bb.text]);}
return {innerWidth,innerHeight,scrollHeight:document.documentElement.scrollHeight,scrollWidth:document.documentElement.scrollWidth,tooSmall,dark,lime,edges,wrap,headingClips,layoutClips,glyphOverflow,navOverlap,minContrast:+minContrast.toFixed(2),contrastFailures:failures,diacritics,fonts:document.fonts.status};
