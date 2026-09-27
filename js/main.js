/* pickpack - boot. */
'use strict';

(function boot() {
  try {
    UI.init();
    Battle.init();
    Game.init();
  } catch (e) {
    console.error(e);
    const p = document.getElementById('startPrompt');
    if (p) p.textContent = typeof tr === 'function' ? tr('boot.error') : 'Something went wrong while loading. Please refresh the page.';
  }
})();
