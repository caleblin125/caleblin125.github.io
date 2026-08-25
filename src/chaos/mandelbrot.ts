export class Mandelbrot {
    centerX = -0.5;
    centerY = 0.0;
    zoom = 1.0;
    iterations = 140;

    pan(deltaX: number, deltaY: number): void {
        this.centerX -= deltaX / this.zoom;
        this.centerY += deltaY / this.zoom;
    }

    scale(factor: number, originX = 0, originY = 0): void {
        this.centerX = originX + (this.centerX - originX) * factor;
        this.centerY = originY + (this.centerY - originY) * factor;
        this.zoom /= factor;
    }
}