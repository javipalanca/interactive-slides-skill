/* Draft-only authoring layer. Never included in published HTML. */
(function(){'use strict';
window.SlidesEditorActive=true;
const $=id=>document.getElementById(id);
const app=()=>window.SlidesApp;
let selected=null;
let originalDeck=null;
const MAX_FILE_BYTES=5*1024*1024;
const MAX_DATA_URI=Math.ceil(MAX_FILE_BYTES*4/3)+128;
const LOGO_TYPES=new Set(['image/png','image/jpeg','image/webp','image/gif']);
const IMAGE_TYPES=new Set([...LOGO_TYPES,'image/svg+xml']);
const LOGO_URI=/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/;
const IMAGE_URI=/^data:image\/(png|jpeg|webp|gif|svg\+xml);base64,[A-Za-z0-9+/]+={0,2}$/;
const ILLUSTRATION_LABELS={general:'General (cuaderno)',ciencia:'Ciencia (laboratorio)',programacion:'Programación (código)',datos:'Datos (gráfica)',agentes:'Agentes',matematicas:'Matemáticas',comunicacion:'Comunicación (diálogo)'};

/* ---------- Validación: mismas reglas que scripts/validate_deck.py ---------- */
const TYPES=['cover','section','content','exercise','summary'];
const QTYPES=['single','multiple','text','number'];
const LAYOUTS=['','cards','split'];
const isText=v=>typeof v==='string'&&v.trim().length>0;
const isNum=v=>typeof v==='number'&&Number.isFinite(v);
function exerciseErrors(ex,label){
 const errors=[];
 if(!ex||typeof ex!=='object'||Array.isArray(ex))return [label+': exercise debe ser objeto'];
 if(!isText(ex.id))errors.push(label+': exercise.id vacío');
 if(!QTYPES.includes(ex.type))return errors.concat(label+': tipo de ejercicio no soportado');
 if(!isText(ex.prompt))errors.push(label+': prompt ausente');
 if(!isText(ex.explanation))errors.push(label+': explanation ausente');
 if(ex.type==='single'||ex.type==='multiple'){
  const opts=Array.isArray(ex.options)?ex.options:[];
  const values=opts.filter(o=>o&&typeof o==='object').map(o=>o.value);
  if(values.length<2||new Set(values).size!==values.length||values.some(v=>typeof v!=='string'))errors.push(label+': opciones inválidas o duplicadas');
  if(!Array.isArray(ex.options)||opts.some(o=>!o||typeof o!=='object'||!o.label))errors.push(label+': etiquetas de opciones ausentes');
  if(ex.type==='single'&&(typeof ex.answer!=='string'||!values.includes(ex.answer)))errors.push(label+': answer debe ser una opción válida');
  if(ex.type==='multiple'&&(!Array.isArray(ex.answer)||!ex.answer.length||ex.answer.some(a=>!values.includes(a))||new Set(ex.answer).size!==ex.answer.length))errors.push(label+': answer debe ser una lista de opciones válidas y únicas');
 }else if(ex.type==='text'){
  if(!(typeof ex.answer==='string'||(Array.isArray(ex.answer)&&ex.answer.length&&ex.answer.every(a=>typeof a==='string'))))errors.push(label+': respuesta textual no válida');
 }else if(ex.type==='number'){
  if(!isNum(ex.answer))errors.push(label+': answer debe ser numérico');
  const t=ex.tolerance??0;if(!isNum(t)||t<0)errors.push(label+': tolerance debe ser numérica y >= 0');
 }
 const m=ex.minutes??0;if(!isNum(m)||m<0)errors.push(label+': minutes debe ser >= 0');
 return errors;
}
function deckErrors(deck){
 const errors=[];const meta=deck?.meta;
 if(!meta||typeof meta!=='object'||!isText(meta.id)||!isText(meta.title))errors.push('meta.id y meta.title deben ser textos no vacíos');
 const logos=meta?.logos??[];
 if(!Array.isArray(logos)||logos.length>3)errors.push('meta.logos debe contener entre 0 y 3 logos');
 else logos.forEach((l,i)=>{if(!l||!isText(l.alt)||typeof l.src!=='string'||!LOGO_URI.test(l.src)||l.src.length>MAX_DATA_URI)errors.push(`logo ${i+1}: src debe ser Base64 (≤ 5 MiB) y alt texto no vacío`)});
 if(meta?.theme!==undefined&&!['light','dark','auto'].includes(meta.theme))errors.push('meta.theme debe ser light, dark o auto');
 if(meta?.slideSize!==undefined&&(!isNum(meta.slideSize)||meta.slideSize<50||meta.slideSize>100))errors.push('meta.slideSize debe ser un número entre 50 y 100');
 const slides=deck?.slides;
 if(!Array.isArray(slides)||!slides.length)return errors.concat('slides debe ser un array no vacío');
 const ids=new Set(),exids=new Set();
 slides.forEach((s,i)=>{
  const label='slide '+(i+1);
  if(!s||typeof s!=='object'){errors.push(label+': debe ser un objeto');return}
  if(!isText(s.id))errors.push(label+': id no válido');else if(ids.has(s.id))errors.push(label+': id repetido '+s.id);else ids.add(s.id);
  if(!isText(s.title))errors.push(label+': falta title');
  if(!TYPES.includes(s.type))errors.push(label+': type no válido: '+s.type);
  if(s.layout!==undefined&&!LAYOUTS.includes(s.layout))errors.push(label+': layout no válido: '+s.layout);
  if(s.image!==undefined&&(!s.image||!isText(s.image.alt)||typeof s.image.src!=='string'||!IMAGE_URI.test(s.image.src)||s.image.src.length>MAX_DATA_URI||(s.image.caption!==undefined&&typeof s.image.caption!=='string')))errors.push(label+': image necesita src en Base64 (PNG, JPEG, WebP, GIF o SVG; ≤ 5 MiB) y alt no vacío');
  if(s.image&&s.image.fit!==undefined&&!['contain','cover'].includes(s.image.fit))errors.push(label+': image.fit debe ser contain o cover');
  if(s.table!==undefined){const t=s.table,h=t?.headers;if(!t||!Array.isArray(h)||!h.length||h.some(x=>typeof x!=='string')||!Array.isArray(t.rows)||!t.rows.length||t.rows.some(r=>!Array.isArray(r)||r.length!==h.length||r.some(c=>typeof c!=='string'))||(t.caption!==undefined&&typeof t.caption!=='string'))errors.push(label+': table necesita headers (textos) y rows (filas de textos con tantas celdas como headers)')}
  if(s.illustration!==undefined&&!(typeof s.illustration==='string'&&(s.illustration==='none'||app().illustrations.includes(s.illustration)||(IMAGE_URI.test(s.illustration)&&s.illustration.length<=MAX_DATA_URI))))errors.push(label+': illustration debe ser una ilustración incluida, "none" o una imagen en Base64');
  if(s.type==='exercise'&&!s.exercise)errors.push(label+': exercise obligatorio');
  if(!s.exercise)return;
  errors.push(...exerciseErrors(s.exercise,label));
  const eid=s.exercise.id;if(isText(eid)){if(exids.has(eid))errors.push(label+': exercise.id repetido '+eid);else exids.add(eid)}
 });
 return errors;
}

/* ---------- Utilidades ---------- */
function selectedSlide(){return app()?.getDeck()?.slides.find(s=>s.id===selected)}
function save(){const deck=app().getDeck();try{localStorage.setItem('interactive-editor:'+deck.meta.id,JSON.stringify(deck));message('Cambios guardados en este navegador.')}catch(e){message('No se pudo guardar automáticamente. Descarga el borrador JSON.')}}
function message(msg){$('editorMessage').textContent=msg}
function download(filename,content,mime){const blob=new Blob([content],{type:mime});const href=URL.createObjectURL(blob);const a=document.createElement('a');a.href=href;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(href),10000)}
function filename(){return (app().getDeck().meta.id||'presentacion').replace(/[^a-z0-9_-]/gi,'-')}
function readAsDataURL(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onerror=()=>reject(Error('No se puede leer '+file.name));reader.onload=()=>resolve(reader.result);reader.readAsDataURL(file)})}
async function readImage(file,allowed){
 if(!allowed.has(file.type))throw Error('Formato no admitido: '+file.name);
 if(file.size>MAX_FILE_BYTES)throw Error('Archivo demasiado grande (máximo 5 MiB): '+file.name);
 return readAsDataURL(file);
}
const baseName=file=>file.name.replace(/\.[^.]+$/,'');

