import { Cockroach } from './cockroach.js';
import { Slipper } from './slipper.js';
import { Particle } from './particle.js';
import { Shockwave } from './shockwave.js';
import { getDistance } from './utils.js';
import { AudioController } from './audio.js';
import { FloatingText } from './floatingText.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const timeEl = document.getElementById('time');
const livesEl = document.getElementById('lives');
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');
const flashOverlay = document.getElementById('flash-overlay');
const gameContainer = document.getElementById('game-container');

let width, height;
let cockroaches = [];
let particles = [];
let shockwaves = [];
let floatingTexts = [];
let slipper;
let score = 0;
let gameTime = 60; // 初始60秒
let lastTime = 0;
let playerLives = 3;
const maxLives = 5;
let isGameOver = false;
let isGameRunning = false;

// 音频控制器
const audioCtrl = new AudioController();

// 生成配置
let spawnTimer = 0;
let difficultyMultiplier = 1;
let survivalTime = 0; // 用来计算难度递增的时间

function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
}

function updateLivesUI() {
    let hearts = '';
    for (let i = 0; i < playerLives; i++) {
        hearts += '❤';
    }
    livesEl.textContent = hearts;
}

function init() {
    resize();
    window.addEventListener('resize', resize);
    
    slipper = new Slipper();
    updateLivesUI();
    
    // 输入事件
    window.addEventListener('mousemove', e => {
        if (isGameOver) return;
        slipper.setPosition(e.clientX, e.clientY);
    });
    
    window.addEventListener('mousedown', e => {
        if (isGameOver) {
            // 点击重启逻辑已在 gameOver 中处理，这里防止误触
            return;
        }

        if (!isGameRunning) return; // 没开始游戏时不响应点击

        if (e.button === 0) { // 左键
            const hit = slipper.hit();
            if (hit) {
                audioCtrl.playHit(); // 播放打击音效
                checkHit(e.clientX, e.clientY);
            }
        }
    });

    // 开始按钮事件
    startBtn.addEventListener('click', startGame);
    
    // 初始化时也调用一次 loop 来绘制静态画面（如拖鞋）
    requestAnimationFrame(loop);
}

function startGame() {
    startScreen.style.display = 'none';
    isGameRunning = true;
    isGameOver = false;
    
    // 重置游戏状态
    score = 0;
    scoreEl.textContent = 0;
    gameTime = 60; // 60秒
    survivalTime = 0;
    playerLives = 3;
    updateLivesUI();
    cockroaches = [];
    particles = [];
    shockwaves = [];
    floatingTexts = [];
    lastTime = 0;
    
    audioCtrl.playBGM();
}

function checkHit(x, y) {
    const hitRadius = 50; // 判定范围
    
    // 找出所有在打击范围内的活蟑螂
    let targets = [];
    
    cockroaches.forEach(c => {
        if (c.state === 'dead') return;
        
        const dist = getDistance(x, y, c.x, c.y);
        const cockroachRadius = c.width * c.scale; 
        
        if (dist < hitRadius + cockroachRadius) {
            targets.push({ cockroach: c, dist: dist });
        }
    });
    
    // 按距离排序，优先打最近的
    targets.sort((a, b) => a.dist - b.dist);
    
    if (targets.length > 0) {
        const target = targets[0].cockroach;
        const killed = target.hit();
        
        if (killed) {
            // 分数处理
            score += target.score;
            scoreEl.textContent = score;
            spawnParticles(target.x, target.y, target.config.color);
            
            // 特殊效果处理
            if (target.type === 'king') {
                spawnSwarm();
            } else if (target.type === 'blue') {
                // 蓝色冲击波
                const maxR = Math.max(width, height) * 1.5; // 全屏范围
                shockwaves.push(new Shockwave(target.x, target.y, maxR));
                // 立即触发减速效果，也可以在 Shockwave 的 update 中动态检测，但一次性触发更简单高效
                applyShockwaveEffect(target.x, target.y, maxR);
            } else if (target.type === 'bomb') {
                // 炸弹扣血
                modifyLives(-1);
                triggerExplosionEffect();
            } else if (target.type === 'green') {
                // 绿色回血
                modifyLives(1);
                // 显示 +1 HP 浮动文字
                floatingTexts.push(new FloatingText(target.x, target.y, '+1 HP', '#66BB6A'));
            } else if (target.type === 'rainbow') {
                // 彩虹奖励：加时间
                gameTime += 10;
                // 显示 +10s 浮动文字
                floatingTexts.push(new FloatingText(target.x, target.y, '+10s', '#FFD700'));
            }

        } else {
            // 没打死（高级蟑螂），出白色打击粒子
             spawnHitParticles(target.x, target.y);
        }
    }
}

function triggerExplosionEffect() {
    // 播放音效
    audioCtrl.playBoom();
    
    // 红色闪烁
    flashOverlay.style.opacity = '0.5';
    setTimeout(() => {
        flashOverlay.style.opacity = '0';
    }, 100);

    // 屏幕震动
    const duration = 500; // 0.5秒
    const startTime = Date.now();
    
    function shake() {
        const now = Date.now();
        const elapsed = now - startTime;
        
        if (elapsed < duration) {
            const intensity = 10 * (1 - elapsed / duration); // 震动强度递减
            const dx = (Math.random() - 0.5) * intensity;
            const dy = (Math.random() - 0.5) * intensity;
            gameContainer.style.transform = `translate(${dx}px, ${dy}px)`;
            requestAnimationFrame(shake);
        } else {
            gameContainer.style.transform = 'translate(0, 0)';
        }
    }
    
    shake();
}

