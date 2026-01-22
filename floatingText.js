export class FloatingText {
    constructor(x, y, text, color = '#FFFFFF') {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.life = 1; // 1秒寿命
        this.maxLife = 1;
        this.velocity = -50; // 向上飘动
        this.active = true;
    }

    update(dt) {
        if (!this.active) return;
        
        this.y += this.velocity * dt;
        this.life -= dt;
        
        if (this.life <= 0) {
            this.active = false;
        }
    }

    draw(ctx) {
        if (!this.active) return;
        
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
        ctx.fillStyle = this.color;
        ctx.font = 'bold 24px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // 描边
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        ctx.strokeText(this.text, this.x, this.y);
        ctx.fillText(this.text, this.x, this.y);
        
        ctx.restore();
    }
}
