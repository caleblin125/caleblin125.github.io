// Home page ("/") — a work-first record. The page opens with a short
// identification strip, then the featured plates taken from the projects,
// one live field, the convention every record follows, the method, and the
// most recent notes. All text comes from src/data so the previews cannot
// drift from the pages they summarise.
import { featuredProjects } from "../data/projects";
import { postEntries } from "../data/posts";
import { defaultParameters, nebulaControls } from "../nebula/controls";
import { githubProfileUrl } from "./constants";
import type { Page } from "./types";

// Display order for the featured plates. The first plate is the widest, so it
// goes to the project with the strongest picture of real hardware.
const HOME_ORDER = ["robotics", "hpc", "fpga", "forecasting", "treesim"];

const projects = featuredProjects().sort((a, b) => HOME_ORDER.indexOf(a.id) - HOME_ORDER.indexOf(b.id));
const homeNebula = defaultParameters("home");

const latestNotes = postEntries.slice(0, 3);

function escapeHtml(value: string): string {
    return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// A 12-column board: the first two plates share a row as 7 + 5, then plates
// run three to a row. A short trailing row splits evenly (6 + 6) or closes as
// one full-width plate (12), so the board stays balanced as featured entries
// are added or removed. Spans are data, not nth-child rules.
function plateSpans(count: number): number[] {
    if (count <= 0) return [];
    if (count === 1) return [12];
    if (count === 2) return [7, 5];

    const spans = [7, 5];
    const rest = count - 2;
    for (let row = 0; row < Math.floor(rest / 3); row++) spans.push(4, 4, 4);
    const tail = rest % 3;
    if (tail === 1) spans.push(12);
    else if (tail === 2) spans.push(6, 6);
    return spans;
}

const spans = plateSpans(projects.length);

const plates = projects
    .map((project, index) => {
        const href = project.path ?? project.titleHref ?? "/projects";
        const metric = project.metric
            ? `<span class="plate-metric">${escapeHtml(project.metric)}${project.metricLabel ? ` — ${escapeHtml(project.metricLabel)}` : ""}</span>`
            : "";

        return `<a class="plate" data-span="${spans[index]}" href="${escapeHtml(href)}">
<span class="work-thumb"><img src="${escapeHtml(project.image.src)}" alt="${escapeHtml(project.image.alt)}" loading="lazy" decoding="async"></span>
<div class="plate-cap">
<span class="plate-no">${escapeHtml(project.number)}</span>
<h3>${escapeHtml(project.title)}</h3>
${metric}
</div>
<div class="plate-meta"><span>${escapeHtml(project.category)}</span><span>${escapeHtml(project.period)}</span></div>
</a>`;
    })
    .join("\n");

const noteRows = latestNotes
    .map(
        (post) => `<a class="note-row" href="${escapeHtml(post.path)}">
<span class="post-date">${escapeHtml(post.dateDisplay)}</span>
<h3>${escapeHtml(post.title)}</h3>
<p>${escapeHtml(post.description)}</p>
<span class="note-arrow" aria-hidden="true">↗</span>
</a>`
    )
    .join("\n");

export const homePage: Page = {
    title: "Robotics & Computer Engineering at UCSC",
    eyebrow: "Caleb Lin",
    kind: "home",
    updated: "2026-11-24",
    description:
        "Caleb Lin is a robotics engineering and computer engineering student at UC Santa Cruz. He builds FPGA accelerators, HPC clusters, robots, and computational visualizations.",
    keywords: ["Caleb Lin", "robotics engineering", "computer engineering", "FPGA", "HPC", "machine learning", "WebGL", "University of California, Santa Cruz"],
    content: `
            <section class="atlas-top">
                <p class="atlas-name"><span>Santa Cruz, California</span></p>
                <h1 class="atlas-claim">I build hardware, clusters, and robots, then measure them.</h1>
                <p class="atlas-lede">I'm a robotics and computer engineering double major at the University of California, Santa Cruz, graduating June 2027. I do research on FPGA inference and data-center load forecasting, compete in cluster competitions with UCSC's HPC team, and build robots. Each project page covers the problem, the part that was mine, and the measured result.</p>
                <div class="atlas-links"><a class="text-link" href="#selected-work">Selected work <span aria-hidden="true">↓</span></a><a class="text-link" href="/lab">Interactive lab <span aria-hidden="true">↗</span></a><a class="text-link" href="/resume">Résumé <span aria-hidden="true">↗</span></a><a class="text-link" href="${githubProfileUrl}">GitHub <span aria-hidden="true">↗</span></a></div>
            </section>
            <section class="atlas-plates" id="selected-work" aria-label="Selected work">
                ${plates}
            </section>
            <section class="live-plate" aria-label="Live field">
                <div class="live-head">
                    <p class="kicker">Field 01 / live</p>
                    <p>A seeded density field drawn in a fragment shader. Change the seed, palette, or structure; the address keeps the frame.</p>
                </div>
                <div class="nebula-frame" data-nebula data-nebula-variant="home">
                    <div class="nebula-stage">
                        <img class="nebula-poster" src="/nebula/home-poster.jpg" alt="" aria-hidden="true" width="2464" height="939" decoding="async">
                        <canvas data-visualization="nebula" role="img" aria-label="A procedurally generated nebula: sparse shells and dust lanes around a dark void, with faint stars."></canvas>
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
            <ol class="method" aria-label="How the work is done">
                <li><span class="step-no">01</span><strong>Build</strong><p>Make the system real enough to misbehave.</p></li>
                <li><span class="step-no">02</span><strong>Instrument</strong><p>Give it a way to report what it is doing.</p></li>
                <li><span class="step-no">03</span><strong>Measure</strong><p>Run it against a baseline and keep the raw numbers.</p></li>
                <li><span class="step-no">04</span><strong>Understand</strong><p>Explain the result, including what it cannot support.</p></li>
            </ol>
            <section class="home-notes" aria-labelledby="notes-title">
                <header class="section-head">
                    <h2 class="section-title" id="notes-title">Notes</h2>
                    <p class="section-note">Longer write-ups: how a project works, what broke, and what I would change.</p>
                    <a class="text-link" href="/blog">All notes <span aria-hidden="true">↗</span></a>
                </header>
                <div class="note-list">${noteRows}</div>
            </section>
            <section class="at-the-moment" aria-label="At the moment">
                <p class="kicker">At the moment</p>
                <p>Researching ternary LLM inference on an Alveo U250, forecasting data-center load, and tuning competition workloads with UCSC's HPC team — most recently 4,403.6 GFLOPS at 86% of peak in SCC Connect 2026.</p>
            </section>`
};
