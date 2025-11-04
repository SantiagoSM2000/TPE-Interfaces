class Controller {
    constructor(selectedPiece) {
        this.tiempoDeJuego = 100;
        this.canvas = document.getElementById('game-canvas');
        this.gameStartScreen = document.getElementById('game-start-screen');

        this.model = new PegSolitaireGame(this.tiempoDeJuego);
        this.view = new View(this.canvas,selectedPiece);

        // Estado de arrastre de fichas (drag and drop)
        this.isDragging = false;
        this.fichaFlotante = null;
        this.fOrigen = -1;
        this.cOrigen = -1;
        this.mouseX = 0;
        this.mouseY = 0;

        this.posiblesMovimientos = [];
        // Estado de la UI del HUD
        this.isRestartButtonHovered = false;
        this.isRestartButtonPressed = false;
        this.isMenuButtonHovered = false;
        this.isMenuButtonPressed = false;
        this.endBanner = {
            visible: false,
            title: '',
            subtitle: ''
        };
        this.timeUpNotified = false;

        // Precalculamos el rectangulo de los botones para reutilizarlos
        this.restartButtonBounds = this._createRestartButtonBounds();
        this.menuButtonBounds = this._createMenuButtonBounds();
    }

    init() {
        this.view.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.view.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.view.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.view.canvas.addEventListener('mouseout', this.handleMouseOut.bind(this));
        this.canvas.classList.remove('hidden');
        this.gameStartScreen.classList.add('hidden');
        this.checkImagesLoaded();
    }
        
    gameLoop() {
        const imageLoaded = this.view.getImageLoaded();
        if (imageLoaded) {
            this.view.draw(this.model, this.getRenderState());
        }
        
        // Si el tiempo llega a cero delegamos la transicion al controlador
        if (!this.model.estaEnJuego() && this.model.obtenerTiempoRestante() === 0) {
            this.showTiempoAgotado();
        }
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    checkImagesLoaded() {
        if (this.view.getImageLoaded) {
            console.log('Iniciando game loop...');
            // Iniciamos el temporizador apenas inicia el gameLoop
            this.model.iniciarTimer();
            requestAnimationFrame(() => this.gameLoop());
        } else {
            // Esperamos a que las imagenes del tablero esten listas antes de dibujar
            console.log('Esperando imagenes...');
            setTimeout(this.checkImagesLoaded, 100);
        }
    }

    mostrarMenu() {
        this.gameStartScreen.classList.remove('hidden');
        this.canvas.classList.add('hidden');
    }

    handleMouseDown(e) {
        this.mouseX = e.offsetX;
        this.mouseY = e.offsetY;

        if (this.endBanner.visible) {
            // Cualquier clic sobre el banner reinicia la partida
            this.restartGame();
            return;
        }

        if (this._isInsideRestartButton(this.mouseX, this.mouseY)) {
            this.isRestartButtonPressed = true;
            this.isRestartButtonHovered = true;
            return;
        }

        if (this._isInsideMenuButton(this.mouseX, this.mouseY)) {
            this.isMenuButtonPressed = true;
            this.isMenuButtonHovered = true;
            return;
        }

        if (this.mouseY < this.view.HUD_HEIGHT) {
            return;
        }

        if (!this.model.estaEnJuego()) {
            // Si el juego esta pausado/terminado ignoramos nuevos arrastres
            return;
        }

        const [f, c] = this.pixelToGrid(this.mouseX, this.mouseY);
        if (f < 0 || c < 0) {
            this.posiblesMovimientos = [];
            return;
        }

        if (!this.model.tieneFicha(f, c)) {
            this.posiblesMovimientos = [];
            return;
        }

        this.fOrigen = f;
        this.cOrigen = c;
        this.posiblesMovimientos = this.model.getPosiblesMovimientos(f, c);
        this.fichaFlotante = this.model.quitarFicha(f, c);

        if (this.fichaFlotante) {
            this.isDragging = true;
            this.view.resetHintAnimation();
        } else {
            this.posiblesMovimientos = [];
        }
    }

    handleMouseMove(e) {
        this.mouseX = e.offsetX;
        this.mouseY = e.offsetY;

        this.isRestartButtonHovered = this._isInsideRestartButton(this.mouseX, this.mouseY);
        this.isMenuButtonHovered = this._isInsideMenuButton(this.mouseX, this.mouseY);
    }

    handleMouseUp(e) {
        this.mouseX = e.offsetX;
        this.mouseY = e.offsetY;

        if (this.isRestartButtonPressed) {
            const isClickRestart = this._isInsideRestartButton(this.mouseX, this.mouseY);
            this.isRestartButtonPressed = false;
            if (isClickRestart) {
                // Clic valido sobre el boton de reinicio
                this.restartGame();
            }
            return;
        }

        if (this.isMenuButtonPressed) {
            const isClickMenu = this._isInsideMenuButton(this.mouseX, this.mouseY);
            this.isMenuButtonPressed = false;
            if (isClickMenu) {
                // Clic valido sobre el boton de reinicio
                this.mostrarMenu();
            }
            return;
        }

        if (this.endBanner.visible) {
            this.restartGame();
            return;
        }

        if (!this.isDragging) {
            return;
        }

        this.isDragging = false;
        const [fDestino, cDestino] = this.pixelToGrid(e.offsetX, e.offsetY);

        let movimientoRealizado = false;
        if (this.posiblesMovimientos.some(move => move.f === fDestino && move.c === cDestino)) {
            this.model.ejecutarMovimiento(this.fOrigen, this.cOrigen, fDestino, cDestino, this.fichaFlotante);
            movimientoRealizado = true;
        }

        if (!movimientoRealizado && this.fichaFlotante) {
            // Se suelta en un casillero invalido -> devolvemos la ficha al origen
            this.model.devolverFicha(this.fichaFlotante, this.fOrigen, this.cOrigen);
        }

        this.fichaFlotante = null;
        this.fOrigen = -1;
        this.cOrigen = -1;
        this.posiblesMovimientos = [];

        if (movimientoRealizado) {
            setTimeout(() => this.checkGameEnd(), 100);
        }
    }

    handleMouseOut() {
        this.isRestartButtonPressed = false;
        this.isRestartButtonHovered = false;
        this.isMenuButtonPressed = false;
        this.isMenuButtonHovered = false;
        this.cancelDrag();
    }

    pixelToGrid(x, y) {
        const gridX = x - this.view.OFFSET_X;
        const gridY = y - this.view.OFFSET_Y;

        const c = Math.floor(gridX / this.view.TAMANO_CELDA);
        const f = Math.floor(gridY / this.view.TAMANO_CELDA);

        if (f >= 0 && f < this.model.getTamano() && c >= 0 && c < this.model.getTamano()) {
            return [f, c];
        }
        return [-1, -1];
    }

    checkGameEnd() {
        if (!this.model.estaEnJuego()) {
            return;
        }

        if (this.model.comprobarFinDeJuego()) {
            this.model.detenerTimer();
            const esVictoria = this.model.comprobarVictoria();
            this._mostrarFinDeJuego(esVictoria);
        }
    }

    getRenderState() {
        const tiempoRestante = this.model.obtenerTiempoRestante();
        return {
            isDragging: this.isDragging,
            posiblesMovimientos: this.posiblesMovimientos,
            fichaFlotante: this.fichaFlotante,
            mouseX: this.mouseX,
            mouseY: this.mouseY,
            // El HUD necesita datos para dibujar el timer y estados del boton
            hud: {
                tiempoRestante,
                timeWarning: this.model.estaEnJuego() && tiempoRestante <= 10,
                restartButton: {
                    ...this.restartButtonBounds,
                    isHovered: this.isRestartButtonHovered,
                    isPressed: this.isRestartButtonPressed
                },
                menuButton: {
                    ...this.menuButtonBounds,
                    isHovered: this.isMenuButtonHovered,
                    isPressed: this.isMenuButtonPressed
                }
            },
            endBanner: this.endBanner
        };
    }

    cancelDrag() {
        if (this.isDragging && this.fichaFlotante) {
            this.model.devolverFicha(this.fichaFlotante, this.fOrigen, this.cOrigen);
        }
        this.isDragging = false;
        this.fichaFlotante = null;
        this.fOrigen = -1;
        this.cOrigen = -1;
        this.posiblesMovimientos = [];
    }

    restartGame() {
        // Reseteamos modelo y estados internos y dejamos el tablero listo
        this.model.reiniciarJuego();
        this.cancelDrag();
        this.view.resetHintAnimation();
        this.endBanner = {
            visible: false,
            title: '',
            subtitle: ''
        };
        this.isRestartButtonPressed = false;
        this.isRestartButtonHovered = false;
        this.timeUpNotified = false;
    }

    showTiempoAgotado() {
        if (this.timeUpNotified) {
            return;
        }
        this.timeUpNotified = true;
        this.model.detenerTimer();
        this.cancelDrag();
        const moves = this.model.obtenerCantidadMovimientos();
        // Banner especifico para el caso en que el temporizador llega a cero
        this.endBanner = {
            visible: true,
            title: 'Tiempo agotado',
            stats: `Movimientos: ${moves} | ¡Los villanos escaparon!`,
            subtitle: 'Haz click para reiniciar'
        };
    }

    _isInsideRestartButton(x, y) {
        const { x: bx, y: by, width, height } = this.restartButtonBounds;
        return x >= bx && x <= bx + width && y >= by && y <= by + height;
    }

    _isInsideMenuButton(x, y) {
        const { x: bx, y: by, width, height } = this.menuButtonBounds;
        return x >= bx && x <= bx + width && y >= by && y <= by + height;
    }

    _createRestartButtonBounds() {
        const paddingX = 36;
        const buttonWidth = 220;
        const buttonHeight = 52;
        const x = this.view.canvas.width - paddingX - buttonWidth;
        const y = (this.view.HUD_HEIGHT - buttonHeight) / 2;
        return { x, y, width: buttonWidth, height: buttonHeight };
    }

    _createMenuButtonBounds() {
        const paddingX = 36;
        const buttonWidth = 220;
        const buttonHeight = 52;
        const x = this.view.canvas.width - paddingX * 2 - buttonWidth * 2;
        const y = (this.view.HUD_HEIGHT - buttonHeight) / 2;
        return { x, y, width: buttonWidth, height: buttonHeight };
    }

    _mostrarFinDeJuego(esVictoria) {
        this.cancelDrag();
        const title = esVictoria ? 'Ganaste!' : 'Sin movimientos';
        const moves = this.model.obtenerCantidadMovimientos();
        const timeRemaining = this.model.obtenerTiempoRestante();
        const timeLimit = this.model.obtenerTiempoDeJuego();
        const minutes = Math.floor((timeLimit - timeRemaining) / 60);
        const seconds = (timeLimit - timeRemaining) % 60;
        const stats = `Movimientos: ${moves} | Tiempo: ${minutes}:${seconds.toString().padStart(2, '0')}`;
        this.endBanner = {
            visible: true,
            title,
            stats,
            subtitle: 'Haz click para reiniciar'
        };
    }
}
