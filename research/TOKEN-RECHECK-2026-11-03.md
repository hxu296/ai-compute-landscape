# Token disclosure review — 3 November 2026

The 17 plotted quantities and their period conversions survived this review. The main problem was presentation: a single ranking mixed platform usage, a single DeepSeek cluster, historical observations and a countrywide aggregate. The chart now separates those groups, retains every observation and uses a shared daily-equivalent scale. It does not estimate a global total.

## Disclosure checks

These are reported claims, not independently metered traffic. Source publication dates are distinct from observation dates; an unspecified window remains unspecified. Monthly conversions use 30 days, weekly conversions use seven days and the Microsoft fiscal-year average uses 365 days. The snapshot retains exact quantities, bounds, dates and provenance.

| Disclosure | Native quantity | Daily equivalent | Basis checked |
|---|---:|---:|---|
| Google, all surfaces | >3.2Q/month | >106.7T | [May 19 keynote](https://blog.google/innovation-and-ai/sundar-pichai-io-2026/); broader than APIs |
| Google, first-party model APIs | nearly 32B/minute | nearly 46.08T | [October 28 earnings release](https://www.sec.gov/Archives/edgar/data/1652044/000165204426000080/googexhibit991q32026.htm); publication date, no exact observation window |
| Baseten | 40–50T/day | 40–50T | [September 25 company-issued release, syndicated](https://www.streetinsider.com/Business%2BWire/Baseten%2BNames%2BSheila%2BVashee%2BChief%2BMarketing%2BOfficer/27106238.html); range retained |
| Fireworks | >40T/day | >40T | [July 15 company disclosure](https://fireworks.ai/blog/fireworks-series-d-funding); mostly specialized models |
| Together API | >400T/month | >13.33T | [July 8 company post](https://www.together.ai/blog/provisioned-throughput); monthly quantity |
| DeepInfra | 22T/week | 3.143T | [September 29 company-issued release](https://www.globenewswire.com/news-release/2026/09/29/3370896/0/en/deepinfra-surpasses-100m-arr-triples-token-volume.html); body says 22T, boilerplate says over 22T |
| China Telecom TokenHub | >1T/day | >1T | [August 20 investor presentation](https://www.chinatelecom-h.com/en/ir/presentations/intpre260820.pdf), PDF page 9; TokenHub usage, not training-corpus size |
| OpenAI APIs | >15B/minute | >21.6T | [March 31 company post](https://openai.com/index/accelerating-the-next-phase-ai/); API disclosure, not a ChatGPT total |
| DeepSeek, one V4.1 Flash cluster | 155T/day | 155T | [October 20 repository revision](https://github.com/deepseek-ai/DeepInfer/blob/774ce244b87cc0eb8d4b94ab9f5de2ab22049f01/doc/inference_deployment_qa.md); limited coverage |
| Z.ai, issuer platform history | 4.2T/day | 4.2T | [December 30, 2025 prospectus](https://www1.hkexnews.hk/listedco/listconews/sehk/2025/1230/2025123000018_c.pdf), PDF page 32 / printed page 23; November 2025 observation |
| Z.ai, OxAlpha rollout | >62T / six days | >10.33T | [September 17 company post](https://z.ai/blog/glm-built-its-inference-infrastructure); rollout subset, potentially overlaps routers |
| Kimi, Mooncake history | >100B/day | >0.1T | [FAST 2025 paper abstract](https://www.usenix.org/conference/fast25/presentation/qin); historical chatbot deployment |
| Microsoft Foundry API history | >500T / FY2025 | >1.370T | [July 30, 2025 earnings remarks](https://www.microsoft.com/en-us/investor/events/fy-2025/earnings-fy-2025-q4); July 2024–June 2025 average, not a current daily rate |
| OpenRouter platform | 128.4T/week | 18.34T | [September 22 newsletter](https://openrouter.ai/data/newsletter/the-token-state-of-play); week of September 14, reseller traffic excluded |
| OpenRouter classified top 50 | 116.5T/week | 16.64T | [October 31 analysis](https://openrouter.ai/blog/insights/open-weight-vs-closed-weight-models/); week of September 28, 83.5T open plus 33T closed; stealth/other categories excluded |
| China, national aggregate | >500T/day | >500T | [October 25 NDA-hosted expert article](https://www.nda.gov.cn/sjj/zwgk/zjjd/1025/20261025174331093963574_mobile.html); June 2026 claim, methodology not supplied |
| ByteDance / Doubao | >180T/day | >180T | [June 23 attributed press report](https://finance.sina.com.cn/roll/2026-06-23/doc-iniekknt9788268.shtml); a matching primary disclosure remains unverified |

The November 2 [ClickHouse customer case study](https://clickhouse.com/blog/openrouter-llm-routing-observability-clickhouse-cloud) describes OpenRouter at more than 110T/week, but supplies no exact observation week or reseller boundary. It is linked as context beside the dated 128.4T observation. It does not justify replacing that observation or inferring a decline. Anthropic still has no verified comparable total in this snapshot.

## Presentation corrections

- Separate platform/API disclosures, limited coverage, historical observations and the national aggregate. The groups do not make token accounting comparable.
- Preserve strict and inclusive bounds and “nearly” in both current and native-history views.
- Label Microsoft's full fiscal-year observation window and its historical average explicitly.
- Show every native reporting series instead of silently selecting one series per company.
- Confine horizontal scrolling to each figure. Headings and controls stay fixed; full scope names remain in source details when chart labels are shortened.

Input/output splits, cache accounting, model mix and tokenizer conventions remain incomplete. A disclosed token cannot be treated as an equal unit of useful work, GPU cost or revenue across these companies. Company, host, router and national disclosures can overlap and must not be summed.
