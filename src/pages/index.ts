// Barrel file: assembles the `pages` record used by src/main.ts.
// Add new routes here after creating their page file in this folder.
import { aRobotOnAFieldWithNoMapPage } from "./a-robot-on-a-field-with-no-map";
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
import { theGloveIsTheControllerPage } from "./the-glove-is-the-controller";
import { whereTheFileMeetsTheMachinePage } from "./where-the-file-meets-the-machine";
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
    "/blog/a-robot-on-a-field-with-no-map": aRobotOnAFieldWithNoMapPage,
    "/blog/seeing-the-mandelbrot-set": seeingTheMandelbrotSetPage,
    "/blog/the-glove-is-the-controller": theGloveIsTheControllerPage,
    "/blog/where-the-file-meets-the-machine": whereTheFileMeetsTheMachinePage
};
