#version 300 es

// Full-screen triangle generated from gl_VertexID.
// No vertex buffers, no attributes: the fragment shader owns the whole frame.
void main() {
    vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
    gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}
