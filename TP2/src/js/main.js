document.addEventListener('DOMContentLoaded', () => {
  // Donation widget
  const widget = document.querySelector('.donation-widget');
  if(widget){
    const buttons = [...widget.querySelectorAll('.amount-button')];
    const customWrap = widget.querySelector('.custom-amount');
    const customInput = widget.querySelector('#monto');

    const selectButton = btn => {
      buttons.forEach(b => b.classList.remove('is-selected'));
      btn.classList.add('is-selected');
      customWrap.hidden = btn.dataset.other !== 'true';
      if(!customWrap.hidden) setTimeout(()=>customInput?.focus(),0);
    };
    buttons.forEach(btn => btn.addEventListener('click', ()=>selectButton(btn)));
  }

  // Header
  const header = document.getElementById('header-placeholder');
  if(header){
    const path = window.location.pathname;
    const simpleHeader = /\/(login|register)\.html$/i.test(path);
    header.classList.toggle('header-simple', simpleHeader);
    const headerTemplate = simpleHeader ? 'components/header-simple.html' : 'components/header.html';
    fetch(headerTemplate)
      .then(r=>r.text())
      .then(html=>header.innerHTML=html)
      .catch(console.error);
  }

  // Footer
  let footer = document.getElementById('footer-placeholder') || document.querySelector('footer.site-footer');
  if(footer){
    footer.id = 'footer-placeholder';
    fetch('components/fat-footer.tpl',{cache:'no-store'})
      .then(r=>r.text())
      .then(html=>{
        const tpl = document.createElement('template');
        tpl.innerHTML = html.trim();
        footer.replaceChildren(tpl.content.cloneNode(true));
      }).catch(console.error);
  }
});
