# November 16 source and refresh review

The editorial review resumed at 01:57 UTC on November 16. November 12 announcements retain their source dates; no editorial reviews have been backdated to the intervening days.

## Compute Desk adapter

The public [indices API](https://data-api.compute-index.com/public/indices) now returns `CDGXB200`, `CDGXB300`, `CDGXH100` and `CDGXH200`, each marked `source: gx`. The prior adapter expected calculated-fallback aliases for three chips and correctly retained its last good observations with an error label when they disappeared.

The [provider overview](https://www.computedesk.com/indexes-overview) and [B200 methodology](https://www.computedesk.com/indexes/b200) describe General Index administration and US one-year reserved GPU rental rates per GPU-hour. The adapter now accepts the current aliases, retains the exact alias/source, identifies General Index in the terms, and links to the current provider domain. Legacy fallback aliases remain supported. If both versions appear, the GX series takes precedence; their histories are never concatenated. Missing chips and duplicate aliases still fail validation.

All changes are recomputed from the selected series' returned history, rather than from the old cached level or the API's precomputed change field. The repair accepted November 13 observations; a November 16 retrieval is not a new November 16 price. Historical failed-run receipts remain in history. A regression test verifies precedence, independent history, missing-chip rejection and duplicate rejection.

## InferenceX physical GPU count

The research refresh separately stopped when result 448095 became selected. Its [public run job](https://github.com/SemiAnalysisAI/InferenceX/actions/runs/43029773811/job/130932161380) identifies nine prefill workers with TP2 and one decode worker with TP16: 18 + 16 = 34 GPUs. The raw worker records independently sum to the same count. The run's API date is November 13; the review and response retrieval are November 16.

The group reports 266,980.70581 output tokens/s and 36,179,106.26634 logical input tokens/s. Role-local rates are not used as all-GPU rates. The 72-GPU rack model and unknown-topology rejection remain intact. A different selected operating point is not evidence of a price move or a general performance regression. The prior 446952 arithmetic example remains a frozen test fixture.

## Financial scope checks

The [CoreWeave Q3 filing](https://www.sec.gov/Archives/edgar/data/1769628/000176962826000465/crwv-20260930.htm), filed November 12, reports $132.3B of ASC 606 RPO and $47.505B of future debt-principal payments at September 30. Its November 10 release's approximately $132.5B revenue backlog has broader coverage. The growth series retains its broader definition; a source comparison explains the difference. The existing November 11 story keeps its ID/date and records the November 16 correction review.

Concurrent exposure-table updates now align CoreWeave and Nebius to September 30, with scores of 14 and 12 respectively. This release preserves those separately maintained rows and explanatory notes in full, while adding the editorial evidence and source comparison. The risk model uses its own recurring-revenue, financing and interest definitions; headline GAAP figures are not substituted into its inputs.

The comparison popover now stays clear of its trigger: hovering over the new source note cannot cover the button needed to pin it. Desktop, tablet and phone checks exercise an ordinary click and confirm that both dated source links remain available.
