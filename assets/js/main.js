(() => {
  const SUPPORTED_LANGS = ['ru', 'be', 'en'];
  const DEFAULT_LANG = 'ru';
  const LOCALE_MAP = {
    ru: 'ru-RU',
    be: 'be-BY',
    en: 'en-US'
  };
  const translations = {};
  const monthFormatters = {};
  let currentLang = DEFAULT_LANG;

  const sectionNames = [
    'news',
    'announcements',
    'about',
    'docs',
    'education',
    'students',
    'parents',
    'teachers',
    'gallery',
    'contacts',
    'appeals'
  ];

  function isHomePath(pathname) {
    if (!pathname || pathname === '/' || pathname === '') {
      return true;
    }
    if (!pathname.endsWith('/index.html')) {
      return false;
    }
    return !sectionNames.some((name) => pathname.includes(`/${name}/`));
  }

  function isI18nAllowedPage() {
    const path = window.location.pathname || '';
    return isHomePath(path);
  }

  function hideLangSwitcher() {
    const switcher = document.querySelector('.lang-switcher');
    if (switcher) {
      switcher.remove();
    }
  }

  function getStoredLang() {
    const saved = localStorage.getItem('siteLang');
    return SUPPORTED_LANGS.includes(saved) ? saved : DEFAULT_LANG;
  }

  function getLanguage() {
    return currentLang;
  }

  function getLocale() {
    return LOCALE_MAP[currentLang] || LOCALE_MAP[DEFAULT_LANG];
  }

  function getMonthFormatter() {
    const locale = getLocale();
    if (!monthFormatters[locale]) {
      monthFormatters[locale] = new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    }
    return monthFormatters[locale];
  }

  function t(key, fallback = '') {
    if (!key) {
      return fallback;
    }
    return translations[currentLang]?.[key] ?? fallback ?? key;
  }

  function interpolate(text, vars = {}) {
    return String(text).replace(/\{(\w+)\}/g, (match, key) => {
      return Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : match;
    });
  }

  async function loadTranslations(lang) {
    if (translations[lang]) {
      return translations[lang];
    }
    const base = getBase();
    try {
      const data = await fetchJSON(`${base}data/i18n/${lang}.json`);
      translations[lang] = data || {};
    } catch (err) {
      translations[lang] = {};
    }
    return translations[lang];
  }

  function applyTranslations() {
    document.documentElement.lang = currentLang;
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.dataset.i18n;
      const fallback = el.textContent;
      const value = t(key, fallback);
      if (value !== undefined) {
        el.textContent = value;
      }
    });
    document.querySelectorAll('[data-i18n-html]').forEach((el) => {
      const key = el.dataset.i18nHtml;
      const fallback = el.innerHTML;
      const value = t(key, fallback);
      if (value !== undefined) {
        el.innerHTML = value;
      }
    });
    document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
      const raw = el.dataset.i18nAttr || '';
      raw.split(';').forEach((pair) => {
        const [attr, key] = pair.split(':').map((part) => part.trim());
        if (!attr || !key) {
          return;
        }
        const fallback = el.getAttribute(attr) || '';
        const value = t(key, fallback);
        if (value !== undefined) {
          el.setAttribute(attr, value);
        }
      });
    });
  }

  function updateLangButtons() {
    const buttons = document.querySelectorAll('.lang-switcher [data-lang]');
    buttons.forEach((button) => {
      const isActive = button.dataset.lang === currentLang;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });
  }

  function setupLangSwitcher() {
    const switcher = document.querySelector('.lang-switcher');
    if (!switcher) {
      return;
    }
    switcher.querySelectorAll('[data-lang]').forEach((button) => {
      button.addEventListener('click', () => {
        const lang = button.dataset.lang;
        if (!SUPPORTED_LANGS.includes(lang)) {
          return;
        }
        if (lang === currentLang) {
          return;
        }
        localStorage.setItem('siteLang', lang);
        window.location.reload();
      });
    });
    updateLangButtons();
  }

  async function initI18n() {
    if (!isI18nAllowedPage()) {
      currentLang = DEFAULT_LANG;
      hideLangSwitcher();
      return;
    }
    currentLang = getStoredLang();
    await loadTranslations(currentLang);
    applyTranslations();
    setupLangSwitcher();
  }

  function getBase() {
    return document.body?.dataset.base || './';
  }

  function prefixBase(base, value) {
    if (!value) {
      return value;
    }
    if (
      value.startsWith('#') ||
      value.startsWith('http') ||
      value.startsWith('mailto:') ||
      value.startsWith('tel:') ||
      value.startsWith('./') ||
      value.startsWith('../')
    ) {
      return value;
    }
    return `${base}${value}`;
  }

  function applyBasePaths() {
    const base = getBase();
    document.querySelectorAll('[data-href]').forEach((el) => {
      const value = el.getAttribute('data-href');
      if (!value) {
        return;
      }
      el.setAttribute('href', prefixBase(base, value));
    });
    document.querySelectorAll('[data-src]').forEach((el) => {
      const value = el.getAttribute('data-src');
      if (!value) {
        return;
      }
      el.setAttribute('src', prefixBase(base, value));
    });
  }

  function highlightActiveNav() {
    const path = window.location.pathname;
    const isHome = path.endsWith('/index.html') && !sectionNames.some((name) => path.includes(`/${name}/`));

    document.querySelectorAll('.nav__link[data-section]').forEach((link) => {
      const section = link.dataset.section;
      let isActive = false;
      if (section === 'home') {
        isActive = isHome;
      } else {
        isActive = path.includes(`/${section}/`);
      }
      if (isActive) {
        link.classList.add('is-active');
      }
    });
  }

  function setYear() {
    const yearEl = document.querySelector('[data-year]');
    if (yearEl) {
      yearEl.textContent = new Date().getFullYear();
    }
  }

  function setupMenu() {
    const header = document.querySelector('[data-header]');
    const toggle = document.querySelector('[data-menu-toggle]');
    if (!header || !toggle) {
      return;
    }
    toggle.addEventListener('click', () => {
      const isOpen = header.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });
    header.querySelectorAll('.nav__link').forEach((link) => {
      link.addEventListener('click', () => {
        header.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  function setupA11yToggle() {
    const toggle = document.getElementById('a11yToggle');
    if (!toggle) {
      return;
    }
    const getLabel = (isOn) => (
      isOn ? t('header.a11yOn', 'Обычный размер') : t('header.a11yOff', 'Версия для слабовидящих')
    );
    const stored = localStorage.getItem('a11yLarge') === 'true';
    if (stored) {
      document.documentElement.classList.add('a11y-large');
    }
    toggle.setAttribute('aria-pressed', String(stored));
    toggle.textContent = getLabel(stored);

    toggle.addEventListener('click', () => {
      const isOn = document.documentElement.classList.toggle('a11y-large');
      localStorage.setItem('a11yLarge', String(isOn));
      toggle.setAttribute('aria-pressed', String(isOn));
      toggle.textContent = getLabel(isOn);
    });
  }

  function setupStickyHeader() {
    const header = document.querySelector('[data-header]');
    if (!header) {
      return;
    }
    const onScroll = () => {
      header.classList.toggle('is-sticky', window.scrollY > 10);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function setupBackToTop() {
    const button = document.getElementById('backToTop');
    if (!button) {
      return;
    }
    const onScroll = () => {
      button.classList.toggle('is-visible', window.scrollY > 500);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    button.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    onScroll();
  }

  function setupBackNav() {
    const button = document.querySelector('[data-back-button]');
    if (!button) {
      return;
    }
    button.addEventListener('click', () => {
      if (window.history.length > 1) {
        window.history.back();
        return;
      }
      const base = getBase();
      window.location.href = `${base}index.html`;
    });
  }

  function setupTeacherEasterEgg() {
    const trigger = document.querySelector('[data-heart-trigger]');
    if (!trigger) {
      return;
    }

    const colors = ['#ff6b8b', '#ff8fab', '#f06595', '#ff9aa2', '#ffb3c1', '#ffd1dc'];
    const createContainer = () => {
      let container = document.querySelector('.heart-burst');
      if (!container) {
        container = document.createElement('div');
        container.className = 'heart-burst';
        document.body.appendChild(container);
      }
      return container;
    };

    const launchHearts = (x, y) => {
      const container = createContainer();
      const count = 36 + Math.floor(Math.random() * 18);
      for (let i = 0; i < count; i += 1) {
        const heart = document.createElement('span');
        heart.className = 'heart-particle';
        const size = 10 + Math.random() * 12;
        const dx = (Math.random() - 0.5) * 220;
        const dy = 120 + Math.random() * 160;
        const rot = (Math.random() - 0.5) * 90;
        const duration = 2 + Math.random() * 1.4;
        const delay = Math.random() * 0.2;
        const color = colors[Math.floor(Math.random() * colors.length)];

        heart.style.left = `${x}px`;
        heart.style.top = `${y}px`;
        heart.style.setProperty('--size', `${size}px`);
        heart.style.setProperty('--dx', `${dx}px`);
        heart.style.setProperty('--dy', `${dy}px`);
        heart.style.setProperty('--rot', `${rot}deg`);
        heart.style.setProperty('--duration', `${duration}s`);
        heart.style.setProperty('--delay', `${delay}s`);
        heart.style.setProperty('--color', color);

        heart.addEventListener('animationend', () => {
          heart.remove();
        });

        container.appendChild(heart);
      }
    };

    const burstFromEvent = (event) => {
      const rect = trigger.getBoundingClientRect();
      const x = typeof event?.clientX === 'number' ? event.clientX : rect.left + rect.width / 2;
      const y = typeof event?.clientY === 'number' ? event.clientY : rect.top + rect.height / 2;
      launchHearts(x, y);
    };

    trigger.addEventListener('click', burstFromEvent);
    trigger.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        burstFromEvent(event);
      }
    });
  }

  function setupForms() {
    document.querySelectorAll('form[data-validate]').forEach((form) => {
      const status = form.querySelector('[data-form-status]');
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        let isValid = true;
        form.querySelectorAll('[required]').forEach((field) => {
          const value = field.type === 'checkbox' ? field.checked : field.value.trim();
          if (!value) {
            field.classList.add('is-invalid');
            field.setAttribute('aria-invalid', 'true');
            isValid = false;
          } else {
            field.classList.remove('is-invalid');
            field.removeAttribute('aria-invalid');
          }
        });
        if (status) {
          status.textContent = isValid
            ? t('form.ok', 'Форма заполнена корректно. Отправка отключена (TODO).')
            : t('form.error', 'Проверьте обязательные поля и попробуйте снова.');
        }
      });
      form.querySelectorAll('[required]').forEach((field) => {
        const eventName = field.type === 'checkbox' ? 'change' : 'input';
        field.addEventListener(eventName, () => {
          const value = field.type === 'checkbox' ? field.checked : field.value.trim();
          if (value) {
            field.classList.remove('is-invalid');
            field.removeAttribute('aria-invalid');
          }
        });
      });
    });
  }

  async function fetchJSON(path) {
    const res = await fetch(path, { cache: 'no-cache' });
    if (!res.ok) {
      throw new Error(`Failed to load ${path}`);
    }
    const buffer = await res.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let text = '';
    if (bytes[0] === 0xff && bytes[1] === 0xfe) {
      text = new TextDecoder('utf-16le').decode(buffer);
    } else if (bytes[0] === 0xfe && bytes[1] === 0xff) {
      text = new TextDecoder('utf-16be').decode(buffer);
    } else {
      text = new TextDecoder('utf-8').decode(buffer);
    }
    const cleaned = text.replace(/^\uFEFF/, '');
    return JSON.parse(cleaned);
  }

  function formatDate(isoDate) {
    if (!isoDate) {
      return '';
    }
    return getMonthFormatter().format(new Date(isoDate));
  }

  function pickText(item, field) {
    if (!item || !field) {
      return '';
    }
    if (currentLang === 'be' && item[`${field}Be`]) {
      return item[`${field}Be`];
    }
    if (currentLang === 'en' && item[`${field}En`]) {
      return item[`${field}En`];
    }
    return item[field] || '';
  }

  function pickArray(item, field) {
    if (!item || !field) {
      return [];
    }
    if (currentLang === 'be' && Array.isArray(item[`${field}Be`])) {
      return item[`${field}Be`];
    }
    if (currentLang === 'en' && Array.isArray(item[`${field}En`])) {
      return item[`${field}En`];
    }
    return Array.isArray(item[field]) ? item[field] : [];
  }

  function formatMeta(item) {
    const parts = [];
    const dateText = formatDate(item.date);
    if (dateText) {
      parts.push(dateText);
    }
    const author = pickText(item, 'author');
    if (author) {
      parts.push(`${t('meta.author', 'Автор')}: ${author}`);
    }
    return parts.join(' • ');
  }

  function formatFound(count) {
    const template = t('list.found', 'Найдено: {count}');
    return interpolate(template, { count });
  }

  function extractFirstImageSrc(html) {
    if (!html) {
      return '';
    }
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    const img = wrapper.querySelector('img');
    return img ? img.getAttribute('src') || '' : '';
  }

  function resolveNewsImage(item, base) {
    const raw =
      item?.cover ||
      item?.image ||
      item?.preview ||
      extractFirstImageSrc(item?.contentHtml);
    if (!raw) {
      return '';
    }
    const src = String(raw).trim();
    if (!src) {
      return '';
    }
    if (
      src.startsWith('http') ||
      src.startsWith('data:') ||
      src.startsWith('blob:') ||
      src.startsWith('#')
    ) {
      return src;
    }
    if (src.startsWith('./') || src.startsWith('../')) {
      return prefixBase(base, src);
    }
    if (!src.includes('/')) {
      return prefixBase(base, `news/${src}`);
    }
    return prefixBase(base, src);
  }

  function renderPagination(container, currentPage, totalPages, onPageChange) {
    if (!container) {
      return;
    }
    if (totalPages <= 1) {
      container.innerHTML = '';
      return;
    }
    const buttons = [];
    buttons.push({ label: t('pagination.prev', 'Назад'), page: Math.max(1, currentPage - 1), disabled: currentPage === 1 });
    for (let i = 1; i <= totalPages; i += 1) {
      buttons.push({ label: String(i), page: i, active: i === currentPage });
    }
    buttons.push({ label: t('pagination.next', 'Вперед'), page: Math.min(totalPages, currentPage + 1), disabled: currentPage === totalPages });

    container.innerHTML = buttons
      .map((btn) => {
        const classes = [];
        if (btn.active) {
          classes.push('is-active');
        }
        return `<button type="button" data-page="${btn.page}" ${btn.disabled ? 'disabled' : ''} class="${classes.join(' ')}">${btn.label}</button>`;
      })
      .join('');

    container.querySelectorAll('button[data-page]').forEach((button) => {
      button.addEventListener('click', () => {
        const page = Number(button.dataset.page);
        if (!Number.isNaN(page)) {
          onPageChange(page);
        }
      });
    });
  }

  function setupList({
    items,
    listEl,
    paginationEl,
    searchInput,
    filterValue,
    renderItem,
    emptyText,
    pageSize,
    infoEl,
    searchFn
  }) {
    let currentPage = 1;
    let currentQuery = '';
    let currentFilter = filterValue || 'all';

    const update = () => {
      const filtered = items.filter((item) => {
        const haystack = searchFn ? searchFn(item) : pickText(item, 'title');
        const matchesQuery = haystack.toLowerCase().includes(currentQuery);
        const tags = pickArray(item, 'tags');
        const category = pickText(item, 'category');
        const matchesFilter = currentFilter === 'all'
          || (Array.isArray(tags) ? tags.includes(currentFilter) : category === currentFilter);
        return matchesQuery && matchesFilter;
      });

      const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
      currentPage = Math.min(currentPage, totalPages);
      const start = (currentPage - 1) * pageSize;
      const pageItems = filtered.slice(start, start + pageSize);

      if (infoEl) {
        infoEl.textContent = formatFound(filtered.length);
      }

      const emptyMarkup = listEl.tagName === 'TBODY'
        ? `<tr><td colspan="4"><div class="notice">${emptyText}</div></td></tr>`
        : `<div class="notice">${emptyText}</div>`;

      listEl.innerHTML = pageItems.length
        ? pageItems.map(renderItem).join('')
        : emptyMarkup;

      renderPagination(paginationEl, currentPage, totalPages, (page) => {
        currentPage = page;
        update();
      });
    };

    if (searchInput) {
      searchInput.addEventListener('input', (event) => {
        currentQuery = event.target.value.trim().toLowerCase();
        currentPage = 1;
        update();
      });
    }

    return {
      update,
      setFilter: (value) => {
        currentFilter = value || 'all';
        currentPage = 1;
        update();
      }
    };
  }

  function initIndexPage() {
    const newsPreview = document.getElementById('newsPreview');
    const announcementsPreview = document.getElementById('announcementsPreview');
    const linksPreview = document.getElementById('importantLinks');
    if (!newsPreview && !announcementsPreview && !linksPreview) {
      return;
    }

    const base = getBase();
    Promise.all([
      fetchJSON(`${base}data/news.json`).catch(() => []),
      fetchJSON(`${base}data/announcements.json`).catch(() => []),
      fetchJSON(`${base}data/links.json`).catch(() => [])
    ]).then(([news, announcements, links]) => {
      if (newsPreview) {
        const items = news
          .slice()
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 6);
        newsPreview.innerHTML = items
          .map((item) => {
            const title = pickText(item, 'title');
            const summary = pickText(item, 'summary');
            const tags = pickArray(item, 'tags');
            const imageSrc = resolveNewsImage(item, base);
            const imageMarkup = imageSrc
              ? `<div class="card__media"><img src="${imageSrc}" alt="${title}" loading="lazy" width="640" height="360" /></div>`
              : '';
            return `
              <article class="card">
                ${imageMarkup}
                <p class="card__meta">${formatMeta(item)}</p>
                <h3 class="card__title">${title}</h3>
                <p class="card__text">${summary}</p>
                <div class="card__tags">${tags.map((tag) => `<span class="badge">${tag}</span>`).join('')}</div>
                <a class="btn btn--ghost" href="${base}news/post.html?id=${item.id}">${t('news.more', 'Подробнее')}</a>
              </article>
            `;
          })
          .join('');
      }

      if (announcementsPreview) {
        const items = announcements
          .slice()
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 6);
        announcementsPreview.innerHTML = items
          .map(
            (item) => {
              const title = pickText(item, 'title');
              const summary = pickText(item, 'summary');
              return `
                <article class="card">
                  <p class="card__meta">${formatDate(item.date)}</p>
                  <h3 class="card__title">${title}</h3>
                  <p class="card__text">${summary}</p>
                  <a class="btn btn--ghost" href="${base}announcements/post.html?id=${item.id}">${t('ann.more', 'Подробнее')}</a>
                </article>
              `;
            }
          )
          .join('');
      }

      if (linksPreview) {
        linksPreview.innerHTML = links
          .map(
            (link) => {
              const title = pickText(link, 'title');
              const description = pickText(link, 'description');
              return `
                <a class="card card--compact" href="${link.url}" target="_blank" rel="noopener">
                  <h3 class="card__title">${title}</h3>
                  <p class="card__text">${description}</p>
                </a>
              `;
            }
          )
          .join('');
      }
    });
  }

  function initNewsIndex() {
    const listEl = document.getElementById('newsList');
    if (!listEl) {
      return;
    }
    const searchInput = document.getElementById('newsSearch');
    const tagFilter = document.getElementById('newsTagFilter');
    const paginationEl = document.getElementById('newsPagination');
    const infoEl = document.getElementById('newsCount');

    const base = getBase();
    fetchJSON(`${base}data/news.json`).then((items) => {
      const tags = Array.from(new Set(items.flatMap((item) => pickArray(item, 'tags'))));
      if (tagFilter) {
        tagFilter.innerHTML = [`<option value="all">${t('news.tag.all', 'Все теги')}</option>`]
          .concat(tags.map((tag) => `<option value="${tag}">${tag}</option>`))
          .join('');
      }

      const list = setupList({
        items,
        listEl,
        paginationEl,
        searchInput,
        renderItem: (item) => {
          const title = pickText(item, 'title');
          const summary = pickText(item, 'summary');
          const tagsList = pickArray(item, 'tags');
          const imageSrc = resolveNewsImage(item, base);
          const imageMarkup = imageSrc
            ? `<div class="card__media"><img src="${imageSrc}" alt="${title}" loading="lazy" width="640" height="360" /></div>`
            : '';
          return `
            <article class="card">
              ${imageMarkup}
              <p class="card__meta">${formatMeta(item)}</p>
              <h3 class="card__title">${title}</h3>
              <p class="card__text">${summary}</p>
              <div class="card__tags">${tagsList.map((tag) => `<span class="badge">${tag}</span>`).join('')}</div>
              <a class="btn btn--ghost" href="${base}news/post.html?id=${item.id}">${t('news.read', 'Читать')}</a>
            </article>
          `;
        },
        emptyText: t('news.notfound', 'Новости не найдены.'),
        pageSize: 6,
        infoEl
      });

      list.update();

      if (tagFilter) {
        tagFilter.addEventListener('change', (event) => {
          list.setFilter(event.target.value);
        });
      }
    }).catch(() => {
      listEl.innerHTML = '<div class="notice">Не удалось загрузить новости.</div>';
    });
  }

  function initAnnouncementsIndex() {
    const listEl = document.getElementById('announcementsList');
    if (!listEl) {
      return;
    }
    const searchInput = document.getElementById('announcementsSearch');
    const paginationEl = document.getElementById('announcementsPagination');
    const infoEl = document.getElementById('announcementsCount');

    const base = getBase();
    fetchJSON(`${base}data/announcements.json`).then((items) => {
      const list = setupList({
        items,
        listEl,
        paginationEl,
        searchInput,
        renderItem: (item) => {
          const title = pickText(item, 'title');
          const summary = pickText(item, 'summary');
          return `
            <article class="card">
              <p class="card__meta">${formatDate(item.date)}</p>
              <h3 class="card__title">${title}</h3>
              <p class="card__text">${summary}</p>
              <a class="btn btn--ghost" href="${base}announcements/post.html?id=${item.id}">${t('ann.read', 'Читать')}</a>
            </article>
          `;
        },
        emptyText: t('ann.notfound', 'Объявления не найдены.'),
        pageSize: 6,
        infoEl
      });

      list.update();
    }).catch(() => {
      listEl.innerHTML = '<div class="notice">Не удалось загрузить объявления.</div>';
    });
  }

  function initDocsIndex() {
    const tableBody = document.getElementById('docsTableBody');
    if (!tableBody) {
      return;
    }
    const searchInput = document.getElementById('docsSearch');
    const tabsEl = document.getElementById('docsCategories');
    const paginationEl = document.getElementById('docsPagination');
    const infoEl = document.getElementById('docsCount');

    const base = getBase();
    fetchJSON(`${base}data/docs.json`).then((items) => {
      const categories = Array.from(new Set(items.map((item) => pickText(item, 'category'))));
      if (tabsEl) {
        const allCategories = [t('docs.all', 'Все')].concat(categories);
        tabsEl.innerHTML = '';
        allCategories.forEach((category, index) => {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = `tab${index === 0 ? ' is-active' : ''}`;
          button.textContent = category;
          button.dataset.value = category === t('docs.all', 'Все') ? 'all' : category;
          tabsEl.appendChild(button);
        });
      }

      const list = setupList({
        items,
        listEl: tableBody,
        paginationEl,
        searchInput,
        renderItem: (item) => `
          <tr>
            <td>${pickText(item, 'title')}</td>
            <td>${pickText(item, 'category')}</td>
            <td>${formatDate(item.date)}</td>
            <td><a href="${prefixBase(base, item.file)}" download>${t('docs.download', 'Скачать')}</a></td>
          </tr>
        `,
        emptyText: t('docs.notfound', 'Документы не найдены.'),
        pageSize: 10,
        infoEl,
        searchFn: (item) => `${pickText(item, 'title')} ${pickText(item, 'description') || ''}`
      });

      const updateTable = () => {
        list.update();
      };

      updateTable();

      if (tabsEl) {
        tabsEl.querySelectorAll('.tab').forEach((tab) => {
          tab.addEventListener('click', () => {
            tabsEl.querySelectorAll('.tab').forEach((button) => button.classList.remove('is-active'));
            tab.classList.add('is-active');
            list.setFilter(tab.dataset.value);
          });
        });
      }
    }).catch(() => {
      tableBody.innerHTML = `<tr><td colspan="4"><div class="notice">${t('docs.loadfail', 'Не удалось загрузить документы.')}</div></td></tr>`;
    });
  }

  function initPostPage({ listPath, containerId, backLink, titleFallback }) {
    const container = document.getElementById(containerId);
    if (!container) {
      return;
    }
    const base = getBase();
    const params = new URLSearchParams(window.location.search);
    const id = Number(params.get('id'));
    if (!id) {
      container.innerHTML = `<p class="notice">${t('post.notfound', 'Материал не найден.')}</p>`;
      return;
    }
    fetchJSON(`${base}${listPath}`).then((items) => {
      const item = items.find((entry) => Number(entry.id) === id);
      if (!item) {
        container.innerHTML = `<p class="notice">${t('post.notfound', 'Материал не найден.')}</p>`;
        return;
      }
      const titleEl = document.getElementById('postTitle');
      const titleText = pickText(item, 'title') || titleFallback;
      if (titleEl) {
        titleEl.textContent = titleText;
      }
      const tagsList = pickArray(item, 'tags');
      const tags = tagsList.length ? `<div class="card__tags">${tagsList.map((tag) => `<span class="badge">${tag}</span>`).join('')}</div>` : '';
      const attachments = item.attachments && item.attachments.length
        ? `
          <div class="attachments">
            <p><strong>${t('attachments.title', 'Вложения')}</strong></p>
            <ul>
              ${item.attachments
                .map((file) => {
                  const name = pickText(file, 'name') || file.name;
                  return `<li><a href="${prefixBase(base, file.file)}" download>${name}</a></li>`;
                })
                .join('')}
            </ul>
          </div>
        `
        : '';

      container.innerHTML = `
        <header>
          <p class="card__meta">${formatMeta(item)}</p>
          ${tags}
        </header>
        <div class="article__content">${pickText(item, 'contentHtml') || ''}</div>
        ${attachments}
        <a class="btn btn--secondary" href="${prefixBase(base, backLink)}">${t('post.back', 'Назад к списку')}</a>
      `;
    }).catch(() => {
      container.innerHTML = `<p class="notice">${t('post.loadfail', 'Не удалось загрузить материал.')}</p>`;
    });
  }

  function initNewsPost() {
    initPostPage({
      listPath: 'data/news.json',
      containerId: 'newsPost',
      backLink: 'news/index.html',
      titleFallback: t('news.singleTitle', 'Новость')
    });
  }

  function initAnnouncementsPost() {
    initPostPage({
      listPath: 'data/announcements.json',
      containerId: 'announcementsPost',
      backLink: 'announcements/index.html',
      titleFallback: t('ann.singleTitle', 'Объявление')
    });
  }

  function initGalleryIndex() {
    const listEl = document.getElementById('galleryAlbums');
    if (!listEl) {
      return;
    }
    const base = getBase();
    fetchJSON(`${base}data/gallery.json`).then((data) => {
      const albums = data.albums || [];
      listEl.innerHTML = albums
        .map(
          (album) => {
            const title = pickText(album, 'title');
            const description = pickText(album, 'description');
            return `
              <article class="card">
                <img src="${prefixBase(base, album.cover)}" alt="${title}" loading="lazy" width="480" height="320" />
                <p class="card__meta">${formatDate(album.date)}</p>
                <h3 class="card__title">${title}</h3>
                <p class="card__text">${description || ''}</p>
                <a class="btn btn--ghost" href="${base}gallery/album.html?id=${album.id}">${t('gallery.open', 'Открыть альбом')}</a>
              </article>
            `;
          }
        )
        .join('');
    }).catch(() => {
      listEl.innerHTML = `<div class="notice">${t('gallery.loadfail', 'Не удалось загрузить альбомы.')}</div>`;
    });
  }

  function initGalleryAlbum() {
    const gridEl = document.getElementById('galleryGrid');
    if (!gridEl) {
      return;
    }
    const modal = document.getElementById('galleryModal');
    const modalImg = document.getElementById('galleryModalImage');
    const modalCaption = document.getElementById('galleryModalCaption');
    const modalClose = document.getElementById('galleryModalClose');

    const base = getBase();
    const params = new URLSearchParams(window.location.search);
    const id = Number(params.get('id'));

    fetchJSON(`${base}data/gallery.json`).then((data) => {
      const album = (data.albums || []).find((entry) => Number(entry.id) === id) || data.albums?.[0];
      if (!album) {
        gridEl.innerHTML = `<p class="notice">${t('gallery.notfound', 'Альбом не найден.')}</p>`;
        return;
      }
      const titleEl = document.getElementById('albumTitle');
      if (titleEl) {
        titleEl.textContent = pickText(album, 'title');
      }
      gridEl.innerHTML = album.photos
        .map(
          (photo) => {
            const alt = pickText(photo, 'alt') || photo.alt;
            return `
              <button class="card" type="button" data-photo="${prefixBase(base, photo.src)}" data-caption="${alt}">
                <img src="${prefixBase(base, photo.src)}" alt="${alt}" loading="lazy" width="420" height="300" />
              </button>
            `;
          }
        )
        .join('');

      gridEl.querySelectorAll('[data-photo]').forEach((button) => {
        button.addEventListener('click', () => {
          if (!modal || !modalImg || !modalCaption) {
            return;
          }
          modalImg.src = button.dataset.photo;
          modalImg.alt = button.dataset.caption || '';
          modalCaption.textContent = button.dataset.caption || '';
          modal.classList.add('is-open');
          modal.setAttribute('aria-hidden', 'false');
        });
      });
    }).catch(() => {
      gridEl.innerHTML = `<div class="notice">${t('gallery.photosfail', 'Не удалось загрузить фотографии.')}</div>`;
    });

    if (modal && modalClose) {
      const closeModal = () => {
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
      };
      modalClose.addEventListener('click', closeModal);
      modal.addEventListener('click', (event) => {
        if (event.target === modal) {
          closeModal();
        }
      });
      window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
          closeModal();
        }
      });
    }
  }

  function setupModals() {
    const triggers = document.querySelectorAll('[data-modal-open]');
    if (!triggers.length) {
      return;
    }
    const onEscape = (event) => {
      if (event.key !== 'Escape') {
        return;
      }
      document.querySelectorAll('.modal.is-open').forEach((modal) => {
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
      });
    };
    window.addEventListener('keydown', onEscape);

    triggers.forEach((trigger) => {
      const targetId = trigger.dataset.modalOpen;
      if (!targetId) {
        return;
      }
      const modal = document.getElementById(targetId);
      if (!modal) {
        return;
      }
      const closeButton = modal.querySelector('[data-modal-close]');
      const close = () => {
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
      };
      const open = () => {
        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
      };
      trigger.addEventListener('click', open);
      if (closeButton) {
        closeButton.addEventListener('click', close);
      }
      modal.addEventListener('click', (event) => {
        if (event.target === modal) {
          close();
        }
      });
    });
  }

  function initSiteSearch() {
    const input = document.getElementById('siteSearchInput');
    const resultsEl = document.getElementById('siteSearchResults');
    if (!input || !resultsEl) {
      return;
    }

    const base = getBase();
    let index = [];

    fetchJSON(`${base}data/search-index.json`).then((items) => {
      index = Array.isArray(items) ? items : [];
    }).catch(() => {
      index = [];
    });

    const renderResults = (items, query) => {
      if (!query) {
        resultsEl.classList.remove('is-open');
        resultsEl.innerHTML = '';
        return;
      }

      if (!items.length) {
        resultsEl.classList.add('is-open');
        resultsEl.innerHTML = `<div class="site-search__item"><span class="site-search__title">${t('search.empty', 'Ничего не найдено')}</span></div>`;
        return;
      }

      resultsEl.classList.add('is-open');
      resultsEl.innerHTML = items
        .slice(0, 8)
        .map((item) => `
          <a class="site-search__item" href="${prefixBase(base, item.url)}">
            <span class="site-search__title">${item.title}</span>
            <span class="site-search__excerpt">${item.excerpt || ''}</span>
          </a>
        `)
        .join('');
    };

    const search = (query) => {
      const tokens = query
        .toLowerCase()
        .split(/\s+/)
        .map((token) => token.trim())
        .filter((token) => token.length >= 2);

      if (!tokens.length) {
        renderResults([], '');
        return;
      }

      const scored = index
        .map((item) => {
          const haystack = (item.searchText || '').toLowerCase();
          let score = 0;
          tokens.forEach((token) => {
            if (haystack.includes(token)) {
              score += 1;
            }
          });
          return { item, score };
        })
        .filter((entry) => entry.score > 0)
        .sort((a, b) => b.score - a.score);

      renderResults(scored.map((entry) => entry.item), query);
    };

    input.addEventListener('input', (event) => {
      search(event.target.value.trim());
    });

    document.addEventListener('click', (event) => {
      if (!resultsEl.contains(event.target) && event.target !== input) {
        resultsEl.classList.remove('is-open');
      }
    });
  }

  async function initSite() {
    if (window.__siteInitialized) {
      return;
    }
    if (document.querySelector('[data-include]') && !window.__includesDone) {
      return;
    }
    window.__siteInitialized = true;

    await initI18n();
    applyBasePaths();
    highlightActiveNav();
    setYear();
    setupMenu();
    setupA11yToggle();
    setupStickyHeader();
    setupBackToTop();
    setupBackNav();
    setupTeacherEasterEgg();
    setupForms();
    setupModals();

    initIndexPage();
    initNewsIndex();
    initAnnouncementsIndex();
    initDocsIndex();
    initNewsPost();
    initAnnouncementsPost();
    initGalleryIndex();
    initGalleryAlbum();
    initSiteSearch();
  }

  window.initSite = initSite;

  document.addEventListener('DOMContentLoaded', () => {
    initSite();
  });
})();
