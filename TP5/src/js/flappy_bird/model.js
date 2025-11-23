/**
 * MODEL - Flappy Bird
 * Maneja toda la lógica del juego, estado y datos
 */

class FlappyBirdModel {
    constructor() {
        // Configuración del canvas
        this.canvasWidth = 800;
        this.canvasHeight = 400;
        
        // Estado del juego
        this.gameState = 'start'; // start, playing, gameOver, won
        this.score = 0;
        this.timeLeft = 60;
        this.bestScore = this.loadBestScore();
        
        // Configuración del pájaro
        this.bird = {
            x: 150,
            y: 200,
            width: 40,
            height: 30,
            velocity: 0,
            gravity: 0.5,
            jumpForce: -10,
            rotation: 0,
            frame: 0,
            animationCounter: 0
        };
        
        // Configuración de tuberías
        this.pipeGap = 140;
        this.pipeWidth = 60;
        this.pipeSpeed = 3;
        this.pipes = [];
        this.pipeCounter = 0;
        this.pipeSpawnInterval = 90; // frames entre tuberías
        
        // Configuración de estrellas (bonus)
        this.stars = [];
        this.starCounter = 0;
        this.starSize = 20;
        
        // Configuración de nubes (elementos animados)
        this.clouds = [];
        this.numClouds = 5;
        
        // Parallax layers (4 capas requeridas)
        this.parallaxLayers = [
            { x: 0, speed: 0.5, color: '#87CEEB', yOffset: 0, amplitude: 20 },
            { x: 0, speed: 1, color: '#6CB4E8', yOffset: 70, amplitude: 25 },
            { x: 0, speed: 1.5, color: '#4A9FD8', yOffset: 130, amplitude: 30 },
            { x: 0, speed: 2, color: '#2E8BC0', yOffset: 190, amplitude: 35 }
        ];
        
        // Timer del juego
        this.gameTimer = null;
    }
    
    /**
     * Inicializa el juego
     */
    initGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.timeLeft = 60;
        
        // Reset del pájaro
        this.bird.y = 200;
        this.bird.velocity = 0;
        this.bird.rotation = 0;
        this.bird.frame = 0;
        this.bird.animationCounter = 0;
        
        // Reset de elementos
        this.pipes = [];
        this.stars = [];
        this.pipeCounter = 0;
        this.starCounter = 0;
        
        // Inicializar nubes
        this.initClouds();
        