/* ---------- Logos ---------- */
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
async function uploadLogos(){
 const input=$('logoUpload'), files=[...input.files];input.value='';if(!files.length)return;
 if(logos().length+files.length>3){message('La presentación admite como máximo tres logos.');return}
 try{
  const newLogos=[];
  for(const file of files)newLogos.push({src:await readImage(file,LOGO_TYPES),alt:baseName(file)});
  app().updateLogos([...logos(),...newLogos]);save();renderLogoEditor();message('Logotipos añadidos y embebidos en el borrador.');
 }catch(e){message(e.message)}
}

/* ---------- Panel ---------- */
function populate(){
 const deck=app().getDeck(),list=$('slidePicker');list.replaceChildren();
 deck.slides.forEach((s,i)=>{const op=document.createElement('option');op.value=s.id;op.textContent=`${i+1}. ${s.disabled?'[Oculta] ':''}${s.title}`;list.append(op)});
 const size=deck.meta.slideSize??85;$('slideSize').value=size;$('slideSizeValue').textContent=size+'%';
 $('defaultTheme').value=deck.meta.theme||'light';
 renderLogoEditor();
 const s=selectedSlide();if(!s)return;
 list.value=s.id;$('slideEnabled').checked=!s.disabled;
 $('exerciseJson').value=s.exercise?JSON.stringify(s.exercise,null,2):'';
 $('coverOptions').hidden=s.type!=='cover';
 if(s.type==='cover'){
  const picker=$('illustrationPicker');picker.replaceChildren();
  const options=[...app().illustrations.map(k=>[k,ILLUSTRATION_LABELS[k]||k]),['none','Sin ilustración']];
  const value=s.illustration??'general';
  if(value.startsWith('data:'))options.unshift(['custom','Ilustración propia']);
  options.forEach(([v,l])=>{const op=document.createElement('option');op.value=v;op.textContent=l;picker.append(op)});
  picker.value=value.startsWith('data:')?'custom':value;
 }
 const preview=$('imagePreview');preview.replaceChildren();
 if(s.image){const img=document.createElement('img');img.src=s.image.src;img.alt='Vista previa';img.style.maxHeight='90px';img.style.objectFit='contain';preview.append(img)}
 else{const p=document.createElement('p');p.className='logo-editor-empty';p.textContent='Esta diapositiva no tiene imagen.';preview.append(p)}
 $('imageAlt').value=s.image?.alt||'';$('imageCaption').value=s.image?.caption||'';$('imageSplit').checked=s.layout==='split';$('imageCover').checked=s.image?.fit==='cover';
 ['imageAlt','imageCaption','imageSplit','imageCover','imageRemove'].forEach(id=>$(id).disabled=!s.image);
}
function updateImage(patch){const s=selectedSlide();if(!s?.image)return;app().updateSlide(s.id,{image:{...s.image,...patch}});save();populate()}

