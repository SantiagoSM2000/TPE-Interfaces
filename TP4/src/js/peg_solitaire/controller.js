// Controla la interacción del jugador con el tablero y actualiza la vista en cada frame.
class Controller {
    constructor(model, view) {
        // model: instancia de PegSolitaireGame que mantiene el estado.
        // view: objeto View encargado de dibujar los cambios en pantalla.
        this.model = model;
        this.view = view;

        // Estado de arrastre de fichas (drag and drop)
        this.isDragging = false;
        this.fichaFlotante = null;
        this.fOrigen = -1;
        this.cOrigen = -1;
        this.mouseX = 0;
        this.mouseY = 0;

        this.posiblesMovimientos = []; // Movimientos legales de la ficha seleccionada
        // Estado de la UI del HUD para botones de reinicio y menú
        this.isRestartButtonHovered = false;
        this.isRestartButtonPressed = false;
        this.isMenuButtonHovered = false;
        this.isMenuButtonPressed = false;
        this.endBanner = {
            visible: false,
            title: '',
            subtitle: ''
        };
        this.timeUpNotified = false; // Evita mostrar el banner de tiempo agotado más de una vez

        // Precalculamos los rectangulos de los botones para reutilizarlos
        const { restart, menu } = this._createHudButtonBounds();
        this.restartButtonBounds = restart;
        this.menuButtonBounds = menu;

        // Callback opcional para notificar vuelta al menu principal
        this.onRequestMenu = null;

        // Referencias a handlers para poder remover eventos y evitar múltiples registros
        this._handlersBound = false;
        this._mouseDownHandler = null;
        this._mouseMoveHandler = null;
        this._mouseUpHandler = null;
        this._mouseOutHandler = null;
    }

    // Registra los listeners del canvas; debe llamarse una sola vez por partida.
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

    // Detecta clicks sobre botones del HUD o empieza a arrastrar una ficha.
    handleMouseDown(e) {
        this.mouseX = e.offsetX;
        this.mouseY = e.offsetY;

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
            // Parte superior reservada para el HUD: ignoramos arrastres allí.
            return;
        }

        if (!this.model.estaEnJuego()) {
            // Si el juego esta pausado/terminado ignoramos nuevos arrastres
            return;
        }

        // Convertimos las coordenadas del mouse a índices de tablero.
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

    // Mantiene el estado de hover de botones y posicion del mouse mientras se arrastra.
    handleMouseMove(e) {
        this.mouseX = e.offsetX;
        this.mouseY = e.offsetY;

        this.isRestartButtonHovered = this._isInsideButton(this.restartButtonBounds, this.mouseX, this.mouseY);
        this.isMenuButtonHovered = this._isInsideButton(this.menuButtonBounds, this.mouseX, this.mouseY);
    }

    // Completa el arrastre: resuelve clicks sobre botones o movimiento de fichas.
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
            // Esperamos un frame para que la vista actualice antes de comprobar el fin de juego.
            setTimeout(() => this.checkGameEnd(), 100);
        }
    }

    // Si el cursor sale del canvas, limpiamos interacciones pendientes.
    handleMouseOut() {
        this.isRestartButtonPressed = false;
        this.isRestartButtonHovered = false;
        this.isMenuButtonPressed = false;
        this.isMenuButtonHovered = false;
        this.cancelDrag();
    }

    // Traduce coordenadas del mouse a índices (fila, columna) del tablero de 7x7.
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

    // Revisa si ya no quedan movimientos y muestra el banner correspondiente.
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

    // Devuelve un objeto inmutable que la vista usa para dibujar el frame actual.
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
                // Reutilizamos las mismas dimensiones calculadas para que View pinte los botones.
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

    // Devuelve la ficha al casillero original si el arrastre no concluyó en un movimiento válido.
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
        const { restart, menu } = this._createHudButtonBounds();
        this.restartButtonBounds = restart;
        this.menuButtonBounds = menu;
        this.isRestartButtonPressed = false;
        this.isRestartButtonHovered = false;
        this.isMenuButtonPressed = false;
        this.isMenuButtonHovered = false;
        this.timeUpNotified = false;
    }

    // Restaura estados y avisa al exterior que hay que volver al menú principal.
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

    // Muestra el banner final específico cuando el temporizador llega a cero.
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
            stats: `Movimientos jugados: ${moves} | ¡Los villanos escaparon!`,
            subtitle: 'Haz click para reiniciar'
        };
        const { restart, menu } = this._createHudButtonBounds();
        this.restartButtonBounds = restart;
        this.menuButtonBounds = menu;
    }

    // Limpia los listeners registrados para liberar el canvas antes de volver al menú.
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

    // Helper geométrico para saber si el mouse está dentro de un botón rectangular.
    _isInsideButton(bounds, x, y) {
        const { x: bx, y: by, width, height } = bounds;
        return x >= bx && x <= bx + width && y >= by && y <= by + height;
    }

    // Calcula la posición de los botones del HUD, variando si se muestra el banner final.
    _createHudButtonBounds() {
        let paddingX;
        let buttonWidth;
        let buttonHeight;
        let spacing;
        let xMenu;
        let y;
        if(this.endBanner.visible){
            paddingX = 8;
            buttonWidth = 200;
            buttonHeight = 48;
            spacing = 16;
            xMenu = this.view.canvas.width / 2 + paddingX;
            y = this.view.canvas.height / 2 + 25;
        }else{
            paddingX = 36;
            buttonWidth = 220;
            buttonHeight = 52;
            spacing = 16;
            xMenu = this.view.canvas.width - paddingX - buttonWidth;
            y = (this.view.HUD_HEIGHT - buttonHeight) / 2;
        }
        const xRestart = xMenu - spacing - buttonWidth;
        return {
            restart: { x: xRestart, y, width: buttonWidth, height: buttonHeight },
            menu: { x: xMenu, y, width: buttonWidth, height: buttonHeight }
        };
    }

    // Configura el banner final con estadísticas según victoria o derrota por bloqueo.
    _mostrarFinDeJuego(esVictoria) {
        this.cancelDrag();
        const title = esVictoria ? 'Ganaste!' : 'Sin movimientos';
        const moves = this.model.obtenerCantidadMovimientos();
        const timeRemaining = this.model.obtenerTiempoRestante();
        const timeLimit = this.model.obtenerTiempoDeJuego();
        const minutes = Math.floor((timeLimit - timeRemaining) / 60);
        const seconds = (timeLimit - timeRemaining) % 60;
        const stats = `Movimientos jugados: ${moves} | Tiempo consumido: ${minutes}:${seconds.toString().padStart(2, '0')}`;
        this.endBanner = {
            visible: true,
            title,
            stats,
            subtitle: 'Haz click para reiniciar'
        };
        const { restart, menu } = this._createHudButtonBounds();
        this.restartButtonBounds = restart;
        this.menuButtonBounds = menu;
    }
}
