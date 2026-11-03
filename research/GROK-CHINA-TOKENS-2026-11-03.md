# Q03 (Grok token usage) and Q14 (China text vs video-generation tokens)

Research date: 2026-11-03. Labels: **R** = reported by a source, quoted or closely paraphrased. **D** = arithmetic on R values only. **E** = estimate that needs at least one assumption; every assumption is stated.
No repository was edited. Downloaded pages were saved to /tmp/q03dl and /tmp/q03s1 (outside the repo).

---

## Q03: Grok token usage

### Bottom line
- **No primary absolute disclosure exists.** xAI, SpaceX and Musk have published no tokens/day or tokens-processed figure for Grok as of 2026-11-03. I searched the S-1, the Q3 10-Q, the Q3 earnings call and X/press coverage. The S-1 defines "tokens" and discusses "cost per token", but it gives no volume.
- **Router floor (D):** about **74B tokens/day**, from **~521B tokens** in the 7-day window starting 2026-10-27 on OpenRouter, summed across all xAI models.
- **xAI API, all channels (E):** **0.4 / 1.5 / 5 T/day** (low / central / high).
- **Consumer Grok text (E), covering grok.com, apps, X, Grok Bot, Tesla and Telegram:** **0.4 / 2 / 10 T/day**.
- **Company-wide Grok text inference (E):** **0.8 / 3.5 / 15 T/day**. This is API plus consumer. The two scopes don't overlap, so they can be added. It excludes Imagine image/video generation, training and synthetic data, and internal X ranking workloads.
- **Imagine generation volume (R):** about 2B videos and 10B images per month in Q1 2026. These are not LLM tokens and are kept separate. If they were counted with ByteDance's video-token formula, they would equal **~4–12 T/day "video tokens"** (E). That would be larger than all Grok text, so it must never be added to the text figures.
- **Cross-check:** tokensperday.com estimates xAI at 0.1–7.5T/day (~0.9T midpoint, July 2026). Our central company-wide figure is ~3.5T in Nov 2026. The difference comes from Grok Bot's Sept–Oct ramp and 4.6/4.7 agentic usage.

