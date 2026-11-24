// Blog index ("/blog") — the newest note opens the page as a feature, the rest
// follow as a dated list. Rows are generated from src/data/posts.ts, which also
// supplies each post's metadata and the machine-readable representations. Keep
// the muted "Soon" placeholder last.
import { postEntries } from "../data/posts";
import type { Page } from "./types";

const [featured, ...rest] = postEntries;

const featureThumb = featured.image
    ? `<span class="post-thumb"><img src="${featured.image.src}" alt="${featured.image.alt}" decoding="async"></span>`
    : "";

const featureRow = `<a class="post-feature" href="${featured.path}">${featureThumb}<div><span class="post-date">${featured.dateDisplay}</span><h2>${featured.title}</h2><p>${featured.description}</p><span class="work-link">Read the note <span aria-hidden="true">↗</span></span></div></a>`;

const postRows = rest
    .map(
        (post) =>
            `<a class="post-row" href="${post.path}"><span class="post-date">${post.dateDisplay}</span><span><h2>${post.title}</h2><p>${post.description}</p></span><span class="arrow" aria-hidden="true">↗</span></a>`
    )
    .join("");

export const blogPage: Page = {
    title: "Notes.",
    eyebrow: "Blog",
    kind: "index",
    section: "Blog",
    description: "Engineering notes by Caleb Lin on hardware, graphics, robotics, and the measurements behind the projects.",
    keywords: ["engineering notes", "FPGA", "robotics", "graphics", "HPC", "Caleb Lin"],
    content: `<section class="page-intro"><p class="kicker">Notes / 05</p><h1>Notes.</h1><p class="lede">Things I wrote down while trying to understand them: the measurement, the surprise, and the part that did not work the first time.</p></section>${featureRow}<section class="post-list" aria-label="All notes">${postRows}<div class="post-row muted"><span class="post-date">Soon</span><span><h2>Rendering points in a fragment shader</h2><p>A note about making the GPU do the repetitive part.</p></span></div></section>`
};
