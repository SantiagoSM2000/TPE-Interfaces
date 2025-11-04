class Controller {
    constructor(model, view) {
        this.model = model;
        this.view = view;

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

        // Precalculamos los rectangulos de los botones para reutilizarlos
        const { restart, menu } = this._createHudButtonBounds();
        this.restartButtonBounds = restart;
        this.menuButtonBounds = menu;

        // Callback opcional para notificar vuelta al menu principal
        this.onRequestMenu = null;

        // Referencias a handlers para poder remover eventos
        this._handlersBound = false;
        this._mouseDownHandler = null;
        this._mouseMoveHandler = null;
        this._mouseUpHandler = null;
        this._mouseOutHandler = null;
    }

    init() {
        if (this._handlersBound) {
            return;
        }

        this._mouseDownHandler = this.handleMouseDown.bind(this);
        this._mouseMoveHandler = this.handleMouseMove.bind(this);
        this._mouseUpHandler = this.handleMouseUp.bind(this);
        this._mouseOutHandler = this.handleMouseOut.bind(this);

        const canvas = this.view.canvas;
        canvas.addEventListener('mousedown', this._mouseDownHandler);
        canvas.addEventListener('mousemove', this._mouseMoveHandler);
        canvas.addEventListener('mouseup', this._mouseUpHandler);
        canvas.addEventListener('mouseout', this._mouseOutHandler);

        this._handlersBound = true;
    }

    handleMouseDown(e) {
        this.mouseX = e.offsetX;
        this.mouseY = e.offsetY;

        if (this.endBanner.visible) {
            // Cualquier clic sobre el banner reinicia la partida
            this.restartGame();
            return;
        }

        if (this._isInsideButton(this.restartButtonBounds, this.mouseX, this.mouseY)) {
            this.isRestartButtonPressed = true;
            this.isRestartButtonHovered = true;
            return;
        }

        if (this._isInsideButton(this.menuButtonBounds, this.mouseX, this.mouseY)) {
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

        this.isRestartButtonHovered = this._isInsideButton(this.restartButtonBounds, this.mouseX, this.mouseY);
        this.isMenuButtonHovered = this._isInsideButton(this.menuButtonBounds, this.mouseX, this.mouseY);
    }

    handleMouseUp(e) {
        this.mouseX = e.offsetX;
        this.mouseY = e.offsetY;

        const estabaReiniciar = this.isRestartButtonPressed;
        const estabaMenu = this.isMenuButtonPressed;

        if (estabaReiniciar || estabaMenu) {
            const sobreReiniciar = this._isInsideButton(this.restartButtonBounds, this.mouseX, this.mouseY);
            const sobreMenu = this._isInsideButton(this.menuButtonBounds, this.mouseX, this.mouseY);

            this.isRestartButtonPressed = false;
            this.isMenuButtonPressed = false;

            if (estabaReiniciar && sobreReiniciar) {
                // Clic valido sobre el boton de reinicio
                this.restartGame();
            }

            if (estabaMenu && sobreMenu) {
                this.returnToMenu();
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
                buttons: [
                    {
                        ...this.restartButtonBounds,
                        isHovered: this.isRestartButtonHovered,
                        isPressed: this.isRestartButtonPressed,
                        label: 'Reiniciar juego'
                    },
                    {
                        ...this.menuButtonBounds,
                        isHovered: this.isMenuButtonHovered,
                        isPressed: this.isMenuButtonPressed,
                        label: 'Ir al menu principal'
                    }
                ]
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
        this.isMenuButtonPressed = false;
        this.isMenuButtonHovered = false;
        this.timeUpNotified = false;
    }

    returnToMenu() {
        this.model.detenerTimer();
        this.cancelDrag();
        this.view.resetHintAnimation();
        this.endBanner = {
            visible: false,
            title: '',
            subtitle: ''
        };
        this.isRestartButtonPressed = false;
        this.isRestartButtonHovered = false;
        this.isMenuButtonPressed = false;
        this.isMenuButtonHovered = false;
        this.timeUpNotified = false;

        if (typeof this.onRequestMenu === 'function') {
            this.onRequestMenu();
        }
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

    destroy() {
        if (!this._handlersBound) {
            return;
        }

        const canvas = this.view.canvas;
        canvas.removeEventListener('mousedown', this._mouseDownHandler);
        canvas.removeEventListener('mousemove', this._mouseMoveHandler);
        canvas.removeEventListener('mouseup', this._mouseUpHandler);
        canvas.removeEventListener('mouseout', this._mouseOutHandler);

        this._handlersBound = false;
        this._mouseDownHandler = null;
        this._mouseMoveHandler = null;
        this._mouseUpHandler = null;
        this._mouseOutHandler = null;
    }

    _isInsideButton(bounds, x, y) {
        const { x: bx, y: by, width, height } = bounds;
        return x >= bx && x <= bx + width && y >= by && y <= by + height;
    }

    _createHudButtonBounds() {
        const paddingX = 36;
        const buttonWidth = 220;
        const buttonHeight = 52;
        const spacing = 16;
        const xMenu = this.view.canvas.width - paddingX - buttonWidth;
        const xRestart = xMenu - spacing - buttonWidth;
        const y = (this.view.HUD_HEIGHT - buttonHeight) / 2;
        return {
            restart: { x: xRestart, y, width: buttonWidth, height: buttonHeight },
            menu: { x: xMenu, y, width: buttonWidth, height: buttonHeight }
        };
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
