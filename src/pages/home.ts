// Home page ("/") — a compact intro, the procedural nebula centerpiece, five
// selected projects with problem / contribution / technology / result, and a
// "home strip" pointing to About. All project text comes from src/data so the
// previews cannot drift from the project pages.
import { featuredProjects } from "../data/projects";
import { defaultParameters, nebulaControls } from "../nebula/controls";
import { email, githubProfileUrl } from "./constants";
import type { Page } from "./types";

const projects = featuredProjects();
const homeNebula = defaultParameters("home");

if (projects.length !== 5) {
    throw new Error(`The homepage needs exactly five featured projects; found ${projects.length}`);
}

function escapeHtml(value: string): string {
    return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const workRows = projects
    .map((project) => {
        const href = project.path ?? project.titleHref ?? "/projects";
        const technologies = project.technologies.map((technology) => `<li>${escapeHtml(technology)}</li>`).join("");

        return `<a class="work-row" href="${escapeHtml(href)}">
<span class="work-number">${escapeHtml(project.number)}</span>
<span class="work-thumb"><img src="${escapeHtml(project.image.src)}" alt="${escapeHtml(project.image.alt)}" loading="lazy" decoding="async"></span>
<div class="work-body">
<p class="work-category">${escapeHtml(project.category)}${project.demo ? ' <span class="demo-badge">Interactive</span>' : ""}</p>
<h2>${escapeHtml(project.title)}</h2>
<p class="work-problem"><strong>Problem.</strong> ${escapeHtml(project.problem)}</p>
<p class="work-contribution"><strong>Contribution.</strong> ${escapeHtml(project.contribution)}</p>
<ul class="work-tech" aria-label="Technologies">${technologies}</ul>
<span class="work-link">Full project <span aria-hidden="true">↗</span></span>
</div>
<span class="work-metric"><strong>${escapeHtml(project.metric ?? "")}</strong><span>${escapeHtml(project.metricLabel ?? "")}</span></span>
</a>`;
    })
    .join("");

export const homePage: Page = {
    title: "FPGA, HPC, and robotics engineering.",
    eyebrow: "Caleb Lin",
    kind: "home",
    updated: "2026-11-23",
    description:
        "Caleb Lin is a computer engineering and robotics student at UC Santa Cruz. He works on FPGA acceleration, HPC clusters, machine learning, control and estimation, and computational visualization systems that make technical results legible.",
    keywords: ["Caleb Lin", "computer engineering", "robotics", "FPGA", "HPC", "machine learning", "WebGL", "UC Santa Cruz"],
    content: `
            <section class="hero-grid">
                <div class="hero-copy">
                    <p class="kicker">Computer engineering + robotics / UC Santa Cruz / June 2027</p>
                    <h1>I build hardware, clusters, and robots, then measure them.</h1>
                    <p class="lede">I’m Caleb Lin, a double major in computer engineering and robotics at UC Santa Cruz. I work on FPGA acceleration, high-performance computing, and control and estimation. Every project here states what I built, what I measured, and what the number cannot tell you.</p>
                    <ul class="proof-list" aria-label="Highlights">
                        <li><strong>1st place</strong><span>Winter Classical Invitational, vs. 8 U.S. colleges</span></li>
                        <li><strong>86% of peak</strong><span>4,403.6 GFLOPS HPL at SCC Connect 2026</span></li>
                        <li><strong>3× throughput</strong><span>Top FPGA multiplier in a class of ~100</span></li>
                        <li><strong>3.95 GPA</strong><span>Two undergraduate research labs</span></li>
                    </ul>
                    <div class="link-row"><a class="text-link" href="#selected-work">Selected work <span>↓</span></a><a class="text-link" href="/lab">Interactive lab <span>↗</span></a><a class="text-link" href="/resume">Résumé <span>↗</span></a><a class="text-link" href="${githubProfileUrl}">GitHub <span>↗</span></a><a class="text-link" href="mailto:${email}">Email <span>↗</span></a></div>
                </div>
                <div class="nebula-frame" data-nebula data-nebula-variant="home">
                    <div class="nebula-stage">
                        <canvas data-visualization="nebula" role="img" aria-label="A procedurally generated nebula: sparse magenta shells and dust lanes around a dark void, with faint stars."></canvas>
                        <div class="nebula-hud" aria-hidden="true"><span>Field 01 / density + palette</span><span data-nebula-hud>2D field / 8 octaves</span></div>
                        <p class="nebula-caption">Nebula <span>seed-reproducible / six presets</span></p>
                        <div class="nebula-fallback">This field needs WebGL2. The rest of the page is unaffected.</div>
                    </div>
                    ${nebulaControls("home", homeNebula)}
                    <details class="nebula-notes">
                        <summary>How this field is generated</summary>
                        <p>The image is a fragment shader, not a video. A seeded density field is built from analytic gradient noise: six octaves of fractional Brownian motion, domain-warped and shaped with crossing ridged terms for filaments, then a five-stop palette, emission, bloom, and a sparse star layer turn density into light. The seed is an integer from 1 to 999999; the browser writes the whole look into the URL, so any frame can be reopened.</p>
                        <p>Rendering adapts by lowering the drawing buffer before it stops animating. With <code>prefers-reduced-motion</code> the animation speed is held at zero and one still frame is drawn. Without WebGL2, the text fallback remains and the rest of the page is unaffected.</p>
                        <p><a class="text-link" href="/lab/nebula">Open the full laboratory <span>↗</span></a> for the volume renderer, every parameter, and the diagnostic channels.</p>
                    </details>
                </div>
            </section>
            <section class="selected-work" id="selected-work">
                <div class="section-head"><p class="kicker">Selected work / 05</p><a class="text-link" href="/projects">All projects <span>↗</span></a></div>
                <div class="work-list">${workRows}</div>
            </section>
            <section class="method-strip" aria-label="How I work">
                <div class="method-head"><p class="kicker">Method / 04</p><p class="method-note">The same loop runs through the hardware, the clusters, and the visual work.</p></div>
                <ol class="method-steps">
                    <li><span>01</span><strong>Build</strong><p>Make the system real enough to misbehave.</p></li>
                    <li><span>02</span><strong>Instrument</strong><p>Give it a way to report what it is doing.</p></li>
                    <li><span>03</span><strong>Measure</strong><p>Run it against a baseline and keep the raw numbers.</p></li>
                    <li><span>04</span><strong>Understand</strong><p>Explain the result, including what it cannot support.</p></li>
                </ol>
            </section>
            <section class="home-strip">
                <p>At the moment</p>
                <div><strong>Benchmarking inference, tuning clusters, and forecasting load</strong><span>Currently researching ternary LLM inference on an Alveo U250, forecasting data-center electricity load, and tuning competition workloads with UCSC’s HPC team.</span></div>
                <a class="text-link" href="/about">A little more <span>↗</span></a>
            </section>`
};
