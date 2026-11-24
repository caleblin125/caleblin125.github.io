// Projects index ("/projects") — the guided project list. The strongest four
// projects open the page as image-led cards; the rest of the record follows as
// compact rows, grouped by how much scope and evidence each piece carries.
// Rows are generated from src/data/projects.ts, which also supplies the project
// pages' metadata and the machine-readable representations.
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
        kicker: "Engineering record",
        title: "Flagship work",
        note: "Nine systems with a measured result and a full write-up. Four open the section; the rest follow as a list.",
        projects: rest,
        leads
    },
    {
        id: "experiments",
        kicker: "Experiments",
        title: "Experiments",
        note: "Smaller studies and browser tools. Some are still building, and each one says which part is finished.",
        projects: projectEntries.filter((project) => project.group === "experiments"),
        leads: []
    },
    {
        id: "archive",
        kicker: "Archive",
        title: "Archive",
        note: "Earlier and exploratory work kept for context rather than as a headline result.",
        projects: projectEntries.filter((project) => project.group === "archive"),
        leads: []
    }
];

function renderProject(project: (typeof projectEntries)[number]): string {
    const title = project.titleHref ? `<a href="${project.titleHref}">${project.title}</a>` : project.title;
    const linkList = project.demo
        ? [...project.links.map((link) => ({ ...link, demo: false })), { label: `${project.demo.label} ↗`, href: project.demo.href, demo: true }]
        : project.links.map((link) => ({ ...link, demo: false }));
    const links = linkList.map((link) => `<a class="${link.demo ? "demo-link" : ""}" href="${link.href}">${link.label}</a>`).join("");
    const technologies = project.technologies.map((technology) => `<li>${technology}</li>`).join("");
    const demoBadge = project.demo ? `<span class="demo-badge">Interactive</span>` : "";

    return `<article class="project-row"><div class="project-number">${project.number}</div><figure class="project-thumb"><img src="${project.image.src}" alt="${project.image.alt}" loading="lazy" decoding="async"></figure><div class="project-body"><p class="work-category">${project.category}${demoBadge}</p><h3>${title}</h3><p>${project.description}</p><div class="project-links">${links}</div><ul class="tech-list project-tech" aria-label="Technologies">${technologies}</ul></div><div class="project-status">${project.period}</div></article>`;
}

const leadCards = leads
    .map((project) => {
        const title = project.titleHref ? `<a href="${project.titleHref}">${project.title}</a>` : project.title;
        const href = project.path ?? project.titleHref ?? "/projects";
        const metric = project.metric
            ? `<p class="project-lead-metric"><span class="work-label">Result</span><strong>${project.metric}</strong><span>${project.metricLabel ?? ""}</span></p>`
            : "";
        const demoBadge = project.demo ? `<span class="demo-badge">Interactive</span>` : "";

        return `<article class="project-row project-row-lead">
<figure class="project-thumb"><img src="${project.image.src}" alt="${project.image.alt}" loading="lazy" decoding="async"></figure>
<div class="project-body"><p class="work-category"><span class="work-number">${project.number}</span>${project.category}${demoBadge}</p><h3>${title}</h3><p>${project.description}</p>${metric}<div class="project-links"><a href="${href}">Project page ↗</a>${project.demo ? `<a class="demo-link" href="${project.demo.href}">${project.demo.label} ↗</a>` : ""}</div></div>
</article>`;
    })
    .join("\n");

const groupSections = groups
    .map((group) => {
        const leadSection = group.leads.length ? `<div class="project-lead-grid">${leadCards}</div>` : "";
        const count = String(group.leads.length + group.projects.length).padStart(2, "0");

        return `<section class="project-group" id="${group.id}" aria-labelledby="${group.id}-title">
<div class="group-head">
<p class="kicker">${group.kicker} / ${count}</p>
<h2 id="${group.id}-title">${group.title}</h2>
<p class="group-note">${group.note}</p>
</div>
${leadSection}
<div class="project-list">
${group.projects.map(renderProject).join("\n")}
</div>
</section>`;
    })
    .join("\n            ");

const withPages = projectEntries.filter((project) => project.path).length;
const projectCountLine = `${projectEntries.length} projects / ${withPages} with their own page / grouped by scope and evidence`;

export const projectsPage: Page = {
    title: "Work and projects.",
    eyebrow: "Projects",
    kind: "index",
    section: "Projects",
    updated: "2026-11-23",
    description: "A guided list of Caleb Lin's evolutionary simulation, FPGA, HPC and cluster competition, robotics, mechanism design, machine-learning, real-time graphics, AI, and research-software projects, grouped into flagship work, experiments, and archive.",
    keywords: ["projects", "FPGA", "HPC", "cluster competition", "robotics", "machine learning", "graphics", "AI", "research software", "Caleb Lin"],
    content: `
            <section class="page-intro"><p class="kicker">Projects</p><h1>Work and projects.</h1><p class="lede">Everything I have been building: digital hardware, HPC and cluster competition, evolutionary simulation, robotics and state estimation, mechanism design, load forecasting, real-time graphics and computational visualization, AI-assisted learning tools, and local research software.</p><p class="mono-note">${projectCountLine}</p><div class="link-row"><a class="text-link" href="#flagship">Flagship work <span aria-hidden="true">↓</span></a><a class="text-link" href="#experiments">Experiments <span aria-hidden="true">↓</span></a><a class="text-link" href="/lab">Interactive lab <span aria-hidden="true">↗</span></a><a class="text-link" href="${githubProfileUrl}">Full GitHub profile <span aria-hidden="true">↗</span></a></div></section>
            ${groupSections}`
};
