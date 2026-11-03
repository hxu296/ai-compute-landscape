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
# Models on the site, with the raw model keys accepted from each API query (GLM-5.2 also returns glm5.3 rows).
MODELS = [
    ('DeepSeek-V4-Pro', 'DeepSeek-V4-Pro', {'dsv4'}),
    ('DeepSeek-V4.1-Flash', 'DeepSeek-V4.1-Flash', {'dsv41flash'}),
    ('GLM-5.2', 'GLM-5.2', {'glm5.2'}),
    ('Kimi-K3', 'Kimi K3', {'kimik3'}),
    ('Qwen3.8-Flash-Next', 'Qwen3.8-Flash-Next', {'qwen3.8next'}),
]
HARDWARE = {'gb200': 'GB200 NVL72', 'gb300': 'GB300 NVL72'}
# Architecture notes from each model's published Hugging Face config.json (estimates of active FFN parameters, not profiles).
ARCH = {
    'DeepSeek-V4-Pro': '61 layers; 6 of 384 routed experts + 1 shared (≈28B active FFN parameters of ≈1.55T). KV is compressed 4× or 128× along the sequence and each token attends to its top 1,024 entries plus a 128-token window, so decode cost barely grows with context.',
    'DeepSeek-V4.1-Flash': '40 layers; 6 of 384 experts + 1 shared (≈10B active FFN parameters of ≈0.54T) with the same compressed, sparse attention as V4-Pro: the cheapest model per token here.',
    'GLM-5.2': '78 layers; 8 of 256 experts + 1 shared (≈25B active of ≈0.72T). Sparse attention reads the top 2,048 positions, but full MLA KV is stored for every layer, so long contexts use more memory per sequence than DeepSeek.',
    'Kimi K3': 'Why so many racks: ≈4.5× DeepSeek V4-Pro’s compute per token and far more KV traffic. 93 layers activate 16 of 896 experts (3,584 wide) + 2 shared, ≈128B active FFN parameters of ≈6.3T. Its hybrid “Kimi Linear” attention keeps 24 full-attention MLA layers, which read the whole ~136k-token context every decode step (≈1.9GB per sequence at fp8, vs ≈0.2GB for V4-Pro’s sparse attention). Fewer sequences fit per GPU (≈6 vs ≈41 at ~55 tok/s/user), and speed falls below 50 tok/s/user beyond 240 concurrent requests.',
    'Qwen3.8-Flash-Next': '48 layers; 10 of 512 small experts + 1 shared (≈2.6B active), linear attention in 3 of every 4 layers. A small model; its best NVL72 run is a single GPU at 16 concurrent requests, so this row reflects that run’s limits more than the architecture.',
}
MIN_TOK_S_USER = 50
# Physical topology of each selected run, read from its InferenceX Actions job name.
TOPOLOGY = {
    '444912': '1P (TP8/EP8/DPA) x 1D (TP8/EP8/DPA) = 16 GPUs',
    '444884': '2P (TP8/EP8/DPA) x 1D (TP12/EP12/DPA) = 28 GPUs',
    '446626': 'one TP4/EP4/DPA engine = 4 GPUs; API mirrors 4 in both P/D fields',
    '446952': '9P (TP2/EP2/DPA) x 1D (TP16/EP16/DPA) = 34 GPUs',
    '446251': '3P (TP1/PP8) x 1D (TP16/EP16/DPA) = 40 GPUs',
    '445405': '3P (TP1/PP4) x 1D (TP8/EP8/DPA) = 20 GPUs',
    '445854': 'one TP8/PP2 engine = 16 GPUs; API tensor-parallel field omits pipeline parallelism',
    '446753': '2P (TP8/DCP8/EP8) x 3D (TP8/DCP8) = 40 GPUs',
    '447126': 'one TP1 engine = 1 GPU',
}

def physical_gpus(row):
    m = row['metrics']
    if row['disagg']:
        return row['num_prefill_gpu'] + row['num_decode_gpu']
    # Single-engine rows can mirror or under-report P/D fields; the all-GPU rate gives the denominator.
    g = m['total_tput_tps'] / m['tput_per_gpu']
    if abs(g - round(g)) > 0.01:
        raise ValueError('Non-integer GPU denominator for '+str(row['id']))
    return round(g)

