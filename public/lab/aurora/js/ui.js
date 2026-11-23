/* ------------------------------------------------------------------
   DOM controls.  Parameters are mutated in place; the main loop reads
   them every frame, so every control is live with no apply step.
   ------------------------------------------------------------------ */
(function () {
  "use strict";
  const Aurora = (window.Aurora = window.Aurora || {});

  const $ = (id) => document.getElementById(id);

  class UI {
    constructor(params, callbacks) {
      this.params = params;
      this.cb = callbacks;
      this.hidden = false;
      this.interacted = false;
      this._buildSliders();
      this._bindButtons();
      this._syncButtons();
      this._bindKeyboard();
      this._bindPanel();
      this._fadeTimer = setTimeout(() => this._fadeHint(), 14000);
    }

    _buildSliders() {
      const p = this.params;
      const slider = (id, key, out, format, onChange) => {
        const input = $("in-" + id);
        const output = $("out-" + out);
        const apply = () => {
          const value = parseFloat(input.value);
          p[key] = value;
          if (output) output.textContent = format(value);
          const min = parseFloat(input.min);
          const max = parseFloat(input.max);
          input.style.setProperty("--fill", ((value - min) / (max - min)) * 100 + "%");
          if (onChange) onChange(value);
        };
        input.addEventListener("input", apply);
        input.value = p[key];
        apply();
      };

      slider("intensity", "intensity", "intensity", (v) => v.toFixed(2));
      slider("turbulence", "turbulence", "turbulence", (v) => v.toFixed(2));
      slider("density", "density", "density", (v) => v.toFixed(2));
      slider("color", "color", "color", (v) => v.toFixed(2));
      slider("speed", "speed", "speed", (v) => v.toFixed(2) + "×");
      slider("exposure", "exposure", "exposure", (v) => v.toFixed(2));
    }

    _bindButtons() {
      const p = this.params;

      $("btn-substorm").addEventListener("click", () => {
        this.cb.substorm();
        this._flashSubstorm();
      });

      const pause = $("btn-pause");
      pause.addEventListener("click", () => {
        p.paused = !p.paused;
        pause.setAttribute("aria-pressed", String(p.paused));
        pause.textContent = p.paused ? "Resume" : "Pause";
      });

      const cam = $("btn-camera");
      cam.addEventListener("click", () => {
        p.autoCamera = !p.autoCamera;
        cam.setAttribute("aria-pressed", String(p.autoCamera));
        this.cb.setAutoCamera(p.autoCamera);
      });

      $("btn-reset").addEventListener("click", () => {
        this.cb.resetView();
      });

      $("btn-quality").addEventListener("click", () => {
        this.cb.cycleQuality();
      });

      $("in-auto-quality").addEventListener("change", (e) => {
        p.autoQuality = e.target.checked;
        this.cb.setAutoQuality(p.autoQuality);
      });
    }

    _syncButtons() {
      const p = this.params;
      $("btn-pause").setAttribute("aria-pressed", String(p.paused));
      $("btn-pause").textContent = p.paused ? "Resume" : "Pause";
      $("btn-camera").setAttribute("aria-pressed", String(p.autoCamera));
      $("in-auto-quality").checked = p.autoQuality;
    }

    _bindPanel() {
      const panel = $("panel");
      const toggle = $("panel-toggle");
      toggle.addEventListener("click", () => {
        const collapsed = panel.classList.toggle("collapsed");
        toggle.setAttribute("aria-expanded", String(!collapsed));
      });
      if (window.innerWidth < 720) panel.classList.add("collapsed");
    }

    _bindKeyboard() {
      window.addEventListener("keydown", (e) => {
        const tag = (e.target.tagName || "").toLowerCase();
        if (tag === "input" || tag === "textarea" || tag === "select") return;
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        const key = e.key.toLowerCase();
        if (key === "h") {
          this.hidden = !this.hidden;
          document.body.classList.toggle("ui-hidden", this.hidden);
        } else if (key === " ") {
          e.preventDefault();
          $("btn-pause").click();
        } else if (key === "s") {
          $("btn-substorm").click();
        } else if (key === "r") {
          this.cb.resetView();
        } else if (key === "q") {
          this.cb.cycleQuality();
        }
      });
    }

    _flashSubstorm() {
      const btn = $("btn-substorm");
      btn.classList.add("fired");
      setTimeout(() => btn.classList.remove("fired"), 600);
    }

    _markInteracted() {
      if (this.interacted) return;
      this.interacted = true;
      clearTimeout(this._fadeTimer);
      this._fadeTimer = setTimeout(() => this._fadeHint(), 6000);
    }

    _fadeHint() {
      if (window.innerWidth > 720) $("hint").classList.add("faded");
    }

    setQualityLabel(name, scale, steps) {
      $("btn-quality").textContent = "Quality: " + name;
      $("res-label").textContent =
        Math.round(scale * 100) + "% · " + steps + " steps";
    }

    updateHud(data) {
      $("sw-speed").textContent = Math.round(data.windSpeed) + " km/s";
      $("sw-bz").textContent = data.bz.toFixed(1) + " nT";
      $("sw-coupling").textContent = data.coupling.toFixed(2);
      $("activity-fill").style.width = Math.round(data.activity * 100) + "%";
      $("activity-label").textContent = "GEOMAGNETIC ACTIVITY · " + Math.round(data.activity * 100);
      $("kp-label").textContent = "KP " + data.kp.toFixed(1);
      $("phase-label").textContent = data.phase;

      const active = data.phase === "EXPANSION" || data.phase === "GROWTH";
      $("btn-substorm-label").textContent = active ? "Intensify substorm" : "Trigger substorm";
      $("btn-substorm").classList.toggle("active", active);
    }

    setFps(fps) {
      $("fps-label").textContent = Math.round(fps) + " FPS";
    }

    hideLoading() {
      const el = $("loading");
      el.classList.add("done");
      setTimeout(() => { el.style.display = "none"; }, 1000);
    }
  }

  Aurora.UI = UI;
})();
