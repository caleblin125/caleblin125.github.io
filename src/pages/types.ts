// Shared type for every page in the site's `pages` record.
// A page is purely data: the shell (header/footer/nav) is rendered by
// src/render.ts; each page contributes its title, header note, and body.
export type PageKind = "home" | "project" | "post" | "index" | "profile" | "page" | "not-found";

export type Page = {
    title: string;
    eyebrow: string;
    description?: string;
    content: string;
    /** Used to choose JSON-LD and Open Graph types. */
    kind?: PageKind;
    /** ISO publication date, currently used by notes. */
    date?: string;
    /** ISO modification date when it differs from `date`. */
    updated?: string;
    keywords?: string[];
    /** Human-readable parent section, used for breadcrumbs and metadata. */
    section?: string;
};
