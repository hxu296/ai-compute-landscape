# Full-source integration for the demand review

**Status, November 3: integrated.** The UI, research snapshots, `build_research.py`/`snapshot_capacity.py`, tests and README text are mirrored into the full source and shipped by its bundle. The November 2 S-1/A contract corrections are applied through source overrides without rewriting raw rows. The original handoff below is retained for reference.

This is a public-checkout proposal based on `ab04651`. The complete research checkout was not available during implementation. The existing generated `data/nc.js`, CSV exports and portable root HTML were not hand-edited. Merge this change into the full source before the next curated release so the feature is not overwritten.

## Changes to carry into the source

| Public files | Full-source action |
|---|---|
| `index.html`, `style.css`, `js/capacity.js`, `js/tokens.js` | Mirror into `neocloud/site/`, preserving concurrent UI changes. |
| `js/demand.js`, `js/demand_math.js` | Add under the corresponding site `js/` directory. |
| `research/demand-research.json`, `research/capacity-expanded.json`, `research/TOKEN-DEMAND-2026-11-03.md`, `research/REVIEW-INDEX-2026-11-03.md`, this file | Add to the source site's research assets and release-copy list. Preserve source dates, scopes and missing-value explanations. |
| `data/research.js` | Generated from the two independent research snapshots with `automation/build_research.py`. Include in the site build output; do not make it an alternative raw company database. |
| `automation/build_research.py`, `automation/snapshot_capacity.py` | Integrate into the source automation directory and adapt their site-root resolution. The former is offline; the latter consumes explicit downloaded response files, retaining hashes and raw selected rows. |
| `tests/demand_scenarios.test.cjs` | Integrate alongside the existing arithmetic regression tests, updating relative paths if necessary. |
| `README.md` development commands | Include the generation step in the source build documentation. |

## Curated source evidence to integrate

Add new raw observations in a new file; do not rewrite historical raw rows or their positions. Map these records to the actual source schema after reading `neocloud/README.md` and `data/SCHEMA.md`:

- Anthropic November 2 S-1/A: January–September consumption revenue $26.3B; September 30 cash/equivalents/short investments $131.845B; nine-month operating cash flow +$6.569B; CSP-marketplace revenue share 44%; compute/infrastructure $18.808B, cost of revenue $4.812B and R&D $19.240B under different accounting classifications. The rounded Q3 consumption difference and price scenarios are D/E, never a reported token disclosure.
- Bedrock nearly 17× year-over-year token growth (October 29) and MiniMax July-vs-January 20× growth are relative observations without an absolute daily baseline. Z.ai's >40× MaaS growth has a different scope from its historical issuer-wide consumption.
- Applied Compute November 2: >1T inference tokens/day, a separate scope with an unspecified measurement day and cache/modality accounting. Keep >1,700 training runs since July separate from served tokens or GPU-hours.
- CoreWeave and Nebius managed token-API product evidence does not supply company-wide daily token volume. Grok is distinct from Groq. Their missing totals must remain visible and must not become zeros.
- Z.ai's archived issuer interim announcement reports >100,000 domestic inference chips, not a model-specific training run or an owned GPU inventory. Its June liquidity and July HKD financing are separate dates and currencies.
- Preserve reported training-run examples separately from clusters, access rights, owner delivery estimates and future capacity. Do not attribute a cloud's delivered-chip fleet to its lab customer as a second owner.
- X posts are attributed operator claims/thought experiments. Preserve retrieval limitations and the exact scope of the router traffic. Do not turn the posts' NVIDIA shipment forecasts or assumed Opus multiplier into independently verified facts.

Normalize, inspect `data/norm/QA.md`, update shared selection rules only as needed, and regenerate projections/exports. No forecast should enter the reported-token snapshot. If the source later embeds the new snapshots inside `NC`, remove the separate browser-data bridge only after updating consumers and retaining all scope tests.

## Release and validation

Run generation, Node tests, Python tests, offline validation in a temporary copy and packaging. The public `automation/package.py` generates `_site/`; the root portable HTML must be regenerated through the full-source release path rather than edited by hand.

Required real-browser acceptance remains: screenshots at approximately 1600, 1100 and 390 pixels; no page-wide overflow; both inference figures and token groups; scenario changes and invalid inputs; H100/raw-source details; JSON/CSV exports; existing tooltip pin/Escape, growth controls, deal filtering, search and news archive. A DOM simulation checks control logic only and does not replace these visual checks.

The browser host was unavailable during this implementation (native startup and browser access failures after retry). Therefore visual acceptance is explicitly outstanding. A review or merge should not describe screenshots as completed.

Use the full-source publication helper for an authorized release, preserving current `data/live.*`, `data/history/`, `research/daily.json` and `scratchpad/threads/`. A research branch or draft PR is not a published website. Check the Actions run for the actual release commit and inspect the live page before reporting publication.
