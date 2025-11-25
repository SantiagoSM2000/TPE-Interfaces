/**
 * loading.js
 * 
 * Maneja la pantalla de carga al iniciar la página.
 */

// Agregar clase loading al body al inicio
document.body.classList.add('loading');

/**
 * Simula una carga progresiva.
 */
let progress = 0;
const progressEl = document.getElementById('progress');
const loadingEl = document.getElementById('loading');


/**
 * Incrementa el progreso cada 100ms hasta llegar a 100%.
 * Luego oculta la pantalla de carga.
 */
const interval = setInterval(() => {
    progress += 2;
    progressEl.textContent = progress + '%';

    // Cuando llega a 100%, oculta la pantalla de carga
    if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
            loadingEl.style.display = 'none';
            document.body.classList.remove('loading');
            document.dispatchEvent(new Event('vp-loading-complete'));
        }, 100);
    }
}, 100);