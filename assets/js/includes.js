(() => {
  const includeEls = document.querySelectorAll('[data-include]');
  if (!includeEls.length) {
    window.__includesDone = true;
    return;
  }

  window.__includesDone = false;

  const requests = Array.from(includeEls).map(async (el) => {
    const src = el.getAttribute('data-include');
    if (!src) {
      return;
    }
    try {
      const res = await fetch(src, { cache: 'no-cache' });
      if (!res.ok) {
        throw new Error('Include failed');
      }
      const html = await res.text();
      el.innerHTML = html;
    } catch (err) {
      el.innerHTML = '<div class="container"><p class="notice">Не удалось загрузить фрагмент страницы.</p></div>';
    }
  });

  Promise.all(requests).then(() => {
    window.__includesDone = true;
    if (typeof window.initSite === 'function') {
      window.initSite();
    }
    document.dispatchEvent(new CustomEvent('includes:done'));
  });
})();
