// Barrel file: assembles the `pages` record used by the client and the
// static generator in scripts/generate-site.ts.
// Add new routes here after creating their page file in this folder.
import { aGameWithNoFramebufferPage } from "./a-game-with-no-framebuffer";
import { aRobotOnAFieldWithNoMapPage } from "./a-robot-on-a-field-with-no-map";
import { aboutPage } from "./about";
import { auroraPage } from "./aurora";
import { blogPage } from "./blog";
import { boidsPage } from "./boids";
import { drawingArmPage } from "./drawing-arm";
import { forecastingPage } from "./forecasting";
import { fpgaPage } from "./fpga";
import { homePage } from "./home";
import { hpcPage } from "./hpc";
import { labPage } from "./lab";
import { mandelbrotPage } from "./mandelbrot";
import { nebulaLabPage } from "./nebula-lab";
import { notFoundPage } from "./not-found";
import { projectsPage } from "./projects";
import { resumePage } from "./resume";
import { roboticsPage } from "./robotics";
import { sccConnectPage } from "./scc";
import { seeingTheMandelbrotSetPage } from "./seeing-the-mandelbrot-set";
import { theGloveIsTheControllerPage } from "./the-glove-is-the-controller";
import { treesimPage } from "./treesim";
import { visualizationPage } from "./visualization";
import { whereTheFileMeetsTheMachinePage } from "./where-the-file-meets-the-machine";
import type { Page } from "./types";

export const pages: Record<string, Page> = {
    "/": homePage,
    "/projects": projectsPage,
    "/lab": labPage,
    "/lab/nebula": nebulaLabPage,
    "/resume": resumePage,
    "/about": aboutPage,
    "/projects/mandelbrot": mandelbrotPage,
    "/projects/boids": boidsPage,
    "/projects/fpga": fpgaPage,
    "/projects/hpc": hpcPage,
    "/projects/robotics": roboticsPage,
    "/projects/forecasting": forecastingPage,
    "/projects/treesim": treesimPage,
    "/projects/scc-connect": sccConnectPage,
    "/projects/visualization": visualizationPage,
    "/projects/drawing-arm": drawingArmPage,
    "/projects/aurora": auroraPage,
    "/blog": blogPage,
    "/blog/a-game-with-no-framebuffer": aGameWithNoFramebufferPage,
    "/blog/a-robot-on-a-field-with-no-map": aRobotOnAFieldWithNoMapPage,
    "/blog/seeing-the-mandelbrot-set": seeingTheMandelbrotSetPage,
    "/blog/the-glove-is-the-controller": theGloveIsTheControllerPage,
    "/blog/where-the-file-meets-the-machine": whereTheFileMeetsTheMachinePage
};

export { notFoundPage };
