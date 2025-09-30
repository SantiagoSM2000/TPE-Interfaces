// <game-carousel> web component
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
      const skeletons = Array.from({length:8}, () => `<li><game-card skeleton${this._cardVariant ? ` variant="${this.escape(this._cardVariant)}"` : ''}></game-card></li>`).join('');
      this.innerHTML = `
        <section class="game-carousel">
          <div class="game-carousel__head">
            <h3 class="game-carousel__title">${this._title}</h3>
            <a class="game-carousel__more" href="#">Ver más</a>
          </div>
          <div class="game-carousel__viewport">
            <button class="game-carousel__nav game-carousel__nav--prev" aria-label="Anterior" disabled>&lt;</button>
            <ul class="game-carousel__track">${skeletons}</ul>
            <button class="game-carousel__nav game-carousel__nav--next" aria-label="Siguiente" disabled>&gt;</button>
          </div>
        </section>`;
    }

    async fetchAndRender(){
      let games = [];
      try {
        const res = await fetch(this._api, {cache:'no-store'});
        games = await res.json();
      } catch (err) {
        console.error('Carousel fetch failed:', err);
        this.renderError('No se pudieron cargar los juegos.');
        return;
      }

      let list = Array.isArray(games) ? [...games] : [];
      if (this._genre) {
        const filtered = list.filter(g => Array.isArray(g.genres) && g.genres.some(gn => String(gn?.name || '').toLowerCase() === this._genre));
        list = filtered.length ? filtered : list.sort((a,b) => (b.rating||0) - (a.rating||0));
      }

      if (this._limit && Number.isFinite(this._limit)) list = list.slice(0, this._limit);
      this.renderList(list);
    }

    renderError(msg){
      this.innerHTML = `
        <section class="game-carousel">
          <div class="game-carousel__head">
            <h3 class="game-carousel__title">${this._title}</h3>
          </div>
          <p class="body-b2" style="color: var(--b-300); padding: 8px 4px;">${msg}</p>
        </section>`;
    }

    renderList(list){
      const eagerCount = document.querySelector('game-carousel') === this ? 9 : 0;
      const isShort = list.length < 8;
      const items = list.map((g, idx) => {
        const name = String(g.name || '');
        const img = String(g.background_image || '');
        const eager = idx < eagerCount;
        const v = this._cardVariant ? ` variant="${this.escape(this._cardVariant)}"` : '';
        return `<li><game-card name="${this.escape(name)}" img="${this.escape(img)}" ${eager ? 'eager' : ''}${v}></game-card></li>`;
      }).join('');

      this.innerHTML = `
        <section class="game-carousel${isShort ? ' game-carousel--short' : ''}">
          <div class="game-carousel__head">
            <h3 class="game-carousel__title subtitle-s1">${this._title}</h3>
            <a class="game-carousel__more body-b1" href="#">Ver más</a>
          </div>
          <div class="game-carousel__viewport">
            <button class="game-carousel__nav game-carousel__nav--prev" aria-label="Anterior"${isShort ? ' disabled' : ''}>&lt;</button>
            <ul class="game-carousel__track">${items}</ul>
            <button class="game-carousel__nav game-carousel__nav--next" aria-label="Siguiente"${isShort ? ' disabled' : ''}>&gt;</button>
          </div>
        </section>`;

      if (!isShort) {
        this.initNav();
      }
    }

    initNav(){
      const track = this.querySelector('.game-carousel__track');
      const prev = this.querySelector('.game-carousel__nav--prev');
      const next = this.querySelector('.game-carousel__nav--next');

      const measureStep = () => {
        const card = track.querySelector('.game-card');
        const cw = card ? card.getBoundingClientRect().width : 240;
        const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || '12');
        return Math.max(cw*3 + gap*2, this.clientWidth - 140);
      };

      const updateButtons = () => {
        prev.disabled = track.scrollLeft <= 0;
        next.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 1;
      };

      const scrollBy = dx => {
        track.scrollBy({left: dx, behavior: 'smooth'});
        setTimeout(updateButtons, 300);
      };

      prev.addEventListener('click', () => scrollBy(-measureStep()));
      next.addEventListener('click', () => scrollBy(measureStep()));
      track.addEventListener('scroll', updateButtons);
      window.addEventListener('resize', updateButtons);
      updateButtons();
    }

    escape(str){ return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[s])); }
  }

  customElements.define('game-carousel', GameCarousel);
})();
