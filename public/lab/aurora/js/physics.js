/* ------------------------------------------------------------------
   Space-weather model (deliberately simplified but physically ordered).

     solar wind  ->  IMF coupling  ->  magnetospheric energy storage
                 ->  substorm onset ->  particle precipitation

   The renderer never reads raw solar-wind values directly: they are
   reduced to an activity level and a substorm envelope, which modulate
   emission brightness, filament contrast and palette warmth.
   ------------------------------------------------------------------ */
(function () {
  "use strict";
  const Aurora = (window.Aurora = window.Aurora || {});

  const PHASES = ["QUIET", "GROWTH", "EXPANSION", "RECOVERY"];
  const PHASE_IDLE = 0, PHASE_GROWTH = 1, PHASE_EXPANSION = 2, PHASE_RECOVERY = 3;

  class SpaceWeather {
    constructor() {
      this.t = 0;
      this.windSpeed = 430;
      this.density = 5.2;
      this.bz = -2;
      this.kp = 2.5;
      this.coupling = 0.3;
      this.base = 0.24;
      this.activity = 0.3;      // fast emission signal (green)
      this.activitySlow = 0.3;  // slow emission signal (red O(1D))
      this.energy = 0.25;       // precipitation hardness proxy (N2/N2+)
      this.stored = 0;          // magnetospheric energy available for onset
      this.env = 0;
      this.surge = 0;
      this.phase = PHASE_IDLE;
      this.phaseT = 0;
      this.duration = 0;
      this.cooldown = 10;
      this.auto = true;
      this.boost = 0;
      this.nextAuto = 24 + Math.random() * 8;
      this._out = {
        activity: 0.3, activitySlow: 0.3, energy: 0.25,
        surge: 0, speed: 1, flow: 0.85,
      };
    }

    trigger() {
      if (this.phase === PHASE_IDLE) {
        this._enter(PHASE_GROWTH, 7 + Math.random() * 5);
        return true;
      }
      if (this.phase === PHASE_GROWTH || this.phase === PHASE_EXPANSION) {
        // Second surge while the substorm is already running.
        this.boost = Math.min(0.5, this.boost + 0.25);
        this.phaseT = Math.min(this.phaseT, 0.4);
        return true;
      }
      if (this.phase === PHASE_RECOVERY) {
        this._enter(PHASE_GROWTH, 5 + Math.random() * 4);
        return true;
      }
      return false;
    }

    _enter(phase, duration) {
      this.phase = phase;
      this.phaseT = 0;
      this.duration = duration;
    }

    _advance(dt) {
      this.phaseT += dt;
      if (this.phaseT < this.duration) return;

      if (this.phase === PHASE_GROWTH) {
        this._enter(PHASE_EXPANSION, 18 + Math.random() * 14);
      } else if (this.phase === PHASE_EXPANSION) {
        this._enter(PHASE_RECOVERY, 22 + Math.random() * 16);
      } else if (this.phase === PHASE_RECOVERY) {
        this._enter(PHASE_IDLE, 0);
        this.cooldown = 10 + Math.random() * 12;
        // Later substorms are spaced so the quiet sky gets time to read.
        this.nextAuto = this.t + 42 + Math.random() * 30;
        this.boost = 0;
      }
    }

    update(dt) {
      this.t += dt;
      const t = this.t;

      /* ---------- solar wind ---------- */
      this.windSpeed =
        405 +
        46 * Math.sin(t * 0.0131 + 0.4) +
        24 * Math.sin(t * 0.0297 + 1.9) +
        12 * Math.sin(t * 0.071 + 4.2);
      this.density =
        4.8 +
        1.9 * Math.sin(t * 0.0173 + 2.2) +
        0.8 * Math.sin(t * 0.051 + 0.7);
      this.bz =
        -1.6 +
        2.9 * Math.sin(t * 0.0097 + 0.7) +
        1.55 * Math.sin(t * 0.0233 + 2.4) +
        0.65 * Math.sin(t * 0.061 + 5.1);

      /* Dayside reconnection proxy: southward IMF and high speed couple
         more energy into the magnetosphere. */
      const southward = Math.max(0, -this.bz) / 8;
      const speedTerm = Math.max(0, this.windSpeed - 320) / 260;
      this.coupling = Math.min(1, southward * 0.8 + speedTerm * 0.28);

      /* ---------- substorm cycle ---------- */
      this.cooldown -= dt;
      if (this.phase === PHASE_IDLE && this.auto && this.t > this.nextAuto && this.cooldown <= 0) {
        this._enter(PHASE_GROWTH, 7 + Math.random() * 6);
      }
      this._advance(dt);

      this.boost *= Math.exp(-dt * 0.10);

      let env = 0;
      if (this.phase === PHASE_GROWTH) {
        const p = this.phaseT / Math.max(0.001, this.duration);
        env = 0.28 * p * p;
      } else if (this.phase === PHASE_EXPANSION) {
        const p = this.phaseT / Math.max(0.001, this.duration);
        // Fast onset, then a slowly breathing plateau.
        const attack = Math.min(1, p / 0.14);
        const decay = 1 - Math.max(0, (p - 0.55) / 0.45) * 0.35;
        const breathe = 0.86 + 0.14 * Math.sin(this.phaseT * 1.7) * Math.sin(this.phaseT * 0.63 + 1.1);
        env = attack * decay * breathe;
      } else if (this.phase === PHASE_RECOVERY) {
        const p = Math.min(1, this.phaseT / Math.max(0.001, this.duration));
        env = 0.65 * (1 - p) * (1 - p);
      }
      this.env += (env - this.env) * (1 - Math.exp(-dt / 0.55));
      this.surge = this.env * (0.8 + 0.2 * Math.sin(t * 0.9 + 1.3));

      /* Stored magnetospheric energy: the system loads while the solar wind
         couples and expends the store during expansion and recovery.  This is
         an ordered proxy, not an absolute energy budget. */
      if (this.phase === PHASE_IDLE || this.phase === PHASE_GROWTH) {
        this.stored = Math.min(1, this.stored + dt * (0.010 + 0.070 * this.coupling));
      } else {
        this.stored = Math.max(0, this.stored - dt * (0.035 + 0.20 * this.env));
      }

      this.base = 0.22 + 0.52 * this.coupling;
      const target = Math.min(1, this.base + this.env * 0.66 + this.boost);
      this.activity += (target - this.activity) * (1 - Math.exp(-dt / 0.8));
      this.activitySlow += (target - this.activitySlow) * (1 - Math.exp(-dt / 9.0));

      /* Precipitation hardness proxy.  The expansion phase carries the
         hardest spectra, which is what brightens the nitrogen bands at the
         curtain base. */
      const energyTarget = Math.min(
        1,
        0.10 + 0.52 * this.activity + 0.22 * this.coupling +
        0.30 * this.env * (0.45 + 0.55 * this.stored)
      );
      this.energy += (energyTarget - this.energy) * (1 - Math.exp(-dt / 3.0));

      this.kp = Math.min(9, 0.8 + this.activity * 7.4);
    }

    label() {
      return PHASES[this.phase];
    }

    /** Reused view object, read every frame by the renderer/UI. */
    visual() {
      const speed = 0.72 + this.activity * 0.55 + this.env * 0.55;
      const o = this._out;
      o.activity = this.activity;
      o.activitySlow = this.activitySlow;
      o.energy = this.energy;
      o.surge = this.surge;
      o.speed = speed;
      o.flow = 0.70 + this.activity * 0.55 + this.env * 0.30;
      return o;
    }
  }

  Aurora.SpaceWeather = SpaceWeather;
})();
