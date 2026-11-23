// Blog index ("/blog") — list of posts. Rows are generated from
// src/data/posts.ts, which also supplies each post's metadata and the
// machine-readable representations. Keep the muted "Soon" placeholder last.
import { postEntries } from "../data/posts";
import type { Page } from "./types";

const postRows = postEntries
    .map(
        (post) =>
            `<a class="post-row" href="${post.path}"><span class="post-date">${post.dateDisplay}</span><span><h2>${post.title}</h2><p>${post.description}</p></span><span class="arrow">↗</span></a>`
    )
    .join("");

export const blogPage: Page = {
    title: "Notes.",
    eyebrow: "Blog",
    kind: "index",
    section: "Blog",
    description: "Engineering notes by Caleb Lin on hardware, graphics, robotics, and the measurements behind the projects.",
    keywords: ["engineering notes", "FPGA", "robotics", "graphics", "HPC", "Caleb Lin"],
    content: `<section class="page-intro"><p class="kicker">Notes</p><h1>Notes.</h1><p class="lede">Things I wrote down while trying to understand them.</p></section><section class="post-list">${postRows}<div class="post-row muted"><span class="post-date">Soon</span><span><h2>Rendering points in a fragment shader</h2><p>A note about making the GPU do the repetitive part.</p></span></div></section>`
};
