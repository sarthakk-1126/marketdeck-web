import { startExperience } from './experience.js?v=ripples-20261002';
const experience = startExperience();
(() => {
  // Old product-panel bookmarks now open the matching product directly.
  const openLegacyProduct = () => {
    const id = location.hash.match(/^#product-(stockproof|charting|fno|commentary|crypto)$/)?.[1];
    if (id) location.replace(document.getElementById(`tab-${id}`).href);
  };
  window.addEventListener('hashchange', openLegacyProduct);
  openLegacyProduct();

  const mobileMenu = document.querySelector('.mobile-menu');
  mobileMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => { mobileMenu.open = false; }));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && mobileMenu.open) { mobileMenu.open = false; mobileMenu.querySelector('summary').focus(); }
  });
  document.addEventListener('click', event => { if (mobileMenu.open && !mobileMenu.contains(event.target)) mobileMenu.open = false; });

})();
