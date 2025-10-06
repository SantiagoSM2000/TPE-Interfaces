// Minimal interactivity for the donation page and shared layout bootstrap.

const initDonationWidget = () => {
  const widget = document.querySelector('.donation-widget');
  if (!widget) return;

  const buttons = Array.from(widget.querySelectorAll('.amount-button'));
  const customWrap = widget.querySelector('.custom-amount');
  const customInput = widget.querySelector('#monto');

  const selectButton = (btn) => {
    buttons.forEach((b) => b.classList.remove('is-selected'));
    btn.classList.add('is-selected');

    if (btn.dataset.other === 'true') {
      customWrap.hidden = false;
      setTimeout(() => customInput && customInput.focus(), 0);
    } else {
      customWrap.hidden = true;
    }
  };

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => selectButton(btn));
  });
};

const injectFragment = (placeholder, url) => {
  return fetch(url, { cache: 'no-store' })
    .then((response) => response.text())
    .then((html) => {
      const tpl = document.createElement('template');
      tpl.innerHTML = html.trim();
      placeholder.replaceChildren(tpl.content.cloneNode(true));
    });
};

const initLayoutFragments = () => {
  const headerPlaceholder = document.getElementById('header-placeholder');
  if (headerPlaceholder) {
    injectFragment(headerPlaceholder, 'components/header.html')
      .catch((err) => console.error('Error loading header:', err));
  }

  let footerPlaceholder = document.getElementById('footer-placeholder');
  if (!footerPlaceholder) {
    const existingFooter = document.querySelector('footer.site-footer');
    if (existingFooter) {
      existingFooter.innerHTML = '';
      existingFooter.id = 'footer-placeholder';
      footerPlaceholder = existingFooter;
    }
  }

  if (footerPlaceholder) {
    try { footerPlaceholder.innerHTML = ''; } catch (e) { /* noop */ }
    injectFragment(footerPlaceholder, 'components/fat-footer.tpl')
      .catch((err) => console.error('Error loading footer:', err));
  }
};

const updateCardsByScreensize = () => {
  const mediaQuery = window.matchMedia("(min-width: 768px)");
  function updateGamecards(e) {
    const isWide = e.matches;
    document.querySelectorAll('game-card').forEach(card => {
      const variant = card.getAttribute('variant');
      if (isWide && variant === 'square') {
        card.setAttribute('variant', 'default');
      } else if (!isWide && variant === 'default') {
        card.setAttribute('variant', 'square');
      }
    });
  }
  const observer = new MutationObserver(() => {
    if (document.querySelector('game-card')) {
      updateGamecards(mediaQuery);
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
  updateGamecards(mediaQuery);
  mediaQuery.addEventListener('change', updateGamecards);
}

document.addEventListener('DOMContentLoaded', () => {
  initDonationWidget();
  initLayoutFragments();
  updateCardsByScreensize();
});