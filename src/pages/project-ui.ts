// Shared presentation helpers for project pages.
//
// Every project page opens with the same metadata block so the work period,
// technologies, and provenance read consistently. The body structure is
// deliberately conventional: Overview, Architecture, Implementation, Results,
// Analysis. Pages omit sections they cannot support rather than padding them.
import type { ProjectEntry, ProjectLink } from "../data/projects";

function escapeHtml(value: string): string {
    return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function formatDates(project: ProjectEntry): string[] {
    const dates = project.dates;

    if (!dates) {
        return [];
    }

    return [
        dates.started ? `Started ${escapeHtml(dates.started)}` : "",
        dates.measured ? `Measured ${escapeHtml(dates.measured)}` : "",
        dates.published ? `Page published ${escapeHtml(dates.published)}` : ""
    ].filter(Boolean);
}

/** Metadata shared by every project page. */
export function projectFacts(project: ProjectEntry): string {
    const dates = formatDates(project);
    const technologyItems = project.technologies.map((technology) => `<li>${escapeHtml(technology)}</li>`).join("");

    return `<dl class="project-facts">
<div><dt>Category</dt><dd>${escapeHtml(project.category)}</dd></div>
<div><dt>Work</dt><dd>${escapeHtml(project.period)}</dd></div>
<div class="project-facts-wide"><dt>Technologies</dt><dd><ul class="tech-list">${technologyItems}</ul></dd></div>
${dates.length ? `<div class="project-facts-wide"><dt>Timeline</dt><dd class="project-timeline">${dates.join("<span aria-hidden=\"true\"> / </span>")}</dd></div>` : ""}
</dl>`;
}

export function projectHeader(project: ProjectEntry, kicker: string, heading: string, lede: string, links: ProjectLink[]): string {
    const linkRow = links
        .map((link) => `<a class="text-link" href="${escapeHtml(link.href)}">${escapeHtml(link.label)} <span>↗</span></a>`)
        .join("");

    return `<header class="project-header">
<p class="kicker">${escapeHtml(kicker)}</p>
<h1>${escapeHtml(heading)}</h1>
<p class="lede">${escapeHtml(lede)}</p>
<div class="link-row">${linkRow}</div>
${projectFacts(project)}
</header>`;
}

export function projectFooter(related: ProjectLink[] = []): string {
    const links = [
        ...related,
        { label: "Project index", href: "/projects" },
        { label: "Résumé", href: "/resume" }
    ]
        .map((link) => `<a class="text-link" href="${escapeHtml(link.href)}">${escapeHtml(link.label)} <span>↗</span></a>`)
        .join("");

    return `<div class="link-row project-footer-links">${links}</div>`;
}

/** A simple, accessible label/value row for a measured result. */
export function resultRow(label: string, value: string, note: string): string {
    return `<div class="result-row"><span class="result-label">${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><span class="result-note">${escapeHtml(note)}</span></div>`;
}
