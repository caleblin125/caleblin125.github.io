// Shared page shell and metadata. Both src/main.ts (the live SPA/dev renderer)
// and scripts/generate-site.ts (the static build) call these functions so the
// visible document and the pre-rendered one cannot drift.
import { PERSON_DESCRIPTION, PERSON_NAME, SITE_IMAGE, SITE_IMAGE_ALT, SITE_IMAGE_HEIGHT, SITE_IMAGE_WIDTH } from "./identity";
import { email, githubProfileUrl, linkedinUrl } from "./pages/constants";
import type { Page } from "./pages/types";

export const SITE_URL = "https://caleblin125.github.io";
export const SITE_NAME = PERSON_NAME;
export const SITE_TITLE = "Caleb Lin — Robotics & Computer Engineering at UCSC";
export const SITE_DESCRIPTION =
    "Caleb Lin is a robotics engineering and computer engineering student at UC Santa Cruz. He builds FPGA accelerators, HPC clusters, robots, and computational visualizations.";
export const AUTHOR_DESCRIPTION = PERSON_DESCRIPTION;
export const SITE_UPDATED = "2026-11-23";

export { SITE_IMAGE, SITE_IMAGE_ALT, SITE_IMAGE_HEIGHT, SITE_IMAGE_WIDTH };

export const navItems: Record<string, string> = {
    "/projects": "Projects",
    "/lab": "Lab",
    "/resume": "Résumé",
    "/about": "About",
    "/blog": "Blog"
};

export type PageMeta = {
    title: string;
    description: string;
    canonical: string;
    robots: string;
    ogType: "website" | "article";
    image: string;
    imageAlt: string;
    imageWidth: number;
    imageHeight: number;
    twitterCard: "summary" | "summary_large_image";
    markdown: string;
    publishedTime?: string;
};

/** Normalize a browser pathname to the keys used in the `pages` record. */
export function normalizePath(pathname: string): string {
    const withoutQuery = pathname.split(/[?#]/, 1)[0] ?? "/";
    const withoutIndex = withoutQuery.replace(/\/index\.html$/, "/");
    const normalized = withoutIndex.replace(/\/+$/, "");
    return normalized || "/";
}

/** Canonical URLs use a trailing slash for every directory-style route. */
export function canonicalUrl(path: string): string {
    const normalized = normalizePath(path);

    if (normalized === "/") {
        return `${SITE_URL}/`;
    }

    return `${SITE_URL}${normalized}/`;
}

/** Public Markdown representation of a page. */
export function markdownPath(path: string): string {
    const normalized = normalizePath(path);
    return normalized === "/" ? "/index.md" : `${normalized}.md`;
}

export function documentTitle(page: Page): string {
    return `Caleb Lin — ${page.title.replace(/\.$/, "")}`;
}

export function pageMeta(page: Page, path: string, isNotFound: boolean): PageMeta {
    return {
        title: documentTitle(page),
        description: page.description ?? SITE_DESCRIPTION,
        canonical: canonicalUrl(path),
        robots: isNotFound ? "noindex, nofollow" : "index, follow, max-image-preview:large",
        ogType: page.kind === "post" ? "article" : "website",
        image: `${SITE_URL}${SITE_IMAGE}`,
        imageAlt: SITE_IMAGE_ALT,
        imageWidth: SITE_IMAGE_WIDTH,
        imageHeight: SITE_IMAGE_HEIGHT,
        twitterCard: "summary_large_image",
        markdown: markdownPath(path),
        publishedTime: page.date
    };
}

export function renderHeader(_page: Page, path: string, isNotFound: boolean): string {
    const nav = Object.entries(navItems)
        .map(([href, label]) => {
            const inSection = !isNotFound && (path === href || path.startsWith(`${href}/`));
            const current = inSection ? (path === href ? ' aria-current="page"' : ' aria-current="true"') : "";
            return `<a href="${href}"${inSection ? ` class="active"${current}` : ""}>${label}</a>`;
        })
        .join("");

    return `<header class="site-header"><a class="brand" href="/" aria-label="Caleb Lin, home"><span class="brand-name">Caleb Lin</span></a><nav aria-label="Primary">${nav}</nav><span class="header-note">UC Santa Cruz / 2027</span></header>`;
}

export function renderFooter(): string {
    return `<footer class="site-footer"><span>© 2026 Caleb Lin</span><span class="footer-links"><a href="${githubProfileUrl}">GitHub ↗</a><a href="${linkedinUrl}">LinkedIn ↗</a><a href="/resume">Résumé ↗</a><a href="mailto:${email}">Say hello ↗</a></span></footer>`;
}

export function renderPage(page: Page, path: string, isNotFound: boolean): string {
    return `${renderHeader(page, path, isNotFound)}<main id="main" tabindex="-1">${page.content}</main>${renderFooter()}`;
}
