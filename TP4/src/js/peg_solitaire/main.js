document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas');
    if (!canvas) {
        console.error("Error: No se encontro el elemento canvas 'game-canvas'.");
        return;
    }

    const model = new PegSolitaireGame();
    const view = new View(canvas);
    const controller = new Controller(model, view);

    controller.init();
    // Iniciamos el temporizador apenas carga la pagina
    model.iniciarTimer();

    function gameLoop() {
        if (view.imageLoaded) {
            view.draw(model, controller.getRenderState());
        }

        // Si el tiempo llega a cero delegamos la transicion al controlador
        if (!model.estaEnJuego() && model.obtenerTiempoRestante() === 0) {
            controller.showTiempoAgotado();
        }

        requestAnimationFrame(gameLoop);
    }

    function checkImagesLoaded() {
        if (view.imageLoaded) {
            console.log('Iniciando game loop...');
            requestAnimationFrame(gameLoop);
        } else {
            // Esperamos a que las imagenes del tablero esten listas antes de dibujar
            console.log('Esperando imagenes...');
            setTimeout(checkImagesLoaded, 100);
        }
    }

    checkImagesLoaded();
});
