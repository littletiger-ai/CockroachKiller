export class Slipper {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.isHitting = false;
        this.hitTimer = 0;
        this.hitDuration = 0.1; // 打击动作非常快
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }

    update(dt) {
        if (this.isHitting) {
            this.hitTimer += dt;
            if (this.hitTimer >= this.hitDuration) {
                this.isHitting = false;
                this.hitTimer = 0;
            }
        }
    }

    hit() {
        if (!this.isHitting) {
            this.isHitting = true;
            this.hitTimer = 0;
            return true;
        }
        return false;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        let scale = 1;
        // 默认偏移一点，让鼠标指针位于拖鞋头部或中心
        let offsetX = 10;
        let offsetY = 20;

        // 打击动画：拍下去
        if (this.isHitting) {
            scale = 0.9;
            offsetX = 0;
            offsetY = 0;
        }

        ctx.translate(offsetX, offsetY);
        ctx.scale(scale, scale);
        // 稍微旋转一点，符合右手拿拖鞋的角度
        ctx.rotate(-Math.PI / 6);

        // 绘制拖鞋
        // 鞋底阴影
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(5, 5, 25, 50, 0, 0, Math.PI * 2);
        ctx.fill();

        // 鞋底
        ctx.fillStyle = '#FF7043'; // 橙色
        ctx.beginPath();
        ctx.ellipse(0, 0, 25, 50, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#D84315';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 鞋底纹理
        ctx.fillStyle = '#F4511E';
        ctx.beginPath();
        ctx.arc(0, 20, 15, 0, Math.PI * 2); // 脚后跟
        ctx.fill();

        // 人字拖带子
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(-20, -10); // 左侧固定点
        ctx.quadraticCurveTo(0, -35, 0, -35); // 中间点
        ctx.quadraticCurveTo(0, -35, 20, -10); // 右侧固定点
        ctx.stroke();
        
        // 夹脚处
        ctx.beginPath();
        ctx.moveTo(0, -35);
        ctx.lineTo(0, -15);
        ctx.stroke();

        ctx.restore();
    }
}
