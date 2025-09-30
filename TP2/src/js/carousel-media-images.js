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
    const offset = -currentSlide * 100;
    track.style.transform = `translateX(${offset}%)`;

    // Actualizar contador
    currentCounter.textContent = currentSlide + 1;
}

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