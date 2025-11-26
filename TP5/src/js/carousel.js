// Componente web de carrusel de juegos
(function(){
  const MIN_MISC_CARDS = 5;
  const MANUAL_CARDS = [
    {
      genre: 'platformer',
      id: '__manual_platformer_Batman-Peg-Solitaire__',
      name: 'Batman Peg Solitaire',
      background_image: 'assets/img/Batman_peg_soliataire-bg.png',
      genres: [{ name: 'Platformer' }],
      rating: 5,
      href: 'game.html'
    },
    {
      genre: 'platformer',
      id: '__manual_platformer_Blocka__',
      name: 'Blocka',
      background_image: 'assets/img/logo-blocka.png',
      genres: [{ name: 'Platformer' }],
      rating: 5,
      href: 'blocka.html'
    },
    {
      genre: 'platformer',
      id: '__manual_platformer_FlappyBird__',
      name: 'Flappy Bird - Bosque Rúnico',
      background_image: 'assets/img/logo-flappy-bird.png',
      genres: [{ name: 'Platformer' }],
      rating: 5,
      href: 'flappy-bird.html'
    }
  ];

  const fetchCache = new Map();

  function getGames(api){
    if (!api) return Promise.resolve([]);
    if (!fetchCache.has(api)) {
      fetchCache.set(api,
        fetch(api, {cache: 'no-store'})
          .then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
          })
          .catch(err => {
            fetchCache.delete(api);
            throw err;
          })
      );
    }
    return fetchCache.get(api);
  }

  function cloneManualCard(card){
    const {genre, ...rest} = card;
    return {...rest};
  }

  function normalizeList(value){
    return Array.isArray(value) ? value : [];
  }

  class GameCarousel extends HTMLElement {
    static get observedAttributes() {
      return ['card-variant'];
    }
    
    constructor(){
      super();
      this._api = this.getAttribute('api') || 'https://vj.interfaces.jima.com.ar/api';
      this._genre = (this.getAttribute('genre') || '').toLowerCase();
      const limitAttr = parseInt(this.getAttribute('limit') || '20', 10);
      this._limit = Number.isNaN(limitAttr) ? 0 : limitAttr;
      this._title = this.getAttribute('title') || 'Juegos';
      this._cardVariant = this.getAttribute('card-variant') || '';
      this._isMiscTarget = this.hasAttribute('misc');
      this._hasSkeleton = false;
      this._miscItems = [];
      this._handleMiscAdd = null;
    }

    connectedCallback(){
      this._isMiscTarget = this.hasAttribute('misc');
      if (this._isMiscTarget) {
        this.suppress();
        this.registerMiscListeners();
        return;
      }

      this.renderSkeleton();
      this.fetchAndRender();
    }

    attributeChangedCallback(name, oldVal, newVal) {
      if (name === 'card-variant' && oldVal !== newVal) {
        this._cardVariant = newVal || '';
        this.renderSkeleton();
        this.fetchAndRender();
      }
    }

    // Render a lightweight placeholder while we load the real data
    renderSkeleton(){
      // Build 8 placeholder items using <game-card skeleton>
      let skeletons = '';
      for (let i = 0; i < 8; i++) {
        const v = this._cardVariant ? ` variant=\"${this.escape(this._cardVariant)}\"` : '';
        skeletons += `<li><game-card skeleton${v}></game-card></li>`;
      }
    }

    registerMiscListeners(){
      if (this._handleMiscAdd) return;

      this._handleMiscAdd = evt => {
        const detail = evt.detail || {};
        const items = normalizeList(detail.items);
        if (!items.length) return;
        this._miscItems.push(...items.map(item => ({...item})));
        this.renderMisc();
      };
      document.addEventListener('game-carousel:misc-add', this._handleMiscAdd);
    }

    renderSkeleton(){
      if (this._hasSkeleton) return;
      const skeletons = Array.from({length: 8}, () =>
        `<li><game-card skeleton${this._cardVariant ? ` variant="${this._cardVariant}"` : ''}></game-card></li>`
      ).join('');

      this.innerHTML = `
        <section class="game-carousel">
          <div class="game-carousel__head">
            <h3 class="game-carousel__title">${this._title}</h3>
            <a class="game-carousel__more" href="#">Ver m&aacute;s</a>
          </div>
          <div class="game-carousel__viewport">
            <button class="game-carousel__nav game-carousel__nav--prev" aria-label="Anterior" disabled>◄</button>
            <ul class="game-carousel__track" style="justify-content: flex-start;">${skeletons}</ul>
            <button class="game-carousel__nav game-carousel__nav--next" aria-label="Siguiente" disabled>►</button>
          </div>
        </section>`;
      this._hasSkeleton = true;
      this.removeSuppression();
    }

    suppress(){
      this.innerHTML = '';
      this._hasSkeleton = false;
      this.setAttribute('hidden', '');
      this.setAttribute('aria-hidden', 'true');
      this.style.display = 'none';
    }

    removeSuppression(){
      this.removeAttribute('hidden');
      this.removeAttribute('aria-hidden');
      this.style.removeProperty('display');
    }

    async fetchAndRender(){
      let games = [];
      try {
        games = await getGames(this._api);
      } catch (err) {
        console.error('Error al cargar juegos:', err);
        this.renderError('No se pudieron cargar los juegos.');
        return;
      }

      let list = normalizeList(games);

      if (this._genre) {
        const filtered = list.filter(g =>
          Array.isArray(g.genres) &&
          g.genres.some(gn => String(gn?.name || '').toLowerCase() === this._genre)
        );
        list = filtered.length ? filtered : [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0));
      }

      const manualCards = MANUAL_CARDS.filter(card => card.genre === this._genre);
      if (manualCards.length) {
        for (let i = manualCards.length - 1; i >= 0; i--) {
          list.unshift(cloneManualCard(manualCards[i]));
        }
      }

      if (this._limit) {
        list = list.slice(0, this._limit);
      }

      if (!list.length) {
        this.suppress();
        return;
      }

      if (!this._isMiscTarget && list.length < MIN_MISC_CARDS) {
        this.dispatchMisc(list);
        this.suppress();
        return;
      }

      this.renderList(list);
    }

    dispatchMisc(items){
      if (!items.length) return;
      const payload = items.map(item => ({...item}));
      document.dispatchEvent(new CustomEvent('game-carousel:misc-add', {
        detail: { items: payload }
      }));
    }

    renderMisc(){
      const items = this._limit ? this._miscItems.slice(0, this._limit) : [...this._miscItems];
      if (!items.length) {
        this.suppress();
        return;
      }
      this.renderList(items);
    }

    renderError(msg){
      this.removeSuppression();
      this._hasSkeleton = false;
      this.innerHTML = `
        <section class="game-carousel">
          <div class="game-carousel__head">
            <h3 class="game-carousel__title">${this._title}</h3>
          </div>
          <p style="color: var(--b-300); padding: 8px 4px;">${msg}</p>
        </section>`;
    }

    renderList(list){
      this.removeSuppression();
      this._hasSkeleton = false;

      const eagerCount = document.querySelector('game-carousel') === this ? 9 : 0;
      const items = list.map((g, idx) => {
        const name = g.name || '';
        const img = g.background_image || '';
        const href = g.href || '#';
        const eager = idx < eagerCount ? 'eager' : '';
        const variant = this._cardVariant ? ` variant="${this._cardVariant}"` : '';
        return `<li><game-card name="${name}" img="${img}" href="${href}" ${eager}${variant}></game-card></li>`;
      }).join('');

      this.innerHTML = `
        <section class="game-carousel">
          <div class="game-carousel__head">
            <h3 class="game-carousel__title subtitle-s1">${this._title}</h3>
            <a class="game-carousel__more body-b1" href="#">Ver m&aacute;s</a>
          </div>
          <div class="game-carousel__viewport">
            <button class="game-carousel__nav game-carousel__nav--prev" aria-label="Anterior">◄</button>
            <ul class="game-carousel__track" style="justify-content: flex-start;">${items}</ul>
            <button class="game-carousel__nav game-carousel__nav--next" aria-label="Siguiente">►</button>
          </div>
        </section>`;

      if (list.length) {
        this.initNav();
      }
    }

    initNav(){
      const track = this.querySelector('.game-carousel__track');
      const prev = this.querySelector('.game-carousel__nav--prev');
      const next = this.querySelector('.game-carousel__nav--next');

      if (!track || !prev || !next) return;

      const measureStep = () => {
        const card = track.querySelector('.game-card');
        const cardWidth = card ? card.getBoundingClientRect().width : 240;
        const gap = parseFloat(getComputedStyle(track).columnGap || '12');
        return Math.max(cardWidth * 3 + gap * 2, this.clientWidth - 140);
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
