const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),zlib=require('node:zlib');
const root=path.join(__dirname,'..');
const D=JSON.parse(fs.readFileSync(path.join(root,'research/us-sites.json'),'utf8'));
const geo={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'data/us_states.js'),'utf8'),geo);
const G=geo.window.US_STATES,CITY=geo.window.US_CITIES,META=geo.window.US_MAP_META;
const M=require(path.join(root,'js/us_map.js'));
const KEYS=['2025','2026','2027','2028','final','now'];
const close=(a,b,msg)=>assert.ok(Math.abs(a-b)<0.051,`${msg}: ${a} != ${b}`);

test('snapshot keeps its provenance and every site keeps unit-bearing values for each date',()=>{
 assert.equal(D.schema_version,1);assert.match(D.source_url,/^https:\/\/epoch\.ai\/data\/data_centers\/data_centers\.zip$/);
 assert.match(D.response_sha256,/^[0-9a-f]{64}$/);assert.match(D.retrieved_utc,/^\d{4}-\d{2}-\d{2}T/);assert.equal(D.now_date,D.retrieved_utc.slice(0,10));
 assert.match(D.method,/facility power/);assert.deepEqual(D.years,KEYS);
 const names=new Set();
 for(const s of D.sites){assert.ok(!names.has(s.name),'duplicate '+s.name);names.add(s.name);
  for(const k of KEYS){assert.equal(typeof s.mw[k],'number',s.name+' mw '+k);assert.equal(typeof s.h100e[k],'number',s.name+' h100e '+k);}
  assert.ok(s.state===null||G[s.state],s.name+' has a state without geometry: '+s.state);}
});

test('per-state totals equal the sum of their sites',()=>{
 const by=new Map();for(const s of D.sites){const k=s.state||'unlocated';if(!by.has(k))by.set(k,[]);by.get(k).push(s);}
 assert.deepEqual([...by.keys()].sort(),Object.keys(D.states).sort());
 for(const [k,sites] of by){const st=D.states[k];assert.equal(st.sites,sites.length,k+' site count');
  for(const y of KEYS){close(st.mw[y],sites.reduce((a,s)=>a+s.mw[y],0),`${k} MW ${y}`);assert.equal(st.h100e[y],sites.reduce((a,s)=>a+s.h100e[y],0),`${k} H100e ${y}`);}}
 // The page sums sites itself; its view values must match the snapshot's state totals.
 for(const [view,V] of Object.entries(M.VIEWS)){const m=M.model(D,view);let sum=0;
  for(const [k,r] of m.states){const st=D.states[k||'unlocated'];close(r.value,V.get(st.mw),`${view} ${k}`);close(r.now,st.mw.now,`${view} ${k} now`);close(r.y2028,st.mw['2028'],`${view} ${k} 2028`);sum+=r.value;}
  close(sum,D.sites.reduce((a,s)=>a+V.get(s.mw),0),view+' national');}
});

test('no US site is lost: unlocated sites stay listed with state null',()=>{
 assert.equal(D.us_sites,D.sites.length);
 const nulls=D.sites.filter(s=>s.state===null).map(s=>s.name);
 assert.equal(D.unlocated,nulls.length);assert.deepEqual([...D.unlocated_sites].sort(),[...nulls].sort());
 assert.equal(D.states.unlocated?.sites||0,nulls.length);
 assert.equal(Object.values(D.states).reduce((a,s)=>a+s.sites,0),D.sites.length);
 const m=M.model(D,'now');assert.equal([...m.states.values()].reduce((a,r)=>a+r.sites.length,0),D.sites.length);assert.equal(m.unlocated.sites.length,nulls.length);
});

test('overridden sites carry their basis and evidence and count exactly once',()=>{
 const over=D.sites.filter(s=>s.state_basis==='site name'||s.state_basis==='source text');
 assert.ok(over.length>0);assert.deepEqual(over.map(s=>s.name).sort(),[...D.state_overrides].sort());
 for(const s of D.sites){
  if(s.state===null){assert.equal(s.state_basis,null,s.name);assert.equal(s.state_evidence,null,s.name);}
  else if(s.state_basis==='address'){assert.equal(s.state_evidence,null,s.name);assert.ok(s.address,s.name+' placed by address without one');}
  else {assert.ok(['site name','source text'].includes(s.state_basis),s.name+': '+s.state_basis);assert.match(s.state_evidence,/^(Name|Selected Sources): ".+"$/,s.name);assert.ok(!D.unlocated_sites.includes(s.name),s.name+' both overridden and unlocated');}
 }
 // Every site lands in exactly one state bucket of the page model, overrides included.
 const seen=new Map();for(const [,r] of M.model(D,'total2028').states)for(const s of r.sites)seen.set(s.name,(seen.get(s.name)||0)+1);
 assert.equal(seen.size,D.sites.length);for(const [n,c] of seen)assert.equal(c,1,n+' counted '+c+' times');
 for(const s of over)assert.ok(D.states[s.state].sites>=1&&D.states[s.state].sites===D.sites.filter(x=>x.state===s.state).length,s.name);
});

