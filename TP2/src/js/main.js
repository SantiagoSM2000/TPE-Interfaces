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
  if(header) fetch('components/header.html').then(r=>r.text()).then(html=>header.innerHTML=html).catch(console.error);

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
        const footerCategories = document.querySelectorAll(".footer-category");
        footerCategories.forEach((category) => category.addEventListener('click', toggleFooterCategory));
      }).catch(console.error); 
    const footerCategories = document.querySelectorAll(".footer-category");
    footerCategories.forEach((category) => category.addEventListener('click', toggleFooterCategory));
    function toggleFooterCategory(e) {
      const category = e.currentTarget;
      const isOpen = category.getAttribute('data-open') === "true";
      const newValue = !isOpen;
      category.setAttribute('data-open', newValue);
    }
  }
});
