#!/usr/bin/env python3
"""Daily refresh of the research inputs: InferenceX best-run selection and Epoch data-center timelines.

Downloads into .cache/research, rebuilds both snapshots and data/research.js, and writes nothing unless every step
succeeds. A newly selected benchmark run without a verified topology fails loudly instead of being published.
"""
import datetime as dt, json, sys, urllib.request
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_research, snapshot_capacity, snapshot_dc_timelines

ROOT = snapshot_capacity.ROOT
CACHE = ROOT/'.cache'/'research'
LIMIT = 40 * 2**20

def fetch(url, path):
    for attempt in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'ai-compute-landscape research refresh'}), timeout=60) as r:
                body = r.read(LIMIT + 1)
            if len(body) > LIMIT:
                raise ValueError('Response too large: '+url)
            path.write_bytes(body)
            return
        except Exception as error:
            if attempt == 2:
                raise RuntimeError(f'Download failed after 3 attempts: {url}: {error}')

def main():
    CACHE.mkdir(parents=True, exist_ok=True)
    now = dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat()
    for query, _, _ in snapshot_capacity.MODELS:
        fetch('https://inferencex.semianalysis.com/api/v1/benchmarks?model='+query, CACHE/(query+'.json'))
    fetch(snapshot_dc_timelines.SOURCE, CACHE/'data_centers.zip')
    capacity = snapshot_capacity.build(CACHE, now)
    timelines = snapshot_dc_timelines.build(CACHE/'data_centers.zip', now)
    years = [sum(p['h100e'][y] for p in timelines['providers'].values()) for y in timelines['years'][:-1]]
    if len(timelines['providers']) < 10 or any(b < a for a, b in zip(years, years[1:])):
        raise ValueError('Data-center timelines look incomplete or decreasing: '+str(years))
    old = json.loads((ROOT/'research/capacity-expanded.json').read_text())
    changed = sorted({p['result_id'] for p in capacity['points']} ^ {p['result_id'] for p in old['points']})
    (ROOT/'research/capacity-expanded.json').write_text(json.dumps(capacity, ensure_ascii=False, indent=2)+'\n')
    (ROOT/'research/dc-timelines.json').write_text(json.dumps(timelines, ensure_ascii=False, indent=2)+'\n')
    build_research.build(ROOT)
    print('Research inputs refreshed;', 'selection changed: '+', '.join(changed) if changed else 'benchmark selection unchanged')

if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print(f'::error::Research refresh failed, previous snapshots kept: {error}')
        sys.exit(1)
