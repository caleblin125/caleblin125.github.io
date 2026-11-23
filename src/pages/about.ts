// About page ("/about") — short bio with an aside about current interests.
import { githubProfileUrl } from "./constants";
import type { Page } from "./types";

export const aboutPage: Page = {
    title: "A little about me.",
    eyebrow: "About",
    kind: "page",
    section: "About",
    description: "About Caleb Lin: a computer engineering and robotics student at UC Santa Cruz interested in digital hardware, HPC, control, and interfaces that make systems visible.",
    keywords: ["Caleb Lin", "about", "computer engineering", "robotics", "FPGA", "HPC", "control systems"],
    content: `<section class="page-intro"><p class="kicker">About</p><h1>A little about me.</h1><p class="lede">I like systems that are measured carefully and made visible.</p></section><section class="about-grid"><div><p>I’m Caleb Lin. I’m a computer engineering and robotics student at UC Santa Cruz, interested in digital hardware, high-performance computing, control and estimation, and interfaces that give you something to play with instead of hiding the interesting parts.</p><p>Most of my time goes to two research labs: benchmarking ternary LLM inference on an FPGA and edge GPUs in the Hardware Systems Collective, and forecasting data-center electricity load in the Smart Grids and Data Analytics Lab. Outside them, I run and tune clusters with UCSC’s HPC competition team. The visual experiments on this site are how I check that I understand a system well enough to show it.</p><p>The one-page summary is on the <a href="/resume">résumé page</a>, and the fuller code history lives on <a href="${githubProfileUrl}">GitHub</a>.</p></div><aside><p class="kicker">Now</p><p>Researching ternary LLM inference on an Alveo U250, forecasting data-center load, and tuning competition workloads with UCSC’s HPC team.</p><p class="kicker">Interests</p><p>Hardware-software co-design, real-time control, optimization, and visual systems.</p></aside></section>`
};
