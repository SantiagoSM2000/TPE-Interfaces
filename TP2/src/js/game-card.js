// <game-card> web component
(function(){
  class GameCard extends HTMLElement {
    static get observedAttributes(){ return ['name','img','href','eager','skeleton','variant']; }

    connectedCallback(){ this.render(); }
    attributeChangedCallback(){ this.render(); }

    _escape(str){ return String(str||'').replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[s])); }
    _cssUrl(u){ return String(u||'').replace(/'/g, '%27'); }

    render(){
      const skeleton = this.hasAttribute('skeleton');
      const variant = this.getAttribute('variant') || '';
      if(skeleton){
        this.innerHTML = `<div class="game-card is-skeleton${variant ? ' game-card--'+this._escape(variant) : ''}">
          <a class="game-card__link" href="#" draggable="false" tabindex="-1" aria-hidden="true">
            <div class="game-card__thumb"><div class="game-card__overlay"><span class="game-card__title">&nbsp;</span></div></div>
          </a>
        </div>`;
        return;
      }

      const name = this.getAttribute('name') || '';
      const href = this.getAttribute('href') || '#';
      const img = this.getAttribute('img') || '';
      const eager = this.hasAttribute('eager');
      const noTitle = variant==='mini';
      const reveal = variant==='big';
      let [w,h] = variant==='mini' ? [132,70] : variant==='big' ? [405,220] : [240,100];

      this.innerHTML = `
        <div class="game-card${variant ? ' game-card--'+this._escape(variant) : ''}" title="${this._escape(name)}">
          <a class="game-card__link" href="${this._escape(href)}" draggable="false">
            <div class="game-card__thumb">
              <div class="game-card__backdrop" style="background-image:url('${this._cssUrl(img)}')"></div>
              <img src="${this._escape(img)}" alt="${this._escape(name)}" width="${w}" height="${h}" ${eager ? 'loading="eager" fetchpriority="high"' : 'loading="lazy" fetchpriority="low"'} decoding="async" />
              ${noTitle ? '' : `<div class="game-card__overlay${reveal ? ' game-card__overlay--reveal' : ''}"><span class="game-card__title">${this._escape(name)}</span></div>`}
            </div>
          </a>
        </div>`;
    }
  }

  customElements.define('game-card', GameCard);
})();
