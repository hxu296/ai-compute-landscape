// What stock prices assume (Table 2) and how much the Nov 2026 midterms delay the build-out. Inputs: research/market-check.json.
(function(){
  const M=window.MARKET_CHECK;if(!M)return;
  const pct=v=>(+v).toFixed(1)+'%',rng=([a,b])=>a===b?pct(a):`${(+a).toFixed(1)}–${pct(b)}`;
  if($('#marketTable')){
    const rated=r=>!r.verdict.startsWith('not rated'),names=f=>M.rows.filter(r=>rated(r)&&f(r.verdict)).map(r=>r.name);
    const rich=names(v=>v==='rich'),cheap=names(v=>v==='cheap if forecasts hold'),maybe=names(v=>v!=='cheap if forecasts hold'&&v.includes('cheap'));
    $('#marketHeadline').innerHTML=`If forecasts hold at each company’s own historical margin, <b>${esc(rich.join(' and '))}</b> are priced below their cost of capital${cheap.length?`, <b>${esc(cheap.join(', '))}</b> above`:''}${maybe.length?`; <b>${esc(maybe.join(' and '))}</b> is above it only if today’s margins hold`:''}. The rest are about fair.`;
    $('#marketNote').innerHTML=esc(M.method)+' '+esc(M.verdict_rule);
    const cols=[
      {k:'name',h:'Company',f:r=>`<b>${esc(r.name)}</b> <span class="small muted">${esc(r.ticker)}</span><br><span class="small muted nowrap">$${(+r.close).toFixed(2)} · ${r.nov5_pct>0?'+':''}${r.nov5_pct}% Nov 5 · ${r.off_high_pct}% vs high</span>`},
      {k:'implied_return_pct',h:'Implied yearly return',f:r=>`<b>${rng(r.implied_return_pct)}</b><br><span class="small muted">${esc(r.margin)}</span>`},
      {k:'wacc_pct',h:'Cost of capital',f:r=>`${pct(r.wacc_pct)}<br><span class="small"><b>${esc(rated(r)?r.verdict:'not rated')}</b></span>`},
      {k:'read',h:'Read',f:r=>`<span class="small">${esc(r.read)}</span>${r.debt_yield?`<br><span class="small muted">Bonds: ${esc(r.debt_yield)}</span>`:''}`}];
    const nRated=M.rows.filter(rated).length;
    const draw=all=>{table('#marketTable',all?M.rows:M.rows.filter(rated),cols);$('#marketAll').textContent=all?`Show rated only (${nRated})`:`Show all ${M.rows.length} (incl. not rated)`;};
    let all=false;draw(all);$('#marketAll').onclick=()=>{all=!all;draw(all);};
    const nr=M.rows.filter(r=>!rated(r)),why=v=>v.replace(/^not rated \(/,'').replace(/\)$/,'');
    $('#marketRules').innerHTML=`<summary>Margin rule, limits and sources</summary><table class="t small"><thead><tr><th>Case</th><th>Margin used</th></tr></thead><tbody>${M.rule.map(([a,b])=>`<tr><td>${esc(a)}</td><td>${esc(b)}</td></tr>`).join('')}</tbody></table><ul class="small"><li>Not rated: ${nr.map(r=>`${esc(r.name)} (${esc(why(r.verdict))})`).join('; ')}.</li>${M.limits.map(l=>`<li>${esc(l)}</li>`).join('')}<li>Prices: ${esc(M.prices)}. Consensus revenue, debt and cash: company filings and stockanalysis.com. Margins: annual net margin from company financials.</li></ul>`;
  }
  if($('#policyFig')){
    const P=M.policy,f1=v=>(+v).toFixed(1),g=([a,b])=>`${f1(a)}–${f1(b)} GW`;
    $('#policyHeadline').innerHTML=`The midterms barely touch 2027. In 2028 they add <b>${g(P.policy_2028_gw)}</b> of delay to the ${P.adds_2028_gw} GW the tracked US sites add, on top of <b>${g(P.ordinary_slip_2028_gw)}</b> that would slip anyway. That moves the shortage date about <b>${P.shortage_shift_months[0]}–${P.shortage_shift_months[1]} months</b> earlier.`;
    const own=Object.entries(P.owners_2028_policy_pct).sort((a,b)=>b[1][1]-a[1][1]);
    $('#policyTable').innerHTML=`<thead><tr><th></th><th>2027</th><th>2028</th></tr></thead><tbody>
      <tr><td>Added at tracked US sites</td><td>${P.adds_2027_gw} GW</td><td>${P.adds_2028_gw} GW</td></tr>
      <tr><td>Slips anyway (no policy; E)</td><td>not estimated</td><td>${g(P.ordinary_slip_2028_gw)}</td></tr>
      <tr><td><b>Extra delay from the midterms</b> (base–bad; E)</td><td><b>${g(P.policy_2027_gw)}</b></td><td><b>${g(P.policy_2028_gw)}</b></td></tr>
      <tr><td>Share of the tracked end-2028 fleet</td><td>—</td><td>${P.policy_2028_fleet_share_pct[0]}–${P.policy_2028_fleet_share_pct[1]}%</td></tr>
      <tr><td>Site spending moved into 2029</td><td>—</td><td>$${P.capex_shifted_2028_busd[0]}–${P.capex_shifted_2028_busd[1]}B</td></tr>
      <tr><td>If New Mexico’s air permit is denied (≈Nov 23)</td><td>—</td><td>+${P.nm_case_b_gw} GW, 6–8 quarters</td></tr></tbody>`;
    $('#policyOwners').innerHTML=`<b>Share of each one’s 2028 additions delayed by policy (base–bad):</b> `+own.map(([k,[a,b]])=>`${esc(k)} ${a===b?a:a+'–'+b}%`).join(' · ')+'.';
    $('#policyNotes').innerHTML=`<summary>Method, assumptions and sources</summary><ul class="small">${P.notes.map(n=>`<li>${esc(n)}</li>`).join('')}<li>Denominator: ${esc(P.fleet_denominator)}.</li><li>Sources: ${P.sources.map(([t,u])=>`<a href="${esc(u)}" target="_blank" rel="noopener">${esc(t)}</a>`).join(' · ')}.</li></ul>`;
  }
})();
