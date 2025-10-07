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
    const path = window.location.pathname;
    const simpleHeader = /\/(login|register)\.html$/i.test(path);
    headerPlaceholder.classList.toggle('header-simple', simpleHeader);
    const headerTemplate = 'components/header.html';
    injectFragment(headerPlaceholder, headerTemplate)
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
    injectFragment(footerPlaceholder, 'components/fat-footer.tpl')
      .then(() => {
        const footerCategories = document.querySelectorAll(".footer-category");
        footerCategories.forEach(category => {
          category.addEventListener('click', toggleFooterCategory);
        });
      })
      .catch((err) => console.error('Error loading footer:', err));
  }

  function toggleFooterCategory(e) {
    const category = e.currentTarget;
    const isOpen = category.getAttribute('data-open') === "true";
    category.setAttribute('data-open', (!isOpen).toString());
  }
};

const updateCarouselsByScreenSize = () => {
  const mediaQuery = window.matchMedia("(min-width: 768px)");
  function updateCarousels(e) {
    const isWide = e.matches;
    document.querySelectorAll('game-carousel').forEach(c => {
      const variant = c.getAttribute('card-variant');
      if (isWide && variant === 'square') {
        c.setAttribute('card-variant', 'default');
      } else if (!isWide && variant === 'default') {
        c.setAttribute('card-variant', 'square');
      }
      c.fetchAndRender();
    });
  }
  updateCarousels(mediaQuery);
  mediaQuery.addEventListener('change', updateCarousels);
}

document.addEventListener('DOMContentLoaded', () => {
  initDonationWidget();
  initLayoutFragments();
  updateCarouselsByScreenSize();
});