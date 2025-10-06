// Componente web de carrusel de juegos
(function(){
  class GameCarousel extends HTMLElement {
    constructor(){
      super();
      this._api = this.getAttribute('api') || 'https://vj.interfaces.jima.com.ar/api';
      this._genre = (this.getAttribute('genre') || '').toLowerCase();
      this._limit = parseInt(this.getAttribute('limit') || '20', 10);
      this._title = this.getAttribute('title') || 'Juegos';
      this._cardVariant = this.getAttribute('card-variant') || '';
    }

    connectedCallback(){
      this.renderSkeleton();
      this.fetchAndRender();
    }

    renderSkeleton(){
      const skeletons = Array.from({length: 8}, () => 
        `<li><game-card skeleton${this._cardVariant ? ` variant="${this._cardVariant}"` : ''}></game-card></li>`
      ).join('');
      
      this.innerHTML = `
        <section class="game-carousel">
          <div class="game-carousel__head">
            <h3 class="game-carousel__title">${this._title}</h3>
            <a class="game-carousel__more" href="#">Ver más</a>
          </div>
          <div class="game-carousel__viewport">
            <button class="game-carousel__nav game-carousel__nav--prev" aria-label="Anterior" disabled>&lt;</button>
            <ul class="game-carousel__track" style="justify-content: flex-start;">${skeletons}</ul>
            <button class="game-carousel__nav game-carousel__nav--next" aria-label="Siguiente" disabled>&gt;</button>
          </div>
        </section>`;
    }

    async fetchAndRender(){
      let games = [];
      try {
        const res = await fetch(this._api, {cache: 'no-store'});
        games = await res.json();
      } catch (err) {
        console.error('Error al cargar juegos:', err);
        this.renderError('No se pudieron cargar los juegos.');
        return;
      }

      let list = Array.isArray(games) ? [...games] : [];
      
      // Filtrar por género si se especifica
      if (this._genre) {
        const filtered = list.filter(g => 
          Array.isArray(g.genres) && 
          g.genres.some(gn => String(gn?.name || '').toLowerCase() === this._genre)
        );
        list = filtered.length ? filtered : list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      }

      // Limitar cantidad
      if (this._limit) list = list.slice(0, this._limit);
      
      this.renderList(list);
    }

    renderError(msg){
      this.innerHTML = `
        <section class="game-carousel">
          <div class="game-carousel__head">
            <h3 class="game-carousel__title">${this._title}</h3>
          </div>
          <p style="color: var(--b-300); padding: 8px 4px;">${msg}</p>
        </section>`;
    }

    renderList(list){
      const eagerCount = document.querySelector('game-carousel') === this ? 9 : 0;
      const items = list.map((g, idx) => {
        const name = g.name || '';
        const img = g.background_image || '';
        const eager = idx < eagerCount ? 'eager' : '';
        const variant = this._cardVariant ? ` variant="${this._cardVariant}"` : '';
        return `<li><game-card name="${name}" img="${img}" ${eager}${variant}></game-card></li>`;
      }).join('');

      this.innerHTML = `
        <section class="game-carousel">
          <div class="game-carousel__head">
            <h3 class="game-carousel__title subtitle-s1">${this._title}</h3>
            <a class="game-carousel__more body-b1" href="#">Ver más</a>
          </div>
          <div class="game-carousel__viewport">
            <button class="game-carousel__nav game-carousel__nav--prev" aria-label="Anterior">&lt;</button>
            <ul class="game-carousel__track" style="justify-content: flex-start;">${items}</ul>
            <button class="game-carousel__nav game-carousel__nav--next" aria-label="Siguiente">&gt;</button>
          </div>
        </section>`;

      this.initNav();
    }

    initNav(){
      const track = this.querySelector('.game-carousel__track');
      const prev = this.querySelector('.game-carousel__nav--prev');
      const next = this.querySelector('.game-carousel__nav--next');

      // Calcular cuánto desplazar (3 tarjetas + gaps)
      const measureStep = () => {
        const card = track.querySelector('.game-card');
        const cardWidth = card ? card.getBoundingClientRect().width : 240;
        const gap = parseFloat(getComputedStyle(track).columnGap || '12');
        return Math.max(cardWidth * 3 + gap * 2, this.clientWidth - 140);
      };

      // Actualizar estado de los botones
      const updateButtons = () => {
        prev.disabled = track.scrollLeft <= 0;
        next.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 1;
      };

      // Desplazar el carrusel
      const scrollBy = dx => {
        track.scrollBy({left: dx, behavior: 'smooth'});
        setTimeout(updateButtons, 300);
      };

      prev.addEventListener('click', () => scrollBy(-measureStep()));
      next.addEventListener('click', () => scrollBy(measureStep()));
      track.addEventListener('scroll', updateButtons);
      window.addEventListener('resize', updateButtons);

      const afterLoading = () => requestAnimationFrame(updateButtons);
      if (document.body.classList.contains('loading')) {
        document.addEventListener('vp-loading-complete', afterLoading, {once: true});
      } else {
        afterLoading();
      }

      updateButtons();
    }
  }

  customElements.define('game-carousel', GameCarousel);
})();