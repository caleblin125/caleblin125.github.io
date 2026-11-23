// SCC Connect 2026 project page ("/projects/scc-connect").
//
// Facts and figures come from the team's submitted benchmark report and its
// LaTeX sources on scc-connect-17-gpu01 (/home/nvidia/report), the per-benchmark
// run records under ~/caleb/SCC-CONNECT-2026/outputs and /submissions, and the
// ValQyriE results snapshot. The report's own labels are kept: a measured value
// is not presented as a prediction, and the page does not claim a placement.
import { projectById } from "../data/projects";
import { repos } from "./constants";
import { projectFooter, projectHeader, resultRow } from "./project-ui";
import type { Page } from "./types";

const project = projectById("scc-connect");

export const sccConnectPage: Page = {
    title: "One node, measured.",
    eyebrow: "Project / High-performance computing",
    kind: "project",
    section: "Projects",
    updated: "2026-11-23",
    description: project.description,
    keywords: project.keywords,
    content: `<article class="article project-article">
${projectHeader(
    project,
    "Project / High-performance computing",
    "One node, measured.",
    "SCC Connect 2026 put our six-person team on a single NVIDIA LaunchPad node. We tuned the three graded benchmarks, CPU HPL, CPU STREAM, and NCCL over NVLink, and submitted the logs that produced every number.",
    [{ label: "Team repository", href: repos.sccConnect }]
)}

<h2 id="overview">Overview</h2>
<p>SCC Connect 2026 is a student cluster competition. Our team, <strong>Not-So-Slow Slugs</strong> (team 17, UC Santa Cruz), was assigned one NVIDIA LaunchPad bare-metal node rather than a cluster: two Xeon Gold 6548Y+ processors (32 cores each, 64 cores and 128 threads total), 1 TiB of DDR5-5200, and two H100 NVL GPUs joined by an NV12 bond. The graded benchmarks were CPU HPL, CPU STREAM, and NCCL; GPU HPL and GPU STREAM were supplementary and ungraded.</p>
<p>The hard part is not only reaching a number. A benchmark result is useful only if another person can see the binary, environment, problem size, and system state that produced it. We built every campaign around a run record and a best-configuration file, then re-ran the winner instead of trusting the tuner's best point. The submission carries the unedited output of those winning runs, the commands beside them, and the system counters that explain them.</p>
<p>I built the HPL and STREAM autotuning harnesses and the NCCL grid, ran the large-N and repeat campaigns, and wrote most of the report. Myles Hallett wrote the local-AI appendix and the final NCCL narrative; Indira Mariya ran the final NCCL tuning; Holden Martinez added the ValQyriE results. Shiloh Sharmahd and Julien Lee rounded out the team. This page reports what the submitted logs contain, and says where a number is a prediction rather than a measurement.</p>

<h2 id="architecture">Architecture</h2>
<div class="diagram-scroll"><svg class="vector-diagram" viewBox="0 0 960 440" role="img" aria-labelledby="scc-arch-title scc-arch-desc">
<title id="scc-arch-title">SCC Connect 2026 measurement and submission pipeline</title>
<desc id="scc-arch-desc">One shared node feeds four workload groups: CPU HPL, CPU STREAM, NCCL over NVLink, and the separate WRF, MFC, and ValQyriE deliverables. A tuner searches each workload while a node lock keeps benchmarks from overlapping and a restore step puts system settings back. Every run writes a command, environment, log, and system counters. The best configuration is re-run, then collected into the report and submission archive.</desc>
<rect x="1" y="1" width="958" height="438" fill="#2a1e32" stroke="#51425a"/>
<text x="36" y="38" fill="#c59ad8" font-family="monospace" font-size="15" letter-spacing="2">SCC CONNECT 2026 / ONE NODE</text>
<g fill="#1a1320" stroke="#51425a">
<rect x="36" y="58" width="888" height="58"/>
<rect x="36" y="146" width="204" height="66"/><rect x="264" y="146" width="204" height="66"/><rect x="492" y="146" width="204" height="66"/><rect x="720" y="146" width="204" height="66"/>
<rect x="36" y="242" width="204" height="62"/><rect x="264" y="242" width="432" height="62"/><rect x="720" y="242" width="204" height="62"/>
<rect x="36" y="334" width="888" height="66"/>
</g>
<g fill="#eee8f2" font-family="sans-serif" font-size="16">
<text x="52" y="84">2× XEON 6548Y+ · 64 CORES · 1 TiB DDR5-5200</text>
<text x="52" y="106" fill="#9a8da0" font-family="monospace" font-size="11">2× H100 NVL 94 GB · NV12 318.7 GB/s per direction · Ubuntu 24.04.5</text>
<text x="52" y="172">HPL / CPU</text><text x="280" y="172">STREAM / CPU</text><text x="508" y="172">NCCL / NVLink</text><text x="736" y="172">OTHER TASKS</text>
</g>
<g fill="#9a8da0" font-family="monospace" font-size="10">
<text x="52" y="194">Intel MKL HPL · Intel MPI</text><text x="52" y="206">one rank · 64 cores</text>
<text x="280" y="194">stream.c 5.10 · icx</text><text x="280" y="206">64 threads · 1 GiB arrays</text>
<text x="508" y="194">nccl-tests · NCCL 2.32.3</text><text x="508" y="206">64 channels · registered</text>
<text x="736" y="194">WRF · MFC · ValQyriE</text><text x="736" y="206">separate deliverables</text>
<text x="52" y="268">NODE LOCK</text><text x="52" y="286">one benchmark at a time</text>
<text x="52" y="298">shared machine, private runs</text>
<text x="280" y="268">TUNER</text><text x="280" y="286">SMAC3 for mixed, conditional spaces · one-change grids · interleaved repeats</text>
<text x="280" y="298">search small, confirm at scale, restore after every run</text>
<text x="736" y="268">RESTORE</text><text x="736" y="286">power, uncore, THP, EPB</text><text x="736" y="298">returned after each run</text>
<text x="52" y="360">RUN RECORD</text><text x="52" y="382">exact command + environment · stdout log · HPL.dat / settings.txt · turbostat clocks, power, temperature · config JSON</text>
</g>
<g stroke="#c59ad8" stroke-width="2" marker-end="url(#scc-arrow)" fill="none">
<line x1="138" y1="212" x2="138" y2="236"/><line x1="366" y1="212" x2="366" y2="236"/><line x1="594" y1="212" x2="594" y2="236"/><line x1="822" y1="212" x2="822" y2="236"/>
<line x1="138" y1="304" x2="138" y2="328"/><line x1="480" y1="304" x2="480" y2="328"/><line x1="822" y1="304" x2="822" y2="328"/>
</g>
<text x="404" y="46" fill="#9a8da0" font-family="monospace" font-size="10" text-anchor="end">BEST CONFIG → RUNBEST → REPEAT → REPORT</text>
<text x="36" y="424" fill="#9a8da0" font-family="monospace" font-size="11">No number leaves this loop without the run that produced it.</text>
<defs><marker id="scc-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#c59ad8"/></marker></defs>
</svg></div>
<p>The loop has one rule: the tuner proposes, but the submitted number comes from a named run. A search can produce thousands of points and still leave the winner unconfirmed at full problem size, so each campaign ended with a separate confirmation run: 24 large-N HPL runs, a best-configuration STREAM output saved beside its build line, and three repeats of every NCCL measurement. The report and the submission archive were generated from those records, not retyped from a summary.</p>
<p>The node is shared by six people, so the harness takes a node lock before a benchmark and restores every setting it changed. That is also why the run record matters: a teammate can see that a result used 1.0 GHz uncore, THP <code>always</code>, or a specific channel count without reconstructing the session from memory.</p>

<h2 id="implementation">Implementation</h2>

<h3>HPL: search the driver, not the matrix</h3>
<p>The best CPU result used Intel's prebuilt <code>xhpl_intel64_dynamic</code> from oneMKL 2026.1.0, with a single MPI rank over all 64 physical cores and MKL's threading inside it. Our own netlib HPL 2.3 build, linked to the same MKL and Intel MPI, reached 3,171.3 GFLOPS by comparison, so the 39% advantage comes from Intel's HPL driver rather than the BLAS. We did not modify either binary.</p>
<p>A SMAC3 tuner searched 23 parameters: every HPL.dat choice, block sizes from 256 to 2048, rank grids up to 8 ranks, Intel's <code>HPL_*</code> controls, the uncore frequency cap, and the NUMA policy. The search ran at N ≈ 90,000 to keep a run near two to three minutes, and completed 567 runs across five campaigns, 443 with Intel HPL and 124 with netlib HPL. One rank won clearly; every run above 4,200 GFLOPS used a block size between 715 and 768. The winner was then confirmed at 276,640 to 345,800, where one run costs 54 to 104 minutes.</p>
<p>The selected configuration used N = 324,520 (a 785 GiB matrix, about 78% of RAM), NB = 760, one rank, <code>HPL_HT=0</code> so the SMT siblings stayed idle, and an uncore cap of 1.0 GHz. All 24 large-N runs passed the residual check. The best took 5,174 s.</p>

<h3>STREAM: find the memory, then stop measuring cache</h3>
<p>The first sweep was about array size, not compiler flags. With 248 MiB of total last-level cache on the node, arrays that fit in cache reported up to 4,571 GB/s, nearly seven times the DRAM peak; those trials measure cache. Above about 2 GiB the numbers level off and track thread count: one thread reaches about 18 GB/s, 64 to 128 threads reach the most. A random sweep of 3,195 trials, 2,154 of them valid, fixed 1 GiB arrays and 64 threads before a SMAC3 tuner searched compiler flags, array size, <code>NTIMES</code>, <code>OFFSET</code>, threading, MPI ranks, and machine settings.</p>
<p>The tuner completed 4,489 runs in five seeded campaigns. A final repeat loop then ran from October 27 to November 2: 77,685 runs, 38,846 of them the best configuration and the rest 22 one-setting variations interleaved with it. That loop is how a 1% effect was separated from slow drift. The winning build used <code>-O2 -qopenmp -mcmodel=medium -march=native -qopt-streaming-stores=auto -funroll-loops</code>, <code>NTIMES=100</code>, and a 64-element offset, with THP <code>always</code> and 64 threads pinned one per physical core.</p>
<p>Two choices are deliberately not the fastest measured option. Arrays of 0.75 GiB per array ran 1.05% faster, but they are only 3.1 times all cache levels, so part of the gain may be cache; the page and the report quote 1 GiB. And the tuner's job was to find the best configuration, not to prove that every 0.1% difference is real. The repeat loop supplied that check.</p>

<h3>NCCL: fill the links</h3>
<p>The two H100 NVLs are joined by 12 active NVLinks, each at 26.562 GB/s per direction, for a 318.7 GB/s per-direction peak. The first campaign was a 648-run grid at 8 GiB over channel count, <code>NCCL_ALGO</code>, <code>NCCL_PROTO</code>, <code>NCCL_BUFFSIZE</code>, <code>NCCL_NTHREADS</code>, and <code>NCCL_P2P_READ_ENABLE</code>. Channels dominated: raising the count from the default 16 to 64 added about 7% to all_reduce, 25% to all_gather, 22% to reduce_scatter, and 2% to broadcast. The other knobs mostly overlapped, and 48 channels were oddly worse than both 32 and 64; we did not find out why.</p>
<p>The final bandwidth setting fixed <code>NCCL_MIN_NCHANNELS</code> and <code>NCCL_MAX_NCHANNELS</code> at 64 and registered the buffers with <code>-R 1</code>, so NCCL writes into them directly. Latency needed a different setting: symmetric memory (<code>-R 2</code>) and CUDA graphs (<code>-G 10</code>) cut the small-message floor from about 10 µs to 2.2–4.0 µs, but <code>-R 2</code> costs about 30% on large all_reduce and reduce_scatter. Each final setting was timed three times, and every setting got a correctness check. With <code>NCCL_DEBUG=INFO</code>, every channel reported peer-to-peer transport over NVLink, with no shared-memory or network path.</p>

<h3>The rest of the entry</h3>
<p>The submission also carried separate WRF, MFC, and ValQyriE deliverables. They are not extra points on the three graded benchmarks, so their numbers are kept separate here.</p>
<ul class="article-list">
<li><strong>WRF.</strong> The team's Santa Cruz benchmark case is a GFS-driven 9 km outer domain with a 3 km nest, 100 × 100 × 45 points each, run for three forecast hours. A 74-run tuner reached <strong>298.5× real time</strong> with 60 MPI ranks × 2 OpenMP threads, against 248× for the first build. The tuner only timed runs; it did not answer-check the forecast. The submitted Derecho case is a different, 24-hour forecast, so its speed is not this number.</li>
<li><strong>ValQyriE.</strong> A fused, compiled evaluator ran one h2o-24q energy and gradient evaluation in <strong>434.627 s on one core</strong>, against 29,704.248 s for the reference NumPy code, a 68.3× speedup with the correctness gate passing. The thread sweep was still pending at submission, and the roofline's ~1.9 s full-node figure is a prediction, not a measurement.</li>
<li><strong>MFC.</strong> The team submitted problem artifacts and figures from its MFC work. No MFC performance number is claimed here.</li>
<li><strong>Local AI assistant.</strong> Myles Hallett built the team's offline assistant around vLLM and Qwen3.8-27B-FP8 with MTP2, serving 156 tok/s for one user on one GPU. It ran on GPU 0 during the event and was evaluated on 25 tasks drawn from the team's own work; the second GPU stayed free for benchmarks.</li>
</ul>

<h3>What makes it reproducible</h3>
<p>Every benchmark folder carries a <code>setup.sh</code> and <code>run.sh</code> that reproduce its run. The HPL best-run folder holds <code>HPL.dat</code>, the launch script, and a <code>turbostat</code> trace of core and uncore clocks, package power, and temperature. The STREAM folder holds the build line and system settings. The NCCL logs carry <code>.meta</code> files with the exact command and environment, and the NCCL folder also holds the topology, NVLink status, the full 8 B to 8 GiB sweep, and a <code>summary.md</code> comparing each tuning round with the default. A <code>runbest.sh</code> for each workload re-runs the stored best configuration.</p>
<p>The report itself is LaTeX source plus a 1 MB PDF; the full submission archive is 298.7 MB, dominated by logs and the WRF output. The public repository contains the harnesses and the run records; the report sources and the submitted archive are separate team copies, and the archive is the frozen copy the organizers received.</p>

<h2 id="results">Results</h2>
<div class="result-grid">
${resultRow("HPL, CPU", "4,403.6 GFLOPS", "86.0% of 5,120 base-clock peak")}
${resultRow("STREAM Triad", "481.6 GB/s", "72.4% of 665.6 DRAM peak")}
${resultRow("NCCL all_reduce", "249.9 GB/s", "78.4% of 318.7 NVLink peak")}
${resultRow("Tuning campaigns", "5,704 runs", "HPL + STREAM SMAC3 + NCCL grid")}
</div>
<p>The three headline numbers are best runs, not tuner points. Each is paired with a mean and a run count so the spread is visible. The HPL mean is over the 24 large-N confirmation runs; the STREAM mean is over 28,758 validated runs; the NCCL means are over three repeats per collective.</p>
<div class="table-wrap"><table class="spec-table wrap">
<thead><tr><th>Benchmark</th><th>Best</th><th>Mean (runs)</th><th>Peak</th><th>% of peak</th><th>Check</th></tr></thead>
<tbody>
<tr><td>HPL, CPU (GFLOPS)</td><td><strong>4,403.6</strong></td><td>4,399.1 ± 3.0 (24)</td><td>5,120</td><td>86.0%</td><td>Residual PASS, all 24</td></tr>
<tr><td>STREAM Triad (GB/s)</td><td><strong>481.6</strong></td><td>476.2 ± 1.8 (28,758)</td><td>665.6</td><td>72.4%</td><td>Solution validates</td></tr>
<tr><td>NCCL all_reduce (GB/s)</td><td><strong>249.9</strong></td><td>249.9 (3)</td><td>318.7</td><td>78.4%</td><td>0 wrong values</td></tr>
<tr><td>NCCL all_gather (GB/s)</td><td>249.7</td><td>249.7 (3)</td><td>318.7</td><td>78.3%</td><td>0 wrong values</td></tr>
<tr><td>NCCL reduce_scatter (GB/s)</td><td>246.4</td><td>246.4 (3)</td><td>318.7</td><td>77.3%</td><td>0 wrong values</td></tr>
<tr><td>NCCL broadcast (GB/s)</td><td>251.4</td><td>251.4 (3)</td><td>318.7</td><td>78.9%</td><td>0 wrong values</td></tr>
</tbody>
</table></div>
<figure class="article-figure"><img src="/projects/scc-hpl.png" alt="Scatter plot of HPL autotuning runs by campaign, with a best-so-far line for each: netlib HPL reaching 3,171 GFLOPS, Intel HPL reaching 4,138, then 4,171, then 4,288 GFLOPS at small problem sizes." loading="lazy" decoding="async"><figcaption>Every HPL autotuning run at N ≈ 90,000, grouped by campaign. Dots are individual runs and lines are the best so far in each group. The netlib build (blue) stops at 3,171 GFLOPS; the Intel driver with all knobs (orange) reached 4,288 before the winner was confirmed at large N.</figcaption></figure>
<figure class="article-figure"><img src="/projects/scc-stream.png" alt="Log-log scatter of 2,154 valid STREAM trials plotting Triad bandwidth against total array memory, colored by thread count, with a dashed line at 248 MiB of cache and another at the 665.6 GB/s DRAM peak." loading="lazy" decoding="async"><figcaption>The STREAM random sweep. Runs left of the dotted line fit in the node's 248 MiB of cache and report up to 4,571 GB/s; runs above about 2 GiB measure DRAM and level off. Bandwidth then depends mostly on thread count, which is why 1 GiB arrays and 64 threads were fixed before the flag search.</figcaption></figure>
<figure class="article-figure"><img src="/projects/scc-nccl.png" alt="Six-panel NCCL tuning grid at 8 GiB, with runs colored by collective, grouped by channels, protocol, peer-to-peer read mode, thread count, buffer size, and algorithm." loading="lazy" decoding="async"><figcaption>The 648-run NCCL grid at 8 GiB. Dots are individual runs; each bar marks the best run with that setting. Each panel isolates one setting while the others vary, so the bars are best-per-setting rather than controlled comparisons. Channel count spreads the collectives most; protocol, thread count, buffer size, and algorithm mostly overlap.</figcaption></figure>
<p>GPU HPL and GPU STREAM were supplementary, not graded. They are included because they show what the same node does when the benchmark moves to the H100s, and because the numbers are in the submitted logs:</p>
<div class="table-wrap"><table class="spec-table wrap">
<thead><tr><th>Supplementary run</th><th>Result</th><th>Configuration</th></tr></thead>
<tbody>
<tr><td>GPU HPL, 2× H100 NVL</td><td>69.15 TFLOPS</td><td>N = 136,192, NB = 1,024, 2 × 1 ranks, 24.35 s, residual PASS</td></tr>
<tr><td>GPU STREAM, 1× H100 NVL</td><td>3,446.5 GB/s Triad</td><td>FP32, 2<sup>30</sup>-element arrays, SM clock 1,785 MHz, 310 W</td></tr>
</tbody>
</table></div>

<h2 id="analysis">Analysis</h2>
<h3>HPL: the clock is the ceiling</h3>
<p>The 14% gap to the 5,120 GFLOPS base-clock peak is mostly power. Each socket held at about 249 W, its 250 W package limit, for the whole run, so the all-core AVX-512 clock averaged 2.31 GHz instead of 2.5 GHz. At that measured clock the attainable peak is 4,728 GFLOPS, and 4,403.6 is 93.1% of it. The remainder is HPL overhead: panel factorization, row swaps, and broadcasts, plus DGEMM running slightly below peak.</p>
<p>Raising the package limit from Linux did nothing: 250, 275, and 300 W all stayed at 249 W. The CPU's own limit register names <code>VR_TDC</code>, the voltage regulator's sustained current limit of 430 A, which is locked by firmware. Capping the uncore at 1.0 GHz helps because the mesh and memory controllers share the same power budget; freeing that power lets the cores clock higher. The other measured effects point the same way: <code>numad</code> running costs 28% by migrating memory mid-run, SMT siblings roughly halve throughput, and moving from 276k to 346k changes the mean by 0.12%. This is a power-delivery result, not a parameter-search result.</p>

<h3>STREAM: 72% of peak is 98% of what the bus can do</h3>
<p>The theoretical DRAM peak counts every transfer slot as useful data, which no real access pattern achieves. A small probe under the same settings measured 543.1 GB/s for reads and 400.8 GB/s for streaming writes; Triad's two-reads-one-write mix therefore tops out near 485.6 GB/s. The 476.2 GB/s mean is 98.1% of that measured ceiling, and the 481.6 GB/s best run is 99.2%. Writes are the expensive part: DDR5 loses time turning the bus around between reads and writes, and writes alone reach only 60% of peak.</p>
<p>That also explains the cache results. The 4.5 TB/s trials are not a memory result and are excluded from the headline. The practical lever left is BIOS-level: sub-NUMA clustering and disabling patrol scrub or memory power-down, none of which this node exposes.</p>

<h3>NCCL: broadcast is the link</h3>
<p>Broadcast sends in one direction with no arithmetic and still stops at 251.4 GB/s, so that is the practical link ceiling for this pair; after tuning, all four collectives are within 5 GB/s of it. Against NVIDIA's 300 GB/s spec rate (after encoding overhead) the result is 83.8%, and against the raw 318.7 GB/s signalling rate it is 78.9%. The remaining gap is packet and flag overhead on NVLink; we did not measure a raw copy ceiling with a separate tool.</p>
<p>The latency and bandwidth settings are separate for a reason. CUDA graphs remove most of the launch cost, and symmetric memory removes most of the handshake, but symmetric memory also hurts large reductions by about 30%. The report recommends 64 channels and registered buffers for large transfers, and graphs plus symmetric memory for many small messages, with an end-to-end check: 64 channels occupy 64 of the GPU's 132 SMs while communicating, which a real application may not be able to spare.</p>

<h3>What this is not</h3>
<p>This is one node, one event, and one submission. The page reports no placement, because the artifacts do not contain one, and it does not treat the tuner's runs as independent experiments: SMAC3 chose each next point from the previous results, so the run counts show search effort, not statistical power. The best values are best runs, paired with means so the reader can see the spread. The WRF tuning number belongs to the team's Santa Cruz benchmark case and was not answer-checked; the submitted Derecho forecast is a different run. The ValQyriE 68.3× result is single-core and was measured under shared-machine load, with the thread sweep still pending. The GPU HPL and GPU STREAM numbers are supplementary and ungraded. The report's own limits, including the untested 1 GB huge-page reservation and the unmeasured raw NVLink copy ceiling, are stated beside the results rather than hidden here.</p>
${projectFooter([
    { label: "Team repository", href: repos.sccConnect },
    { label: "HPC and cluster tuning", href: "/projects/hpc" }
])}
</article>`
};
