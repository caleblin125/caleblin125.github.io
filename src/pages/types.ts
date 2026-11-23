// Shared type for every page in the site's `pages` record.
// A page is purely data: the shell (header/footer/nav) is rendered by
// src/main.ts; each page contributes only its title, header note, and body.
export type Page = {
    title: string;
    eyebrow: string;
    description?: string;
    content: string;
};
