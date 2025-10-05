/**
 * 
 * Track: .carousel-track (Contenedor de las imágenes)
 * Slides: .carousel-slide (Cada imagen)
 * Botones: .btn-prev, .btn-next (Navegación)
 * Indicadores: .indicator (Puntos de navegación)
 * Contadores: .current, .total (Contador de imágenes)
 * 
 * Funciones:
 * - updateCarousel(): Actualiza las posiciones 3D del carrusel
 * - nextSlide(): Muestra la siguiente imagen
 * - prevSlide(): Muestra la imagen anterior
 * - Event listeners para botones, indicadores y teclado
 * - Auto-play cada 5 segundos
 * 
 */

const track = document.querySelector('.carousel-track');
const slides = document.querySelectorAll('.carousel-slide');
const btnPrev = document.querySelector('.btn-prev');
const btnNext = document.querySelector('.btn-next');
const indicators = document.querySelectorAll('.indicator');
const currentCounter = document.querySelector('.current');
const totalCounter = document.querySelector('.total');

let currentSlide = 0;
const totalSlides = slides.length;

totalCounter.textContent = totalSlides;

/**
 * Actualiza las posiciones 3D de todas las slides
 * Calcula la posición relativa de cada slide respecto a la activa
 */
function updateCarousel() {
    slides.forEach((slide, index) => {
        // Remover todas las clases de posición
        slide.className = 'carousel-slide';
        
        // Si tiene la clase media-video, mantenerla
        if (slide.querySelector('iframe')) {
            slide.classList.add('media-video');
        }
        
        // Calcular diferencia de posición
        const diff = index - currentSlide;
        
        // Asignar clase según posición
        if (diff === 0) {
            slide.classList.add('active');
        } else if (diff === -1 || diff === totalSlides - 1) {
            slide.classList.add('left-1');
        } else if (diff === -2 || diff === totalSlides - 2) {
            slide.classList.add('left-2');
        } else if (diff === 1 || diff === -(totalSlides - 1)) {
            slide.classList.add('right-1');
        } else if (diff === 2 || diff === -(totalSlides - 2)) {
            slide.classList.add('right-2');
        } else {
            slide.classList.add('hidden');
        }
    });

    // Actualizar indicadores
    indicators.forEach((indicator, index) => {
        indicator.classList.toggle('active', index === currentSlide);
    });

    // Actualizar contador
    currentCounter.textContent = currentSlide + 1;
}

/**
 * Avanza a la siguiente slide
 * Usa módulo para hacer loop infinito
 */
function nextSlide() {
    currentSlide = (currentSlide + 1) % totalSlides;
    updateCarousel();
}

/**
 * Retrocede a la slide anterior
 * Suma totalSlides para evitar números negativos
 */
function prevSlide() {
    currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
    updateCarousel();
}

/**
 * Va directamente a una slide específica
 * @param {number} index - Índice de la slide objetivo
 */
function goToSlide(index) {
    currentSlide = index;
    updateCarousel();
}

// Event listeners para botones de navegación
btnNext.addEventListener('click', nextSlide);
btnPrev.addEventListener('click', prevSlide);

// Event listeners para indicadores
indicators.forEach((indicator, index) => {
    indicator.addEventListener('click', () => {
        goToSlide(index);
    });
});

// Navegación con teclado
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') prevSlide();
    if (e.key === 'ArrowRight') nextSlide();
});

// Auto-play cada 5 segundos
let autoplayInterval = setInterval(nextSlide, 5000);

// Pausar autoplay cuando el usuario interactúa
const carousel = document.querySelector('.carousel-container');
carousel.addEventListener('mouseenter', () => {
    clearInterval(autoplayInterval);
});

carousel.addEventListener('mouseleave', () => {
    autoplayInterval = setInterval(nextSlide, 5000);
});

// Inicializar el carrusel
updateCarousel();