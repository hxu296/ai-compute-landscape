# Q07 / Q08: Model-lab census of training GPUs, fleets, runways, and the effect of a training pause

**Observation cutoff:** 2026-11-03. **Coverage:** 15 labs: OpenAI, Anthropic, Google DeepMind, Meta (MSL), xAI/SpaceXAI, Microsoft AI (MAI), Amazon (Nova/AGI), DeepSeek, Moonshot (Kimi), Z.ai/Zhipu (GLM), Alibaba (Qwen), MiniMax, ByteDance (Seed), Tencent (Hunyuan/Hy), Mistral.

**Labels**
- **R** = reported by the lab or a counterparty: tech report, model card, filing, or official blog.
- **R-press** = a lab statement relayed by the press, where no primary copy was retrievable.
- **E** = estimate. Its method is given in each case.
- **U** = undisclosed. No primary or credible estimate was found.

**Count types.** Each count is tagged with one of the following, and they are never added together:
- **RUN**: accelerators used in a specific training run.
- **CLUSTER**: the site or cluster where the run happened.
- **FLEET-OWNED**: hardware the lab owns.
- **RENTED**: capacity taken from a cloud or neocloud, or leased.
- **COMMIT**: contracted capacity that is not yet delivered.
- **H100e**: a compute-equivalent count (Epoch), not a physical count.

**Epoch AI data downloaded 2026-11-03**
- Models: https://epoch.ai/data/all_ai_models.csv
- Chip users by lab: https://epoch.ai/data/ai_chip_users.zip, file `year_end_by_lab.csv`, generated 2026-09-09
- Chip owners: https://epoch.ai/data/ai_chip_owners.zip, estimates generated 2026-04-15
- Data centers: https://epoch.ai/data/data_centers/data_centers.zip

## 1. How "largest" is defined (Q08)

"Largest" means the model with the highest training compute (FLOP) that the lab reported or that Epoch AI estimated, among models released by 2026-11-03. If no FLOP figure exists for a lab's recent models, we use its latest flagship ("frontier") release and say so. Where those two differ, both are shown: the "latest flagship" and the "largest with a known count".

## 2. Per-lab census (Q08 columns a–c; Q07 columns d–e)