### Reported inputs (R)
| # | Item | Value | Source, date, quote/paraphrase |
|---|---|---|---|
| R1 | Grok MAU | ~117M MAUs used Grok's AI features at 2026-03-31, out of ~550M MAU across X+Grok | SpaceX S-1, https://www.sec.gov/Archives/edgar/data/0001181412/000162828026036936/spaceexplorationtechnologi.htm : "Of our MAUs, we had approximately 117 million MAUs that used Grok's AI features as of March 31, 2026." |
| R2 | Paid subs | ~1.9M SuperGrok/Heavy/Lite plus ~4.4M X Premium/Premium+ (6.3M total), at 2026-03-31 | Same S-1: "approximately 6.3 million active paid subscribers ... approximately 1.9 million SuperGrok, SuperGrok Heavy and SuperGrok Lite paid subscribers." |
| R3 | Imagine output | ~10B images and >2B videos per month (Q1 2026 average). Videos up to 15 s at 720p | Same S-1: "Imagine, produced approximately 10 billion images and over 2 billion videos per month, on average, for the quarter ending March 31, 2026"; "short videos (up to 15 seconds at 720p in current iterations)". |
| R4 | Revenue lines | "AI solutions and infrastructure" includes "subscription-related offerings, data licensing arrangements, and API access to Grok models". API is not broken out. FY2025: X+Grok subscription revenue rose $365M | Same S-1, revenue recognition note and MD&A. |
| R5 | Q3 2026 SI segment | SI segment revenue $7,560M, of which SI Solutions & Infrastructure $7,022M and Advertising $538M. Consolidated revenue $14,575M. "Customer B" = 34.5% of consolidated revenue and "relates to the SI segment" | SpaceX 10-Q for the quarter ended 2026-09-30, https://www.sec.gov/Archives/edgar/data/1181412/000162828026066880/spcx-20260930.htm (Note 3 and concentration note). The SI segment entered "cloud services arrangements" with "fixed monthly fees". |
| R6 | Cursor contribution | "$608 million came from the Cursor acquisition closed roughly mid-quarter"; "even excluding Cursor, SI Solutions and Infrastructure revenues grew 192% sequentially", driven by cloud services agreements | Q3 2026 call, 2026-10-20, https://www.fool.com/earnings/call-transcripts/2026/10/20/spacex-spcx-q3-2026-earnings-call-transcript/ (CFO Bret Johnsen) |
| R7 | Grok Bot | "paid weekly users of 800,000 earlier this month, more than doubling over the last month" (Shotwell). "Grok bot may end up being what uses most of our Super Intelligence compute" (Musk). Compute split "50-50 ... half of the compute is used internally". Inference partly offloaded "to other cloud providers" | Same call, 2026-10-20 |
| R8 | Grok Bot DAU | ~67k (Sep 6), ~300k (Oct 1), ~600k (Oct 26), per Similarweb data that Musk shared on X | Seoul Economic Daily, 2026-10-31, https://en.sedaily.com/finance/2026/10/31/grokbot-closes-in-on-muse-as-musk-targets-meta |
| R9 | Grok app DAU | Mobile-app DAU 12.2M in April 2026, down from 13.9M in March (Similarweb) | Forbes, 2026-05-05, https://www.forbes.com/sites/conormurray/2026/05/05/elon-musks-grok-loses-users-throughout-2026-as-rivals-rise/ (403 on fetch; figures from the search snippet) |
| R10 | OpenRouter, per model | 7-day window, analytics bucket dated 2026-10-27, page fetched 2026-11-03. Grok 4.7: 281B (prompt 271.7B, of which cache-read 235.4B; completion 8.9B). Grok 4.5: 81.8B. Grok 4.6: 68.6B. Grok 4.3: 45.1B (+0.8B batch). Grok 4.20: 23.5B. Grok Latest: 14.5B. Grok Build 0.1: 3.57B. 4.20 Multi-Agent: 1.29B. Imagine Image 2.0: 0.64B. Imagine Image Quality: 0.26B. TTS: 0.03B. Imagine video output: 315,192 seconds in the week | https://openrouter.ai/x-ai (embedded analytics JSON; author shown as "SpaceXAI") |
| R11 | OpenRouter, independent tracker | Grok 4.7 ranked #40 at 351B weekly tokens, -39% ("Data updated: Nov 4, 2026"). Earlier: ~599B for Oct 7–13 | https://airanks.app/models?period=week |
| R12 | OpenRouter platform | ~194T tokens in the week ending 2026-10-26 (investor chart, secondary). No xAI model is in OpenRouter's weekly top 10. The leader is DeepSeek V4.1 Flash at 113T/week | https://fourweekmba.com/ai-openrouters-run-rate-tops-10-quadrillion-tokens-up-6-7x/ ; https://openrouter.ai/rankings ("Usage data through Nov 2, 2026") |
| R13 | API price | Grok 4.7: $2/M input, $6/M output, $0.50/M cache read | https://openrouter.ai/x-ai/grok-4.7 (FAQ JSON-LD, fetched 2026-11-03) |
| R14 | External hosts | Grok 4.7 on Amazon Bedrock (AWS blog, 2026-09-28, model ID `us.xai.grok-4.7`). Grok 4.7 listed in the Microsoft Foundry catalog. Grok 4.6 reached Bedrock on 2026-08-19 and Azure on 2026-08-26, and is also on Google Cloud. **No host discloses Grok token volume.** OCI hosts Grok 3/4; no 4.7 found | https://aws.amazon.com/blogs/machine-learning/grok-4-7-is-now-available-on-amazon-bedrock/ ; https://ai.azure.com/catalog/models/grok-4.7 ; https://runtimewire.com/article/xai-grok-4-6-microsoft-foundry |
| R15 | Telegram / Tesla | Telegram: a 1-year deal announced May 2025 ($300M cash+equity); no 2026 usage figure. Tesla: Grok in cars since 2025-07-12 (OTA 2025.26); no usage figure | https://wbgsv0b.gigazine.net/gsc_news/en/20250529-xai-pay-telegram-300-million-integrate-grok ; https://www.digitalcitizen.life/what-is-grok-in-tesla-and-how-does-it-work-as-your-in-car-ai-assistant/ |
| R16 | Grok Bot cost | Musk (about 2026-11-01): serving cost "unsustainably high relative to revenue"; weekly limits tightened. No figures | https://teslarati.com/grok-bot-users-hit-weekly-limits-early-elon-musk-explains-what-happened (secondary) |

