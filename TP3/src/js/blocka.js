document.addEventListener('DOMContentLoaded', () => {
    const startScreen = document.getElementById('blocka-start-screen');
    const gameArea = document.getElementById('blocka-game-area');
    const winScreen = document.getElementById('blocka-win-screen');
    const loseScreen = document.getElementById('blocka-lose-screen');
    const startButton = document.getElementById('blocka-start-button');
    const nextLevelButton = document.getElementById('blocka-next-level-button');
    const mainMenuButton = document.getElementById('blocka-main-menu-button');
    const loseMenuButton = document.getElementById('blocka-lose-menu-button');
    const retryButton = document.getElementById('blocka-retry-button');
    const grid = document.getElementById('blocka-grid');
    const levelDisplay = document.getElementById('blocka-level');
    const timerDisplay = document.getElementById('blocka-timer');
    const finalTimeDisplay = document.getElementById('blocka-final-time');
    const timeLimitDisplay = document.getElementById('blocka-time-limit');
    const helpButton = document.getElementById('blocka-help-button');
    const recordDisplay = document.getElementById('blocka-record');
    const bestTimeDisplay = document.getElementById('blocka-best-time');
    const recordMessage = document.getElementById('blocka-record-message');
    const pieceRadios = document.querySelectorAll('input[name="blocka-piece-count"]');
    const startThumbnails = document.querySelectorAll('#blocka-thumbnail-grid .thumbnail');
    const overlay = document.getElementById('blocka-thumbnail-overlay');
    const overlayThumbnails = overlay ? overlay.querySelectorAll('.thumbnail') : [];

    const IMAGE_BANK = [
        'assets/img/blocka-img-1.jpg',
        'assets/img/blocka-img-2.jpg',
        'assets/img/blocka-img-3.jpg',
        'assets/img/blocka-img-4.jpg',
        'assets/img/blocka-img-5.jpg',
        'assets/img/blocka-img-6.jpg'
    ];

    const FILTERS = ['grayscale(1)', 'brightness(0.3)', 'invert(1)'];
    const LEVEL_TIME_LIMIT = {
        1: null,
        2: 120,
        3: 90
    };

    let selectedPieceCount = 4;
    let currentLevel = 1;
    let pieces = [];
    let timerInterval = null;
    let seconds = 0;
    let usedImages = [];
    let helpUsed = false;
    let timeLimit = null;
    let isGameActive = false;
    let hasTimeExpired = false;
    let currentRecord = null;

    const storage = (() => {
        try {
            return window.localStorage;
        } catch (err) {
            return null;
        }
    })();

    class Piece {
        constructor(img, x, y, width, height, index) {
            this.img = img;
            this.sx = x;
            this.sy = y;
            this.sourceWidth = width;
            this.sourceHeight = height;
            this.index = index;
            this.rotation = randomRotation();
            this.isLocked = false;

            // Usar mayor resolución para mejor calidad (2x)
            const scale = 2;
            this.scale = scale;
            
            // Calcular la diagonal para que quepa en cualquier rotación
            const diagonal = Math.ceil(Math.sqrt(width * width + height * height));
            
            // El contenedor debe ser cuadrado del tamaño de la diagonal
            this.container = document.createElement('div');
            this.container.className = 'blocka-piece';
            this.container.style.aspectRatio = '1 / 1';

            // Canvas cuadrado del tamaño de la diagonal
            this.canvasSize = diagonal * scale;
            
            this.canvas = document.createElement('canvas');
            this.canvas.width = this.canvasSize;
            this.canvas.height = this.canvasSize;
            
            // El canvas ocupa todo el contenedor
            this.canvas.style.width = '100%';
            this.canvas.style.height = '100%';
            this.canvas.style.display = 'block';
            
            // Configurar contexto con opciones de calidad
            this.ctx = this.canvas.getContext('2d', { 
                alpha: true,
                desynchronized: false 
            });
            
            // Activar suavizado de alta calidad
            this.ctx.imageSmoothingEnabled = true;
            this.ctx.imageSmoothingQuality = 'high';

            this.container.appendChild(this.canvas);
            this.bindEvents();
            this.draw();
        }

        bindEvents() {
            this.container.addEventListener('click', () => this.rotate(-90));
            this.container.addEventListener('contextmenu', (event) => {
                event.preventDefault();
                this.rotate(90);
            });
        }

        rotate(angle) {
            if (this.isLocked || !isGameActive || hasTimeExpired) return;
            this.rotation = (this.rotation + angle + 360) % 360;
            this.draw();
            checkWinCondition();
        }

        draw(applyFilter = true) {
            const ctx = this.ctx;
            const scale = this.scale;
            
            // Resetear transformaciones
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            
            // Limpiar canvas
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Centrar
            ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
            ctx.scale(scale, scale);
            ctx.rotate(this.rotation * Math.PI / 180);
            
            // Aplicar filtro si corresponde
            ctx.filter = applyFilter ? this.getFilter() : 'none';
            
            // Calcular el factor de escala para cubrir todo el área (como object-fit: cover)
            const canvasLogicalSize = this.canvas.width / scale;
            const scaleX = canvasLogicalSize / this.sourceWidth;
            const scaleY = canvasLogicalSize / this.sourceHeight;
            const coverScale = Math.max(scaleX, scaleY);
            
            const drawWidth = this.sourceWidth * coverScale;
            const drawHeight = this.sourceHeight * coverScale;
            
            // Dibujar la porción de imagen escalada para cubrir todo
            ctx.drawImage(
                this.img,
                this.sx,
                this.sy,
                this.sourceWidth,
                this.sourceHeight,
                -drawWidth / 2,
                -drawHeight / 2,
                drawWidth,
                drawHeight
            );
            
            ctx.restore();
        }

        getFilter() {
            if (currentLevel === 1) return FILTERS[0];
            if (currentLevel === 2) return FILTERS[1];
            if (currentLevel >= 3) return FILTERS[this.index % FILTERS.length];
            return 'none';
        }

        lockInPlace() {
            this.rotation = 0;
            this.isLocked = true;
            this.draw();
            this.container.classList.add('is-locked');
        }
    }

    pieceRadios.forEach((radio) => {
        radio.addEventListener('change', () => {
            if (radio.checked) {
                selectedPieceCount = parseInt(radio.value, 10);
            }
        });
    });

    startButton.addEventListener('click', async () => {
        await beginNewRun();
    });

    nextLevelButton.addEventListener('click', async () => {
        await advanceLevel();
    });

    helpButton.addEventListener('click', () => {
        useHelp();
    });

    retryButton.addEventListener('click', async () => {
        await restartLevel();
    });

    if (mainMenuButton) {
        mainMenuButton.addEventListener('click', () => {
            backToMenu();
        });
    }

    if (loseMenuButton) {
        loseMenuButton.addEventListener('click', () => {
            backToMenu();
        });
    }

    function randomRotation() {
        return Math.floor(Math.random() * 4) * 90;
    }

    function formatTime(totalSeconds) {
        const minutes = Math.floor(totalSeconds / 60);
        const secondsPart = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secondsPart.toString().padStart(2, '0')}`;
    }

    function updateTimerDisplay() {
        timerDisplay.textContent = formatTime(seconds);
    }

    function updateTimeLimitDisplay() {
        timeLimitDisplay.textContent = timeLimit ? formatTime(timeLimit) : '--';
    }

    function getRecordKey(level, pieces) {
        return `blocka-record-l${level}-p${pieces}`;
    }

    function loadRecord(level, pieces) {
        if (!storage) return null;
        const raw = storage.getItem(getRecordKey(level, pieces));
        if (!raw) return null;
        const parsed = parseInt(raw, 10);
        return Number.isNaN(parsed) ? null : parsed;
    }

    function saveRecord(level, pieces, value) {
        if (!storage) return;
        storage.setItem(getRecordKey(level, pieces), value.toString());
    }

    function updateRecordDisplay(value) {
        if (!recordDisplay) return;
        if (value === null || value === undefined) {
            recordDisplay.textContent = '--';
            return;
        }
        recordDisplay.textContent = formatTime(value);
    }

    function updateBestTimeDisplay(value) {
        if (!bestTimeDisplay) return;
        if (value === null || value === undefined) {
            bestTimeDisplay.textContent = '--';
            return;
        }
        bestTimeDisplay.textContent = formatTime(value);
    }

    function setRecordMessage(isVisible) {
        if (!recordMessage) return;
        recordMessage.classList.toggle('hidden', !isVisible);
    }

    function updateRecordIfNeeded() {
        if (currentRecord === null || seconds < currentRecord) {
            saveRecord(currentLevel, selectedPieceCount, seconds);
            currentRecord = seconds;
            updateRecordDisplay(currentRecord);
            updateBestTimeDisplay(currentRecord);
            return true;
        }
        updateBestTimeDisplay(currentRecord);
        return false;
    }

    function startTimer() {
        stopTimer();
        seconds = 0;
        updateTimerDisplay();
        timerInterval = setInterval(() => {
            seconds += 1;
            updateTimerDisplay();
            if (timeLimit !== null && seconds >= timeLimit) {
                handleTimeUp();
            }
        }, 1000);
    }

    function adjustTimer(extraSeconds) {
        seconds += extraSeconds;
        if (seconds < 0) seconds = 0;
        updateTimerDisplay();
        if (timeLimit !== null && seconds >= timeLimit) {
            handleTimeUp();
        }
    }

    function stopTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }

    async function beginNewRun() {
        stopTimer();
        currentLevel = 1;
        usedImages = [];
        seconds = 0;
        updateTimerDisplay();
        winScreen.classList.add('hidden');
        loseScreen.classList.add('hidden');
        startScreen.classList.add('hidden');
        gameArea.classList.remove('hidden');
        gameArea.classList.add('is-loading');
        await setupLevel();
        startTimer();
    }

    async function advanceLevel() {
        stopTimer();
        if (currentLevel >= 3) {
            currentLevel = 1;
            usedImages = [];
        } else {
            currentLevel += 1;
        }
        winScreen.classList.add('hidden');
        gameArea.classList.remove('hidden');
        gameArea.classList.add('is-loading');
        await setupLevel();
        startTimer();
    }

    async function restartLevel() {
        stopTimer();
        loseScreen.classList.add('hidden');
        gameArea.classList.remove('hidden');
        gameArea.classList.add('is-loading');
        await setupLevel();
        startTimer();
    }

    function backToMenu() {
        stopTimer();
        isGameActive = false;
        hasTimeExpired = false;
        gameArea.classList.add('hidden');
        gameArea.classList.remove('is-loading');
        winScreen.classList.add('hidden');
        loseScreen.classList.add('hidden');
        startScreen.classList.remove('hidden');
        levelDisplay.textContent = currentLevel = 1;
        timerDisplay.textContent = formatTime(0);
        updateRecordDisplay(null);
        updateBestTimeDisplay(null);
        setRecordMessage(false);
        currentRecord = null;
        clearThumbnailHighlights();
    }

    async function setupLevel() {
        grid.innerHTML = '';
        pieces = [];
        helpUsed = false;
        hasTimeExpired = false;
        gameArea.classList.add('is-loading');
        setRecordMessage(false);
        helpButton.disabled = false;
        helpButton.classList.remove('is-disabled');
        helpButton.textContent = 'Pedir Ayudita (+5s)';
        const { cols, rows } = getGridDimensions(selectedPieceCount);
        grid.style.setProperty('--blocka-cols', cols);
        grid.style.setProperty('--blocka-rows', rows);

        levelDisplay.textContent = currentLevel.toString();
        timeLimit = LEVEL_TIME_LIMIT[currentLevel] ?? null;
        updateTimeLimitDisplay();
        currentRecord = loadRecord(currentLevel, selectedPieceCount);
        updateRecordDisplay(currentRecord);
        updateBestTimeDisplay(currentRecord);

        let availableImages = IMAGE_BANK.filter((img) => !usedImages.includes(img));
        if (availableImages.length === 0) {
            usedImages = [];
            availableImages = IMAGE_BANK.slice();
        }

        const imgSrc = availableImages[Math.floor(Math.random() * availableImages.length)];
        usedImages.push(imgSrc);

        try {
            await animateThumbnailSelection(imgSrc);
            const image = await loadImage(imgSrc);
            createPieces(image, cols, rows);
            ensureShuffled();
            isGameActive = true;
        } finally {
            gameArea.classList.remove('is-loading');
        }
    }

    function getGridDimensions(count) {
        switch (count) {
            case 6:
                return { cols: 3, rows: 2 };
            case 8:
                return { cols: 4, rows: 2 };
            default:
                return { cols: 2, rows: 2 };
        }
    }

    function loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }

    function createPieces(img, cols, rows) {
        // Tomamos la parte central cuadrada de la imagen
        const usableSize = Math.min(img.width, img.height);
        const offsetX = (img.width - usableSize) / 2;
        const offsetY = (img.height - usableSize) / 2;

        // Todas las piezas serán cuadradas
        const pieceSize = usableSize / Math.max(cols, rows);

        for (let row = 0; row < rows; row += 1) {
            for (let col = 0; col < cols; col += 1) {
                const index = row * cols + col;
                const sx = offsetX + col * pieceSize;
                const sy = offsetY + row * pieceSize;
                const piece = new Piece(img, sx, sy, pieceSize, pieceSize, index);
                pieces.push(piece);
                grid.appendChild(piece.container);
            }
        }
    }

    function ensureShuffled() {
        const solved = pieces.every((piece) => piece.rotation === 0);
        if (solved && pieces.length > 0) {
            pieces[0].rotation = 90;
            pieces[0].draw();
        }
    }

    function checkWinCondition() {
        if (!isGameActive || hasTimeExpired) return;
        const solved = pieces.every((piece) => piece.rotation === 0);
        if (!solved) return;

        stopTimer();
        isGameActive = false;
        finalTimeDisplay.textContent = formatTime(seconds);
        const isNewRecord = updateRecordIfNeeded();
        setRecordMessage(isNewRecord);
        pieces.forEach((piece) => piece.draw(false));
        helpButton.disabled = true;
        helpButton.classList.add('is-disabled');

        setTimeout(() => {
            gameArea.classList.add('hidden');
            winScreen.classList.remove('hidden');
            nextLevelButton.textContent = currentLevel >= 3 ? 'Jugar de Nuevo' : 'Siguiente Nivel';
        }, 400);
    }

    function useHelp() {
        if (helpUsed || !isGameActive || hasTimeExpired) return;
        const candidates = pieces.filter((piece) => piece.rotation !== 0 && !piece.isLocked);
        if (candidates.length === 0) return;
        const target = candidates[Math.floor(Math.random() * candidates.length)];
        target.lockInPlace();
        helpUsed = true;
        helpButton.disabled = true;
        helpButton.classList.add('is-disabled');
        helpButton.textContent = 'Ayudita usada';
        adjustTimer(5);
        checkWinCondition();
    }

    function handleTimeUp() {
        if (hasTimeExpired) return;
        hasTimeExpired = true;
        stopTimer();
        isGameActive = false;
        helpButton.disabled = true;
        helpButton.classList.add('is-disabled');
        setRecordMessage(false);
        gameArea.classList.remove('is-loading');
        gameArea.classList.add('hidden');
        loseScreen.classList.remove('hidden');
    }

    async function animateThumbnailSelection(targetSrc) {
        if (!overlay) return;

        const targetIndex = IMAGE_BANK.indexOf(targetSrc);
        overlay.classList.remove('hidden');
        overlay.setAttribute('aria-hidden', 'false');
        clearThumbnailHighlights();

        let step = 0;
        const totalThumbs = overlayThumbnails.length;
        const totalSteps = totalThumbs * 3 + targetIndex;

        await new Promise((resolve) => {
            const interval = setInterval(() => {
                const currentIndex = step % totalThumbs;
                overlayThumbnails.forEach((thumb, idx) => {
                    thumb.classList.toggle('is-active', idx === currentIndex);
                });
                step += 1;
                if (step > totalSteps) {
                    clearInterval(interval);
                    overlayThumbnails.forEach((thumb, idx) => {
                        thumb.classList.toggle('is-active', idx === targetIndex);
                    });
                    resolve();
                }
            }, 150);
        });

        startThumbnails.forEach((thumb, idx) => {
            thumb.classList.toggle('is-selected', idx === targetIndex);
        });

        await wait(700);
        overlay.classList.add('hidden');
        overlay.setAttribute('aria-hidden', 'true');
        overlayThumbnails.forEach((thumb) => thumb.classList.remove('is-active'));
    }

    function clearThumbnailHighlights() {
        startThumbnails.forEach((thumb) => thumb.classList.remove('is-selected'));
        overlayThumbnails.forEach((thumb) => thumb.classList.remove('is-active'));
    }

    function wait(ms) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }
});