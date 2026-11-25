// HPC project page ("/projects/hpc") — Haydean cluster administration and
// tuning, plus the UCSC HPC club's competition systems.
import { projectById } from "../data/projects";
import { BENCH_DATASETS, benchTable } from "../lab/bench-data";
import { repos } from "./constants";
import { projectFooter, projectHeader, resultRow } from "./project-ui";
import type { Page } from "./types";

const project = projectById("hpc");

const benchButtons = BENCH_DATASETS.map(
    (dataset, index) =>
        `<button type="button" class="demo-button" data-bench-view aria-pressed="${index === 0 ? "true" : "false"}">${dataset.label}</button>`
).join("");
const benchTables = BENCH_DATASETS.map((dataset) => `<h3>${dataset.title}</h3>${benchTable(dataset)}`).join("\n");
const firstBench = BENCH_DATASETS[0];

export const hpcPage: Page = {
    title: "HPC and cluster tuning.",
    eyebrow: "Project / HPC",
    kind: "project",
    section: "Projects",
    updated: "2026-11-23",
    description: project.description,
    keywords: project.keywords,
    content: `<article class="article project-article">
${projectHeader(
    project,
    "Project / HPC",
    "Clusters, benchmarks, and sweeps.",
    "Tuning scientific workloads from a 4-node lab cluster to a 2× H100 competition system.",
    [
        { label: "HPC-Tools", href: repos.hpcTools },
        { label: "HPL_Builds", href: repos.hplBuilds },
        { label: "FPGA work", href: "/projects/fpga" }
    ]
)}

<h2 id="overview">Overview</h2>
<p>High-performance computing is a measurement discipline. The job is to know what the machine is doing, change one thing, and run the benchmark again. Most of my HPC work has been exactly that: build the stack, measure it, and keep the sweep going until the numbers stop improving.</p>
<p>Haydean is a four-node lab cluster. The competition work moves across an HPE Cray system, a custom multi-node IndySCC cluster, a 2× NVIDIA H100 system, and a low-power cluster of Raspberry Pis and a Jetson Nano. The hardware changes; the method does not.</p>

<h2 id="architecture">Architecture</h2>
<div class="diagram-scroll"><svg class="vector-diagram" viewBox="0 0 960 430" role="img" aria-labelledby="hpc-arch-title hpc-arch-desc">
<title id="hpc-arch-title">Haydean cluster architecture</title>
<desc id="hpc-arch-desc">An admin and login node connects to a Slurm controller, shared NFS storage, and four compute nodes running MPI and OpenBLAS; HPL sweeps measure the result.</desc>
<rect x="1" y="1" width="958" height="428" fill="#10161a" stroke="#2b3439"/>
<g fill="#161d22" stroke="#2b3439">
<rect x="40" y="60" width="200" height="74"/>
<rect x="40" y="188" width="200" height="74"/>
<rect x="40" y="316" width="200" height="74"/>
<rect x="370" y="124" width="210" height="76"/>
<rect x="370" y="260" width="210" height="76"/>
<rect x="700" y="60" width="220" height="292"/>
</g>
<g fill="#e6e2d8" font-family="sans-serif" font-size="17" text-anchor="middle">
<text x="140" y="92">Admin / login</text><text x="140" y="118" font-family="monospace" font-size="12" fill="#99a09d">SSH key mesh</text>
<text x="140" y="220">Slurm + slurmdbd</text><text x="140" y="246" font-family="monospace" font-size="12" fill="#99a09d">MariaDB / job state</text>
<text x="140" y="348">NFS</text><text x="140" y="374" font-family="monospace" font-size="12" fill="#99a09d">shared home / data</text>
<text x="475" y="158">Compute nodes ×4</text><text x="475" y="184" font-family="monospace" font-size="12" fill="#99a09d">srun / MPI ranks</text>
<text x="475" y="294">HPL + OpenBLAS</text><text x="475" y="320" font-family="monospace" font-size="12" fill="#99a09d">OpenMPI / thread binding</text>
</g>
<g fill="#161d22" stroke="#2b3439">
<rect x="726" y="86" width="168" height="52"/><rect x="726" y="164" width="168" height="52"/><rect x="726" y="242" width="168" height="52"/>
</g>
<g fill="#e6e2d8" font-family="sans-serif" font-size="15" text-anchor="middle">
<text x="810" y="117">parameter sweep</text><text x="810" y="195">measure GFLOPS</text><text x="810" y="273">keep / revert</text>
</g>
<g stroke="#d98a5f" stroke-width="2" marker-end="url(#hpc-arrow)">
<line x1="240" y1="97" x2="364" y2="150"/><line x1="240" y1="225" x2="364" y2="172"/>
<line x1="240" y1="353" x2="364" y2="312"/><line x1="580" y1="162" x2="694" y2="122"/>
<line x1="580" y1="298" x2="694" y2="268"/><line x1="810" y1="138" x2="810" y2="158"/>
<line x1="810" y1="216" x2="810" y2="236"/>
</g>
<text x="40" y="42" fill="#d98a5f" font-family="monospace" font-size="15" letter-spacing="2">HAYDEAN / 4 NODES</text>
<defs><marker id="hpc-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#d98a5f"/></marker></defs>
</svg></div>
<p>The cluster has the ordinary but essential pieces: account and job state, shared storage, a way to reach every node, and a benchmark that stresses the interconnect and the math libraries together. The sweep exists because none of those pieces has one universal best setting.</p>

<h2 id="implementation">Implementation</h2>
<h3>Haydean</h3>
<p>I help administer Haydean, a four-node HPC cluster. The stack includes Slurm with slurmdbd and MariaDB, NFS, an SSH key mesh, and user management across nodes. For HPL, I built and tuned OpenMPI and OpenBLAS, then wrote a Python tool that ran about 400 automated parameter sweeps.</p>
<p>The sweeps are not independent experiments in the statistical sense. They are a controlled search: change a block size, process grid, or thread-binding choice, rerun HPL, and retain only what survives a rerun.</p>

<h3>Competition work</h3>
<p>With UCSC’s High Performance Computing Club (Not-So-Slow Slugs), I have worked across several competition systems:</p>
<ul class="article-list">
<li><strong>Winter Classical Invitational</strong> — first place against 8 other U.S. colleges on an HPE Cray cluster.</li>
<li><strong>IndySCC</strong> — built and optimized a climate emulator, a hardware simulation, and a matrix benchmark on a custom multi-node cluster, with 10,000+ Slurm/MPI parameter sweeps.</li>
<li><strong>SCC Connect 2026</strong> — tuned the three graded benchmarks on one 2× NVIDIA H100 LaunchPad node; see <a href="/projects/scc-connect">the project page</a>.</li>
<li><strong>Single Board Cluster Competition</strong> — built and tuned a low-power cluster of 10 Raspberry Pis and a Jetson Nano.</li>
</ul>

<h2 id="results">Results</h2>
<div class="result-grid">
${resultRow("HPL throughput", "663 GFLOPS", "Haydean, tuned OpenMPI / OpenBLAS")}
${resultRow("Peak efficiency", "~47%", "of theoretical peak")}
${resultRow("Haydean sweeps", "~400", "automated parameter runs")}
${resultRow("IndySCC sweeps", "10,000+", "Slurm / MPI parameter runs")}
</div>
<div class="table-wrap"><table class="spec-table wrap">
<thead><tr><th>System</th><th>Work</th><th>Result</th></tr></thead>
<tbody>
<tr><td>Haydean, 4 nodes</td><td>Slurm/slurmdbd, NFS, SSH mesh, user management</td><td>4-node cluster for HPL and lab workloads</td></tr>
<tr><td>HPL</td><td>Built OpenMPI/OpenBLAS; ~400 automated sweeps</td><td>~663 GFLOPS, ~47% of theoretical peak</td></tr>
<tr><td>Competition systems</td><td>HPE Cray, IndySCC custom cluster, 2× H100, 10× Raspberry Pi + Jetson</td><td>Team results and tuned workloads</td></tr>
</tbody>
</table></div>
<p>The 47% figure is the useful one: it says how much of the machine the benchmark actually reached, not just how fast the code looked.</p>

<h2 id="bench">Interactive: the measured competition record</h2>
<p>The 2026 SCC Connect campaign produced more numbers than a summary table can carry, so the measured results are collected here. The explorer draws the logged runs and stops there: four problem sizes because four were run, four collectives because four were graded, and no interpolated point between them. The table under each chart is the same data without the canvas.</p>
<div class="bench" data-bench>
<div class="bench-toolbar" role="group" aria-label="Benchmark dataset">${benchButtons}</div>
<div class="bench-stage"><canvas data-visualization="bench" role="img" aria-label="Bar chart of measured HPL throughput by problem size, with the full data tables below the chart."></canvas></div>
<p class="bench-readout" data-bench-readout aria-live="polite">${firstBench.title} — ${firstBench.subtitle}</p>
<p class="bench-note" data-bench-note>${firstBench.note}</p>
<details class="bench-table">
<summary>Data tables and provenance</summary>
<p class="bench-provenance">Source: the Not-So-Slow Slugs benchmark report for SCC Connect 2026, measured September–November 2026 on one NVIDIA LaunchPad node with 64 CPU cores and two H100 GPUs. HPL peak is 5,120 GFLOPS and NVLink peak is 318.7 GB/s. The HPL large-N campaign is 24 runs across four sizes; the settings rows come from separate campaigns with different run counts; NCCL cells are best of three at 8 GiB; STREAM rows are the best repeat after changing one parameter from the tuned baseline. None of these rows is a full factorial experiment, so the explorer does not draw a fitted trend or claim a significance test.</p>
${benchTables}
</details>
</div>

<h2 id="analysis">Analysis</h2>
<p>The 47% of peak is an HPL result for one cluster and configuration, not a general efficiency claim; a different problem size, network, or BLAS build changes the number. The competition work is team work, and the first-place finish belongs to the team. The 400 Haydean sweeps and the 10,000+ IndySCC sweeps are parameter sweeps, not independent experiments, so they show sensitivity rather than statistical significance.</p>
<p>The loop is always the same: establish a baseline, change a parameter, measure, and keep the result only if it survives a rerun. That is how the HPL sweeps reached roughly 47% of peak, and how the IndySCC workloads were tuned without guessing.</p>
${projectFooter([
    { label: "IndySCC-UCSC-NSSS", href: repos.indyScc },
    { label: "SBCC 2026 UCSC", href: repos.sbcc }
])}
</article>`
};