function modifyLives(amount) {
    playerLives += amount;
    if (playerLives > maxLives) playerLives = maxLives;
    if (playerLives <= 0) {
        playerLives = 0;
        gameOver();
    }
    updateLivesUI();
}

function gameOver() {
    isGameOver = true;
    isGameRunning = false;
    audioCtrl.stopBGM();
    
    // 复用开始界面作为结束界面
    // 延迟一点显示，让玩家看到最后一次打击
    setTimeout(() => {
        startScreen.style.display = 'flex';
        startScreen.querySelector('h1').textContent = '游戏结束';
        startScreen.querySelector('p').textContent = `最终得分: ${score}`;
        startBtn.textContent = '重新开始';
    }, 500);
}

function applyShockwaveEffect(x, y, range = 300) {
    cockroaches.forEach(c => {
        if (c.state === 'dead') return;
        const dist = getDistance(x, y, c.x, c.y);
        if (dist < range) {
            c.applySlow();
        }
    });
}

function spawnSwarm() {
    // 17只普通蟑螂 + 3只炸弹蟑螂
    let swarmCount = 20;
    for(let i=0; i<swarmCount; i++) {
        setTimeout(() => {
            if(isGameOver) return;
            // 最后三只生成炸弹
            let type = (i >= 17) ? 'bomb' : 'normal';
            cockroaches.push(new Cockroach(width, height, type, difficultyMultiplier));
        }, i * 50); // 快速涌出
    }
}

function spawnParticles(x, y, color) {
    // 绿色体液 + 身体碎片
    for(let i=0; i<15; i++) {
        particles.push(new Particle(x, y, '#7CB342')); // 鲜绿色体液
    }
    for(let i=0; i<5; i++) {
         particles.push(new Particle(x, y, color)); 
    }
}

function spawnHitParticles(x, y) {
     for(let i=0; i<3; i++) {
        particles.push(new Particle(x, y, '#FFFFFF')); 
    }
}

function spawnCockroach() {
    const rand = Math.random();
    let type = 'normal';
    
    // 难度控制生成概率
    // 随着时间推移，特殊蟑螂概率增加
    
    // 生存时间超过60秒后，大幅提升炸弹概率
    let bombChance = 0.135;
    if (survivalTime > 60) {
        bombChance = 0.3; // 30% 概率出炸弹
    }

    // 调整概率：炸弹(黑色)概率提升为原来的3倍 (约13.5%)
    // 总特殊概率提升到 0.28 (其中 bomb 0.135, blue 0.06, green 0.055, rainbow 0.03)
    // 更新：彩虹蟑螂概率提升3倍 (0.03 -> 0.09)
    // 总特殊概率提升到 0.34 (bomb 0.135, rainbow 0.09, blue 0.06, green 0.055)
    
    let specialThreshold = 0.34;
    if (survivalTime > 60) {
        specialThreshold = 0.5; // 提高特殊怪总概率
    }

    if (rand < bombChance) {
        type = 'bomb'; // 炸弹 (高概率)
    } else if (rand < specialThreshold) {
        // 剩下的概率分给 蓝色、绿色、彩虹
        // 重新归一化随机数
        const subRand = Math.random();
        if (subRand < 0.44) type = 'rainbow'; // 彩虹 (大幅提升)
        else if (subRand < 0.73) type = 'blue'; // 减速
        else type = 'green'; // 回血
    } else {
        // 原有逻辑
        if (survivalTime > 30 && rand > 0.95) type = 'king'; 
        else if (survivalTime > 10 && rand > 0.8) type = 'advanced'; 
    }
    
    cockroaches.push(new Cockroach(width, height, type, difficultyMultiplier));
}

function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    
    if (dt > 0.1) { // 避免切后台回来卡顿
        requestAnimationFrame(loop);
        return;
    }

    if (isGameRunning && !isGameOver) {
        // 倒计时逻辑
        gameTime -= dt;
        if (gameTime <= 0) {
            gameTime = 0;
            gameOver();
        }
        
        survivalTime += dt; // 记录存活时间用于难度控制
        timeEl.textContent = Math.ceil(gameTime);
        
        // 难度递增 (基于 survivalTime)
        difficultyMultiplier = 1 + survivalTime / 60; 
        
        // 生成控制
        spawnTimer += dt;
        // 生成间隔：初始1.5秒，随时间减少，最低0.3秒
        const interval = Math.max(0.3, 1.5 - survivalTime / 100); 
        
        if (spawnTimer > interval) {
            spawnTimer = 0;
            spawnCockroach();
        }

        // 更新逻辑
        cockroaches.forEach(c => c.update(dt));
        cockroaches = cockroaches.filter(c => !c.remove);
        
        shockwaves.forEach(s => s.update(dt));
        shockwaves = shockwaves.filter(s => s.active);
        
        floatingTexts.forEach(t => t.update(dt));
        floatingTexts = floatingTexts.filter(t => t.active);
    }
    
    // 无论是否运行，都更新拖鞋和粒子（拖鞋在菜单界面也可以动）
    slipper.update(dt);
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => p.life > 0);
    
    // 排序：Y轴排序，尸体在下
    cockroaches.sort((a, b) => {
        if (a.state === 'dead' && b.state !== 'dead') return -1;
        if (a.state !== 'dead' && b.state === 'dead') return 1;
        return a.y - b.y;
    });

    // 绘制
    ctx.clearRect(0, 0, width, height);
    
    // 粒子在最下层
    particles.forEach(p => p.draw(ctx));
    shockwaves.forEach(s => s.draw(ctx));
    
    cockroaches.forEach(c => c.draw(ctx));
    
    floatingTexts.forEach(t => t.draw(ctx));
    
    slipper.draw(ctx);

    requestAnimationFrame(loop);
}

init();
