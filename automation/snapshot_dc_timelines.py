#!/usr/bin/env python3
"""Summarize Epoch AI data-center timelines by provider and year from an explicitly downloaded data_centers.zip.

No network access. Usage: python automation/snapshot_dc_timelines.py --zip PATH --retrieved-utc ISO_TIMESTAMP
"""
import argparse, csv, hashlib, io, json, re, zipfile
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
# The full source keeps the site under neocloud/site; the public checkout is the site itself.
if (ROOT/'site'/'research').is_dir():
    ROOT = ROOT/'site'
SOURCE = 'https://epoch.ai/data/data_centers/data_centers.zip'
# Epoch owner -> this site's provider name. Sites without an owner are matched by name prefix; the rest are "Undisclosed owner"
# (a named owner missing from OWNERS keeps its Epoch name), so the owner and user views cover the same sites.
OWNERS = {'Oracle': 'Oracle OCI', 'Meta': 'Meta (own use)', 'Google': 'Google Cloud', 'Microsoft': 'Microsoft Azure', 'Amazon': 'AWS',
          'SpaceXAI': 'xAI / SpaceX', 'CoreWeave': 'CoreWeave', 'Nscale': 'Nscale', 'ByteDance': 'ByteDance / Volcano Engine', 'Huawei': 'Huawei Cloud',
          'Cipher Mining': 'Cipher Mining', 'Nebius': 'Nebius', 'Firmus': 'Firmus', 'Alibaba': 'Alibaba Cloud',
          'Softbank': 'SoftBank (Stargate)', 'G42': 'G42 (Stargate UAE)', 'AI XPV Platform': 'AI XPV · Lake Mariner', 'Mistral AI': 'Mistral AI', 'Core42': 'Core42'}
PREFIXES = {'DayOne': 'DayOne', 'QTS': 'QTS'}
UNDISCLOSED = 'Undisclosed owner'
YEARS = [('2025', '2025-12-31'), ('2026', '2026-12-31'), ('2027', '2027-12-31'), ('2028', '2028-12-31'), ('final', '9999-12-31')]
clean = lambda s: re.sub(r'\s*#\w+', '', s or '').strip()

def level(series, day):
    value = (0.0, 0.0)
    for date, h100e, mw in sorted(series):
        if date <= day:
            value = (h100e, mw)
    return value

def power_series(site_series):
    """Summed facility MW at every distinct date in the sites' timelines (same rule as level), change points only."""
    out = []
    for day in sorted({d for s in site_series for d, _, _ in s}):
        mw = round(sum(level(s, day)[1] for s in site_series), 1)
        if not out or out[-1][1] != mw:
            out.append([day, mw])
    return out

def build(zip_path, retrieved_utc):
    raw = Path(zip_path).read_bytes()
    z = zipfile.ZipFile(io.BytesIO(raw))
    read = lambda name: list(csv.DictReader(io.TextIOWrapper(z.open(name), encoding='utf-8')))
    centers = {r['Name']: r for r in read('data_centers.csv')}
    series = defaultdict(list)
    for r in read('data_center_timelines.csv'):
        try:
            series[r['Data center']].append((r['Date'][:10], float(r['H100 equivalents'] or 0), float(r['Power (MW)'] or 0)))
        except ValueError:
            continue
    providers = defaultdict(lambda: dict(h100e={y: 0.0 for y, _ in YEARS}, mw={y: 0.0 for y, _ in YEARS}, sites=[]))
    site_series = defaultdict(list)
    for name, s in series.items():
        owner = clean(centers.get(name, {}).get('Owner'))
        provider = OWNERS.get(owner) or next((v for k, v in PREFIXES.items() if name.startswith(k)), None) or owner or UNDISCLOSED
        site = dict(name=name, country=centers.get(name, {}).get('Country') or None, h100e={}, mw={})
        for y, day in YEARS + [('now', retrieved_utc[:10])]:
            h, mw = level(s, day)
            providers[provider]['h100e'][y] = providers[provider]['h100e'].get(y, 0.0) + h; providers[provider]['mw'][y] = providers[provider]['mw'].get(y, 0.0) + mw
            site['h100e'][y] = round(h); site['mw'][y] = round(mw, 1)
        providers[provider]['sites'].append(site)
        site_series[provider].append(s)
    # Users: the labs Epoch lists as using each site, sharing a multi-user site equally (Epoch gives no split).
    users = defaultdict(lambda: dict(mw=defaultdict(float), h100e=defaultdict(float), sites=[]))
    for name, s in series.items():
        names = [clean(u) for u in (centers.get(name, {}).get('Users') or '').split(',') if clean(u)] or ['Undisclosed user']
        for u in names:
            for y, day in YEARS + [('now', retrieved_utc[:10])]:
                h, mw = level(s, day)
                users[u]['mw'][y] += mw / len(names); users[u]['h100e'][y] += h / len(names)
            users[u]['sites'].append(dict(name=name, shared_with=len(names) - 1, mw_final=round(level(s, '9999-12-31')[1], 1)))
    by_user = {u: dict(mw={k: round(v, 1) for k, v in d['mw'].items()}, h100e={k: round(v) for k, v in d['h100e'].items()}, sites=sorted(d['sites'], key=lambda x: -x['mw_final'])) for u, d in users.items()}
    for name, p in providers.items():
        p['h100e'] = {k: round(v) for k, v in p['h100e'].items()}; p['mw'] = {k: round(v, 1) for k, v in p['mw'].items()}
        p['sites'].sort(key=lambda s: -s['h100e']['final'])
        p['series'] = power_series(site_series[name])
    return dict(schema_version=1, source_url=SOURCE, retrieved_utc=retrieved_utc, response_sha256=hashlib.sha256(raw).hexdigest(),
                years=[y for y, _ in YEARS], method='Epoch AI frontier data-center timelines: level at each year end from the latest dated observation or projection on or before that date; "now" is the level on the retrieval date; "final" is the last projected level (to 2030). Covers tracked frontier sites only, not whole fleets. Power is Epoch facility power (MW). Sites with no owner listed are "Undisclosed owner". "series" is each provider\'s summed facility MW at every change point ([date, MW], same latest-on-or-before rule).',
                providers=dict(sorted(providers.items(), key=lambda kv: -kv[1]['h100e']['final'])),
                users_method='All tracked sites (including owners not mapped to a provider above), credited to the labs Epoch lists as users; a site with several users is split equally, a site without listed users is "Undisclosed user".',
                by_user=dict(sorted(by_user.items(), key=lambda kv: -kv[1]['mw']['final'])))

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--zip', required=True)
    parser.add_argument('--retrieved-utc', required=True)
    args = parser.parse_args()
    (ROOT/'research/dc-timelines.json').write_text(json.dumps(build(args.zip, args.retrieved_utc), ensure_ascii=False, indent=2)+'\n')
    print('Wrote research/dc-timelines.json')
