// Measured SCC Connect 2026 benchmark results.
//
// Every number here is copied from the team's benchmark report and is shown
// without interpolation. The chart draws only the points that were run; a
// missing configuration is missing, not estimated. The provenance note on each
// dataset says which campaign produced it and what the runs do and do not
// support.
//
// Source: SCC Connect 2026 benchmark report, sections/hpl.tex, sections/nccl.tex,
// and sections/stream.tex. Recorded 2026-11.

export type BenchSeries = {
    name: string;
    color: string;
    values: number[];
};

export type BenchRange = {
    min: number;
    max: number;
};

export type BenchTable = {
    head: string[];
    rows: Array<Array<string | number>>;
};

export type BenchDataset = {
    id: string;
    label: string;
    title: string;
    subtitle: string;
    unit: string;
    axisLabel: string;
    /** The chart's right edge. Chosen to fit the data, not to flatter it. */
    max: number;
    categories: string[];
    series: BenchSeries[];
    /** Min/max whiskers for the first series, when the campaign reported them. */
    ranges?: Array<BenchRange | null>;
    note: string;
    table: BenchTable;
};

// Atlas series hues: sienna, steel, amber, sage. Each is distinguishable from
// the others and from the ink ground in the chart.
const SIENNA = "#d98a5f";
const STEEL = "#7fa6c9";
const AMBER = "#e6a15f";
const SAGE = "#8fb3a0";

