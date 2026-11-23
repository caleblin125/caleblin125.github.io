// Shared note metadata. The blog index, each post's front matter, the RSS-style
// structured data, and the machine-readable files all read from this list, so a
// post's title, summary, and date only live in one place.
export type PostEntry = {
    id: string;
    path: string;
    title: string;
    description: string;
    /** ISO date used by sitemap.xml and JSON-LD. */
    date: string;
    /** Human display form used in the post kicker and blog index. */
    dateDisplay: string;
    eyebrow: string;
    keywords: string[];
    /** Set on notes that appear in the homepage selected-work list. */
    metric?: string;
    metricLabel?: string;
};

export const postEntries: PostEntry[] = [
    {
        id: "a-game-with-no-framebuffer",
        path: "/blog/a-game-with-no-framebuffer",
        title: "A game with no framebuffer.",
        description:
            "An endless runner in Verilog, drawn one pixel at a time by the counters that steer the VGA beam.",
        date: "2026-11-22",
        dateDisplay: "2026 / 11 / 22",
        eyebrow: "Engineering notes / 05",
        keywords: ["Verilog", "VGA", "FPGA", "endless runner", "sprite generation", "testbench"],
        metric: "59.52 Hz",
        metricLabel: "no framebuffer"
    },
    {
        id: "the-glove-is-the-controller",
        path: "/blog/the-glove-is-the-controller",
        title: "The glove is the controller.",
        description:
            "Two instrumented gloves, a 50 Hz attitude filter, and the calibration that decides which way is forward.",
        date: "2026-11-22",
        dateDisplay: "2026 / 11 / 22",
        eyebrow: "Engineering notes / 04",
        keywords: ["STM32", "BNO055", "complementary filter", "sensor calibration", "human-computer interface"]
    },
    {
        id: "a-robot-on-a-field-with-no-map",
        path: "/blog/a-robot-on-a-field-with-no-map",
        title: "A robot on a field with no map.",
        description:
            "An autonomous mecanum robot, a beacon receiver, and the ten-millisecond control loop that finds a goal on a field with no map.",
        date: "2026-11-22",
        dateDisplay: "2026 / 11 / 22",
        eyebrow: "Engineering notes / 03",
        keywords: ["mecanum", "PIC32", "autonomous robot", "Sallen-Key", "beacon", "control"]
    },
    {
        id: "where-the-file-meets-the-machine",
        path: "/blog/where-the-file-meets-the-machine",
        title: "Where the file meets the machine.",
        description:
            "A 48 × 36 inch poster built around a printer's dot grid, its moiré limits, and the arithmetic behind every mark.",
        date: "2026-11-22",
        dateDisplay: "2026 / 11 / 22",
        eyebrow: "Engineering notes / 02",
        keywords: ["printing", "resolution limit", "moiré", "halftone", "vector graphics"]
    },
    {
        id: "seeing-the-mandelbrot-set",
        path: "/blog/seeing-the-mandelbrot-set",
        title: "Seeing the Mandelbrot set.",
        description:
            "A note on drawing Mandelbrot orbit points by angle instead of coloring the set, with the math and the visual result.",
        date: "2026-08-20",
        dateDisplay: "2026 / 08 / 20",
        eyebrow: "Engineering notes / 01",
        keywords: ["Mandelbrot set", "complex dynamics", "WebGL", "orbit points"]
    }
];

export function postById(id: string): PostEntry {
    const entry = postEntries.find((post) => post.id === id);

    if (!entry) {
        throw new Error(`Unknown post: ${id}`);
    }

    return entry;
}
