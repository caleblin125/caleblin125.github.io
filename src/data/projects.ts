// Shared project metadata. This is the source of truth for the project index,
// the project pages' descriptions, the homepage selected-work rows, and the
// machine-readable files (llms.txt, sitemap, Markdown front matter, JSON-LD).
import { boidsUrl, chaosEquationsUrl, githubProfileUrl, repos } from "../pages/constants";

export type ProjectLink = {
    label: string;
    href: string;
};

export type ProjectEntry = {
    id: string;
    number: string;
    title: string;
    description: string;
    period: string;
    tags: string;
    /** Internal route for a project with its own page. */
    path?: string;
    /** Where the project title links, if it links at all. */
    titleHref?: string;
    links: ProjectLink[];
    keywords: string[];
    /** Set on projects shown in the homepage selected-work list. */
    featured?: boolean;
    metric?: string;
    metricLabel?: string;
};

export const projectEntries: ProjectEntry[] = [
    {
        id: "fpga",
        number: "01",
        title: "FPGA and digital hardware",
        description:
            "FPGA work by Caleb Lin: a class-leading Verilog multiplier, VGA and audio interfaces, and ternary LLM inference on a Xilinx Alveo U250.",
        period: "2025-26",
        tags: "Verilog / Yosys / Alveo U250",
        path: "/projects/fpga",
        titleHref: "/projects/fpga",
        links: [
            { label: "Project page", href: "/projects/fpga" },
            { label: "GitHub", href: githubProfileUrl }
        ],
        keywords: ["FPGA", "Verilog", "Yosys", "Alveo U250", "ternary LLM inference", "VGA", "audio"],
        featured: true,
        metric: "3×",
        metricLabel: "class throughput"
    },
    {
        id: "hpc",
        number: "02",
        title: "HPC and cluster tuning",
        description:
            "HPC work by Caleb Lin: Haydean cluster administration, HPL tuning to 663 GFLOPS, and competition systems including a 2× H100 cluster.",
        period: "2025-26",
        tags: "Slurm / MPI / HPL",
        path: "/projects/hpc",
        titleHref: "/projects/hpc",
        links: [
            { label: "Project page", href: "/projects/hpc" },
            { label: "HPC-Tools", href: repos.hpcTools },
            { label: "HPL_Builds", href: repos.hplBuilds },
            { label: "IndySCC", href: repos.indyScc },
            { label: "SBCC", href: repos.sbcc }
        ],
        keywords: ["HPC", "Slurm", "MPI", "HPL", "OpenMPI", "OpenBLAS", "H100", "HPE Cray"],
        featured: true,
        metric: "663 GFLOPS",
        metricLabel: "47% of peak"
    },
    {
        id: "mandelbrot",
        number: "03",
        title: "Mandelbrot drawer",
        description:
            "A browser version of an earlier Java project that draws the points visited by stable Mandelbrot sequences and colors them by the direction they take next.",
        period: "Building",
        tags: "WebGL / TypeScript / C++",
        path: "/projects/mandelbrot",
        titleHref: "/projects/mandelbrot",
        links: [
            { label: "ChaosPlotter", href: repos.chaosPlotter },
            { label: "Chaos-Equations", href: chaosEquationsUrl }
        ],
        keywords: ["Mandelbrot set", "complex dynamics", "WebGL", "TypeScript", "C++"]
    },
    {
        id: "boids",
        number: "04",
        title: "Boids",
        description:
            "A WebGL remake of an older Java flocking simulation, with the three steering rules, species constants, and an interactive canvas.",
        period: "Building",
        tags: "WebGL / TypeScript",
        path: "/projects/boids",
        titleHref: "/projects/boids",
        links: [{ label: "Original Java source", href: boidsUrl }],
        keywords: ["boids", "flocking", "WebGL", "TypeScript", "simulation"]
    },
    {
        id: "autosentiment",
        number: "05",
        title: "AutoSentiment",
        description:
            "A local research dashboard for multi-source public sentiment intelligence. It searches the web, fetches source text, uses local language models for sentiment analysis, and keeps claims traceable to URLs and corroborating domains.",
        period: "2026",
        tags: "Python / local LLMs / research UI",
        titleHref: repos.autoSentiment,
        links: [{ label: "Repository", href: repos.autoSentiment }],
        keywords: ["sentiment analysis", "local LLMs", "research dashboard", "Python"]
    },
    {
        id: "ai-tutoring",
        number: "06",
        title: "AI tutoring tools",
        description:
            "Small experiments around AI-assisted learning, including a cooking tutor and bootcamp work focused on building helpful tutor behavior.",
        period: "2025",
        tags: "Jupyter / Streamlit / tutoring",
        links: [
            { label: "CookingTutor", href: repos.cookingTutor },
            { label: "GenAI Tutor Bootcamp", href: repos.genAiTutor }
        ],
        keywords: ["AI tutoring", "Jupyter", "Streamlit", "education"]
    },
    {
        id: "exploratory",
        number: "07",
        title: "Exploratory systems",
        description:
            "Additional work in simulations, networking, digital design, and language experiments. These projects broaden the site beyond graphics into the systems I am learning by building.",
        period: "Archive",
        tags: "C++ / Python / Verilog",
        links: [
            { label: "TreeSimulation", href: repos.treeSimulation },
            { label: "Tshark1", href: repos.tshark },
            { label: "ttsky-brainfuck", href: repos.tinyTapeoutBrainfuck },
            { label: "ttsky-library-of-babel", href: repos.tinyTapeoutLibrary },
            { label: "GreekNumbers", href: repos.greekNumbers }
        ],
        keywords: ["simulation", "networking", "digital design", "Verilog", "C++", "Python"]
    }
];

export function projectById(id: string): ProjectEntry {
    const entry = projectEntries.find((project) => project.id === id);

    if (!entry) {
        throw new Error(`Unknown project: ${id}`);
    }

    return entry;
}
