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

// Загрузка ресурсов (убедись, что папка assets на месте)
const assets = {
    bg: new Image(),
    attack: new Image(),
    spirit: new Image()
};
assets.bg.src = './assets/bg_main.jpg';
assets.attack.src = './assets/samurai_attack.png';
assets.spirit.src = './assets/spirit_blue.png';

// УПРАВЛЕНИЕ: Делим экран на 3 зоны
canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickPos = x / rect.width;

    if (clickPos < 0.33) handleInput(0);      // Лево
    else if (clickPos < 0.66) handleInput(1); // Центр
    else handleInput(2);                     // Право
});

function handleInput(lane) {
    playerLane = lane;
    attackAnim.play();
    
    let hit = false;
    spirits.forEach((s, i) => {
        // Проверка попадания (0.7 - 0.95 это зона перед игроком)
        if (s.lane === lane && s.progress > 0.7 && s.progress < 0.95) {
            spirits.splice(i, 1);
            hit = true;
            score += 100 * (combo + 1);
            combo++;
        }
    });
    if (!hit) combo = 0;
    updateUI();
}

function updateUI() {
    document.getElementById('score').innerText = score;
    document.getElementById('combo').innerText = 'x' + combo;
}

// Анимация самурая
const attackAnim = {
    totalFrames: 8, cols: 2, rows: 4,
    currentFrame: 0, isPlaying: false, timer: 0, frameDuration: 60,
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
        if (assets.attack.complete && assets.attack.naturalWidth !== 0) {
            const sw = assets.attack.width / this.cols;
            const sh = assets.attack.height / this.rows;
            const col = this.currentFrame % this.cols;
            const row = Math.floor(this.currentFrame / this.cols);
            ctx.drawImage(assets.attack, col * sw, row * sh, sw, sh, x - w/2, y - h/2, w, h);
        }
    }
};

class Spirit {
    constructor() {
        this.lane = Math.floor(Math.random() * 3);
        this.progress = 0; 
        this.speed = 0.005 + (score / 1000000); 
    }
    update(dt) { this.progress += this.speed; }
    draw() {
        const size = 30 + (this.progress * 150);
        const laneWidth = canvas.width / 3;
        const targetX = (this.lane * laneWidth) + (laneWidth / 2);
        const x = (canvas.width/2) + (targetX - (canvas.width/2)) * this.progress;
        const y = (canvas.height*0.45) + (canvas.height - (canvas.height*0.45)) * this.progress;
        
        if (assets.spirit.complete && assets.spirit.naturalWidth !== 0) {
            ctx.drawImage(assets.spirit, x - size/2, y - size/2, size, size);
        }
    }
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

    const laneWidth = canvas.width / 3;
    const playerX = (playerLane * laneWidth) + (laneWidth / 2);
    const playerY = canvas.height * 0.8;

    attackAnim.update(dt);
    attackAnim.draw(ctx, playerX, playerY, 200, 200);

    requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);
