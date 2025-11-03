document.addEventListener('DOMContentLoaded', () => {
    const gameStartBtn = document.getElementById('game-start-button');
    if (!gameStartBtn) {
      console.error("No se encontró el botón 'Comenzar partida'.");
      return;
    }
    gameStartBtn.addEventListener('click', ejecutarJuego);

    function ejecutarJuego() {        
        const canvas = document.getElementById('game-canvas');
        if (!canvas) {
            console.error("Error: No se encontro el elemento canvas 'game-canvas'.");
            return;
        }
        const startScreen = document.getElementById('game-start-screen');
        canvas.classList.toggle('hidden');
        startScreen.classList.toggle('hidden');
        let selectedPiece = 'assets/img/peg-joker.png';
        const pieceRadios = document.querySelectorAll('input[name="peg-piece"]');
        pieceRadios.forEach((radio) => {
            if (radio.checked) {
                selectedPiece = `assets/img/peg-${radio.value}.png`;
            }
        });

        const model = new PegSolitaireGame();
        const view = new View(canvas,selectedPiece);
        const controller = new Controller(model, view);
        
        controller.init();
        
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
                // Iniciamos el temporizador apenas inicia el gameLoop
                model.iniciarTimer();
                requestAnimationFrame(gameLoop);
            } else {
                // Esperamos a que las imagenes del tablero esten listas antes de dibujar
                console.log('Esperando imagenes...');
                setTimeout(checkImagesLoaded, 100);
            }
        }
        
        checkImagesLoaded();
    }
});
