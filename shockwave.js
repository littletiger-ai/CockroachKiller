export class Shockwave {
    constructor(x, y, maxRadius = 300) {
        this.x = x;
        this.y = y;
        this.radius = 0;
        this.maxRadius = maxRadius; // 冲击波范围
        this.speed = 800; // 扩散速度 (范围变大了，速度也加快一点)
        this.life = 1; // 持续时间
        this.active = true;
    }

    update(dt) {
        if (!this.active) return;
        
        this.radius += this.speed * dt;
        this.life -= dt;
        
        if (this.radius >= this.maxRadius || this.life <= 0) {
            this.active = false;
        }
    }

    draw(ctx) {
        if (!this.active) return;
        
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life); // 随时间淡出
        ctx.strokeStyle = '#29B6F6'; // 蓝色
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // 内部填充淡色
        ctx.fillStyle = 'rgba(41, 182, 246, 0.1)';
        ctx.fill();
        ctx.restore();
    }
}
