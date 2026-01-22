import { randomRange, degToRad } from './utils.js';

const TYPES = {
    normal: { color: '#5D4037', hp: 1, score: 1, speedBase: 100, scale: 1, width: 20, height: 40 }, // 棕色
    advanced: { color: '#B71C1C', hp: 3, score: 5, speedBase: 150, scale: 1.2, width: 25, height: 50 }, // 红色
    king: { color: '#FFD700', hp: 5, score: 10, speedBase: 80, scale: 2, width: 40, height: 80 }, // 金色
    blue: { color: '#29B6F6', hp: 1, score: 2, speedBase: 110, scale: 1, width: 20, height: 40 }, // 蓝色
    bomb: { color: '#9E9E9E', hp: 1, score: 0, speedBase: 90, scale: 1.1, width: 22, height: 45 }, // 炸弹 (浅灰色)
    green: { color: '#66BB6A', hp: 1, score: 1, speedBase: 130, scale: 0.9, width: 18, height: 38 }, // 绿色
    rainbow: { color: '#FFFFFF', hp: 1, score: 5, speedBase: 240, scale: 0.8, width: 18, height: 38 } // 彩虹 (颜色动态, 速度1.5倍)
};

export class Cockroach {
    constructor(canvasWidth, canvasHeight, type = 'normal', difficultyMultiplier = 1) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.type = type;
        this.config = TYPES[type];
        
        this.hp = this.config.hp;
        this.maxHp = this.config.hp;
        this.score = this.config.score;
        this.scale = this.config.scale;
        
        // 速度随难度增加
        this.baseSpeed = this.config.speedBase * difficultyMultiplier;
        this.speed = this.baseSpeed;
        
        this.width = this.config.width;
        this.height = this.config.height;
        
        this.initPosition();
        
        this.legAngle = 0;
        this.legSpeed = 15;
        this.state = 'alive'; // alive, dead
        this.deadTime = 0;
        this.opacity = 1;
        this.remove = false; // 标记是否可以从数组移除
        
        // 状态效果
        this.slowTimer = 0;
        this.isSlowed = false;
        
        // 逃跑逻辑
        this.aliveTime = 0;
        this.isEscaping = false;
        
