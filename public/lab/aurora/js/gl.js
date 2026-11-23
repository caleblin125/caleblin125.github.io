/* ------------------------------------------------------------------
   Thin WebGL2 helpers: programs with cached uniform locations, a
   fullscreen-triangle VAO, 3D noise textures and HDR render targets.
   ------------------------------------------------------------------ */
(function () {
  "use strict";
  const Aurora = (window.Aurora = window.Aurora || {});

  function compile(gl, type, source, label) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error("Shader compile failed (" + label + "):\n" + log);
    }
    return shader;
  }

  class Program {
    constructor(gl, vs, fs, label) {
      this.gl = gl;
      this.label = label;
      const v = compile(gl, gl.VERTEX_SHADER, vs, label + ":vs");
      const f = compile(gl, gl.FRAGMENT_SHADER, fs, label + ":fs");
      const p = gl.createProgram();
      gl.attachShader(p, v);
      gl.attachShader(p, f);
      gl.linkProgram(p);
      gl.deleteShader(v);
      gl.deleteShader(f);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
        const log = gl.getProgramInfoLog(p);
        gl.deleteProgram(p);
        throw new Error("Program link failed (" + label + "):\n" + log);
      }
      this.program = p;
      this._loc = Object.create(null);
    }

    use() {
      this.gl.useProgram(this.program);
      return this;
    }

    loc(name) {
      let l = this._loc[name];
      if (l === undefined) {
        l = this.gl.getUniformLocation(this.program, name);
        this._loc[name] = l;
      }
      return l;
    }

    f(name, v) {
      const l = this.loc(name);
      if (l) this.gl.uniform1f(l, v);
      return this;
    }
    i(name, v) {
      const l = this.loc(name);
      if (l) this.gl.uniform1i(l, v);
      return this;
    }
    v2(name, x, y) {
      const l = this.loc(name);
      if (l) this.gl.uniform2f(l, x, y);
      return this;
    }
    v3(name, x, y, z) {
      const l = this.loc(name);
      if (l) this.gl.uniform3f(l, x, y, z);
      return this;
    }
    v3a(name, a) {
      const l = this.loc(name);
      if (l) this.gl.uniform3f(l, a[0], a[1], a[2]);
      return this;
    }
    tex(name, texture, unit) {
      const gl = this.gl;
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      this.i(name, unit);
      return this;
    }
    tex3(name, texture, unit) {
      const gl = this.gl;
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_3D, texture);
      this.i(name, unit);
      return this;
    }
    dispose() {
      this.gl.deleteProgram(this.program);
    }
  }

  function fullscreenVAO(gl) {
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.bindVertexArray(null);
    return vao;
  }

  function noiseTexture(gl, size, data) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_3D, tex);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage3D(
      gl.TEXTURE_3D, 0, gl.RGBA8, size, size, size, 0,
      gl.RGBA, gl.UNSIGNED_BYTE, data
    );
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.REPEAT);
    gl.generateMipmap(gl.TEXTURE_3D);
    gl.bindTexture(gl.TEXTURE_3D, null);
    return tex;
  }

  function createTarget(gl, width, height, hdr) {
    const w = Math.max(2, width | 0);
    const h = Math.max(2, height | 0);
    const tex = gl.createTexture();
    const fbo = gl.createFramebuffer();
    const target = { tex, fbo, width: w, height: h, hdr };
    allocateTarget(gl, target, w, h);
    return target;
  }

  function allocateTarget(gl, target, width, height) {
    const format = target.hdr ? gl.RGBA16F : gl.RGBA8;
    const type = target.hdr ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE;
    target.width = Math.max(2, width | 0);
    target.height = Math.max(2, height | 0);
    gl.bindTexture(gl.TEXTURE_2D, target.tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, format, target.width, target.height, 0, gl.RGBA, type, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, target.tex, 0);
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    return status === gl.FRAMEBUFFER_COMPLETE;
  }

  function resizeTarget(gl, target, width, height) {
    if (target.width === Math.max(2, width | 0) && target.height === Math.max(2, height | 0)) return;
    allocateTarget(gl, target, width, height);
  }

  function destroyTarget(gl, target) {
    gl.deleteTexture(target.tex);
    gl.deleteFramebuffer(target.fbo);
  }

  Aurora.GL = {
    Program,
    fullscreenVAO,
    noiseTexture,
    createTarget,
    resizeTarget,
    destroyTarget,
    allocateTarget,
  };
})();
