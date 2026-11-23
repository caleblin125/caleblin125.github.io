/* ------------------------------------------------------------------
   Aurora — global configuration
   All world units are kilometres, angles radians unless noted.
   ------------------------------------------------------------------ */
(function () {
  "use strict";
  const Aurora = (window.Aurora = window.Aurora || {});

  Aurora.Config = {
    /* Default live parameters (also the UI starting values). */
    defaults: {
      intensity: 1.0,      // 0..2   emission multiplier
      turbulence: 1.0,     // 0.2..2 amplitude of folds / filament contrast
      density: 0.65,       // 0.15..1 fill, opacity and layer count
      color: 0.38,         // 0..1   shifts the emission-altitude palette
      speed: 1.0,          // 0..3   simulated seconds per real second
      exposure: 1.0,       // 0.4..2.2 film exposure
      autoCamera: true,
      autoQuality: true,
      paused: false,
    },

    /* Aurora volume bounds in world kilometres. The camera sits at the
       origin; curtains occupy roughly 12–55 degrees of elevation. */
    world: {
      baseAlt: 82.0,        // lower edge of green oxygen emission
      topAlt: 252.0,        // nominal top of the bright green/red column
      slabTop: 500.0,       // highest modelled red emission (faint sheet tops)
      nearZ: 300.0,         // nearest volume slice
      farZ: 940.0,          // farthest slice (fades into haze)
      halfWidth: 1700.0,
      curtainBaseZ: 430.0,  // first curtain sheet depth
      curtainSpacing: 150.0, // depth gap between overlapping sheets
    },

    /* Rendering quality tiers.
       auroraScale = aurora buffer size relative to the canvas.
       steps       = detail level: folds, ray octaves and sheet width.
       The aurora is soft, so it survives a low-res buffer and a bloom pass. */
    quality: {
      low:    { label: "Low",    auroraScale: 0.34, maxScale: 0.48, steps: 34 },
      medium: { label: "Medium", auroraScale: 0.46, maxScale: 0.60, steps: 46 },
      high:   { label: "High",   auroraScale: 0.58, maxScale: 0.74, steps: 60 },
      ultra:  { label: "Ultra",  auroraScale: 0.72, maxScale: 0.90, steps: 76 },
    },

    /* Bloom is fed only by the aurora buffer. Threshold is in linear HDR
       units; the knee softens the cut so dim curtains still contribute. */
    bloom: {
      threshold: 0.72,
      knee: 0.50,
      strength: 0.66,
      wideStrength: 0.36,
    },

    /* Camera defaults. Pitch is elevation above the horizon. */
    camera: {
      yaw: 0.0,
      pitch: 0.30,
      fov: 61 * Math.PI / 180,
      minFov: 32 * Math.PI / 180,
      maxFov: 82 * Math.PI / 180,
      minPitch: -0.045,
      maxPitch: 0.72,
      position: [0, 0.028, 0],
    },

    /* Procedural noise volume generated once on the CPU. */
    noise: {
      size: 64,
      periods: [4, 8, 16, 8], // R/G/B/A lattice periods (tileable)
      seed: 1337,
    },

    /* Star field tuning (procedural, direction-locked). */
    stars: {
      brightScale: 215,
      faintScale: 470,
      brightDensity: 0.986,
      faintDensity: 0.994,
    },
  };
})();