/* ---------- Desbordamiento: el lienzo 16:9 no se desplaza, así que el contenido debe caber ---------- */
const isMobile=()=>matchMedia('(max-width:760px)').matches;
const clipped=el=>el.scrollHeight>el.clientHeight+2||el.scrollWidth>el.clientWidth+2;
/* Cuenta también los bloques con desplazamiento propio (código, tablas): si no caben, aparece una barra dentro del lienzo. */
function overflows(){const el=document.querySelector('#stage .slide');return !!el&&!isMobile()&&(clipped(el)||[...el.querySelectorAll('pre,.tablewrap')].some(clipped))}
const imagesReady=()=>Promise.all([...document.querySelectorAll('#stage img')].map(i=>i.decode().catch(()=>{})));
async function flagOverflow(){await imagesReady();const bad=overflows();$('overflowWarning').hidden=!bad;$('overflowWarning').title=bad?'El contenido no cabe en el lienzo 16:9: divide la diapositiva o reduce el texto.':''}
async function overflowingSlides(){
 if(isMobile())return null;const current=app().getCurrentSlide()?.id;const bad=[];
 for(const [i,s] of app().getDeck().slides.entries()){if(s.disabled)continue;app().goToSlideId(s.id);await imagesReady();if(overflows())bad.push(`${i+1}. ${s.title}`)}
 if(current)app().goToSlideId(current);return bad;
}

