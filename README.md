# AI compute landscape (November 2026)

An interactive page on who supplies AI compute: hyperscalers (AWS, Microsoft Azure, Google Cloud, Oracle, Meta, xAI/SpaceX), neoclouds (CoreWeave, Nebius, Lambda, Crusoe, Nscale, Fluidstack and others), power hosts, and the Chinese clouds.

**Live page:** https://hxu296.github.io/ai-compute-landscape/

It covers:

- fleet sizes, by chip designer;
- the big compute contracts and who signed them with whom;
- growth in revenue, power and backlog;
- published GPU-hour prices and price indices;
- what the large deals imply per kW-month;
- statements on inference versus training;
- China's chip mix.

## Reading the numbers

Every figure links to its source and carries a tag:

- **R**: reported by the company or in a filing.
- **D**: derived by a stated formula.
- **E**: estimated from indirect evidence.

The rules used throughout:

- **Hosts carry megawatts only.** The GPUs inside a host's buildings belong to the tenants.
- **Money is the cloud segment** wherever the company reports one.
- **GPU estimates from power** use 1,400 W of IT load per Hopper GPU and 2,000 W per GB200/GB300 GPU, with a PUE of 1.3 when the source gives gross power. They are shown as ±30% ranges.
- **H100-equivalents** (dense peak) are a compute yardstick, not delivered throughput.
- **Prices** are the latest point per provider and chip since January 2026. They are converted at the ECB rate on the source date.
- **Building leases are counted apart from compute contracts**, because the same capacity often appears twice: once in the lease and again in the compute deal built on it. Hardware orders, options, backstops and framework deals are also kept apart.

The method section at the bottom of the page lists what the data cannot tell you, and 323 known gaps.

## Files

- `index.html`, `style.css`, `js/`: the page. It is plain JavaScript with no build step, and it also works opened from disk.
- `data/nc.js`: the full dataset behind the page.
- `ai-compute-landscape.html`: the same page as one self-contained file.
- `fonts/`: Newsreader, Inter and JetBrains Mono, all under the SIL Open Font License.

## Credits

- **Fleet estimates and lab spending breakdowns:** [Epoch AI](https://epoch.ai/data), under CC BY 4.0.
- **Price indices:** Silicon Data and Ornn readings, as published.
- **Everything else:** linked to its own source on the page.

The figures were compiled from public filings, earnings calls, company pages and press. They are not investment advice.
