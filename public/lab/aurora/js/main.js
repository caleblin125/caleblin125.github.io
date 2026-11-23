/* ------------------------------------------------------------------
   Boot + frame loop + adaptive quality.
   ------------------------------------------------------------------ */
(function () {
  "use strict";
  const Aurora = window.Aurora;
  const $ = (id) => document.getElementById(id);

  function showFatal(message) {
    const el = $("unsupported");
    if (el) {
      el.hidden = false;
      const p = el.querySelector("p");
      if (p && message) p.textContent = message;
    }
    const loading = $("loading");
    if (loading) loading.style.display = "none";
  }

  function start() {
    const canvas = $("stage");
    const config = Aurora.Config;

    const params = Object.assign({}, config.defaults);
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      params.autoCamera = false;
    }
    const weather = new Aurora.SpaceWeather();
    const camera = new Aurora.Camera(canvas);

    const qualityOrder = ["low", "medium", "high", "ultra"];
    let qualityName = "high";
    let preset = config.quality[qualityName];
    let scale = preset.auroraScale;
    let steps = preset.steps;
    let autoQuality = params.autoQuality;

    /* URL overrides, handy for screenshots and slow devices:
       ?quality=low&scale=0.4&steps=20&noauto&capture=1 */
    const qp = new URLSearchParams(location.search);
    if (qp.has("quality") && config.quality[qp.get("quality")]) {
      qualityName = qp.get("quality");
      preset = config.quality[qualityName];
      scale = preset.auroraScale;
      steps = preset.steps;
    }
    if (qp.has("scale")) scale = Math.max(0.2, Math.min(1, parseFloat(qp.get("scale")) || scale));
    if (qp.has("steps")) steps = Math.max(16, Math.min(96, parseInt(qp.get("steps"), 10) || steps));
    if (qp.has("noauto")) autoQuality = false;

    let renderer;
    let ui;
    let contextLost = false;
    const state = {
      params,
      steps,
      layers: 3,
      simTime: 0,
      realTime: 0,
      basis: null,
      visual: weather.visual(0),
    };

    /* ---------------- boot ---------------- */
    function boot() {
      const noiseData = Aurora.Noise.generate(
        config.noise.size, config.noise.periods, config.noise.seed
      );

      try {
        renderer = new Aurora.Renderer(canvas, noiseData);
      } catch (err) {
        console.error(err);
        if (String(err.message).indexOf("WEBGL2_UNAVAILABLE") !== -1) {
          showFatal("This simulation needs WebGL 2. Try a recent version of Chrome, Edge, Firefox or Safari with hardware acceleration enabled.");
        } else {
          showFatal("The renderer could not start: " + err.message);
        }
        return;
      }

      renderer.resize();
      renderer.setAuroraScale(scale);

      /* A lost context leaves every GL object invalid; show a clear recovery
         path instead of letting the frame loop throw every frame. */
      canvas.addEventListener("webglcontextlost", (e) => {
        e.preventDefault();
        contextLost = true;
        const el = $("context-lost");
        if (el) el.hidden = false;
      });
      canvas.addEventListener("webglcontextrestored", () => location.reload());
      const reload = $("btn-reload");
      if (reload) reload.addEventListener("click", () => location.reload());

      ui = new Aurora.UI(params, {
        substorm: () => weather.trigger(),
        resetView: () => camera.reset(),
        setAutoCamera: (on) => camera.setAuto(on),
        cycleQuality: () => cycleQuality(),
        setAutoQuality: (on) => { autoQuality = on; },
      });

      ui.setQualityLabel(qualityName, scale, steps);
      camera.setAuto(params.autoCamera);

      window.addEventListener("resize", () => renderer.resize());
      if (window.ResizeObserver) {
        new ResizeObserver(() => renderer.resize()).observe(canvas);
      }
      document.addEventListener("visibilitychange", () => {
        last = performance.now();
      });

      // Some webviews and embedded panels throttle requestAnimationFrame
      // to a standstill.  Run a timer-driven fallback whenever the
      // visible page has not presented a frame for a while.
      let rafFrames = 0;
      let fallback = false;
      let fallbackTimer = 0;
      let started = false;

      const onRaf = (now) => {
        rafFrames++;
        if (fallback) {
          fallback = false;
          clearTimeout(fallbackTimer);
        }
        tick(now);
        requestAnimationFrame(onRaf);
      };

      const startFallback = () => {
        if (fallback) return;
        fallback = true;
        const run = () => {
          if (!fallback) return;
          tick(performance.now());
          fallbackTimer = setTimeout(run, 16);
        };
        run();
      };

      setInterval(() => {
        if (!started) return;
        if (rafFrames === 0 && document.visibilityState === "visible" && !fallback) {
          startFallback();
        }
        rafFrames = 0;
      }, 700);

      // First frame synchronously so the loading overlay can retire even
      // when animation frames are delayed.
      const now = performance.now();
      last = now;
      tick(now);
      started = true;
      ui.hideLoading();
      requestAnimationFrame(onRaf);
    }

    function cycleQuality() {
      const i = (qualityOrder.indexOf(qualityName) + 1) % qualityOrder.length;
      qualityName = qualityOrder[i];
      preset = config.quality[qualityName];
      scale = preset.auroraScale;
      steps = preset.steps;
      renderer.setAuroraScale(scale);
      ui.setQualityLabel(qualityName, scale, steps);
    }

    /* ---------------- adaptive resolution ---------------- */
    const perf = {
      frames: 0,
      elapsed: 0,
      fps: 60,
      cooldown: 0,
      hud: 0,
      label: 0,
    };

    function adapt(dt) {
      perf.frames++;
      perf.elapsed += dt;
      perf.cooldown -= dt;
      if (perf.elapsed < 1.0) return;

      perf.fps = perf.frames / perf.elapsed;
      perf.frames = 0;
      perf.elapsed = 0;
      ui.setFps(perf.fps);

      if (!autoQuality || perf.cooldown > 0) return;

      if (perf.fps < 47) {
        const nextScale = Math.max(0.26, scale * 0.92);
        const nextSteps = Math.max(24, steps - 4);
        if (nextScale !== scale || nextSteps !== steps) {
          scale = nextScale;
          steps = nextSteps;
          renderer.setAuroraScale(scale);
          perf.cooldown = 1.1;
          ui.setQualityLabel(qualityName + " · auto", scale, steps);
        }
      } else if (perf.fps > 58 && (scale < preset.maxScale || steps < preset.steps)) {
        scale = Math.min(preset.maxScale, scale * 1.05);
        steps = Math.min(preset.steps, steps + 3);
        renderer.setAuroraScale(scale);
        perf.cooldown = 1.8;
        ui.setQualityLabel(qualityName + " · auto", scale, steps);
      }
    }

    /* ---------------- frame loop ---------------- */
    let last = performance.now();

    function tick(now) {
      if (contextLost) return;
      const raw = (now - last) / 1000;
      last = now;
      const dt = Math.min(0.06, Math.max(0.0001, raw));

      const simDt = params.paused ? 0 : dt * params.speed;
      state.simTime += simDt;
      state.realTime += dt;

      weather.update(simDt);
      state.visual = weather.visual();

      camera.update(dt, state.realTime);
      state.basis = camera.basis(renderer.width / Math.max(1, renderer.height));
      state.steps = steps;
      state.layers = Math.max(2, Math.min(4, Math.round(2 + params.density * 2.25)));

      renderer.render(state);
      adapt(dt);

      perf.hud -= dt;
      if (perf.hud <= 0) {
        perf.hud = 0.35;
        ui.updateHud({
          windSpeed: weather.windSpeed,
          bz: weather.bz,
          coupling: weather.coupling,
          activity: weather.activity,
          kp: weather.kp,
          phase: weather.label(),
        });
      }
    }

    // small tuning handle for the console
    window.__aurora = {
      get renderer() { return renderer; },
      get camera() { return camera; },
      get weather() { return weather; },
      get params() { return params; },
      state,
      triggerSubstorm: () => weather.trigger(),
      setQuality(name) {
        if (!config.quality[name]) return;
        qualityName = name;
        preset = config.quality[name];
        scale = preset.auroraScale;
        steps = preset.steps;
        renderer.setAuroraScale(scale);
        ui.setQualityLabel(qualityName, scale, steps);
      },
    };

    // Let the loading screen paint before the synchronous noise build.
    setTimeout(boot, 60);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
