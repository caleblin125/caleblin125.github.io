// TreeSim project page ("/projects/treesim").
//
// Facts and figures come from the run directories under
// /haydean/caleb/treesim/runs: metrics.csv, run.txt, stand_stats.txt, the
// frame title, and the project README. Both runs are single seeds; the page
// says so rather than presenting them as a replicated experiment.
import { projectById } from "../data/projects";
import { repos } from "./constants";
import { projectFooter, projectHeader, resultRow } from "./project-ui";
import type { Page } from "./types";

const project = projectById("treesim");

export const treesimPage: Page = {
    title: "A forest that grows itself.",
    eyebrow: "Project / Simulation",
    kind: "project",
    section: "Projects",
    updated: "2026-11-23",
    description: project.description,
    keywords: project.keywords,
    content: `<article class="article project-article">
${projectHeader(
    project,
    "Project / Simulation",
    "A forest that grows itself.",
    "An evolutionary tree simulation: limbs compete for light, water, and soil, storms break them, and the only thing that carries a shape into the next generation is what survived.",
    [{ label: "GitHub repository", href: repos.treeSimulation }]
)}

<h2 id="overview">Overview</h2>
<p>TreeSim starts with 2,160 seedlings on a 120 m × 120 m square of rolling ground and advances a month at a time in weekly substeps. A tree is a shoot and a root built from 0.6 m segments; each segment is an elliptic cylinder with its own length, width, and thickness, so the same primitive can be a round twig, a thick trunk, or a thin flat blade. Nothing in the genome stores a shape. A limb photosynthesizes in proportion to the shadow it casts toward the sun, respires, thickens, bends, breaks, and branches when a small inherited network tells it to. A tree that cannot pay its upkeep dies and returns its biomass to the soil.</p>
<p>The question is whether tree-like form can be selected rather than drawn. A founder has no target crown and no leaf flag: it starts with round limbs and a brain that barely branches. Competition for light and soil has to do the rest. Over 235 simulated years one run grew to 51,755 trees and 6.11 million limbs, and its tallest tree reached 10.65 m.</p>
<figure class="article-figure"><img src="/projects/treesim-fittest.jpg" alt="Six simulated trees drawn side on with their root systems, each labeled with its lineage, living descendants, age, height, limb count, and mass." loading="lazy" decoding="async"><figcaption>The six fittest trees at year 235, ranked by the number of living descendants of their founder lineage at the last frame. Fitness is a lineage proxy: the run records genomes, not offspring counts. Ages range from 48 to 133 years, heights from 1.6 m to 5.7 m, and masses from 16 kg to 144 kg.</figcaption></figure>
<p>I wrote the simulation core, the per-limb growth brain, the light and soil models, the MPI decomposition, the run recorder, the Slurm chain scripts, and the offline renderer and analysis tools. The repository is public. Its README is the operating manual, and <code>docs/realism.md</code> records the mechanical sources behind the wood and terrain rules along with the model's known gaps.</p>

<h2 id="architecture">Architecture</h2>
<div class="diagram-scroll"><svg class="vector-diagram" viewBox="0 0 960 430" role="img" aria-labelledby="treesim-arch-title treesim-arch-desc">
<title id="treesim-arch-title">TreeSim growth, competition, and selection loop</title>
<desc id="treesim-arch-desc">A seed and genome feed a per-limb growth brain, which sets limb growth. The forest fields of light, soil, water, and wind determine the tree's energy, which decides reproduction or death. Surviving seeds form the next generation. A lower band records metrics, frames, genomes, and checkpoints for offline rendering and phylogeny.</desc>
<rect x="1" y="1" width="958" height="428" fill="#2a1e32" stroke="#51425a"/>
<text x="36" y="38" fill="#c59ad8" font-family="monospace" font-size="15" letter-spacing="2">TREESIM / ONE GENERATION</text>
<g fill="#1a1320" stroke="#51425a">
<rect x="36" y="64" width="196" height="86"/><rect x="286" y="64" width="232" height="86"/><rect x="572" y="64" width="250" height="86"/>
<rect x="572" y="214" width="250" height="96"/><rect x="286" y="214" width="232" height="96"/><rect x="36" y="214" width="196" height="96"/>
</g>
<g fill="#eee8f2" font-family="sans-serif" font-size="17">
<text x="52" y="92">SEED + GENOME</text><text x="302" y="92">GROWTH BRAIN</text><text x="588" y="92">LIMB GROWTH</text>
<text x="588" y="242">FOREST FIELDS</text><text x="302" y="242">ENERGY</text><text x="52" y="242">REPRODUCTION</text>
</g>
<g fill="#9a8da0" font-family="monospace" font-size="11">
<text x="52" y="116">genes + brain weights</text><text x="52" y="136">lineage id</text>
<text x="302" y="116">12 in → 12 tanh → 10 out</text><text x="302" y="136">per limb, inherited</text>
<text x="588" y="116">length · width · thickness</text><text x="588" y="136">branch · root · shed</text>
<text x="588" y="266">0.5 m light grid</text><text x="588" y="286">2 m soil · water · storms</text>
<text x="302" y="266">photosynthesis − respiration</text><text x="302" y="286">pipe model · buckling</text>
<text x="52" y="266">seed at sunlit tips</text><text x="52" y="286">establish or die</text>
</g>
<g stroke="#c59ad8" stroke-width="2" marker-end="url(#treesim-arrow)" fill="none">
<line x1="232" y1="107" x2="280" y2="107"/><line x1="518" y1="107" x2="566" y2="107"/>
<line x1="697" y1="150" x2="697" y2="208"/><line x1="566" y1="262" x2="524" y2="262"/>
<line x1="286" y1="262" x2="238" y2="262"/><line x1="134" y1="214" x2="134" y2="156"/>
</g>
<text x="144" y="190" fill="#9a8da0" font-family="monospace" font-size="11">next generation</text>
<line x1="36" y1="336" x2="924" y2="336" stroke="#51425a" stroke-width="1.5" stroke-dasharray="7 7"/>
<text x="36" y="364" fill="#c59ad8" font-family="monospace" font-size="12">RUN</text>
<text x="84" y="364" fill="#9a8da0" font-family="monospace" font-size="12">24–48 ranks · x-strips + halo exchange · periodic checkpoints</text>
<text x="36" y="392" fill="#c59ad8" font-family="monospace" font-size="12">READ</text>
<text x="84" y="392" fill="#9a8da0" font-family="monospace" font-size="12">offline renderer · UPGMA phylogeny · species history · seed sweeps</text>
<text x="36" y="418" fill="#9a8da0" font-family="monospace" font-size="12">No shape is stored: the genome carries growth weights, and the stand selects them.</text>
<defs><marker id="treesim-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#c59ad8"/></marker></defs>
</svg></div>
<p>The loop is deliberately local. A limb sees twelve numbers about itself and its place in the tree; it does not see the forest. Competition enters through fields: the light a neighbour intercepts, the water a root cell can deliver, the soil nutrition left after uptake, and the gust load on a crown. The only global optimizer is survival.</p>
<p>A run is also a data pipeline. The same binary writes metrics, frames, genomes, and checkpoints while it simulates. The Python tools read those files afterwards to render a frame without OpenGL, infer a phylogeny from the genomes, trace species through time, or compare a sweep of seeds.</p>

<h2 id="implementation">Implementation</h2>

<h3>A week per substep</h3>
<p>Each update advances 1/12 year and is split into substeps of at most 1/48 year so growth stays stable. A week is too long to follow the sun, so each substep averages a day: direct light arrives from morning, noon, and afternoon, weighted toward the higher sun, plus 30% diffuse sky light. Winter lowers the sun and weakens the light without easing respiration, so winter is lean. Every limb is filed into a 0.5 m shadow grid along each light direction, which means a ray is tested only against limbs that could block it. The test suite checks this accelerated light field against brute-force tracing from every limb.</p>
<p>A limb's light-catching capacity falls with thickness as <code>1 / (1 + (t / 1 cm)²)</code>, so thin twigs and blades photosynthesize and trunks only hold them up. A limb at least four times wider than thick is counted and drawn as a leaf. Leaves are not a primitive: the genome evolves width and thickness separately, and a flat limb is simply the cheap way to intercept light per unit of tissue.</p>
<p>Water and soil close the loop. Broad blades transpire more per square metre, roots deliver water in proportion to absorbing area and that year's rainfall, and a shortfall closes stomata and cuts photosynthesis. The ground is a 2 m grid whose fertility rises from 50% at one edge to 100% at the other by default; roots deplete the cell they occupy, and dead tissue returns nutrition as it decays.</p>

<h3>Wood, water, and storms</h3>
<p>Woody limbs thicken every step whether or not the brain asks, as a cambium would, and that growth is paid before any other. A limb must carry 2.5 cm² of sapwood per m² of green area it supplies, be at least as thick as anything it bears, and keep a safety factor below Greenhill's buckling height: 4 in full sun and 1.5 in deep shade. Bending uses the elliptic section, so a blade is eight times stiffer on edge than flat. Roots both feed the tree and anchor it; when shoot weight times height plus a storm's push exceeds a fixed multiple of root weight times root reach, the tree uproots.</p>
<p>With terrain on, a fractal heightfield with 25 m of relief in features about 80 m across changes everything downstream: hollows collect runoff, steep slopes carry thinner soil, crests take stronger wind, sunward slopes need more water, and high ground has a shorter growing season. Light is traced in 3D, so a tree uphill shades one below it, though the ground itself casts no shadow. Storms arrive about once a year with gusts drawn from a Rayleigh distribution, mean 12 m/s at 10 m, and a steep wind profile that bears on tall trees far more than on seedlings. On top of that every tree has a 1% annual chance of dying from disease, fire, or browsing, so no lineage persists without leaving seed.</p>

<h3>The growth brain</h3>
<p>Each limb evaluates a small network from 12 inputs to 10 outputs. The inputs are energy, resource supply, sun exposure, whether it is above or below ground, length, torque margin, age, height, branch depth, tip height relative to the tree's height, whether it is an unbranched tip, and its inherited class. The outputs are elongation, thickening, root growth, split, branch count, branch attachment point, reproduction, widening, the class handed to side branches, and how fine their buds start. A hidden layer of 12 tanh units lets a limb respond to combinations of inputs rather than one at a time.</p>
<p>Founders use only the direct path: their hidden units start as single-input detectors but feed no output until mutation connects them. Thickening and widening start equal, so a founder grows round limbs. The class is an inherited identity, so a tree can evolve a woody framework that bears a different kind of fine, widening limb. A fine bud starts up to 95% thinner than the genome's starting thickness, which is how a blade can begin as one. All weights are in the genome, and crossover takes each output's weights and each hidden unit's incoming weights whole from one parent.</p>
<p>Segments stop lengthening at 0.6 m and open a leader bud; a shoot's leader turns partway toward vertical, so a trunk climbs and side branches curve up, while a root leader carries straight on. Side branches can start once a limb is 0.25 m long and again every 0.25 m. Buds break before the step's growth is paid for, and the split signal a limb needs falls as the tree's spendable energy rises, so a well-fed tree branches on a weak signal and a starved one stays simple.</p>

<h3>Many ranks, long runs</h3>
<p>The plot is cut into equal strips along x, one per MPI rank. Each rank simulates the trees rooted in its strip and, every substep, exchanges the limb and root positions that can shade or crowd across a strip edge; seeds that land in another strip are handed to the rank that owns them. Rank 0 gathers frames and the yearly summary. At 24 ranks the 235-year run averaged 651 s of wall time per simulated year, and 24 chained jobs of about 1 h 45 m each completed 235.5 years in 42.6 h.</p>
<p>A run directory is the experimental record. It holds the seed and plot extent, the full parameter set, one metrics row per year, and periodic frames, genomes, and checkpoints; the 235-year run used two-year frames and ten-year genomes and checkpoints. A checkpoint can be resumed exactly, but only on the same build and the same number of ranks. The chain scripts submit the next job before the cluster's two-hour limit, so a long forest is a sequence of checkpoints rather than one fragile allocation. When a node runs low on memory, new limbs can spill to local disk instead of the job being killed; spilling slows the run but does not change the result.</p>
<p>The limits are known. Strips are fixed and equal in width, so ranks are unevenly loaded while the population is still clustered near the center. Every rank receives every neighbour in reach, which is cheap at this scale but not a design for thousands of ranks. The windowed viewer compiles under MPI but was only exercised headless.</p>

<h3>What is checked</h3>
<p>The simulation tests cover geometry, the light grid against brute-force tracing, soil depletion and recovery, water limits, storms breaking tall thin stems, seed mixing, terrain, parameter files, and exact checkpoint resume. The generic build reports <code>All simulation tests passed</code>. The flatter, faster cluster build is built for the compute nodes and is not safe to run on the older login node, which is why the cluster scripts always submit MPI work through Slurm.</p>

<h2 id="results">Results</h2>
<div class="result-grid">
${resultRow("Simulated", "235.5 years", "seed 7 · 120 m hills plot")}
${resultRow("Stand at year 235", "51,755 trees", "6.11 million limbs")}
${resultRow("Wall time", "42.6 h", "24 MPI ranks · 24 chained jobs")}
${resultRow("Tallest tree", "10.65 m", "year 235 · seed 7")}
</div>
<p>Two runs are the evidence on this page. The first is the 120 m hills forest with self-avoidance, supply-limited soil, fine roots, leaf turnover, and seedling crowding, run to 235.5 years on 24 ranks. The second is an earlier 120 m hills configuration run to 1,778 years on 48 ranks; it is the run behind the phylogeny. Both use a single seed and a single parameter file, so neither is a replicated experiment.</p>
<div class="table-wrap"><table class="spec-table wrap">
<thead><tr><th>Quantity</th><th>235-year hills run</th><th>1,778-year hills run</th></tr></thead>
<tbody>
<tr><td>Seed</td><td>7</td><td>1591</td></tr>
<tr><td>Plot</td><td>120 × 120 m, 25 m relief</td><td>120 × 120 m, 25 m relief</td></tr>
<tr><td>Founders</td><td>2,160</td><td>2,160</td></tr>
<tr><td>MPI ranks</td><td>24</td><td>48</td></tr>
<tr><td>Simulated</td><td>235.5 years</td><td>1,778 years</td></tr>
<tr><td>Trees at end</td><td>51,755</td><td>5,637</td></tr>
<tr><td>Limbs at end</td><td>6.11 million</td><td>1.14 million</td></tr>
<tr><td>Tallest at end</td><td>10.65 m</td><td>8.07 m</td></tr>
<tr><td>Lineages at end (effective)</td><td>1,327 (712)</td><td>41 (10.9)</td></tr>
<tr><td>Recorded wall time</td><td>42.6 h</td><td>37.2 h</td></tr>
</tbody>
</table></div>
<figure class="article-figure"><img src="/projects/treesim-metrics.png" alt="Six-panel metrics plot for the 235-year run: population, height, surviving and effective lineages, mean energy and reproduction pressure, trait spread, and cumulative wall time with limb count." loading="lazy" decoding="async"><figcaption>One run, year by year. Population peaks near 78,000 around year 69 and settles near 50,000 as light and soil close; the tallest tree keeps climbing toward 10.6 m while the mean tree stays near 1 m. Surviving lineages fall from 2,160 to 1,327, and effective lineages to about 712. The last panel is the cost: about 2,555 minutes of recorded wall time on 24 ranks, with the limb count rising and falling with storms and self-thinning.</figcaption></figure>
<div class="table-wrap"><table class="spec-table wrap">
<thead><tr><th>Stand measurement, year 235.5</th><th>Value</th><th>Context</th></tr></thead>
<tbody>
<tr><td>Stems</td><td>35,941 / ha</td><td>Every seedling counts; 9,388 / ha are over 1.3 m and 763 / ha reach 10 cm DBH</td></tr>
<tr><td>Basal area</td><td>33.55 m² / ha</td><td>Trunk cross-section per ground area</td></tr>
<tr><td>Biomass</td><td>104.0 t / ha</td><td>Living shoot and root mass</td></tr>
<tr><td>Light-catching area</td><td>0.442 m² / m² ground</td><td>A real closed forest holds roughly 3–8 (leaf area index)</td></tr>
<tr><td>Height, 10 / 50 / 90 / max</td><td>0.18 / 0.68 / 2.19 / 10.7 m</td><td>A cohort of seedlings and saplings with a few emergents</td></tr>
<tr><td>400 tallest: median height</td><td>5.52 m</td><td>Height / basal diameter 46.6</td></tr>
<tr><td>400 tallest: crown width / height</td><td>1.27</td><td>Wider than tall; main stem is 78% of height</td></tr>
<tr><td>Flat-leaf share of light area</td><td>0 / 0.031 / 1</td><td>Median / 90th percentile / maximum</td></tr>
</tbody>
</table></div>
<p>The long run shows what selection does to a lineage pool. At year 1761 it held 5,427 trees in 42 founder lineages, with an effective lineage count of 12.2; by year 1778, 41 lineages remained and 10.9 were effective. A phylogeny inferred from 400 sampled genomes at year 1761, using genes on a log scale and growth-brain weights, joins trees by average linkage (UPGMA). In that tree, 77% of sampled trees have a nearest genetic neighbour from their own founder lineage. Lineages remain genetically distinguishable even as their number collapses.</p>
<p>MPI scaling was measured separately on a 6-core laptop with 4,000 trees over 12 simulated years. It is a small problem by cluster standards, but it shows where the parallel return saturates:</p>
<div class="table-wrap"><table class="spec-table wrap">
<thead><tr><th>Ranks</th><th>Wall time</th><th>Speedup</th></tr></thead>
<tbody>
<tr><td>1</td><td>172 s</td><td>1.0×</td></tr>
<tr><td>2</td><td>76 s</td><td>2.3×</td></tr>
<tr><td>4</td><td>53 s</td><td>3.2×</td></tr>
<tr><td>8</td><td>44 s</td><td>4.0×</td></tr>
</tbody>
</table></div>
<p>Self-avoidance is a growth rule with a measured effect. A shoot will not grow, bud, or open a leader into a 10 cm cell its own crown already fills. In the project's 20 m tests this cut self-overlap from 25% to 15% of crown cells and produced taller trees with thicker trunks; the 235-year run uses that rule. It is a local rule, like everything else in the brain, but it changes the shape of the stand.</p>

<h2 id="analysis">Analysis</h2>
<p>The stand self-thins, but not toward a monoculture. At 235 years, 2,160 founders have become 1,327 surviving lineages and 712 effective lineages; the population is still large because reproduction keeps filling gaps. At 1,778 years only 41 lineages remain, and the effective count is 10.9. Diversity is lost by drift and selection together, and the phylogeny shows that the survivors are not interchangeable: most trees are still closest to their own lineage.</p>
<p>Form converges on a slender, broad-crowned, multi-stemmed habit. The 400 tallest trees have a median height of 5.52 m, a height-to-diameter ratio of 46.6, a crown 1.27 times wider than tall, and a main stem that supplies only 78% of total height. That is what competition for a shallow light field and a 10 cm self-avoidance cell would be expected to favor: spread sideways, keep the stem cheap, and do not rebuild a tall leader that a storm can break. The 10.65 m maximum is an emergent, not a target; most of the stand never gets close.</p>
<p>The largest gap is leaves. The stand holds 0.44 m² of light-catching area per m² of ground, against roughly 3–8 in a real closed forest, and flat blades are rare: the median share of light-catching area in flat leaves is zero, the 90th percentile is 3%, and only the maximum reaches 1. The trees are woody skeletons with small blade-like tips, not broadleaf crowns. <code>docs/realism.md</code> identifies the reasons: leaf area per sapling is far below a real one, leaves earn too much per square metre, and leaf expansion is still slow. Seeding founders with a leafy habit would change what evolution starts from, which is why it is proposed as a separate experiment rather than quietly patched.</p>
<p>Cost is dominated by scanning the light field, not arithmetic. A native-tuned (AVX2) build was 1.4% faster in the project's test, and the 235-year run averaged about 11 minutes of wall time per simulated year at 24 ranks. The fixed equal-width strips and the full-neighbour exchange are the scaling limits; many seeds on a smaller plot use the cluster better than one wider run. That is also why the run recorder and checkpoint chain matter more than a faster inner loop: the work is long, and an interrupted job has to be resumable without losing the experiment.</p>
<p>What this is not: a validated forest-growth model, a prediction for a real stand, or a claim that the 235-year run is typical. It is one seed, one parameter file, and one implementation. Its value is that the mechanism, every parameter, the run directory, the genomes, and the analysis code are all inspectable, and that the failures are documented next to the results.</p>
${projectFooter([{ label: "GitHub repository", href: repos.treeSimulation }])}
</article>`
};
