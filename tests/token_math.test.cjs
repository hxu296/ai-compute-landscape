const {test}=require('node:test'),assert=require('node:assert/strict');
const {daily,latestByScope}=require('../js/token_math'),snapshot=require('../research/token-latest.json');
const get=id=>snapshot.records.find(r=>r.scope_id===id),near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b)*1e-12));
test('Google all-surfaces and API rates use separate scopes and correct unit conversions',()=>{
 near(daily(get('google-all-surfaces')).value,3.2e15/30);near(daily(get('google-first-party-api')).value,32e9*1440);
 assert.equal(get('google-all-surfaces').value_relation,'>');assert.equal(get('google-first-party-api').value_relation,'nearly');
 const a=get('google-all-surfaces'),b=get('google-first-party-api');assert.equal(latestByScope([{...a,subject:'Google'},{...b,subject:'Google'}]).length,2);
});
test('period conversions retain ranges, weekly averages and exact observed windows',()=>{
 const r=daily(get('baseten-platform'));assert.equal(r.value,40e12);assert.equal(r.high,50e12);assert.equal(r.converted,false);
 near(daily(get('together-api')).value,400e12/30);near(daily(get('deepinfra-platform')).value,22e12/7);near(daily(get('openrouter-platform-week')).value,128.4e12/7);near(daily(get('zai-ox-alpha-rollout')).value,62e12/6);
 near(daily({value:50e12,period:'month',window_days:31}).value,50e12/31);
});
test('latest selection replaces only the same scope, not a wider older total',()=>{
 const old={scope_id:'same-api',source_date:'2026-01-01',value:1,period:'day'},newer={...old,source_date:'2026-06-01',value:2},wide={...old,scope_id:'all-products'};
 assert.deepEqual(latestByScope([old,newer,wide]),[newer,wide]);assert.throws(()=>latestByScope([{value:3}]));
});
test('snapshot has explicit dates, scopes, source links, no fabricated missing values',()=>{
 const keys=new Set();for(const r of snapshot.records){assert.ok(!keys.has(r.scope_id));keys.add(r.scope_id);assert.match(r.source_url,/^https:\/\//);assert.ok(r.source_date<=snapshot.checked_at);assert.ok(daily(r).value>=0);}
 assert.ok(snapshot.unavailable.some(r=>r.subject==='Anthropic'));for(const r of snapshot.unavailable)assert.equal(r.value,undefined);
 assert.equal(get('microsoft-foundry-api-fy25-history').window_days,365);assert.ok(get('microsoft-foundry-api-fy25-history').note.includes('not a current run rate'));
});
test('invalid token quantities and ranges cannot enter the chart',()=>{
 assert.throws(()=>daily({period:'day',value:NaN}));assert.throws(()=>daily({period:'day',value:4,range_high:3}));assert.throws(()=>daily({period:'window',value:4}));assert.equal(daily({period:'cumulative',value:4}),null);
});
