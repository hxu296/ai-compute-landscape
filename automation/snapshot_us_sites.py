#!/usr/bin/env python3
"""Per-site and per-state power of Epoch AI's tracked US frontier data centers, from an explicitly downloaded data_centers.zip.

No network access. Usage: python automation/snapshot_us_sites.py --zip PATH --retrieved-utc ISO_TIMESTAMP

The state comes from the site's Address string (a 2-letter code or a full state name). Where the address names no state,
a reviewed override in STATE_OVERRIDES may assign one; each override names the Epoch field and the exact text that
supports it, and build() fails if that text is gone or the address now names a state itself. Every site records
state_basis ('address', 'source text', 'site name' or null). A site with no supported state keeps state null and is
counted in "unlocated"; it is never dropped or guessed.
"""
import argparse, csv, hashlib, io, json, re, zipfile
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
# The full source keeps the site under neocloud/site; the public checkout is the site itself.
if (ROOT/'site'/'research').is_dir():
    ROOT = ROOT/'site'
SOURCE = 'https://epoch.ai/data/data_centers/data_centers.zip'
YEARS = [('2025', '2025-12-31'), ('2026', '2026-12-31'), ('2027', '2027-12-31'), ('2028', '2028-12-31'), ('final', '9999-12-31')]
STATES = {'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut',
          'DE': 'Delaware', 'DC': 'District of Columbia', 'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois',
          'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
          'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri', 'MT': 'Montana',
          'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
          'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania',
          'RI': 'Rhode Island', 'SC': 'South Carolina', 'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
          'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming'}
BY_NAME = {v.lower(): k for k, v in STATES.items()}
# Addresses where the street and city share one comma field; the city was read by hand from the same Address string.
CITY_FIX = {'Amazon Madison Mega Site': 'Canton', 'Amazon Ridgeland': 'Ridgeland', 'Google Papillion': 'Papillion',
            'Google Cedar Rapids': 'Cedar Rapids'}
# Reviewed overrides for US sites whose Address names no state: name -> (state, basis, Epoch field, evidence text, city).
# 'source text' = the site's own Epoch "Selected Sources" names the state; 'site name' = only the site name supports it
# (the sources were checked and do not name a state, nor contradict it). City only where the same text names it.
# Checked and left unlocated: Anthropic Barber Lake (no state in its Name, Address or Selected Sources).
STATE_OVERRIDES = {
    'OpenAI Stargate New Mexico': ('NM', 'site name', 'Name', 'New Mexico', None),        # sources: Project Jupiter, BorderPlex; no state named
    'OpenAI Stargate Michigan': ('MI', 'source text', 'Selected Sources', 'Michigan Public Service Commission', None),
    'OpenAI Stargate Wisconsin': ('WI', 'source text', 'Selected Sources', 'port-washington-wisconsin', 'Port Washington'),
    'OpenAI Stargate Milam': ('TX', 'source text', 'Selected Sources', 'milam-county-texas', None),
    'AWS New Albany': ('OH', 'source text', 'Selected Sources', 'newalbanyohio.org', 'New Albany'),
    'Google Storey County': ('NV', 'source text', 'Selected Sources', 'storey-county-nevada', None),
    'Google Mesa': ('AZ', 'source text', 'Selected Sources', 'mesa-data-center-campus-in-arizona', 'Mesa'),
    'Stream Phoenix': ('AZ', 'site name', 'Name', 'Phoenix', None),                       # sources: /locations/phoenix/, SDC-Goodyear; no state named
    'Google Kansas City East': ('MO', 'source text', 'Selected Sources', 'kansas-city-missouri', 'Kansas City'),
}
clean = lambda s: re.sub(r'\s*#\w+', '', s or '').strip()

def steps(series):
    """Compact dated facility-MW series: [[date, MW], ...] at each change, so level(series, d) == level(steps, d) after rounding."""
    out, prev = [], 0.0
    by_date = {}
    for date, v in sorted(series):
        by_date[date] = v  # same rule as level(): the last of a date's sorted values wins
    for date in sorted(by_date):
        v = round(by_date[date], 1)
        if v != prev:
            out.append([date, v]); prev = v
    return out

def level(series, day):
    """Latest observation on or before day (as in snapshot_dc_timelines.level); 0 before the first observation."""
    value = 0.0
    for date, v in sorted(series):
        if date <= day:
            value = v
    return value

def locate(address):
    """(state, city) parsed from an Epoch address string; (None, None) when no state is named."""
    a = ' '.join((address or '').split())
    if not a:
        return None, None
    parts = [p.strip() for p in a.split(',') if p.strip()]
    for i in range(len(parts) - 1, -1, -1):
        p = parts[i]
        m = re.fullmatch(r'(?:(.*?)\s+)?([A-Z]{2})(?:\s+\d{5}(?:-\d{4})?)?', p)
        if m and m.group(2) in STATES and i > 0:
            return m.group(2), m.group(1) or (parts[i-1] if not re.match(r'\d', parts[i-1]) else None)
        for name in sorted(BY_NAME, key=len, reverse=True):
            m = re.search(r'(?:^|\s)' + re.escape(name) + r'(?=\s|$)', p, re.I)
            if m:
                before = p[:m.start()].strip()
                before = re.sub(r'^[\d\s-]+[^\d]*?\d{5}\s*', '', before) if re.search(r'\d{5}', before) else before
                return BY_NAME[name], before or (parts[i-1] if i > 0 and not re.match(r'\d', parts[i-1]) else None)
    return None, None