### Arithmetic (D)
- D1. OpenRouter, all xAI models: sum of R10 = **521B tokens/7 days, about 74.4B/day**. Grok 4.7 alone is about 40B/day.
- D2. xAI share of OpenRouter: 0.52T / 194T ≈ **0.27%** of platform tokens.
- D3. The OpenRouter Grok 4.7 mix is **84% cache-read**. Blended price = (36.4B×$2 + 235.4B×$0.5 + 8.9B×$6) / 280.7B ≈ **$0.87 per M tokens**.
- D4. Customer B ≈ 0.345 × $14,575M = **$5,028M** in Q3. SI S&I minus Customer B minus Cursor = 7,022 − 5,028 − 608 = **~$1,386M/quarter**. That residual covers other cloud-services customers (Fortune says Google; https://fortune.com/2026/10/20/spacex-q3-profit-ai-si-elon-musk/), Grok and X subscriptions, Grok Business/Enterprise, data licensing **and** API. So API revenue is well under $1.4B/quarter.
- D5. Imagine averages ≈ **67M videos/day** and **333M images/day** (Q1 2026).

### Estimates (E), each with its scope

**(iii) Router floor. Scope: Grok via OpenRouter only.**
74B/day (D1). This is a hard floor for third-party API traffic. It is not representative of the whole API, because OpenRouter skews toward price-sensitive agent and coding apps.

**(i) xAI API. Scope: first-party api.x.ai plus OpenRouter plus Bedrock, Azure and Google marketplaces. Excludes consumer apps.**
- Method A, router share. Assume OpenRouter carries 3–20% of xAI API tokens (central 7%). That gives 74B ÷ {0.20, 0.07, 0.03} = **0.37 / 1.06 / 2.5 T/day**.
- Method B, revenue ÷ price. Assume API revenue of $80M / $200M / $400M per quarter, a subset of the D4 residual. Assume a blended price of $2.0 / $1.2 / $0.9 per M (from D3, plus less-cached first-party traffic). That gives **0.44 / 1.8 / 4.9 T/day**.
- Combined: **low 0.4, central 1.5, high 5 T/day.**

**(ii) Consumer text. Scope: grok.com, iOS/Android apps, Grok on X, Grok Bot, Tesla, Telegram. Excludes Imagine.**
- Chat. Assume DAU of 15 / 25 / 40M. This is bounded below by 12.2M mobile-app DAU (R9) and above by 117M MAU (R1) at a 13–35% DAU/MAU ratio. Assume 4 / 7 / 12 messages per DAU per day and 2k / 6k / 15k tokens processed per message (system prompt, history, X/web retrieval, reasoning and output). Result: **0.12 / 1.05 / 7.2 T/day**.
- Grok Bot agent. Assume ~600k DAU (R8) × 0.5 / 1.5 / 5M tokens per user-day, consistent with "unsustainably high" serving cost (R16). Result: **0.3 / 0.9 / 3.0 T/day**.
- Consumer total: **low 0.4, central 2, high 10 T/day.**

**Company-wide Grok text.** API (i) plus consumer (ii). The scopes are disjoint, so they add.
**0.8 / 3.5 / 15 T/day.** The OpenRouter floor is already inside (i); I did not add it again.
- Not included: internal workloads such as Grok in X ranking and moderation, synthetic data and evals, and training. There is no data to size them.
- Also not included: Cursor's own models running on xAI compute. Those are not Grok tokens.

**Imagine, as an equivalent only and never added.** 67M videos/day × 6–8 s × 10k–21.6k "video tokens"/s (ByteDance formula, see Q14) ≈ **4–12 T/day** equivalent. Images are not converted because there is no reliable per-image token basis.

**Limits.** All non-router figures depend on assumed DAU, message and price inputs. The R inputs are 1–7 months old: MAU and subscribers are from Mar 31, DAU from April, Grok Bot from October. Grok Bot grew about 9x in 50 days, so the high case is the one most likely to move.

---

## Q14: China, text versus video-generation tokens

### Bottom line
- **No official modality split exists.** The NDA (National Data Administration) figure (>500T/day, June 2026), CAICT (~175T/day "core", June 2026), Volcano Engine (Doubao 180T/day, June 2026) and IDC 2025 give no text/video breakdown.
- **Video tokens are countable.** Volcano Engine bills Seedance video as (input + output seconds) × width × height × fps / 1024. At 720p/24fps that is **~21,600 tokens per second of video**, or ~1 RMB/s at the 46 RMB/M list price.
- **Estimate (E):** video generation is about **0.3% / 1.6% / 8%** (low / central / high) of China's ~500T/day, which is **~1.7 / 8 / 40 T/day**. Within Doubao specifically, it is **~0.7% / 3.5% / 19%** of 180T.
- **Answer:** China's tokens are **mostly text-output LLM and agent tokens**, including multimodal *understanding* inputs. I have high confidence that video generation is under 25% of the national figure, and moderate confidence that it is under 5%.
- **Contrary claims:** Two secondary claims point the other way and are flagged below. One says ">50% of Doubao tokens from Seedance+Seedream" (unverified). The other says "multimodal has replaced pure text as the main token consumer" (qualitative, and it includes understanding inputs).

### Reported inputs (R)
| # | Item | Value | Source, date, quote |
|---|---|---|---|
| C1 | National total | >500T/day by June 2026 (from 100B/day in early 2024). No scope definition and no modality split | NDA, 2026-10-25, https://www.nda.gov.cn/sjj/zwgk/zjjd/1025/20261025174331093963574_mobile.html : "2024年初我国日均词元调用量仅为1000亿，截至2026年6月已突破500万亿。" |
| C2 | National, core vs broad | "官方监测的核心日均量为175万亿，而涵盖更广产业边界的宽口径测算则达到了500万亿" (June 2026). The 175T is attributed elsewhere to CAICT vice-president 魏亮 (WAIC 2026) / CCID | Sina/图观中国, 2026-11-02, https://finance.sina.com.cn/roll/2026-11-02/doc-inixhwzc2417371.shtml ; https://post.smzdm.com/p/a826kng7/ |
| C3 | National, March | NDA director 刘烈宏: ">140万亿" per day at March 2026 | Xinhua, 2026-03-24, https://www.news.cn/fortune/20260324/20a657c812d847b186f965351d546063/c.html |
| C4 | Doubao total | "截至6月，豆包大模型日均Token调用量突破180万亿，过去一年增长超10倍" | Yicai via QQ, 2026-06-23, https://news.qq.com/rain/a/20260623A06E4C00 ; Sina, https://finance.sina.com.cn/jjxw/2026-06-23/doc-iniekeev9806777.shtml |
| C5 | Doubao scope | Tan Dai: the daily figure includes "内部、外部，也包括豆包App本身" | Huxiu/未尽研究, 2026-09-09, https://www.huxiu.com/article/4889650.html |
| C6 | Growth driver (qualitative) | Doubao exceeded 120T/day by March 2026; growth driven by "AI视频创作的爆发与AI智能体的加速普及" | QQ, 2026-04-02, https://news.qq.com/rain/a/20260402A05U4G00 ; Sina, 2026-04-03, https://finance.sina.com.cn/stock/t/2026-04-03/doc-inhtcspt4234518.shtml |
| C7 | Multimodal "main consumer" (qualitative) | "随着视频模型 Seedance 2 的爆火，多模态已经取代纯文本，成为 Token 消耗的主力。" No number | 机器之心 via QQ, 2026-04-02, https://news.qq.com/rain/a/20260402A04ALD00 |
| C8 | >50% claim (secondary, unverified) | "据媒体报道，豆包大模型的Token消耗中超过一半来自Seedance和Seedream两个多模态生成模型系列。" I could not find the original media report. The same article also says "Seedance系列模型近一半的调用量来自海外市场" (Tan Dai, June) and estimates Seedance overseas at "近50万亿" per day, about 10% of 500T | 未尽研究 on Huxiu, 2026-09-09, https://www.huxiu.com/article/4889650.html |
| C9 | IDC split (H1 2025) | "除NLP模型外，其他模态模型的使用占比正在逐步提升，目前约占20%左右。" Unit unspecified; covers all non-NLP models, not video only | IDC press release, 2025-10-28, https://www.idc.com/?p=104418 |
| C10 | IDC enterprise MaaS | 1,944万亿 tokens in 2025, versus 114万亿 in 2024. Daily average 1.6万亿 (Jan 2025) rising to 9.6万亿 (end-Dec 2025). Volcano share 49.5%. "使用多模态产品生成一个视频，也会消耗上千万Tokens" | IDC via Sina, 2026-05-07, https://finance.sina.com.cn/stock/relnews/hk/2026-05-07/doc-inhxahrf2820068.shtml ; C114, https://www.c114.com.cn/news/16/a1309816.html |
| C11 | Seedance token formula | "token 用量 ≈ (输入视频时长 + 输出视频时长) × 输出宽 × 输出高 × 输出帧率 / 1024". Actual usage is reported in `usage.completion_tokens` | Mirror of the Volcano Ark pricing page (snapshot 2026-05-28), https://github.com/hkai-ai/LLM_OFFICIAL_DOCUMENTATION/blob/main/volcengine/pricing.md . The official page https://docs.volcengine.com/docs/82379/1544106 (updated 2026-11-03) did not render its table to my fetcher |
| C12 | Seedance prices, RMB per M tokens | 2.0 at 480p/720p: 46 (no video input) / 28 (with video input). 2.0 at 1080p: 51 / 31. 2.0-fast: 37 / 22. 1.5-pro: 16 with audio / 8 without. 1.0-pro: 15. 1.0-pro-fast: 4.2. Examples for a 5 s 16:9 clip on 2.0: 480p 2.31, 720p 4.97, 1080p 12.39 RMB | Same mirror |
| C13 | User test | 15 s at 720p = 30.888万 tokens, about 15 RMB, "1元1秒" | https://m.sohu.com/a/992603381_121784105/ ; https://www.ithome.com/0/925/937.htm (March 2026) |
| C14 | Seedance revenue (rumor, disputed) | LatePost (2026-06-16): ARR $2B (~143亿 RMB), ">10亿/month", 70% gross margin. Tan Dai: "目前市面上关于Seedance 2.0收入的相关数据都是错误的，且偏高。" | https://www.yuntoutiao.com/yuntoutiao/450.html ; Yicai, 2026-06-23, https://www.yicai.com/news/103241988.html |
| C15 | Doubao app DAU | >2亿 (LatePost, Sept 2026). QuestMobile Q1 2026: ~1.4亿 | https://www.toutiao.com/article/7688363834184122890/ ; https://xueqiu.com/8586152406/375932861 |
| C16 | Kling | Q2 2026 Kling AI revenue >8.5亿 RMB, up >200% YoY. Q3 results not yet out as of 2026-11-03 | Kuaishou IR, Aug 2026, https://ir.kuaishou.com/news-releases/news-release-details/kuaishou-technology-announces-second-quarter-and-interim-2026 (403; figure from the search snippet and https://www.geekpark.net/news/353005) |
| C17 | Kling API price | About $0.075–0.18 per second at 720p–1080p; official credits about $0.10/s (720p) and $0.16/s (1080p) | https://aireiter.com/zh/blog/kling-3-api-pricing-guide-2026 ; https://dev.to/evan-dong/kling-ai-video-generation-pricing-complete-cost-breakdown-for-developers-2026-3fnp |
| C18 | ByteDance capex | 2026 plan 1,600亿 RMB (FT, Dec 2025), reportedly raised to >2,000亿 (May 2026). Unconfirmed | https://wallstreetcn.com/articles/3761890 ; https://www.cls.cn/detail/2367107 |
| C19 | Analog volume | xAI Imagine: >2B videos/month (Q1 2026) on 117M Grok MAU | Q03 R1/R3 (SpaceX S-1) |

### Arithmetic (D)
- **Tokens per second of video under C11, at 24 fps:**
  - 480p (864×496): **10,044 tokens/s**
  - 720p (1280×720): **21,600 tokens/s**
  - 1080p (1920×1080): **48,600 tokens/s**
  - These reproduce the C12 prices exactly: 5 s at 720p × 46 = 4.97 RMB; 1080p × 51 = 12.39 RMB; 480p × 46 = 2.31 RMB.
  - The C13 user test (308,880 tokens for 15 s) matches 1248×704×24×15/1024 exactly.
- **Rules of thumb:** 1 minute of 720p video ≈ **1.3M tokens**. A 15 s clip ≈ 0.31–0.32M tokens.
- **Cost per video token:** list price 46 RMB/M × (1 − 70% gross margin, C14) ≈ **13.8 RMB cost per M video tokens**. That is roughly 10–50x a text token's price.
- **Kling revenue:** 8.5亿 / 91 days ≈ **934万 RMB/day** (Q2 2026).
- **The >50% claim implies:** ≥90T video+image tokens/day. At 13.8 RMB/M that would cost ≈ 12.4亿 RMB/day, or **~4,500亿 RMB/year**. That is more than 2x ByteDance's entire reported 2026 capex (C18).

### Estimates (E)
1. **Paid Seedance API.** Assume revenue of 4亿 / 7亿 / 10亿 RMB per month. The top of that range matches the rumor that Tan Dai called too high. Assume an effective price of 46 / 35 / 20 RMB per M tokens (list price, fast/mini variants, discounts). Result: **0.29 / 0.67 / 1.67 T/day**.
2. **ByteDance consumer and internal video generation** (Doubao app, 即梦, 剪映/CapCut, Douyin). There is no disclosure. Using the xAI analog of ~67M videos/day (C19), assume 20 / 60 / 150M videos/day × 5 / 6 / 10 s × 10,044 / 15,000 / 21,600 tokens/s. Result: **1.0 / 5.4 / 32 T/day**.
   - Cost check at 13.8 RMB/M: the central case costs ~300亿 RMB/year, which is plausible. The high case costs ~1,700亿/year, close to ByteDance's whole capex, so it works as a ceiling.
3. **Doubao video total** (1 + 2): **~1.3 / 6 / 34 T/day**, which is **0.7% / 3.5% / 19%** of 180T.
4. **Kling.** 934万 RMB/day ÷ 1.3 / 0.5 / 0.2 RMB per second → × 21,600 / 21,600 / 48,600 tokens/s. Result: **0.16 / 0.4 / 2.3 T/day** equivalent from paid usage. Allowing for free-tier usage gives **~0.15 / 0.8 / 2.5**.
5. **Others** (MiniMax Hailuo, Alibaba Wan, Shengshu Vidu, Tencent Hunyuan): **0.2 / 1 / 4 T/day** (E, by analogy to Kling's scale). No disclosures.
6. **China video-generation total:** **~1.7 / 8 / 40 T/day**.
   - As a share of the 500T NDA broad figure: **0.3% / 1.6% / 8%**.
   - As a share of the 175T CAICT core figure: 1% / 4.6% / 23%. Use this denominator with care: Doubao alone (180T) exceeds 175T, so the core scope is narrower than Doubao's.
7. **Sensitivity: accept the C8 >50% claim.** Video+image ≈ 90T+ in Doubao, which would be ≈ 18–20% of 500T. This conflicts with the cost math above. A likely reconciliation is that "Token消耗" in that report meant spend (消耗金额) rather than token count, but this is unverified.

### Why the qualitative claims don't contradict "mostly text"
- C7 and C9 say "multimodal" or "non-NLP". That covers image and video **understanding** inputs to text-output models, plus speech and image generation. It is not only video generation.
- Video tokens are expensive per token, about 13.8 RMB cost per M. So video can dominate **revenue** (Seedance is rumored at about 2/3 of Volcano's 150亿 MaaS target) while being a small share of **token count**.

### Confidence and limits
- **Mostly text-output tokens:** high confidence, about 85–90%, that video generation is under 25% of China's ~500T/day. Moderate confidence, about 65–70%, that it is under 5%.
- **Unknowns:**
  - Whether the NDA and CAICT counts include video tokens computed with the C11 formula.
  - Whether Kling, which bills per second or credit rather than per token, is counted at all.
  - The size of ByteDance's free consumer video volume. This is the single largest uncertainty.
  - Whether Doubao's 180T includes overseas BytePlus/CapCut traffic.
- **What is reported vs estimated:** only the totals (C1–C4), the formula and prices (C11–C12) and the revenue points (C14, C16) are reported. Every share figure above is an estimate.