// Minimal zip reader (stored or deflated entries) so the source CSV can be compared when the cached download exists.
function unzip(file,name){const b=fs.readFileSync(file);let e=b.length-22;while(e>=0&&b.readUInt32LE(e)!==0x06054b50)e--;
 let p=b.readUInt32LE(e+16);for(let i=0,n=b.readUInt16LE(e+10);i<n;i++){const m=b.readUInt16LE(p+10),size=b.readUInt32LE(p+20),nl=b.readUInt16LE(p+28),xl=b.readUInt16LE(p+30),cl=b.readUInt16LE(p+32),off=b.readUInt32LE(p+42);
  if(b.toString('utf8',p+46,p+46+nl)===name){const d=off+30+b.readUInt16LE(off+26)+b.readUInt16LE(off+28),raw=b.subarray(d,d+size);return (m===8?zlib.inflateRawSync(raw):raw).toString('utf8');}
  p+=46+nl+xl+cl;}throw new Error(name+' not in zip');}
function csv(text){const rows=[];let row=[],f='',q=false;for(let i=0;i<text.length;i++){const c=text[i];
 if(q){if(c==='"'){if(text[i+1]==='"'){f+='"';i++;}else q=false;}else f+=c;}
 else if(c==='"')q=true;else if(c===','){row.push(f);f='';}else if(c==='\n'){row.push(f.replace(/\r$/,''));rows.push(row);row=[];f='';}else f+=c;}
 if(f||row.length){row.push(f);rows.push(row);}const [h,...rs]=rows;return rs.filter(r=>r.length>1).map(r=>Object.fromEntries(h.map((k,i)=>[k.replace(/^﻿/,''),r[i]])));}
const zip=path.join(root,'.cache/research/data_centers.zip');
test('every United States row of the cached Epoch download is in the snapshot',{skip:!fs.existsSync(zip)&&'no cached data_centers.zip'},()=>{
 const us=csv(unzip(zip,'data_centers.csv')).filter(r=>r.Country.trim()==='United States').map(r=>r.Name.trim());
 assert.equal(us.length,D.us_sites);assert.deepEqual([...us].sort(),D.sites.map(s=>s.name).sort());
 // Override evidence must still be in the site's own Epoch field, and its address must still name no state.
 const rows=new Map(csv(unzip(zip,'data_centers.csv')).map(r=>[r.Name.trim(),r]));
 for(const s of D.sites.filter(s=>s.state_basis==='site name'||s.state_basis==='source text')){
  const [,field,text]=/^(Name|Selected Sources): "(.+)"$/.exec(s.state_evidence);
  assert.ok((rows.get(s.name)[field]||'').toLowerCase().includes(text.toLowerCase()),`${s.name}: "${text}" not in ${field}`);
  assert.ok(!/,\s*[A-Z]{2}(\s+\d{5})?\s*(,|$)/.test(rows.get(s.name).Address.trim()),s.name+' address may now name a state');}
});

test('geometry covers 50 states and DC with SVG paths in the fitted frame; large cities have markers',()=>{
 assert.equal(Object.keys(G).length,51);assert.equal(META.width,960);assert.ok(META.height>500&&META.height<=620);
 for(const [k,g] of Object.entries(G)){assert.match(k,/^[A-Z]{2}$/);assert.match(g.d,/^M[\d.,-]+/);assert.ok(g.c[0]>=0&&g.c[0]<=META.width&&g.c[1]>=0&&g.c[1]<=META.height,k);}
 assert.ok(fs.statSync(path.join(root,'data/us_states.js')).size<150*1024);
 for(const view of Object.keys(M.VIEWS)){const top=M.model(D,view).cities.filter(c=>c.value>0).sort((a,b)=>b.value-a.value).slice(0,10);
  for(const c of top)assert.ok(CITY[c.city],`${view}: no marker position for ${c.city}`);}
 for(const [k,[x,y]] of Object.entries(CITY))assert.ok(x>=0&&x<=META.width&&y>=0&&y<=META.height,k);
});

test('class breaks rise and stay below the maximum',()=>{
 for(const max of [0.5,5,732,2384.8,7234.3]){const b=M.breaks(max);for(let i=0;i<b.length;i++){assert.ok(b[i]>0&&b[i]<max);if(i)assert.ok(b[i]>b[i-1]);}assert.ok(b.length<=4);}
});
