document.addEventListener('DOMContentLoaded', () => {
    const startScreen = document.getElementById('blocka-start-screen');
    const gameArea = document.getElementById('blocka-game-area');
    const winScreen = document.getElementById('blocka-win-screen');
    const startButton = document.getElementById('blocka-start-button');
    const grid = document.getElementById('blocka-grid');
    const levelDisplay = document.getElementById('blocka-level');
    const timerDisplay = document.getElementById('blocka-timer');
    const finalTimeDisplay = document.getElementById('blocka-final-time');
    const nextLevelButton = document.getElementById('blocka-next-level-button');

    const IMAGE_BANK = [
        'assets/img/blocka-img-1.jpg',
        'assets/img/blocka-img-2.jpg',
        'assets/img/blocka-img-3.jpg',
        'assets/img/blocka-img-4.jpg',
        'assets/img/blocka-img-5.jpg',
        'assets/img/blocka-img-6.jpg'
    ];

    const FILTERS = ['grayscale(1)', 'brightness(0.3)', 'invert(1)'];

    let currentLevel = 1;
    let pieces = [];
    let timerInterval;
    let seconds = 0;
    let usedImages = [];
    let gridSize = 4; // Nueva variable para el tamaño de la grilla (4, 6 u 8 piezas)

    function formatTime(sec) {
        const minutes = Math.floor(sec / 60);
        const seconds = sec % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    function startTimer() {
        seconds = 0;
        timerDisplay.textContent = formatTime(seconds);
        timerInterval = setInterval(() => {
            seconds++;
            timerDisplay.textContent = formatTime(seconds);
        }, 1000);
    }

    function stopTimer() {
        clearInterval(timerInterval);
    }

    function checkWinCondition() {
        const isWin = pieces.every(p => p.rotation === 0);
        if (isWin) {
            stopTimer();
            finalTimeDisplay.textContent = formatTime(seconds);

            pieces.forEach(p => p.draw(false));

            setTimeout(() => {
                gameArea.classList.add('hidden');
                winScreen.classList.remove('hidden');
            }, 500);

            if (currentLevel >= 3) {
                nextLevelButton.textContent = 'Jugar de Nuevo';
            } else {
                nextLevelButton.textContent = 'Siguiente Nivel';
            }
        }
    }

    class Piece {
        constructor(img, x, y, size, index) {
            this.img = img;
            this.x = x;
            this.y = y;
            this.size = size;
            this.index = index;
            
            this.rotation = Math.floor(Math.random() * 4) * 90;
            if (this.index === 0 && this.rotation === 0) {
                 this.rotation = 90;
            }

            this.element = document.createElement('canvas');
            this.element.width = size;
            this.element.height = size;
            this.ctx = this.element.getContext('2d');

            this.element.addEventListener('click', () => this.rotate(-90));
            this.element.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.rotate(90);
            });
        }

        rotate(angle) {
            this.rotation = (this.rotation + angle + 360) % 360;
            this.draw();
            checkWinCondition();
        }

        draw(applyFilter = true) {
            const ctx = this.ctx;
            ctx.clearRect(0, 0, this.size, this.size);
            ctx.save();
            ctx.translate(this.size / 2, this.size / 2);
            ctx.rotate(this.rotation * Math.PI / 180);
            if(applyFilter) {
                ctx.filter = this.getFilter();
            } else {
                ctx.filter = 'none';
            }
            ctx.drawImage(this.img, this.x, this.y, this.size, this.size, -this.size / 2, -this.size / 2, this.size, this.size);
            ctx.restore();
        }
        
        getFilter() {
             if (currentLevel === 1) return FILTERS[0];
             if (currentLevel === 2) return FILTERS[1];
             if (currentLevel >= 3) return FILTERS[this.index % FILTERS.length];
             return 'none';
        }
    }

    function setupLevel() {
        grid.innerHTML = '';
        pieces = [];
        levelDisplay.textContent = currentLevel;

        // Configura la clase CSS según el tamaño de la grilla
        grid.className = '';
        if (gridSize === 4) {
            grid.classList.add('grid-2x2');
        } else if (gridSize === 6) {
            grid.classList.add('grid-2x3');
        } else if (gridSize === 8) {
            grid.classList.add('grid-3x3'); // 8 piezas no caben perfectamente, usamos 3x3
        }

        let availableImages = IMAGE_BANK.filter(img => !usedImages.includes(img));
        if (availableImages.length === 0) {
            usedImages = [];
            availableImages = IMAGE_BANK;
        }

        const imgSrc = availableImages[Math.floor(Math.random() * availableImages.length)];
        usedImages.push(imgSrc);

        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = imgSrc;
        img.onload = () => {
            const size = Math.min(img.width, img.height);
            
            // Calcula las dimensiones de la grilla según el número de piezas
            let cols, rows;
            if (gridSize === 4) {
                cols = 2; rows = 2;
            } else if (gridSize === 6) {
                cols = 2; rows = 3;
            } else if (gridSize === 8) {
                cols = 3; rows = 3; // Usamos 9 espacios pero solo mostramos 8
            }
            
            const pieceSize = size / Math.max(cols, rows);

            // Crea las piezas
            for (let i = 0; i < gridSize; i++) {
                const col = i % cols;
                const row = Math.floor(i / cols);
                const x = col * pieceSize;
                const y = row * pieceSize;
                const piece = new Piece(img, x, y, pieceSize, i);
                pieces.push(piece);
                grid.appendChild(piece.element);
                piece.draw();
            }
            
            if (pieces.every(p => p.rotation === 0)) {
                pieces[0].rotate(90);
            }
        };
    }

    // Agrega los botones de selección de dificultad al inicio
    function createDifficultySelector() {
        const selector = document.createElement('div');
        selector.className = 'difficulty-selector';
        selector.innerHTML = `
            <button class="difficulty-btn selected subtitle-s1" data-size="4">Fácil (2x2)</button>
            <button class="difficulty-btn subtitle-s1" data-size="6">Medio (2x3)</button>
            <button class="difficulty-btn subtitle-s1" data-size="8">Difícil (3x3)</button>
        `;
        
        const buttons = selector.querySelectorAll('.difficulty-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                buttons.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                gridSize = parseInt(btn.dataset.size);
            });
        });
        
        const startScreenP = startScreen.querySelector('p');
        startScreenP.after(selector);
    }

    createDifficultySelector();

    startButton.addEventListener('click', () => {
        startScreen.classList.add('hidden');
        gameArea.classList.remove('hidden');
        winScreen.classList.add('hidden');
        currentLevel = 1;
        usedImages = [];
        setupLevel();
        startTimer();
    });

    nextLevelButton.addEventListener('click', () => {
        if (currentLevel >= 3) {
           currentLevel = 1;
           usedImages = [];
        } else {
            currentLevel++;
        }
        winScreen.classList.add('hidden');
        gameArea.classList.remove('hidden');
        setupLevel();
        startTimer();
    });
});