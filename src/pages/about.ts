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
    content: `<section class="page-intro"><p class="kicker">About</p><h1>Caleb Lin</h1><p class="lede">Robotics Engineering and Computer Engineering at the University of California, Santa Cruz.</p></section>
<article class="article about-profile">
<section>
<h2>About</h2>
<p>I’m Caleb Lin, a double major in robotics engineering and computer engineering at the University of California, Santa Cruz, with a minor in electrical engineering. I expect to graduate in June 2027.</p>
<p>Most of my time goes to two research labs. In the Hardware Systems Collective, I benchmark and optimize ternary LLM inference on a Xilinx Alveo U250 FPGA and NVIDIA Jetson edge GPUs. In the Smart Grids and Data Analytics Lab, I build short-term data-center electricity load forecasting models and compare them with traditional baselines. Outside the labs, I run and tune clusters with UCSC’s HPC competition team.</p>
<p>I like systems that are measured carefully and made visible. That means building the thing, instrumenting it, running it against a baseline, and then explaining what the result can and cannot support. The visual experiments on this site are part of that same loop.</p>
</section>
<section>
<h2>Research Interests</h2>
<p>Hardware–software co-design, FPGA acceleration, high-performance computing and cluster benchmarking, machine learning and time-series forecasting, control and state estimation, robotics, and computational visualization.</p>
</section>
<section>
<h2>Selected Work</h2>
<ul class="article-list">
<li><strong><a href="/projects/fpga">FPGA and digital hardware</a></strong> — a class-leading Verilog multiplier, VGA and audio interfaces, and ternary LLM inference on an Alveo U250.</li>
<li><strong><a href="/projects/hpc">HPC and cluster tuning</a></strong> — administering a 4-node Slurm/MPI cluster and tuning HPL to 663 GFLOPS.</li>
<li><strong><a href="/projects/robotics">Robotics and state estimation</a></strong> — a mecanum robot that finds a goal without a map, with a sixth-order beacon receiver and a 10 ms control loop.</li>
<li><strong><a href="/projects/forecasting">Data-center load forecasting</a></strong> — short-term load models reaching 3% MAPE on a decade of 10-minute data.</li>
<li><strong><a href="/projects/treesim">TreeSim</a></strong> — an evolutionary forest simulation with a 51,755-year record and 6.11 million trees.</li>
</ul>
<p><a href="/projects">All projects</a> / <a href="/lab">Interactive lab</a> / <a href="/resume">Résumé</a></p>
</section>
<section>
<h2>External Profiles</h2>
<p>The same name and links appear on GitHub and LinkedIn. This site is the canonical home for the work.</p>
<div class="link-row"><a class="text-link" href="${githubProfileUrl}">GitHub <span>↗</span></a><a class="text-link" href="${linkedinUrl}">LinkedIn <span>↗</span></a><a class="text-link" href="/">caleblin125.github.io <span>↗</span></a><a class="text-link" href="mailto:${email}">Email <span>↗</span></a></div>
</section>
</article>`
};
