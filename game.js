const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let score = 0;
let combo = 0;
let playerLane = 1;
let spirits = [];
let lastTime = 0;

// Ресайз
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// Ресурсы
const assets = {
    bg: new Image(),
    attack: new Image(),
    spirit: new Image()
};
assets.bg.src = 'assets/bg_main.jpg';
assets.attack.src = 'assets/samurai_attack.png';
assets.spirit.src = 'assets/spirit_blue.png';

const HORIZON_Y = canvas.height * 0.45; 
const SPAWN_X = canvas.width / 2;

// Анимация атаки
const attackAnim = {
    totalFrames: 8,
    cols: 2,
    rows: 4,
    currentFrame: 0,
    isPlaying: false,
    timer: 0,
    frameDuration: 60,

    play: function() {
        this.currentFrame = 0;
        this.timer = 0;
        this.isPlaying = true;
    },

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
        if (!assets.attack.complete) return;
        const sw = assets.attack.width / this.cols;
        const sh = assets.attack.height / this.rows;
        const col = this.currentFrame % this.cols;
        const row = Math.floor(this.currentFrame / this.cols);
        ctx.drawImage(assets.attack, col * sw, row * sh, sw, sh, x - w/2, y - h/2, w, h);
    }
};

// Класс духа
class Spirit {
    constructor() {
        this.lane = Math.floor(Math.random() * 3);
        this.progress = 0; 
        this.speed = 0.004 + (score / 500000); 
    }
    update(dt) { this.progress += this.speed; }
    draw() {
        const size = 20 + (this.progress * 150);
        const targetX = (this.lane * (canvas.width / 2.5)) + (canvas.width / 5);
        const x = SPAWN_X + (targetX - SPAWN_X) * this.progress;
        const y = HORIZON_Y + (canvas.height - HORIZON_Y) * this.progress;
        ctx.save();
        ctx.shadowBlur = 20; ctx.shadowColor = "cyan";
        ctx.drawImage(assets.spirit, x - size/2, y - size/2, size, size);
        ctx.restore();
    }
}

// Управление
window.handleInput = function(lane) {
    playerLane = lane;
    attackAnim.play();
    
    let hit = false;
    spirits.forEach((s, i) => {
        if (s.lane === lane && s.progress > 0.75 && s.progress < 0.95) {
            spirits.splice(i, 1);
            hit = true;
            score += 100 * (combo + 1);
            combo++;
        }
    });
    if (!hit && spirits.some(s => s.lane === lane && s.progress > 0.6)) combo = 0;
    updateUI();
}

function updateUI() {
    document.getElementById('score').innerText = score;
    document.getElementById('combo').innerText = 'x' + combo;
}

function gameLoop(now) {
    const dt = now - lastTime || 0;
    lastTime = now;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (assets.bg.complete) ctx.drawImage(assets.bg, 0, 0, canvas.width, canvas.height);

    if (Math.random() < 0.02) spirits.push(new Spirit());
    
    spirits.forEach((s, i) => {
        s.update(dt);
        s.draw();
        if (s.progress > 1) { spirits.splice(i, 1); combo = 0; updateUI(); }
    });

    const playerX = (playerLane * (canvas.width / 2.5)) + (canvas.width / 5);
    const playerY = canvas.height * 0.85;

    attackAnim.update(dt);
    attackAnim.draw(ctx, playerX, playerY, 250, 250);

    requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);