// Forecasting project page ("/projects/forecasting") — short-term data-center
// electricity load forecasting from the Smart Grids and Data Analytics Lab.
import { projectById } from "../data/projects";
import { projectFooter, projectHeader, resultRow } from "./project-ui";
import type { Page } from "./types";

const project = projectById("forecasting");

export const forecastingPage: Page = {
    title: "Data-center load forecasting.",
    eyebrow: "Project / Forecasting",
    kind: "project",
    section: "Projects",
    updated: "2026-11-23",
    description: project.description,
    keywords: project.keywords,
    content: `<article class="article project-article">
${projectHeader(
    project,
    "Project / Forecasting",
    "A decade of ten-minute load.",
    "Short-term electricity load forecasting for a data center, evaluated against traditional baselines on ten years of 10-minute-resolution data.",
    [
        { label: "Résumé context", href: "/resume" },
        { label: "HPC work", href: "/projects/hpc" }
    ]
)}

<h2 id="overview">Overview</h2>
<p>A data center's electricity load is a time series with structure at several scales: a daily shape, a weekly shape, slower seasonal drift, and short excursions caused by equipment or workload changes. The research question is narrow and useful: how accurately can the next short window be forecast from the history, and how much of that accuracy survives comparison with a traditional method?</p>
<p>The work sits in UC Santa Cruz's Smart Grids and Data Analytics Lab. The dataset covers a decade at 10-minute resolution. The reported result is 3% MAPE for the model against 10% for the traditional method.</p>

<h2 id="architecture">Architecture</h2>
<div class="diagram-scroll"><svg class="vector-diagram" viewBox="0 0 960 420" role="img" aria-labelledby="forecast-arch-title forecast-arch-desc">
<title id="forecast-arch-title">Forecasting pipeline</title>
<desc id="forecast-arch-desc">Ten-minute load history passes through cleaning and windowing, then model fitting and backtesting, then comparison with a traditional baseline; the output is a short-horizon forecast and an error score.</desc>
<rect x="1" y="1" width="958" height="418" fill="#10161a" stroke="#2b3439"/>
<g fill="#161d22" stroke="#2b3439">
<rect x="30" y="100" width="190" height="92"/><rect x="268" y="100" width="190" height="92"/>
<rect x="506" y="100" width="190" height="92"/><rect x="744" y="100" width="186" height="92"/>
</g>
<g fill="#e6e2d8" font-family="sans-serif" font-size="17" text-anchor="middle">
<text x="125" y="136">10-minute history</text><text x="363" y="136">windows + features</text>
<text x="601" y="136">models</text><text x="837" y="136">evaluation</text>
</g>
<g fill="#99a09d" font-family="monospace" font-size="12" text-anchor="middle">
<text x="125" y="164">decade / load</text><text x="363" y="164">daily / weekly context</text>
<text x="601" y="164">time series + ML</text><text x="837" y="164">MAPE vs baseline</text>
</g>
<g stroke="#d98a5f" stroke-width="2" marker-end="url(#forecast-arrow)">
<line x1="220" y1="146" x2="262" y2="146"/><line x1="458" y1="146" x2="500" y2="146"/><line x1="696" y1="146" x2="738" y2="146"/>
</g>
<g fill="#161d22" stroke="#2b3439">
<rect x="268" y="260" width="428" height="74"/><rect x="744" y="260" width="186" height="74"/>
</g>
<g fill="#e6e2d8" font-family="sans-serif" font-size="16" text-anchor="middle">
<text x="482" y="292">traditional baseline</text><text x="837" y="292">same holdout</text>
</g>
<g fill="#99a09d" font-family="monospace" font-size="12" text-anchor="middle">
<text x="482" y="316">10% MAPE reported</text><text x="837" y="316">3% MAPE reported</text>
</g>
<g stroke="#d98a5f" stroke-width="2" marker-end="url(#forecast-arrow)">
<line x1="696" y1="292" x2="738" y2="292"/>
</g>
<text x="30" y="60" fill="#d98a5f" font-family="monospace" font-size="15" letter-spacing="2">FORECASTING LOOP</text>
<text x="30" y="390" fill="#99a09d" font-family="monospace" font-size="14">The public result is a single comparison. The holdout protocol and per-horizon errors are the next thing to document.</text>
<defs><marker id="forecast-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#d98a5f"/></marker></defs>
</svg></div>
<p>The pipeline is ordinary by design: keep the time index intact, build features that respect the sampling interval, fit on a training span, and score on a held-out span. The comparison matters more than the model name. A 3% result is only meaningful next to the 10% baseline on the same split.</p>

<h2 id="implementation">Implementation</h2>
<p>The implementation uses Python and the lab's time-series and machine-learning stack. The work included cleaning and aligning the 10-minute series, constructing short-horizon inputs with daily and weekly context, fitting candidate models, and evaluating predictions with mean absolute percentage error:</p>
<div class="math-display">$$\\mathrm{MAPE} = \\frac{100\\%}{n}\\sum_{t=1}^{n}\\left|\\frac{y_t - \\hat{y}_t}{y_t}\\right|$$</div>
<p>Linear algebra is part of the work rather than a backdrop: lag structure, scaling, and the conditioning of the design matrix all affect whether a model learns a stable relationship or memorizes a particular span. The baselines are not a formality. They are the control that says whether the added model complexity bought anything.</p>

<h2 id="results">Results</h2>
<div class="result-grid">
${resultRow("Model error", "3% MAPE", "short-term data-center load")}
${resultRow("Traditional baseline", "10% MAPE", "same problem context")}
${resultRow("History", "10 years", "10-minute-resolution data")}
</div>
<div class="table-wrap"><table class="spec-table wrap">
<thead><tr><th>Quantity</th><th>Reported result</th><th>What it means</th></tr></thead>
<tbody>
<tr><td>Model MAPE</td><td>3%</td><td>Average absolute percentage error on the evaluated forecasts</td></tr>
<tr><td>Traditional MAPE</td><td>10%</td><td>Baseline error on the same problem context</td></tr>
<tr><td>Data span</td><td>Decade of 10-minute samples</td><td>Roughly 52,560 samples per year before filtering</td></tr>
</tbody>
</table></div>

<h2 id="record">The experimental record, as far as it is public</h2>
<p>The headline comparison is verified. The protocol behind it is not fully published, and the difference matters: a 3% MAPE means one thing on a fixed chronological holdout and another on a shuffled or very short horizon. The table separates what the public record supports from what it does not.</p>
<div class="table-wrap"><table class="spec-table wrap record-table">
<thead><tr><th>Item</th><th>Status</th><th>What is known</th></tr></thead>
<tbody>
<tr><td>Dataset and span</td><td><span class="record-status" data-status="published">Published</span></td><td>A decade of data-center load at 10-minute resolution.</td></tr>
<tr><td>Sampling interval</td><td><span class="record-status" data-status="published">Published</span></td><td>10 minutes; the annual sample count shown above follows from it.</td></tr>
<tr><td>Input features</td><td><span class="record-status" data-status="partial">Partial</span></td><td>Short-horizon inputs with daily and weekly context are described; the exact feature list and lag set are not published.</td></tr>
<tr><td>Missing-data treatment</td><td><span class="record-status" data-status="missing">Not published</span></td><td>No rule is stated for gaps, outages, or duplicated timestamps.</td></tr>
<tr><td>Train / test split</td><td><span class="record-status" data-status="missing">Not published</span></td><td>No boundary dates, fold definition, or chronological split is given.</td></tr>
<tr><td>Forecast horizon</td><td><span class="record-status" data-status="missing">Not published</span></td><td>The result is described as short-term; the horizon in samples is not stated.</td></tr>
<tr><td>Model architecture</td><td><span class="record-status" data-status="partial">Partial</span></td><td>Described as time-series and machine-learning models; the exact family and hyperparameters are not published.</td></tr>
<tr><td>Traditional baseline</td><td><span class="record-status" data-status="published">Published</span></td><td>Reported at 10% MAPE on the same problem context.</td></tr>
<tr><td>Aggregate error</td><td><span class="record-status" data-status="published">Published</span></td><td>3% MAPE for the model.</td></tr>
<tr><td>Error by horizon</td><td><span class="record-status" data-status="missing">Not published</span></td><td>No per-step or per-horizon error curve is available.</td></tr>
<tr><td>Variance across periods</td><td><span class="record-status" data-status="missing">Not published</span></td><td>No fold-to-fold or seasonal breakdown is available.</td></tr>
<tr><td>Robustness tests</td><td><span class="record-status" data-status="missing">Not published</span></td><td>Holiday, workload-change, and sensor-gap behavior are not documented.</td></tr>
</tbody>
</table></div>
<p>Because the split, horizon, and per-horizon errors are missing, this page has no interactive forecasting explorer. An explorer needs a verified forecast series and a holdout boundary; without them, any chart would be a fabricated dataset wearing the lab's result. The right next artifact is an evaluation script and a table of error by horizon, and the explorer can follow.</p>

<h2 id="credit">Contribution and credit</h2>
<p>This is collaborative work in UC Santa Cruz's Smart Grids and Data Analytics Lab. The dataset and the traditional baseline belong to the lab project; my part was implementing and evaluating the time-series and machine-learning models against that baseline. The 10% figure is not my result, and the 3% figure should be read as the outcome of the team's evaluation rather than an independently replicated benchmark.</p>

<h2 id="analysis">Analysis</h2>
<p>The 3% figure is a strong headline, but it is not yet a complete experimental record. The public résumé reports the comparison, not the exact train/test boundary, the forecast horizon, the per-horizon error curve, or the variance across folds. Those details matter: a model can look excellent on a calm week and fail on a holiday or a workload migration.</p>
<p>The next version of this page should publish the split, the baseline definition, and error by horizon, with a reproducible evaluation script. Until then, the honest claim is the narrow one: on the lab's evaluation, the model reached 3% MAPE where the traditional approach reported 10%.</p>
${projectFooter()}
</article>`
};
