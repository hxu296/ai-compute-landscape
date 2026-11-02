#!/usr/bin/env python3
"""Daily public-data ETL. Curated company facts are never overwritten by a price feed."""
import argparse,datetime as dt,email.utils,hashlib,json,math,time,urllib.parse,urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
URLS={'compute_desk':'https://data-api.compute-index.com/public/indices','semianalysis':'https://gpu-index.semianalysis.com/api/public-data'}

def number(v):
    if isinstance(v,bool) or not isinstance(v,(int,float)) or not math.isfinite(v) or v<=0:raise ValueError('Expected a finite positive price')
    return float(v)
def date(v):
    try:return dt.date.fromisoformat(str(v)[:10]).isoformat()
    except ValueError:return email.utils.parsedate_to_datetime(v).date().isoformat()
def checks(name,sku,terms,url,history,today):
    points=sorted([{'date':date(p['date']),'value':number(p['value'])} for p in history],key=lambda p:p['date'])
    if not points or any(p['date']>today for p in points):raise ValueError('Empty or future-dated observations')
    if len({p['date'] for p in points})!=len(points):raise ValueError('Duplicate observation dates')
    last=points[-1];day=dt.date.fromisoformat(last['date']);changes={}
    for n in (7,30,90):
        eligible=[p for p in points if p['date']<=(day-dt.timedelta(days=n)).isoformat()]
        a=eligible[-1] if eligible else None
        changes[str(n)]=None if a is None else dict(first_date=a['date'],first=a['value'],last_date=last['date'],last=last['value'],percent=round(100*(last['value']/a['value']-1),3))
    return dict(name=name,sku=sku,terms=terms,source_url=url,date=last['date'],usd=last['value'],changes=changes,method='100 × (last / first − 1); last observation on or before each calendar lookback. Missing history stays unavailable.')
def desk(payload,today):
    mapping={'CDGXH100':'H100','CDH200':'H200','CDB200':'B200','CDB300':'B300'};rows=[]
    for r in payload['indices']:
        if r['alias'] not in mapping:continue
        sku=mapping[r['alias']];rows.append(checks('Compute Desk '+sku,sku,'US one-year rental index','https://www.compute-desk.com/indexes/'+sku.lower(),r['history'],today))
    if {r['sku'] for r in rows}!={'H100','H200','B200','B300'}:raise ValueError('Missing Compute Desk series')
    h=next(r for r in rows if r['sku']=='H100')
    return dict(market_checks=rows,benchmarks=[dict(name='Compute Desk DESKH100',sku='H100',usd=h['usd'],date=h['date'],terms=h['terms']+'; excludes hyperscalers',source_url=h['source_url'])])
def semi(payload,today):
    rows=[]
    for sku,key in [('H100','h100'),('B200','b200'),('A100','a100')]:
        history=[dict(date=p['date'],value=p[key]) for p in payload['index'] if p.get(key) is not None]
        rows.append(checks('SemiAnalysis '+sku,sku,'Spot-contract composite','https://gpu-index.semianalysis.com/',history,today))
    periods=next(c for c in payload['contract'] if c['sku']=='H100')['data'];p=max(periods,key=lambda r:date(r['period_start']));lo,hi=map(number,p['1y'])
    if lo>hi or date(p['period_start'])>today:raise ValueError('Invalid survey range or date')
    return dict(market_checks=rows,benchmarks=[dict(name='SemiAnalysis contract survey',sku='H100',usd=None,range_low=lo,range_high=hi,date=p['period'],terms='One-year rental, 25th–75th percentile; typically 25% prepay. Latest public survey month.',source_url='https://gpu-index.semianalysis.com/')])
def editorial(document,today):
    if document.get('schema_version')!=1 or not isinstance(document.get('items'),list):raise ValueError('Unknown editorial schema')
    seen=set()
    for item in document['items']:
        day=dt.date.fromisoformat(item['date']).isoformat()
        if day in seen or day>today:raise ValueError('Duplicate or future editorial date')
        seen.add(day)
        if item.get('status')!='reviewed' or item.get('kind') not in ['analysis','news']:raise ValueError('Editorial item must be reviewed news or analysis')
        for k,limit in [('title',180),('summary',1800)]:
            if not isinstance(item.get(k),str) or not 1<=len(item[k])<=limit:raise ValueError('Invalid editorial '+k)
        if not 1<=len(item.get('sources',[]))<=8:raise ValueError('Missing supporting sources')
        for source in item['sources']:
            u=urllib.parse.urlparse(source['url'])
            if u.scheme!='https' or not u.hostname or u.username or u.password:raise ValueError('Unsafe source URL')
            if not source.get('title') or date(source['date'])>day:raise ValueError('Invalid source publication date')
    return sorted(document['items'],key=lambda i:i['date'],reverse=True)
