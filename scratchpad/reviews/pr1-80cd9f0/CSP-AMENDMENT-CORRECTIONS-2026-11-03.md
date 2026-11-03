# CSP commitment fields needing source integration

The [November 2 Anthropic S-1/A, page 175](https://www.sec.gov/Archives/edgar/data/2130357/000162828026068676/anthropicpbc-sx1ax1.htm) updates fields still selected from the [October 26 filing, page 171](https://www.sec.gov/Archives/edgar/data/2130357/000162828026067168/anthropicpbc-sx1.htm). Both versions were checked directly; the prior filing states the earlier Google value and Microsoft end month. This is a concrete addition to the existing Q07/R6 financial-data integration review. The revenue-token sensitivity and earlier review dispositions are unchanged.

| Existing aggregate identity | Current selected field | Later filing | Required treatment |
|---|---|---|---|
| Buyer Anthropic; supplier Google Cloud; agreement announced `2026-03`; amended relationship aggregate | $114.5B minimum; amendments through August; source October 26 | At least approximately **$121.3B**, April 2026–July 2033; amendments through October | Revise the selected value, amendment description and source provenance for this same relationship. Preserve the historical disclosure. |
| Buyer Anthropic; supplier Microsoft Azure; announced `2025-11-18` | $44.9B minimum; selected period ends `2033-05`; source October 26 | Minimum remains **$44.9B**, November 2026–**June 2033** | Update the selected end month to `2033-06` and its source; retain the original agreement identity. |

Both stale fields are present in the current normalized contracts and public `data/contracts.csv`, including after the editorial-only release `2903b44`. Correcting archived prose does not regenerate these structured records.

## Integration acceptance

- Add the new dated source evidence without rewriting historical raw rows. Use the source selection/override mechanism so the existing aggregate is replaced in current views, rather than counted again as a November deal.
- Preserve qualifiers, payment conditions and separate economic layers. The new Google minimum is not a disclosed GPU/MW denominator. Additional conditional TPU payments and equipment leases remain separate from firm service-deal totals.
- The Google selected amount changes by $6.8B. Recompute affected totals from selected records; do not add $121.3B to the prior $114.5B or infer matching capacity from the unpriced TPU announcements.
- Refresh the source-comparison treatment and date where it embeds the older value. A later amendment is a dated revision; the unmatched capacity/spend scope remains a separate issue.
- Normalize, inspect QA, regenerate presentation data/CSV/portable output and validate the affected contract display/exports. Confirm each aggregate appears once and the Microsoft end month is consistent across data and prose. Preserve current news, live feeds, history and scratchpad replies through the existing publication helper.

These are review requirements for the contributor's source integration. This note does not mutate source records, regenerate data or publish the correction. Supply the source and generated-output commit, or identify the concrete integration/access owner. R1–R6 remain open until their respective evidence and implementation checks pass.

## Additional source checks, November 3

Directly rechecked the [November amendment, pp. 175–176](https://www.sec.gov/Archives/edgar/data/2130357/000162828026068676/anthropicpbc-sx1ax1.htm):

- The additional $125–150B TPU estimate has no fixed dollar commitment. Delivery may use Google hosting, financed Google purchases, or financed third-party purchases/leases; expected delivery is 2028–2031. Describe these alternatives explicitly. Keep this estimate outside firm-service totals and rental rankings; it is not another fixed Google rental contract.
- Microsoft's amendment window is February–October 2026. Update that description alongside the end month and source.
- Update the current Google `C-G03-google-aggregate` scope comparison as already requested, and add a distinct dated revision comparison from $114.5B (October 26) to $121.3B (November 2). The unmatched 5GW issue remains a scope difference.

The [June 11 SpaceX prospectus, p. 14](https://www.sec.gov/Archives/edgar/data/1181412/000162828026042639/spaceexplorationtechnologi.htm) places approximately 325k Anthropic-accessible GPUs across Colossus and Colossus II. The current CSV still assigns the later $120.5B aggregate to Colossus 1 alone. Set that aggregate's site to **not disclosed**; retain historical locations/counts only with their dated scopes. Neither historical count supplies its current GPU-hour denominator.

These are additional R6 acceptance checks. Source integration and the resulting rows, totals and exports still require implementation review.
