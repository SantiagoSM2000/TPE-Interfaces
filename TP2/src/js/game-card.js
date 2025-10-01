// Componente web de tarjeta de juego
(function(){
  class GameCard extends HTMLElement {
    connectedCallback(){
      this.render();
    }

    render(){
      const skeleton = this.hasAttribute('skeleton');
      const variant = this.getAttribute('variant') || '';
      
      // Renderizar skeleton durante la carga
      if (skeleton) {
        this.innerHTML = `<div class="game-card is-skeleton${variant ? ' game-card--' + variant : ''}">
          <a class="game-card__link" href="#" draggable="false">
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
      const noTitle = variant === 'mini';
      const reveal = variant === 'big';
      
      // Dimensiones según variante
      let [w, h] = variant === 'mini' ? [132, 70] : variant === 'big' ? [405, 220] : [240, 100];

      this.innerHTML = `
        <div class="game-card${variant ? ' game-card--' + variant : ''}" title="${name}">
          <a class="game-card__link" href="${href}" draggable="false">
            <div class="game-card__thumb">
              <div class="game-card__backdrop" style="background-image:url('${img}')"></div>
              <img src="${img}" alt="${name}" width="${w}" height="${h}" ${eager ? 'loading="eager"' : 'loading="lazy"'} />
              ${noTitle ? '' : `<div class="game-card__overlay${reveal ? ' game-card__overlay--reveal' : ''}"><span class="game-card__title">${name}</span></div>`}
            </div>
          </a>
        </div>`;
    }
  }

  customElements.define('game-card', GameCard);
})();