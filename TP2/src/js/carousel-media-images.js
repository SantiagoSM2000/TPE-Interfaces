/**
 * carousel-media-images.js
 * Controlador del carrusel de imágenes en la página del juego.
 * 
 * Track: .carousel-track (Contenedor de las imágenes)
 * Slides: .carousel-slide (Cada imagen)
 * Botones: .btn-prev, .btn-next (Navegación)
 * Indicadores: .indicator (Puntos de navegación)
 * Contadores: .current, .total (Contador de imágenes)
 * 
 * Funciones:
 * - updateCarousel(): Actualiza la vista del carrusel.
 * - nextSlide(): Muestra la siguiente imagen.
 * - prevSlide(): Muestra la imagen anterior.
 * - Event listeners para botones, indicadores y teclado.
 * - Auto-play cada 5 segundos.
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

function updateCarousel() {
    // Remover clase active de todos
    slides.forEach(slide => slide.classList.remove('active'));
    indicators.forEach(ind => ind.classList.remove('active'));

    // Agregar clase active al actual
    slides[currentSlide].classList.add('active');
    indicators[currentSlide].classList.add('active');

    // Mover el track
    // Cada slide ocupa el 100% del contenedor.
    const offset = -currentSlide * 100;
    track.style.transform = `translateX(${offset}%)`;

    // Actualizar contador
    currentCounter.textContent = currentSlide + 1;
}

/**
 * (currentSlide + 1) % totalSlides
 * Si currentSlide es 0, pasa a 1.
 * Si currentSlide es 1, pasa a 2.
 */

function nextSlide() {
    currentSlide = (currentSlide + 1) % totalSlides;
    updateCarousel();
}

function prevSlide() {
    currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
    updateCarousel();
}

// Event listeners
btnNext.addEventListener('click', nextSlide);
btnPrev.addEventListener('click', prevSlide);


/**
 * Indicadores
 * Cada indicador tiene un índice.
 * Al hacer click, se actualiza currentSlide y se llama a updateCarousel().
 */
indicators.forEach((indicator, index) => {
    indicator.addEventListener('click', () => {
        currentSlide = index;
        updateCarousel();
    });
});

// Navegación con teclado
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') prevSlide();
    if (e.key === 'ArrowRight') nextSlide();
});

// Auto-play
setInterval(nextSlide, 5000);