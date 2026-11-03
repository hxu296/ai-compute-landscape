# Remaining social-source attribution checks — 3 November 2026

Reviewed PR head remains `80cd9f0`. These checks finish attribution review of the main social-post quantities already cited by the contributor. An author's statement is not independent measurement of their hardware, traffic or the global market.

| Submitted claim | Retrieval and result | What remains unverified |
|---|---|---|
| Dax: 6.77T tokens in 24 hours on GB300 NVL72, P50 TTFT 1.16s, P50 speed 143 tok/s, poor P95 from a faulty tray | The [October 25 mirror](https://teapawt.net/thdxr/status/2114176734056857916) reproduces those figures and the author's reply naming GB300 NVL72. Matches the report's attributed account. | Exact request/model/cache mix, successful-request accounting, failure-inclusive goodput, independent measurements and universal service targets. |
| Rothmann: replace all inference with Flash on GB300; 200 racks, then assume a 15× Opus factor for 3,000 | The [original post](https://x.com/JamesRothmann/status/2115382434397085959) is reproduced by the [FxTwitter JSON endpoint](https://api.fxtwitter.com/JamesRothmann/status/2115382434397085959). Retrieved author and ID match; timestamp is October 28, 09:57:28 UTC. The stated arithmetic matches the report. | A common global demand meter, a measured 15× quality/workload conversion and the post's NVIDIA shipment claim. This is a thought experiment, not a measured global capacity requirement. |
| Shou: ~1.8T tokens on 64 B300 + 64 M890P, versus OpenRouter's claimed 5.2T prior day | The [original post](https://x.com/shoucccc/status/2115253960907133280) is reproduced by the [FxTwitter JSON endpoint](https://api.fxtwitter.com/shoucccc/status/2115253960907133280). Author/ID match; timestamp is October 28, 01:26:58 UTC. The top-level quantities match the report. | The report's additional five-model attribution comes from a reply not yet identified/reproduced in this check. The traffic/hardware populations, accounting and overlap are not independently measured here. |

The web-reader could not open the two FxTwitter API URLs; a direct HTTP retrieval returned the public JSON successfully. This checks the supplied proxy text, not authenticity through a signed original or an independently audited traffic counter. The public review retains summaries and URLs; complete copied posts are not committed.

Together with the earlier Dax/Tang checks, the report's main social-post numbers are supported **as attributed claims**. The surviving conditional argument is that efficient, cache-heavy Flash serving can produce a small rack estimate under the explicitly selected workload and replacement-model assumptions. The global market, equal-quality Opus factor, future shipment figures and price-collapse conclusion do not follow without additional evidence. The initial review already reproduces the independent Flash benchmark arithmetic under its stated conditions.

## Disposition

Q09 still needs revision under R2: the [original Zenodo reference](https://zenodo.org/records/23840458) remains in the task's acceptance list. A direct [record API request](https://zenodo.org/api/records/23840458) returned HTTP 403 in this check. That is an access limitation, not evidence the record was removed or superseded. Provide the scope-correction authority or address the original record; identify the five-model reply if retaining that additional claim.

Q10's raw configurations and packing have been reviewed. Its state is now **needs revision**, because the H100 metric-quality question R5 requires the contributor's evidence/disposition. No additional unspecified reviewer work is being used to leave it indefinitely under review. The warning alone has not proved client TPS invalid; the requested explanation can resolve it.

The matrix now has **six accepted research analyses, two documented evidence gaps and seven items needing revision**. R1–R6 remain the same correction set. Full-source integration and validation of corrected behavior remain outstanding; PR #1 remains a draft. There has been no contributor acknowledgement or revised submission in the repository at this scheduled check.
