// <game-carousel> web component
// Attributes:
// - title: Section title (default: "Juegos")
// - genre: Filter by genre name (case-insensitive), e.g., "Card"
// - limit: Max items to render (default: 20)
// - api:   Endpoint returning an array of games (default: https://vj.interfaces.jima.com.ar/api)
(function(){
  class GameCarousel extends HTMLElement {
    constructor(){
      super();
      this._api = this.getAttribute('api') || 'https://vj.interfaces.jima.com.ar/api';
      this._genre = this.getAttribute('genre') || '';
      this._limit = parseInt(this.getAttribute('limit') || '20', 10);
      this._title = this.getAttribute('title') || 'Juegos';
    }

    // Lifecycle: attach skeleton immediately, then fetch and hydrate
    connectedCallback(){
      this.renderSkeleton();
      this.fetchAndRender();
    }

    // Lightweight placeholder UI to avoid layout shifts while loading
    renderSkeleton(){
      const skeletons = new Array(8).fill(0).map(() => `
        <li class="game-card is-skeleton">
          <a class="game-card__link" href="#" draggable="false" tabindex="-1" aria-hidden="true">
            <div class="game-card__thumb">
              <div class="game-card__overlay"><span class="game-card__title">&nbsp;</span></div>
            </div>
          </a>
        </li>`).join('');

      this.innerHTML = `
        <section class="game-carousel">
          <div class="game-carousel__head">
            <h3 class="game-carousel__title">${this._title}</h3>
            <a class="game-carousel__more" href="#">Ver más</a>
          </div>
          <div class="game-carousel__viewport">
            <button class="game-carousel__nav game-carousel__nav--prev" aria-label="Anterior" disabled>❮</button>
            <ul class="game-carousel__track">${skeletons}</ul>
            <button class="game-carousel__nav game-carousel__nav--next" aria-label="Siguiente" disabled>❯</button>
          </div>
        </section>`;
    }

    // Fetch data and decide which list to show based on requested genre
    async fetchAndRender(){
      let games = [];
      try {
        const res = await fetch(this._api, { cache: 'no-store' });
        games = await res.json();
      } catch (err) {
        console.error('Carousel fetch failed:', err);
        this.renderError('No se pudieron cargar los juegos.');
        return;
      }

      const wanted = (this._genre || '').trim().toLowerCase();
      let list = Array.isArray(games) ? games.slice() : [];
      if (wanted) {
        const byGenre = list.filter(g => (g.genres||[]).some(gn => String(gn.name||'').toLowerCase() === wanted));
        if (byGenre.length) {
          list = byGenre;
        } else {
          // Fallback: take top-rated if no genre match exists in the API
          list.sort((a,b) => (b.rating||0) - (a.rating||0));
        }
      }

      if (this._limit && Number.isFinite(this._limit)) list = list.slice(0, this._limit);
      this.renderList(list);
    }

    // Render a minimal error state while preserving the section heading
    renderError(message){
      this.innerHTML = `
        <section class="game-carousel">
          <div class="game-carousel__head">
            <h3 class="game-carousel__title">${this._title}</h3>
          </div>
          <p class="body-b2" style="color: var(--b-300); padding: 8px 4px;">${message}</p>
        </section>`;
    }

    // Render list and wire interactions
    renderList(list){
      // Build items
      const items = list.map(g => {
        const name = String(g.name || '');
        const img = String(g.background_image || '');
        return `
          <li class="game-card" title="${this.escape(name)}">
            <a class="game-card__link" href="#" draggable="false">
              <div class="game-card__thumb">
                <div class="game-card__backdrop" style="background-image:url('${this.cssUrl(img)}')"></div>
                <img src="${this.escape(img)}" alt="${this.escape(name)}" width="240" height="100" loading="lazy" />
                <div class="game-card__overlay"><span class="game-card__title">${this.escape(name)}</span></div>
              </div>
            </a>
          </li>`;
      }).join('');

      // Inject structure and wire interactions
      this.innerHTML = `
        <section class="game-carousel">
          <div class="game-carousel__head">
            <h3 class="game-carousel__title subtitle-s1">${this._title}</h3>
            <a class="game-carousel__more body-b1" href="#">Ver más</a>
          </div>
          <div class="game-carousel__viewport">
            <button class="game-carousel__nav game-carousel__nav--prev" aria-label="Anterior">❮</button>
            <ul class="game-carousel__track">${items}</ul>
            <button class="game-carousel__nav game-carousel__nav--next" aria-label="Siguiente">❯</button>
          </div>
        </section>`;

      const track = this.querySelector('.game-carousel__track');
      const prev = this.querySelector('.game-carousel__nav--prev');
      const next = this.querySelector('.game-carousel__nav--next');
      // Ensure ASCII arrow characters to avoid encoding issues
      try { prev.textContent = '<'; next.textContent = '>'; } catch(e){}

      // Scroll step: jump ~3 cards or viewport width minus paddles
      const step = () => Math.max(240 * 3 + 24, this.clientWidth - 80);
      // Enable/disable buttons when at scroll bounds
      const update = () => {
        const max = track.scrollWidth - track.clientWidth - 1;
        prev.toggleAttribute('disabled', track.scrollLeft <= 0);
        next.toggleAttribute('disabled', track.scrollLeft >= max);
      };

      prev.addEventListener('click', () => { track.scrollBy({ left: -step(), behavior: 'smooth' }); });
      next.addEventListener('click', () => { track.scrollBy({ left: step(),  behavior: 'smooth' }); });
      track.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update);
      update();
    }

    // Basic HTML escaper for text nodes/attributes
    escape(str){
      return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[s]));
    }
    // Basic sanitizer for inline CSS url('...') usage
    cssUrl(u){
      return String(u).replace(/'/g, '%27');
    }
  }

  customElements.define('game-carousel', GameCarousel);
})();

