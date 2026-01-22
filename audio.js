export class AudioController {
    constructor() {
        this.bgm = new Audio('BGM/bgm.mp3');
        this.bgm.loop = true;
        this.bgm.volume = 0.5; // 默认音量
        this.bgm.preload = 'auto';
        this.bgm.onerror = (e) => console.error('BGM load error:', e);

        // 预加载音效池，防止快速点击时吞音
        this.hitPool = [];
        this.poolSize = 10;
        for (let i = 0; i < this.poolSize; i++) {
            const audio = new Audio('BGM/hit.mp3');
            audio.preload = 'auto';
            audio.volume = 0.8;
            audio.onerror = (e) => console.error('Hit sound load error:', e);
            this.hitPool.push(audio);
        }
        this.poolIndex = 0;
        
        // 爆炸音效
        this.boom = new Audio('BGM/BOOM.mp3');
        this.boom.preload = 'auto';
        this.boom.volume = 1.0;
        this.boom.onerror = (e) => console.error('Boom sound load error:', e);
    }

    playBGM() {
        this.bgm.currentTime = 0;
        this.bgm.volume = 0.5;
        this.bgm.play().catch(e => console.log('Auto-play prevented:', e));
    }

    stopBGM() {
        // 淡出效果
        const fadeOutInterval = setInterval(() => {
            if (this.bgm.volume > 0.05) {
                this.bgm.volume -= 0.05;
            } else {
                this.bgm.volume = 0;
                this.bgm.pause();
                clearInterval(fadeOutInterval);
            }
        }, 100); // 每100ms降低5%音量，总共约1秒淡出
    }

    playHit() {
        const audio = this.hitPool[this.poolIndex];
        audio.currentTime = 0;
        audio.play().catch(e => {}); // 忽略播放错误
        
        // 轮询使用池中的下一个音频对象
        this.poolIndex = (this.poolIndex + 1) % this.poolSize;
    }

    playBoom() {
        this.boom.currentTime = 0;
        this.boom.play().catch(e => console.error('Play boom error:', e));
    }
}
