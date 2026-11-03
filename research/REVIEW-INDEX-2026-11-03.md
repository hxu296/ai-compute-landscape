# Review index — 3 November 2026

This proposal maps the fifteen-question acceptance checklist to evidence and implementation. It is submitted for independent review; no row is marked verified. The [research report](TOKEN-DEMAND-2026-11-03.md) retains exact URLs, dates, quantities, assumptions and limits. The [integration guide](SOURCE-INTEGRATION.md) lists the full-source changes and outstanding browser checks.

| ID | Report section / proposed UI | Review outcome requested and remaining limits |
|---|---|---|
| Q01 | §1; Inference → Revenue-based token scenarios | Review November S-1/A plus October H1 disclosure, rounded Q3 difference, actual days and $1/$2/$6 sensitivity. Consumption-billed traffic only; no absolute lab token observation. |
| Q02 | §2; Token accounting / growth evidence | Review cloud/model/marketplace overlap. Bedrock has nearly 17× growth without an absolute baseline; incompatible meters prevent a numerical reconciliation or unexplained-residual calculation. |
| Q03 | §3; token chart → unavailable Grok | Documented evidence gap: reviewed SpaceX September filing, Grok 4.5 announcement and tokensperday estimate. No verified company-wide served-token level; consumer/API/external-host decomposition is unknown. |
| Q04 | §4, §12; native/latest token charts | Review CoreWeave/Nebius managed-API evidence with missing counts, existing specialist disclosures, and new Applied Compute >1T/day. Every reported layer remains separate. |
| Q05 | §5; Token accounting | Review direct, router-paid and BYOK paths against OpenRouter docs. No numerical intersection disclosed, so no subtraction or union total. |
| Q06 | §7; capacity comparison → H100 | Review result 440460, raw row, actual job log and corrected 8 physical GPUs. Default 32-GPU rack packing is editable. Qwen is not DeepSeek Pro; matched H100 Pro is unavailable. No H100 cost/power quote is invented; the retained ownership scenario applies only to GB200. |
| Q07 | §8–9; lab liquidity / stress scenario | Review dated Anthropic, OpenAI, SpaceX, MiniMax and Z.ai evidence. Current cash/burn pairs and owned/rented generation-level fleets are incomplete; no exhaustion date or GPU-price forecast follows. Training-pause effect is conditional on contracts and other demand. |
| Q08 | §9; training-count evidence | Review disclosed examples, not a largest-run census. The cutoff is November 3. “Largest” would require a comparable run-wide physical allocation/accelerator-hours measure, rather than parameters alone; those data are generally undisclosed. Historical DeepSeek V3 and xAI cluster examples cannot establish current largest runs. |
| Q09 | §10; small-rack counterargument | Review the corrected Dax/Tang/Rothmann threads and related operator claims, then reproduce Flash GB300 214/305-rack scenarios. The earlier Zenodo link is outside the corrected source scope. No global meter or verified Opus multiplier supplied. |
| Q10 | §7; capacity model selectors | Review Kimi K3, raw-key GLM5.3, Qwen3.8-Flash-Next and DeepSeek records. Qwen Max unavailable; quality equivalence and workload matching unestablished. Cost/power absent for new hardware. Visual checks outstanding. |
| Q11 | §11; research report | Review July tokensperday ledgers, conversion conventions and estimate assumptions. Animation is modeled; later matching disclosures supersede older anchors without validating an additive global total. |
| Q12 | §12; Applied Compute / recurring training | Both the company and application-oriented training are covered pending interpretation. Review AC2, Kimi engineering, November activity disclosure and Modal customer evidence. Training GPU-hours, current shortage and persistent demand are unmeasured. |
| Q13 | §6; November growth scenarios | Review dated growth statements, exact daily conversions and editable assumptions. No forecast becomes a new reported bound; unknown and historical/subset/aggregate rows do not enter the platform scenario chart. |
| Q14 | §13; China modalities | Documented evidence gap: national assertion lacks a modality/tokenizer methodology; reviewed issuer/tool disclosures do not resolve national text/video shares. No majority inferred. |
| Q15 | §14; China development-tools table | Review Tencent, Baidu, Moonshot and Alibaba evidence. Integration or a named task differs from company-wide actual usage shares. ByteDance and remaining firms' internal model allocations remain unverified. |

## Reproduction and provenance

- `research/demand-research.json`: authored evidence, sources and supplemental token disclosures.
- `research/capacity-expanded.json`: selected complete raw benchmark rows, API URLs, response hashes, physical-count correction and missing model/hardware coverage. Selection is a curated comparison, not a best-of-hardware ranking.
- `automation/build_research.py`: offline browser-data generation. `automation/snapshot_capacity.py`: rebuild selected capacity records from explicitly downloaded cached responses; it does not silently refresh sources or live feeds.
- `tests/demand_scenarios.test.cjs`: seven new tests covering revenue sensitivity, dates/growth, liquidity stress, efficiency, raw GPU denominators, rack packing and evidence separation. Existing regression tests remain unchanged.

## Validation and acceptance limits

29 Node tests and 8 Python tests pass. Cached-feed validation passes in a temporary copy; packaging succeeds. Source/package links and local assets were checked. An isolated DOM simulation checks new control changes, invalid inputs, corrected H100 counts, JSON results and actual CSV bytes. This is unit-level control verification, not a real-browser inspection.

Real-browser screenshots and interaction checks at roughly 1600, 1100 and 390 pixels remain outstanding because the computer-use/browser service could not start. The full research checkout was unavailable, so integration there also remains outstanding. Preserve these limits through review; a research branch is not a deployed release.
