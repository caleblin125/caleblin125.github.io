// Projects index ("/projects") — the catalogue of records. Four projects with
// the most complete evidence open as plates; the rest follow as annotated
// rows, grouped by how much scope and evidence each piece carries. Rows are
// generated from src/data/projects.ts, which also supplies the project pages'
// metadata and the machine-readable representations.
import { projectEntries } from "../data/projects";
import { githubProfileUrl } from "./constants";
import type { Page } from "./types";

// Lead projects are chosen by hand: the four with the most complete evidence.
const LEAD_IDS = ["fpga", "hpc", "robotics", "scc-connect"];

const leads = LEAD_IDS.map((id) => {
    const project = projectEntries.find((entry) => entry.id === id);

    if (!project) {
        throw new Error(`Unknown lead project: ${id}`);
    }

    return project;
});

const flagship = projectEntries.filter((project) => project.group === "flagship");
const rest = flagship.filter((project) => !LEAD_IDS.includes(project.id));

const groups = [
    {
        id: "flagship",
        title: "Flagship work",
        note: "Nine systems with a measured result and a full write-up. Four open the section; the rest follow as a list.",
        projects: rest,
        leads
    },
    {
        id: "experiments",
        title: "Experiments",
        note: "Smaller studies and browser tools. Some are still building, and each one says which part is finished.",
        projects: projectEntries.filter((project) => project.group === "experiments"),
        leads: []
    },
    {
        id: "archive",
        title: "Archive",
        note: "Earlier and exploratory work kept for context rather than as a headline result.",
        projects: projectEntries.filter((project) => project.group === "archive"),
        leads: []
    }
];

function linkList(project: (typeof projectEntries)[number]): string {
    const links = project.links.map((link) => `<a href="${link.href}">${link.label}</a>`);

    if (project.demo) {
        links.push(`<a class="demo-link" href="${project.demo.href}">${project.demo.label} <span aria-hidden="true">↗</span></a>`);
    }

    return `<div class="project-links">${links.join("")}</div>`;
}

function renderRow(project: (typeof projectEntries)[number]): string {
    const title = project.titleHref ? `<a href="${project.titleHref}">${project.title}</a>` : project.title;
    const technologies = project.technologies.map((technology) => `<li>${technology}</li>`).join("");

    return `<article class="project-row">
<figure class="project-thumb"><img src="${project.image.src}" alt="${project.image.alt}" loading="lazy" decoding="async"></figure>
<div class="project-body">
<p class="work-category"><span class="work-number">${project.number}</span>${project.category}</p>
<h3>${title}</h3>
<p>${project.description}</p>
<div class="row-foot"><ul class="tech-list" aria-label="Technologies">${technologies}</ul>${linkList(project)}</div>
</div>
<p class="project-status">${project.period}</p>
</article>`;
}

const leadCards = leads
    .map((project) => {
        const title = project.titleHref ? `<a href="${project.titleHref}">${project.title}</a>` : project.title;
        const href = project.path ?? project.titleHref ?? "/projects";
        const metric = project.metric
            ? `<p class="project-lead-metric"><span class="work-label">Result</span><strong>${project.metric}</strong><span>${project.metricLabel ?? ""}</span></p>`
            : "";

        return `<article class="project-lead">
<figure class="project-thumb"><img src="${project.image.src}" alt="${project.image.alt}" loading="lazy" decoding="async"></figure>
<div class="project-body">
<p class="work-category"><span class="work-number">${project.number}</span>${project.category}</p>
<h3>${title}</h3>
<p>${project.description}</p>
${metric}
<div class="project-links"><a href="${href}">Project page <span aria-hidden="true">↗</span></a>${project.demo ? `<a class="demo-link" href="${project.demo.href}">${project.demo.label} <span aria-hidden="true">↗</span></a>` : ""}</div>
</div>
</article>`;
    })
    .join("\n");

const groupSections = groups
    .map((group) => {
        const leadSection = group.leads.length ? `<div class="project-lead-grid">${leadCards}</div>` : "";
        const count = String(group.leads.length + group.projects.length).padStart(2, "0");

        return `<section class="project-group" id="${group.id}" aria-labelledby="${group.id}-title">
<div class="group-head">
<span class="group-count">${count}</span>
<h2 id="${group.id}-title">${group.title}</h2>
<p class="group-note">${group.note}</p>
</div>
${leadSection}
<div class="project-list">
${group.projects.map(renderRow).join("\n")}
</div>
</section>`;
    })
    .join("\n            ");

const withPages = projectEntries.filter((project) => project.path).length;
const countLine = `${String(projectEntries.length).padStart(2, "0")} records / ${String(withPages).padStart(2, "0")} with their own page / grouped by scope and evidence`;

export const projectsPage: Page = {
    title: "Work and projects.",
    eyebrow: "Projects",
    kind: "index",
    section: "Projects",
    updated: "2026-11-24",
    description: "A catalogue of Caleb Lin's evolutionary simulation, FPGA, HPC and cluster competition, robotics, mechanism design, machine-learning, real-time graphics, AI, and research-software projects, grouped into flagship work, experiments, and archive.",
    keywords: ["projects", "FPGA", "HPC", "cluster competition", "robotics", "machine learning", "graphics", "AI", "research software", "Caleb Lin"],
    content: `
            <section class="page-intro"><p class="kicker">The catalogue</p><h1>Work and projects.</h1><p class="lede">Digital hardware, HPC and cluster competition, evolutionary simulation, robotics and state estimation, mechanism design, load forecasting, real-time graphics, and the computational visualizations that make the measurements legible.</p><p class="mono-note">${countLine}</p><div class="link-row"><a class="text-link" href="#flagship">Flagship work <span aria-hidden="true">↓</span></a><a class="text-link" href="#experiments">Experiments <span aria-hidden="true">↓</span></a><a class="text-link" href="/lab">Interactive lab <span aria-hidden="true">↗</span></a><a class="text-link" href="${githubProfileUrl}">GitHub <span aria-hidden="true">↗</span></a></div></section>
            ${groupSections}`
};
