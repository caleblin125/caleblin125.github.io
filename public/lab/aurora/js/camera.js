/* ------------------------------------------------------------------
   Ground-level camera with damped look controls and a slow cinematic
   drift.  The camera never moves from the origin; only orientation and
   field of view change, which keeps the aurora at a believable scale.
   ------------------------------------------------------------------ */
(function () {
  "use strict";
  const Aurora = (window.Aurora = window.Aurora || {});
  const C = () => Aurora.Config.camera;

  class Camera {
    constructor(canvas) {
      this.canvas = canvas;
      const cfg = C();
      this.baseYaw = cfg.yaw;
      this.basePitch = cfg.pitch;
      this.yaw = cfg.yaw;
      this.pitch = cfg.pitch;
      this.fov = cfg.fov;
      this.targetFov = cfg.fov;
      this.auto = Aurora.Config.defaults.autoCamera;
      this.dragging = false;
      this.pointerId = null;
      this.lastX = 0;
      this.lastY = 0;
      this.lastMoveT = 0;
      this.velYaw = 0;
      this.velPitch = 0;
      this.spinYaw = 0;
      this.spinPitch = 0;
      this.pointers = new Map();
      this.pinchDist = 0;
      this.swayYaw = 0;
      this.swayPitch = 0;
      this._basis = {
        pos: cfg.position.slice(),
        forward: [0, 0, 1],
        right: [1, 0, 0],
        up: [0, 1, 0],
        tanHalfFov: Math.tan(cfg.fov * 0.5),
        aspect: 1,
      };
      this._bind();
    }

    _bind() {
      const el = this.canvas;
      el.addEventListener("pointerdown", (e) => {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        try { el.setPointerCapture(e.pointerId); } catch (_) {}

        if (this.pointers.size === 1) {
          this.dragging = true;
          this.pointerId = e.pointerId;
          this.lastX = e.clientX;
          this.lastY = e.clientY;
          this.lastMoveT = performance.now();
          this.velYaw = 0;
          this.velPitch = 0;
          this.spinYaw = 0;
          this.spinPitch = 0;
          el.classList.add("dragging");
        } else if (this.pointers.size === 2) {
          this.dragging = false;
          this.pinchDist = this._pinchDistance();
          this.spinYaw = 0;
          this.spinPitch = 0;
        }
      });

      el.addEventListener("pointermove", (e) => {
        if (!this.pointers.has(e.pointerId)) return;
        this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

        if (this.pointers.size >= 2) {
          const d = this._pinchDistance();
          if (this.pinchDist > 0 && d > 0) {
            const cfg = C();
            this.targetFov = Math.max(
              cfg.minFov,
              Math.min(cfg.maxFov, this.targetFov * (this.pinchDist / d))
            );
          }
          this.pinchDist = d;
          return;
        }

        if (!this.dragging || e.pointerId !== this.pointerId) return;
        const now = performance.now();
        const dx = e.clientX - this.lastX;
        const dy = e.clientY - this.lastY;
        const dtm = Math.max(0.008, (now - this.lastMoveT) / 1000);
        this.lastMoveT = now;
        this.lastX = e.clientX;
        this.lastY = e.clientY;
        const sens = (this.fov / Math.max(360, window.innerHeight)) * 1.55;
        this.baseYaw -= dx * sens;
        this.basePitch += dy * sens;
        this.velYaw = (-dx * sens) / dtm;
        this.velPitch = (dy * sens) / dtm;
        const cfg = C();
        this.baseYaw = Math.max(-2.3, Math.min(2.3, this.baseYaw));
        this.basePitch = Math.max(cfg.minPitch, Math.min(cfg.maxPitch, this.basePitch));
      });

      const end = (e) => {
        if (!this.pointers.has(e.pointerId)) return;
        this.pointers.delete(e.pointerId);

        if (this.pointers.size === 1) {
          const next = this.pointers.entries().next().value;
          this.pointerId = next[0];
          this.lastX = next[1].x;
          this.lastY = next[1].y;
          this.lastMoveT = performance.now();
          this.dragging = true;
          this.pinchDist = 0;
          return;
        }
        if (this.pointers.size >= 2) {
          this.pinchDist = this._pinchDistance();
          return;
        }

        this.pinchDist = 0;
        if (e.pointerId !== this.pointerId) return;
        this.dragging = false;
        this.pointerId = null;
        el.classList.remove("dragging");
        this.spinYaw = Math.max(-0.45, Math.min(0.45, this.velYaw * 0.05));
        this.spinPitch = Math.max(-0.30, Math.min(0.30, this.velPitch * 0.05));
        this.velYaw = 0;
        this.velPitch = 0;
      };
      el.addEventListener("pointerup", end);
      el.addEventListener("pointercancel", end);

      el.addEventListener("wheel", (e) => {
        e.preventDefault();
        const cfg = C();
        this.targetFov = Math.max(
          cfg.minFov,
          Math.min(cfg.maxFov, this.targetFov * Math.exp(e.deltaY * 0.00085))
        );
      }, { passive: false });
      el.addEventListener("dblclick", () => this.reset());
    }

    _pinchDistance() {
      const pts = Array.from(this.pointers.values());
      if (pts.length < 2) return 0;
      return Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
    }

    setAuto(on) {
      this.auto = on;
    }

    reset() {
      const cfg = C();
      this.baseYaw = cfg.yaw;
      this.basePitch = cfg.pitch;
      this.targetFov = cfg.fov;
      this.fov = cfg.fov;
      this.spinYaw = 0;
      this.spinPitch = 0;
      this.velYaw = 0;
      this.velPitch = 0;
    }

    update(dt, time) {
      const cfg = C();
      const k = 1 - Math.exp(-dt * 5.0);
      const kSlow = 1 - Math.exp(-dt * 1.2);

      /* A short flick after a drag: the target keeps moving and decays, so
         the view has a little momentum without a physics loop. */
      if (!this.dragging && (Math.abs(this.spinYaw) > 1e-4 || Math.abs(this.spinPitch) > 1e-4)) {
        this.baseYaw = Math.max(-2.3, Math.min(2.3, this.baseYaw + this.spinYaw * dt));
        this.basePitch = Math.max(cfg.minPitch, Math.min(cfg.maxPitch, this.basePitch + this.spinPitch * dt));
        const decay = Math.exp(-dt * 4.2);
        this.spinYaw *= decay;
        this.spinPitch *= decay;
      } else if (this.dragging) {
        this.spinYaw = 0;
        this.spinPitch = 0;
      }

      if (this.auto && !this.dragging) {
        this.swayYaw =
          Math.sin(time * 0.0087 + 0.4) * 0.085 +
          Math.sin(time * 0.0037 + 2.1) * 0.045;
        this.swayPitch = Math.sin(time * 0.0113 + 1.2) * 0.014;
      } else {
        this.swayYaw += (0 - this.swayYaw) * kSlow;
        this.swayPitch += (0 - this.swayPitch) * kSlow;
      }

      const targetYaw = this.baseYaw + this.swayYaw;
      const targetPitch = Math.max(
        cfg.minPitch,
        Math.min(cfg.maxPitch, this.basePitch + this.swayPitch)
      );
      this.yaw += (targetYaw - this.yaw) * k;
      this.pitch += (targetPitch - this.pitch) * k;
      this.fov += (this.targetFov - this.fov) * k;
    }

    basis(aspect) {
      const cy = Math.cos(this.yaw);
      const sy = Math.sin(this.yaw);
      const cp = Math.cos(this.pitch);
      const sp = Math.sin(this.pitch);

      // Yaw around +Y, pitch up.  Looking down +Z at yaw = 0.
      const fx = sy * cp;
      const fy = sp;
      const fz = cy * cp;
      const rx = cy;
      const rz = -sy;

      const b = this._basis;
      b.pos = C().position;
      b.forward[0] = fx; b.forward[1] = fy; b.forward[2] = fz;
      b.right[0] = rx; b.right[1] = 0; b.right[2] = rz;
      // up = forward × right
      b.up[0] = fy * rz - fz * 0;
      b.up[1] = fz * rx - fx * rz;
      b.up[2] = fx * 0 - fy * rx;
      b.tanHalfFov = Math.tan(this.fov * 0.5);
      b.aspect = aspect;
      return b;
    }
  }

  Aurora.Camera = Camera;
})();
