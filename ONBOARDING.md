# Maintaining Who powers the Token Economy?

This is an interactive, sourced survey of AI compute supply, contracts, pricing and inference demand.

- Live: https://hxu296.github.io/ai-compute-landscape/
- Public repository: https://github.com/hxu296/ai-compute-landscape
- Owner: merlin78. The daily editor maintains reviewed news and checks feed health. A new maintainer should take a specific assignment and coordinate before changing that editor's files.

This handoff describes the implementation reviewed on 3 November 2026. Read current Git history, open changes and Actions status before treating a recorded snapshot as current. No subscriptions, paid compute or model downloads are needed to reproduce the offline site.

## First session

1. Read `README.md`, `AGENTS.md`, this guide, [AUDIT.md](AUDIT.md) and [automation/DESIGN.md](automation/DESIGN.md).
2. Inspect `git status`, `git log -5` and current assignment/PRs. Preserve unrelated work and concurrent editorial changes.
3. Run the offline checks below, build a preview and inspect it on desktop and phone widths.
4. Read [research/GAPS.md](research/GAPS.md), [research/SANITY-2026-11-03.md](research/SANITY-2026-11-03.md) and [research/TOKEN-RECHECK-2026-11-03.md](research/TOKEN-RECHECK-2026-11-03.md). Identify one bounded next task with a deliverable and acceptance criteria.
5. Report readiness, concrete failures and the proposed task in the [repository scratchpad](https://github.com/hxu296/ai-compute-landscape/tree/main/scratchpad). Do not silently convert an observation gap into a zero or an unsupported estimate.

## Commit-based communication

Use [scratchpad/README.md](https://github.com/hxu296/ai-compute-landscape/blob/main/scratchpad/README.md) to send a request or readiness report to Merlin through commits. Reply in the seeded onboarding thread for your first report. Pull and read unclosed messages at session start and before completion; append acknowledgements/replies rather than overwriting prior messages. Scratchpad commits are public and do not wake idle agents automatically. They are excluded from website-only packaging and scratchpad-only pushes do not deploy Pages.

## Two checkouts and two update paths

| Checkout | What it contains | What to change there |
|---|---|---|
| Public `ai-compute-landscape` | Served assets, projected datasets, public research notes, editor archive, feed cache/history, tests and Actions. | Reviewed daily news and benchmark adapters under the relevant assignment; public proposals and previews. |
| Full research source | `neocloud/data/raw/`, corrections, normalization, shared selection rules, site source and release builder. | Curated company/fleet/contract/price evidence, selection rules, charts and reusable source changes. |

The public repository is usable on its own but does not contain the full raw research database or its normalization scripts. If you need those, ask the owner for source access. In that checkout, start at `neocloud/README.md`. A normal source build produces `neocloud/site/dist/`, which is staged into the public checkout with the publication helper.

The data paths are:

```text
Curated research: raw + overrides -> normalize -> shared scope selection -> nc.js / CSV
Daily benchmarks: public APIs -> validated live.json / live.js + dated history
Reviewed editorial: research/daily.json -> validation/merge -> banner and archive
Release: public assets + current live/editorial state -> _site -> GitHub Pages
```

Changing the private source alone does not publish a release. Copying an old build over the public repository can erase newer news and benchmark history. Use the helper described under Publication.

## Reproduce the public checkout

Use Python 3.11 and Node 24 to match CI. No Python packages or npm dependencies are required for the following commands:

```sh
git clone https://github.com/hxu296/ai-compute-landscape.git
cd ai-compute-landscape
node --test tests/*.test.cjs
python3 -m unittest discover -s automation/tests -v
python3 automation/refresh.py --offline
python3 automation/package.py
python3 -m http.server 8000 --directory _site
```

Open http://localhost:8000/ and stop the server when finished. `refresh.py --offline` validates and merges cached inputs; it can rewrite `data/live.*`, so inspect `git diff` afterward. This command does not contact the benchmark APIs. Omitting `--offline` deliberately refreshes the two documented public feeds. `package.py` writes `_site/`; it does not update the repository-root HTML files in place.

In the full source checkout, use the commands in `neocloud/README.md` instead. Website work does not require the model/GPU environment used by the repository's other projects.

## Source files to know

| Public path | Purpose |
|---|---|
| `index.html`, `style.css`, `js/` | Plain HTML/CSS/JavaScript; no framework or transpiler. |
| `data/nc.js`, `data/*.csv` | Generated curated presentation data and downloadable exports. |
| `data/live.json`, `data/live.js`, `data/history/` | Independently updated benchmark observations, source health and history. |
| `research/daily.json` | Reviewed editorial archive, schema version 2. |
| `research/token-latest.json` | Reviewed per-scope token disclosure projection; `js/token_math.js` converts periods. |
| `research/token-coverage.json` | Missing totals and coverage explanations. |
| `research/capacity.json`, `js/capacity_math.js` | Selected raw serving-group benchmark inputs and rack arithmetic. |
| `js/chip_stacks.js` | Consistent-date owner/model delivery estimates; not an online inventory. |
| `tests/*.test.cjs` | Arithmetic, scope selection and dataset regression checks. |
| `automation/refresh.py`, `automation/tests/` | Two feed adapters, editorial validation and failure behavior. |
| `automation/package.py`, `.github/workflows/daily.yml` | Packaging and Pages workflow. |
| `ai-compute-landscape.html` | Generated portable copy; regenerate rather than editing it. |

In the full source, `data/SCHEMA.md` defines raw observations and `data/overrides.json` applies corrections by filename and row. Existing raw files and row positions are preserved. Add new evidence in a new raw file; do not overwrite source history. `data/presentation.py` is the shared selector for compatible revenue, backlog and power series. Inspect `data/norm/QA.md` after normalization: validation warnings do not necessarily make the script exit unsuccessfully.

## Evidence rules that prevent misleading comparisons

- Every quantity retains its source, observation/publication dates, unit, scope and R/D/E category. R means reported, including attributed press; it does not mean independently verified.
- Hosts carry power, while owned chip counts belong to tenants. Site subtotals, single clusters and company totals are distinct. An announcement, purchase, delivery, energized installation and utilized capacity are different stages.
- Revenue, capex and backlog comparisons use consistent company/segment and period definitions. Never splice mining revenue into an AI-cloud trend or site power into a company-wide series.
- Separate compute-service commitments, powered-space leases, hardware purchases, options and backstops. Preserve unpriced relationships and upper/lower capacity bounds. A building lease does not imply a chip-inclusive GPU rental price.
- A rate quote is identified by provider, chip/system, GPU count, region, term, configuration and date. Divide instance prices by the physical GPU count when appropriate. Advertised floors, survey ranges, retail quotes and indices remain distinct. FX uses the source-date ECB reference rate.
- Epoch native counts are cumulative delivered-chip estimates for covered owners at a consistent date. They do not subtract all retirements and do not establish a current global inventory. Its peak 8-bit H100-equivalents differ from the source project's dense-BF16 yardstick. Missing older-generation coverage is not zero older chips.
- Token observations are not additive across model labs, hosts, routers and countries. Keep platform/API, limited coverage, historical and national groups distinct. Preserve “nearly,” strict bounds, ranges and native periods. Monthly equivalents use 30 days only when no actual window is known. A publication date is not an invented measurement date. Future records without grouping metadata must remain visible.
- The capacity calculator is conditional. Its 500T/day default is an assumption, not a measured global total. Use raw input/output serving-group rates and all allocated GPUs; do not substitute an interpolated total-token headline or apply a second decode fraction. Whole 72-GPU racks incur cost and power, including unused slots. Cache composition is not an isolated prefill-performance calibration. Preserve benchmark/version, workload and precision limitations.

Regression examples are documented in the audits: VNET's in-service capacity can exceed its customer-committed subset; Google all-surfaces and first-party API token figures are different meters; Microsoft's FY2025 token figure is a historical annual average. New evidence may update values, but must not erase these distinctions.

## Editing and reviewing news

`research/daily.json` contains `{schema_version: 2, items: [...]}`. Each reviewed item has a stable `id`, UTC editorial `date`, `kind` (`news` or `analysis`), `status: "reviewed"`, `impact_score` (1–5), `impact_reason`, `title`, original `summary` and `sources: [{title, url, date}]`. See [automation/DESIGN.md](automation/DESIGN.md) for optional event dates and validation.

Keep event date, publication date, editorial day and future delivery target distinct. Do not label an older filing as breaking news. Preserve existing ids when updating a story. Multiple material stories can share a day. Explain impact separately from evidence confidence. The interface maps scores to Low, Moderate, Significant, High and Extremely high impact; do not replace those words with “4/5.”

The scheduled job refreshes only Compute Desk and SemiAnalysis's documented public benchmark APIs at **13:17 UTC daily**. It does not research every company each day. Pushes validate cached feeds, package and deploy; scheduled/manual runs fetch feeds and retain dated observations. Read source health in `data/live.json` and the Actions run. Failed sources keep last-good data with an error label; missing data is not synthesized. The daily editor performs the separate news/research review.

## UI conventions and visual verification

Keep the title **Who powers the Token Economy?** and the warm paper, light-only presentation with Newsreader/Inter/JetBrains Mono. Use short, general section headings. There are no top statistic cards or repeated takeaway boxes, and no standalone VNET section. Reported inference shares and token activity share one Inference chapter: side by side on desktop and stacked on phones. Charts can scroll horizontally within their own wrappers; headings and controls stay fixed. Growth defaults to all companies. Deal links/nodes encode size and support filtering; source details can be pinned by clicking.

After a UI change, open a real browser at roughly 1600px, 1100px and 390px widths and inspect screenshots:

1. No page-wide horizontal overflow or clipped SVG labels. Scroll a figure to both ends; its heading and controls must stay fixed.
2. Both inference figures are present, all token groups/scopes remain accessible, and native-period selectors work. Source details retain full labels and dates.
3. Click/tap pins a source tooltip, links remain usable, and Escape/outside click dismisses it.
4. Growth all/none controls, deal-size filtering, provider search and the news archive work without console errors.
5. Capacity defaults, counts, units and alternative configurations still agree with the arithmetic tests. Table exports correspond to displayed selections.

Arithmetic tests do not replace visual inspection. A screenshot alone does not verify a source or calculation.

## Publication and recovery

For a curated release, from the full source repository root, after building `neocloud/site/dist/`:

```sh
python3 neocloud/automation/publish.py neocloud/site/dist /path/to/ai-compute-landscape
```

Start with a clean public checkout. The helper pulls with `--ff-only`, preserves public `data/live.*` and `data/history/`, merges editor items by id, and repackages the root HTML copies. Inspect its diff, run checks, commit intended files and push only when the current assignment authorizes publication. This guide does not transfer another agent's permissions. If source access is unavailable, a public proposal can be reviewed, but generated changes must also be integrated into the full source so the next curated release retains them.

`Daily data and publication` validates and deploys `_site/`. Inspect the run associated with the actual commit and confirm successful Pages deployment. Then inspect the actual live page, including a phone viewport. Versioned asset URLs prevent stale scripts; a commit pushed successfully is not evidence that deployment succeeded. If deployment fails, inspect the job and preserve the previous good release. Use a reviewed revert through the same workflow for rollback; do not force-reset history or erase daily data.

Never add credentials, private chat exports, licensed PDF text or source chart images to the public projection. Source citations and original summaries belong here. Use the machine's configured Git identity; no agent/co-author attribution.

## Useful next research

The maintained queue is [research/GAPS.md](research/GAPS.md). The largest unresolved questions include usable installed supply versus commitments, current comparable token accounting, project financing and cash conversion, matched contract prices, physical commissioning bottlenecks, and cost per useful task at fixed quality and latency. Chip-age rankings are incomplete because fleet disclosures omit models and retirements. Pick a bounded question; preserve a gap when the public evidence cannot resolve it.

## Starter prompt

```text
You are joining Who powers the Token Economy?, the sourced AI-compute landscape at https://hxu296.github.io/ai-compute-landscape/.

Use https://github.com/hxu296/ai-compute-landscape. Read AGENTS.md, ONBOARDING.md, README.md, AUDIT.md and automation/DESIGN.md. If you have the full agent-research checkout, also read its root ONBOARDING.md/PRACTICES.md and neocloud/README.md; curate company facts there, not by hand-editing generated nc.js.

First inspect current Git/Actions state and existing assignments, run the offline Node/Python checks, build a local preview and visually inspect desktop and phone views. Report any concrete failure and propose one bounded next task from research/GAPS.md, with a deliverable and acceptance criteria. Coordinate with the daily editor before changing news or live feeds.

Preserve dates, units, source scope, bounds and R/D/E status. Distinguish ownership, deliveries, installed supply and future commitments. Token disclosures overlap and must not be summed. Preserve public live data/history/editorial state during curated releases. Do not modify other projects or frozen papers. Follow the current task's publication and budget authorization; do not infer a new paid-run or deployment permission from this prompt.

Your first deliverable is a short readiness report and proposed next task, committed in scratchpad/threads/2026-11-03-onboarding.md and addressed to Merlin. Follow scratchpad/README.md for acknowledgements and further messages. Do not launch paid resources or publish a new website release as part of onboarding alone.
```
