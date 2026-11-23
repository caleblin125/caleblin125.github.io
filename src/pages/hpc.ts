// HPC project page ("/projects/hpc") — Haydean cluster administration and
// tuning, plus the UCSC HPC club's competition systems.
import { repos } from "./constants";
import type { Page } from "./types";

export const hpcPage: Page = {
    title: "HPC and cluster tuning.",
    eyebrow: "Project / HPC",
    description: "HPC work by Caleb Lin: Haydean cluster administration, HPL tuning to 663 GFLOPS, and competition systems including a 2× H100 cluster.",
    content: `<article class="article">
<p class="kicker">Project / HPC</p>
<h1>Clusters, benchmarks, and sweeps.</h1>
<p class="lede">Tuning scientific workloads from a 4-node lab cluster to a 2× H100 competition system.</p>
<div class="link-row"><a class="text-link" href="/projects/fpga">FPGA work <span>↗</span></a><a class="text-link" href="${repos.hpcTools}">HPC-Tools <span>↗</span></a><a class="text-link" href="${repos.hplBuilds}">HPL_Builds <span>↗</span></a></div>
<p>High-performance computing is a measurement discipline. The job is to know what the machine is doing, change one thing, and run the benchmark again. Most of my HPC work has been exactly that: build the stack, measure it, and keep the sweep going until the numbers stop improving.</p>

<h2>Haydean: a 4-node cluster</h2>
<p>I help administer Haydean, a four-node HPC cluster. The stack includes Slurm with slurmdbd and MariaDB, NFS, an SSH key mesh, and user management across nodes. For HPL, I built and tuned OpenMPI and OpenBLAS, then wrote a Python tool that ran about 400 automated parameter sweeps.</p>
<div class="table-wrap"><table class="spec-table wrap">
<thead><tr><th>System</th><th>Work</th><th>Result</th></tr></thead>
<tbody>
<tr><td>Haydean, 4 nodes</td><td>Slurm/slurmdbd, NFS, SSH mesh, user management</td><td>4-node cluster for HPL and lab workloads</td></tr>
<tr><td>HPL</td><td>Built OpenMPI/OpenBLAS; ~400 automated sweeps</td><td>~663 GFLOPS, ~47% of theoretical peak</td></tr>
</tbody>
</table></div>
<p>The 47% figure is the useful one: it says how much of the machine the benchmark actually reached, not just how fast the code looked.</p>

<h2>Competition work</h2>
<p>With UCSC’s High Performance Computing Club (Not-So-Slow Slugs), I have worked across several competition systems:</p>
<ul class="article-list">
<li><strong>Winter Classical Invitational</strong> — first place against 8 other U.S. colleges on an HPE Cray cluster.</li>
<li><strong>IndySCC</strong> — built and optimized a climate emulator, a hardware simulation, and a matrix benchmark on a custom multi-node cluster, with 10,000+ Slurm/MPI parameter sweeps.</li>
<li><strong>SCC Connect ’26</strong> — ran and tuned competition workloads on a 2× NVIDIA H100 system.</li>
<li><strong>Single Board Cluster Competition</strong> — built and tuned a low-power cluster of 10 Raspberry Pis and a Jetson Nano.</li>
</ul>

<h2>Limitations</h2>
<p>The 47% of peak is an HPL result for one cluster and configuration, not a general efficiency claim; a different problem size, network, or BLAS build changes the number. The competition work is team work, and the first-place finish belongs to the team. The 400 Haydean sweeps and the 10,000+ IndySCC sweeps are parameter sweeps, not independent experiments, so they show sensitivity rather than statistical significance.</p>

<h2>The method</h2>
<p>The loop is always the same: establish a baseline, change a parameter, measure, and keep the result only if it survives a rerun. That is how the HPL sweeps reached roughly 47% of peak, and how the IndySCC workloads were tuned without guessing.</p>
<p>See the <a href="/projects/fpga">FPGA work</a> for the hardware side, or the <a href="/projects">project index</a> for everything else.</p>
<div class="link-row"><a class="text-link" href="${repos.indyScc}">IndySCC-UCSC-NSSS <span>↗</span></a><a class="text-link" href="${repos.sbcc}">SBCC 2026 UCSC <span>↗</span></a></div>
</article>`
};
