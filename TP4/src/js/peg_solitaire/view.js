class View {
    constructor(canvas, selectedPiece, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        this.showHud = options.showHud !== false;
        this.enableHints = options.enableHints !== false;
        const hudHeight = this.showHud ? (options.hudHeight ?? 100) : 0;
        const autoCellSize = options.autoScale ? this._computeAutoCellSize(hudHeight) : null;
        this.TAMANO_CELDA = options.cellSize ?? autoCellSize ?? 90;
        this.HUD_HEIGHT = hudHeight;
        this._boardSize = this.TAMANO_CELDA * 7;
        this.OFFSET_X = (this.canvas.width - this._boardSize) / 2;
        if (this.showHud) {
            const espacioDisponible = this.canvas.height - this.HUD_HEIGHT - this._boardSize;
            this.OFFSET_Y = this.HUD_HEIGHT + Math.max(0, espacioDisponible / 2);
        } else {
            this.OFFSET_Y = Math.max(0, (this.canvas.height - this._boardSize) / 2);
        }

        this.images = {};
        this.imageLoaded = false;
        this.hintAnimationTime = 0;
        this.selectedPiece = selectedPiece;

        // Rutas de imagenes usadas por el tablero
        this.imageSources = {
            background: 'assets/img/batman-peg-background.jpg',
            tipo1: 'assets/img/peg-batman.png',
            tipo2: selectedPiece,
            hint: 'assets/img/hint.png'
        };

        this.preloadImages();
    }

    _computeAutoCellSize(hudHeight) {
        const usableHeight = this.canvas.height - (this.showHud ? hudHeight : 0);
        const maxSize = Math.min(this.canvas.width, usableHeight);
        if (maxSize <= 0) {
            return 90;
        }
        return Math.max(20, Math.floor(maxSize / 7));
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

    updateSecondaryPiece(newSrc) {
        return new Promise((resolve, reject) => {
            if (!newSrc || this.imageSources.tipo2 === newSrc) {
                resolve();
                return;
            }

            const img = new Image();
            img.onload = () => {
                this.images.tipo2 = img;
                this.imageSources.tipo2 = newSrc;
                this.selectedPiece = newSrc;
                resolve();
            };
            img.onerror = reject;
            img.src = newSrc;
        });
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

            ctx.fillStyle = 'rgba(233, 247, 42, 1)';
            ctx.beginPath();
            ctx.arc(x, y, HUECO_SIZE / 2, 0, 2 * Math.PI);
            ctx.fill();

            if (estado.tieneFicha) {
                const imgKey = estado.tipoVisual === 1 ? 'tipo1' : 'tipo2';
                const img = this.images[imgKey];

                if (img) {
                    const offsetY = estado.tipoVisual === 1 ? 0 : 5
                    const drawX = x - PIEZA_SIZE / 2;
                    const drawY = y - PIEZA_SIZE / 2;
                    ctx.drawImage(img, drawX, drawY - offsetY, PIEZA_SIZE, PIEZA_SIZE);
                }
            }
        });

        if (this.enableHints && isDragging && posiblesMovimientos.length > 0 && this.images.hint) {
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

        this._drawEndBanner(renderState.endBanner,renderState.hud.buttons);
        this._drawEndBanner(renderState.endBanner,renderState.hud.buttons);
    }

    resetHintAnimation() {
        this.hintAnimationTime = 0;
    }

    _drawHud(hudState) {
        if (!this.showHud || !hudState) {
            return;
        }

        const ctx = this.ctx;
        ctx.save();

        ctx.fillStyle = 'rgba(33, 41, 54, 1)';
        ctx.fillRect(0, 0, this.canvas.width, this.HUD_HEIGHT);

        const buttons = hudState.buttons ?? [];
        buttons.forEach(button => this._drawHudButton(button));
        this.canvas.style.cursor = buttons.some(b => b.isHovered) ? 'pointer' : 'default';
        
        const paddingX = 30;
        ctx.font = '24px "Segoe UI", Arial, sans-serif';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';
        const timerText = `Tiempo: ${hudState.tiempoRestante}s`;;
        ctx.fillStyle = hudState.timeWarning ? '#ff7070' : '#ffffff';
        ctx.fillText(timerText, paddingX, this.HUD_HEIGHT / 2);

        ctx.restore();
    }

    _drawHudButton(buttonState) {
        const ctx = this.ctx;
        const { x, y, width, height, isHovered, isPressed, label } = buttonState;

        const baseColor = '#FF007F';
        const topGradient = '#FF55AA';
        const hoverColor = '#FF3399';
        const topGradientHover = '#FF77B2';
        const pressedColor = '#CC0066';
        
        const textColor = '#FFFFFF';
        const textShadowColor = 'rgba(0, 0, 0, 0.3)';
        const borderColor = 'rgba(255, 255, 255, 0.3)';

        ctx.save();

        // Sombra del Botón
        // La sombra cambia según el estado para dar efecto de "lift" y "press"
        if (isPressed) {
            ctx.shadowColor = 'transparent';
        } else if (isHovered) {
            // Sombra más grande en hover
            ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            ctx.shadowBlur = 10;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 4;
        } else {
            // Sombra base sutil
            ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
            ctx.shadowBlur = 5;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 2;
        }

        // Relleno (Gradiente)
        ctx.beginPath();
        this._roundedRect(ctx, x, y, width, height, 12);

        let fillStyle;
        if (isPressed) {
            // Color sólido y más oscuro al presionar
            fillStyle = pressedColor;
        } else if (isHovered) {
            // Gradiente más brillante al hacer hover
            const gradient = ctx.createLinearGradient(x, y, x, y + height);
            gradient.addColorStop(0, topGradientHover);
            gradient.addColorStop(1, hoverColor);
            fillStyle = gradient;
        } else {
            // Gradiente base
            const gradient = ctx.createLinearGradient(x, y, x, y + height);
            gradient.addColorStop(0, topGradient);
            gradient.addColorStop(1, baseColor);
            fillStyle = gradient;
        }
        
        ctx.fillStyle = fillStyle;
        ctx.fill();

        // Borde sutil
        // Quitamos la sombra del botón para dibujar el borde
        ctx.shadowColor = 'transparent'; 

        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1;
        ctx.stroke(); // Dibuja el borde dentro del roundedRect

        // Texto con sombra
        ctx.fillStyle = textColor;
        ctx.font = '22px "Segoe UI", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Sombra del texto para legibilidad
        ctx.shadowColor = textShadowColor;
        ctx.shadowBlur = 2;
        ctx.shadowOffsetY = 1;
        ctx.shadowOffsetX = 0;

        // Posición del texto: si está presionado, se mueve 1px para abajo
        const textY = isPressed ? (y + height / 2 + 1) : (y + height / 2);
        ctx.fillText(label ?? 'Reiniciar juego', x + width / 2, textY);
        
        ctx.restore(); // Restaura el contexto (quita todas las sombras)
    }

    _drawEndBanner(endBanner,buttons) {
        if (!endBanner.visible) {
            return;
        }

        const ctx = this.ctx;
        ctx.save();

        ctx.fillStyle = 'rgba(33, 41, 54, 1)';
        ctx.fillRect(0, 0, this.canvas.width, this.HUD_HEIGHT);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const modalWidth = 520;
        const modalHeight = 220;
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
        ctx.fillText(endBanner.title, modalX + modalWidth / 2, modalY + modalHeight / 2 - 50);

        ctx.fillStyle = '#b5b5b5';
        ctx.font = '20px "Segoe UI", Arial, sans-serif';
        ctx.fillText(endBanner.stats, modalX + modalWidth / 2, modalY + modalHeight / 2 + 0);

        buttons.forEach(button => this._drawHudButton(button));
        this.canvas.style.cursor = buttons.some(b => b.isHovered) ? 'pointer' : 'default';


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
