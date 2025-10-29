class View {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        this.TAMANO_CELDA = 90;
        this._boardSize = this.TAMANO_CELDA * 7;
        this.HUD_HEIGHT = 100;
        this.OFFSET_X = (this.canvas.width - this._boardSize) / 2;
        const espacioDisponible = this.canvas.height - this.HUD_HEIGHT - this._boardSize;
        this.OFFSET_Y = this.HUD_HEIGHT + Math.max(0, espacioDisponible / 2);

        this.images = {};
        this.imageLoaded = false;
        this.hintAnimationTime = 0;

        // Rutas de imagenes usadas por el tablero
        this.imageSources = {
            background: 'assets/img/tablero-fondo.png',
            tipo1: 'assets/img/peg-batman.png',
            tipo2: 'assets/img/peg-joker.png',
            hint: 'assets/img/hint.png'
        };

        this.preloadImages();
    }

    async preloadImages() {
        const promises = Object.entries(this.imageSources).map(([key, src]) => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    this.images[key] = img;
                    resolve();
                };
                img.onerror = reject;
                img.src = src;
            });
        });

        try {
            await Promise.all(promises);
            this.imageLoaded = true;
            console.log('Imagenes cargadas.');
        } catch (error) {
            console.error('Error cargando imagenes:', error);
        }
    }

    draw(model, renderState) {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.images.background) {
            ctx.drawImage(this.images.background, 0, 0, this.canvas.width, this.canvas.height);
        }

        this._drawHud(renderState.hud);

        const PIEZA_SIZE = this.TAMANO_CELDA;
        const HUECO_SIZE = this.TAMANO_CELDA * 0.4;
        const { isDragging, posiblesMovimientos, fichaFlotante, mouseX, mouseY } = renderState;

        model.forEachCasillero((f, c, estado) => {
            const x = this.OFFSET_X + c * this.TAMANO_CELDA + (this.TAMANO_CELDA / 2);
            const y = this.OFFSET_Y + f * this.TAMANO_CELDA + (this.TAMANO_CELDA / 2);

            if (!estado.esValido) {
                return;
            }

            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.beginPath();
            ctx.arc(x, y, HUECO_SIZE / 2, 0, 2 * Math.PI);
            ctx.fill();

            if (estado.tieneFicha) {
                const imgKey = estado.tipoVisual === 1 ? 'tipo1' : 'tipo2';
                const img = this.images[imgKey];

                if (img) {
                    const drawX = x - PIEZA_SIZE / 2;
                    const drawY = y - PIEZA_SIZE / 2;
                    ctx.drawImage(img, drawX, drawY, PIEZA_SIZE, PIEZA_SIZE);
                }
            }
        });

        if (isDragging && posiblesMovimientos.length > 0 && this.images.hint) {
            this.hintAnimationTime += 0.1;
            const pulse = Math.sin(this.hintAnimationTime);
            const baseHintSize = this.TAMANO_CELDA * 0.55;
            const hintSize = baseHintSize + pulse * 4;
            const hintAlpha = 0.6 + (pulse + 1) / 2 * 0.4;

            ctx.globalAlpha = hintAlpha;

            posiblesMovimientos.forEach(move => {
                const hintX = this.OFFSET_X + move.c * this.TAMANO_CELDA + (this.TAMANO_CELDA / 2);
                const hintY = this.OFFSET_Y + move.f * this.TAMANO_CELDA + (this.TAMANO_CELDA / 2);
                const drawX = hintX - hintSize / 2;
                const drawY = hintY - hintSize / 2;
                ctx.drawImage(this.images.hint, drawX, drawY, hintSize, hintSize);
            });
            ctx.globalAlpha = 1.0;
        }

        if (isDragging && fichaFlotante) {
            const imgKeyFlotante = fichaFlotante.getTipoVisual() === 1 ? 'tipo1' : 'tipo2';
            const imgFlotante = this.images[imgKeyFlotante];

            if (imgFlotante) {
                const drawX = mouseX - PIEZA_SIZE / 2;
                const drawY = mouseY - PIEZA_SIZE / 2;
                ctx.globalAlpha = 0.7;
                ctx.drawImage(imgFlotante, drawX, drawY, PIEZA_SIZE, PIEZA_SIZE);
                ctx.globalAlpha = 1.0;
            }
        }

        this._drawEndBanner(renderState.endBanner);
    }

    resetHintAnimation() {
        this.hintAnimationTime = 0;
    }

    _drawHud(hudState) {
        const ctx = this.ctx;
        ctx.save();

        ctx.fillStyle = 'rgba(33, 41, 54, 1)';
        ctx.fillRect(0, 0, this.canvas.width, this.HUD_HEIGHT);

        const paddingX = 36;
        const paddingY = 30;

        ctx.fillStyle = '#f0f0f0';
        ctx.font = '28px "Segoe UI", Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('Batman Peg Solitaire', paddingX, paddingY);

        const buttonState = hudState.button;
        this._drawHudButton(buttonState);

        ctx.font = '24px "Segoe UI", Arial, sans-serif';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'right';
        const timerText = `Tiempo: ${hudState.tiempoRestante}s`;
        const timerX = buttonState.x - 24;
        ctx.fillStyle = hudState.timeWarning ? '#ff7070' : '#ffffff';
        ctx.fillText(timerText, timerX, this.HUD_HEIGHT / 2);

        ctx.restore();
    }

    _drawHudButton(buttonState) {
        const ctx = this.ctx;
        const { x, y, width, height, isHovered, isPressed } = buttonState;

        const baseColor = '#FF007F';
        const hoverColor = '#FF3399';
        const pressedColor = '#CC0066';

        ctx.save();
        ctx.beginPath();
        this._roundedRect(ctx, x, y, width, height, 12);
        ctx.fillStyle = isPressed ? pressedColor : (isHovered ? hoverColor : baseColor);
        ctx.fill();

        ctx.lineWidth = 2;
        ctx.strokeStyle = '#FFD6EB';
        ctx.stroke();

        ctx.fillStyle = '#f5f5f5';
        ctx.font = '22px "Segoe UI", Arial, sans-serif';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.fillText('Reiniciar juego', x + width / 2, y + height / 2);
        ctx.restore();
    }

    _drawEndBanner(endBanner) {
        if (!endBanner.visible) {
            return;
        }

        const ctx = this.ctx;
        ctx.save();

        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const modalWidth = 420;
        const modalHeight = 200;
        const modalX = (this.canvas.width - modalWidth) / 2;
        const modalY = (this.canvas.height - modalHeight) / 2;

        ctx.beginPath();
        this._roundedRect(ctx, modalX, modalY, modalWidth, modalHeight, 18);
        ctx.fillStyle = 'rgba(19, 25, 39, 0.95)';
        ctx.fill();

        ctx.strokeStyle = '#464646';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#f5f5f5';
        ctx.font = '30px "Segoe UI Semibold", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(endBanner.title, modalX + modalWidth / 2, modalY + modalHeight / 2 - 25);

        ctx.fillStyle = '#b5b5b5';
        ctx.font = '20px "Segoe UI", Arial, sans-serif';
        ctx.fillText(endBanner.subtitle, modalX + modalWidth / 2, modalY + modalHeight / 2 + 25);

        ctx.restore();
    }

    _roundedRect(ctx, x, y, width, height, radius) {
        const r = Math.min(radius, width / 2, height / 2);
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + width - r, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + r);
        ctx.lineTo(x + width, y + height - r);
        ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
        ctx.lineTo(x + r, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }
}
