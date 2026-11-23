/* Draft-only authoring layer. Never included in published HTML. */
(function(){'use strict';
window.SlidesEditorActive=true;
const $=id=>document.getElementById(id);
const app=()=>window.SlidesApp;
let selected=null;
let originalDeck=null;
const editedFields=['slideTitle','slideSubtitle','slideBody','slideBullets','slideCallout','slideNotes'];
const MAX_LOGO_BYTES=5*1024*1024;
const ALLOWED_LOGOS=new Set(['image/png','image/jpeg','image/webp','image/gif']);
function logos(){return app().getDeck().meta.logos||[]}
function renderLogoEditor(){
 const container=$('logoEditorList');container.replaceChildren();
 if(!logos().length){const p=document.createElement('p');p.className='logo-editor-empty';p.textContent='Sin logos: no aparecerá ningún hueco en la presentación.';container.append(p);return}
 logos().forEach((logo,index)=>{
  const row=document.createElement('div');row.className='logo-editor-row';
  const img=document.createElement('img');img.src=logo.src;img.alt=logo.alt||'Vista previa';
  const input=document.createElement('input');input.type='text';input.value=logo.alt||'';input.setAttribute('aria-label',`Texto alternativo del logo ${index+1}`);input.placeholder='Texto alternativo';
  input.addEventListener('change',()=>{const next=logos().map(x=>({...x}));next[index].alt=input.value.trim()||`Logotipo ${index+1}`;app().updateLogos(next);save()});
  const remove=document.createElement('button');remove.type='button';remove.textContent='Quitar';remove.setAttribute('aria-label',`Quitar logo ${index+1}`);remove.addEventListener('click',()=>{app().updateLogos(logos().filter((_,i)=>i!==index));save();renderLogoEditor()});
  row.append(img,input,remove);container.append(row)
 });
}
function readAsDataURL(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onerror=()=>reject(Error('No se puede leer '+file.name));reader.onload=()=>resolve(reader.result);reader.readAsDataURL(file)})}
async function uploadLogos(){
 const input=$('logoUpload'), files=[...input.files];input.value='';if(!files.length)return;
 if(logos().length+files.length>3){message('La presentación admite como máximo tres logos.');return}
 try{
  const newLogos=[];
  for(const file of files){if(!ALLOWED_LOGOS.has(file.type))throw Error('Formato no admitido: '+file.name);if(file.size>MAX_LOGO_BYTES)throw Error('Logo demasiado grande (máximo 5 MiB): '+file.name);newLogos.push({src:await readAsDataURL(file),alt:file.name.replace(/\.[^.]+$/,'')})}
  app().updateLogos([...logos(),...newLogos]);save();renderLogoEditor();message('Logotipos añadidos y embebidos en el borrador.');
 }catch(e){message(e.message)}
}
const fields={slideTitle:'title',slideSubtitle:'subtitle',slideBody:'body',slideBullets:'bullets',slideCallout:'callout',slideNotes:'notes'};
function selectedSlide(){return app()?.getDeck()?.slides.find(s=>s.id===selected)}
function save(){const deck=app().getDeck();try{localStorage.setItem('interactive-editor:'+deck.meta.id,JSON.stringify(deck));message('Cambios guardados en este navegador.')}catch(e){message('No se pudo guardar automáticamente. Descarga el borrador JSON.')}}
function message(msg){$('editorMessage').textContent=msg}
function download(filename,content,mime){const blob=new Blob([content],{type:mime});const href=URL.createObjectURL(blob);const a=document.createElement('a');a.href=href;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(href),10000)}
function filename(){return (app().getDeck().meta.id||'presentacion').replace(/[^a-z0-9_-]/gi,'-')}
function populate(){const deck=app().getDeck(),list=$('slidePicker');list.replaceChildren();deck.slides.forEach((s,i)=>{const op=document.createElement('option');op.value=s.id;op.textContent=`${i+1}. ${s.disabled?'[Oculta] ':''}${s.title}`;list.append(op)});const s=selectedSlide();if(!s)return;list.value=s.id;$('slideEnabled').checked=!s.disabled;$('slideTitle').value=s.title||'';$('slideSubtitle').value=s.subtitle||'';$('slideBody').value=Array.isArray(s.body)?s.body.join('\n'):s.body||'';$('slideBullets').value=(s.bullets||[]).join('\n');$('slideCallout').value=s.callout||'';$('slideNotes').value=s.notes||'';$('exerciseJson').value=s.exercise?JSON.stringify(s.exercise,null,2):'';renderLogoEditor()}
function setFields(){const s=selectedSlide();if(!s)return;const patch={};for(const id of editedFields){let value=$(id).value;const field=fields[id];if(field==='bullets')value=value.split('\n').map(x=>x.trim()).filter(Boolean);else if(field==='body')value=value.split('\n').map(x=>x.trim()).filter(Boolean);patch[field]=value}app().updateSlide(s.id,patch);save();populate()}
function enableInline(){if($('editorPanel').hidden)return;const current=app().getCurrentSlide();if(!current)return;const root=$('stage').querySelector('.slide');if(!root)return;const targets=[['h1','title'],['.subtitle','subtitle'],['.eyebrow','eyebrow'],['.callout','callout']];for(const [selector,field] of targets){const el=root.querySelector(selector);if(el)attach(el,field)}root.querySelectorAll('.body p').forEach((el,i)=>attach(el,'body',i));root.querySelectorAll('.bullets li').forEach((el,i)=>attach(el,'bullets',i));}
function attach(el,field,index){el.contentEditable='true';el.dataset.editField=field;el.setAttribute('role','textbox');el.setAttribute('aria-label',`Editar ${field}`);el.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();el.blur()}});el.addEventListener('blur',()=>{const s=app().getCurrentSlide();if(!s)return;const patch={};const val=el.textContent.trim();if(index===undefined)patch[field]=val;else{const values=Array.isArray(s[field])?[...s[field]]:[s[field]||''];values[index]=val;patch[field]=values}app().updateSlide(s.id,patch);save();populate()},{once:true})}
function toggleEditor(force){const show=force===undefined?$('editorPanel').hidden:force;$('editorPanel').hidden=!show;document.body.classList.toggle('editor-open',show);if(show){selected=app()?.getCurrentSlide()?.id||selected;populate();enableInline()}else $('stage').querySelectorAll('[data-edit-field]').forEach(el=>{el.removeAttribute('contenteditable');el.removeAttribute('data-edit-field');el.removeAttribute('role')})}
function safeScript(s){return s.replace(/<\/script/gi,'<\\/script')}
function publishedRuntime(source){
  // Remove the draft loader, local editorial state and editor API from the published runtime.
  const start=source.indexOf("const embedded=document.getElementById('embedded-deck');");
  const end=source.indexOf("if(!Array.isArray(state.deck.slides)",start);
  if(start<0||end<0)throw Error('No se pudo localizar el cargador de contenido');
  source=source.slice(0,start)+"state.deck=JSON.parse(document.getElementById('embedded-deck').textContent);"+source.slice(end);
  const beginAPI=source.indexOf('window.SlidesApp={');
  const endAPI=source.indexOf('init();',beginAPI);
  if(beginAPI<0||endAPI<0)throw Error('No se pudo identificar la API editorial');
  source=source.slice(0,beginAPI)+source.slice(endAPI);
  source=source.replace(/window\.dispatchEvent\(new CustomEvent\('slides:render',[^;]+;\s*/g,'');
  return source;
}
function validateLogos(data){
 const logos=data.meta.logos||[];
 if(!Array.isArray(logos)||logos.length>3)throw Error('Debe haber entre cero y tres logos');
 for(const logo of logos){
  if(!logo||typeof logo.src!=='string'||!/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/.test(logo.src))throw Error('Los logos deben estar incrustados en Base64 (PNG, JPEG, WebP o GIF).');
  if(typeof logo.alt!=='string'||!logo.alt.trim())throw Error('Cada logo necesita texto alternativo');
  if(logo.src.length>Math.ceil(MAX_LOGO_BYTES*4/3)+128)throw Error('Logo de tamaño excesivo');
 }
}
function validateForPublishing(slides){
  const ids=new Set(),questions=new Set();
  for(const s of slides){
    if(!s.id||ids.has(s.id))throw Error('ID de diapositiva duplicado o vacío: '+s.id);
    ids.add(s.id);
    if(!s.title||!s.title.trim())throw Error('Diapositiva sin título: '+s.id);
    const e=s.exercise;if(!e)continue;
    if(!e.id||questions.has(e.id)||!['single','multiple','text','number'].includes(e.type)||!e.prompt)throw Error('Ejercicio inválido en '+s.id);
    questions.add(e.id);
    if(['single','multiple'].includes(e.type)){
      const choices=new Set((e.options||[]).map(o=>o.value));
      if(choices.size<2||choices.size!==(e.options||[]).length)throw Error('Opciones inválidas en '+s.id);
      const answers=Array.isArray(e.answer)?e.answer:[e.answer];
      if(!answers.length||answers.some(a=>!choices.has(a))||(e.type==='single'&&answers.length!==1))throw Error('Respuesta no disponible en '+s.id);
    }
    if(e.type==='text'&&(e.answer===undefined||e.answer===''))throw Error('Respuesta de texto ausente: '+s.id);
    if(e.type==='number'&&(!Number.isFinite(Number(e.answer))||Number(e.tolerance??0)<0))throw Error('Respuesta numérica inválida: '+s.id);
  }
}
async function publish(){const enabled=app().getDeck().slides.filter(s=>!s.disabled);if(!enabled.length){message('Debe existir al menos una diapositiva activa.');return}
const button=$('publishBtn');button.disabled=true;button.textContent='Preparando HTML…';try{
  validateForPublishing(enabled);validateLogos(app().getDeck());
  const base=document.documentElement.cloneNode(true);
  base.querySelectorAll('.editor-control,[data-editor-asset]').forEach(el=>el.remove());
  base.querySelector('#stage').replaceChildren();base.querySelector('#presentationLogos').replaceChildren();base.querySelector('#presentationLogos').hidden=true;
  base.querySelectorAll('[data-edit-field],[contenteditable]').forEach(el=>{el.removeAttribute('data-edit-field');el.removeAttribute('contenteditable')});
  base.querySelector('body').classList.remove('editor-open');
  base.querySelector('#indexList').replaceChildren();
  base.querySelector('#notesBody').replaceChildren();
  base.querySelector('#brand').textContent='Presentación';base.querySelector('#chapter').textContent='';base.querySelector('#counter').textContent='1 / 1';base.querySelector('#completion').textContent='';base.querySelector('#progressBar').style.width='0%';
  base.querySelector('#indexPanel').hidden=true;base.querySelector('#notesPanel').hidden=true;base.querySelector('#timer').hidden=true;
  base.querySelectorAll('script[src]').forEach(el=>el.remove());
  const cssLink=base.querySelector('link[href="assets/slides.css"]');if(!cssLink)throw Error('No se encontró la hoja CSS');
  const files=await Promise.all(['assets/slides.css','assets/exercises.js','assets/slides.js'].map(async path=>{const res=await fetch(path);if(!res.ok)throw Error('No se pudo cargar '+path);return res.text()}));
  if(/@import\b|url\s*\(/i.test(files[0]))throw Error('El CSS contiene dependencias url() o @import; incrústalas antes de publicar');
  const css=document.createElement('style');css.textContent=files[0];cssLink.replaceWith(css);
  const data=JSON.parse(JSON.stringify(app().getDeck()));data.slides=enabled.map(s=>{const out={...s};delete out.disabled;return out});
  const embedded=document.createElement('script');embedded.id='embedded-deck';embedded.type='application/json';embedded.textContent=JSON.stringify(data).replace(/</g,'\\u003c');base.querySelector('body').append(embedded);
  for(const js of [files[1],publishedRuntime(files[2])]){const script=document.createElement('script');script.textContent=safeScript(js);base.querySelector('body').append(script)}
  // Guard against accidental dependencies on remote or local paths in author content.
  const linked=base.querySelectorAll('link[href],script[src],img[src]:not([src^="data:"]),iframe[src],video[src],audio[src],source[src]');if(linked.length)throw Error('Quedan referencias externas o recursos sin incrustar.');
  const html='<!doctype html>\n'+base.outerHTML;download(filename()+'-definitiva.html',html,'text/html;charset=utf-8');message(`HTML publicado: ${enabled.length} diapositivas activas, sin controles ni código de edición.`);
}catch(e){message('No se pudo generar el HTML: '+e.message);console.error(e)}finally{button.disabled=false;button.textContent='Generar HTML definitivo'}}
function bind(){
  $('logoUpload').addEventListener('change',uploadLogos);
  $('editorBtn').addEventListener('click',()=>toggleEditor());$('editorClose').addEventListener('click',()=>toggleEditor(false));
  $('slidePicker').addEventListener('change',()=>{selected=$('slidePicker').value;const s=selectedSlide();if(s&&!s.disabled)app().goToSlideId(s.id);populate()});
  $('slideEnabled').addEventListener('change',()=>{const s=selectedSlide();if(!s)return;const ok=app().setSlideEnabled(s.id,$('slideEnabled').checked);if(!ok){$('slideEnabled').checked=true;message('No puedes ocultar la última diapositiva activa.');return}save();populate()});
  editedFields.forEach(id=>$(id).addEventListener('change',setFields));
  $('exerciseApply').addEventListener('click',()=>{const s=selectedSlide();if(!s)return;try{const text=$('exerciseJson').value.trim();const ex=text?JSON.parse(text):null;if(ex&&(!ex.type||!ex.id))throw Error('Faltan type o id');app().updateSlide(s.id,{exercise:ex});save();populate();message('Ejercicio actualizado.')}catch(e){message('JSON de ejercicio inválido: '+e.message)}});
  $('saveDraftBtn').addEventListener('click',()=>download(filename()+'-borrador.json',JSON.stringify(app().getDeck(),null,2)+'\n','application/json'));
  $('loadDraftBtn').addEventListener('click',()=>$('loadDraftFile').click());
  $('loadDraftFile').addEventListener('change',async()=>{const file=$('loadDraftFile').files[0];if(!file)return;try{const deck=JSON.parse(await file.text());if(deck.meta?.id!==originalDeck.meta.id)throw Error('El ID de la presentación no coincide');app().replaceDeck(deck);selected=app().getCurrentSlide().id;save();populate();message('Borrador importado.')}catch(e){message('No se pudo importar: '+e.message)}finally{$('loadDraftFile').value=''}});
  $('resetDraftBtn').addEventListener('click',()=>{if(!confirm('¿Descartar todos los cambios locales y restaurar la presentación original?'))return;localStorage.removeItem('interactive-editor:'+originalDeck.meta.id);app().replaceDeck(JSON.parse(JSON.stringify(originalDeck)));selected=app().getCurrentSlide().id;populate();message('Presentación original restaurada.')});
  $('publishBtn').addEventListener('click',publish);
  window.addEventListener('slides:render',()=>{if(!$('editorPanel').hidden){const current=app().getCurrentSlide();if(current&&!selectedSlide()?.disabled)selected=current.id;populate();enableInline()}});
}
window.addEventListener('slides:ready',async()=>{try{const res=await fetch('assets/content.json');originalDeck=await res.json()}catch(e){originalDeck=JSON.parse(JSON.stringify(app().getDeck()))}selected=app().getCurrentSlide()?.id;bind();populate()});
})();
