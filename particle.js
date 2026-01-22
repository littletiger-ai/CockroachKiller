export class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 200 + 50; // 速度快一点
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.life = 3; // 3秒寿命
        this.maxLife = 3;
        this.size = Math.random() * 4 + 2;
    }

    update(dt) {
        this.life -= dt;
        if (this.life <= 0) return;

        this.x += this.vx * dt;
        this.y += this.vy * dt;
        
        // 强摩擦力，模拟溅到地上停住
        this.vx *= 0.9;
        this.vy *= 0.9;
    }

    draw(ctx) {
        if (this.life <= 0) return;
        
        ctx.save();
        ctx.globalAlpha = this.life / this.maxLife;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}
