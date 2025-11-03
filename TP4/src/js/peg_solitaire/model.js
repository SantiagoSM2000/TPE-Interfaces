/* Clases de datos */

class Ficha {
    constructor(tipoVisual = 1) {
        // El tipo visual determina que imagen dibuja la vista
        this._tipoVisual = tipoVisual;
        this.imageSrc = tipoVisual === 1
            ? 'assets/img/peg-batman.png'
            : 'assets/img/peg-joker.png';
    }

    getTipoVisual() {
        return this._tipoVisual;
    }
}

class Casillero {
    constructor() {
        this._esValido = false;
        this._ficha = null;
    }

    marcarValido() {
        this._esValido = true;
    }

    esValido() {
        return this._esValido;
    }

    tieneFicha() {
        return this._ficha !== null;
    }

    obtenerFicha() {
        return this._ficha;
    }

    colocarFicha(ficha) {
        this._ficha = ficha;
    }

    quitarFicha() {
        const ficha = this._ficha;
        this._ficha = null;
        return ficha;
    }
}

/* Clase principal del modelo */

class PegSolitaireGame {
    constructor(tiempoDeJuego = 100) {
        // Estado principal del tablero y del reloj
        this.tiempoDeJuego = tiempoDeJuego;
        this._tamano = 7;
        this._tablero = [];
        this._cantidadFichas = 0;
        this._cantidadMovimientos = 0;
        this._tiempoRestante = this.tiempoDeJuego;
        this._timerID = null;
        this._enJuego = false;
        this.iniciarTablero();
    }

    getTamano() {
        return this._tamano;
    }

    estaEnJuego() {
        return this._enJuego;
    }

    obtenerCantidadMovimientos(){
        return this._cantidadMovimientos;
    }

    obtenerTiempoRestante() {
        return this._tiempoRestante;
    }

    obtenerTiempoDeJuego(){
        return this.tiempoDeJuego;
    }

    haExpiradoElTiempo() {
        return this._tiempoRestante <= 0;
    }

    forEachCasillero(callback) {
        for (let f = 0; f < this._tamano; f++) {
            for (let c = 0; c < this._tamano; c++) {
                const casillero = this._tablero[f][c];
                // Exponemos datos inmutables para la vista sin romper encapsulacion
                callback(f, c, {
                    esValido: casillero.esValido(),
                    tieneFicha: casillero.tieneFicha(),
                    tipoVisual: casillero.obtenerFicha()?.getTipoVisual() ?? null
                });
            }
        }
    }

    obtenerEstadoCasillero(f, c) {
        if (!this._tablero[f]?.[c]) {
            return null;
        }
        const casillero = this._tablero[f][c];
        return {
            // Se devuelve solo la informacion de lectura necesaria para dibujar
            esValido: casillero.esValido(),
            tieneFicha: casillero.tieneFicha(),
            tipoVisual: casillero.obtenerFicha()?.getTipoVisual() ?? null
        };
    }

    iniciarTablero() {
        this._tablero = [];
        this._cantidadFichas = 0;
        this._cantidadMovimientos = 0;
        this._enJuego = true;

        const limiteInferior = 2;
        const limiteSuperior = 5;

        for (let f = 0; f < this._tamano; f++) {
            const nuevaFila = [];
            for (let c = 0; c < this._tamano; c++) {
                const casillero = new Casillero();
                const esEsquinaInvalida =
                    (f < limiteInferior || f >= limiteSuperior) &&
                    (c < limiteInferior || c >= limiteSuperior);

                if (!esEsquinaInvalida) {
                    casillero.marcarValido();
                    if (!(f === 3 && c === 3)) {
                        // Alternamos fichas para variar la presentacion visual
                        const tipoVisual = (f + c) % 2 === 0 ? 1 : 2;
                        casillero.colocarFicha(new Ficha(tipoVisual));
                        this._cantidadFichas++;
                    }
                }
                nuevaFila.push(casillero);
            }
            this._tablero.push(nuevaFila);
        }
    }

