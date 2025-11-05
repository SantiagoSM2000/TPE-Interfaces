// Punto de entrada del juego Peg Solitaire: arma la pantalla y lanza el loop del canvas.
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

    // Crea una nueva partida y oculta la pantalla inicial.
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

    // Espera a que todas las imágenes estén listas antes de comenzar el render loop.
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

    // Ciclo principal: pinta el canvas y revisa condiciones de fin de partida.
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

    // Limpia una partida en curso y vuelve a mostrar el menú inicial.
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

    // Configura el mini tablero del menú para que muestre el villano seleccionado.
    function initPreview() {
        const previewCanvas = document.getElementById('preview-canvas');
        if (!previewCanvas) {
            return;
        }

        const previewModel = new PegSolitaireGame();
        previewModel.detenerTimer();
        previewModel.vaciarTablero();

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

        // Dibuja la preview solo cuando las texturas ya están disponibles.
        const drawPreview = () => {
            if (previewView.imageLoaded) {
                previewView.draw(previewModel, previewRenderState);
            } else {
                setTimeout(drawPreview, 100);
            }
        };

        // Rellena el tablero de preview con fichas del villano elegido.
        const renderVillainSelection = (pieceSrc) => {
            previewModel.iniciarTablero();
            previewModel.detenerTimer();
            previewRenderState.posiblesMovimientos = [];
            previewRenderState.fichaFlotante = null;
            previewRenderState.hud.tiempoRestante = previewModel.obtenerTiempoRestante();

            previewView
                .updateSecondaryPiece(pieceSrc)
                .then(drawPreview)
                .catch((error) => {
                    console.error('Error actualizando la vista previa:', error);
                });
        };

        const initiallyChecked = Array.from(pieceRadios).find((radio) => radio.checked);
        if (initiallyChecked) {
            const initialSrc = `assets/img/peg-${initiallyChecked.value}.png`;
            renderVillainSelection(initialSrc);
        } else {
            drawPreview();
        }

        // Cada cambio de selección refresca el tablero mostrado en la tarjeta de inicio.
        pieceRadios.forEach((radio) => {
            radio.addEventListener('change', () => {
                const newSrc = `assets/img/peg-${radio.value}.png`;
                renderVillainSelection(newSrc);
            });
        });
    }

    // Devuelve el villano actualmente seleccionado en los radios (joker por defecto).
    function getSelectedPieceSrc() {
        let selectedPiece = 'joker';
        pieceRadios.forEach((radio) => {
            if (radio.checked) {
                selectedPiece = radio.value;
            }
        });
        return selectedPiece;
    }
});
