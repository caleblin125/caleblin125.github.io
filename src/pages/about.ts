// About page ("/about") — short bio with an aside about current interests.
import { githubProfileUrl } from "./constants";
import type { Page } from "./types";

export const aboutPage: Page = {
    title: "A little about me.",
    eyebrow: "About",
    content: `<section class="page-intro"><p class="kicker">About</p><h1>A little about me.</h1><p class="lede">I like systems that are measured carefully and made visible.</p></section><section class="about-grid"><div><p>I’m Caleb Lin. I’m a computer engineering and robotics student at UC Santa Cruz, interested in digital hardware, high-performance computing, control and estimation, and interfaces that give you something to play with instead of hiding the interesting parts.</p><p>A person may first perceive this site as a visual experiment because the moving canvas is the loudest thing on the page. I want that first impression to invite curiosity, then quickly point to the practical work behind it: FPGA designs, cluster benchmarks, forecasting models, and embedded systems.</p><p>The one-page summary is on the <a href="/resume">résumé page</a>, and the fuller code history lives on <a href="${githubProfileUrl}">GitHub</a>.</p></div><aside><p class="kicker">Now</p><p>Researching ternary LLM inference on an Alveo U250, forecasting data-center load, and tuning competition workloads with UCSC’s HPC team.</p><p class="kicker">Interests</p><p>Hardware-software co-design, real-time control, optimization, and visual systems.</p></aside></section>`
};