export const BENCH_DATASETS: BenchDataset[] = [
    {
        id: "hpl-size",
        label: "HPL by size",
        title: "HPL throughput by problem size",
        subtitle: "Six runs at each matrix size, one node, all 24 residual checks passed.",
        unit: "GFLOPS",
        axisLabel: "GFLOPS",
        max: 4500,
        categories: ["N = 276,640", "N = 304,000", "N = 324,520", "N = 345,800"],
        series: [{ name: "Mean of 6 runs", color: SIENNA, values: [4395.2, 4399.0, 4401.5, 4400.7] }],
        ranges: [
            { min: 4394.0, max: 4396.1 },
            { min: 4396.2, max: 4401.7 },
            { min: 4399.2, max: 4403.6 },
            { min: 4396.1, max: 4403.6 }
        ],
        note:
            "Whiskers are min–max across the six runs. The whole spread is 0.22% of the mean; the best single run was 4,403.6 GFLOPS at N = 324,520. Peak is 5,120 GFLOPS, so the best run reached 86.0%.",
        table: {
            head: ["N", "Matrix (GiB)", "Runs", "Mean (GFLOPS)", "SD", "Min", "Max"],
            rows: [
                ["276,640", 570, 6, "4,395.2", "0.7", "4,394.0", "4,396.1"],
                ["304,000", 689, 6, "4,399.0", "1.9", "4,396.2", "4,401.7"],
                ["324,520", 785, 6, "4,401.5", "1.6", "4,399.2", "4,403.6"],
                ["345,800", 891, 6, "4,400.7", "2.6", "4,396.1", "4,403.6"],
                ["All", "—", 24, "4,399.1", "3.0", "4,394.0", "4,403.6"]
            ]
        }
    },
    {
        id: "hpl-settings",
        label: "HPL settings",
        title: "HPL by uncore clock",
        subtitle: "Separate tuning campaigns, not a controlled factorial experiment.",
        unit: "GFLOPS",
        axisLabel: "GFLOPS",
        max: 4500,
        categories: ["1.0 GHz", "1.2 GHz", "0.8 GHz", "2.5 GHz (default)"],
        series: [
            { name: "Median", color: SIENNA, values: [4262, 4237, 4148, 4025] },
            { name: "Best", color: STEEL, values: [4288, 4272, 4265, 4216] }
        ],
        note:
            "The four rows come from campaigns with 163, 38, 27, and 19 runs. Because the run counts and surrounding settings differ, read the direction of the effect rather than a precise delta between two bars.",
        table: {
            head: ["Setting", "Value", "Runs", "Median GFLOPS", "Best"],
            rows: [
                ["Uncore max", "1.0 GHz", 163, "4,262", "4,288"],
                ["Uncore max", "1.2 GHz", 38, "4,237", "4,272"],
                ["Uncore max", "0.8 GHz", 27, "4,148", "4,265"],
                ["Uncore max", "2.5 GHz (default)", 19, "4,025", "4,216"]
            ]
        }
    },
    {
        id: "nccl",
        label: "NCCL channels",
        title: "NCCL bandwidth at 8 GiB",
        subtitle: "Best of three runs, four collectives, one NVLink pair.",
        unit: "GB/s",
        axisLabel: "GB/s",
        max: 260,
        categories: [
            "16 ch (default)",
            "32 ch",
            "48 ch",
            "64 ch",
            "32 ch + Simple",
            "32 ch + -R 1",
            "32 ch + -R 2",
            "64 ch + -R 1"
        ],
        series: [
            { name: "all_reduce", color: SIENNA, values: [233.5, 247.7, 243.3, 249.1, 247.6, 249.8, 172.9, 249.9] },
            { name: "all_gather", color: STEEL, values: [196.6, 238.4, 235.1, 246.2, 238.2, 249.6, 235.9, 249.7] },
            { name: "reduce_scatter", color: AMBER, values: [201.6, 240.1, 240.0, 246.8, 239.7, 240.6, 176.2, 246.4] },
            { name: "broadcast", color: SAGE, values: [246.2, 250.6, 249.1, 251.3, 250.6, 251.5, 251.5, 251.4] }
        ],
        note:
            "The 64-channel + -R 1 row is the best measured configuration for all three reducing collectives. The 32-channel + -R 2 row is the visible failure: all_reduce and reduce_scatter drop by roughly 70 GB/s while broadcast is unchanged. Peak NVLink bandwidth is 318.7 GB/s.",
        table: {
            head: ["Setting", "all_reduce", "all_gather", "reduce_scatter", "broadcast"],
            rows: [
                ["default (16 ch)", "233.5", "196.6", "201.6", "246.2"],
                ["32 ch", "247.7", "238.4", "240.1", "250.6"],
                ["48 ch", "243.3", "235.1", "240.0", "249.1"],
                ["64 ch", "249.1", "246.2", "246.8", "251.3"],
                ["32 ch + PROTO=Simple", "247.6", "238.2", "239.7", "250.6"],
                ["32 ch + -R 1", "249.8", "249.6", "240.6", "251.5"],
                ["32 ch + -R 2", "172.9", "235.9", "176.2", "251.5"],
                ["64 ch + -R 1", "249.9", "249.7", "246.4", "251.4"]
            ]
        }
    },
    {
        id: "stream",
        label: "STREAM repeats",
        title: "STREAM by repeat variation",
        subtitle: "Best measured copy bandwidth for each changed parameter.",
        unit: "GB/s",
        axisLabel: "GB/s",
        max: 500,
        categories: [
            "0.75 GiB array",
            "1.5 GiB array",
            "2 GiB array",
            "62 threads",
            "60 threads",
            "56 threads",
            "66 threads",
            "68 threads",
            "72 threads"
        ],
        series: [{ name: "Best of repeat loop", color: SIENNA, values: [479.2, 469.2, 465.6, 456.6, 441.9, 411.8, 354.8, 358.9, 361.9] }],
        note:
            "Each bar changes one parameter from the tuned baseline; the rows are not a grid. The smallest array and the 62-thread setting were fastest. Oversubscribing past 64 threads cost about 100 GB/s. The selected final configuration measured 474.2 GB/s.",
        table: {
            head: ["Variation", "Best (GB/s)"],
            rows: [
                ["0.75 GiB array", "479.2"],
                ["1.5 GiB array", "469.2"],
                ["2 GiB array", "465.6"],
                ["62 threads", "456.6"],
                ["60 threads", "441.9"],
                ["56 threads", "411.8"],
                ["66 threads", "354.8"],
                ["68 threads", "358.9"],
                ["72 threads", "361.9"]
            ]
        }
    }
];

function escapeHtml(value: string | number): string {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

/**
 * The same numbers the chart draws, as a plain table. A reader without a
 * canvas, a keyboard-only visitor, or a machine reading the page gets the
 * measurements directly instead of a picture of them.
 */
export function benchTable(dataset: BenchDataset): string {
    const head = dataset.table.head.map((cell) => `<th scope="col">${escapeHtml(cell)}</th>`).join("");
    const rows = dataset.table.rows
        .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`)
        .join("");

    return `<div class="table-wrap"><table class="spec-table wrap"><caption>${escapeHtml(dataset.title)} — ${escapeHtml(dataset.subtitle)}</caption><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>`;
}
