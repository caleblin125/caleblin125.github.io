import fragmentShaderSource from "./shaders/boids.glsl?raw";
import vertexShaderSource from "./shaders/boids.vert.glsl?raw";
import fadeFragmentSource from "./shaders/fade.glsl?raw";
import fadeVertexSource from "./shaders/fade.vert.glsl?raw";

type Species = "prey1" | "prey2" | "predator" | "big";
type Boid = { x: number; y: number; velocityX: number; velocityY: number; species: Species };
type Rules = { separation: number[]; alignment: number[]; cohesion: number[]; mouseFollow: number; maxSpeed: number; acceleration: number; constantAcceleration: number; resistance: number; senseRange: number; senseAngle: number; avoidDistance: number; maxSee: number };

export class BoidsRenderer {
    private static readonly worldWidth = 1150;
    private static readonly worldHeight = 650;
    private static readonly margin = 30;
    private readonly canvas: HTMLCanvasElement;
    private readonly gl: WebGL2RenderingContext;
    private readonly program: WebGLProgram;
    private readonly fadeProgram: WebGLProgram;
    private readonly fadeBuffer: WebGLBuffer;
    private readonly buffers: Record<string, WebGLBuffer>;
    private readonly boids: Boid[] = [];
    private lastTime = 0;
    private simulationTime = 0;
    private mouse = { x: 0, y: 0, active: false };
    private readonly rules: Record<Species, Rules> = {
        prey1: { separation: [35, 1, 9999, 1], alignment: [2.5, -0.5, 1, 1], cohesion: [2, -1, -9999, 0.3], mouseFollow: 0, maxSpeed: 100, acceleration: 700, constantAcceleration: 100, resistance: -3, senseRange: 70, senseAngle: Math.PI, avoidDistance: 30, maxSee: 20 },
        prey2: { separation: [0, 75, 2000, 35], alignment: [0, 4.5, 1, 1], cohesion: [-1, 1, -9999, 1000], mouseFollow: 0, maxSpeed: 200, acceleration: 1000, constantAcceleration: 300, resistance: -7, senseRange: 90, senseAngle: Math.PI, avoidDistance: 10, maxSee: 20 },
        predator: { separation: [-10, -20, 30, 9999], alignment: [0, 0, -1, 1], cohesion: [10, 10, -5, -9999], mouseFollow: 1, maxSpeed: 50, acceleration: 600, constantAcceleration: 300, resistance: -3, senseRange: 150, senseAngle: Math.PI / 2, avoidDistance: 40, maxSee: 10 },
        big: { separation: [0, 0, 0, 40], alignment: [0, 0, 1, -1], cohesion: [1, 0, 10, -40], mouseFollow: 0, maxSpeed: 50, acceleration: 1000, constantAcceleration: 400, resistance: -5, senseRange: 300, senseAngle: Math.PI / 2, avoidDistance: 70, maxSee: 30 }
    };

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const gl = canvas.getContext("webgl2", { preserveDrawingBuffer: true });
        if (!gl) throw new Error("WebGL2 is not supported");
        this.gl = gl;
        this.program = this.createProgram(vertexShaderSource, fragmentShaderSource);
        this.fadeProgram = this.createProgram(fadeVertexSource, fadeFragmentSource);
        this.fadeBuffer = this.createBuffer();
        this.buffers = { position: this.createBuffer(), angle: this.createBuffer(), color: this.createBuffer(), scale: this.createBuffer() };
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        this.createBoids();
    }

    start(): void {
        this.resize();
        window.addEventListener("resize", this.resize);
        this.canvas.addEventListener("pointermove", this.onPointerMove);
        this.canvas.addEventListener("pointerleave", this.onPointerLeave);
        requestAnimationFrame(this.render);
    }

    private resize = (): void => {
        const pixelRatio = window.devicePixelRatio || 1;
        this.canvas.width = Math.floor(this.canvas.clientWidth * pixelRatio);
        this.canvas.height = Math.floor(this.canvas.clientHeight * pixelRatio);
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.gl.clearColor(0.06, 0.03, 0.10, 1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    };

    private render = (time: number): void => {
        const elapsed = this.lastTime === 0 ? 0 : Math.min((time - this.lastTime) / 1000, 0.1);
        this.lastTime = time;
        this.simulationTime += elapsed;
        while (this.simulationTime >= 0.01) {
            for (const boid of this.boids) this.updateBoid(boid, 0.01);
            this.simulationTime -= 0.01;
        }
        this.draw();
        requestAnimationFrame(this.render);
    };

    private createBoids(): void {
        for (let index = 0; index < 2; index++) this.boids.push(this.randomBoid("big"));
        for (let index = 0; index < 7; index++) this.boids.push(this.randomBoid("predator"));
        for (let index = 0; index < 450; index++) this.boids.push(this.randomBoid("prey1"));
        for (let index = 0; index < 30; index++) this.boids.push(this.randomBoid("prey2"));
    }

    private randomBoid(species: Species): Boid {
        const angle = Math.random() * Math.PI * 2;
        const speed = species === "prey2" ? 200 : species === "prey1" ? 100 : 50;
        return { x: Math.random() * BoidsRenderer.worldWidth, y: Math.random() * BoidsRenderer.worldHeight, velocityX: Math.cos(angle) * speed, velocityY: Math.sin(angle) * speed, species };
    }

    private updateBoid(boid: Boid, deltaTime: number): void {
        const currentRules = this.rules[boid.species];
        const speed = Math.hypot(boid.velocityX, boid.velocityY);
        const previousX = boid.x;
        const previousY = boid.y;
        boid.x += boid.velocityX * deltaTime;
        boid.y += boid.velocityY * deltaTime;
        if (speed > currentRules.maxSpeed) this.accelerate(boid, { x: boid.velocityX * (1 - currentRules.maxSpeed / speed) * currentRules.resistance, y: boid.velocityY * (1 - currentRules.maxSpeed / speed) * currentRules.resistance }, deltaTime);
        else if (speed > 0) this.accelerate(boid, { x: boid.velocityX / speed * currentRules.constantAcceleration, y: boid.velocityY / speed * currentRules.constantAcceleration }, deltaTime);
        if (previousX > BoidsRenderer.worldWidth - BoidsRenderer.margin || previousX < BoidsRenderer.margin || previousY > BoidsRenderer.worldHeight - BoidsRenderer.margin || previousY < BoidsRenderer.margin) {
            this.accelerate(boid, this.clamp({ x: BoidsRenderer.worldWidth / 2 - previousX, y: BoidsRenderer.worldHeight / 2 - previousY }, currentRules.acceleration), deltaTime);
            return;
        }

        const target = { x: 0, y: 0 };
        const center = { x: 0, y: 0 };
        const averageVelocity = { x: 0, y: 0 };
        const away = { x: 0, y: 0 };
        let seen = 0;
        let farSeen = 0;
        let closeSeen = 0;
        for (const other of this.boids) {
            if (seen >= currentRules.maxSee) break;
            if (other === boid) continue;
            const relativeX = other.x - boid.x;
            const relativeY = other.y - boid.y;
            const distance = Math.hypot(relativeX, relativeY);
            const direction = speed === 0 || distance === 0 ? Math.PI : Math.acos((relativeX * boid.velocityX + relativeY * boid.velocityY) / distance / speed);
            if (distance >= currentRules.senseRange || direction >= currentRules.senseAngle) continue;
            const speciesIndex = this.speciesIndex(other.species);
            seen += 1;
            averageVelocity.x += other.velocityX * currentRules.alignment[speciesIndex];
            averageVelocity.y += other.velocityY * currentRules.alignment[speciesIndex];
            if (distance < currentRules.avoidDistance && distance !== 0) {
                away.x -= relativeX * currentRules.separation[speciesIndex];
                away.y -= relativeY * currentRules.separation[speciesIndex];
                closeSeen += 1;
            } else {
                center.x += relativeX * currentRules.cohesion[speciesIndex];
                center.y += relativeY * currentRules.cohesion[speciesIndex];
                farSeen += 1;
            }
            if (boid.species === "predator" && (other.species === "prey1" || other.species === "prey2") && distance < 25) this.reset(other);
        }
        averageVelocity.x -= boid.velocityX;
        averageVelocity.y -= boid.velocityY;
        if (farSeen > 0) { target.x += center.x / farSeen; target.y += center.y / farSeen; }
        if (seen > 0) { target.x += averageVelocity.x / seen; target.y += averageVelocity.y / seen; }
        if (closeSeen > 0) { target.x += away.x / closeSeen; target.y += away.y / closeSeen; }
        if (currentRules.mouseFollow && this.mouse.active) { target.x += (this.mouse.x - boid.x) * currentRules.mouseFollow; target.y += (this.mouse.y - boid.y) * currentRules.mouseFollow; }
        this.accelerate(boid, this.clamp(target, currentRules.acceleration), deltaTime);
    }

    private reset(boid: Boid): void {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.hypot(BoidsRenderer.worldWidth, BoidsRenderer.worldHeight) / 2;
        boid.x = BoidsRenderer.worldWidth / 2 + Math.cos(angle) * radius;
        boid.y = BoidsRenderer.worldHeight / 2 + Math.sin(angle) * radius;
    }

    private accelerate(boid: Boid, acceleration: { x: number; y: number }, deltaTime: number): void { boid.velocityX += acceleration.x * deltaTime; boid.velocityY += acceleration.y * deltaTime; }
    private clamp(vector: { x: number; y: number }, maximum: number): { x: number; y: number } { const magnitude = Math.hypot(vector.x, vector.y); return magnitude === 0 || magnitude <= maximum ? vector : { x: vector.x / magnitude * maximum, y: vector.y / magnitude * maximum }; }
    private speciesIndex(species: Species): number { return species === "prey1" ? 0 : species === "prey2" ? 1 : species === "predator" ? 2 : 3; }

    private draw(): void {
        const positions = new Float32Array(this.boids.length * 2);
        const angles = new Float32Array(this.boids.length);
        const colors = new Float32Array(this.boids.length * 3);
        const scales = new Float32Array(this.boids.length);
        for (let index = 0; index < this.boids.length; index++) {
            const boid = this.boids[index];
            positions[index * 2] = boid.x / BoidsRenderer.worldWidth * 2 - 1;
            positions[index * 2 + 1] = 1 - boid.y / BoidsRenderer.worldHeight * 2;
            angles[index] = Math.atan2(-boid.velocityY, boid.velocityX);
            const color = boid.species === "big" ? [1, 0.1, 0.8] : boid.species === "predator" ? [1, 0.1, 0.1] : boid.species === "prey2" ? [0.1, 1, 0.25] : [0.3, 0.55, 1];
            colors.set(color, index * 3);
            scales[index] = boid.species === "big" ? 2.5 : boid.species === "predator" ? 1.5 : 0.5;
        }
        const { gl } = this;
        gl.useProgram(this.fadeProgram);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.fadeBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
        const fadePosition = gl.getAttribLocation(this.fadeProgram, "position");
        gl.enableVertexAttribArray(fadePosition);
        gl.vertexAttribPointer(fadePosition, 2, gl.FLOAT, false, 0, 0);
        gl.vertexAttribDivisor(fadePosition, 0);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        gl.useProgram(this.program);
        this.upload("position", this.buffers.position, positions, 2);
        this.upload("angle", this.buffers.angle, angles, 1);
        this.upload("boidColor", this.buffers.color, colors, 3);
        this.upload("boidScale", this.buffers.scale, scales, 1);
        gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, this.boids.length);
    }

    private upload(attributeName: string, buffer: WebGLBuffer, data: Float32Array, size: number): void { const { gl } = this; const location = gl.getAttribLocation(this.program, attributeName); gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW); gl.enableVertexAttribArray(location); gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0); gl.vertexAttribDivisor(location, 1); }
    private createBuffer(): WebGLBuffer { const buffer = this.gl.createBuffer(); if (!buffer) throw new Error("Unable to create boid buffer"); return buffer; }
    private createProgram(vertexSource: string, fragmentSource: string): WebGLProgram { const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexSource); const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentSource); const program = this.gl.createProgram(); if (!program) throw new Error("Unable to create boid program"); this.gl.attachShader(program, vertexShader); this.gl.attachShader(program, fragmentShader); this.gl.linkProgram(program); if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) throw new Error(this.gl.getProgramInfoLog(program) ?? "Unable to link boid program"); return program; }
    private createShader(type: number, source: string): WebGLShader { const shader = this.gl.createShader(type); if (!shader) throw new Error("Unable to create boid shader"); this.gl.shaderSource(shader, source); this.gl.compileShader(shader); if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) throw new Error(this.gl.getShaderInfoLog(shader) ?? "Unable to compile boid shader"); return shader; }
    private onPointerMove = (event: PointerEvent): void => { const bounds = this.canvas.getBoundingClientRect(); this.mouse = { x: (event.clientX - bounds.left) / bounds.width * BoidsRenderer.worldWidth, y: (event.clientY - bounds.top) / bounds.height * BoidsRenderer.worldHeight, active: true }; };
    private onPointerLeave = (): void => { this.mouse.active = false; };
}
