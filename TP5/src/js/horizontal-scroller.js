let frame = 0;
let f = 0;
let pipesSync = false;

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const groundImg = new Image();
groundImg.src = 'assets/img/ground.png';
const bgImg = new Image();
bgImg.src = 'assets/img/bg.png';
const birdImg = new Image();
birdImg.src = 'assets/img/bird.png';
const gameOverImg = new Image();
gameOverImg.src = 'assets/img/gameover.png';
const pipesImg = new Image();
pipesImg.src = 'assets/img/pipes.png';
const numbersImg = new Image();
numbersImg.src = 'assets/img/numbers.png';
const degree = Math.PI / 180;

const gameState = {
    current: 0,
    getReady: 0,
    play: 1,
    gameOver: 2
}
//backgrounds
const bg1 = {
    imgX: 0,
    imgY: 0,
    width: 276,
    height: 512,
    x: 0,
    y: 0,
    w: 276,
    h: 512,
    dx: .2,
    render: function () {
        for (let i = 0; this.x + this.width * i < canvas.width; i++)
            ctx.drawImage(bgImg, this.imgX, this.imgY, this.width, this.height, this.x + this.width * i, this.y, this.w, this.h);
    },

    position: function () {
        if (gameState.current == gameState.getReady) {
            this.x = 0;
        }
        if (gameState.current == gameState.play) {
            this.x = (this.x - this.dx) % (this.w);
        }
    }
}
const bg2 = {
    imgX: 288,
    imgY: 0,
    width: 276,
    height: 512,
    x: 0,
    y: 0,
    w: 276,
    h: 512,
    dx: .4,
    render: function () {
        for (let i = 0; this.x + this.width * i < canvas.width; i++)
            ctx.drawImage(bgImg, this.imgX, this.imgY, this.width, this.height, this.x + this.width * i, this.y, this.w, this.h);
    },

    position: function () {
        if (gameState.current == gameState.getReady) {
            this.x = 0;
        }
        if (gameState.current == gameState.play) {
            this.x = (this.x - this.dx) % (this.w);
        }
    }
}
const bg3 = {
    imgX: 576,
    imgY: 0,
    width: 276,
    height: 512,
    x: 0,
    y: 0,
    w: 276,
    h: 512,
    dx: .6,
    render: function () {
        for (let i = 0; this.x + this.width * i < canvas.width; i++)
            ctx.drawImage(bgImg, this.imgX, this.imgY, this.width, this.height, this.x + this.width * i, this.y, this.w, this.h);
    },

    position: function () {
        if (gameState.current == gameState.getReady) {
            this.x = 0;
        }
        if (gameState.current == gameState.play) {
            this.x = (this.x - this.dx) % (this.w);
        }
    }
}
const pipes = {
    top: {
        imgX: 0,
        imgY: 0,
    },
    bot: {
        imgX: 28,
        imgY: 0,
    },
    width: 26,
    height: 160,
    w: 52,
    h: 300,
    gap: 85,
    dx: 2,
    minY: -260,
    maxY: -40,

    pipeGenerator: [],

    reset: function () {
        this.pipeGenerator = [];
    },
    render: function () {
        for (let i = 0; i < this.pipeGenerator.length; i++) {
            let pipe = this.pipeGenerator[i];
            let topPipe = pipe.y;
            let bottomPipe = pipe.y + this.gap + this.h;

            ctx.drawImage(pipesImg, this.top.imgX, this.top.imgY, this.width, this.height, pipe.x, topPipe, this.w, this.h);
            ctx.drawImage(pipesImg, this.bot.imgX, this.bot.imgY, this.width, this.height, pipe.x, bottomPipe, this.w, this.h);
        }
    },
    position: function () {
        if (gameState.current == gameState.gameOver) {
            return;
        }
        if (gameState.current == gameState.getReady && this.pipeGenerator.length == 0) {

            this.pipeGenerator.push(
                {
                    x: canvas.width - this.width,
                    y: Math.floor((Math.random() * (this.maxY - this.minY + 1)) + this.minY)
                }
            );
            for (let i = 0; this.pipeGenerator[i].x > 400; i++) {
                this.pipeGenerator.push(
                    {
                        x: this.pipeGenerator[i].x - (this.width + 148),
                        y: Math.floor((Math.random() * (this.maxY - this.minY + 1)) + this.minY)
                    }
                );
            }
        }
        if (gameState.current == gameState.play) {
            if (pipesSync && frame % 100 == f && (this.pipeGenerator.at(-1).x + 144 + this.width) < canvas.width) {
                this.pipeGenerator.push(
                    {
                        x: canvas.width,
                        y: Math.floor((Math.random() * (this.maxY - this.minY + 1)) + this.minY)
                    }
                );
            }
            if (!pipesSync && this.pipeGenerator[0].x < canvas.width - this.width - 148) {
                this.pipeGenerator.push(
                    {
                        x: canvas.width,
                        y: Math.floor((Math.random() * (this.maxY - this.minY + 1)) + this.minY)
                    }
                );
                f = frame % 100;
                pipesSync = true;
            }
            for (let i = 0; i < this.pipeGenerator.length; i++) {
                let pg = this.pipeGenerator[i]
                let b = {
                    left: bird.x - bird.r,
                    right: bird.x + bird.r,
                    top: bird.y - bird.r,
                    bottom: bird.y + bird.r,
                }
                let p = {
                    top: {
                        top: pg.y,
                        bottom: pg.y + this.h
                    },
                    bot: {
                        top: pg.y + this.h + this.gap,
                        bottom: pg.y + this.h * 2 + this.gap
                    },
                    left: pg.x,
                    right: pg.x + this.w
                }
                pg.x -= this.dx;
                if (pg.x < -this.w) {
                    this.pipeGenerator.splice(i, 1);
                    score.current++;
                    i--;
                }
                if (b.left < p.right &&
                    b.right > p.left &&
                    b.top < p.top.bottom &&
                    b.bottom > p.top.top) {
                    pipesSync = false;
                    gameState.current = gameState.gameOver;
                    return;
                }
                if (b.left < p.right &&
                    b.right > p.left &&
                    b.top < p.bot.bottom &&
                    b.bottom > p.bot.top) {
                    pipesSync = false;
                    gameState.current = gameState.gameOver;
                    return;
                }
            }
        }
    }
}
const ground = {
    x: 0,
    y: canvas.height - 112,
    w: 224,
    h: 112,
    dx: 2,
    render: function () {
        for (let i = 0; this.x + this.w * i < canvas.width; i++)
            ctx.drawImage(groundImg, this.x + this.w * i, this.y, this.w, this.h);
    },
    position: function () {
        if (gameState.current == gameState.getReady) {
            this.x = 0;
        }
        if (gameState.current == gameState.play) {
            this.x = (this.x - this.dx) % (this.w / 2);
        }
    }
}
const map = [
    num0 = {
        imgX: 56,
        imgY: 24,
        width: 12,
        height: 18
    },
    num1 = {
        imgX: 0,
        imgY: 0,
        width: 10,
        height: 18
    },
    num2 = {
        imgX: 14,
        imgY: 0,
        width: 12,
        height: 18
    },
    num3 = {
        imgX: 28,
        imgY: 0,
        width: 12,
        height: 18
    },
    num4 = {
        imgX: 42,
        imgY: 0,
        width: 12,
        height: 18
    },
    num5 = {
        imgX: 56,
        imgY: 0,
        width: 12,
        height: 18
    },
    num6 = {
        imgX: 0,
        imgY: 24,
        width: 12,
        height: 18
    },
    num7 = {
        imgX: 14,
        imgY: 24,
        width: 12,
        height: 18
    },
    num8 = {
        imgX: 28,
        imgY: 24,
        width: 12,
        height: 18
    },
    num9 = {
        imgX: 42,
        imgY: 24,
        width: 12,
        height: 18
    }
]
const score = {
    current: 0,
    w: 15,
    h: 25,
    x: canvas.width / 2,
    y: 40,
    reset: function () {
        this.current = 0;
    },
    render: function () {
        if (gameState.current == gameState.play ||
            gameState.current == gameState.gameOver) {
            let string = this.current.toString();
            let ones = string.charAt(string.length - 1);
            let tens = string.charAt(string.length - 2);
            let hundreds = string.charAt(string.length - 3);

            if (this.current >= 1000) {
                gameState.current = gameState.gameOver;

            } else if (this.current >= 100) {
                ctx.drawImage(numbersImg, map[ones].imgX, map[ones].imgY, map[ones].width, map[ones].height, ((this.x - this.w / 2) + (this.w) + 3), this.y, this.w, this.h);

                ctx.drawImage(numbersImg, map[tens].imgX, map[tens].imgY, map[tens].width, map[tens].height, ((this.x - this.w / 2)), this.y, this.w, this.h);

                ctx.drawImage(numbersImg, map[hundreds].imgX, map[hundreds].imgY, map[hundreds].width, map[hundreds].height, ((this.x - this.w / 2) - (this.w) - 3), this.y, this.w, this.h);

            } else if (this.current >= 10) {
                ctx.drawImage(numbersImg, map[ones].imgX, map[ones].imgY, map[ones].width, map[ones].height, ((this.x - this.w / 2) + (this.w / 2) + 3), this.y, this.w, this.h);

                ctx.drawImage(numbersImg, map[tens].imgX, map[tens].imgY, map[tens].width, map[tens].height, ((this.x - this.w / 2) - (this.w / 2) - 3), this.y, this.w, this.h);

            } else {
                ctx.drawImage(numbersImg, map[ones].imgX, map[ones].imgY, map[ones].width, map[ones].height, (this.x - this.w / 2), this.y, this.w, this.h);
            }
        }
    }
}
const bird = {
    animation: [
        { imgX: 0, imgY: 0 },
        { imgX: 34, imgY: 0 },
        { imgX: 68, imgY: 0 },
        { imgX: 34, imgY: 0 }
    ],
    fr: 0,
    width: 34,
    height: 24,
    x: 50,
    y: 160,
    w: 34,
    h: 24,
    r: 12,
    fly: 5.25,
    gravity: .32,
    velocity: 0,
    render: function () {
        let bird = this.animation[this.fr];
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.drawImage(birdImg, bird.imgX, bird.imgY, this.width, this.height, -this.w / 2, -this.h / 2, this.w, this.h);
        ctx.restore();
    },
    flap: function () {
        this.velocity = - this.fly;
    },
    position: function () {
        if (gameState.current == gameState.getReady) {
            this.y = 160;
            this.rotation = 0 * degree;
            if (frame % 20 == 0) {
                this.fr += 1;
            }
            if (this.fr > this.animation.length - 1) {
                this.fr = 0;
            }

        } else {
            if (frame % 4 == 0) {
                this.fr += 1;
            }
            if (this.fr > this.animation.length - 1) {
                this.fr = 0;
            }

            this.velocity += this.gravity;
            this.y += this.velocity;

            if (this.velocity <= this.fly) {
                this.rotation = -15 * degree;
            } else if (this.velocity >= this.fly + 2) {
                this.rotation = 70 * degree;
                this.fr = 1;
            } else {
                this.rotation = 0;
            }

            if (this.y + this.h / 2 >= canvas.height - ground.h) {
                this.y = canvas.height - ground.h - this.h / 2;
                if (frame % 1 == 0) {
                    this.fr = 2;
                    this.rotation = 70 * degree;
                }
                if (gameState.current == gameState.play) {
                    gameState.current = gameState.gameOver;
                }
            }

            if (this.y - this.h / 2 <= 0) {
                this.y = this.r;
            }

        }
    }
}
const getReady = {
    imgX: 0,
    imgY: 228,
    width: 174,
    height: 160,
    x: canvas.width / 2 - 174 / 2,
    y: canvas.height / 2 - 160,
    w: 174,
    h: 160
}
const gameOver = {
    imgX: 174,
    imgY: 228,
    width: 188,
    height: 38,
    x: canvas.width / 2 - 188 / 2,
    y: canvas.height / 2 - 38,
    w: 188,
    h: 38,
    render: function () {
        if (gameState.current == gameState.gameOver) {
            ctx.drawImage(gameOverImg, this.x, this.y);
        }
    }
}

let draw = () => {
    ctx.fillStyle = '#00bbc4';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    bg1.render();
    bg2.render();
    bg3.render();
    pipes.render();
    ground.render();
    score.render();
    bird.render();
    gameOver.render();
}
let update = () => {
    bird.position();
    bg1.position();
    bg2.position();
    bg3.position();
    pipes.position();
    ground.position();
}
let loop = () => {
    draw();
    update();
    frame++;
    requestAnimationFrame(loop);
}
// loop()
requestAnimationFrame(loop);

function action() {
    if (gameState.current == gameState.getReady) {
        gameState.current = gameState.play;
    }
    if (gameState.current == gameState.play) {
        bird.flap();
    }
    if (gameState.current == gameState.gameOver) {
        pipes.reset();
        score.reset();
        gameState.current = gameState.getReady;
    }
}

canvas.addEventListener('click', action)
document.body.addEventListener('keydown', (e) => {
    if (e.key == 'ArrowUp') {
        action();
    }
})