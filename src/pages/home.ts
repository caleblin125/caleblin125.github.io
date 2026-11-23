// Home page ("/") — a compact intro, the procedural nebula centerpiece, a
// selected-work list with hard numbers, and a "home strip" pointing to About.
// The selected-work rows come from src/data so project summaries do not drift.
import { postEntries } from "../data/posts";
import { projectEntries } from "../data/projects";
import { githubProfileUrl } from "./constants";
import type { Page } from "./types";

const featuredPost = postEntries.find((post) => post.id === "a-game-with-no-framebuffer");

if (!featuredPost) {
    throw new Error("The homepage selected-work list needs the VGA note");
}

const featuredWork = [
    ...projectEntries
        .filter((project) => project.featured)
        .map((project) => ({
            number: project.number,
            href: project.path ?? project.titleHref ?? "/projects",
            title: project.title,
            description: project.description,
            metric: project.metric ?? "",
            metricLabel: project.metricLabel ?? ""
        })),
    {
        number: "03",
        href: featuredPost.path,
        title: featuredPost.title.replace(/\.$/, ""),
        description: featuredPost.description,
        metric: featuredPost.metric ?? "",
        metricLabel: featuredPost.metricLabel ?? ""
    }
];

const workRows = featuredWork
    .map(
        (work) =>
            `<a class="work-row" href="${work.href}"><span class="work-number">${work.number}</span><div><h2>${work.title}</h2><p>${work.description}</p></div><span class="work-metric"><strong>${work.metric}</strong><span>${work.metricLabel}</span></span></a>`
    )
    .join("");

export const homePage: Page = {
    title: "Engineering and visual experiments.",
    eyebrow: "Caleb Lin",
    kind: "home",
    description: "Caleb Lin is a computer engineering and robotics student at UC Santa Cruz. He works on FPGA acceleration, HPC clusters, control and estimation, and visual systems that make technical results legible.",
    keywords: ["Caleb Lin", "computer engineering", "robotics", "FPGA", "HPC", "WebGL", "UC Santa Cruz"],
    content: `
            <section class="hero-grid">
                <div class="hero-copy">
                    <p class="kicker">Engineering / visual systems</p>
                    <h1>I build systems, then make them legible.</h1>
                    <p class="lede">I’m Caleb Lin, a computer engineering and robotics student at UC Santa Cruz. I work on FPGA acceleration, HPC clusters, and control and estimation systems — and I build visual tools that make the results legible.</p>
                    <div class="link-row"><a class="text-link" href="#selected-work">Selected work <span>↓</span></a><a class="text-link" href="/resume">Résumé <span>↗</span></a><a class="text-link" href="${githubProfileUrl}">GitHub <span>↗</span></a></div>
                </div>
                <div class="nebula-frame" data-nebula>
                    <div class="nebula-stage">
                        <canvas data-visualization="nebula" role="img" aria-label="A procedurally generated nebula: violet filaments and dust lanes with sparse stars."></canvas>
                        <div class="nebula-hud" aria-hidden="true"><span>Field 01 / domain-warped fBm</span><span>WebGL2 / fragment shader</span></div>
                        <p class="nebula-caption">Nebula <span>pointer parallax / seed-reproducible</span></p>
                        <div class="nebula-fallback">This field needs WebGL2. The rest of the page is unaffected.</div>
                    </div>
                    <div class="nebula-controls">
                        <label class="nebula-control">Density <input type="range" min="0" max="1" step="0.01" value="0.55" data-nebula-density></label>
                        <label class="nebula-control">Scale <input type="range" min="0.4" max="2.2" step="0.01" value="1" data-nebula-scale></label>
                        <label class="nebula-control">Palette <select data-nebula-palette><option value="violet">Violet</option><option value="ice">Ice</option><option value="ember">Ember</option></select></label>
                        <span class="nebula-seed-group"><span class="nebula-seed" data-nebula-seed aria-live="polite">seed 00000000</span><button class="nebula-reseed" type="button" data-nebula-reseed>Reseed</button></span>
                    </div>
                </div>
            </section>
            <section class="selected-work" id="selected-work">
                <div class="section-head"><p class="kicker">Selected work</p><a class="text-link" href="/projects">All projects <span>↗</span></a></div>
                <div class="work-list">${workRows}</div>
            </section>
            <section class="home-strip">
                <p>At the moment</p>
                <div><strong>Benchmarking inference and tuning clusters</strong><span>Currently researching ternary LLM inference on an Alveo U250 and data-center load forecasting, while tuning competition workloads with UCSC’s HPC team.</span></div>
                <a class="text-link" href="/about">A little more <span>↗</span></a>
            </section>`
};
