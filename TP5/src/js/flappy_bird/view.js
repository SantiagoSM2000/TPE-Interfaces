/**
 * VIEW - Flappy Bird
 * Maneja toda la renderización y actualización de la interfaz
 */

class FlappyBirdView {
    constructor() {
        // Elementos del DOM
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.startScreen = document.getElementById('game-start-screen');
        this.gameOverScreen = document.getElementById('game-over-screen');
        this.hud = document.getElementById('game-hud');
        this.instructions = document.getElementById('instructions-overlay');
        
        this.scoreDisplay = document.getElementById('score-display');
        this.timerDisplay = document.getElementById('timer-display');
        this.finalScoreDisplay = document.getElementById('final-score');
        this.bestScoreDisplay = document.getElementById('best-score');
        this.gameResultTitle = document.getElementById('game-result-title');
        
        this.startButton = document.getElementById('game-start-button');
        this.restartButton = document.getElementById('game-restart-button');
    }
    
    /**
     * Muestra la pantalla de inicio
     */
    showStartScreen() {
        this.startScreen.classList.remove('hidden');
        this.canvas.classList.add('hidden');
        this.hud.classList.add('hidden');
        this.instructions.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
    }
    
    /**
     * Muestra el canvas del juego
     */
    showGameCanvas() {
        this.startScreen.classList.add('hidden');
        this.canvas.classList.remove('hidden');
        this.hud.classList.remove('hidden');
        this.instructions.classList.remove('hidden');
        this.gameOverScreen.classList.add('hidden');
        
        // Ocultar instrucciones después de 3 segundos
        setTimeout(() => {
            this.instructions.classList.add('hidden');
        }, 3000);
    }
    
    /**
     * Muestra la pantalla de Game Over
     */
    showGameOverScreen(gameState) {
        this.gameOverScreen.classList.remove('hidden');
        
        // Cambiar título según si ganó o perdió
        if (gameState.state === 'won') {
            this.gameResultTitle.textContent = '¡GANASTE! 🎉';
            this.gameResultTitle.style.color = '#4CAF50';
        } else {
            this.gameResultTitle.textContent = 'GAME OVER';
            this.gameResultTitle.style.color = '#FF6B6B';
        }
        
        this.finalScoreDisplay.textContent = gameState.score;
        this.bestScoreDisplay.textContent = gameState.bestScore;
    }
    
    /**
     * Actualiza el HUD (puntuación y tiempo)
     */
    updateHUD(gameState) {
        this.scoreDisplay.textContent = gameState.score;
        this.timerDisplay.textContent = gameState.timeLeft;
    }
    
    /**
     * Limpia el canvas
     */
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    /**
     * Dibuja el fondo con parallax scrolling (4 capas)
     */
    drawParallax(layers) {
        layers.forEach(layer => {
            this.ctx.fillStyle = layer.color;
            this.ctx.beginPath();
            
            const offset = layer.x % this.canvas.width;
            
            // Dibujar colinas/montañas con formas sinusoidales
            for (let x = -this.canvas.width; x < this.canvas.width * 2; x += 100) {
                const adjustedX = x - offset;
                const peakHeight = layer.amplitude + Math.sin(x / 50) * (layer.amplitude * 0.6);
                this.ctx.lineTo(adjustedX, this.canvas.height - layer.yOffset - peakHeight);
            }
            
            this.ctx.lineTo(this.canvas.width * 2, this.canvas.height);
            this.ctx.lineTo(-this.canvas.width, this.canvas.height);
            this.ctx.closePath();
            this.ctx.fill();
        });
    }
    
