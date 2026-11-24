// Home page ("/") — a compact intro, the procedural nebula centerpiece, the
// four results that frame the work, five selected projects with problem /
// contribution / approach / result, the method behind them, and the latest
// notes. All project and note text comes from src/data so the previews cannot
// drift from the pages they summarise.
import { featuredProjects } from "../data/projects";
import { postEntries } from "../data/posts";
import { defaultParameters, nebulaControls } from "../nebula/controls";
import { githubProfileUrl } from "./constants";
import type { Page } from "./types";

const projects = featuredProjects();
const homeNebula = defaultParameters("home");

if (projects.length !== 5) {
    throw new Error(`The homepage needs exactly five featured projects; found ${projects.length}`);
}

const leadProjects = projects.slice(0, 2);
const tailProjects = projects.slice(2);
const latestNotes = postEntries.slice(0, 3);

function escapeHtml(value: string): string {
    return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function approachList(project: (typeof projects)[number]): string {
    const technologies = project.technologies.map((technology) => `<li>${escapeHtml(technology)}</li>`).join("");

    return `<div class="work-approach"><span class="work-label">Approach</span><ul class="work-tech" aria-label="Approach">${technologies}</ul></div>`;
}

function metric(project: (typeof projects)[number]): string {
    return `<span class="work-metric"><span class="work-label">Result</span><strong>${escapeHtml(project.metric ?? "")}</strong><span class="work-metric-note">${escapeHtml(project.metricLabel ?? "")}</span></span>`;
}

function category(project: (typeof projects)[number]): string {
    const badge = project.demo ? '<span class="demo-badge">Interactive</span>' : "";

    return `<p class="work-category"><span class="work-number">${escapeHtml(project.number)}</span>${escapeHtml(project.category)}${badge}</p>`;
}

const leadRows = leadProjects
    .map((project) => {
        const href = project.path ?? project.titleHref ?? "/projects";

        return `<a class="work-lead" href="${escapeHtml(href)}">
<span class="work-thumb"><img src="${escapeHtml(project.image.src)}" alt="${escapeHtml(project.image.alt)}" loading="lazy" decoding="async"></span>
<div class="work-body">
${category(project)}
<h3>${escapeHtml(project.title)}</h3>
<p class="work-problem"><strong>Problem.</strong> ${escapeHtml(project.problem)}</p>
<p class="work-contribution"><strong>Contribution.</strong> ${escapeHtml(project.contribution)}</p>
${approachList(project)}
<div class="work-foot">
${metric(project)}
<span class="work-link">Full project <span aria-hidden="true">↗</span></span>
</div>
</div>
</a>`;
    })
    .join("\n");

const tailRows = tailProjects
    .map((project) => {
        const href = project.path ?? project.titleHref ?? "/projects";

        return `<a class="work-row" href="${escapeHtml(href)}">
<span class="work-thumb"><img src="${escapeHtml(project.image.src)}" alt="${escapeHtml(project.image.alt)}" loading="lazy" decoding="async"></span>
<div class="work-body">
${category(project)}
<h3>${escapeHtml(project.title)}</h3>
<p class="work-problem"><strong>Problem.</strong> ${escapeHtml(project.problem)}</p>
<p class="work-contribution"><strong>Contribution.</strong> ${escapeHtml(project.contribution)}</p>
${approachList(project)}
</div>
<div class="work-metric">
<span class="work-label">Result</span>
<strong>${escapeHtml(project.metric ?? "")}</strong>
<span class="work-metric-note">${escapeHtml(project.metricLabel ?? "")}</span>
<span class="work-link">Full project <span aria-hidden="true">↗</span></span>
</div>
</a>`;
    })
    .join("\n");

const noteRows = latestNotes
    .map(
        (post) => `<a class="note-item" href="${escapeHtml(post.path)}">
<span class="post-date">${escapeHtml(post.dateDisplay)}</span>
<h3>${escapeHtml(post.title)}</h3>
<p>${escapeHtml(post.description)}</p>
<span class="work-link">Read note <span aria-hidden="true">↗</span></span>
</a>`
    )
    .join("\n");

export const homePage: Page = {
    title: "Robotics & Computer Engineering at UCSC",
    eyebrow: "Caleb Lin",
    kind: "home",
    updated: "2026-11-23",
    description:
        "Caleb Lin is a robotics engineering and computer engineering student at UC Santa Cruz. He builds FPGA accelerators, HPC clusters, robots, and computational visualizations.",
    keywords: ["Caleb Lin", "robotics engineering", "computer engineering", "FPGA", "HPC", "machine learning", "WebGL", "University of California, Santa Cruz"],
    content: `
            <section class="hero-grid">
                <div class="hero-copy">
                    <p class="kicker">Computer engineering + robotics / UC Santa Cruz / June 2027</p>
                    <h1>I build hardware, clusters, and robots, then measure them.</h1>
                    <p class="lede">I’m Caleb Lin, a double major in robotics engineering and computer engineering at the University of California, Santa Cruz. I work on FPGA acceleration, high-performance computing, and control and estimation. Every project here states what I built, what I measured, and what the number cannot tell you.</p>
                    <div class="link-row"><a class="text-link" href="#selected-work">Selected work <span aria-hidden="true">↓</span></a><a class="text-link" href="/lab">Interactive lab <span aria-hidden="true">↗</span></a><a class="text-link" href="/resume">Résumé <span aria-hidden="true">↗</span></a><a class="text-link" href="${githubProfileUrl}">GitHub <span aria-hidden="true">↗</span></a></div>
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
                        <p><a class="text-link" href="/lab/nebula">Open the full laboratory <span aria-hidden="true">↗</span></a> for the volume renderer, every parameter, and the diagnostic channels.</p>
                    </details>
                </div>
            </section>
            <ul class="signal-band" aria-label="Highlights">
                <li><strong>1st place</strong><span>Winter Classical Invitational, vs. 8 U.S. colleges</span></li>
                <li><strong>86% of peak</strong><span>4,403.6 GFLOPS HPL at SCC Connect 2026</span></li>
                <li><strong>3× throughput</strong><span>Top FPGA multiplier in a class of ~100</span></li>
                <li><strong>3.95 GPA</strong><span>Two undergraduate research labs</span></li>
            </ul>
            <section class="selected-work" id="selected-work">
                <header class="section-head">
                    <p class="kicker">Selected work / 05</p>
                    <h2 class="section-title">Five systems, each with a number.</h2>
                    <p class="section-note">Each entry names the constraint, the part I built, the approach, and the result — including what the result cannot support.</p>
                    <a class="text-link" href="/projects">All projects <span aria-hidden="true">↗</span></a>
                </header>
                <div class="work-leads">${leadRows}</div>
                <div class="work-list">${tailRows}</div>
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
            <section class="notes-strip">
                <header class="section-head">
                    <p class="kicker">Writing / 05</p>
                    <h2 class="section-title">Notes from inside the work.</h2>
                    <p class="section-note">Longer explanations of the measurements, the surprises, and the parts that did not work the first time.</p>
                    <a class="text-link" href="/blog">All notes <span aria-hidden="true">↗</span></a>
                </header>
                <div class="notes-list">${noteRows}</div>
            </section>
            <section class="home-strip">
                <p>At the moment</p>
                <div><strong>Benchmarking inference, tuning clusters, and forecasting load</strong><span>Currently researching ternary LLM inference on an Alveo U250, forecasting data-center electricity load, and tuning competition workloads with UCSC’s HPC team.</span></div>
                <a class="text-link" href="/about">A little more <span aria-hidden="true">↗</span></a>
            </section>`
};
