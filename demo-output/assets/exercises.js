/* Formative client-side assessments. Keys are public; do not use for secure exams. */
(function(){'use strict';
  function normalize(s){return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/\s+/g,' ')}
  function sameSet(a,b){return a.length===b.length&&new Set(a).size===new Set(b).size&&a.every(x=>b.includes(x))}
  function grade(ex,value){
    if(ex.type==='single')return value===ex.answer;
    if(ex.type==='multiple')return sameSet(value,ex.answer);
    if(ex.type==='text')return (Array.isArray(ex.answer)?ex.answer:[ex.answer]).some(a=>normalize(a)===normalize(value));
    if(ex.type==='number'){if(value===''||value===null||!Number.isFinite(Number(value)))return false;return Math.abs(Number(value)-Number(ex.answer))<=Number(ex.tolerance??0)}
    return null;
  }
  function solutionText(ex){if(ex.solution)return ex.solution;if(ex.type==='single'||ex.type==='multiple'){const answers=Array.isArray(ex.answer)?ex.answer:[ex.answer];return (ex.options||[]).filter(o=>answers.includes(o.value)).map(o=>o.label).join('; ')}return Array.isArray(ex.answer)?ex.answer.join(' / '):String(ex.answer)}
  function mount(ex,root,store,save){
    const response=store.answers[ex.id]||{};const wrap=document.createElement('section');wrap.className='exercise';const title=document.createElement('div');title.className='prompt';title.textContent=ex.prompt;wrap.append(title);
    let inputs=[];
    if(['single','multiple'].includes(ex.type)){
      const options=document.createElement('div');options.className='options';const chosen=Array.isArray(response.value)?response.value:[response.value];
      (ex.options||[]).forEach(o=>{const label=document.createElement('label');label.className='option';const input=document.createElement('input');input.type=ex.type==='single'?'radio':'checkbox';input.name=ex.id;input.value=o.value;input.checked=chosen.includes(o.value);inputs.push(input);const span=document.createElement('span');span.textContent=o.label;label.append(input,span);options.append(label)});wrap.append(options)
    }else{const input=document.createElement('input');input.type=ex.type==='number'?'number':'text';if(ex.type==='number')input.step='any';input.setAttribute('aria-label','Respuesta');input.value=response.value??'';inputs=[input];wrap.append(input);if(ex.unit){const unit=document.createElement('span');unit.textContent=' '+ex.unit;wrap.append(unit)}}
    if(ex.hint){const hint=document.createElement('div');hint.className='hint';hint.textContent=ex.hint;wrap.append(hint)}
    const actions=document.createElement('div');actions.className='exercise-actions';const check=document.createElement('button');check.className='primary';check.textContent='Comprobar';const retry=document.createElement('button');retry.textContent='Reintentar';const show=document.createElement('button');show.textContent='Ver solución';const done=document.createElement('button');done.textContent=store.done[ex.id]?'✓ Hecho':'Marcar como hecho';actions.append(check,retry,show,done);wrap.append(actions);
    const feedback=document.createElement('div');feedback.className='feedback';feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');feedback.hidden=true;wrap.append(feedback);
    const solution=document.createElement('div');solution.className='solution';solution.hidden=true;solution.textContent='Solución: '+solutionText(ex)+(ex.explanation?'\n'+ex.explanation:'');wrap.append(solution);
    function read(){if(ex.type==='single')return inputs.find(i=>i.checked)?.value??'';if(ex.type==='multiple')return inputs.filter(i=>i.checked).map(i=>i.value);return inputs[0].value}
    function display(r){feedback.hidden=false;feedback.className='feedback '+(r.correct?'ok':'bad');feedback.textContent=(r.correct?'✓ Correcto. ':'Todavía no. ')+(ex.explanation||'Puedes revisar y reintentar.')}
    if(response.checked)display(response);
    check.addEventListener('click',()=>{const value=read();const correct=grade(ex,value);if(correct===null)return;store.answers[ex.id]={value,correct,checked:true};save();display(store.answers[ex.id])});
    retry.addEventListener('click',()=>{inputs.forEach(i=>{if(['radio','checkbox'].includes(i.type))i.checked=false;else i.value=''});delete store.answers[ex.id];feedback.hidden=true;solution.hidden=true;show.textContent='Ver solución';save();inputs[0]?.focus()});
    show.addEventListener('click',()=>{solution.hidden=!solution.hidden;show.textContent=solution.hidden?'Ver solución':'Ocultar solución'});
    done.addEventListener('click',()=>{store.done[ex.id]=!store.done[ex.id];done.textContent=store.done[ex.id]?'✓ Hecho':'Marcar como hecho';save()});
    root.append(wrap);return {toggleSolution:()=>{show.click()}};
  }
  window.SlidesExercises={mount,grade};
})();
