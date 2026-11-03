# Maintainer entry point

Read [ONBOARDING.md](ONBOARDING.md) before changing this project. It includes a starter prompt, source map, build commands, evidence rules and release checks.

- In the full research repository, this file lives at `neocloud/site/`. Read `neocloud/README.md` for source curation and the two-checkout publication workflow.
- At the root of `ai-compute-landscape`, this is the public distribution. Its `data/nc.js` and CSV exports are generated; the complete raw research and normalization scripts are in the full source checkout. Request source access from the owner when needed rather than reverse-engineering a raw dataset from the projection.
- Check the current task and other contributors' changes. This guide describes mechanics; it does not grant new publication, paid-compute or account permissions. Existing explicit task authorization governs the work.
- Keep every number's unit, date, scope, bound, source and evidence category. Unknown is not zero. Preserve hosts versus tenants, delivered versus online, and orders versus deployments.
- Do not hand-edit `data/nc.js` or the portable HTML bundle. Change the source, validate, then regenerate. Public-only proposals affecting generated content must identify the corresponding source change for integration.
- Preserve public `data/live.*`, `data/history/` and the daily editor's archive when publishing a curated build. Use `automation/publish.py` from the full source checkout.
- Keep credentials, private chat content and licensed source text out of commits. Use the machine's configured Git identity; no agent attribution or co-author trailers.
- Verify an authorized deployment on the live page before reporting it as published. Do not alter other projects or frozen papers.
