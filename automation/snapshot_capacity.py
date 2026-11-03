#!/usr/bin/env python3
"""Build the review snapshot from explicitly downloaded public InferenceX responses.

No network or feed/editorial writes. Download URLs are retained in the output.
Usage: python automation/snapshot_capacity.py --cache .cache/research --retrieved-utc ISO_TIMESTAMP
"""
import argparse
import datetime as dt
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
# The full source keeps the site under neocloud/site; the public checkout is the site itself.
if (ROOT/'site'/'research').is_dir():
    ROOT = ROOT/'site'
SELECTIONS = [
    ('DeepSeek-V4.1-Flash', '446952', 34, 72, 'DeepSeek V4.1 Flash', 'GB300 NVL72', 'Nine 2-GPU prefill workers plus one 16-GPU decode worker. Raw per-GPU rates are role-local; recompute using all 34 GPUs.'),
    ('Kimi-K3', '439938', 8, 32, 'Kimi K3', 'B300 SXM', 'One aggregate 8-GPU engine; mirrored P/D fields count the same physical GPUs.'),
    ('GLM-5.2', '446062', 8, 32, 'GLM-5.3', 'B300 SXM', 'Combined-family API query; retained raw model key glm5.3, not glm5.2. One aggregate 8-GPU engine.'),
    ('Qwen3.8-Flash-Next', '447134', 1, 32, 'Qwen3.8-Flash-Next', 'B300 SXM', 'One aggregate 1-GPU engine. Flash-Next is distinct from Qwen3.8-Max; no equal-quality claim.'),
    ('Qwen3.8-Flash-Next', '440460', 8, 32, 'Qwen3.8-Flash-Next', 'H100 SXM', 'API mirrors 64 in P/D GPU fields, but job 98411109797 lists devices 0–7, one node, TP8/EP8 on the same ranks. Absolute/per-GPU rates also imply 8. Physical count corrected to 8; TP and EP are not multiplied.'),
]

def build(cache, retrieved_utc):
    retrieved = dt.datetime.fromisoformat(retrieved_utc.replace("Z", "+00:00"))
    if retrieved.tzinfo is None:
        raise ValueError("Retrieval time must include a timezone")
    points, manifests = [], {}
    for query, result_id, gpus, rack, label, hardware_label, note in SELECTIONS:
        path = cache / (query + '.json')
        raw_bytes = path.read_bytes()
        rows = json.loads(raw_bytes)
        row = next(r for r in rows if str(r['id']) == result_id)
        m = row['metrics']
        if row['benchmark_type'] != 'agentic_traces' or not m['p90_itl'] > 0 or 1/m['p90_itl'] < 95:
            raise ValueError('Expected an AgentX measured operating point')
        if query == 'GLM-5.2' and row['model'] != 'glm5.3':
            raise ValueError('GLM family alias must not relabel GLM5.2')
        point = dict(result_id=result_id, model=label, raw_model_key=row['model'], hardware=row['hardware'], hardware_label=hardware_label,
                     gpus_per_rack=rack, rack_basis='Physical NVL72 GPU count' if rack == 72 else 'Assumed packing density; editable, not a measured physical rack',
                     total_allocated_gpus=gpus, input_tps=m['input_tput_tps'], output_tps=m['output_tput_tps'],
                     input_tps_per_allocated_gpu=m['input_tput_tps']/gpus, output_tps_per_allocated_gpu=m['output_tput_tps']/gpus,
                     interactivity_p90_tok_s_user=1/m['p90_itl'], framework=row['framework'], precision=row['precision'],
                     concurrency=row['conc'], disaggregated=row['disagg'], date_api=row['date'], run_started_at=row.get('run_started_at'),
                     run_url=row['run_url'], api_url='https://inferencex.semianalysis.com/api/v1/benchmarks?model='+query,
                     mean_input_tokens=m.get('mean_input_tokens'), mean_output_tokens_actual=m.get('mean_output_tokens_actual'),
                     gpu_cache_hit_rate=m.get('server_gpu_cache_hit_rate'), external_cache_hit_rate=m.get('server_external_cache_hit_rate'),
                     offload_mode=row.get('offload_mode'), kv_offloading=m.get('kv_offloading'), physical_count_note=note, raw_row=row)
        if result_id == '440460':
            point['count_evidence_url'] = 'https://github.com/SemiAnalysisAI/InferenceX/actions/runs/33039903416/job/98411109797'
        points.append(point)
        manifests[query] = dict(api_url=point['api_url'], response_rows=len(rows), response_sha256=hashlib.sha256(raw_bytes).hexdigest())
    return dict(schema_version=1, retrieved_utc=retrieved.astimezone(dt.timezone.utc).isoformat(),
                method='Explicit measured operating points at >=95 tokens/s/user (reciprocal P90 ITL). Fixed-rate whole-group extrapolation; no quality equivalence or uncached-prefill calibration. Selections are a curated comparison, not an exhaustive best-of-hardware ranking.',
                api_contract_url='https://inferencex.semianalysis.com/api', query_manifest=manifests,
                unavailable=[dict(model='DeepSeek-V4-Pro', hardware='H100', reason='No matched AgentX observation in retrieved availability and benchmark responses.'),
                             dict(model='Qwen3.8-Max', hardware='all', reason='No matching raw benchmark model in retrieved availability; Flash-Next is a distinct model, not a substitute.')],
                points=points)

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--cache', type=Path, required=True)
    parser.add_argument('--retrieved-utc', required=True, help='Actual response retrieval time; rebuilding a cache is not a new retrieval')
    args = parser.parse_args()
    result = build(args.cache, args.retrieved_utc)
    (ROOT/'research/capacity-expanded.json').write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n')
    print('Wrote research/capacity-expanded.json; raw selected rows and response hashes retained.')
