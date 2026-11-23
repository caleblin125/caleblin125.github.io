/* ------------------------------------------------------------------
   Tileable 3D value-noise volume.

   One RGBA8 texture packs four independent noise fields whose lattice
   periods differ (default 4, 8, 16, 8). A single texture fetch therefore
   returns large, medium and fine spatial scales at once — cheap fbm for
   the volumetic shader.  The volume is generated once at startup.
   ------------------------------------------------------------------ */
(function () {
  "use strict";
  const Aurora = (window.Aurora = window.Aurora || {});

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const smooth = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  const lerp = (a, b, t) => a + (b - a) * t;

  function buildLattice(period, seed) {
    const rnd = mulberry32(seed);
    const n = period * period * period;
    const values = new Float32Array(n);
    for (let i = 0; i < n; i++) values[i] = rnd();
    return values;
  }

  function sampleLattice(lattice, period, x, y, z) {
    const fx = x * period;
    const fy = y * period;
    const fz = z * period;
    const ix = Math.floor(fx);
    const iy = Math.floor(fy);
    const iz = Math.floor(fz);
    const tx = smooth(fx - ix);
    const ty = smooth(fy - iy);
    const tz = smooth(fz - iz);

    const x0 = ((ix % period) + period) % period;
    const y0 = ((iy % period) + period) % period;
    const z0 = ((iz % period) + period) % period;
    const x1 = (x0 + 1) % period;
    const y1 = (y0 + 1) % period;
    const z1 = (z0 + 1) % period;

    const p2 = period * period;
    const a000 = lattice[z0 * p2 + y0 * period + x0];
    const a100 = lattice[z0 * p2 + y0 * period + x1];
    const a010 = lattice[z0 * p2 + y1 * period + x0];
    const a110 = lattice[z0 * p2 + y1 * period + x1];
    const a001 = lattice[z1 * p2 + y0 * period + x0];
    const a101 = lattice[z1 * p2 + y0 * period + x1];
    const a011 = lattice[z1 * p2 + y1 * period + x0];
    const a111 = lattice[z1 * p2 + y1 * period + x1];

    const x00 = lerp(a000, a100, tx);
    const x10 = lerp(a010, a110, tx);
    const x01 = lerp(a001, a101, tx);
    const x11 = lerp(a011, a111, tx);
    return lerp(lerp(x00, x10, ty), lerp(x01, x11, ty), tz);
  }

  Aurora.Noise = {
    /**
     * @param {number} size   edge length (power of two, default 64)
     * @param {number[]} periods lattice periods for R,G,B,A channels
     * @param {number} seed
     * @returns {Uint8Array} RGBA8 voxels
     */
    generate(size, periods, seed) {
      const data = new Uint8Array(size * size * size * 4);
      const lattices = periods.map((p, i) => buildLattice(p, seed + i * 7919));
      const inv = 1 / size;
      let index = 0;

      for (let z = 0; z < size; z++) {
        const zz = (z + 0.5) * inv;
        for (let y = 0; y < size; y++) {
          const yy = (y + 0.5) * inv;
          for (let x = 0; x < size; x++) {
            const xx = (x + 0.5) * inv;
            for (let c = 0; c < 4; c++) {
              const v = sampleLattice(lattices[c], periods[c], xx, yy, zz);
              data[index++] = (v * 255) | 0;
            }
          }
        }
      }
      return data;
    },
  };
})();
