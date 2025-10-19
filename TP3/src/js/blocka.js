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
        // La condición de victoria es simplemente que todas las piezas estén en su rotación original (0 grados).
        const isWin = pieces.every(p => p.rotation === 0);
        if (isWin) {
            stopTimer();
            finalTimeDisplay.textContent = formatTime(seconds);

            // Quita los filtros para mostrar la imagen original.
            pieces.forEach(p => p.draw(false));

            // Muestra la pantalla de victoria.
            setTimeout(() => {
                gameArea.classList.add('hidden');
                winScreen.classList.remove('hidden');
            }, 500); // Pequeña demora para que el jugador vea la imagen completa.


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
            this.x = x; // Coordenada X en la imagen original
            this.y = y; // Coordenada Y en la imagen original
            this.size = size;
            this.index = index;
            
            // La rotación inicial es aleatoria (0, 90, 180, o 270 grados).
            this.rotation = Math.floor(Math.random() * 4) * 90;
            // Si por casualidad todas empiezan en 0, rotamos la primera.
            if (this.index === 0 && this.rotation === 0) {
                 this.rotation = 90;
            }

            this.element = document.createElement('canvas');
            this.element.width = size;
            this.element.height = size;
            this.ctx = this.element.getContext('2d');

            // Evento para rotar a la izquierda (clic izquierdo)
            this.element.addEventListener('click', () => this.rotate(-90));
            // Evento para rotar a la derecha (clic derecho)
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
            // Dibuja la porción correcta de la imagen original en el canvas.
            ctx.drawImage(this.img, this.x, this.y, this.size, this.size, -this.size / 2, -this.size / 2, this.size, this.size);
            ctx.restore();
        }
        
        getFilter() {
             if (currentLevel === 1) return FILTERS[0]; // Escala de grises
             if (currentLevel === 2) return FILTERS[1]; // Brillo
             if (currentLevel >= 3) return FILTERS[this.index % FILTERS.length]; // Mezcla de filtros
             return 'none';
        }
    }

    function setupLevel() {
        grid.innerHTML = '';
        pieces = [];
        levelDisplay.textContent = currentLevel;

        let availableImages = IMAGE_BANK.filter(img => !usedImages.includes(img));
        if (availableImages.length === 0) {
            usedImages = [];
            availableImages = IMAGE_BANK;
        }

        const imgSrc = availableImages[Math.floor(Math.random() * availableImages.length)];
        usedImages.push(imgSrc);

        const img = new Image();
        img.crossOrigin = "Anonymous"; // Permite que el canvas no tenga problemas de seguridad con las imágenes.
        img.src = imgSrc;
        img.onload = () => {
            const size = Math.min(img.width, img.height);
            const pieceSize = size / 2;

            // Crea las 4 piezas en el orden correcto, sin desordenarlas.
            for (let i = 0; i < 4; i++) {
                const x = (i % 2) * pieceSize;
                const y = Math.floor(i / 2) * pieceSize;
                const piece = new Piece(img, x, y, pieceSize, i);
                pieces.push(piece);
                grid.appendChild(piece.element);
                piece.draw();
            }
            
            // Si el juego comienza resuelto por azar, se vuelve a barajar una pieza.
             if (pieces.every(p => p.rotation === 0)) {
                pieces[0].rotate(90);
             }
        };
    }

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