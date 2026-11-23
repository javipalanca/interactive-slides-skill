(function(){'use strict';
const $=id=>document.getElementById(id);const prefersReduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const state={deck:null,index:0,revealCount:0,exerciseApi:null,storage:null,data:{answers:{},done:{}},timer:null,timerSecs:0,timerRunning:false};
function node(tag,cls,value){const el=document.createElement(tag);if(cls)el.className=cls;if(value!=null)el.textContent=String(value);return el}
function persist(){try{localStorage.setItem(state.storage,JSON.stringify(state.data))}catch(e){$('status').textContent='El navegador no permite guardar el progreso.'}updateProgress()}
function activeSlides(){return state.deck.slides.filter(s=>!s.disabled)}
function updateProgress(){const exs=activeSlides().filter(s=>s.exercise).length;const completed=Object.values(state.data.done).filter(Boolean).length;$('completion').textContent=exs?`${completed} / ${exs} actividades hechas`:''}
function paragraphs(value,root,reveal){(Array.isArray(value)?value:[value]).filter(Boolean).forEach(t=>{const el=node('p',null,t);if(reveal)el.setAttribute('data-reveal','');root.append(el)})}
function renderLogos(){
 const box=$('presentationLogos');if(!box)return;box.replaceChildren();
 const logos=state.deck.meta.logos||[];
 logos.forEach(logo=>{const img=node('img');img.src=logo.src;img.alt=logo.alt||'Logotipo';img.decoding='async';box.append(img)});
 box.hidden=!logos.length;
}
function fitSlide(root){
 const deck=$('deck');
 document.documentElement.style.setProperty('--s',Math.min(deck.clientWidth/1280,deck.clientHeight/720));
}
const DIVIDER_ICON="<svg class=\"icon\" viewBox=\"0 0 76 76\" aria-hidden=\"true\"><path d=\"M38 10a20 20 0 0 1 12 36v8H26v-8a20 20 0 0 1 12-36z\" fill=\"var(--orange-soft)\" stroke=\"var(--orange)\" stroke-width=\"4\" stroke-linejoin=\"round\"/><path d=\"M28 62h20M31 70h14\" stroke=\"var(--ink)\" stroke-width=\"4\" stroke-linecap=\"round\"/></svg>";
const COVER_DRAWING="<svg class=\"doodle\" style=\"right:70px;top:56px\" width=\"320\" height=\"270\" viewBox=\"0 0 320 270\" aria-hidden=\"true\">\n    <path d=\"M50 60h70l18 24h102v140H50z\" fill=\"var(--card)\" stroke=\"var(--ink)\" stroke-width=\"3\" stroke-linejoin=\"round\"/>\n    <text x=\"72\" y=\"122\" font-family=\"JetBrains Mono, monospace\" font-size=\"17\" fill=\"var(--orange)\" font-weight=\"600\">Agente</text>\n    <text x=\"72\" y=\"148\" font-family=\"JetBrains Mono, monospace\" font-size=\"14\" fill=\"var(--blue)\">identidad</text>\n    <text x=\"72\" y=\"172\" font-family=\"JetBrains Mono, monospace\" font-size=\"14\" fill=\"var(--orange-ink)\">buz\u00f3n</text>\n    <text x=\"72\" y=\"196\" font-family=\"JetBrains Mono, monospace\" font-size=\"14\" fill=\"var(--good)\">conductas</text>\n    <path d=\"M270 26l6 14 15 2-11 10 3 15-13-8-13 8 3-15-11-10 15-2z\" fill=\"none\" stroke=\"var(--orange)\" stroke-width=\"2.5\" stroke-linejoin=\"round\"/>\n    <path d=\"M14 246c20-18 32 10 50-8s28 6 44-6\" fill=\"none\" stroke=\"var(--orange)\" stroke-width=\"3\" stroke-linecap=\"round\"/>\n  </svg>";
function render(){const slides=activeSlides();if(!slides.length)return;state.index=Math.max(0,Math.min(state.index,slides.length-1));const slide=slides[state.index];state.revealCount=0;state.exerciseApi=null;document.title=`${slide.title} · ${state.deck.meta.title}`;const root=node('article',`slide ${slide.type||'content'}`);root.classList.add('on');
if(slide.type==='section'){root.classList.add('divider');root.append(node('div','big',(slide.chapter||'').slice(0,1)));root.insertAdjacentHTML('beforeend',DIVIDER_ICON)}
if(slide.type==='cover')root.insertAdjacentHTML('beforeend',COVER_DRAWING);
if(slide.exercise)root.classList.add('exs');
root.setAttribute('aria-label',slide.title);if(slide.eyebrow)root.append(node('div','kick eyebrow',slide.eyebrow));const title=node(slide.type==='cover'?'h1':'h2',null,slide.title);
if(slide.type==='cover'){
 const words=slide.title.split(' ');
 if(words.length>2){const accent=words.splice(-2).join(' ');title.textContent=words.join(' ')+' ';title.append(node('em','title-accent',accent))}
}
root.append(title);if(slide.subtitle)root.append(node('p','lead subtitle',slide.subtitle));if(slide.body){const body=node('div','body');paragraphs(slide.body,body,slide.reveal);root.append(body)}if(slide.bullets){const list=node('ul','bullets');slide.bullets.forEach(item=>{const li=node('li',null,item);if(slide.reveal)li.setAttribute('data-reveal','');list.append(li)});root.append(list)}if(slide.callout){const box=node('aside','hand callout',slide.callout);if(slide.reveal)box.setAttribute('data-reveal','');root.append(box)}
 if(slide.code)root.append(node('pre','snip code-example',slide.code));
root.dataset.layout=slide.layout||'';
root.dataset.initial=(slide.chapter||'').slice(0,1);
const foot=node('div','foot page-foot');foot.append(node('b',null,slide.chapter),node('span',null,(state.index+1)+' / '+slides.length));root.append(foot);
if(slide.exercise)state.exerciseApi=SlidesExercises.mount(slide.exercise,root,state.data,persist);
if(slide.solution&&!slide.exercise){const button=node('button',null,'Ver solución');const answer=node('div','solution',slide.solution);answer.hidden=true;button.addEventListener('click',()=>{answer.hidden=!answer.hidden;button.textContent=answer.hidden?'Ver solución':'Ocultar solución'});root.append(button,answer);state.exerciseApi={toggleSolution:()=>button.click()}}
 $('stage').replaceChildren(root);$('stage').scrollTop=0;requestAnimationFrame(()=>fitSlide(root));renderLogos();$('chapter').textContent=slide.chapter||'';$('brand').textContent=state.deck.meta.title;$('counter').textContent=`${state.index+1} / ${slides.length}`;$('progressBar').style.width=`${(state.index+1)/slides.length*100}%`;$('prevBtn').disabled=state.index===0;$('nextBtn').disabled=state.index===slides.length-1;$('notesBody').textContent=slide.notes||'No hay notas para esta diapositiva.';updateProgress();setupTimer(slide.exercise?.minutes);$('status').textContent=`Diapositiva ${state.index+1}: ${slide.title}`;window.dispatchEvent(new CustomEvent('slides:render',{detail:{slide,index:state.index}}));}
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
function bind(){ $('prevBtn').addEventListener('click',backward);$('nextBtn').addEventListener('click',forward);$('indexBtn').addEventListener('click',()=>{buildIndex();toggle('indexPanel')});$('notesBtn').addEventListener('click',()=>toggle('notesPanel'));$('fullscreenBtn').addEventListener('click',()=>{if(!document.fullscreenElement)document.documentElement.requestFullscreen?.();else document.exitFullscreen?.()});document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>$(b.dataset.close).hidden=true));$('timerToggle').addEventListener('click',toggleTimer);$('timerPlus').addEventListener('click',()=>{state.timerSecs+=60;paintTimer()});$('timerClose').addEventListener('click',()=>{clearInterval(state.timer);state.timerRunning=false;$('timer').hidden=true});
document.addEventListener('keydown',e=>{if(e.altKey||e.ctrlKey||e.metaKey||/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)||e.target.isContentEditable)return;if(e.key==='Escape'){closePanels();return}if(!['indexPanel','notesPanel'].every(id=>$(id).hidden))return;const key=e.key.toLowerCase();if(e.key==='ArrowRight'||e.key==='PageDown'||e.key===' '){e.preventDefault();forward()}else if(e.key==='ArrowLeft'||e.key==='PageUp'){e.preventDefault();backward()}else if(e.key==='Home'){e.preventDefault();jump(0)}else if(e.key==='End'){e.preventDefault();jump(activeSlides().length-1)}else if(key==='o'){buildIndex();toggle('indexPanel')}else if(key==='n')toggle('notesPanel');else if(key==='s')state.exerciseApi?.toggleSolution();else if(key==='f')$('fullscreenBtn').click()});window.addEventListener('resize',()=>fitSlide(document.querySelector('#stage .slide')));}
async function init(){try{const embedded=document.getElementById('embedded-deck');if(embedded){state.deck=JSON.parse(embedded.textContent)}else{const res=await fetch('assets/content.json');if(!res.ok)throw Error(`HTTP ${res.status}`);state.deck=await res.json()} if(window.SlidesEditorActive){try{const copy=localStorage.getItem('interactive-editor:'+state.deck.meta.id);if(copy){const draft=JSON.parse(copy);if(draft?.meta?.id===state.deck.meta.id&&Array.isArray(draft.slides))state.deck=draft}}catch(e){console.warn('No se pudo restaurar borrador',e)}}if(!Array.isArray(state.deck.slides)||!state.deck.slides.length)throw Error('La presentación no contiene slides');document.documentElement.lang=state.deck.meta.language||'es';document.documentElement.dataset.theme='light';state.storage='interactive-slides:'+state.deck.meta.id;try{const saved=JSON.parse(localStorage.getItem(state.storage)||'{}');state.data={answers:saved.answers||{},done:saved.done||{}}}catch(e){}bind();render();window.dispatchEvent(new CustomEvent('slides:ready',{detail:{deck:state.deck}}))}catch(err){$('stage').textContent='No se pudo abrir la presentación: '+err.message+'. Abre el index.html generado o sirve la carpeta por HTTP.';console.error(err)}}
window.SlidesApp={
 getDeck:()=>state.deck,
 updateLogos:(logos)=>{state.deck.meta.logos=logos;render()},
 getCurrentSlide:()=>activeSlides()[state.index],
 updateSlide:(id,patch)=>{const slide=state.deck.slides.find(s=>s.id===id);if(!slide)return;Object.assign(slide,patch);render()},
 setSlideEnabled:(id,enabled)=>{const slide=state.deck.slides.find(s=>s.id===id);if(!slide)return false;if(!enabled&&activeSlides().length<=1)return false;const current=activeSlides()[state.index]?.id;slide.disabled=!enabled;const currentIndex=activeSlides().findIndex(s=>s.id===current);state.index=currentIndex<0?Math.min(state.index,activeSlides().length-1):currentIndex;render();return true},
 goToSlideId:(id)=>{const i=activeSlides().findIndex(s=>s.id===id);if(i>=0)jump(i)},
 replaceDeck:(deck)=>{if(!deck?.meta?.id||!Array.isArray(deck.slides)||!deck.slides.some(s=>!s.disabled))throw Error('JSON inválido o sin diapositivas activas');state.deck=deck;state.index=0;document.documentElement.lang=deck.meta.language||'es';document.documentElement.dataset.theme='light';state.storage='interactive-slides:'+deck.meta.id;render()},
 render
};
init();
})();
