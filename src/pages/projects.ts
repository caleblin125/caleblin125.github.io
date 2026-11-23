// Projects index ("/projects") — the guided project list, grouped by how much
// evidence and scope each piece carries. Rows are generated from
// src/data/projects.ts, which also supplies the project pages' metadata and the
// machine-readable representations.
import { projectEntries } from "../data/projects";
import { githubProfileUrl } from "./constants";
import type { Page } from "./types";

const groups = [
    {
        id: "flagship",
        kicker: "Selected work",
        title: "Flagship work",
        note: "Projects with a measured result and a full write-up, most with a live model or benchmark explorer.",
        projects: projectEntries.filter((project) => project.group === "flagship")
    },
    {
        id: "experiments",
        kicker: "Experiments",
        title: "Experiments",
        note: "Smaller studies and browser tools. Some are still building, and each one says which part is finished.",
        projects: projectEntries.filter((project) => project.group === "experiments")
    },
    {
        id: "archive",
        kicker: "Archive",
        title: "Archive",
        note: "Earlier and exploratory work kept for context rather than as a headline result.",
        projects: projectEntries.filter((project) => project.group === "archive")
    }
];

function renderProject(project: (typeof projectEntries)[number]): string {
    const title = project.titleHref ? `<a href="${project.titleHref}">${project.title}</a>` : project.title;
    const links = [
        ...project.links.map((link) => `<a href="${link.href}">${link.label}</a>`),
        project.demo ? `<a class="demo-link" href="${project.demo.href}">${project.demo.label} ↗</a>` : ""
    ]
        .filter(Boolean)
        .join("");
    const technologies = project.technologies.map((technology) => `<li>${technology}</li>`).join("");
    const demoBadge = project.demo ? `<span class="demo-badge">Interactive</span>` : "";

    return `<article class="project-row"><div class="project-number">${project.number}</div><figure class="project-thumb"><img src="${project.image.src}" alt="${project.image.alt}" loading="lazy" decoding="async"></figure><div class="project-body"><p class="work-category">${project.category}${demoBadge}</p><h3>${title}</h3><p>${project.description}</p><div class="project-links">${links}</div><ul class="tech-list project-tech" aria-label="Technologies">${technologies}</ul></div><div class="project-status">${project.period}</div></article>`;
}

const groupSections = groups
    .map(
        (group) => `<section class="project-group" id="${group.id}" aria-labelledby="${group.id}-title">
<div class="group-head">
<p class="kicker">${group.kicker} / ${String(group.projects.length).padStart(2, "0")}</p>
<h2 id="${group.id}-title">${group.title}</h2>
<p class="group-note">${group.note}</p>
</div>
<div class="project-list">
${group.projects.map(renderProject).join("\n")}
</div>
</section>`
    )
    .join("\n            ");

export const projectsPage: Page = {
    title: "Work and projects.",
    eyebrow: "Projects",
    kind: "index",
    section: "Projects",
    updated: "2026-11-23",
    description: "A guided list of Caleb Lin's evolutionary simulation, FPGA, HPC and cluster competition, robotics, machine-learning, graphics, AI, and research-software projects, grouped into flagship work, experiments, and archive.",
    keywords: ["projects", "FPGA", "HPC", "cluster competition", "robotics", "machine learning", "graphics", "AI", "research software", "Caleb Lin"],
    content: `
            <section class="page-intro"><p class="kicker">Projects</p><h1>Work and projects.</h1><p class="lede">A guided list of the things I have been building: digital hardware, high-performance computing and cluster competition, evolutionary simulation, robotics and state estimation, machine-learning forecasting, computational visualization, AI-assisted learning tools, and local research software. The list is grouped by scope and evidence rather than by year.</p><div class="link-row"><a class="text-link" href="${githubProfileUrl}">Full GitHub profile <span>↗</span></a><a class="text-link" href="/lab">Interactive lab <span>↗</span></a><a class="text-link" href="/lab/nebula">Nebula laboratory <span>↗</span></a></div></section>
            ${groupSections}`
};
