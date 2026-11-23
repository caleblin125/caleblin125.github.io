/* ------------------------------------------------------------------
   Render pipeline.

   Pass 1  aurora volume   -> half-res RGBA16F
   Pass 2  bloom extract   -> 1/2 res
   Pass 3  blur H/V        -> 1/2 and 1/4 res
   Pass 4  scene composite -> canvas (sky + aurora + bloom + terrain)

   All targets are allocated on resize; nothing is allocated per frame.
   ------------------------------------------------------------------ */
(function () {
  "use strict";
  const Aurora = (window.Aurora = window.Aurora || {});

  class Renderer {
    constructor(canvas, noiseData) {
      this.canvas = canvas;
      const capture = /[?&]capture=1/.test(location.search);
      const gl = canvas.getContext("webgl2", {
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        premultipliedAlpha: false,
        powerPreference: "high-performance",
        preserveDrawingBuffer: capture,
      });
      if (!gl) throw new Error("WEBGL2_UNAVAILABLE");
      this.gl = gl;

      this.hdr = !!gl.getExtension("EXT_color_buffer_float") && !/[?&]ldr=1/.test(location.search);
      gl.getExtension("OES_texture_float_linear");

      const C = Aurora.Config;
      this.auroraScale = C.quality.high.auroraScale;
      this.width = 1;
      this.height = 1;
      this.auroraWidth = 1;
      this.auroraHeight = 1;

      this.programs = {
        aurora: new Aurora.GL.Program(gl, Aurora.Shaders.vertex, Aurora.Shaders.aurora, "aurora"),
        scene: new Aurora.GL.Program(
          gl, Aurora.Shaders.vertex, Aurora.Shaders.prelude + Aurora.Shaders.scene, "scene"
        ),
        extract: new Aurora.GL.Program(gl, Aurora.Shaders.vertex, Aurora.Shaders.bloomExtract, "extract"),
        blur: new Aurora.GL.Program(gl, Aurora.Shaders.vertex, Aurora.Shaders.blur, "blur"),
        downsample: new Aurora.GL.Program(gl, Aurora.Shaders.vertex, Aurora.Shaders.downsample, "downsample"),
      };

      this.vao = Aurora.GL.fullscreenVAO(gl);
      this.noiseTex = Aurora.GL.noiseTexture(gl, C.noise.size, noiseData);

      this.targets = null;
      this.drawCalls = 0;

      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.BLEND);
      gl.disable(gl.CULL_FACE);
    }

    _allocTargets() {
      const gl = this.gl;
      if (this.targets) {
        for (const key of Object.keys(this.targets)) Aurora.GL.destroyTarget(gl, this.targets[key]);
        this.targets = null;
      }
      const w = this.width;
      const h = this.height;
      const aw = Math.max(2, Math.round(w * this.auroraScale));
      const ah = Math.max(2, Math.round(h * this.auroraScale));
      this.auroraWidth = aw;
      this.auroraHeight = ah;
      const hdr = this.hdr;
      this.targets = {
        aurora: Aurora.GL.createTarget(gl, aw, ah, hdr),
        bloomA: Aurora.GL.createTarget(gl, Math.round(w * 0.5), Math.round(h * 0.5), hdr),
        bloomTmp: Aurora.GL.createTarget(gl, Math.round(w * 0.5), Math.round(h * 0.5), hdr),
        bloomB: Aurora.GL.createTarget(gl, Math.round(w * 0.25), Math.round(h * 0.25), hdr),
        bloomTmpB: Aurora.GL.createTarget(gl, Math.round(w * 0.25), Math.round(h * 0.25), hdr),
      };
    }

    resize() {
      const gl = this.gl;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      let w = Math.max(2, Math.round(this.canvas.clientWidth * dpr));
      let h = Math.max(2, Math.round(this.canvas.clientHeight * dpr));

      // Cap the pixel count on very large displays; the scene is soft
      // enough that this is invisible but saves a lot of fill rate.
      const maxPixels = 3.7e6;
      if (w * h > maxPixels) {
        const s = Math.sqrt(maxPixels / (w * h));
        w = Math.round(w * s);
        h = Math.round(h * s);
      }
      if (w === this.width && h === this.height && this.targets) return;
      this.width = w;
      this.height = h;
      this.canvas.width = w;
      this.canvas.height = h;
      this._allocTargets();
      gl.viewport(0, 0, w, h);
    }

    setAuroraScale(scale) {
      const clamped = Math.max(0.24, Math.min(1.0, scale));
      if (Math.abs(clamped - this.auroraScale) < 0.006) return false;
      this.auroraScale = clamped;
      if (!this.width) return false;
      const aw = Math.max(2, Math.round(this.width * clamped));
      const ah = Math.max(2, Math.round(this.height * clamped));
      if (aw === this.auroraWidth && ah === this.auroraHeight) return false;
      this.auroraWidth = aw;
      this.auroraHeight = ah;
      Aurora.GL.resizeTarget(this.gl, this.targets.aurora, aw, ah);
      return true;
    }

    _bindTarget(target) {
      const gl = this.gl;
      gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.fbo : null);
      gl.viewport(0, 0, target ? target.width : this.width, target ? target.height : this.height);
      this.drawCalls++;
    }

    _draw() {
      this.gl.drawArrays(this.gl.TRIANGLES, 0, 3);
    }

    render(state) {
      const gl = this.gl;
      const t = this.targets;
      if (!t) return;

      const cam = state.basis;
      const v = state.visual;
      const p = state.params;

      /* ---------------- aurora volume ---------------- */
      this._bindTarget(t.aurora);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      const aurora = this.programs.aurora.use();
      aurora
        .v3a("uCamPos", cam.pos)
        .v3a("uFwd", cam.forward)
        .v3a("uRight", cam.right)
        .v3a("uUp", cam.up)
        .f("uTanHalf", cam.tanHalfFov)
        .f("uAspect", cam.aspect)
        .f("uTime", state.simTime)
        .f("uIntensity", p.intensity)
        .f("uTurbulence", p.turbulence)
        .f("uDensity", p.density)
        .f("uColorBias", p.color)
        .f("uFlow", v.flow)
        .f("uActivity", v.activity)
        .f("uActivitySlow", v.activitySlow)
        .f("uEnergy", v.energy)
        .f("uSurge", v.surge)
        .f("uWidthScale", Math.min(1.85, Math.max(1.0, 56 / state.steps)))
        .i("uSteps", state.steps)
        .i("uLayers", state.layers)
        .f("uBaseAlt", Aurora.Config.world.baseAlt)
        .f("uAltSpan", Aurora.Config.world.topAlt - Aurora.Config.world.baseAlt)
        .f("uSlabTop", Aurora.Config.world.slabTop)
        .f("uBaseZ", Aurora.Config.world.curtainBaseZ)
        .f("uSpacing", Aurora.Config.world.curtainSpacing)
        .f("uNearZ", Aurora.Config.world.nearZ)
        .f("uFarZ", Aurora.Config.world.farZ)
        .f("uHalfWidth", Aurora.Config.world.halfWidth)
        .tex3("uNoise", this.noiseTex, 0);
      this._draw();

      /* ---------------- bloom ---------------- */
      const bloom = Aurora.Config.bloom;
      const threshold = this.hdr ? bloom.threshold : 0.16;

      this._bindTarget(t.bloomA);
      gl.clear(gl.COLOR_BUFFER_BIT);
      const extract = this.programs.extract.use();
      extract
        .tex("uSrc", t.aurora.tex, 0)
        .v2("uTexel", 1 / Math.max(1, this.auroraWidth), 1 / Math.max(1, this.auroraHeight))
        .f("uThreshold", threshold)
        .f("uKnee", bloom.knee)
        .f("uGain", this.hdr ? 1.0 : 1.6);
      this._draw();

      const blur = this.programs.blur;
      this._bindTarget(t.bloomTmp);
      blur.use()
        .tex("uSrc", t.bloomA.tex, 0)
        .v2("uTexel", 1 / t.bloomA.width, 1 / t.bloomA.height)
        .v2("uDir", 1, 0);
      this._draw();

      this._bindTarget(t.bloomA);
      blur.use()
        .tex("uSrc", t.bloomTmp.tex, 0)
        .v2("uTexel", 1 / t.bloomTmp.width, 1 / t.bloomTmp.height)
        .v2("uDir", 0, 1);
      this._draw();

      this._bindTarget(t.bloomB);
      gl.clear(gl.COLOR_BUFFER_BIT);
      this.programs.downsample.use()
        .tex("uSrc", t.bloomA.tex, 0)
        .v2("uTexel", 1 / t.bloomA.width, 1 / t.bloomA.height);
      this._draw();

      this._bindTarget(t.bloomTmpB);
      blur.use()
        .tex("uSrc", t.bloomB.tex, 0)
        .v2("uTexel", 1 / t.bloomB.width, 1 / t.bloomB.height)
        .v2("uDir", 1, 0);
      this._draw();

      this._bindTarget(t.bloomB);
      blur.use()
        .tex("uSrc", t.bloomTmpB.tex, 0)
        .v2("uTexel", 1 / t.bloomTmpB.width, 1 / t.bloomTmpB.height)
        .v2("uDir", 0, 1);
      this._draw();

      /* ---------------- final scene ---------------- */
      this._bindTarget(null);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      const scene = this.programs.scene.use();
      scene
        .tex("uAurora", t.aurora.tex, 0)
        .tex("uBloomA", t.bloomA.tex, 1)
        .tex("uBloomB", t.bloomB.tex, 2)
        .tex3("uNoise", this.noiseTex, 3)
        .v3a("uFwd", cam.forward)
        .v3a("uRight", cam.right)
        .v3a("uUp", cam.up)
        .f("uTanHalf", cam.tanHalfFov)
        .f("uAspect", cam.aspect)
        .f("uTime", state.realTime)
        .f("uExposure", p.exposure)
        .f("uActivity", v.activity)
        .f("uBloomStrength", bloom.strength)
        .f("uBloomWide", bloom.wideStrength);
      this._draw();

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
  }

  Aurora.Renderer = Renderer;
})();
