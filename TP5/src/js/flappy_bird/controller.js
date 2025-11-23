/**
 * CONTROLLER - Flappy Bird
 * Maneja la interacción entre el modelo y la vista, y los eventos del usuario
 */

class FlappyBirdController {
    constructor(model, view) {
        this.model = model;
        this.view = view;
        this.animationId = null;
        this.isGameRunning = false;
        
        this.initEventListeners();
    }
    
    /**
     * Inicializa los event listeners
     */
    initEventListeners() {
        // Botón de inicio
        this.view.startButton.addEventListener('click', () => {
            this.startGame();
        });
        
        // Botón de reinicio
        this.view.restartButton.addEventListener('click', () => {
            this.startGame();
        });
        
        // Click en canvas para saltar
        this.view.canvas.addEventListener('click', () => {
            this.handleJump();
        });
        
        // Tecla ESPACIO para saltar
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.handleJump();
            }
        });
    }
    
    /**
     * Inicia el juego
     */
    startGame() {
        // Inicializar el modelo
        this.model.initGame();
        
        // Actualizar la vista
        this.view.showGameCanvas();
        this.view.updateHUD(this.model.getGameState());
        
        // Iniciar el temporizador
        this.model.startTimer(() => {
            this.view.updateHUD(this.model.getGameState());
        });
        
        // Iniciar el game loop
        this.isGameRunning = true;
        this.gameLoop();
    }
    
    /**
     * Maneja el salto del pájaro
     */
    handleJump() {
        if (this.model.gameState === 'playing') {
            this.model.jump();
        }
    }
    
    /**
     * Loop principal del juego
     */
    gameLoop() {
        if (!this.isGameRunning || this.model.gameState !== 'playing') {
            return;
        }
        
        // Actualizar el modelo
        this.updateGame();
        
        // Renderizar la vista
        this.view.render(this.model);
        
        // Actualizar HUD
        this.view.updateHUD(this.model.getGameState());
        
        // Continuar el loop
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }
    
    /**
     * Actualiza el estado del juego
     */
    updateGame() {
        // Actualizar elementos del juego
        this.model.updateBird();
        this.model.updatePipes();
        this.model.updateStars();
        this.model.updateClouds();
        this.model.updateParallax();
        
        // Verificar colisiones
        const pipeCollision = this.model.checkPipeCollisions();
        const starCollected = this.model.checkStarCollisions();
        
        // Efectos visuales para colisiones
        if (pipeCollision) {
            const bird = this.model.getBirdData();
            this.view.drawExplosion(bird.x + bird.width / 2, bird.y + bird.height / 2);
            this.endGame();
        }
        
        if (starCollected) {
            // Se podría agregar un efecto visual aquí
        }
        
        // Verificar si el juego terminó
        if (this.model.gameState !== 'playing') {
            this.endGame();
        }
    }
    
    /**
     * Termina el juego
     */
    endGame() {
        this.isGameRunning = false;
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        this.model.clearTimer();
        
        // Mostrar pantalla de game over después de un breve delay
        setTimeout(() => {
            this.view.showGameOverScreen(this.model.getGameState());
        }, 500);
    }
    
    /**
     * Pausa el juego
     */
    pauseGame() {
        if (this.isGameRunning) {
            this.isGameRunning = false;
            this.model.clearTimer();
            
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
                this.animationId = null;
            }
        }
    }
    
    /**
     * Reanuda el juego
     */
    resumeGame() {
        if (!this.isGameRunning && this.model.gameState === 'playing') {
            this.isGameRunning = true;
            
            // Reiniciar temporizador
            this.model.startTimer(() => {
                this.view.updateHUD(this.model.getGameState());
            });
            
            // Reanudar game loop
            this.gameLoop();
        }
    }
    
    /**
     * Obtiene el estado actual del juego
     */
    getGameState() {
        return this.model.getGameState();
    }
}