    /**
     * Dibuja las nubes animadas (spritesheet simulado)
     */
    drawClouds(clouds) {
        clouds.forEach(cloud => {
            const bounce = Math.sin(cloud.frame) * 3;
            
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            this.ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
            this.ctx.shadowBlur = 10;
            
            // Nube compuesta por círculos
            this.ctx.beginPath();
            this.ctx.arc(cloud.x, cloud.y + bounce, cloud.width * 0.3, 0, Math.PI * 2);
            this.ctx.arc(cloud.x + cloud.width * 0.3, cloud.y + bounce, cloud.width * 0.35, 0, Math.PI * 2);
            this.ctx.arc(cloud.x + cloud.width * 0.6, cloud.y + bounce, cloud.width * 0.3, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.shadowBlur = 0;
        });
    }
    
    /**
     * Dibuja el pájaro con animación keyframe
     */
    drawBird(bird) {
        this.ctx.save();
        this.ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
        this.ctx.rotate((bird.rotation * Math.PI) / 180);
        
        // Cuerpo del pájaro
        this.ctx.fillStyle = '#FFD700';
        this.ctx.strokeStyle = '#FFA500';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, bird.width / 2, bird.height / 2, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        
        // Ala con animación de aleteo (keyframe)
        const wingY = Math.sin(bird.frame * 2) * 5;
        const wingRotation = Math.sin(bird.frame * 2) * 0.3;
        
        this.ctx.save();
        this.ctx.rotate(wingRotation);
        this.ctx.fillStyle = '#FFA500';
        this.ctx.strokeStyle = '#FF8C00';
        this.ctx.beginPath();
        this.ctx.ellipse(-5, wingY, 15, 10, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        this.ctx.restore();
        
        // Ojo
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.arc(8, -5, 6, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = 'black';
        this.ctx.beginPath();
        this.ctx.arc(10, -5, 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Pico
        this.ctx.fillStyle = '#FF6347';
        this.ctx.strokeStyle = '#DC143C';
        this.ctx.beginPath();
        this.ctx.moveTo(15, 0);
        this.ctx.lineTo(25, -3);
        this.ctx.lineTo(25, 3);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        
        this.ctx.restore();
    }
    
    /**
     * Dibuja las tuberías
     */
    drawPipes(pipes, pipeWidth) {
        pipes.forEach(pipe => {
            const gradient = this.ctx.createLinearGradient(pipe.x, 0, pipe.x + pipeWidth, 0);
            gradient.addColorStop(0, '#4CAF50');
            gradient.addColorStop(1, '#45a049');
            
            // Tubería superior
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(pipe.x, 0, pipeWidth, pipe.topHeight);
            
            // Borde decorativo superior
            this.ctx.fillStyle = '#66BB6A';
            this.ctx.fillRect(pipe.x - 5, pipe.topHeight - 30, pipeWidth + 10, 30);
            
            // Contorno
            this.ctx.strokeStyle = '#2E7D32';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(pipe.x, 0, pipeWidth, pipe.topHeight);
            this.ctx.strokeRect(pipe.x - 5, pipe.topHeight - 30, pipeWidth + 10, 30);
            
            // Tubería inferior
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(pipe.x, pipe.bottomY, pipeWidth, this.canvas.height - pipe.bottomY);
            
            // Borde decorativo inferior
            this.ctx.fillStyle = '#66BB6A';
            this.ctx.fillRect(pipe.x - 5, pipe.bottomY, pipeWidth + 10, 30);
            
            // Contorno
            this.ctx.strokeRect(pipe.x, pipe.bottomY, pipeWidth, this.canvas.height - pipe.bottomY);
            this.ctx.strokeRect(pipe.x - 5, pipe.bottomY, pipeWidth + 10, 30);
        });
    }
    
    /**
     * Dibuja las estrellas con animación
     */
    drawStars(stars) {
        stars.forEach(star => {
            if (star.collected) return;
            
            this.ctx.save();
            this.ctx.translate(star.x, star.y);
            this.ctx.rotate(star.rotation);
            
            // Efecto de brillo pulsante
            const pulseSize = star.size + Math.sin(Date.now() / 200) * 3;
            
            // Sombra brillante
            this.ctx.shadowColor = '#FFF700';
            this.ctx.shadowBlur = 20;
            
            // Gradiente dorado
            const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, pulseSize);
            gradient.addColorStop(0, '#FFEB3B');
            gradient.addColorStop(0.5, '#FFD700');
            gradient.addColorStop(1, '#FFA000');
            
            this.ctx.fillStyle = gradient;
            
            // Dibujar estrella de 5 puntas
            this.ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
                const x = Math.cos(angle) * pulseSize;
                const y = Math.sin(angle) * pulseSize;
                if (i === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
            this.ctx.closePath();
            this.ctx.fill();
            
            // Contorno
            this.ctx.shadowBlur = 0;
            this.ctx.strokeStyle = '#FFA000';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            this.ctx.restore();
        });
    }
    
    /**
     * Dibuja animación de explosión cuando el pájaro colisiona
     */
    drawExplosion(x, y) {
        const particles = 20;
        const colors = ['#FF6B6B', '#FFA500', '#FFD700', '#FF4500'];
        
        for (let i = 0; i < particles; i++) {
            const angle = (Math.PI * 2 * i) / particles;
            const distance = 30;
            const px = x + Math.cos(angle) * distance;
            const py = y + Math.sin(angle) * distance;
            
            this.ctx.fillStyle = colors[i % colors.length];
            this.ctx.beginPath();
            this.ctx.arc(px, py, 5, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    /**
     * Dibuja efecto de colección de estrella
     */
    drawStarCollectEffect(x, y) {
        const sparkles = 8;
        this.ctx.fillStyle = '#FFD700';
        this.ctx.shadowColor = '#FFF700';
        this.ctx.shadowBlur = 15;
        
        for (let i = 0; i < sparkles; i++) {
            const angle = (Math.PI * 2 * i) / sparkles;
            const distance = 25;
            const px = x + Math.cos(angle) * distance;
            const py = y + Math.sin(angle) * distance;
            
            this.ctx.beginPath();
            this.ctx.arc(px, py, 3, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.shadowBlur = 0;
    }
    
    /**
     * Renderiza todo el juego
     */
    render(model) {
        this.clear();
        
        // Dibujar capas de parallax (4 capas)
        this.drawParallax(model.getParallaxData());
        
        // Dibujar nubes animadas
        this.drawClouds(model.getCloudsData());
        
        // Dibujar tuberías
        this.drawPipes(model.getPipesData(), model.pipeWidth);
        
        // Dibujar estrellas
        this.drawStars(model.getStarsData());
        
        // Dibujar pájaro
        this.drawBird(model.getBirdData());
    }
}