// <game-carousel> web component
//
// Attributes:
// - title: Section title (default: "Juegos")
// - genre: Filter by genre name (case-insensitive), e.g., "Card"
// - limit: Max items to render (default: 20)
// - api:   Endpoint returning an array of games (default: https://vj.interfaces.jima.com.ar/api)
(function(){
  class GameCarousel extends HTMLElement {
    constructor(){
      super();
      // Read options from HTML attributes, with sensible defaults
      this._api = this.getAttribute('api') || 'https://vj.interfaces.jima.com.ar/api';
      this._genre = this.getAttribute('genre') || '';
      this._limit = parseInt(this.getAttribute('limit') || '20', 10);
      this._title = this.getAttribute('title') || 'Juegos';
      // Optional: pass a variant down to <game-card>
      this._cardVariant = this.getAttribute('card-variant') || '';
    }

    // When the element is added to the page, we immediately render a
    // skeleton (placeholder) so the layout doesn't jump, then fetch data.
    connectedCallback(){
      this.renderSkeleton();
      this.fetchAndRender();
    }

    // Render a lightweight placeholder while we load the real data
    renderSkeleton(){
      // Build 8 placeholder items using <game-card skeleton>
      let skeletons = '';
      for (let i = 0; i < 8; i++) {
        const v = this._cardVariant ? ` variant=\"${this.escape(this._cardVariant)}\"` : '';
        skeletons += `<li><game-card skeleton${v}></game-card></li>`;
      }

      // Insert the carousel structure with the placeholder list
      this.innerHTML = `
        <section class="game-carousel">
          <div class="game-carousel__head">
            <h3 class="game-carousel__title">${this._title}</h3>
            <a class="game-carousel__more" href="#">Ver m&aacute;s</a>
          </div>
          <div class="game-carousel__viewport">
            <button class="game-carousel__nav game-carousel__nav--prev" aria-label="Anterior" disabled>&lt;</button>
            <ul class="game-carousel__track">${skeletons}</ul>
            <button class="game-carousel__nav game-carousel__nav--next" aria-label="Siguiente" disabled>&gt;</button>
          </div>
        </section>`;
    }

    // Fetch data from the API, pick what to show, then render it
    async fetchAndRender(){
      let games = [];
      try {
        const res = await fetch(this._api, { cache: 'no-store' });
        games = await res.json();
      } catch (err) {
        console.error('Carousel fetch failed:', err);
        this.renderError('No se pudieron cargar los juegos.');
        return; // Stop here on error
      }

      // Normalize requested genre to lowercase for comparisons
      const wanted = (this._genre || '').trim().toLowerCase();

      // Copy the returned array into a new list using a for-loop
      let list = [];
      if (Array.isArray(games)) {
        for (let i = 0; i < games.length; i++) list.push(games[i]);
      }

      // If a specific genre was requested, try to filter by it using
      // basic loops so it's easy to read.
      if (wanted) {
        const byGenre = [];
        for (let i = 0; i < list.length; i++) {
          const g = list[i];
          const genres = Array.isArray(g.genres) ? g.genres : [];
          let match = false;
          for (let j = 0; j < genres.length; j++) {
            const gn = genres[j];
            const name = String(gn && gn.name ? gn.name : '').toLowerCase();
            if (name === wanted) { match = true; break; }
          }
          if (match) byGenre.push(g);
        }
        if (byGenre.length > 0) {
          list = byGenre; // show only matching items
        } else {
          // Fallback: if no genre matches exist, show the highest-rated games instead
          list.sort((a,b) => (b.rating||0) - (a.rating||0));
        }
      }

      // Respect the limit attribute (if provided)
      if (this._limit && Number.isFinite(this._limit)) list = list.slice(0, this._limit);

      // Finally render the UI with real items
      this.renderList(list);
    }

    // If something goes wrong, show a clear but simple message
    renderError(message){
      this.innerHTML = `
        <section class="game-carousel">
          <div class="game-carousel__head">
            <h3 class="game-carousel__title">${this._title}</h3>
          </div>
          <p class="body-b2" style="color: var(--b-300); padding: 8px 4px;">${message}</p>
        </section>`;
    }

    // Render the list of items and hook up navigation behavior
    renderList(list){
      // Determine if this is the first carousel on the page.
      // We preload a few images there to avoid a slow first click.
      const isFirstCarousel = document.querySelector('game-carousel') === this;
      const eagerCount = isFirstCarousel ? 9 : 0; // roughly one page worth

      // Build HTML for each card using a classic for-loop producing <game-card> elements
      let items = '';
      for (let idx = 0; idx < list.length; idx++) {
        const g = list[idx];
        const name = String(g && g.name ? g.name : '');
        const img = String(g && g.background_image ? g.background_image : '');
        const eager = idx < eagerCount; // first items load eagerly

        // The <game-card> component takes care of rendering consistent markup
        const v = this._cardVariant ? ` variant=\"${this.escape(this._cardVariant)}\"` : '';
        items += `
          <li>
            <game-card name="${this.escape(name)}" img="${this.escape(img)}" ${eager ? 'eager' : ''}${v}></game-card>
          </li>`;
      }

      // Inject the full carousel markup now that we have items
      this.innerHTML = `
        <section class="game-carousel">
          <div class="game-carousel__head">
            <h3 class="game-carousel__title subtitle-s1">${this._title}</h3>
            <a class="game-carousel__more body-b1" href="#">Ver m&aacute;s</a>
          </div>
          <div class="game-carousel__viewport">
            <button class="game-carousel__nav game-carousel__nav--prev" aria-label="Anterior">&lt;</button>
            <ul class="game-carousel__track">${items}</ul>
            <button class="game-carousel__nav game-carousel__nav--next" aria-label="Siguiente">&gt;</button>
          </div>
        </section>`;

      // Grab the pieces we need to control the carousel
      const track = this.querySelector('.game-carousel__track'); // the scrollable list
      const prev = this.querySelector('.game-carousel__nav--prev'); // left button
      const next = this.querySelector('.game-carousel__nav--next'); // right button

      // Ensure the arrow characters are simple ASCII to avoid encoding issues
      try { prev.textContent = '<'; next.textContent = '>'; } catch(e){}

      // Compute how far to scroll when clicking the buttons.
      // We choose the larger of (3 cards) or (viewport minus paddles).
      // Card widths can vary by variant, so we measure the first card.
      const navW = () => {
        try { return Math.max(0, (prev && prev.getBoundingClientRect().width) || 60); } catch(e) { return 60; }
      };
      const measure = () => {
        const firstCard = track.querySelector('.game-card');
        const cw = firstCard ? firstCard.getBoundingClientRect().width : 240;
        const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || '12');
        return { cw, gap };
      };
      const step = () => {
        const { cw, gap } = measure();
        // For big cards, always move exactly 3 cards to avoid cutting one in half
        if ((this._cardVariant || '').toLowerCase() === 'big') {
          return cw * 3 + gap * 2;
        }
        // Otherwise, choose the larger of 3 cards or (viewport minus paddles)
        return Math.max(cw * 3 + gap * 2, this.clientWidth - (navW() * 2 + 20));
      };

      // Enable or disable the nav buttons depending on scroll position
      const update = () => {
        const max = track.scrollWidth - track.clientWidth - 1;
        prev.toggleAttribute('disabled', track.scrollLeft <= 0);
        next.toggleAttribute('disabled', track.scrollLeft >= max);
      };

      // Smooth programmatic scrolling (eased) for a softer feel
      const isBig = (this._cardVariant || '').toLowerCase() === 'big';
      const duration = () => isBig ? 600 : 450; // ms
      let animating = false;
      const animateTo = (target, ms) => {
        const start = track.scrollLeft;
        const max = track.scrollWidth - track.clientWidth;
        const end = Math.max(0, Math.min(max, target));
        const dist = end - start;
        if (Math.abs(dist) < 1) { track.scrollLeft = end; update(); return; }
        animating = true;
        const t0 = performance.now();
        const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
        const tick = (now) => {
          const t = Math.min(1, (now - t0) / ms);
          const eased = easeOutCubic(t);
          track.scrollLeft = start + dist * eased;
          if (t < 1) {
            requestAnimationFrame(tick);
          } else {
            animating = false; update();
          }
        };
        requestAnimationFrame(tick);
      };

      const animateBy = (dx) => { if (animating) return; animateTo(track.scrollLeft + dx, duration()); };

      // Scroll the track when clicking the buttons
      prev.addEventListener('click', () => { animateBy(-step()); });
      next.addEventListener('click', () => { animateBy(step());  });

      // Throttle updates to once per animation frame while the user scrolls
      let ticking = false;
      const onScroll = () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(() => { update(); ticking = false; });
        }
      };
      track.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', update);
      update(); // initial state
    }

    // Escape text that will be placed inside HTML to avoid broken markup
    escape(str){
      return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[s]));
    }

    // Very small sanitizer for inline CSS url('...') usage
    cssUrl(u){
      return String(u).replace(/'/g, '%27');
    }
  }

  // Register the custom element so <game-carousel> works in HTML
  customElements.define('game-carousel', GameCarousel);
})();

