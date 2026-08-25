// ============================================================================
// VERTEX SHADER TEMPLATE — WebGL2 / GLSL ES 3.00
// ============================================================================
// Copy this file into src/<viz>/shaders/<name>.vert.glsl and import it from
// the renderer as a raw string so Vite inlines it at build time:
//
//     import vertexSource from "./shaders/<name>.vert.glsl?raw";
//
// Existing vertex shaders to use as references:
//   • src/boids/shaders/boids.vert.glsl   — instanced chevron, rotate/scale
//   • src/boids/shaders/fade.vert.glsl    — trivial fullscreen triangle
//   • src/chaos/shaders/vertex.glsl       — instanced points, per-instance
//                                           orbit iteration (gl_InstanceID)
// ============================================================================

// GLSL ES 3.00 is REQUIRED — the whole site targets WebGL2 (the renderers call
// canvas.getContext("webgl2")). Never drop this line.
#version 300 es

// Vertex shaders must declare a default precision for `float`.
precision highp float;

// ----------------------------------------------------------------------------
// Attributes (per-vertex input) — fed from the renderer via a VBO
// ----------------------------------------------------------------------------
// Declare one `in` per attribute the renderer uploads. The renderer links them
// by NAME, so the names here must match the strings passed to
// gl.getAttribLocation(this.program, "<name>"):
//
//     in vec2 position;    // example: position attribute
//     in vec3 boidColor;   // example: per-instance color
//
// For instanced data the renderer calls gl.vertexAttribDivisor(location, 1)
// so the attribute advances once per instance instead of per vertex.

// ----------------------------------------------------------------------------
// Uniforms (constant for the whole draw call)
// ----------------------------------------------------------------------------
// Set from TypeScript with gl.uniform*() using the same name:
//     uniform vec2 resolution;
//     uniform float zoom;

// ----------------------------------------------------------------------------
// Varyings (outputs passed to the fragment shader)
// ----------------------------------------------------------------------------
// Anything the fragment shader reads must be declared here with `out` and
// written in main(). Name and type must match the fragment shader's `in`.
// out vec3 color;

void main() {
    // ------------------------------------------------------------------------
    // Compute gl_Position (clip space, x/y in [-1, 1]).
    // ------------------------------------------------------------------------
    // Simple passthrough (like fade.vert.glsl):
    //     gl_Position = vec4(position, 0.0, 1.0);
    //
    // With per-instance transform (like boids.vert.glsl, which rotates a
    // constant 6-vertex chevron by `angle` and scales it by `boidScale`):
    //     vec2 vertex = vertices[gl_VertexID];
    //     gl_Position = vec4(position + rotatedVertex * boidScale, 0.0, 1.0);
    //
    // gl_VertexID / gl_InstanceID are available in GLSL ES 3.00:
    //   • gl_VertexID   — index of this vertex (0..vertexCount-1)
    //   • gl_InstanceID — index of this instance (0..instanceCount-1)

    // ------------------------------------------------------------------------
    // Optional: set gl_PointSize for GL_POINTS draws (chaos renderer uses 1.4).
    // ------------------------------------------------------------------------

    // ------------------------------------------------------------------------
    // Write the varyings the fragment shader expects:
    //     color = boidColor;
    // ------------------------------------------------------------------------

    // Placeholder so the shader compiles before you fill it in.
    gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
}
