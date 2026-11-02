#!/usr/bin/env python3
"""Stage a curated build in the public checkout without erasing its daily state."""
import argparse,json,shutil,subprocess,tempfile
from pathlib import Path

def merge_editorial(source,remote):
    items={i['id']:i for i in source['items']}
    for i in remote['items']:
        twin=next((k for k,v in items.items() if v['date']==i['date'] and v['title']==i['title']),None)
        key=i.get('id') or twin
        if not key:raise ValueError('Legacy editorial item needs an explicit migration')
        items[key]={**items.get(key,{}),**i,'id':key}
    return {'schema_version':2,'items':sorted(items.values(),key=lambda i:(i['date'],i.get('impact_score',1)),reverse=True)}

def stage(build,checkout):
    subprocess.run(['git','-C',str(checkout),'pull','--ff-only'],check=True)
    with tempfile.TemporaryDirectory() as temp:
        keep=Path(temp)
        for name in ['data/live.json','data/live.js','data/history','research/daily.json']:
            p=checkout/name;q=keep/name
            if p.is_dir():shutil.copytree(p,q)
            elif p.exists():q.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,q)
        for p in build.iterdir():
            q=checkout/p.name
            if p.is_dir():shutil.copytree(p,q,dirs_exist_ok=True)
            else:shutil.copy2(p,q)
        for name in ['data/live.json','data/live.js','data/history']:
            p=keep/name;q=checkout/name
            if p.is_dir():shutil.copytree(p,q,dirs_exist_ok=True)
            elif p.exists():shutil.copy2(p,q)
        old=keep/'research/daily.json';new=checkout/'research/daily.json'
        if old.exists():
            source=json.loads(new.read_text());remote=json.loads(old.read_text())
            new.write_text(json.dumps(merge_editorial(source,remote),ensure_ascii=False,indent=2)+'\n')
    subprocess.run(['python3',str(checkout/'automation/refresh.py'),'--offline','--root',str(checkout)],check=True)
    with tempfile.TemporaryDirectory() as temp:
        out=Path(temp)/'site';subprocess.run(['python3',str(checkout/'automation/package.py'),'--root',str(checkout),'--out',str(out)],check=True)
        for name in ['index.html','ai-compute-landscape.html']:shutil.copy2(out/name,checkout/name)
    print('Staged curated public release; inspect git diff, then commit and push.')
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('build',type=Path);p.add_argument('checkout',type=Path);a=p.parse_args();stage(a.build.resolve(),a.checkout.resolve())
