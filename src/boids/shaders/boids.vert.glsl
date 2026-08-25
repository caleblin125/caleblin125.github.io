#version 300 es

precision highp float;

const vec2 vertices[6] = vec2[6](
    vec2(-0.022, 0.016), vec2(0.026, 0.0), vec2(-0.022, 0.005),
    vec2(-0.022, -0.016), vec2(-0.022, -0.005), vec2(0.026, 0.0)
);
in vec2 position;
in float angle;
in vec3 boidColor;
in float boidScale;
out vec3 color;

void main() {
    vec2 vertex = vertices[gl_VertexID];
    float sine = sin(angle);
    float cosine = cos(angle);
    vec2 rotated = vec2(vertex.x * cosine - vertex.y * sine, vertex.x * sine + vertex.y * cosine) * boidScale;
    gl_Position = vec4(position + rotated, 0.0, 1.0);
    color = boidColor;
}