| Lab | (a) Largest or latest frontier model as of 2026-11-03 | (b) Reported training accelerators: count, type, duration, kind | (c) Best estimate if not reported (E, with method) | (d) Fleet: owned / rented / committed, dated | (e) Liquidity and runway inputs, dated |
|---|---|---|---|---|---|
| **OpenAI** | **GPT-6 Astra**, released 2026-09-03. Highest Epoch FLOP of any model in the dataset. Later releases (GPT-6 Sol 2026-09-22, GPT-6.1 Terra 2026-10-26) have no compute data. | **RUN, R-press:** ">100,000 GPUs" at Stargate Abilene, TX, which OpenAI calls its largest run; Brockman: "first run…on more than 100,000 GPUs" (WION, 2026-09-05, https://wionews.com/technology/openai-launches-gpt-6-astra-its-most-capable-ai-model-yet-trained-on-more-than-100-000-gpus-1788554118321). **Chip type R-press:** Grace Blackwell NVL72. Huang posted on X on 2026-09-07, relayed at https://www.kucoin.com/news/flash/nvidia-s-huang-congratulates-openai-on-gpt-6-astra-trained-on-100-000-gpus. The GB200/GB300 mix is not disclosed. **Duration: U.** The "90–120 days" figure is unverified press. | **E (Epoch):** 9.4e26 FLOP, CI about 5e26–2e27. Method: ≥100k GB200 × 90 days × 25% FP8 MFU, with 100k treated as a lower bound (all_ai_models.csv, row last modified 2026-10-15). Previous largest: GPT-4.5 at 3.8e26 FLOP, about 187M H100-hours, multi-cluster, Microsoft Goodyear AZ (Epoch E). | **CLUSTER/RENTED (Oracle-owned) Abilene, Epoch E:** B200 rose 50,400 → 100,800 (2025-09 to 2025-12), from the Crusoe report. B300 then rose 100,800 → 201,600 → **302,400 by 2026-11-01**, estimated from building and chiller counts, about 1.02M H100e (Epoch data_centers.zip). **COMMIT:** Azure $250B incremental (2025-10/11, https://heise.de/-11016837). AWS $38B over 7 years, GB200/GB300, all deployed by end-2026 (2025-11-03, https://siliconangle.com/2025/11/03/openai-inks-38b-ai-infrastructure-deal-aws/). Oracle about $300B (same coverage). CoreWeave $22.4B total (2025-09-25, https://convergedigest.com/coreweave-inks-new-openai-contract-worth-up-to-6-5b-pushing-2025-total-to-22-4b/). OpenAI said it reached its "10 GW" US goal, which is contracted rather than proven operational (2026-04-30, https://the-decoder.com/openai-says-it-hit-its-10-gigawatt-compute-goal-years-ahead-of-schedule/). **H100e, Epoch E:** 1.74M at end-2025, derived from OpenAI's disclosed 1.9 GW (ai_chip_users.zip). | **Financing R-press:** closed $122B at $852B post-money; $2B/month revenue; $4.7B revolver undrawn (2026-03-31, https://thenextweb.com/news/openai-122-billion-round-852-billion-valuation-retail-investors). **Burn R-press (FT, internal):** about $278B negative FCF over 2026–2030 (2026-09-19, https://www.thestar.com.my/tech/tech-news/2026/09/19/openai-forecasts-cash-burn-near-280-billion-by-2030-ft-reports). **Commitments:** about $1.4T over about 8 years (Altman, 2025-11), reset to about $600B compute through 2030 (2026-02) (https://fintool.com/news/openai-600b-compute-reset). **Cash on hand: U** (private, no filing). |
| **Anthropic** | Latest flagships: **Claude Opus 5.5** (2026-09-22) and Claude Fable 5.1 (2026-09-01). No FLOP disclosed. Epoch's highest estimate for any Anthropic model is Claude 3.7 Sonnet at 3.35e25 (E), which is stale. | **RUN: U.** The S-1/A says "We train and serve Claude natively across four major chip families (AWS Trainium, Google TPUs, NVIDIA GPUs, and AMD GPUs)" (S-1/A, 2026-11-02, https://www.sec.gov/Archives/edgar/data/2130357/000162828026068676/anthropicpbc-sx1ax1.htm). | **E (method: lab statement):** AWS is the "primary training" provider (2026-04-20, https://www.anthropic.com/news/anthropic-amazon-compute). That makes Rainier Trainium2 the likely main pretraining substrate. Chip count per run: U. No Epoch FLOP estimate for Opus 5.x. | **RENTED/CSP, R:** "over one million Trainium2 chips to train and serve Claude", nearly 1 GW of Trn2+Trn3 by end-2026, up to 5 GW new (2026-04-20, same URL). **RENTED, R:** all of **Colossus 1**, more than 220,000 NVIDIA GPUs and more than 300 MW (2026-05-06, https://www.anthropic.com/news/higher-limits-spacex). **TPUs:** about 1 GW in 2026 plus multi-GW from 2027 (R-press; Broadcom filing about 3.5 GW, 2026-04-07, https://thenextweb.com/news/anthropic-google-broadcom-compute-deal). **COMMIT, R (S-1/A, as of 2026-09-30):** Google ≥$121.3B (2026-04 to 2033-07), plus $125–150B more TPU (2028–31). Amazon ≥$110.0B (2026-05 to 2036-04). Microsoft ≥$44.9B (2026-11 to 2033-06). SpaceXAI up to $120.5B, about $3.1B/month once fully delivered in Dec 2026, cancellable on 90 days' notice after Jan/Mar 2027. Nscale up to $44.6B. Lambda $41.3B. AMD Helios >$20B (2027). **H100e, Epoch E:** 1.19M at end-2025 (power × blended efficiency). | **R (S-1/A, 2026-11-02, same URL):** liquidity $131.845B at 2026-09-30 (already verified). 9M-2026 operating cash flow **+$6.569B** (+$6.6B). 9M compute and infrastructure expense **$18.808B**, of which $6.5B was short-term compute (Q3 alone $5.0B, "significantly more" expensive than multi-year compute). **Obligations:** table total $319.993B (purchase commitments $313.819B, 2026 $5.05B, 2027 $28.4B). All-in about **$895.4B**, including $451.2B of leases not yet commenced and $100.2B signed after Q3. Of that, $213.8B is subject to termination or contingent conditions. $69.8B is due in the 12 months after 2026-09-30. |
| **Google DeepMind** | **Gemini 4 Carbon** (2026-10-28), "our strongest model" (https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-gemini-4-carbon/). Gemini 4 Argon card dated 2026-10-13. | **RUN, R (generation and count U):** "trained using Google's Tensor Processing Units (TPUs)", JAX/Pathways (https://deepmind.google/models/model-cards/gemini-4-argon/, 2026-10-13). | **U** for Gemini 4. Epoch's last Google hardware estimate is Gemini 1.0 Ultra, about 57,000 TPU v4 (speculative). | **FLEET-OWNED, Epoch E (2026-03-31):** Google TPUs 6.35M units, about 4.17M H100e. Google-owned Nvidia 0.85M units, about 1.30M H100e (ai_chip_owners.zip). **DeepMind share, E:** 1.58M H100e at end-2025 (46% of operational fleet; ai_chip_users.zip). Google also now sells TPU systems externally (Q3 2026 8-K). | **R (Alphabet Q3 2026 8-K, 2026-10-28, https://www.sec.gov/Archives/edgar/data/1652044/000165204426000080/googexhibit991q32026.htm):** cash and marketable securities $265.098B. Q3 capex $51.355B. Q3 FCF −$9.065B. 2026 capex guide $195–205B (R-press, https://quartr.com/events/alphabet-goog-q3-2026_3ebmqmdr). |
| **Meta (MSL)** | **Muse Wonder** (2026-10-12), trained at Prometheus (https://techcrunch.com/2026/10/12/meta-releases-its-first-frontier-model-muse-wonder). Largest with a known count: Llama 4 Behemoth (preview, 2025-04). | **CLUSTER, R:** Prometheus has "hundreds of thousands of GPUs", GB200 NVL72 and GB300 NVL72, with a target of about 1M. Muse Wonder pretraining goodput was above 85% and RL above 90%. **RUN count: U** (2026-10-19, https://engineering.fb.com/2026/10/19/data-center-engineering/inside-prometheus-meta-gigawatt-scale-supercluster/). **Behemoth RUN, R:** 32K GPUs (Meta blog, 2025-04-05; Epoch row: H100, 5.18e25 FLOP by operation counting). | **E (Epoch, by building power):** Prometheus about 166,000 B300 from 2026-03-12 through 2026-11-30 (data_centers.zip). That is an upper bound on a single-run count, not the run itself. | **FLEET-OWNED, Epoch E (2026-03-31):** Nvidia 1.24M units (1.95M H100e) plus AMD 0.30M units (0.46M H100e) at end-2025. **MSL slice, E:** 0.996M H100e at end-2025 (52% of the operational fleet, plus about 91k rented). Meta is reported to be building a cloud business to rent out surplus compute (R-press, Bloomberg via https://thenextweb.com/news/meta-cloud-business-excess-ai-compute, 2026-07-01). | **R (Meta Q3 2026 release, https://www.sec.gov/Archives/edgar/data/1326801/000162828026066700/meta-09302026xexhibit991.htm):** cash and marketable securities $82.45B at 2026-09-30. Q3 capex $34.91B. Q3 FCF −$2.12B. 2026 capex guide $135–145B. |
| **xAI / SpaceXAI** | Latest: **Grok 4.7** (2026-09-21), "a new, larger base model", no compute given (https://x.ai/news/grok-4-7). Largest with a known count: Grok 4 (2025-07). Grok 5 is training on Colossus II (S-1). | **RUN, R:** Grok 4 RL ran on "Colossus, our 200,000 GPU cluster" (x.ai/news/grok-4, 2025-07-09). Grok 4.5: "tens of thousands of GB300" (already verified). Grok 3: about 80k H100 per xAI site (Epoch). **Grok 5: CLUSTER only.** Colossus II "is currently powering training for our next frontier models, including Grok-5" (S-1, 2026-05-20, https://www.sec.gov/Archives/edgar/data/1181412/000162828026036936/spaceexplorationtechnologi.htm). | **E (Epoch):** Grok 4 at 5e26 FLOP (speculative; Grok 3 pretraining plus RL ratio). Grok 3 at 3.5e26 (80k H100 × about 90 days). | **FLEET-OWNED, R (S-1, 2026-05-20):** Colossus first cluster about 100,000 H100 (about 130 MW). Colossus II cluster 1 about 110,000 GB200 (about 210 MW). Cluster 2: 110,000 GB300 (220 MW). Next phase ≥220,000 more GB300 (>400 MW). Combined about 1.0 GW. **R (10-Q, 2026-09-30):** nameplate compute **1.7 GW** (0.6 GW a year earlier) (https://www.sec.gov/Archives/edgar/data/1181412/000162828026066880/spcx-20260930.htm). **RENTED OUT:** Colossus 1 to Anthropic (above). Reflection about $150M/month of GB300 (R-press, https://www.datacenterdynamics.com/en/news/spacex-secures-63bn-compute-capacity-deal-from-ai-startup-reflection/, 2026-06-22). **H100e, Epoch E:** 0.63M at end-2025. | **R (10-Q, Q3 2026):** group cash $51.294B plus $38.561B short-term securities (already verified). SI "Solutions & Infrastructure" revenue $7.022B in Q3 (vs. $0.359B), **Customer B = 34.5% of Q3 consolidated revenue ($14.575B) ≈ $5.0B, SI segment**. E: Customer B is Anthropic, matching the $3.1B/month ramp. Servers and networking gross PP&E $43.2B. IPO net proceeds $85.675B (2026-06). |
| **Microsoft AI (MAI)** | **MAI-Base-2** (2026-10-15), 2.8T total / 80B active parameters. It is MAI's largest model by Epoch FLOP. | **RUN, R:** "We trained MAI-Base-2 on **16k GB200** GPUs over **38 days** in August and September 2026". Average MFU 21%, goodput 89% (https://microsoft.ai/pdf/Frontier-Pre-training-at-Microsoft-AI.pdf?v=2, 2026-10). MAI-Thinking-1: 8,192 GB200 (Epoch, from the 2026-06 MAI PDF). | **E (Epoch):** 2.4e25 FLOP (6 × 80B × 50T tokens). | **FLEET-OWNED, Microsoft-wide, Epoch E (2026-03-31):** Nvidia 2.18M units (3.32M H100e) plus AMD 0.18M. Fairwater Atlanta about 304k B200-class (2026-06) and Wisconsin about 176k (2026-04) (E, data_centers.zip). These are shared with OpenAI, so they are not MAI-specific. | **R (Microsoft FY27 Q1 8-K, 2026-10-28, https://www.sec.gov/Archives/edgar/data/789019/000119312526436122/msft-ex99_1.htm):** cash and short-term investments $64.509B. Quarterly additions to PP&E $39.367B. |
| **Amazon (Nova / Frontier Model Research)** | Latest: **Nova 2 Pro** (2025-12-02). Largest Epoch estimate: Nova Pro at 6e24 (speculative). Nova Premier reaches end of life 2026-09-14. A new frontier model is targeted for re:Invent 2026 (R-press, BI, 2026-07-28, https://www.eweek.com/news/amazon-nova-ai-overhaul/). | **RUN: U** for Nova 2. Epoch lists Nova Pro hardware as Trainium1 / A100 / H100 (no count). | **U.** No defensible estimate. | **FLEET-OWNED, Epoch E:** Amazon-designed chips (Trainium/Inferentia) 1.86M units (1.02M H100e) at end-2025. Nvidia 0.94M units (1.50M H100e) at 2026-03-31. Most of the Trainium2 is rented to Anthropic (>1M Trn2, R). | **R (Amazon Q3 2026 8-K, 2026-10-29, https://www.sec.gov/Archives/edgar/data/1018724/000101872426000038/amzn-20260930xex991.htm):** Q3 purchases of P&E $77.259B. TTM FCF −$42.4B. |
| **DeepSeek** | Largest: **DeepSeek-V4-Pro** (2026-04-24) and V4 Pro 0813 (2026-08-13): 1.6T total / 49B active, about 33T tokens. Latest: V4.1 Flash (2026-09-09, 45T tokens). | **RUN: U** for V4. The report says only that the EP scheme was "verified … on both the NVIDIA GPU and Huawei Ascend NPU platforms". A Huawei-led team post-trained V4-Pro on Ascend 910C (R-press, https://www.tomshardware.com/tech-industry/artificial-intelligence/huawei-led-team-claims-it-post-trained-deepseeks-1-6-trillion-parameter-models-on-ascend-910c-chips, 2026-07). **Largest with a reported count: V3, RUN, R:** 2,048 H800, 2.788M H800 GPU-hours (already verified). | **E (Epoch):** V4-Pro at 9.7e24 FLOP (6ND: 49B × 33T). | **FLEET, E:** about 50k Hopper (SemiAnalysis 2025, via https://www.lowyat.net/2025/341981/deepseek-could-have-50000-nvidia-hopper-gpus-spent-us1-6-billion-building-servers/). **Unverified leaked call (2026-05-20):** about 20,000 Nvidia H-equivalent cards, plus a Huawei allocation of about 16,000 Ascend 950. Frontier training would need about 50k GB300 (https://www.implicator.ai/deepseek-leaked-call-huawei-16000-chips/, 2026-07-22). | **R-press:** sought ≥RMB10B at ≥RMB480B pre-money; the round was paused (Bloomberg, 2026-07-25, same implicator URL). Cash: U (private, High-Flyer-funded). |
| **Moonshot (Kimi)** | Largest: **Kimi K3** (2026-07), 2.8T total / 104B active (https://huggingface.co/moonshotai/Kimi-K3). Latest: K3.1 Pro (2026-10-23). | **RUN: U.** The K3 model card gives no training hardware, and the technical report is "to follow". K2 / K2.5 were trained on H800 (Epoch, from the K2 report; count U). | **E (Epoch, speculative):** 2.0e25 FLOP, assuming about 30T tokens (15–60T range) by 6ND. | **U.** No primary fleet disclosure. | **R-press:** about $2B round at >$20B (2026-05-07, https://thenextweb.com/news/moonshot-ai-20bn-valuation-kimi-meituan-china-mobile). Series F >$3.5B total at $35B (2026-07, https://www2.yicaiglobal.com/news/moonshot-ais-latest-fundraiser-lifts-valuation-to-usd35-billion-amid-kimis-silicon-valley-buzz). |
| **Z.ai / Zhipu (GLM)** | Latest: **GLM-5.3** (2026-08-14, 744B). Largest Epoch estimate: **GLM-5** (2026-02-12; 40B active, 28.5T tokens). | **RUN: U.** The GLM-5 report (https://arxiv.org/pdf/2602.15763) describes Ascend and six other domestic chips only for *inference adaptation*. Epoch's "Ascend 910C" training-hardware label is not supported by the report text. | **E (Epoch):** GLM-5 at 6.84e24 FLOP (6ND). | **U** (no count). | **R (already verified):** RMB3.994B cash plus RMB0.506B short-term investments at 2026-06-30, and a HK$31.375B placement in July 2026. |
| **Alibaba (Qwen)** | **Qwen3.8-2.4T-A95B / Qwen 3.8 Max** (2026-07/08), 2.4T total / 95B active (https://huggingface.co/Qwen/Qwen3.8-2.4T-A95B). | **RUN: U.** No public tech report gives hardware. | **E (ours):** 6 × 95B × 36T tokens (the Qwen3 token count, assumed) ≈ 2.1e25 FLOP. Low confidence. Epoch has no figure. | **U** for Qwen. Alibaba Cloud fleet: U. | **R (6-K, 2026-08-20, https://www.sec.gov/Archives/edgar/data/0001577552/000110465926099220/tm2623667d1_ex99-1.htm):** June-quarter capex RMB67.68B. FCF −RMB27.33B. AI Labs segment adjusted EBITA loss RMB13.86B. |
| **MiniMax** | Latest: **MiniMax-M3** (2026-06-01; Epoch lists 428B). Largest Epoch estimate: M1-80k at 4.3e24. | **RUN: U** for M3; training compute is not disclosed (press). **M1 RL RUN, R:** "3 weeks on 512 H800" (https://arxiv.org/abs/2506.13585, 2025-06). | **U** for M3. | **U.** The company says a "large-scale domestic compute cluster" is coming online (R-press, interim call, 2026-08). | **R (already verified):** broad cash $1.3228B at 2026-06-30. H1 adjusted loss $293M. Runway ≈ 1.3228 / (0.293 × 2) ≈ 2.3 years at the H1 run-rate (E; ignores capex and new raises). |
| **ByteDance (Seed)** | Latest: **Seed 2.1 Pro** (2026-06-23). Largest Epoch estimate: Doubao-pro at 2.5e25 (2024). | **RUN: U.** The Seed 2.1 model card has no compute section (https://lf3-static.bytednsdoc.com/obj/eden-cn/lapzild-tss/ljhwZthlaukjlkulzlp/seed2.1/Seed2_1_Model_Card.pdf). Largest reported run: MegaScale, 12,288 A100 (2024 paper; Epoch). | **U** for Seed 2.x. | **E (Epoch):** Bridge MY06 Johor about 221k H100e (A100/H100/B200). **Plan, R-press (FT):** 2026 capex RMB160B, about RMB85B of it on AI chips (2025-12-23, https://www.thestandard.com.hk/tech-and-startup/article/319982/ByteDance-plans-to-spend-160-b-yuan-towards-AI-infrastructure-in-2026-FT-reports). | Private; cash U. |
| **Tencent (Hunyuan / Hy)** | **Hy4 preview** (2026-08-28, 770B, Epoch) is the latest. **Hy3** (2026-07): 295B total / 21B active (https://huggingface.co/tencent/Hy3). | **RUN: U.** The Hy3 card mentions only 8-GPU serving. | **E (Epoch):** largest estimate is Hunyuan-TurboS at 5.4e24 (2025). U for Hy3/Hy4. | **U.** | **R-press:** Q2 2026 capex about RMB52.8B, FCF about −RMB13.8B (2026-08-12, https://beancount.io/blog/2026/09/14/tencent-q2-2026-earnings-analysis). |
| **Mistral** | **Mistral Large 4** (2026-10-06), 1.05T total / 52B active. | **RUN, R:** "pretrained on **3,840 NVIDIA GB200** GPUs in a Mistral data center near Paris … **45 days**, or about **4.15 million GPU-hours**, MFU 36%, goodput 94.1%" (https://huggingface.co/mistralai/Mistral-Large-4-1T-A52B/blob/main/assets/technical_report.pdf). | **E (Epoch):** 1.24e25 FLOP from the reported hours and MFU. | **FLEET-OWNED/financed, R-press:** 13,800 GB300 at Bruyères-le-Châtel (about 44 MW), funded with about $830M of debt (2026-03-30, https://datacenterdynamics.com/en/news/mistral-ai-raises-830m-in-debt-financing-for-data-center-in-paris-france). Target 200 MW by end-2027. **Sold out:** Microsoft committed multiple billions to use part of Mistral Compute (2026-07-21, https://www.datacenterdynamics.com/en/news/microsoft-to-spend-billions-on-gpus-to-be-shared-with-ai-lab-mistral/). | **R:** Series C €1.7B (2025-09, https://mistral.ai/news/mistral-ai-raises-1-7-b-to-accelerate-technological-progress-with-ai). Cash: U. |

**Distinguishing count types (Q08 acceptance)**

Only four frontier models have a disclosed physical run count:
- MAI-Base-2: 16k GB200, 38 days
- Mistral Large 4: 3,840 GB200, 45 days
- DeepSeek-V3: 2,048 H800, 2.788M GPU-hours (an older model)
- GPT-6 Astra: >100k Grace Blackwell. This is a press-relayed lower bound with no duration.

Everything else is a cluster figure (Grok 4's "200k-GPU Colossus", Prometheus "hundreds of thousands"), a rental figure (Anthropic's ">1M Trainium2 to train *and serve*", Colossus 1 ">220k GPUs"), a commitment (dollar contracts), or an H100e estimate. Those must not be read as run sizes.

## 3. Training-pause price mechanism (conditional, not a forecast)

### 3.1 Inputs on the training vs. inference split

- **Anthropic, R (S-1/A, 2026-11-02, Note 8):** 9M-2026 cost of revenue was $4.812B, "substantially all" of it compute for customer-serving workloads. R&D was $19.240B, covering compute for model development, research and internal use, plus personnel. Total compute was $18.808B.
  - **E:** customer-serving compute ≈ ≤26% of compute spend. Research, training and internal use (plus free-tier compute booked in S&M) ≈ 65–75%. Method: $18.8B − $4.8B, less an assumed $1–2B of S&M free-tier compute. Note that RL rollouts count as training but behave like inference.
  - The pool is "fungible by design … directed to wherever it is expected to be most productive". A pause therefore re-routes capacity to inference first.
  - Commitments "must be satisfied regardless of our revenue or utilization" (S-1/A).
- **Meta, E (Epoch):** MSL holds about 52% of Meta's operational fleet; the rest runs recommenders.
- **OpenAI:** no audited split. **Google:** U.
- **Spot and short-term demand from labs, R:** Anthropic bought $6.5B of short-term compute in 9M-2026, $5.0B of it in Q3 alone (S-1/A).
  - **E:** at $3/H100-hr, $5.0B/quarter ≈ 760k H100-equivalents for a full quarter ($5.0B / ($3 × 2,190 h)). At $6.5 per B200-hr, about 350k B200.

### 3.2 Rental prices now (R; full table in §4b)

| Index | Chip | Price | Date |
|---|---|---|---|
| Silicon Data SDH100RT | H100 | $2.96/hr | 2026-11-03 |
| Ornn OCPI | H100 SXM | $3.38/hr | 2026-11-02 |
| Ornn OCPI | H200 | $7.12/hr | 2026-11-02 |
| Ornn OCPI | B200 | $9.41/hr | 2026-11-02 |

All are up from September 2026: Ornn H100 was $2.69 at end-September and B200 averaged $7.26 in September. The SemiAnalysis 1-yr H100 contract rose from about $1.70 (2025-10) to about $2.35 (2026-03).

### 3.3 Scenarios

Each scenario reads "if X, then the channel and size are…". None of them is a forecast.

| # | Condition | Channel to rental prices | Size indicator | Direction |
|---|---|---|---|---|
| S1 | One frontier lab pauses *pretraining* but keeps RL and inference | Fungible pool is re-routed to serving. Nothing is released to market, and take-or-pay commitments continue. | Anthropic's ≥$313.8B non-cancelable purchase commitments (R) | ≈ none |
| S2 | The lab also stops buying short-term or spot compute | Marginal demand is withdrawn from neocloud and short-term markets | About $5B/quarter at Anthropic in Q3 2026 (R), ≈ 760k H100e-quarters (E) | Downward pressure on the short-term tier only |
| S3 | The lab sublets committed capacity | Supply is added through leases or marketplaces. Precedent: xAI leased all of Colossus 1 (>220k GPUs) to Anthropic within weeks, and GB300 to Reflection. SF Compute resells lab overhang. | Leases at $1.25–3.1B/month (R) | 2026 supply was absorbed while indices rose, so there is no evidence it lowered prices |
| S4 | Industry-wide training pause | Up to about 65–75% of a lab's compute spend becomes "non-serving" (Anthropic E). Most is tied to long contracts, and the release depends on contract cancellability (Anthropic: $213.8B contingent or terminable; SpaceXAI leases on 90 days' notice). | Fleet totals (Epoch H100e) are **not** the released quantity | The upper bound is large. The actual price effect depends on inference demand growth: Google's API tokens rose 4× YoY to about 32B tokens/min (Alphabet Q3 8-K). |

**Rule applied:** fleet totals (millions of H100e) do not imply a price collapse. Only capacity that is both *released* (cancellable or sublettable) and *not re-routed to inference* reaches the rental market.

## 4. Neolab resale and oversupply evidence (R/E labeled)

### 4a. Subleasing, reselling, renting out, or exiting compute (2025–2026)

| Date | Entity | Fact | Number | Source | R/E |
|---|---|---|---|---|---|
| 2025-01-09 | 01.AI | Kai-Fu Lee: "We don't own GPUs… impossible for us to sell them". The company exited pre-training and its infra team moved to Alibaba Cloud | n/a | https://kr-asia.com/kai-fu-lee-sets-the-record-straight-on-01-ais-pivot | R |
| 2024-08 | Character.AI | Stopped frontier training after the Google license and rehire deal. No GPU resale found | about $2.7B deal | https://www.axios.com/2024/08/05/google-characterai-venture-capital | R (exit); resale U |
| 2025-03-26 | Microsoft (hyperscaler) | Walked away from about 2 GW of planned leases | ~2 GW | https://www.bloomberg.com/news/articles/2025-03-26/microsoft-abandons-more-data-center-projects-td-cowen-says | R (analyst) |
| 2025 | China idle DCs | 8×H100 server monthly rent fell from ¥180k to ¥75k; about 80% of new capacity idle | ¥180k→¥75k | https://www.datacenterknowledge.com/ai-data-centers/tumbling-prices-end-china-s-ai-data-center-binge | R (80% is an estimate) |
| 2026-04 | Poolside | CoreWeave Project Horizon contract ended after a missed chip-online deadline | 250 MW | https://www.datacenterdynamics.com/en/news/poolside-seeks-partners-for-data-center-in-texas-after-coreweave-deal-falls-apart/ | R-press |
| 2026-05-06 | xAI → Anthropic | All of Colossus 1 | >220k GPUs, >300 MW | https://www.anthropic.com/news/higher-limits-spacex | R |
| 2026-05-20 | xAI | S-1: $1.25B/month to Anthropic through 2029-05, on 90 days' notice. Calls it "monetization of unused compute capacity" | $1.25B/mo | SpaceX S-1 (URL above) | R. Later amendments: up to $120.5B and $3.1B/month, per the Anthropic S-1/A |
| 2026-06-12 | xAI | Bloomberg: Colossus 1 was rented out because it was hard to use for Grok training (latency, mixed chip generations) | n/a | https://thenextweb.com/news/spacex-colossus-1-technical-problems-rented-anthropic | R-press |
| 2026-06-22 | xAI → Reflection AI | GB300 at Colossus 2, from 2026-07 to 2029 | $150M/mo (~$6.3B) | https://www.datacenterdynamics.com/en/news/spacex-secures-63bn-compute-capacity-deal-from-ai-startup-reflection/ | R-press |
| 2026 (unverified) | xAI → Google | Reported cloud deal | $920M/mo | https://wccftech.com/spacex-rented-out-colossus-1-over-its-mish-mash-of-gpus-but-now-its-renting-out-colossus-2-capacity-as-well-raising-doubts-over-grok-ais-future/ | Unverified |
| 2026-07-01 | Meta | Reported building a cloud business to rent out surplus AI compute | n/a | https://thenextweb.com/news/meta-cloud-business-excess-ai-compute | R-press |
| 2026-07-21 | Mistral → Microsoft | Microsoft to use part of Mistral Compute's French GPUs | multi-$B | https://www.datacenterdynamics.com/en/news/microsoft-to-spend-billions-on-gpus-to-be-shared-with-ai-lab-mistral/ | R-press |
| 2026-09-10 | SF Compute (marketplace) | Started as a lab that had to "sublease or go under". Sold $245M of B300 clusters. Says customers recover about 25% of compute spend by reselling | $245M; 25% | https://sfcompute.com/news/tcv-q3-2026 | R (self-reported) |
| 2026-10-24 | Unnamed neolab | Founder: "we can just resell the compute and print money". A Modal executive predicts "neolab to neocloud pivots" | anecdotal | https://x.com/Yuchenj_UW/status/2114043133734637735 | E/anecdotal |

No sourced 2025–2026 resale, sublease or exit was found for Inflection, Adept, Reka, Essential, Magic, H Company, Thinking Machines, SSI, Baichuan, StepFun or Zhipu.

### 4b. Rental price indices (US$/GPU-hr)

| Date | Index | Chip | $/hr | Source | R/E |
|---|---|---|---|---|---|
| 2024-H2 | Silicon Data neocloud / marketplace median | H100 | 2.99 / 2.58 | https://www.silicondata.com/blog/h100-rental-price-over-time (2025-12-21) | R |
| 2025-H2 | Silicon Data neocloud / marketplace / hyperscaler | H100 | 3.33 / 1.95 / 6.26 ("oversupply-driven") | same | R |
| 2025-10 → 2026-03 | SemiAnalysis 1-yr contract | H100 | ~1.70 → ~2.35 | https://newsletter.semianalysis.com/p/the-great-gpu-shortage-rental-capacity (2026-04-02) | R |
| 2025-12-09 → 2026-01-06 | Silicon Data index | H100 | 2.00 → 2.20 | https://www.silicondata.com/blog/h100-price-spike | R |
| 2026-08-04 | Ornn OCPI | H100 / H200 / B200 | 2.66 / 4.64 / 5.92 | https://data.ornn.com/markets/h100-sxm | R |
| 2026-10-05 → 2026-11-03 | Silicon Data SDH100RT | H100 | 2.81 → 2.96 | https://www.silicondata.com/products/silicon-index/h100 | R |
| 2026-11-03 | Silicon Data | H200 / B200 | 3.52 / 6.54 | https://www.silicondata.com/products/silicon-index/b200 | R |
| 2026-11-02 | Ornn OCPI | H100 / H200 / B200 | 3.38 / 7.12 / 9.41 | https://data.ornn.com/markets/b200 | R |

Index levels differ by method (transacted vs. posted vs. contract). Compare trends within one index, not levels across indices.

**Read-across:** the oversupply episode ran from mid-2024 to late 2025. Every index rose from December 2025 to November 2026. In 2026 the largest released capacity came from a *frontier* lab (xAI), not a failed neolab, and it was absorbed at rising prices.

## 5. Concise answers

**Q07.**
- **Coverage:** 15 labs, data as of 2026-11-03.
- **Disclosed runways:**
  - Anthropic: $131.8B liquidity, operating-cash-flow positive (+$6.6B over 9M), against approximately $895.4B of aggregate committed spend (S-1/A: $447.5B expected before 2031; about $69.8B due within 12 months), substantially all compute and infrastructure.
  - SpaceX/xAI: $89.9B cash plus securities at group level. Colossus I/II nameplate is 1.7 GW, and a large share is rented to Anthropic (Customer B ≈ $5.0B in Q3).
  - OpenAI: $122B raise; about $278B of FCF burn planned for 2026–30 (FT); no cash figure.
  - MiniMax: about 2.3 years at the H1 loss rate (E).
  - Z.ai: RMB4.5B plus HK$31.4B placement.
  - Hyperscaler parents (Alphabet, Meta, Microsoft, Amazon): all have negative or near-zero FCF at current capex.
- **Chips:** owned, rented and committed counts per lab are in §2. Physical counts are R where filed (xAI S-1, Anthropic, Mistral); otherwise they are Epoch H100e estimates labeled E.
- **Training-pause effect:** conditional. Per Anthropic's filing, about 65–75% of a frontier lab's compute spend is non-serving (E). But pools are fungible and contracts are take-or-pay, so a pause mainly (i) re-routes compute to inference and (ii) withdraws short-term demand (about $5B/quarter at Anthropic). Only sublet capacity reaches the market, and 2026 sublets were absorbed while prices rose (H100 $2.96–3.38, B200 $6.54–9.41 on 2026-11-02/03). **No price collapse follows from fleet totals.**

**Q08.**
- **Definition:** "largest" = highest reported or Epoch-estimated training FLOP by 2026-11-03, otherwise the latest flagship.
- **Reported run counts:**
  - OpenAI GPT-6 Astra: >100k Grace Blackwell at Abilene. R-press, lower bound, duration U; E 9.4e26 FLOP.
  - Microsoft MAI-Base-2: 16k GB200 × 38 days. R.
  - Mistral Large 4: 3,840 GB200 × 45 days, 4.15M GPU-hours. R.
  - Meta: Llama 4 Behemoth at 32K H100 (R). Muse Wonder ran at Prometheus, run count U (cluster up to about 166k B300, E).
  - xAI: Grok 4 RL on the 200k-GPU Colossus cluster (R, cluster not run). Grok 4.5 on tens of thousands of GB300 (R). Grok 5 is on Colossus II, count U.
  - DeepSeek: V3 at 2,048 H800 / 2.788M hours (R). V4-Pro count U; E 9.7e24 FLOP.
  - MiniMax: M1 RL on 512 H800 × 3 weeks (R).
- **Undisclosed run counts (FLOP estimate given where one exists):**
  - Anthropic Opus 5.5: U (likely Trainium2/Rainier, E)
  - Google Gemini 4 Carbon: U (TPU, R)
  - Moonshot Kimi K3: E 2.0e25 FLOP
  - Z.ai GLM-5: E 6.8e24 FLOP
  - Alibaba Qwen3.8: E about 2.1e25 FLOP
  - ByteDance Seed 2.1: U
  - Tencent Hy3/Hy4: U
  - Amazon Nova 2: U
- **Do not substitute other count types for these run counts:** fleet (H100e), rental (Rainier >1M Trn2, Colossus 1 >220k) and commitment figures.
