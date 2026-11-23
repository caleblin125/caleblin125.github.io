// Barrel file: assembles the `pages` record used by src/main.ts.
// Add new routes here after creating their page file in this folder.
import { aboutPage } from "./about";
import { blogPage } from "./blog";
import { boidsPage } from "./boids";
import { fpgaPage } from "./fpga";
import { homePage } from "./home";
import { hpcPage } from "./hpc";
import { mandelbrotPage } from "./mandelbrot";
import { projectsPage } from "./projects";
import { resumePage } from "./resume";
import { seeingTheMandelbrotSetPage } from "./seeing-the-mandelbrot-set";
import type { Page } from "./types";

export const pages: Record<string, Page> = {
    "/": homePage,
    "/projects": projectsPage,
    "/resume": resumePage,
    "/about": aboutPage,
    "/projects/mandelbrot": mandelbrotPage,
    "/projects/boids": boidsPage,
    "/projects/fpga": fpgaPage,
    "/projects/hpc": hpcPage,
    "/blog": blogPage,
    "/blog/seeing-the-mandelbrot-set": seeingTheMandelbrotSetPage
};
