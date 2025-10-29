/**
 * Batman Peg Solitaire Game
 * Juego de estrategia con temática de Batman vs Joker
 * @author Tu Nombre
 * @version 1.0
 */

class BatmanPegSolitaire {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error('Canvas no encontrado');
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        
        // Configuración del tablero
        this.boardSize = 7;
        this.cellSize = 70;
        this.pegRadius = 28;
        this.offset = 50;
        
        // Estados del juego
        this.selectedPeg = null;
        this.dragging = false;
        this.dragX = 0;
        this.dragY = 0;
        this.gameStarted = false;
        
        // Tiempo límite: 10 minutos
        this.timeLimit = 600;
        this.timeRemaining = this.timeLimit;
        this.timerInterval = null;
        
        // Estadísticas
        this.moves = 0;
        
        // Tipos de fichas (villanos)
        this.pegTypes = [
            { name: 'Joker', color: '#7c3aed', secondary: '#4c1d95' },
            { name: 'Harley Quinn', color: '#ec4899', secondary: '#9f1239' },
            { name: 'Riddler', color: '#10b981', secondary: '#065f46' },
            { name: 'Penguin', color: '#3b82f6', secondary: '#1e3a8a' },
            { name: 'Two-Face', color: '#f59e0b', secondary: '#92400e' }
        ];
        
        // Imágenes precargadas
        this.images = {};
        this.imagesLoaded = false;
        
