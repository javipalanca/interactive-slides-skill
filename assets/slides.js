(function(){'use strict';
const $=id=>document.getElementById(id);
const state={deck:null,index:0,exerciseApi:null,storage:null,data:{answers:{},done:{}},timer:null,timerSecs:0,timerRunning:false};
const DEFAULT_SLIDE_SIZE=85;
function node(tag,cls,value){const el=document.createElement(tag);if(cls)el.className=cls;if(value!=null)el.textContent=String(value);return el}
function persist(){try{localStorage.setItem(state.storage,JSON.stringify(state.data))}catch(e){$('status').textContent='El navegador no permite guardar el progreso.'}updateProgress()}
function activeSlides(){return state.deck.slides.filter(s=>!s.disabled)}
function updateProgress(){const ids=activeSlides().filter(s=>s.exercise).map(s=>s.exercise.id);const completed=ids.filter(id=>state.data.done[id]).length;$('completion').textContent=ids.length?`${completed} / ${ids.length} actividades hechas`:''}
function paragraphs(value,root){(Array.isArray(value)?value:[value]).filter(Boolean).forEach(t=>root.append(node('p',null,t)))}
function renderLogos(){
 const box=$('presentationLogos');if(!box)return;box.replaceChildren();
 const logos=state.deck.meta.logos||[];
 logos.forEach(logo=>{const img=node('img');img.src=logo.src;img.alt=logo.alt||'Logotipo';img.decoding='async';box.append(img)});
 box.hidden=!logos.length;
}
/* Tamaño: porcentaje del espacio de pantalla disponible que ocupa la diapositiva (16:9). */
function slideSize(){const n=Number(state.deck?.meta?.slideSize??DEFAULT_SLIDE_SIZE);return Number.isFinite(n)?Math.min(100,Math.max(50,n)):DEFAULT_SLIDE_SIZE}
function fitSlide(){
 const deck=$('deck');
 document.documentElement.style.setProperty('--s',Math.min(deck.clientWidth/1280,deck.clientHeight/720)*slideSize()/100);
}
/* Tema: preferencia del espectador (localStorage) > meta.theme > claro. "auto" sigue al sistema. */
function themeKey(){return 'interactive-theme:'+state.deck.meta.id}
function currentTheme(){let pref=null;try{pref=localStorage.getItem(themeKey())}catch(e){}return pref||state.deck.meta.theme||'light'}
function applyTheme(){const theme=currentTheme();if(theme==='auto')delete document.documentElement.dataset.theme;else document.documentElement.dataset.theme=theme;const dark=theme==='dark'||(theme==='auto'&&matchMedia('(prefers-color-scheme: dark)').matches);const b=$('themeBtn');if(b){b.setAttribute('aria-pressed',String(dark));b.title=dark?'Cambiar a tema claro':'Cambiar a tema oscuro'}}
function toggleTheme(){const dark=document.documentElement.dataset.theme==='dark'||(!document.documentElement.dataset.theme&&matchMedia('(prefers-color-scheme: dark)').matches);try{localStorage.setItem(themeKey(),dark?'light':'dark');applyTheme()}catch(e){document.documentElement.dataset.theme=dark?'light':'dark'}}
const DIVIDER_ICON="<svg class=\"icon\" viewBox=\"0 0 76 76\" aria-hidden=\"true\"><path d=\"M38 10a20 20 0 0 1 12 36v8H26v-8a20 20 0 0 1 12-36z\" fill=\"var(--orange-soft)\" stroke=\"var(--orange)\" stroke-width=\"4\" stroke-linejoin=\"round\"/><path d=\"M28 62h20M31 70h14\" stroke=\"var(--ink)\" stroke-width=\"4\" stroke-linecap=\"round\"/></svg>";
/* Ilustraciones de portada incluidas. Se eligen con slide.illustration según el tema de la clase. */
const SVG_OPEN='<svg class="doodle cover-art" width="320" height="270" viewBox="0 0 320 270" aria-hidden="true" fill="none" stroke-linecap="round" stroke-linejoin="round">';
const STAR='<path d="M270 26l6 14 15 2-11 10 3 15-13-8-13 8 3-15-11-10 15-2z" stroke="var(--orange)" stroke-width="2.5"/>';
const SQUIGGLE='<path d="M14 246c20-18 32 10 50-8s28 6 44-6" stroke="var(--orange)" stroke-width="3"/>';
const ILLUSTRATIONS={
 general:SVG_OPEN+'<path d="M60 60h90a10 10 0 0 1 10 10v150H70a10 10 0 0 1-10-10z" fill="var(--card)" stroke="var(--ink)" stroke-width="3"/><path d="M160 70a10 10 0 0 1 10-10h90v150a10 10 0 0 1-10 10h-90z" fill="var(--card)" stroke="var(--ink)" stroke-width="3"/><path d="M80 96h60M80 120h60M80 144h40M180 96h60M180 120h44" stroke="var(--muted)" stroke-width="3"/><path d="M196 196l70-70 14 14-70 70-20 6z" fill="var(--orange-soft)" stroke="var(--orange)" stroke-width="3"/>'+STAR+SQUIGGLE+'</svg>',
 ciencia:SVG_OPEN+'<path d="M120 40h50M130 40v62l-50 96a14 14 0 0 0 12 22h106a14 14 0 0 0 12-22l-50-96V40" fill="var(--card)" stroke="var(--ink)" stroke-width="3"/><path d="M98 168h94l18 34a6 6 0 0 1-5 9H85a6 6 0 0 1-5-9z" fill="var(--orange-soft)" stroke="var(--orange)" stroke-width="2.5"/><circle cx="128" cy="186" r="6" stroke="var(--orange)" stroke-width="2.5"/><circle cx="160" cy="176" r="4" stroke="var(--orange)" stroke-width="2.5"/><circle cx="148" cy="130" r="5" stroke="var(--blue)" stroke-width="2.5"/><circle cx="156" cy="104" r="3.5" stroke="var(--blue)" stroke-width="2.5"/><ellipse cx="246" cy="100" rx="42" ry="16" stroke="var(--blue)" stroke-width="2.5"/><ellipse cx="246" cy="100" rx="42" ry="16" transform="rotate(60 246 100)" stroke="var(--good)" stroke-width="2.5"/><ellipse cx="246" cy="100" rx="42" ry="16" transform="rotate(-60 246 100)" stroke="var(--orange)" stroke-width="2.5"/><circle cx="246" cy="100" r="6" fill="var(--ink)"/>'+SQUIGGLE+'</svg>',
 programacion:SVG_OPEN+'<rect x="40" y="50" width="240" height="170" rx="12" fill="var(--card)" stroke="var(--ink)" stroke-width="3"/><path d="M40 80h240" stroke="var(--ink)" stroke-width="3"/><circle cx="60" cy="65" r="5" fill="var(--bad)"/><circle cx="78" cy="65" r="5" fill="var(--warn)"/><circle cx="96" cy="65" r="5" fill="var(--good)"/><path d="M80 120l-22 22 22 22M240 120l22 22-22 22" stroke="var(--orange)" stroke-width="4"/><path d="M175 110l-30 68" stroke="var(--blue)" stroke-width="4"/><path d="M76 196h56M144 196h40" stroke="var(--muted)" stroke-width="3"/>'+STAR+SQUIGGLE+'</svg>',
 datos:SVG_OPEN+'<path d="M50 40v180h230" stroke="var(--ink)" stroke-width="3"/><rect x="76" y="150" width="30" height="70" fill="var(--orange-soft)" stroke="var(--orange)" stroke-width="2.5"/><rect x="124" y="110" width="30" height="110" fill="var(--blue-soft)" stroke="var(--blue)" stroke-width="2.5"/><rect x="172" y="130" width="30" height="90" fill="var(--good-soft)" stroke="var(--good)" stroke-width="2.5"/><rect x="220" y="80" width="30" height="140" fill="var(--orange-soft)" stroke="var(--orange)" stroke-width="2.5"/><path d="M70 130l54-40 48 22 70-60" stroke="var(--ink)" stroke-width="3" stroke-dasharray="6 6"/><circle cx="242" cy="52" r="6" fill="var(--orange)"/>'+SQUIGGLE+'</svg>',
 agentes:SVG_OPEN+'<path d="M50 60h70l18 24h102v140H50z" fill="var(--card)" stroke="var(--ink)" stroke-width="3"/><g font-family="JetBrains Mono, monospace" stroke="none"><text x="72" y="122" font-size="17" fill="var(--orange)" font-weight="600">Agente</text><text x="72" y="148" font-size="14" fill="var(--blue)">identidad</text><text x="72" y="172" font-size="14" fill="var(--orange-ink)">buzón</text><text x="72" y="196" font-size="14" fill="var(--good)">conductas</text></g>'+STAR+SQUIGGLE+'</svg>',
 matematicas:SVG_OPEN+'<path d="M60 210L160 50l100 160z" fill="var(--card)" stroke="var(--ink)" stroke-width="3"/><path d="M160 50v160" stroke="var(--muted)" stroke-width="2.5" stroke-dasharray="6 6"/><path d="M160 196h14v14" stroke="var(--muted)" stroke-width="2.5"/><circle cx="160" cy="150" r="34" stroke="var(--blue)" stroke-width="2.5"/><g font-family="Bricolage Grotesque, sans-serif" font-weight="800" stroke="none"><text x="236" y="80" font-size="46" fill="var(--orange)">π</text><text x="34" y="90" font-size="40" fill="var(--good)">Σ</text><text x="210" y="250" font-size="26" fill="var(--blue)">x²</text></g>'+SQUIGGLE+'</svg>',
 comunicacion:SVG_OPEN+'<path d="M40 50h150a14 14 0 0 1 14 14v70a14 14 0 0 1-14 14H96l-30 26v-26H54a14 14 0 0 1-14-14V64a14 14 0 0 1 14-14z" fill="var(--card)" stroke="var(--ink)" stroke-width="3"/><path d="M130 120h126a14 14 0 0 1 14 14v58a14 14 0 0 1-14 14h-10v24l-28-24h-88a14 14 0 0 1-14-14v-58a14 14 0 0 1 14-14z" fill="var(--orange-soft)" stroke="var(--orange)" stroke-width="3"/><path d="M66 84h100M66 108h70" stroke="var(--muted)" stroke-width="3"/><path d="M152 154h96M152 178h60" stroke="var(--orange-ink)" stroke-width="3"/>'+STAR+'</svg>'
};
function renderIllustration(slide,root){
 const value=slide.illustration??'general';
 if(value==='none')return;
 if(typeof value==='string'&&value.startsWith('data:image/')){const img=node('img','doodle cover-art');img.src=value;img.alt='';img.decoding='async';root.append(img);return}
 root.insertAdjacentHTML('beforeend',ILLUSTRATIONS[value]||ILLUSTRATIONS.general);
}
function renderTable(table){
 const figure=node('figure','data-table');const wrap=node('div','tablewrap');const t=node('table');
 const head=node('thead'),hr=node('tr');table.headers.forEach(h=>{const th=node('th',null,h);th.scope='col';hr.append(th)});head.append(hr);
 const body=node('tbody');table.rows.forEach(r=>{const tr=node('tr');r.forEach((c,j)=>{const cell=node(j===0?'th':'td',null,c);if(j===0)cell.scope='row';tr.append(cell)});body.append(tr)});
 t.append(head,body);wrap.append(t);figure.append(wrap);if(table.caption)figure.append(node('figcaption',null,table.caption));return figure;
}
function renderImage(image){
 const figure=node('figure','media'+(image.fit==='cover'?' fit-cover':''));const img=node('img');img.src=image.src;img.alt=image.alt||'';img.decoding='async';figure.append(img);
 if(image.caption)figure.append(node('figcaption',null,image.caption));
 return figure;
}
/* Construye el nodo de una diapositiva. Lo usan la proyección, la vista del ponente y la impresión. */
function buildSlide(slide,index,total,store,save){
const root=node('article',`slide ${slide.type||'content'}`);root.classList.add('on');let api=null;
if(slide.type==='section'){root.classList.add('divider');root.append(node('div','big',(slide.chapter||'').slice(0,1)));root.insertAdjacentHTML('beforeend',DIVIDER_ICON)}
if(slide.type==='cover')renderIllustration(slide,root);
if(slide.exercise)root.classList.add('exs');
root.setAttribute('aria-label',slide.title);if(slide.eyebrow)root.append(node('div','kick eyebrow',slide.eyebrow));const title=node(slide.type==='cover'?'h1':'h2',null,slide.title);
if(slide.type==='cover'){
 const words=slide.title.split(' ');
 if(words.length>2){const accent=words.splice(-2).join(' ');title.textContent=words.join(' ')+' ';title.append(node('em','title-accent',accent))}
}
root.append(title);if(slide.subtitle)root.append(node('p','lead subtitle',slide.subtitle));
const split=slide.image&&slide.layout==='split';
const content=split?node('div','split-text'):root;
if(slide.body){const body=node('div','body');paragraphs(slide.body,body);content.append(body)}
if(slide.table)content.append(renderTable(slide.table));
if(slide.bullets){const list=node('ul','bullets');slide.bullets.forEach(item=>list.append(node('li',null,item)));content.append(list)}
if(slide.code)content.append(node('pre','snip code-example',slide.code));
if(split){const wrap=node('div','split');wrap.append(content,renderImage(slide.image));root.append(wrap)}else if(slide.image)root.append(renderImage(slide.image));
if(slide.callout)root.append(node('aside','hand callout',slide.callout));
root.dataset.layout=slide.layout||'';
root.dataset.initial=(slide.chapter||'').slice(0,1);
const foot=node('div','foot page-foot');foot.append(node('b',null,slide.chapter),node('span',null,(index+1)+' / '+total));root.append(foot);
if(slide.exercise)api=SlidesExercises.mount(slide.exercise,root,store,save);
if(slide.solution&&!slide.exercise){const button=node('button',null,'Ver solución');const answer=node('div','solution',slide.solution);answer.hidden=true;button.addEventListener('click',()=>{answer.hidden=!answer.hidden;button.textContent=answer.hidden?'Ver solución':'Ocultar solución'});root.append(button,answer);api={toggleSolution:()=>button.click()}}
return {root,api};
}
function render(){const slides=activeSlides();if(!slides.length)return;state.index=Math.max(0,Math.min(state.index,slides.length-1));const slide=slides[state.index];document.title=`${slide.title} · ${state.deck.meta.title}`;
 const built=buildSlide(slide,state.index,slides.length,state.data,persist);state.exerciseApi=built.api;
 $('stage').replaceChildren(built.root);$('stage').scrollTop=0;requestAnimationFrame(fitSlide);renderLogos();$('chapter').textContent=slide.chapter||'';$('brand').textContent=state.deck.meta.title;$('counter').textContent=`${state.index+1} / ${slides.length}`;$('progressBar').style.width=`${(state.index+1)/slides.length*100}%`;$('prevBtn').disabled=state.index===0;$('nextBtn').disabled=state.index===slides.length-1;$('notesBody').textContent=slide.notes||'No hay notas para esta diapositiva.';updateProgress();setupTimer(slide.exercise?.minutes);$('status').textContent=`Diapositiva ${state.index+1}: ${slide.title}`;
 try{if(location.hash!=='#'+(state.index+1))history.replaceState(null,'','#'+(state.index+1))}catch(e){}
 updatePresenter();window.dispatchEvent(new CustomEvent('slides:render',{detail:{slide,index:state.index}}));}
/* ---------- Vista del ponente: ventana aparte con diapositiva actual, siguiente, notas y cronómetro ---------- */
const presenter={win:null,start:0,tick:null};
const PRESENTER_CSS='body.presenter{margin:0;overflow:hidden;background:var(--frame);color:var(--ink);font-family:var(--f-body);padding:0}.pv-grid{display:grid;grid-template-columns:3fr 2fr;grid-template-rows:auto 1fr 1fr;gap:14px;height:100vh;box-sizing:border-box;padding:14px}.pv-bar{grid-column:1/-1;display:flex;gap:10px;align-items:center;font-family:var(--f-mono)}.pv-bar .pv-clock{font-size:28px;font-weight:600;margin-right:auto}.pv-bar button{font:inherit;padding:4px 12px}.pv-box{position:relative;min-height:0;display:flex;flex-direction:column;gap:6px}.pv-box h3{margin:0;font:600 12px var(--f-mono);text-transform:uppercase;letter-spacing:.08em;color:var(--muted)}.pv-frame{position:relative;flex:1;min-height:0;overflow:hidden}.pv-frame .pv-scale{position:absolute;left:0;top:0;width:1280px;height:720px;transform-origin:0 0}.pv-cur{grid-row:2/4}.pv-notes{overflow:auto;background:var(--card);border:1.5px solid var(--line);border-radius:10px;padding:14px 18px;font-size:22px;line-height:1.5;white-space:pre-wrap}.pv-end{display:flex;align-items:center;justify-content:center;height:100%;color:var(--muted);border:1.5px dashed var(--line);border-radius:8px}';
function presenterFrame(doc,slide,index,total){
 const frame=doc.createElement('div');frame.className='pv-frame';
 if(!slide){const end=doc.createElement('div');end.className='pv-end';end.textContent='Fin de la presentación';frame.append(end);return frame}
 const scale=doc.createElement('div');scale.className='pv-scale';scale.append(doc.importNode(buildSlide(slide,index,total,{answers:{},done:{}},()=>{}).root,true));frame.append(scale);return frame;
}
function fitPresenter(){const w=presenter.win;if(!w||w.closed)return;w.document.querySelectorAll('.pv-frame').forEach(f=>{const sc=f.querySelector('.pv-scale');if(sc)sc.style.transform=`scale(${Math.min(f.clientWidth/1280,f.clientHeight/720)})`})}
function paintClock(){const w=presenter.win;if(!w||w.closed){clearInterval(presenter.tick);return}const t=Math.floor((Date.now()-presenter.start)/1000);w.document.getElementById('pvClock').textContent=`${String(Math.floor(t/60)).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`}
function updatePresenter(){
 const w=presenter.win;if(!w||w.closed)return;const d=w.document,slides=activeSlides(),i=state.index;
 d.documentElement.dataset.theme=document.documentElement.dataset.theme||'';if(!document.documentElement.dataset.theme)delete d.documentElement.dataset.theme;
 d.getElementById('pvCounter').textContent=`${i+1} / ${slides.length}`;
 d.getElementById('pvCurrent').replaceChildren(d.createElement('h3'),presenterFrame(d,slides[i],i,slides.length));d.querySelector('#pvCurrent h3').textContent='Ahora · '+slides[i].title;
 d.getElementById('pvNext').replaceChildren(d.createElement('h3'),presenterFrame(d,slides[i+1],i+1,slides.length));d.querySelector('#pvNext h3').textContent='Siguiente';
 d.getElementById('pvNotes').textContent=slides[i].notes||'No hay notas para esta diapositiva.';
 requestAnimationFrame(fitPresenter);
}
function openPresenter(){
 if(presenter.win&&!presenter.win.closed){presenter.win.focus();return}
 const w=window.open('','ponente-'+state.deck.meta.id,'width=1200,height=760');
 if(!w){$('status').textContent='El navegador ha bloqueado la ventana del ponente; permite las ventanas emergentes.';return}
 presenter.win=w;presenter.start=Date.now();const d=w.document;
 d.open();d.write('<!doctype html><html><head><meta charset="utf-8"><title></title></head><body class="presenter"></body></html>');d.close();
 d.documentElement.lang=document.documentElement.lang;d.title='Vista del ponente · '+state.deck.meta.title;
 document.querySelectorAll('link[rel=stylesheet]:not([data-editor-asset]),style').forEach(n=>{const c=d.importNode(n,true);if(c.tagName==='LINK')c.href=n.href;d.head.append(c)});
 const style=d.createElement('style');style.textContent=PRESENTER_CSS;d.head.append(style);
 const grid=d.createElement('div');grid.className='pv-grid';
 grid.innerHTML='<div class="pv-bar"><span class="pv-clock" id="pvClock" aria-label="Tiempo transcurrido">00:00</span><span id="pvCounter"></span><button id="pvPrev" aria-label="Anterior">←</button><button id="pvNext2" aria-label="Siguiente">→</button><button id="pvReset">Reiniciar tiempo</button></div><section class="pv-box pv-cur" id="pvCurrent"></section><section class="pv-box" id="pvNext"></section><section class="pv-box"><h3>Notas</h3><div class="pv-notes" id="pvNotes" aria-live="polite"></div></section>';
 d.body.append(grid);
 d.getElementById('pvPrev').onclick=backward;d.getElementById('pvNext2').onclick=forward;d.getElementById('pvReset').onclick=()=>{presenter.start=Date.now();paintClock()};
 w.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='PageDown'||e.key===' '){e.preventDefault();forward()}else if(e.key==='ArrowLeft'||e.key==='PageUp'){e.preventDefault();backward()}else if(e.key==='Escape')w.close()});
 w.addEventListener('resize',fitPresenter);
 clearInterval(presenter.tick);presenter.tick=setInterval(paintClock,1000);
 updatePresenter();paintClock();
}
/* ---------- Impresión / PDF: todas las diapositivas activas, una por página, en tema claro ---------- */
let printTheme=null;
function beforePrint(){
 const host=node('div');host.id='printDeck';const slides=activeSlides();
 slides.forEach((s,i)=>host.append(buildSlide(s,i,slides.length,{answers:{},done:{}},()=>{}).root));
 document.getElementById('printDeck')?.remove();document.body.append(host);
 printTheme=document.documentElement.dataset.theme??null;document.documentElement.dataset.theme='light';
}
function afterPrint(){document.getElementById('printDeck')?.remove();if(printTheme===null)delete document.documentElement.dataset.theme;else document.documentElement.dataset.theme=printTheme;printTheme=null}
function forward(){jump(state.index+1)}
function backward(){jump(state.index-1)}function jump(i){if(i<0||i>=activeSlides().length)return;state.index=i;render();closePanels()}
function closePanels(){['indexPanel','notesPanel'].forEach(id=>$(id).hidden=true)}
function toggle(id){const target=$(id);const was=target.hidden;closePanels();target.hidden=!was;if(was)target.querySelector('button')?.focus()}
function buildIndex(){
 const nav=$('indexList');nav.replaceChildren();const groups=new Map();
 activeSlides().forEach((s,i)=>{
   const name=s.chapter||'Inicio';
   if(!groups.has(name)){const card=node('section','ob index-card');card.append(node('h4',null,name));nav.append(card);groups.set(name,card)}
   const b=node('button');b.append(node('small',null,i+1),node('span',null,s.title));b.setAttribute('aria-current',String(i===state.index));b.onclick=()=>jump(i);groups.get(name).append(b)
 })
}
function setupTimer(min){clearInterval(state.timer);state.timer=null;state.timerRunning=false;$('timer').hidden=!min;state.timerSecs=Math.round(Number(min||0)*60);$('timerToggle').textContent='Iniciar';paintTimer()}
function paintTimer(){const m=Math.floor(state.timerSecs/60),s=state.timerSecs%60;$('timerDisplay').textContent=`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`}
function toggleTimer(){if(state.timerRunning){clearInterval(state.timer);state.timerRunning=false;$('timerToggle').textContent='Continuar'}else{state.timerRunning=true;$('timerToggle').textContent='Pausa';state.timer=setInterval(()=>{if(state.timerSecs>0){state.timerSecs--;paintTimer()}else{clearInterval(state.timer);state.timerRunning=false;$('timerToggle').textContent='Terminado';$('status').textContent='Tiempo finalizado'}},1000)}}
function bind(){ $('prevBtn').addEventListener('click',backward);$('nextBtn').addEventListener('click',forward);$('indexBtn').addEventListener('click',()=>{buildIndex();toggle('indexPanel')});$('notesBtn').addEventListener('click',()=>toggle('notesPanel'));$('themeBtn').addEventListener('click',toggleTheme);$('presenterBtn').addEventListener('click',openPresenter);$('fullscreenBtn').addEventListener('click',()=>{if(!document.fullscreenElement)document.documentElement.requestFullscreen?.();else document.exitFullscreen?.()});document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>$(b.dataset.close).hidden=true));$('timerToggle').addEventListener('click',toggleTimer);$('timerPlus').addEventListener('click',()=>{state.timerSecs+=60;paintTimer()});$('timerClose').addEventListener('click',()=>{clearInterval(state.timer);state.timerRunning=false;$('timer').hidden=true});
document.addEventListener('keydown',e=>{if(e.altKey||e.ctrlKey||e.metaKey||/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)||e.target.isContentEditable)return;if(e.key==='Escape'){closePanels();return}if(!['indexPanel','notesPanel'].every(id=>$(id).hidden))return;const key=e.key.toLowerCase();if(e.key==='ArrowRight'||e.key==='PageDown'||e.key===' '){e.preventDefault();forward()}else if(e.key==='ArrowLeft'||e.key==='PageUp'){e.preventDefault();backward()}else if(e.key==='Home'){e.preventDefault();jump(0)}else if(e.key==='End'){e.preventDefault();jump(activeSlides().length-1)}else if(key==='o'){buildIndex();toggle('indexPanel')}else if(key==='n')toggle('notesPanel');else if(key==='s')state.exerciseApi?.toggleSolution();else if(key==='t')toggleTheme();else if(key==='p')openPresenter();else if(key==='f')$('fullscreenBtn').click()});window.addEventListener('resize',fitSlide);window.addEventListener('beforeprint',beforePrint);window.addEventListener('afterprint',afterPrint);window.addEventListener('hashchange',()=>{const n=hashIndex();if(n!==null&&n!==state.index)jump(n)});window.addEventListener('beforeunload',()=>{if(presenter.win&&!presenter.win.closed)presenter.win.close()});bindSwipe();matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change',applyTheme);}
function hashIndex(){const m=/^#(\d+)$/.exec(location.hash);if(!m)return null;const n=Number(m[1])-1;return n>=0&&n<activeSlides().length?n:null}
/* Gestos táctiles: deslizar a izquierda/derecha cambia de diapositiva. */
function bindSwipe(){let x0=null,y0=0;const deck=$('deck');
 deck.addEventListener('touchstart',e=>{if(e.touches.length!==1||e.target.closest('input,textarea,select,button,[contenteditable="true"],[contenteditable="plaintext-only"]')){x0=null;return}x0=e.touches[0].clientX;y0=e.touches[0].clientY},{passive:true});
 deck.addEventListener('touchend',e=>{if(x0===null)return;const t=e.changedTouches[0],dx=t.clientX-x0,dy=t.clientY-y0;x0=null;if(Math.abs(dx)>60&&Math.abs(dx)>1.5*Math.abs(dy)){dx<0?forward():backward()}},{passive:true});
}
async function init(){try{const embedded=document.getElementById('embedded-deck');if(!embedded)throw Error('falta el contenido incrustado; genera la presentación con create_deck.py');state.deck=JSON.parse(embedded.textContent);if(window.SlidesEditorActive){try{const copy=localStorage.getItem('interactive-editor:'+state.deck.meta.id);if(copy){const draft=JSON.parse(copy);if(draft?.meta?.id===state.deck.meta.id&&Array.isArray(draft.slides))state.deck=draft}}catch(e){console.warn('No se pudo restaurar borrador',e)}}if(!Array.isArray(state.deck.slides)||!state.deck.slides.length)throw Error('La presentación no contiene slides');document.documentElement.lang=state.deck.meta.language||'es';applyTheme();state.storage='interactive-slides:'+state.deck.meta.id;try{const saved=JSON.parse(localStorage.getItem(state.storage)||'{}');state.data={answers:saved.answers||{},done:saved.done||{}}}catch(e){}bind();state.index=hashIndex()??0;render();window.dispatchEvent(new CustomEvent('slides:ready',{detail:{deck:state.deck}}))}catch(err){$('stage').textContent='No se pudo abrir la presentación: '+err.message+'.';console.error(err)}}
window.SlidesApp={
 getDeck:()=>state.deck,
 illustrations:Object.keys(ILLUSTRATIONS),
 updateLogos:(logos)=>{state.deck.meta.logos=logos;render()},
 updateMeta:(patch)=>{Object.assign(state.deck.meta,patch);if('theme' in patch){try{localStorage.removeItem(themeKey())}catch(e){}applyTheme()}render()},
 getCurrentSlide:()=>activeSlides()[state.index],
 updateSlide:(id,patch)=>{const slide=state.deck.slides.find(s=>s.id===id);if(!slide)return;Object.assign(slide,patch);Object.keys(patch).forEach(k=>{if(patch[k]===undefined)delete slide[k]});render()},
 setSlideEnabled:(id,enabled)=>{const slide=state.deck.slides.find(s=>s.id===id);if(!slide)return false;if(!enabled&&activeSlides().length<=1)return false;const current=activeSlides()[state.index]?.id;slide.disabled=!enabled;const currentIndex=activeSlides().findIndex(s=>s.id===current);state.index=currentIndex<0?Math.min(state.index,activeSlides().length-1):currentIndex;render();return true},
 goToSlideId:(id)=>{const i=activeSlides().findIndex(s=>s.id===id);if(i>=0)jump(i)},
 replaceDeck:(deck)=>{if(!deck?.meta?.id||!Array.isArray(deck.slides)||!deck.slides.some(s=>!s.disabled))throw Error('JSON inválido o sin diapositivas activas');state.deck=deck;state.index=0;document.documentElement.lang=deck.meta.language||'es';applyTheme();state.storage='interactive-slides:'+deck.meta.id;render()},
 render
};
init();
})();