    esMovimientoValido(fOrigen, cOrigen, fDestino, cDestino) {
        if (!this._enJuego) return false;

        // Solo se permiten saltos ortogonales de dos casilleros
        const esSaltoHorizontal = fOrigen === fDestino && Math.abs(cOrigen - cDestino) === 2;
        const esSaltoVertical = cOrigen === cDestino && Math.abs(fOrigen - fDestino) === 2;
        if (!esSaltoHorizontal && !esSaltoVertical) return false;

        if (!this._estaDentroTablero(fDestino, cDestino) || !this._estaDentroTablero(fOrigen, cOrigen)) {
            return false;
        }

        const casilleroOrigen = this._tablero[fOrigen][cOrigen];
        const casilleroDestino = this._tablero[fDestino][cDestino];

        // Debe haber ficha en origen y hueco libre en destino
        if (!casilleroOrigen.esValido() || !casilleroOrigen.tieneFicha()) {
            return false;
        }
        if (!casilleroDestino.esValido() || casilleroDestino.tieneFicha()) {
            return false;
        }

        // El casillero intermedio necesita una ficha a capturar
        const fMedio = (fOrigen + fDestino) / 2;
        const cMedio = (cOrigen + cDestino) / 2;
        const casilleroMedio = this._tablero[fMedio][cMedio];
        if (!casilleroMedio.tieneFicha()) {
            return false;
        }

        return true;
    }

    getPosiblesMovimientos(fOrigen, cOrigen) {
        const movimientos = [];
        const direcciones = [
            [-2, 0], [2, 0], [0, -2], [0, 2]
        ];

        if (!this.tieneFicha(fOrigen, cOrigen)) {
            return movimientos;
        }

        direcciones.forEach(([df, dc]) => {
            const fDestino = fOrigen + df;
            const cDestino = cOrigen + dc;
            if (this.esMovimientoValido(fOrigen, cOrigen, fDestino, cDestino)) {
                movimientos.push({ f: fDestino, c: cDestino });
            }
        });
        return movimientos;
    }

    ejecutarMovimiento(fOrigen, cOrigen, fDestino, cDestino, fichaMovida) {
        const fMedio = (fOrigen + fDestino) / 2;
        const cMedio = (cOrigen + cDestino) / 2;

        // Movimiento basico del Peg Solitaire: mover y retirar la ficha intermedia
        this._tablero[fDestino][cDestino].colocarFicha(fichaMovida);
        this._tablero[fOrigen][cOrigen].quitarFicha();
        this._tablero[fMedio][cMedio].quitarFicha();

        this._cantidadFichas--;
        this._cantidadMovimientos++;
    }

    quitarFicha(f, c) {
        const casillero = this._tablero[f]?.[c];
        if (!casillero?.tieneFicha()) {
            return null;
        }
        return casillero.quitarFicha();
    }

    devolverFicha(ficha, f, c) {
        const casillero = this._tablero[f]?.[c];
        if (casillero) {
            casillero.colocarFicha(ficha);
        }
    }

    comprobarFinDeJuego() {
        for (let f = 0; f < this._tamano; f++) {
            for (let c = 0; c < this._tamano; c++) {
                const casillero = this._tablero[f][c];
                if (casillero.tieneFicha() && this.getPosiblesMovimientos(f, c).length > 0) {
                    return false;
                }
            }
        }
        this._enJuego = false;
        return true;
    }

    comprobarVictoria() {
        // La victoria se alcanza cuando queda solo una ficha
        return this._cantidadFichas === 1;
    }

    iniciarTimer() {
        if (this._timerID) {
            clearInterval(this._timerID);
        }
        this._enJuego = true;

        this._timerID = setInterval(() => {
            this.tick();
        }, 1000);
    }

    tick() {
        if (!this._enJuego) {
            this.detenerTimer();
            return;
        }
        this._tiempoRestante--;
        if (this._tiempoRestante <= 0) {
            this._tiempoRestante = 0;
            this._enJuego = false;
            this.detenerTimer();
        }
    }

    detenerTimer() {
        if (this._timerID) {
            clearInterval(this._timerID);
            this._timerID = null;
        }
    }

    reiniciarTimer(){
        // Se restablece el tiempo pero no se reinicia automaticamente el intervalo
        this._tiempoRestante = this.tiempoDeJuego;
    }

    reiniciarJuego() {
        this.iniciarTablero();
        this.reiniciarTimer();
        this.iniciarTimer();
    }

    tieneFicha(f, c) {
        return this._tablero[f]?.[c]?.tieneFicha() ?? false;
    }

    // Metodo utilitario para validar coordenadas dentro del tablero
    _estaDentroTablero(f, c) {
        return f >= 0 && f < this._tamano && c >= 0 && c < this._tamano;
    }
}
