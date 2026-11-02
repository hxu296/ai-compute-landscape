# Daily compute data and editorial pipeline

The public repository runs `Daily data and publication` every day at **13:17 UTC**, on manual dispatch, and on pushes to `main`. Scheduled and manual runs refresh public feeds. Push runs validate cached inputs and publish reviewed editorial or presentation changes. GitHub schedules are best effort; the Actions run records the actual execution time.

## Data path

1. **Extract:** fetch Compute Desk's public one-year rental indices and SemiAnalysis's public composite/survey API, with a fixed source allowlist, 25-second timeouts, three attempts and an 8MiB response limit. No subscription cookies, private model inputs or credentials are used.
2. **Snapshot:** retain the exact public API responses as a 30-day Actions artifact. Commit compact dated observations and source SHA-256 hashes under `data/history/YYYY-MM-DD.json`.
3. **Transform:** validate positive finite prices and source dates, sort observations, and calculate calendar 7/30/90-day changes within the same series. Insufficient history stays unavailable. A one-year benchmark, a composite, a survey range and a retail offer remain distinct.
4. **Validate:** run the adapter/editorial/failure tests. Reject malformed editorial items, duplicate story ids or future dates, unsafe source links, future observations and source-date regressions. A failing source keeps its last good observations and exposes an error state; if both extractors fail, the job fails before replacing published data.
5. **Load:** write the narrow `data/live.json` / `data/live.js` overlay. It can update market benchmark references, their changes, source health and daily briefs. It cannot rewrite curated contracts, company power, owned chip counts, retail offers or financial statements. Those need source review and dated structured curation.
6. **Publish:** package only public site assets, regenerate content-hashed script/style URLs and the offline copy, then deploy the checked artifact to GitHub Pages. Jobs serialize under one production concurrency group. Automated data commits use the GitHub Actions bot; they do not recursively start another push workflow. The same run deploys the artifact explicitly.

## Editorial ownership

The persistent `ComputeDaily` editor selects the main material development and maintains `research/daily.json`: multiple reviewed news or analysis items per UTC editorial day, each with a stable id and an explained impact rating from 1 to 5, with original prose, source publication dates and public links. Older filings can support a current analysis, but their event date must remain explicit. Routine daily research and publication are authorized. Agent creation itself requires the platform's human-committed creation card.

The deterministic job does not pretend to perform broad news judgment. If a day lacks a reviewed editorial item, it can produce a dated **market brief** from the tracked feeds; it is labeled separately from reviewed analysis. If no recent observation exists, it says so. No new market event is invented. Reviewed items replace the automated brief for the same day. Previous daily items remain in the archive.

Company/fleet/contract refreshes are editorial: locate the primary disclosure, preserve units and scope, update curated records, validate and publish. New extractors enter automation only after their source contract and failure tests exist. This first release automatically refreshes the two documented benchmark sources; it does not claim to scrape every company fact daily.

## Operating commands

In the public checkout:

```sh
python -m unittest discover -s automation/tests -v
python automation/refresh.py             # refresh public feeds
python automation/refresh.py --offline   # validate/editorial merge, no fetch
python automation/package.py            # produces _site for Pages
```

A reviewed headline is published by editing `research/daily.json` and pushing `main`. Each item has `id`, `date`, `impact_score` (integer1–5), `impact_reason`, `title`, `summary`, `sources: [{title,url,date}]`, `status: "reviewed"`, and `kind: "news"` or `"analysis"`, inside `{schema_version: 2, items: [...]}`. Impact is an editorial assessment of scale, scope and delivery implications, separate from optional `confidence` notes. Optional `event_date`, `event_date_scope` and `future_target` distinguish the event from future targets. The news banner opens a searchable archive with full text and sources for every item. Items sort by date, then impact; input order breaks ties. Text is escaped by the page. Source dates are distinct from the editorial day.

Curated releases must preserve the public checkout's `data/live.*`, `data/history/` and editorial archive. Use the source project's `publish.py` helper rather than copying a stale source snapshot over those mutable files. The helper pulls the public branch first, preserves current live state, merges editorial ids and repackages the release.

## Failures and recovery

A red Actions run is an actionable failure, not a successful refresh. Source health is visible in `data/live.json`; exact responses and failure diagnostics are attached to the run. The prior deployed artifact remains until a validated release succeeds. Retry through `workflow_dispatch` after fixing the failing adapter; never replace an unavailable value with zero. Roll back through a known-good commit and the same deployment workflow. The editor owns daily inspection of failed or missing runs.

Official references: [scheduled events](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows), [token-trigger behavior](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow), [Pages custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