def build(zip_path, retrieved_utc):
    raw = Path(zip_path).read_bytes()
    z = zipfile.ZipFile(io.BytesIO(raw))
    read = lambda name: list(csv.DictReader(io.TextIOWrapper(z.open(name), encoding='utf-8')))
    centers = [r for r in read('data_centers.csv') if r['Country'].strip() == 'United States']
    # Each measure is its own series: a blank cell is a missing observation, not a zero.
    mw, h100e = defaultdict(list), defaultdict(list)
    for r in read('data_center_timelines.csv'):
        for series, col in ((mw, 'Power (MW)'), (h100e, 'H100 equivalents')):
            try:
                series[r['Data center']].append((r['Date'][:10], float(r[col])))
            except ValueError:
                continue
    now = retrieved_utc[:10]
    days = YEARS + [('now', now)]
    sites, unlocated, overridden = [], [], []
    for r in centers:
        name = r['Name'].strip()
        state, city = locate(r['Address'])
        basis, evidence = ('address', None) if state else (None, None)
        if name in STATE_OVERRIDES:
            o_state, o_basis, field, text, o_city = STATE_OVERRIDES[name]
            if state:
                raise ValueError(f'{name}: address now names {state}; remove its override')
            if text.lower() not in (r.get(field) or '').lower():
                raise ValueError(f'{name}: override evidence "{text}" no longer in Epoch {field}')
            state, city, basis, evidence = o_state, o_city, o_basis, f'{field}: "{text}"'
            overridden.append(name)
        site = dict(name=name, owner=clean(r['Owner']) or None, users=clean(r['Users']) or None,
                    city=CITY_FIX.get(name, city), state=state, state_basis=basis, state_evidence=evidence,
                    address=' '.join(r['Address'].split()) or None,
                    mw={y: round(level(mw[name], d), 1) for y, d in days},
                    h100e={y: round(level(h100e[name], d)) for y, d in days},
                    observations=len(mw[name]), series=steps(mw[name]))
        sites.append(site)
        if state is None:
            unlocated.append(name)
    sites.sort(key=lambda s: (-s['mw']['final'], s['name']))
    states = {}
    for s in sites:
        k = s['state'] or 'unlocated'
        st = states.setdefault(k, dict(name=STATES.get(k, 'No state in address'), sites=0, mw={y: 0.0 for y, _ in days}, h100e={y: 0 for y, _ in days}, largest=None))
        st['sites'] += 1
        for y, _ in days:
            st['mw'][y] += s['mw'][y]; st['h100e'][y] += s['h100e'][y]
        if st['largest'] is None:
            st['largest'] = s['name']
    for st in states.values():
        st['mw'] = {k: round(v, 1) for k, v in st['mw'].items()}
    return dict(schema_version=1, source_url=SOURCE, dataset_url='https://epoch.ai/data/ai-data-centers', license='CC BY 4.0 (Epoch AI)',
                retrieved_utc=retrieved_utc, now_date=now, response_sha256=hashlib.sha256(raw).hexdigest(),
                years=[y for y, _ in YEARS] + ['now'], series_start=min((p[0] for s in sites for p in s['series']), default=None),
                series_end=max((d for n in mw for d, _ in mw[n]), default=None), unit='MW facility power (Epoch "Power (MW)"); H100 equivalents as published by Epoch',
                method='Epoch AI frontier data-center tracker, US sites (Country = United States). Each value is the latest dated observation '
                       'or Epoch projection on or before the date: year end for 2025-2028, the retrieval date for "now"; "final" is the last projected level (to 2030). '
                       'A site before its first observation counts 0 MW; a blank cell is skipped, not read as zero. State is parsed from the Address '
                       'field (2-letter code or full state name). Where the address names none, a reviewed override applies only if the site\'s own '
                       'Epoch "Selected Sources" text names the state (state_basis "source text") or the site name does unambiguously ("site name"); '
                       'the supporting text is kept in state_evidence. Sites with no supported state keep state null and are listed in "unlocated". '
                       'Power is Epoch facility power ("Power (MW)" in data_center_timelines.csv); the "Current power (MW)" column of data_centers.csv is IT power and is not used. '
                       'Each site also carries "series": its facility MW at every dated change (latest observation on or before a date gives the level); dates after the retrieval date are Epoch projections. '
                       'Covers tracked frontier campuses only, not every data center. Planned levels are Epoch projections and can slip.',
                us_sites=len(sites), unlocated=len(unlocated), unlocated_sites=unlocated, state_overrides=overridden,
                states=dict(sorted(states.items(), key=lambda kv: (kv[0] == 'unlocated', -kv[1]['mw']['2028'], kv[0]))),
                sites=sites)

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--zip', required=True)
    parser.add_argument('--retrieved-utc', required=True)
    parser.add_argument('--out', type=Path, default=ROOT/'research/us-sites.json')
    args = parser.parse_args()
    data = build(args.zip, args.retrieved_utc)
    args.out.write_text(json.dumps(data, ensure_ascii=False, indent=2)+'\n')
    print(f"Wrote {args.out}: {data['us_sites']} US sites, {len(data['state_overrides'])} placed by a reviewed override, {data['unlocated']} unlocated: {', '.join(data['unlocated_sites']) or 'none'}")