def load(path,default):return json.loads(path.read_text()) if path.exists() else default
def write(path,value):path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')
def fetch(key,cache):
    req=urllib.request.Request(URLS[key],headers={'User-Agent':'AIComputeLandscape/1.0 (+https://github.com/hxu296/ai-compute-landscape)','Accept':'application/json'})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req,timeout=25) as response:raw=response.read(8*1024*1024+1)
            if len(raw)>8*1024*1024:raise ValueError('Source response exceeds 8MiB')
            payload=json.loads(raw);cache.mkdir(parents=True,exist_ok=True);(cache/(key+'.json')).write_bytes(raw)
            return payload,hashlib.sha256(raw).hexdigest()
        except (OSError,ValueError):
            if attempt==2:raise
            time.sleep(2**attempt)
def run(root,offline=False):
    now=dt.datetime.now(dt.timezone.utc);today=now.date().isoformat();stamp=now.isoformat()
    data=root/'data';live=load(data/'live.json',{'schema_version':1,'sources':{},'daily':{'items':[]}})
    if live.get('schema_version')!=1:raise ValueError('Unknown live data schema')
    curated=editorial(load(root/'research/daily.json',{'schema_version':1,'items':[]}),today)
    successes=0;status={}
    for key,adapter in [('compute_desk',desk),('semianalysis',semi)]:
        old=live['sources'].get(key,{})
        if offline:
            status[key]=old.get('health',{'state':'not_checked','url':URLS[key]});continue
        try:
            raw,digest=fetch(key,root/'.cache/etl'/today);result=adapter(raw,today)
            previous={r['name']:r['date'] for r in old.get('market_checks',[])}
            if any(r['date']<previous.get(r['name'],'') for r in result['market_checks']):raise ValueError('Source observation date regressed')
            age=max((now.date()-dt.date.fromisoformat(r['date'])).days for r in result['market_checks'])
            health=dict(state='stale' if age>7 else 'ok',checked_at=stamp,last_success=stamp,max_age_days=age,sha256=digest,url=URLS[key])
            live['sources'][key]=dict(result,health=health);status[key]=health;successes+=1
        except Exception as exc:
            # Last good data stays in place; failure is visible, never a zero or fresh quote.
            health=dict(old.get('health',{}),state='error',checked_at=stamp,error=type(exc).__name__+': '+str(exc)[:220],url=URLS[key])
            live['sources'][key]=dict(old,health=health);status[key]=health
    if not offline and successes==0:
        write(root/'.cache/etl'/today/'failure.json',dict(checked_at=stamp,sources=status));raise RuntimeError('All adapters failed; last published files retained')
    live['checked_at']=stamp if not offline else live.get('checked_at')
    live['market_checks']=[r for s in live['sources'].values() for r in s.get('market_checks',[])]
    live['benchmarks']=[r for s in live['sources'].values() for r in s.get('benchmarks',[])]
    # One deterministic fallback brief per UTC day; the editor's reviewed item wins that day.
    history={i['date']:i for i in live.get('daily',{}).get('items',[]) if i.get('status')=='automated'}
    if not offline and today not in {i['date'] for i in curated}:
        h100=sorted([r for r in live['market_checks'] if r['sku']=='H100'],key=lambda r:r['date'],reverse=True)
        fresh=[r for r in h100 if (now.date()-dt.date.fromisoformat(r['date'])).days<=2]
        if fresh:
            r=fresh[0];title=f"Daily market brief: {r['name']} at ${r['usd']:.2f}"
            summary=f"The latest observation is dated {r['date']} and measures {r['terms'].lower()}. This dated benchmark is not a bookable retail offer or a report of a new contract. Other company and fleet facts retain their original observation dates."
            sources=[dict(title=r['name'],url=r['source_url'],date=r['date'])]
        else:
            title='Daily market brief: no fresh benchmark observation';summary='The tracked public benchmark feeds have no observation within the past two days. Their last good dated readings remain visible. This source check does not establish that no other market news occurred.';sources=[]
        history[today]=dict(date=today,title=title,summary=summary,sources=sources,status='automated',kind='market_brief')
    history.update({i['date']:i for i in curated});live['daily']={'schema_version':1,'items':sorted(history.values(),key=lambda i:i['date'],reverse=True)}
    write(data/'live.json',live);(data/'live.js').write_text('window.LIVE = '+json.dumps(live,ensure_ascii=False,separators=(',',':'))+';\n')
    if not offline:
        write(data/'history'/(today+'.json'),dict(checked_at=stamp,sources=status,observations=live['market_checks'],headline=live['daily']['items'][0] if live['daily']['items'] else None))
    print(json.dumps({'checked_at':live.get('checked_at'),'source_status':{k:v.get('state') for k,v in status.items()},'market_series':len(live['market_checks']),'editorial_items':len(curated)},indent=2))
    return live
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--offline',action='store_true');p.add_argument('--root',type=Path,default=ROOT);a=p.parse_args();run(a.root,a.offline)
