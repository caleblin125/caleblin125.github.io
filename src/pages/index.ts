// Barrel file: assembles the `pages` record used by the client and the
// static generator in scripts/generate-site.ts.
// Add new routes here after creating their page file in this folder.
import { aGameWithNoFramebufferPage } from "./a-game-with-no-framebuffer";
import { aRobotOnAFieldWithNoMapPage } from "./a-robot-on-a-field-with-no-map";
import { aboutPage } from "./about";
import { blogPage } from "./blog";
import { boidsPage } from "./boids";
import { forecastingPage } from "./forecasting";
import { fpgaPage } from "./fpga";
import { homePage } from "./home";
import { hpcPage } from "./hpc";
import { mandelbrotPage } from "./mandelbrot";
import { notFoundPage } from "./not-found";
import { projectsPage } from "./projects";
import { resumePage } from "./resume";
import { roboticsPage } from "./robotics";
import { seeingTheMandelbrotSetPage } from "./seeing-the-mandelbrot-set";
import { theGloveIsTheControllerPage } from "./the-glove-is-the-controller";
import { visualizationPage } from "./visualization";
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
    "/projects/robotics": roboticsPage,
    "/projects/forecasting": forecastingPage,
    "/projects/visualization": visualizationPage,
    "/blog": blogPage,
    "/blog/a-game-with-no-framebuffer": aGameWithNoFramebufferPage,
    "/blog/a-robot-on-a-field-with-no-map": aRobotOnAFieldWithNoMapPage,
    "/blog/seeing-the-mandelbrot-set": seeingTheMandelbrotSetPage,
    "/blog/the-glove-is-the-controller": theGloveIsTheControllerPage,
    "/blog/where-the-file-meets-the-machine": whereTheFileMeetsTheMachinePage
};

export { notFoundPage };
