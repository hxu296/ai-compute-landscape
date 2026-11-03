// Convert a disclosed rate or period total; keep the source scope and bound intact.
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.TokenMath=api;})(typeof window!=='undefined'?window:globalThis,function(){
  function daily(record){
    const period=record.period,multipliers={minute:1440,day:1,week:1/7,month:1/30,quarter:1/91.25,year:1/365,window:1};
    if(!(period in multipliers))return null;
    if(period==='window'&&!(record.window_days>0))throw new Error('An observed window needs its day count');
    const multiplier=record.window_days?1/record.window_days:multipliers[period];
    if(!Number.isFinite(record.value)||record.value<0||!(multiplier>0))throw new Error('Invalid token observation');
    const value=record.value*multiplier,high=record.range_high==null?null:record.range_high*multiplier;
    if(high!=null&&(!Number.isFinite(high)||high<value))throw new Error('Invalid token range');
    const converted=multiplier!==1;
    const formula=record.window_days?`÷ ${record.window_days} observed days`:period==='minute'?'× 1,440 minutes/day':period==='day'?'Native daily disclosure':period==='week'?'÷ 7 days':period==='month'?'÷ 30 days (standard month)':period==='quarter'?'÷ 91.25 days (standard quarter)':'÷ 365 days';
    return {value,high,converted,formula};
  }
  function latestByScope(records){
    const groups=new Map();
    for(const r of records){
      if(!r.scope_id)throw new Error('Explicit scope is required');
      const old=groups.get(r.scope_id),date=r.observation_date||r.source_date;
      if(!old||date>(old.observation_date||old.source_date)||date===(old.observation_date||old.source_date)&&r.source_date>old.source_date)groups.set(r.scope_id,r);
    }
    return [...groups.values()];
  }
  return {daily,latestByScope};
});
