document.addEventListener('DOMContentLoaded', () => {
    const gameStartBtn = document.getElementById('game-start-button');
    if (!gameStartBtn) {
      console.error("No se encontró el botón 'Comenzar partida'.");
      return;
    }
    gameStartBtn.addEventListener('click', ejecutarJuego);

    function ejecutarJuego() {
        let selectedPiece = 'assets/img/peg-joker.png';
        const pieceRadios = document.querySelectorAll('input[name="peg-piece"]');
        pieceRadios.forEach((radio) => {
            if (radio.checked) {
                selectedPiece = `assets/img/peg-${radio.value}.png`;
            }
        });
        const controller = new Controller(selectedPiece);
        controller.init();
    }
});
