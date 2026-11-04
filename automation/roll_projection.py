#!/usr/bin/env python3
"""Roll the global token projection forward to today on each component's own dated trend.

Only components with a dated level and a monthly trend move; held components and stated ranges keep their values.
The high case keeps its ratio to the central case, the low case stays the latest level held flat (or its stated low).
"""
import argparse, datetime as dt, json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
if (ROOT/'site'/'research').is_dir():
    ROOT = ROOT/'site'
DAYS_PER_MONTH = 30.4375

def months(start, end):
    return (dt.date.fromisoformat(end) - dt.date.fromisoformat(start)).days / DAYS_PER_MONTH

def roll(demand, as_of):
    est = demand['global_estimate']
    if as_of < est['as_of']:
        raise ValueError(f'Refusing to roll the projection backwards: {est["as_of"]} -> {as_of}')
    for c in est['components']:
        g = c.get('monthly_growth')
        if g is None or not c.get('latest_daily'):
            continue
        central = c['latest_daily'] * (1 + g) ** months(c['latest_date'], as_of)
        ratio = c['high'] / c['central']
        c['central'], c['high'] = round(central, 3), round(central * ratio, 3)
        if c.get('usd_per_mtok') is not None:
            c['spend_usd_m_per_day'] = round(c['central'] * c['usd_per_mtok'], 1)
    est['total'] = {k: round(sum(c[k] for c in est['components']), 1) for k in ('central', 'low', 'high')}
    if est.get('spend'):
        per_day = sum(c.get('spend_usd_m_per_day') or 0 for c in est['components'])
        est['spend']['total_usd_m_per_day'], est['spend']['total_usd_b_per_year'] = round(per_day, 1), round(per_day * 365 / 1000, 1)
    # The token chart's Anthropic estimate is the same component, in tokens/day.
    by = {c['name']: c for c in est['components']}
    te = demand.get('token_estimates', {})
    if 'Anthropic' in by and 'Anthropic' in te:
        te['Anthropic'].update(central=by['Anthropic']['central'] * 1e12, high=by['Anthropic']['high'] * 1e12)
    parts = [by.get('OpenAI API'), by.get('OpenAI ChatGPT and Codex')]
    if all(parts) and 'OpenAI · all products (projection)' in te:
        te['OpenAI · all products (projection)'].update(central=sum(c['central'] for c in parts) * 1e12, high=sum(c['high'] for c in parts) * 1e12)
    est['as_of'] = as_of
    return demand

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--root', type=Path, default=ROOT)
    parser.add_argument('--as-of', default=dt.datetime.now(dt.timezone.utc).date().isoformat())
    args = parser.parse_args()
    path = args.root/'research/demand-research.json'
    demand = roll(json.loads(path.read_text()), args.as_of)
    path.write_text(json.dumps(demand, ensure_ascii=False, indent=2)+'\n')
    print(f'Token projection rolled to {args.as_of}: {demand["global_estimate"]["total"]["central"]:.0f}T/day central')

if __name__ == '__main__':
    main()