        this.initBoard();
        this.loadImages();
        this.setupEventListeners();
    }
    
    /**
     * Carga todas las imágenes necesarias para el juego
     * Crea imágenes procedurales si no hay archivos externos
     */
    loadImages() {
        // Crear imágenes procedurales para los villanos y batarang
        this.createProceduralImages();
        this.imagesLoaded = true;
        this.gameLoop();
    }
    
    /**
     * Crea imágenes procedurales usando canvas
     * Dibuja villanos y batarang con formas y colores
     */
    createProceduralImages() {
        // Crear imagen de Batarang
        const batarangCanvas = document.createElement('canvas');
        batarangCanvas.width = this.pegRadius * 2.2;
        batarangCanvas.height = this.pegRadius * 2.2;
        const bctx = batarangCanvas.getContext('2d');
        this.drawBatarang(bctx, batarangCanvas.width / 2, batarangCanvas.height / 2, this.pegRadius);
        this.images.batarang = batarangCanvas;
        
        // Crear imágenes de villanos
        this.pegTypes.forEach((type, index) => {
            const villainCanvas = document.createElement('canvas');
            villainCanvas.width = this.pegRadius * 2.2;
            villainCanvas.height = this.pegRadius * 2.2;
            const vctx = villainCanvas.getContext('2d');
            this.drawVillain(vctx, villainCanvas.width / 2, villainCanvas.height / 2, this.pegRadius, type, index);
            this.images[`villain${index}`] = villainCanvas;
        });
    }
    
    /**
     * Dibuja un batarang estilizado
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {number} x - Posición X central
     * @param {number} y - Posición Y central
     * @param {number} size - Tamaño del batarang
     */
    drawBatarang(ctx, x, y, size) {
        // Sombra
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;
        
        // Cuerpo del batarang
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.8);
        ctx.lineTo(x - size * 0.9, y);
        ctx.lineTo(x - size * 0.3, y + size * 0.2);
        ctx.lineTo(x, y);
        ctx.lineTo(x + size * 0.3, y + size * 0.2);
        ctx.lineTo(x + size * 0.9, y);
        ctx.closePath();
        ctx.fill();
        
        ctx.shadowColor = 'transparent';
        
        // Detalles dorados
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Logo de Batman en el centro
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.ellipse(x, y, size * 0.15, size * 0.12, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    /**
     * Dibuja un villano estilizado
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {number} x - Posición X central
     * @param {number} y - Posición Y central
     * @param {number} size - Tamaño del villano
     * @param {Object} type - Tipo de villano con colores
     * @param {number} index - Índice del villano
     */
    drawVillain(ctx, x, y, size, type, index) {
        // Sombra
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;
        
        // Círculo base con gradiente
        const gradient = ctx.createRadialGradient(x - size * 0.3, y - size * 0.3, 0, x, y, size);
        gradient.addColorStop(0, type.color);
        gradient.addColorStop(1, type.secondary);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowColor = 'transparent';
        
        // Borde
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Símbolos característicos de cada villano
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.font = `bold ${size * 0.8}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const symbols = ['HA', 'HQ', '?', '☂', '2'];
        ctx.fillText(symbols[index], x, y);
        
        // Resaltado
        const highlight = ctx.createRadialGradient(x - size * 0.4, y - size * 0.4, 0, x - size * 0.4, y - size * 0.4, size * 0.5);
        highlight.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        highlight.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = highlight;
        ctx.beginPath();
        ctx.arc(x - size * 0.3, y - size * 0.3, size * 0.4, 0, Math.PI * 2);
        ctx.fill();
    }
    
    /**
     * Inicializa el tablero con la configuración clásica de Peg Solitaire
     * El tablero tiene forma de cruz con el centro vacío (donde irá el batarang)
     */
    initBoard() {
        this.board = [];
        for (let row = 0; row < this.boardSize; row++) {
            this.board[row] = [];
            for (let col = 0; col < this.boardSize; col++) {
                // Forma de cruz del tablero
                if ((row < 2 || row > 4) && (col < 2 || col > 4)) {
                    this.board[row][col] = null; // Fuera del tablero
                } else if (row === 3 && col === 3) {
                    this.board[row][col] = 0; // Centro vacío
                } else {
                    // Asignar tipo de villano aleatorio (1-5)
                    this.board[row][col] = Math.floor(Math.random() * this.pegTypes.length) + 1;
                }
            }
        }
        this.moves = 0;
        this.updateStats();
    }
    
    /**
     * Configura todos los event listeners para interacción del usuario
     * Maneja mouse down, move y up para drag and drop
     */
    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('mouseleave', (e) => this.handleMouseUp(e));
        
        // Botón de reinicio
        const restartBtn = document.getElementById('restartBtn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => this.restart());
        }
        
        // Botón de play para iniciar el juego
        const playBtn = document.querySelector('.play-btn');
        if (playBtn) {
            playBtn.addEventListener('click', () => this.startGame());
        }
    }
    
    /**
     * Inicia el juego por primera vez
     * Muestra el canvas y oculta el botón de play
     */
    startGame() {
        this.gameStarted = true;
        
        // Ocultar placeholder
        const placeholder = document.getElementById('gamePlaceholder');
        if (placeholder) {
            placeholder.style.display = 'none';
        }
        
        // Mostrar el contenedor del juego
        const gameContainer = document.getElementById('gameContainer');
        if (gameContainer) {
            gameContainer.style.display = 'block';
        }
        
        this.canvas.style.display = 'block';
        this.startTimer();
    }
    
    /**
     * Maneja el evento de mouse down
     * Selecciona una ficha para mover
     */
    handleMouseDown(e) {
        if (!this.gameStarted) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const pos = this.getGridPosition(x, y);
        if (pos && this.board[pos.row][pos.col] > 0) {
            this.selectedPeg = pos;
            this.dragging = true;
            this.dragX = x;
            this.dragY = y;
        }
    }
    
    /**
     * Maneja el movimiento del mouse durante el drag
     * Actualiza la posición visual de la ficha arrastrada
     */
    handleMouseMove(e) {
        if (this.dragging) {
            const rect = this.canvas.getBoundingClientRect();
            this.dragX = e.clientX - rect.left;
            this.dragY = e.clientY - rect.top;
        }
    }
    
    /**
     * Maneja el evento de soltar el mouse
     * Valida y ejecuta el movimiento si es válido
     */
    handleMouseUp(e) {
        if (this.dragging && this.selectedPeg) {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const targetPos = this.getGridPosition(x, y);
            if (targetPos && this.isValidMove(this.selectedPeg, targetPos)) {
                this.makeMove(this.selectedPeg, targetPos);
            }
        }
        
        this.selectedPeg = null;
        this.dragging = false;
    }
    
    /**
     * Convierte coordenadas de píxeles a posición del grid
     * @param {number} x - Coordenada X en píxeles
     * @param {number} y - Coordenada Y en píxeles
     * @returns {Object|null} Objeto con row y col, o null si está fuera
     */
    getGridPosition(x, y) {
        const col = Math.floor((x - this.offset + this.cellSize / 2) / this.cellSize);
        const row = Math.floor((y - this.offset + this.cellSize / 2) / this.cellSize);
        
        if (row >= 0 && row < this.boardSize && col >= 0 && col < this.boardSize && 
            this.board[row][col] !== null) {
            return { row, col };
        }
        return null;
    }
    
    /**
     * Valida si un movimiento es legal según las reglas
     * Debe saltar sobre una ficha adyacente hacia un espacio vacío
     * @param {Object} from - Posición origen {row, col}
     * @param {Object} to - Posición destino {row, col}
     * @returns {boolean} True si el movimiento es válido
     */
    isValidMove(from, to) {
        if (!from || !to) return false;
        
        const rowDiff = to.row - from.row;
        const colDiff = to.col - from.col;
        
        // Solo movimientos horizontales o verticales de 2 casillas
        if ((Math.abs(rowDiff) === 2 && colDiff === 0) || 
            (Math.abs(colDiff) === 2 && rowDiff === 0)) {
            
            // Debe haber una ficha en el medio
            const midRow = from.row + rowDiff / 2;
            const midCol = from.col + colDiff / 2;
            
            return this.board[to.row][to.col] === 0 && this.board[midRow][midCol] > 0;
        }
        
        return false;
    }
    
    /**
     * Ejecuta un movimiento válido en el tablero
     * Mueve la ficha, elimina la ficha saltada y actualiza estado
     * @param {Object} from - Posición origen
     * @param {Object} to - Posición destino
     */
    makeMove(from, to) {
        const midRow = from.row + (to.row - from.row) / 2;
        const midCol = from.col + (to.col - from.col) / 2;
        
        // Mover la ficha
        this.board[to.row][to.col] = this.board[from.row][from.col];
        this.board[from.row][from.col] = 0;
        
        // Eliminar la ficha del medio
        this.board[midRow][midCol] = 0;
        
        this.moves++;
        this.updateStats();
        this.checkGameOver();
    }
    
    /**
     * Obtiene todos los movimientos posibles para una ficha
     * @param {Object} from - Posición de la ficha {row, col}
     * @returns {Array} Array de posiciones válidas
     */
    getPossibleMoves(from) {
        const moves = [];
        const directions = [
            { row: -2, col: 0 },  // Arriba
            { row: 2, col: 0 },   // Abajo
            { row: 0, col: -2 },  // Izquierda
            { row: 0, col: 2 }    // Derecha
        ];
        
        for (const dir of directions) {
            const to = {
                row: from.row + dir.row,
                col: from.col + dir.col
            };
            
            if (to.row >= 0 && to.row < this.boardSize && 
                to.col >= 0 && to.col < this.boardSize &&
                this.board[to.row][to.col] !== null &&
                this.isValidMove(from, to)) {
                moves.push(to);
            }
        }
        
        return moves;
    }
    
    /**
     * Verifica si existe algún movimiento válido en el tablero
     * @returns {boolean} True si hay al menos un movimiento posible
     */
    hasAnyValidMove() {
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] > 0) {
                    const moves = this.getPossibleMoves({ row, col });
                    if (moves.length > 0) return true;
                }
            }
        }
        return false;
    }
    
    /**
     * Cuenta cuántas fichas quedan en el tablero
     * @returns {number} Número de fichas restantes
     */
    countPegs() {
        let count = 0;
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] > 0) count++;
            }
        }
        return count;
    }
    
    /**
     * Verifica las condiciones de fin de juego
     * Victoria: solo queda 1 ficha
     * Derrota: no hay movimientos válidos y quedan más de 1 ficha
     */
    checkGameOver() {
        const pegsLeft = this.countPegs();
        
        if (pegsLeft === 1) {
            // Victoria
            this.stopTimer();
            this.showGameOver(true, '¡Batman ha limpiado Gotham! Solo queda un batarang.');
        } else if (!this.hasAnyValidMove()) {
            // Derrota: no hay más movimientos
            this.stopTimer();
            this.showGameOver(false, `No hay más movimientos. Quedan ${pegsLeft} villanos sueltos.`);
        }
    }
    
    /**
     * Muestra el modal de fin de juego
     * @param {boolean} victory - Si fue victoria o derrota
     * @param {string} message - Mensaje a mostrar
     */
    showGameOver(victory, message) {
        const modal = document.getElementById('gameOverModal');
        const title = document.getElementById('gameOverTitle');
        const msg = document.getElementById('gameOverMessage');
        const stats = document.getElementById('gameOverStats');
        
        if (modal) {
            title.textContent = victory ? '¡Victoria!' : 'Fin del Juego';
            title.className = victory ? 'victory' : 'defeat';
            msg.textContent = message;
            
            const minutes = Math.floor((this.timeLimit - this.timeRemaining) / 60);
            const seconds = (this.timeLimit - this.timeRemaining) % 60;
            stats.textContent = `Movimientos: ${this.moves} | Tiempo: ${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            modal.classList.add('show');
        }
    }
    
    /**
     * Actualiza las estadísticas mostradas en pantalla
     */
    updateStats() {
        const villainsEl = document.getElementById('villainsCount');
        const movesEl = document.getElementById('movesCount');
        
        if (villainsEl) villainsEl.textContent = this.countPegs();
        if (movesEl) movesEl.textContent = this.moves;
    }
    
    /**
     * Inicia el temporizador del juego (10 minutos)
     */
    startTimer() {
        this.stopTimer();
        this.timeRemaining = this.timeLimit;
        this.updateTimerDisplay();
        
        this.timerInterval = setInterval(() => {
            this.timeRemaining--;
            this.updateTimerDisplay();
            
            if (this.timeRemaining <= 0) {
                this.stopTimer();
                this.showGameOver(false, 'Se acabó el tiempo. Los villanos escaparon.');
            }
        }, 1000);
    }
    
    /**
     * Detiene el temporizador
     */
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    /**
     * Actualiza la visualización del temporizador
     */
    updateTimerDisplay() {
        const timerEl = document.getElementById('timerDisplay');
        if (timerEl) {
            const minutes = Math.floor(this.timeRemaining / 60);
            const seconds = this.timeRemaining % 60;
            timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    }
    
    /**
     * Reinicia el juego completamente
     */
    restart() {
        this.initBoard();
        this.selectedPeg = null;
        this.dragging = false;
        this.startTimer();
        
        const modal = document.getElementById('gameOverModal');
        if (modal) {
            modal.classList.remove('show');
        }
    }
    
    /**
     * Dibuja el fondo del tablero estilo Gotham
     */
    drawBackground() {
        // Fondo oscuro de Gotham
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#0f172a');
        gradient.addColorStop(1, '#1e293b');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Textura de ciudad
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height;
            const w = Math.random() * 3;
            const h = Math.random() * 30;
            this.ctx.fillRect(x, y, w, h);
        }
    }
    
    /**
     * Dibuja el tablero de juego
     */
    drawBoard() {
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] !== null) {
                    const x = this.offset + col * this.cellSize;
                    const y = this.offset + row * this.cellSize;
                    
                    // Celda del tablero con estilo Batman
                    const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, this.pegRadius + 5);
                    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
                    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.1)');
                    this.ctx.fillStyle = gradient;
                    this.ctx.beginPath();
                    this.ctx.arc(x, y, this.pegRadius + 8, 0, Math.PI * 2);
                    this.ctx.fill();
                    
                    // Borde dorado estilo Batman
                    this.ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
                    this.ctx.lineWidth = 2;
                    this.ctx.stroke();
                }
            }
        }
    }
    
    /**
     * Dibuja todas las fichas en el tablero
     */
    drawPegs() {
        if (!this.imagesLoaded) return;
        
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] > 0) {
                    // No dibujar la ficha que se está arrastrando
                    if (this.dragging && this.selectedPeg && 
                        this.selectedPeg.row === row && this.selectedPeg.col === col) {
                        continue;
                    }
                    
                    const x = this.offset + col * this.cellSize;
                    const y = this.offset + row * this.cellSize;
                    const type = this.board[row][col] - 1;
                    
                    const img = this.images[`villain${type}`];
                    if (img) {
                        this.ctx.drawImage(img, x - this.pegRadius * 1.1, y - this.pegRadius * 1.1);
                    }
                }
            }
        }
        
        // Dibujar ficha arrastrada
        if (this.dragging && this.selectedPeg) {
            const type = this.board[this.selectedPeg.row][this.selectedPeg.col] - 1;
            const img = this.images[`villain${type}`];
            if (img) {
                this.ctx.globalAlpha = 0.8;
                this.ctx.drawImage(img, this.dragX - this.pegRadius * 1.1, this.dragY - this.pegRadius * 1.1);
                this.ctx.globalAlpha = 1;
            }
        }
    }
    
    /**
     * Dibuja los hints animados (flechas) que muestran movimientos válidos
     */
    drawHints() {
        if (!this.selectedPeg) return;
        
        const possibleMoves = this.getPossibleMoves(this.selectedPeg);
        const time = Date.now() / 1000;
        
        for (const move of possibleMoves) {
            const x = this.offset + move.col * this.cellSize;
            const y = this.offset + move.row * this.cellSize;
            
            // Animación de pulsación
            const scale = 1 + Math.sin(time * 4) * 0.15;
            const alpha = 0.7 + Math.sin(time * 4) * 0.3;
            
            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            this.ctx.translate(x, y);
            this.ctx.scale(scale, scale);
            
            // Círculo de destino brillante
            const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, this.pegRadius + 5);
            gradient.addColorStop(0, 'rgba(251, 191, 36, 0.9)');
            gradient.addColorStop(1, 'rgba(251, 191, 36, 0.2)');
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, this.pegRadius + 5, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Dibujar batarang pequeño como indicador
            if (this.images.batarang) {
                this.ctx.drawImage(this.images.batarang, -this.pegRadius * 0.6, -this.pegRadius * 0.6, 
                                  this.pegRadius * 1.2, this.pegRadius * 1.2);
            }
            
            this.ctx.restore();
            
            // Flecha direccional animada
            const fromX = this.selectedPeg.col * this.cellSize;
            const fromY = this.selectedPeg.row * this.cellSize;
            const toX = move.col * this.cellSize;
            const toY = move.row * this.cellSize;
            const angle = Math.atan2(toY - fromY, toX - fromX);
            
            const arrowOffset = 20 + Math.sin(time * 4) * 5;
            const arrowX = x - Math.cos(angle) * arrowOffset;
            const arrowY = y - Math.sin(angle) * arrowOffset;
            
            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            this.ctx.translate(arrowX, arrowY);
            this.ctx.rotate(angle);
            
            // Flecha dorada
            this.ctx.fillStyle = '#fbbf24';
            this.ctx.beginPath();
            this.ctx.moveTo(10, 0);
            this.ctx.lineTo(-5, -8);
            this.ctx.lineTo(-5, 8);
            this.ctx.closePath();
            this.ctx.fill();
            
            this.ctx.restore();
        }
    }
    
    /**
     * Renderiza todo el juego
     */
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawBackground();
        this.drawBoard();
        this.drawPegs();
        this.drawHints();
    }
    
    /**
     * Loop principal del juego
     */
    gameLoop() {
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Inicializar el juego cuando el DOM esté listo
let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new BatmanPegSolitaire('batmanCanvas');
});