// Scenario arithmetic; no inferred traffic, prices, probabilities or cash-flow forecast.
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.DemandMath=api;})(typeof window!=='undefined'?window:globalThis,function(){
  function finite(...values){if(values.some(v=>!Number.isFinite(v)))throw new Error('Inputs must be finite');}
  function date(value){if(!/^\d{4}-\d{2}-\d{2}$/.test(value))throw new Error('Use a full ISO date');const time=Date.parse(value+'T00:00:00Z');if(!Number.isFinite(time)||new Date(time).toISOString().slice(0,10)!==value)throw new Error('Invalid date');return time;}
  function revenueTokens(revenue,days,pricePerMillion){finite(revenue,days,pricePerMillion);if(revenue<0||days<=0||pricePerMillion<=0)throw new Error('Revenue must be nonnegative; days and price positive');return revenue/days/pricePerMillion*1e6;}
  function extrapolate(anchor,reference,target,monthlyGrowth){finite(anchor,monthlyGrowth);if(anchor<0||monthlyGrowth<=-1||monthlyGrowth>10)throw new Error('Invalid scenario');const days=(date(target)-date(reference))/86400000;if(days<0)throw new Error('Target predates reference');const factor=(1+monthlyGrowth)**(days/30.4375);return{value:anchor*factor,days,factor};}
  function gpuDemand(volumeMultiple,efficiencyMultiple){finite(volumeMultiple,efficiencyMultiple);if(volumeMultiple<0||efficiencyMultiple<=0)throw new Error('Invalid demand or efficiency');return volumeMultiple/efficiencyMultiple;}
  function runway(liquidity,monthlyOutflow,reserve){finite(liquidity,monthlyOutflow,reserve);if(liquidity<0||monthlyOutflow<=0||reserve<0||reserve>liquidity)throw new Error('Invalid liquidity scenario');return(liquidity-reserve)/monthlyOutflow;}
  return{revenueTokens,extrapolate,gpuDemand,runway};
});
