# November 10 benchmark refresh review

The scheduled research refresh stopped on a newly selected result without a checked GPU topology. Its previous snapshots remained in place. The following replacements were independently checked against the public run jobs before accepting the refreshed selection:

| Model / result | Physical serving group | Job evidence |
|---|---|---|
| DeepSeek-V4.1-Flash / 447464 | Nine prefill workers × TP2 plus one decode worker × TP16 = 34 GPUs | [GB300 FP4, concurrency 7480](https://github.com/SemiAnalysisAI/InferenceX/actions/runs/41581664540/job/126250715343) |
| Qwen3.8-Flash-Next / 447843 | One aggregate TP1 engine = 1 GPU | [GB300 FP4, concurrency 56](https://github.com/SemiAnalysisAI/InferenceX/actions/runs/42593696369/job/129568368466) |

Raw responses were retrieved November 10 at 13:50 UTC using the model query URLs retained in `capacity-expanded.json`. Flash's API date is November 6; Qwen's is November 10. Retrieval does not change benchmark dates. Qwen's worker record and power audit also each identify one GPU. Its mirrored prefill/decode counts are not two independent engines.

Flash's raw output rate is 275,191.22437 tokens/s for the whole 34-GPU group, approximately 8,093.86 per allocated GPU. Qwen's is 2,506.14468 tokens/s for one GPU. The existing selection rule still requires P90 interactivity above 50 tokens/s/user and selects the best output throughput per physical GPU among eligible GB200/GB300 NVL72 runs for each model. These cached AgentX results do not establish equal model quality, uncached-prefill capacity or a measured global fleet.

The calculator continues to charge all 72 physical GPUs per rack, including unused slots. The older result 446952 remains a frozen test fixture so its independently checked 214-rack example can continue detecting arithmetic regressions without pinning the live selection to an old result. Updated snapshots and the projected browser payload passed arithmetic, denominator and source-consistency checks.

The same all-or-nothing refresh accepted the current public Epoch archive, SHA-256 `1cf5a2d5212cdf0a527677c927a3ce41c5d4ea2d3ac3e28b0384dcc17f915c99`. It revises the two Huawei sites and their provider/user totals. The displayed current Huawei estimate changes from 441.0 to 468.4 MW and from 185,977 to 133,875 H100-equivalents; these are revised upstream estimates, not a measured increase in power consumption or a demonstrated loss of installed chips. US site content is unchanged apart from retrieval/current-date metadata.