/* ---------- Edición in situ ---------- */
function enableInline(){
 const slide=app().getCurrentSlide();
 function edit(el,write){
   if(!el)return;
   el.contentEditable='plaintext-only';
   el.dataset.editField='true';
   el.oninput=()=>{write(el.textContent);save()};
 }
 for(const [selector,key] of [['h1,h2','title'],['.subtitle','subtitle'],['.eyebrow','eyebrow'],['.callout','callout'],['.code-example','code']])
   edit($('stage').querySelector(selector),v=>slide[key]=v);
 for(const [selector,key] of [['.body p','body'],['.bullets li','bullets']])
   $('stage').querySelectorAll(selector).forEach((el,i)=>edit(el,v=>{
     if(!Array.isArray(slide[key]))slide[key]=[slide[key]];
     slide[key][i]=v;
   }));
 edit($('stage').querySelector('figure.media figcaption'),v=>slide.image.caption=v);
 edit($('stage').querySelector('figure.data-table figcaption'),v=>slide.table.caption=v);
 $('stage').querySelectorAll('figure.data-table thead th').forEach((el,j)=>edit(el,v=>slide.table.headers[j]=v));
 $('stage').querySelectorAll('figure.data-table tbody tr').forEach((tr,i)=>tr.querySelectorAll('th,td').forEach((el,j)=>edit(el,v=>slide.table.rows[i][j]=v)));
 edit($('stage').querySelector('.prompt'),v=>slide.exercise.prompt=v);
 $('stage').querySelectorAll('.option span').forEach((el,i)=>edit(el,v=>slide.exercise.options[i].label=v));
 edit($('notesBody'),v=>slide.notes=v);
}
function toggleEditor(){
 const on=document.body.classList.toggle('inline-edit');
 $('editorBtn').textContent=on?'Terminar edición':'✎ Editar';
 $('editorBtn').setAttribute('aria-pressed',String(on));
 if(on){enableInline();$('stage').querySelector('h1,h2').focus()}
 else {document.querySelectorAll('[data-edit-field]').forEach(el=>{el.oninput=null;el.removeAttribute('contenteditable');delete el.dataset.editField});app().render()}
}

