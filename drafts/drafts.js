const PLANS=[{"id":"structured","name":"정형 시간표","price":80000},{"id":"unstructured","name":"비정형 시간표","price":100000},{"id":"team","name":"팀 시간표","price":120000}];
const OPTS=[{"id":"fast","kind":"percent","value":100},{"id":"multi","kind":"fixed","value":0},{"id":"offmemo","kind":"fixed","value":0},{"id":"weekmemo","kind":"fixed","value":0},{"id":"omakase","kind":"fixed","value":0},{"id":"private","kind":"fixed","value":10000,"conflicts":["review"]},{"id":"review","kind":"fixed","value":-10000,"conflicts":["private"]},{"id":"extra","kind":"ask","value":0}];
const won=n=>n.toLocaleString("ko-KR")+"원";
function calc(){
  const plan=document.querySelector('input[name=plan]:checked')?.value||"unstructured";
  const p=PLANS.find(x=>x.id===plan);let t=p.price,ask=false;
  document.querySelectorAll('input[data-opt]:checked').forEach(el=>{const o=OPTS.find(x=>x.id===el.dataset.opt);
    if(o.kind==="ask")ask=true;else if(o.kind==="percent")t+=Math.round(p.price*o.value/100);else t+=o.value;});
  const om=document.querySelector('input[data-opt=omakase]')?.checked;
  document.querySelectorAll('[data-total]').forEach(e=>e.textContent=won(t)+(ask?" + 문의":""));
  document.querySelectorAll('[data-plan-name]').forEach(e=>e.textContent=p.name);
  document.querySelectorAll('[data-rev]').forEach(e=>e.textContent="수정 "+(om?1:3)+"회");
}
document.addEventListener("change",e=>{const el=e.target;
  if(el.dataset&&el.dataset.opt&&el.checked){const o=OPTS.find(x=>x.id===el.dataset.opt);(o.conflicts||[]).forEach(c=>{const x=document.querySelector('input[data-opt='+c+']');if(x)x.checked=false;});}
  calc();});
document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>{
  const g=b.closest('[data-tabs]');g.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('on',x===b));
  const v=b.dataset.tab;g.parentElement.querySelectorAll('[data-cat]').forEach(w=>w.hidden=!(v==="all"||w.dataset.cat===v));}));
calc();
