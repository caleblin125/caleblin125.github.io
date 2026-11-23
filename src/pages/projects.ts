// Projects index ("/projects") — the guided project list. Rows are generated
// from src/data/projects.ts, which also supplies the project pages' metadata
// and the machine-readable representations.
import { projectEntries } from "../data/projects";
import { githubProfileUrl } from "./constants";
import type { Page } from "./types";

const projectRows = projectEntries
    .map((project) => {
        const title = project.titleHref ? `<a href="${project.titleHref}">${project.title}</a>` : project.title;
        const links = project.links.map((link) => `<a href="${link.href}">${link.label}</a>`).join("");

        return `<article class="project-row"><div class="project-number">${project.number}</div><figure class="project-thumb"><img src="${project.image.src}" alt="${project.image.alt}" loading="lazy" decoding="async"></figure><div class="project-body"><h2>${title}</h2><p>${project.description}</p><div class="project-links">${links}</div><span class="tag">${project.tags}</span></div><div class="project-status">${project.period}</div></article>`;
    })
    .join("\n                ");

export const projectsPage: Page = {
    title: "Work and projects.",
    eyebrow: "Projects",
    kind: "index",
    section: "Projects",
    description: "A guided list of Caleb Lin's FPGA, HPC, graphics, AI, and research software projects, with measurements and technical write-ups.",
    keywords: ["projects", "FPGA", "HPC", "graphics", "AI", "research software", "Caleb Lin"],
    content: `
            <section class="page-intro"><p class="kicker">Projects</p><h1>Work and projects.</h1><p class="lede">A guided list of the things I have been building: digital hardware, high-performance computing, interactive graphics, AI-assisted learning tools, and local research software.</p><div class="link-row"><a class="text-link" href="${githubProfileUrl}">Full GitHub profile <span>↗</span></a></div></section>
            <section class="project-list">
                ${projectRows}
            </section>`
};
