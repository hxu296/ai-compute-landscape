// Source disagreements, revisions, and differences in definition are distinct disclosures.
const CONFLICTS = new Map((NC.conflicts || []).map(c => [c.id, c]));
function conflictIds(subject, metric, match) {
  return [...CONFLICTS.values()].filter(c => {
    const subjects = c.subjects || [c.subject];
    if (!subjects.includes(subject) || c.metric !== metric) return false;
    return !match || !c.match || Object.entries(c.match).every(([k,v]) => match[k] === v);
  }).map(c => c.id);
}
function conflictLabel(c) { return c.classification === 'revision' ? (c.revision_verified === false ? 'source date unclear' : 'later evidence') : c.classification === 'scope_difference' ? 'different bases' : 'source conflict'; }
function conflictBadge(subject, metric, match) {
  const ids = conflictIds(subject,metric,match); if (!ids.length) return '';
  const severe = ids.some(id => CONFLICTS.get(id).classification === 'real_conflict');
  const label = ids.length > 1 ? `${ids.length} source notes` : conflictLabel(CONFLICTS.get(ids[0]));
  return ` <button class="source-note ${severe?'disputed':'context'}" data-conflict="${esc(ids.join(','))}" aria-label="${esc(label)}: open both sources" type="button">${severe?'!':'≠'} ${esc(label)}</button>`;
}
function conflictHtml(c) {
  return `<article><div class="kicker">${esc(conflictLabel(c))}</div><h4>${esc(c.title || `${c.subject || c.subjects?.join(', ')}: ${c.metric}`)}</h4><p>${esc(c.explanation || c.disagreement || '')}</p>` +
    (c.sources || []).map(s=>`<div class="source-version"><b>${src(s.url || s.source_url,esc(s.title || s.source_title || 'Source'))}</b><span>${esc(s.date || s.as_of || s.source_date || 'date not stated')}</span><p>${esc(s.value ?? s.claim ?? '')}${s.unit?' '+esc(s.unit):''}${s.scope?' · '+esc(s.scope):''}</p></div>`).join('') +
    `<p class="source-treatment"><b>Shown here:</b> ${esc(c.treatment || c.resolution || 'The disagreement remains unresolved; no combined total is inferred.')}</p></article>`;
}
function conflictSummary(subject,metric,match) { return conflictIds(subject,metric,match).map(id=>conflictHtml(CONFLICTS.get(id))).join(''); }
function markConflict(svg,subject,metric,x,y,match) {
  const ids=conflictIds(subject,metric,match);if(!ids.length)return;
  const t=el('text',{x,y,class:'svg-conflict '+(ids.some(id=>CONFLICTS.get(id).classification==='real_conflict')?'disputed':'context'),'data-conflict':ids.join(','),tabindex:0,role:'button','aria-label':'Source comparison'},svg);t.textContent='!';
}
(function(){
  const panel=document.createElement('div');panel.id='conflictTip';panel.className='source-popover';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Source comparison');document.body.appendChild(panel);
  let pinned=false,timer=null,active=null;
  const close=()=>{panel.hidden=true;pinned=false;active=null;};
  function show(n,pin=false){
    clearTimeout(timer);hideTip(true);active=n;pinned=pin;const ids=(n.dataset.conflict||'').split(',');
    panel.innerHTML='<button class="source-close" aria-label="Close source comparison">×</button>'+ids.map(id=>CONFLICTS.has(id)?conflictHtml(CONFLICTS.get(id)):'').join('');
    panel.hidden=false;panel.querySelector('.source-close').onclick=close;
    const r=n.getBoundingClientRect();panel.style.width=Math.min(460,innerWidth-24)+'px';panel.style.left=Math.max(12,Math.min(r.left,innerWidth-panel.offsetWidth-12))+'px';
    panel.style.top=Math.max(12,Math.min(r.bottom+8,innerHeight-panel.offsetHeight-12))+'px';
  }
  document.addEventListener('pointerover',e=>{const n=e.target.closest('[data-conflict]');if(n&&!pinned)show(n);});
  document.addEventListener('pointerout',e=>{if(e.target.closest('[data-conflict]')&&!pinned)timer=setTimeout(()=>{if(!panel.matches(':hover'))close();},180);});
  panel.addEventListener('pointerenter',()=>clearTimeout(timer));panel.addEventListener('pointerleave',()=>{if(!pinned)close();});
  document.addEventListener('click',e=>{const n=e.target.closest('[data-conflict]');if(n){if(pinned&&active===n)close();else show(n,true);}else if(!e.target.closest('#conflictTip'))close();});
  document.addEventListener('focusin',e=>{const n=e.target.closest('[data-conflict]');if(n)show(n);});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')close();if((e.key==='Enter'||e.key===' ')&&e.target.matches('text[data-conflict]')){e.preventDefault();show(e.target,true);}});
})();
