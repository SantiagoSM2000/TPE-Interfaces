// <game-card> web component
// A small, focused component that renders a single game card.
// It mirrors the existing markup/classes so current CSS keeps working.
//
// Attributes
// - name:   Visible title in the card footer
// - img:    Image URL (also used for the blurred backdrop)
// - href:   Link target (defaults to '#')
// - eager:  If present, image loads eagerly (otherwise lazy)
// - skeleton: If present, render a loading skeleton
// - variant: Optional modifier (adds class `game-card--{variant}`)
(function(){
  class GameCard extends HTMLElement {
    static get observedAttributes(){
      return ['name','img','href','eager','skeleton','variant'];
    }
    constructor(){
      super();
    }
    connectedCallback(){ this.render(); }
    attributeChangedCallback(){ this.render(); }

    // Utils kept local to avoid depending on other components
    _escape(str){
      return String(str||'').replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[s]));
    }
    _cssUrl(u){ return String(u||'').replace(/'/g, '%27'); }

    render(){
      const isSkeleton = this.hasAttribute('skeleton');
      const variant = this.getAttribute('variant') || '';

      if (isSkeleton){
        // Keep skeleton markup identical to existing CSS expectations
        this.innerHTML = `
          <div class="game-card is-skeleton${variant ? ' game-card--'+this._escape(variant) : ''}">
            <a class="game-card__link" href="#" draggable="false" tabindex="-1" aria-hidden="true">
              <div class="game-card__thumb">
                <div class="game-card__overlay"><span class="game-card__title">&nbsp;</span></div>
              </div>
            </a>
          </div>`;
        return;
      }

      const name = this.getAttribute('name') || '';
      const href = this.getAttribute('href') || '#';
      const img = this.getAttribute('img') || '';
      const eager = this.hasAttribute('eager');
      const noTitle = (variant === 'mini' || variant === 'square');
      const revealOnHover = variant === 'big';
      // Choose width/height hints based on variant (CSS still rules final size)
      let w = 240, h = 100;
      if (variant === 'mini') { w = 132; h = 70; }
      else if (variant === 'square') { w = 60; h = 60; }
      else if (variant === 'big') { w = 405; h = 220; }

      // Build the same structure the CSS already styles
      this.innerHTML = `
        <div class="game-card${variant ? ' game-card--'+this._escape(variant) : ''}" title="${this._escape(name)}">
          <a class="game-card__link" href="${this._escape(href)}" draggable="false">
            <div class="game-card__thumb">
              <div class="game-card__backdrop" style="background-image:url('${this._cssUrl(img)}')"></div>
              <img src="${this._escape(img)}" alt="${this._escape(name)}" width="${w}" height="${h}" ${eager ? 'loading="eager" fetchpriority="high"' : 'loading="lazy" fetchpriority="low"'} decoding="async" />
              ${noTitle ? '' : `<div class="game-card__overlay${revealOnHover ? ' game-card__overlay--reveal' : ''}"><span class="game-card__title">${this._escape(name)}</span></div>`}
            </div>
          </a>
        </div>`;
    }
  }

  customElements.define('game-card', GameCard);
})();