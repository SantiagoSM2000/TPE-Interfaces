/**
 * MAIN - Flappy Bird
 * Punto de entrada principal del juego
 * Inicializa el patrón MVC
 */

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {
    console.log('🐦 Iniciando Flappy Bird...');
    
    // Crear instancias del patrón MVC
    const model = new FlappyBirdModel();
    const view = new FlappyBirdView();
    const controller = new FlappyBirdController(model, view);
    
    console.log('✅ Flappy Bird inicializado correctamente');
    console.log('📊 Modelo:', model);
    console.log('🎨 Vista:', view);
    console.log('🎮 Controlador:', controller);
    
    // Mostrar la pantalla de inicio
    view.showStartScreen();
    
    // Actualizar el mejor puntaje en la pantalla inicial si existe
    if (model.bestScore > 0) {
        console.log(`🏆 Mejor puntuación actual: ${model.bestScore}`);
    }
    
    // Manejar visibilidad de la página para pausar/reanudar
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            controller.pauseGame();
            console.log('⏸️ Juego pausado (pestaña oculta)');
        } else {
            controller.resumeGame();
            console.log('▶️ Juego reanudado');
        }
    });
    
    // Prevenir scroll en la página cuando se presiona espacio
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && e.target === document.body) {
            e.preventDefault();
        }
    });
    
    console.log('🎮 ¡Listo para jugar! Presiona "Comenzar Partida"');
});