def select(rows, keys, hardware):
    best = None
    for row in rows:
        m = row['metrics']
        if row['model'] not in keys or row['hardware'] != hardware or row['benchmark_type'] != 'agentic_traces':
            continue
        if not m.get('p90_itl') or not m.get('output_tput_tps') or not m.get('input_tput_tps') or 1/m['p90_itl'] <= MIN_TOK_S_USER:
            continue
        g = physical_gpus(row)
        if g > 72:
            continue
        score = m['output_tput_tps'] / g
        if best is None or score > best[0]:
            best = (score, row, g)
    return best

def build(cache, retrieved_utc):
    retrieved = dt.datetime.fromisoformat(retrieved_utc.replace("Z", "+00:00"))
    if retrieved.tzinfo is None:
        raise ValueError("Retrieval time must include a timezone")
    points, manifests, unavailable = [], {}, []
    for query, label, keys in MODELS:
        path = cache / (query + '.json')
        raw_bytes = path.read_bytes()
        rows = json.loads(raw_bytes)
        manifests[query] = dict(api_url='https://inferencex.semianalysis.com/api/v1/benchmarks?model='+query, response_rows=len(rows), response_sha256=hashlib.sha256(raw_bytes).hexdigest())
        # One run per model: the highest output throughput per GPU across GB200 and GB300 NVL72.
        options = [(hw, select(rows, keys, hw)) for hw in HARDWARE]
        options = [(hw, b) for hw, b in options if b]
        if not options:
            unavailable.append(dict(model=label, hardware='GB200/GB300 NVL72', reason=f'No AgentX run above {MIN_TOK_S_USER} tokens/s/user that fits one rack in the retrieved response.'))
            continue
        hardware, best = max(options, key=lambda o: o[1][0])
        hardware_label = HARDWARE[hardware]
        if True:
            _, row, gpus = best
            result_id = str(row['id'])
            if result_id not in TOPOLOGY:
                raise ValueError('Verify the physical topology of '+result_id+' before publishing it')
            m = row['metrics']
            points.append(dict(result_id=result_id, model=label, raw_model_key=row['model'], hardware=hardware, hardware_label=hardware_label,
                     gpus_per_rack=72, rack_basis='Physical NVL72 GPU count',
                     total_allocated_gpus=gpus, input_tps=m['input_tput_tps'], output_tps=m['output_tput_tps'],
                     input_tps_per_allocated_gpu=m['input_tput_tps']/gpus, output_tps_per_allocated_gpu=m['output_tput_tps']/gpus,
                     interactivity_p90_tok_s_user=1/m['p90_itl'], framework=row['framework'], precision=row['precision'],
                     concurrency=row['conc'], disaggregated=row['disagg'], date_api=row['date'], run_started_at=row.get('run_started_at'),
                     run_url=row['run_url'], api_url=manifests[query]['api_url'],
                     mean_input_tokens=m.get('mean_input_tokens'), mean_output_tokens_actual=m.get('mean_output_tokens_actual'),
                     gpu_cache_hit_rate=m.get('server_gpu_cache_hit_rate'), external_cache_hit_rate=m.get('server_external_cache_hit_rate'),
                     offload_mode=row.get('offload_mode'), kv_offloading=m.get('kv_offloading'), physical_count_note='Job topology: '+TOPOLOGY[result_id]+'.', architecture_note=ARCH.get(label), raw_row=row))
    return dict(schema_version=1, retrieved_utc=retrieved.astimezone(dt.timezone.utc).isoformat(),
                method=f'One run per model: across GB200 and GB300 NVL72, the AgentX run with the highest output tokens/s per physical GPU above {MIN_TOK_S_USER} tokens/s/user (reciprocal P90 ITL). Fixed-rate whole-group extrapolation; no quality equivalence or uncached-prefill calibration.',
                api_contract_url='https://inferencex.semianalysis.com/api', query_manifest=manifests,
                unavailable=unavailable+[dict(model='GLM-5.3', hardware='GB200/GB300 NVL72', reason='Retrieved runs cover VR200, B300 and MI355X only; GLM-5.2 is shown instead.')],
                points=points)

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--cache', type=Path, required=True)
    parser.add_argument('--retrieved-utc', required=True, help='Actual response retrieval time; rebuilding a cache is not a new retrieval')
    args = parser.parse_args()
    result = build(args.cache, args.retrieved_utc)
    (ROOT/'research/capacity-expanded.json').write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n')
    print('Wrote research/capacity-expanded.json; raw selected rows and response hashes retained.')
