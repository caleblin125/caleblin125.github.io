// About page ("/about") — the substantive biography, research interests,
// selected work, and the external profiles that share the same identity.
import { email, githubProfileUrl, linkedinUrl } from "./constants";
import type { Page } from "./types";

export const aboutPage: Page = {
    title: "About",
    eyebrow: "About",
    kind: "profile",
    section: "About",
    description:
        "Caleb Lin is a robotics engineering and computer engineering student at the University of California, Santa Cruz. His work spans FPGA acceleration, HPC, control, and visualization.",
    keywords: [
        "Caleb Lin",
        "about",
        "robotics engineering",
        "computer engineering",
        "University of California, Santa Cruz",
        "FPGA",
        "HPC",
        "control systems"
    ],
    content: `<section class="page-intro"><p class="kicker">About</p><h1>Caleb Lin</h1><p class="lede">Robotics and computer engineering at UC Santa Cruz, graduating June 2027. Research in FPGA inference and load forecasting; cluster competitions with UCSC’s HPC team.</p><div class="link-row"><a class="text-link" href="/resume">Résumé <span aria-hidden="true">↗</span></a><a class="text-link" href="/projects">All projects <span aria-hidden="true">↗</span></a><a class="text-link" href="mailto:${email}">Email <span aria-hidden="true">↗</span></a></div></section>
<div class="profile-layout">
<article class="profile-main about-profile">
<section>
<h2>About</h2>
<p>I’m Caleb Lin, a double major in robotics engineering and computer engineering at the University of California, Santa Cruz, with a minor in electrical engineering. I expect to graduate in June 2027.</p>
<p>Most of my time goes to two research labs. In the Hardware Systems Collective, I benchmark and optimize ternary LLM inference on a Xilinx Alveo U250 FPGA and NVIDIA Jetson edge GPUs. In the Smart Grids and Data Analytics Lab, I build short-term data-center electricity load forecasting models and compare them with traditional baselines. Outside the labs, I run and tune clusters with UCSC’s HPC competition team.</p>
<p>The thread through all of it is the point where software meets a physical limit: a timing contract on an FPGA, a power cap on a CPU socket, a mecanum wheel that slips, a printer’s dot grid. I like finding that limit, measuring how close a design gets to it, and explaining the gap. The interactive pieces on this site come from the same habit: if I can let you change the parameter, I would rather do that than describe it.</p>
</section>
<section>
<h2>Research Interests</h2>
<p>Hardware–software co-design, FPGA acceleration, high-performance computing and cluster benchmarking, machine learning and time-series forecasting, control and state estimation, robotics, and computational visualization.</p>
</section>
<section>
<h2>Selected Work</h2>
<ul class="article-list">
<li><strong><a href="/projects/fpga">FPGA and digital hardware</a></strong> — a class-leading Verilog multiplier, VGA and audio interfaces, and ternary LLM inference on an Alveo U250.</li>
<li><strong><a href="/projects/hpc">HPC and cluster tuning</a></strong> — first place at the Winter Classical Invitational, and a 4-node Slurm/MPI cluster tuned to 663 GFLOPS on HPL.</li>
<li><strong><a href="/projects/scc-connect">SCC Connect 2026</a></strong> — 4,403.6 GFLOPS on CPU HPL, 86% of the node’s peak, with the run logs behind every number.</li>
<li><strong><a href="/projects/robotics">Robotics and state estimation</a></strong> — a mecanum robot that finds a goal without a map, with a sixth-order beacon receiver and a 10 ms control loop.</li>
<li><strong><a href="/projects/forecasting">Data-center load forecasting</a></strong> — short-term load models reaching 3% MAPE on a decade of 10-minute data.</li>
<li><strong><a href="/projects/treesim">TreeSim</a></strong> — an evolutionary forest simulation in C++ and MPI; one 235-year run grew to 51,755 trees and 6.11 million limbs.</li>
</ul>
</section>
<section>
<h2>Contact</h2>
<p>Email is the fastest way to reach me. Code for most of these projects is on GitHub.</p>
<div class="link-row"><a class="text-link" href="mailto:${email}">Email <span aria-hidden="true">↗</span></a><a class="text-link" href="${githubProfileUrl}">GitHub <span aria-hidden="true">↗</span></a><a class="text-link" href="${linkedinUrl}">LinkedIn <span aria-hidden="true">↗</span></a></div>
</section>
</article>
<aside class="profile-side" aria-label="At a glance">
<dl>
<div><dt>Affiliation</dt><dd>University of California, Santa Cruz</dd></div>
<div><dt>Degrees</dt><dd>B.S. Robotics Engineering<br>B.S. Computer Engineering</dd></div>
<div><dt>Minor</dt><dd>Electrical Engineering</dd></div>
<div><dt>Graduating</dt><dd>June 2027</dd></div>
<div><dt>Labs</dt><dd>Hardware Systems Collective<br>Smart Grids and Data Analytics Lab</dd></div>
<div><dt>Also</dt><dd>UCSC HPC competition team</dd></div>
<div><dt>Based in</dt><dd>Santa Cruz, California</dd></div>
</dl>
<div class="link-row"><a class="text-link" href="${githubProfileUrl}">GitHub <span aria-hidden="true">↗</span></a><a class="text-link" href="${linkedinUrl}">LinkedIn <span aria-hidden="true">↗</span></a><a class="text-link" href="mailto:${email}">Email <span aria-hidden="true">↗</span></a></div>
</aside>
</div>`
};
