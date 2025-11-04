document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('game-start-button');
    const canvas = document.getElementById('game-canvas');
    const startScreen = document.getElementById('game-start-screen');

    if (!startButton) {
        console.error("No se encontro el boton 'Comenzar partida'.");
        return;
    }

    if (!canvas || !startScreen) {
        console.error('Los elementos principales del juego no estan disponibles.');
        return;
    }

    const pieceRadios = document.querySelectorAll('input[name="peg-piece"]');

    let activeModel = null;
    let activeView = null;
    let activeController = null;
    let animationFrameId = null;
    let imageCheckTimeoutId = null;
    let gameRunning = false;

    initPreview();

    startButton.addEventListener('click', startGame);

    function startGame() {
        if (gameRunning) {
            return;
        }

        startScreen.classList.add('hidden');
        canvas.classList.remove('hidden');

        const selectedPiece = getSelectedPieceSrc();

        activeModel = new PegSolitaireGame();
        activeView = new View(canvas, selectedPiece);
        activeController = new Controller(activeModel, activeView);
        activeController.onRequestMenu = handleReturnToMenu;
        activeController.init();

        gameRunning = true;
        waitForImagesAndStartLoop();
    }

    function waitForImagesAndStartLoop() {
        imageCheckTimeoutId = null;

        if (!gameRunning || !activeView) {
            return;
        }

        if (activeView.imageLoaded) {
            console.log('Iniciando game loop...');
            activeModel.iniciarTimer();
            animationFrameId = requestAnimationFrame(gameLoop);
        } else {
            console.log('Esperando imagenes...');
            imageCheckTimeoutId = setTimeout(waitForImagesAndStartLoop, 100);
        }
    }

    function gameLoop() {
        if (!gameRunning || !activeModel || !activeController || !activeView) {
            return;
        }

        if (activeView.imageLoaded) {
            activeView.draw(activeModel, activeController.getRenderState());
        }

        if (!activeModel.estaEnJuego() && activeModel.obtenerTiempoRestante() === 0) {
            activeController.showTiempoAgotado();
        }

        animationFrameId = requestAnimationFrame(gameLoop);
    }

    function handleReturnToMenu() {
        if (!gameRunning) {
            return;
        }

        gameRunning = false;

        if (animationFrameId !== null) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }

        if (imageCheckTimeoutId !== null) {
            clearTimeout(imageCheckTimeoutId);
            imageCheckTimeoutId = null;
        }

        if (activeModel) {
            activeModel.detenerTimer();
        }
        if (activeController) {
            activeController.destroy();
        }

        startScreen.classList.remove('hidden');
        canvas.classList.add('hidden');

        activeModel = null;
        activeView = null;
        activeController = null;
    }

    function initPreview() {
        const previewCanvas = document.getElementById('preview-canvas');
        if (!previewCanvas) {
            return;
        }

        const previewModel = new PegSolitaireGame();
        previewModel.detenerTimer();

        const previewView = new View(previewCanvas, getSelectedPieceSrc(), {
            showHud: false,
            enableHints: false,
            autoScale: true
        });

        const previewRenderState = {
            isDragging: false,
            posiblesMovimientos: [],
            fichaFlotante: null,
            mouseX: 0,
            mouseY: 0,
            hud: {
                tiempoRestante: previewModel.obtenerTiempoRestante(),
                timeWarning: false,
                buttons: []
            },
            endBanner: { visible: false, title: '', subtitle: '' }
        };

        const drawPreview = () => {
            if (previewView.imageLoaded) {
                previewView.draw(previewModel, previewRenderState);
            } else {
                setTimeout(drawPreview, 100);
            }
        };

        drawPreview();

        pieceRadios.forEach((radio) => {
            radio.addEventListener('change', () => {
                const newSrc = `assets/img/peg-${radio.value}.png`;
                previewView
                    .updateSecondaryPiece(newSrc)
                    .then(() => {
                        previewView.draw(previewModel, previewRenderState);
                    })
                    .catch((error) => {
                        console.error('Error actualizando la vista previa:', error);
                    });
            });
        });
    }

    function getSelectedPieceSrc() {
        let selectedPiece = 'assets/img/peg-joker.png';
        pieceRadios.forEach((radio) => {
            if (radio.checked) {
                selectedPiece = `assets/img/peg-${radio.value}.png`;
            }
        });
        return selectedPiece;
    }
});
