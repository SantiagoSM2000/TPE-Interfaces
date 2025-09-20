// Minimal interactivity for the donation page
// Handles amount selection and toggles custom amount input.

document.addEventListener('DOMContentLoaded', () => {
  const widget = document.querySelector('.donation-widget');
  if (!widget) return; // Only run on donation page

  const buttons = Array.from(widget.querySelectorAll('.amount-button'));
  const customWrap = widget.querySelector('.custom-amount');
  const customInput = widget.querySelector('#monto');

  const selectButton = (btn) => {
    buttons.forEach(b => b.classList.remove('is-selected'));
    btn.classList.add('is-selected');
    if (btn.dataset.other === 'true') {
      customWrap.hidden = false;
      setTimeout(() => customInput && customInput.focus(), 0);
    } else {
      customWrap.hidden = true;
    }
  };

  buttons.forEach(btn => {
    btn.addEventListener('click', () => selectButton(btn));
  });
});

// Header component
document.addEventListener('DOMContentLoaded', () => {
  const headerPlaceholder = document.getElementById('header-placeholder');
  if (headerPlaceholder) {
    fetch('components/header.html')
      .then(response => response.text())
      .then(html => {
        headerPlaceholder.innerHTML = html;
      })
      .catch(err => console.error('Error loading header:', err));
}
});