        // 彩虹逻辑
        this.rainbowHue = 0;
    }

    initPosition() {
        // 从屏幕边缘生成
        const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
        const buffer = 50;
        
        switch(side) {
            case 0: // top
                this.x = randomRange(0, this.canvasWidth);
                this.y = -buffer;
                this.angle = randomRange(45, 135); // 向下
                break;
            case 1: // right
                this.x = this.canvasWidth + buffer;
                this.y = randomRange(0, this.canvasHeight);
                this.angle = randomRange(135, 225); // 向左
                break;
            case 2: // bottom
                this.x = randomRange(0, this.canvasWidth);
                this.y = this.canvasHeight + buffer;
                this.angle = randomRange(225, 315); // 向上
                break;
            case 3: // left
                this.x = -buffer;
                this.y = randomRange(0, this.canvasHeight);
                this.angle = randomRange(-45, 45); // 向右
                break;
        }
        
        // 角度转换为弧度
        this.angle = degToRad(this.angle);
        
        // 目标点设为屏幕内的随机点，引导蟑螂移动
        this.targetX = randomRange(this.canvasWidth * 0.2, this.canvasWidth * 0.8);
        this.targetY = randomRange(this.canvasHeight * 0.2, this.canvasHeight * 0.8);
    }

    applySlow() {
        if (this.state === 'dead') return;
        this.isSlowed = true;
        this.slowTimer = 5; // 5秒减速
    }

    update(dt) {
        if (this.state === 'dead') {
            this.deadTime += dt;
            // 3秒内消失
            this.opacity = 1 - (this.deadTime / 3);
            if (this.deadTime >= 3) {
                this.opacity = 0;
                this.remove = true;
            }
            return;
        }
        
        // 彩虹色变换
        if (this.type === 'rainbow') {
            this.rainbowHue = (this.rainbowHue + 360 * dt) % 360; // 每秒转一圈色相
        }

        this.aliveTime += dt;
        
        // 3秒后逃跑
        if (this.aliveTime > 3 && !this.isEscaping) {
            this.isEscaping = true;
            // 设置一个屏幕外的目标点
            // 简单的找最近的边界跑
            const centerX = this.canvasWidth / 2;
            const centerY = this.canvasHeight / 2;
            const dx = this.x - centerX;
            const dy = this.y - centerY;
            
            // 归一化并放大，确保跑到屏幕外
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist > 0) {
                this.targetX = this.x + (dx / dist) * 2000;
                this.targetY = this.y + (dy / dist) * 2000;
            } else {
                 this.targetX = randomRange(-500, this.canvasWidth + 500);
                 this.targetY = randomRange(-500, this.canvasHeight + 500);
            }
        }

        // 处理减速
        if (this.isSlowed) {
            this.slowTimer -= dt;
            if (this.slowTimer <= 0) {
                this.isSlowed = false;
                this.speed = this.baseSpeed;
            } else {
                this.speed = this.baseSpeed * 0.5;
            }
        } else {
            this.speed = this.baseSpeed;
        }

        // 移动逻辑
        // 稍微转向目标
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const targetAngle = Math.atan2(dy, dx);
        
        // 简单的角度插值
        let angleDiff = targetAngle - this.angle;
        // 规范化角度差到 -PI ~ PI
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        
        // 逃跑时转向更快
        const turnSpeed = this.isEscaping ? 5 : 2;
        this.angle += angleDiff * turnSpeed * dt; 
        
        // 添加随机扰动 (逃跑时减少扰动)
        if (!this.isEscaping) {
            this.angle += (Math.random() - 0.5) * 2 * dt;
        }

        // 更新位置
        this.x += Math.cos(this.angle) * this.speed * dt;
        this.y += Math.sin(this.angle) * this.speed * dt;
        
        // 腿部动画
        // 减速时腿动得慢
        const animSpeed = this.isSlowed ? 0.5 : 1;
        this.legAngle += this.legSpeed * dt * 20 * animSpeed; 

        // 检查是否走出屏幕太远
        if (this.isEscaping) {
            // 如果已经在屏幕外，销毁
            if (this.x < -100 || this.x > this.canvasWidth + 100 || 
                this.y < -100 || this.y > this.canvasHeight + 100) {
                this.remove = true;
            }
        } else {
            // 正常逻辑：检查是否需要重置目标点
            const distToTarget = Math.sqrt(dx*dx + dy*dy);
            if (distToTarget < 50) {
                 this.targetX = randomRange(50, this.canvasWidth - 50);
                 this.targetY = randomRange(50, this.canvasHeight - 50);
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        // 蟑螂头朝向 angle，加上 90度 (PI/2) 修正，因为画的时候是垂直的
        ctx.rotate(this.angle + Math.PI / 2);
        ctx.scale(this.scale, this.scale);
        ctx.globalAlpha = this.opacity;

        let bodyColor = this.config.color;
        if (this.type === 'rainbow') {
            bodyColor = `hsl(${this.rainbowHue}, 100%, 50%)`;
        }

        // 绘制腿
        ctx.strokeStyle = '#3E2723';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        
        for (let i = 0; i < 3; i++) {
            const yOffset = -5 + i * 10;
            const legLen = 15;
            // 左腿
            const leftLegAngle = Math.sin(this.legAngle + i) * 0.5;
            ctx.beginPath();
            ctx.moveTo(-8, yOffset);
            ctx.lineTo(-8 - legLen, yOffset + leftLegAngle * 10);
            ctx.stroke();
            
            // 右腿
            const rightLegAngle = Math.sin(this.legAngle + i + Math.PI) * 0.5;
            ctx.beginPath();
            ctx.moveTo(8, yOffset);
            ctx.lineTo(8 + legLen, yOffset + rightLegAngle * 10);
            ctx.stroke();
        }

        // 绘制触角
        ctx.beginPath();
        ctx.moveTo(-5, -15); // 头部左侧
        // 触角摆动
        const antennaWiggle = this.state === 'dead' ? 0 : Math.sin(this.legAngle * 0.5) * 5;
        ctx.quadraticCurveTo(-15, -30, -20 + antennaWiggle, -45);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(5, -15); // 头部右侧
        ctx.quadraticCurveTo(15, -30, 20 - antennaWiggle, -45);
        ctx.stroke();

        // 绘制身体 (椭圆)
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.ellipse(0, 5, 12, 25, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 绘制头部
        ctx.beginPath();
        ctx.arc(0, -18, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 绘制背部纹理
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.moveTo(-10, -10);
        ctx.quadraticCurveTo(0, -5, 10, -10);
        ctx.quadraticCurveTo(0, 30, -10, -10);
        ctx.fill();

        // 绘制炸弹
        if (this.type === 'bomb' && this.state !== 'dead') {
            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.arc(0, 5, 12, 0, Math.PI * 2); // 放大炸弹
            ctx.fill();
            
            // 炸弹高光
            ctx.fillStyle = '#444';
            ctx.beginPath();
            ctx.arc(-4, 1, 3, 0, Math.PI * 2);
            ctx.fill();
            
            // 炸弹引信
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, 5);
            ctx.quadraticCurveTo(8, -8, 12, 0);
            ctx.stroke();
            
            // 火花
            if (Math.random() > 0.5) {
                ctx.fillStyle = '#FFC107';
                ctx.beginPath();
                ctx.arc(12, 0, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // 减速状态下的冰冻效果
        if (this.isSlowed && this.state !== 'dead') {
             ctx.fillStyle = 'rgba(64, 196, 255, 0.4)';
             ctx.beginPath();
             ctx.ellipse(0, 0, 18, 40, 0, 0, Math.PI * 2);
             ctx.fill();
        }

        // 死亡效果
        if (this.state === 'dead') {
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            
            // 左眼 X
            ctx.beginPath();
            ctx.moveTo(-5, -20);
            ctx.lineTo(-1, -16);
            ctx.moveTo(-1, -20);
            ctx.lineTo(-5, -16);
            ctx.stroke();

            // 右眼 X
            ctx.beginPath();
            ctx.moveTo(1, -20);
            ctx.lineTo(5, -16);
            ctx.moveTo(5, -20);
            ctx.lineTo(1, -16);
            ctx.stroke();
        }

        ctx.restore();
    }

    hit() {
        if (this.state === 'dead') return false;
        
        this.hp--;
        if (this.hp <= 0) {
            this.die();
            return true; // 真的死了
        }
        return false; // 还没死
    }

    die() {
        this.state = 'dead';
        this.hp = 0;
    }
}