        // Reset parallax
        this.parallaxLayers.forEach(layer => {
            layer.x = 0;
        });
    }
    
    /**
     * Inicializa las nubes con posiciones aleatorias
     */
    initClouds() {
        this.clouds = [];
        for (let i = 0; i < this.numClouds; i++) {
            this.clouds.push({
                x: Math.random() * this.canvasWidth,
                y: Math.random() * 120,
                width: 60 + Math.random() * 40,
                speed: 0.5 + Math.random() * 0.5,
                frame: Math.random() * 360
            });
        }
    }
    
    /**
     * Aplica impulso al pájaro (salto)
     */
    jump() {
        if (this.gameState === 'playing') {
            this.bird.velocity = this.bird.jumpForce;
            this.bird.rotation = -25;
        }
    }
    
    /**
     * Actualiza el estado del pájaro
     */
    updateBird() {
        // Aplicar gravedad
        this.bird.velocity += this.bird.gravity;
        this.bird.y += this.bird.velocity;
        
        // Rotación según velocidad
        if (this.bird.velocity > 0) {
            this.bird.rotation = Math.min(this.bird.rotation + 3, 90);
        }
        
        // Límites de pantalla
        if (this.bird.y + this.bird.height > this.canvasHeight) {
            this.endGame();
        }
        if (this.bird.y < 0) {
            this.bird.y = 0;
            this.bird.velocity = 0;
        }
        
        // Animación de aleteo
        this.bird.animationCounter++;
        if (this.bird.animationCounter % 8 === 0) {
            this.bird.frame = (this.bird.frame + 1) % 3;
        }
    }
    
    /**
     * Actualiza las tuberías
     */
    updatePipes() {
        // Generar nuevas tuberías
        this.pipeCounter++;
        if (this.pipeCounter > this.pipeSpawnInterval) {
            const minHeight = 100;
            const maxHeight = this.canvasHeight - this.pipeGap - minHeight;
            const topHeight = minHeight + Math.random() * (maxHeight - minHeight);
            
            this.pipes.push({
                x: this.canvasWidth,
                topHeight: topHeight,
                bottomY: topHeight + this.pipeGap,
                passed: false
            });
            this.pipeCounter = 0;
        }
        
        // Mover y actualizar tuberías
        for (let i = this.pipes.length - 1; i >= 0; i--) {
            const pipe = this.pipes[i];
            pipe.x -= this.pipeSpeed;
            
            // Punto por pasar tubería
            if (!pipe.passed && pipe.x + this.pipeWidth < this.bird.x) {
                pipe.passed = true;
                this.score++;
            }
            
            // Eliminar tuberías fuera de pantalla
            if (pipe.x + this.pipeWidth < 0) {
                this.pipes.splice(i, 1);
            }
        }
    }
    
    /**
     * Actualiza las estrellas (bonus)
     */
    updateStars() {
        this.starCounter++;
        
        // Generar nuevas estrellas ocasionalmente
        if (this.starCounter > 150 && Math.random() > 0.97) {
            this.stars.push({
                x: this.canvasWidth,
                y: 70 + Math.random() * (this.canvasHeight - 140),
                size: this.starSize,
                rotation: 0,
                collected: false
            });
            this.starCounter = 0;
        }
        
        // Mover estrellas
        for (let i = this.stars.length - 1; i >= 0; i--) {
            const star = this.stars[i];
            star.x -= this.pipeSpeed;
            star.rotation += 0.1;
            
            // Eliminar estrellas fuera de pantalla
            if (star.x + star.size < 0) {
                this.stars.splice(i, 1);
            }
        }
    }
    
    /**
     * Actualiza las nubes
     */
    updateClouds() {
        this.clouds.forEach(cloud => {
            cloud.x -= cloud.speed;
            
            // Reciclar nubes que salen de pantalla
            if (cloud.x + cloud.width < 0) {
                cloud.x = this.canvasWidth;
                cloud.y = Math.random() * 120;
            }
            
            // Animación de flotación
            cloud.frame += 0.05;
        });
    }
    
    /**
     * Actualiza las capas de parallax
     */
    updateParallax() {
        this.parallaxLayers.forEach(layer => {
            layer.x += layer.speed;
        });
    }
    
    /**
     * Verifica colisiones con tuberías
     */
    checkPipeCollisions() {
        for (const pipe of this.pipes) {
            // Verificar si el pájaro está en el rango horizontal de la tubería
            if (this.bird.x + this.bird.width > pipe.x && 
                this.bird.x < pipe.x + this.pipeWidth) {
                // Verificar colisión con tubería superior o inferior
                if (this.bird.y < pipe.topHeight || 
                    this.bird.y + this.bird.height > pipe.bottomY) {
                    this.endGame();
                    return true;
                }
            }
        }
        return false;
    }
    
    /**
     * Verifica colisiones con estrellas
     */
    checkStarCollisions() {
        for (let i = this.stars.length - 1; i >= 0; i--) {
            const star = this.stars[i];
            if (!star.collected) {
                // Colisión circular
                const dx = (this.bird.x + this.bird.width / 2) - star.x;
                const dy = (this.bird.y + this.bird.height / 2) - star.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < this.bird.width / 2 + star.size) {
                    star.collected = true;
                    this.score += 5; // Bonus de 5 puntos
                    this.stars.splice(i, 1);
                    return true;
                }
            }
        }
        return false;
    }
    
    /**
     * Actualiza el temporizador
     */
    updateTimer() {
        this.timeLeft--;
        if (this.timeLeft <= 0) {
            this.winGame();
        }
    }
    
    /**
     * Termina el juego (derrota)
     */
    endGame() {
        if (this.gameState !== 'playing') return;
        
        this.gameState = 'gameOver';
        this.clearTimer();
        this.updateBestScore();
    }
    
    /**
     * Gana el juego (sobrevivió el tiempo)
     */
    winGame() {
        if (this.gameState !== 'playing') return;
        
        this.gameState = 'won';
        this.score += 50; // Bonus por completar
        this.clearTimer();
        this.updateBestScore();
    }
    
    /**
     * Actualiza el mejor puntaje
     */
    updateBestScore() {
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            this.saveBestScore();
        }
    }
    
    /**
     * Guarda el mejor puntaje en localStorage
     */
    saveBestScore() {
        try {
            localStorage.setItem('flappyBirdBestScore', this.bestScore.toString());
        } catch (e) {
            console.warn('No se pudo guardar el mejor puntaje');
        }
    }
    
    /**
     * Carga el mejor puntaje desde localStorage
     */
    loadBestScore() {
        try {
            const saved = localStorage.getItem('flappyBirdBestScore');
            return saved ? parseInt(saved, 10) : 0;
        } catch (e) {
            return 0;
        }
    }
    
    /**
     * Limpia el temporizador
     */
    clearTimer() {
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            this.gameTimer = null;
        }
    }
    
    /**
     * Inicia el temporizador del juego
     */
    startTimer(callback) {
        this.clearTimer();
        this.gameTimer = setInterval(() => {
            this.updateTimer();
            if (callback) callback();
        }, 1000);
    }
    
    /**
     * Obtiene los datos del pájaro
     */
    getBirdData() {
        return { ...this.bird };
    }
    
    /**
     * Obtiene los datos de las tuberías
     */
    getPipesData() {
        return this.pipes.map(pipe => ({ ...pipe }));
    }
    
    /**
     * Obtiene los datos de las estrellas
     */
    getStarsData() {
        return this.stars.map(star => ({ ...star }));
    }
    
    /**
     * Obtiene los datos de las nubes
     */
    getCloudsData() {
        return this.clouds.map(cloud => ({ ...cloud }));
    }
    
    /**
     * Obtiene los datos de parallax
     */
    getParallaxData() {
        return this.parallaxLayers.map(layer => ({ ...layer }));
    }
    
    /**
     * Obtiene el estado del juego
     */
    getGameState() {
        return {
            state: this.gameState,
            score: this.score,
            timeLeft: this.timeLeft,
            bestScore: this.bestScore
        };
    }
}