/* ---------- Publicación ---------- */
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
async function publish(){const enabled=app().getDeck().slides.filter(s=>!s.disabled);if(!enabled.length){message('Debe existir al menos una diapositiva activa.');return}
const button=$('publishBtn');button.disabled=true;button.textContent='Preparando HTML…';try{
  const data=JSON.parse(JSON.stringify(app().getDeck()));data.slides=enabled.map(s=>{const out=JSON.parse(JSON.stringify(s));delete out.disabled;return out});
  const errors=deckErrors(data);if(errors.length)throw Error(errors.slice(0,5).join('; ')+(errors.length>5?` (y ${errors.length-5} más)`:''));
  const base=document.documentElement.cloneNode(true);
  base.removeAttribute('style');base.removeAttribute('data-theme');
  base.querySelectorAll('.editor-control,[data-editor-asset]').forEach(el=>el.remove());
  base.querySelector('#stage').replaceChildren();base.querySelector('#presentationLogos').replaceChildren();base.querySelector('#presentationLogos').hidden=true;
  base.querySelectorAll('[data-edit-field],[contenteditable]').forEach(el=>{el.removeAttribute('data-edit-field');el.removeAttribute('contenteditable')});
  base.querySelector('body').classList.remove('editor-open','inline-edit');
  base.querySelector('#indexList').replaceChildren();
  base.querySelector('#notesBody').replaceChildren();
  base.querySelector('#brand').textContent='Presentación';base.querySelector('#chapter').textContent='';base.querySelector('#counter').textContent='1 / 1';base.querySelector('#completion').textContent='';base.querySelector('#progressBar').style.width='0%';
  base.querySelector('#indexPanel').hidden=true;base.querySelector('#notesPanel').hidden=true;base.querySelector('#timer').hidden=true;
  base.querySelectorAll('script[src],#embedded-deck,#embedded-publish-resources').forEach(el=>el.remove());
  const cssLink=base.querySelector('link[href="assets/slides.css"],style[data-runtime-style]');if(!cssLink)throw Error('No se encontró la hoja CSS');
  const resources=document.getElementById('embedded-publish-resources');
  if(!resources)throw Error('No se encontró el paquete local para publicar');
  const bundle=JSON.parse(resources.textContent);
  const files=[bundle.css,bundle.exercises,bundle.slides];
  if(/@import\b|url\s*\(\s*(?!["']?data:)/i.test(files[0]))throw Error('El CSS contiene dependencias url() o @import; incrústalas antes de publicar');
  const css=document.createElement('style');css.textContent=files[0];cssLink.replaceWith(css);
  const embedded=document.createElement('script');embedded.id='embedded-deck';embedded.type='application/json';embedded.textContent=JSON.stringify(data).replace(/</g,'\\u003c');base.querySelector('body').append(embedded);
  for(const js of [files[1],publishedRuntime(files[2])]){const script=document.createElement('script');script.textContent=safeScript(js);base.querySelector('body').append(script)}
  // Guard against accidental dependencies on remote or local paths in author content.
  const linked=base.querySelectorAll('link[href],script[src],img[src]:not([src^="data:"]),iframe[src],video[src],audio[src],source[src]');if(linked.length)throw Error('Quedan referencias externas o recursos sin incrustar.');
  const html='<!doctype html>\n'+base.outerHTML;download(filename()+'-definitiva.html',html,'text/html;charset=utf-8');
  const bad=await overflowingSlides();message(`HTML publicado: ${enabled.length} diapositivas activas, sin controles ni código de edición.`+(bad?.length?` Atención, desbordan el lienzo: ${bad.join('; ')}.`:''));
}catch(e){message('No se pudo generar el HTML: '+e.message);console.error(e)}finally{button.disabled=false;button.textContent='Generar HTML definitivo'}}

function bind(){
  $('logoUpload').addEventListener('change',uploadLogos);
  $('editorBtn').addEventListener('click',()=>toggleEditor());$('manageBtn').onclick=()=>{selected=app().getCurrentSlide().id;populate();$('editorPanel').hidden=false};$('editorClose').onclick=()=>{$('editorPanel').hidden=true};
  $('slideSize').addEventListener('input',()=>{const v=Number($('slideSize').value);$('slideSizeValue').textContent=v+'%';app().updateMeta({slideSize:v});save()});
  $('defaultTheme').addEventListener('change',()=>{app().updateMeta({theme:$('defaultTheme').value});save()});
  $('slidePicker').addEventListener('change',()=>{selected=$('slidePicker').value;const s=selectedSlide();if(s&&!s.disabled)app().goToSlideId(s.id);populate()});
  $('slideEnabled').addEventListener('change',()=>{const s=selectedSlide();if(!s)return;const ok=app().setSlideEnabled(s.id,$('slideEnabled').checked);if(!ok){$('slideEnabled').checked=true;message('No puedes ocultar la última diapositiva activa.');return}save();populate()});
  $('illustrationPicker').addEventListener('change',()=>{const s=selectedSlide();const v=$('illustrationPicker').value;if(!s||v==='custom')return;app().updateSlide(s.id,{illustration:v});save();populate()});
  $('illustrationUpload').addEventListener('change',async()=>{const s=selectedSlide(),file=$('illustrationUpload').files[0];$('illustrationUpload').value='';if(!s||!file)return;try{app().updateSlide(s.id,{illustration:await readImage(file,IMAGE_TYPES)});save();populate();message('Ilustración propia incrustada.')}catch(e){message(e.message)}});
  $('imageUpload').addEventListener('change',async()=>{const s=selectedSlide(),file=$('imageUpload').files[0];$('imageUpload').value='';if(!s||!file)return;try{const src=await readImage(file,IMAGE_TYPES);app().updateSlide(s.id,{image:{...(s.image||{}),src,alt:s.image?.alt||baseName(file)}});save();populate();message('Imagen incrustada. Revisa el texto alternativo.')}catch(e){message(e.message)}});
  $('imageAlt').addEventListener('change',()=>updateImage({alt:$('imageAlt').value.trim()||'Imagen'}));
  $('imageCaption').addEventListener('change',()=>{const c=$('imageCaption').value.trim();updateImage({caption:c||undefined})});
  $('imageCover').addEventListener('change',()=>updateImage({fit:$('imageCover').checked?'cover':undefined}));
  $('overflowCheckBtn').addEventListener('click',async()=>{message('Revisando…');const bad=await overflowingSlides();message(bad===null?'Revisa los desbordamientos en una pantalla de escritorio.':bad.length?'Diapositivas que desbordan el lienzo: '+bad.join('; ')+'. Divídelas o reduce el contenido.':'Ninguna diapositiva activa desborda el lienzo.')});
  $('imageSplit').addEventListener('change',()=>{const s=selectedSlide();if(!s)return;app().updateSlide(s.id,{layout:$('imageSplit').checked?'split':undefined});save();populate()});
  $('imageRemove').addEventListener('click',()=>{const s=selectedSlide();if(!s)return;app().updateSlide(s.id,{image:undefined,layout:s.layout==='split'?undefined:s.layout});save();populate()});
  $('exerciseApply').addEventListener('click',()=>{const s=selectedSlide();if(!s)return;try{const text=$('exerciseJson').value.trim();const ex=text?JSON.parse(text):undefined;if(!ex&&s.type==='exercise')throw Error('una diapositiva de tipo exercise necesita ejercicio');if(ex){const errors=exerciseErrors(ex,'ejercicio');const clash=app().getDeck().slides.some(o=>o.id!==s.id&&o.exercise?.id===ex.id);if(clash)errors.push('exercise.id repetido '+ex.id);if(errors.length)throw Error(errors.join('; '))}app().updateSlide(s.id,{exercise:ex});save();populate();message('Ejercicio actualizado.')}catch(e){message('Ejercicio no válido: '+e.message)}});
  $('saveDraftBtn').addEventListener('click',()=>download(filename()+'-borrador.json',JSON.stringify(app().getDeck(),null,2)+'\n','application/json'));
  $('loadDraftBtn').addEventListener('click',()=>$('loadDraftFile').click());
  $('loadDraftFile').addEventListener('change',async()=>{const file=$('loadDraftFile').files[0];if(!file)return;try{const deck=JSON.parse(await file.text());if(deck.meta?.id!==originalDeck.meta.id)throw Error('El ID de la presentación no coincide');const errors=deckErrors(deck);if(errors.length)throw Error(errors.slice(0,5).join('; '));app().replaceDeck(deck);selected=app().getCurrentSlide().id;save();populate();message('Borrador importado.')}catch(e){message('No se pudo importar: '+e.message)}finally{$('loadDraftFile').value=''}});
  $('resetDraftBtn').addEventListener('click',()=>{if(!confirm('¿Descartar todos los cambios locales y restaurar la presentación original?'))return;localStorage.removeItem('interactive-editor:'+originalDeck.meta.id);app().replaceDeck(JSON.parse(JSON.stringify(originalDeck)));selected=app().getCurrentSlide().id;populate();message('Presentación original restaurada.')});
  $('publishBtn').addEventListener('click',publish);
  window.addEventListener('slides:render',()=>{requestAnimationFrame(flagOverflow);if(!$('editorPanel').hidden){const current=app().getCurrentSlide();if(current&&!selectedSlide()?.disabled)selected=current.id;populate()}if(document.body.classList.contains('inline-edit'))enableInline()});
}
window.addEventListener('slides:ready',async()=>{try{originalDeck=JSON.parse($('embedded-deck').textContent)}catch(e){originalDeck=JSON.parse(JSON.stringify(app().getDeck()))}selected=app().getCurrentSlide()?.id;bind();populate();flagOverflow()});
})();
