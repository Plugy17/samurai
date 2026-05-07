const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let score = 0;
let combo = 0;
let playerLane = 1;
let spirits = [];
let lastTime = 0;

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// Ресурсы — добавил './', чтобы GitHub точно нашел папку assets
const assets = {
    bg: new Image(),
    attack: new Image(),
    spirit: new Image()
};
assets.bg.src = './assets/bg_main.jpg';
assets.attack.src = './assets/samurai_attack.png';
assets.spirit.src = './assets/spirit_blue.png';

// Анимация атаки (твоя сетка 2x4)
const attackAnim = {
    totalFrames: 8,
    cols: 2,
    rows: 4,
    currentFrame: 0,
    isPlaying: false,
    timer: 0,
    frameDuration: 60,
    play: function() { this.currentFrame = 0; this.timer = 0; this.isPlaying = true; },
    update: function(dt) {
        if (!this.isPlaying) return;
        this.timer += dt;
        if (this.timer >= this.frameDuration) {
            this.timer = 0;
            this.currentFrame++;
            if (this.currentFrame >= this.totalFrames) this.isPlaying = false;
        }
    },
    draw: function(ctx, x, y, w, h) {
        // КРИТИЧНО: Рисуем только если картинка загружена успешно
        if (assets.attack.complete && assets.attack.naturalWidth !== 0) {
            const sw = assets.attack.width / this.cols;
            const sh = assets.attack.height / this.rows;
            const col = this.currentFrame % this.cols;
            const row = Math.floor(this.currentFrame / this.cols);
            ctx.drawImage(assets.attack, col * sw, row * sh, sw, sh, x - w/2, y - h/2, w, h);
        } else {
            // Если самурай не загрузился, рисуем временный маркер
            ctx.fillStyle = "rgba(255, 0, 255, 0.5)";
            ctx.fillRect(x - 25, y - 25, 50, 50);
        }
    }
};

class Spirit {
    constructor() {
        this.lane = Math.floor(Math.random() * 3);
        this.progress = 0; 
        this.speed = 0.005; 
    }
    update(dt) { this.progress += this.speed; }
    draw() {
        const size = 30 + (this.progress * 150);
        const targetX = (this.lane * (canvas.width / 2.5)) + (canvas.width / 5);
        const x = (canvas.width/2) + (targetX - (canvas.width/2)) * this.progress;
        const y = (canvas.height*0.45) + (canvas.height - (canvas.height*0.45)) * this.progress;
        
        if (assets.spirit.complete && assets.spirit.naturalWidth !== 0) {
            ctx.drawImage(assets.spirit, x - size/2, y - size/2, size, size);
        } else {
            ctx.fillStyle = "cyan";
            ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI*2); ctx.fill();
        }
    }
}

window.handleInput = function(lane) {
    playerLane = lane;
    attackAnim.play();
    let hit = false;
    spirits.forEach((s, i) => {
        if (s.lane === lane && s.progress > 0.7 && s.progress < 0.95) {
            spirits.splice(i, 1);
            hit = true; score += 100 * (combo + 1); combo++;
        }
    });
    if (!hit) combo = 0;
    updateUI();
}

function updateUI() {
    document.getElementById('score').innerText = score;
    document.getElementById('combo').innerText = 'x' + combo;
}

function gameLoop(now) {
    const dt = now - lastTime || 0;
    lastTime = now;
    
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (assets.bg.complete && assets.bg.naturalWidth !== 0) {
        ctx.drawImage(assets.bg, 0, 0, canvas.width, canvas.height);
    }

    if (Math.random() < 0.02) spirits.push(new Spirit());
    
    spirits.forEach((s, i) => {
        s.update(dt);
        s.draw();
        if (s.progress > 1) { spirits.splice(i, 1); combo = 0; updateUI(); }
    });

    const playerX = (playerLane * (canvas.width / 2.5)) + (canvas.width / 5);
    const playerY = canvas.height * 0.8;

    attackAnim.update(dt);
    attackAnim.draw(ctx, playerX, playerY, 200, 200);

    requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);
