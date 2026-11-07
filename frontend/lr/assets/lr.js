/*
 * LR-CO — design preview storefront.
 * Static pages under /lr/. Sample catalog, prices, reviews and orders; no backend calls,
 * nothing is charged or saved on the server. The bag, wishlist and sample sign-in live in this browser only.
 * Its own code and its own look: warm near-black, ivory and copper, wide uppercase type, thin rules,
 * a text-only header with a full-screen split menu, live-filtering search, a price range slider,
 * a gallery/index shop, a magnifier + lightbox product page and an accordion account.
 * There is deliberately no vehicle picker / garage / fit filter: what a part fits is plain product text.
 */
(function () {
  'use strict';

  const CAT = window.PREVIEW_CATALOG;
  const ART = window.PartsArt;
  const BASE = '/lr';
  const BRAND = 'LR-CO';
  const TIER = 'expensive';
  const COPPER = '#c8834a';
  const P = CAT.products;

  // Customer rules from the CFOODS handoff (Nov 5, 2026). Same for every CFOODS store unless the owner overrides.
  const FREE_SHIP = 30;
  const SHIP_FLAT = 7;
  const SHIP_ZONES = { us: ['Lower 48 states', null], akhi: ['Alaska or Hawaii', 50], ca: ['Canada', 100], intl: ['Other countries', 150] };
  const RETURN_DAYS = 7;
  const RESTOCK = 0.05;
  const shipFor = (zone, subtotal) => (zone === 'us' || !SHIP_ZONES[zone] ? (subtotal >= FREE_SHIP || subtotal <= 0 ? 0 : SHIP_FLAT) : SHIP_ZONES[zone][1]);

  // ------------------------------------------------------------------ helpers
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = (n) => `$${Number(n).toFixed(2)}`;
  const params = new URLSearchParams(window.location.search);
  const byId = (id) => P.find((p) => p.id === id);
  const price = (p) => p.price[TIER];
  const dash = (s) => String(s).replace(/(\d{4})-(\d{4})/g, '$1–$2');
  const title = (p) => dash(p.title);
  const catById = (id) => CAT.categories.find((c) => c.id === id);
  const two = (n) => String(n).padStart(2, '0');
  const isPhone = () => window.matchMedia('(max-width: 640px)').matches;
  const finePointer = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const store = {
    get(key, fallback) {
      try { const v = window.localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
    },
    set(key, value) {
      try { window.localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage blocked: the page still works for this visit */ }
    },
    session(key, value) {
      try {
        if (value === undefined) { const v = window.sessionStorage.getItem(key); return v ? JSON.parse(v) : null; }
        if (value === null) window.sessionStorage.removeItem(key); else window.sessionStorage.setItem(key, JSON.stringify(value));
      } catch (e) { /* ignore */ }
      return null;
    },
  };

  const url = {
    home: `${BASE}/home/`,
    all: `${BASE}/collection/`,
    cat: (id) => `${BASE}/collection/?category=${encodeURIComponent(id)}`,
    product: (p) => `${BASE}/product/?p=${encodeURIComponent(p.id)}`,
    search: (q) => `${BASE}/search/?q=${encodeURIComponent(q)}`,
    page: (name) => `${BASE}/${name}/`,
  };

  const I = {
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.6-3.6"/>',
    bag: '<path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/>',
    truck: '<path d="M2 6h11v10H2zM13 10h4l3 3v3h-7"/><circle cx="6" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
    returns: '<path d="M4 10h11a5 5 0 0 1 0 10H9"/><path d="M8 6l-4 4 4 4"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    chev: '<path d="M9 6l6 6-6 6"/>',
    back: '<path d="M15 6l-6 6 6 6"/>',
    down: '<path d="M6 9l6 6 6-6"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="1"/><path d="M3 7l9 6 9-6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="1"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    wrench: '<path d="M15 4a5 5 0 0 0-4.6 6.9L4 17.3V20h2.7l6.4-6.4A5 5 0 0 0 20 9l-3 1-2-2 1-3z"/>',
    box: '<path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.5"/>',
    pin: '<path d="M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>',
    chat: '<path d="M4 5h16v11H9l-5 4z"/>',
    medal: '<circle cx="12" cy="15" r="6"/><path d="M8 3l4 6 4-6M12 12.5v5"/>',
    bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
    play: '<rect x="3" y="5" width="18" height="14" rx="1"/><path d="M10 9l5 3-5 3z"/>',
    out: '<path d="M14 4h6v16h-6M10 12h10M6 8l-4 4 4 4"/>',
    heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3M15 8l2 2"/>',
    phone: '<rect x="7" y="2" width="10" height="20" rx="1"/><path d="M11 18h2"/>',
    upload: '<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>',
    coin: '<circle cx="12" cy="12" r="9"/><path d="M14.5 9.5c-.5-1-1.5-1.5-2.5-1.5-1.4 0-2.5.8-2.5 2s1.1 1.6 2.5 2 2.5.8 2.5 2-1.1 2-2.5 2c-1 0-2-.5-2.5-1.5M12 6.5v1.5M12 16v1.5"/>',
    sliders: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    expand: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  };
  I.cart = I.bag;
  const icon = (name, cls = '') => `<svg class="lr-i ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true">${I[name] || ''}</svg>`;

  // LR-CO draws its parts dark with a copper accent (an illustration style, not a finish claim).
  const art = (p, view = 'main') => ART.svg(p.art, { finish: 'black', accent: COPPER, coupler: '#3a2a1e', view, label: title(p) });
  const catArt = (c) => ART.svg(c.art, { finish: 'black', accent: COPPER, coupler: '#3a2a1e', label: c.name });

  const priceTag = (n, cls = '') => `<span class="lr-price ${cls}">${money(n)}</span>`;
  const stars = (r) => `<span class="lr-stars" style="--r:${((r / 5) * 100).toFixed(0)}%" role="img" aria-label="${r} out of 5 stars"></span>`;

  const isoDay = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const daysAgo = (n) => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - n); return isoDay(d); };
  const addDays = (iso, n) => { const d = new Date(`${iso}T12:00:00`); d.setDate(d.getDate() + n); return isoDay(d); };
  const niceDate = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // ------------------------------------------------------------------ bag, wishlist
  const cart = {
    read() { return store.get('lr_preview_cart', []).filter((l) => l && byId(l.id) && l.qty > 0); },
    write(lines) { store.set('lr_preview_cart', lines); updateBadges(); },
    add(id, qty = 1) {
      const lines = this.read();
      const line = lines.find((l) => l.id === id);
      if (line) line.qty = Math.min(20, line.qty + qty); else lines.push({ id, qty: Math.min(20, qty) });
      this.write(lines);
    },
    setQty(id, qty) { this.write(this.read().map((l) => (l.id === id ? { ...l, qty: Math.max(1, Math.min(20, qty)) } : l))); },
    remove(id) { this.write(this.read().filter((l) => l.id !== id)); },
    clear() { this.write([]); },
    count() { return this.read().reduce((a, l) => a + l.qty, 0); },
    subtotal() { return this.read().reduce((a, l) => a + price(byId(l.id)) * l.qty, 0); },
  };
  const wish = {
    read() { return store.get('lr_preview_wishlist', []).filter((id) => byId(id)); },
    has(id) { return this.read().includes(id); },
    set(id, on) { const list = this.read().filter((x) => x !== id); store.set('lr_preview_wishlist', on ? [...list, id] : list); return on; },
    toggle(id) { return this.set(id, !this.has(id)); },
  };
  const wishButton = (p) => `<button class="lr-textbtn lr-save${wish.has(p.id) ? ' is-on' : ''}" type="button" data-wish="${p.id}" aria-pressed="${wish.has(p.id)}" aria-label="Save ${esc(title(p))} to your wishlist"><span>${wish.has(p.id) ? 'Saved' : 'Save'}</span></button>`;

  // What a part fits is plain product text (like the title). There is no vehicle picker or garage.
  const fitText = (p) => (p.universal ? 'Universal fit' : p.fits.map((f) => `${f.from}–${f.to} ${f.make} ${f.model}`).join(', '));

  // Price range used by the shop slider and the home page teaser.
  const RANGE = { lo: 50, hi: 900, step: 10 };
  const PRESETS = [['Under $150', 50, 150], ['$150–$450', 150, 450], ['$450–$650', 450, 650], ['$650 and up', 650, 900]];
  const clampRange = (v, d) => { const n = parseInt(v, 10); return Number.isFinite(n) ? Math.max(RANGE.lo, Math.min(RANGE.hi, Math.round(n / RANGE.step) * RANGE.step)) : d; };
  const inRange = (p, min, max) => price(p) >= min && (max >= RANGE.hi || price(p) <= max);
  const rangeLabel = (min, max) => (min <= RANGE.lo && max >= RANGE.hi ? 'Any price' : max >= RANGE.hi ? `${money(min).replace('.00', '')} and up` : `${money(min).replace('.00', '')} – ${money(max).replace('.00', '')}`);

  // Dual-handle price slider (two range inputs on one track). Calls onInput(min, max).
  function rangeSlider(id, min, max) {
    const pct = (v) => (((v - RANGE.lo) / (RANGE.hi - RANGE.lo)) * 100).toFixed(2);
    return `<div class="lr-range" id="${id}" style="--a:${pct(min)}%;--b:${pct(max)}%">
      <div class="lr-range-track" aria-hidden="true"><span></span></div>
      <label class="lr-visually-hidden" for="${id}Min">Lowest price</label>
      <input type="range" id="${id}Min" min="${RANGE.lo}" max="${RANGE.hi}" step="${RANGE.step}" value="${min}" aria-valuetext="${money(min)}">
      <label class="lr-visually-hidden" for="${id}Max">Highest price</label>
      <input type="range" id="${id}Max" min="${RANGE.lo}" max="${RANGE.hi}" step="${RANGE.step}" value="${max}" aria-valuetext="${max >= RANGE.hi ? `${money(max)} and up` : money(max)}">
    </div>`;
  }
  function bindRange(id, onInput) {
    const wrap = document.getElementById(id);
    const a = document.getElementById(`${id}Min`);
    const b = document.getElementById(`${id}Max`);
    const pct = (v) => (((v - RANGE.lo) / (RANGE.hi - RANGE.lo)) * 100).toFixed(2);
    const sync = (moved) => {
      let lo = Number(a.value);
      let hi = Number(b.value);
      if (lo > hi - RANGE.step) { if (moved === a) { lo = hi - RANGE.step; a.value = lo; } else { hi = lo + RANGE.step; b.value = hi; } }
      wrap.style.setProperty('--a', `${pct(lo)}%`);
      wrap.style.setProperty('--b', `${pct(hi)}%`);
      a.setAttribute('aria-valuetext', money(lo));
      b.setAttribute('aria-valuetext', hi >= RANGE.hi ? `${money(hi)} and up` : money(hi));
      // Keep the handle you can still move on top when they meet.
      a.style.zIndex = lo > RANGE.hi - 4 * RANGE.step ? 4 : 3;
      onInput(lo, hi);
    };
    a.addEventListener('input', () => sync(a));
    b.addEventListener('input', () => sync(b));
    return { set(lo, hi) { a.value = lo; b.value = hi; sync(null); } };
  }

  // ------------------------------------------------------------------ search
  // Plain keyword search over what a product already has: title, category, engine and part number.
  function searchProducts(q) {
    const tokens = String(q || '').toLowerCase().replace(/["'(),]/g, ' ').split(/\s+/).filter(Boolean);
    if (!tokens.length) return [];
    return P.map((p) => {
      const hay = [p.title, p.categoryName, p.category.replace(/-/g, ' '), p.engine, p.sku, p.art, p.universal ? 'universal' : ''].join(' ').toLowerCase();
      const t0 = p.title.toLowerCase();
      let score = 0;
      for (const t of tokens) {
        const single = t.length > 3 ? t.replace(/(es|s)$/, '') : t;
        if (!hay.includes(t) && !hay.includes(single)) return null;
        score += t0.includes(t) || t0.includes(single) ? 3 : 1;
        if (p.categoryName.toLowerCase().includes(single)) score += 2;
      }
      return { p, score: score + p.reviewCount / 1000 };
    }).filter(Boolean).sort((a, b) => b.score - a.score).map((x) => x.p);
  }
  function highlight(text, q) {
    let out = esc(text);
    String(q || '').toLowerCase().split(/\s+/).filter((t) => t.length > 1).forEach((t) => {
      const safe = esc(t).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      out = out.replace(new RegExp(`(${safe})(?![^<]*>)`, 'ig'), '<mark>$1</mark>');
    });
    return out;
  }

  // ------------------------------------------------------------------ shared pieces
  // The logo is the name in square brackets: [LR-CO].
  const wordmark = () => '<span class="lr-word"><b aria-hidden="true">[</b>LR-CO<b aria-hidden="true">]</b></span>';
  const logo = () => wordmark();

  function card(p, i = 0) {
    const out = p.stock <= 0;
    const flag = out ? '<span class="lr-flag">Sold out</span>' : p.isNew ? '<span class="lr-flag is-new">New</span>' : '';
    return `<article class="lr-card${out ? ' is-out' : ''}">
      <a class="lr-card-media" href="${url.product(p)}" tabindex="-1" aria-hidden="true">${art(p)}${flag}</a>
      <div class="lr-card-line">
        <span class="lr-card-no">${two(i + 1)}</span>
        <h3 class="lr-card-title"><a href="${url.product(p)}">${esc(title(p))}</a></h3>
        ${priceTag(price(p), 'lr-card-price')}
      </div>
      <div class="lr-card-line2">
        <span class="lr-card-meta">${esc(p.categoryName)} &middot; ${esc(p.sku)}</span>
        ${out ? '<span class="lr-card-meta">Notify me inside</span>' : `<button class="lr-add-link" type="button" data-add="${p.id}" aria-label="Add ${esc(title(p))} to bag">+ Add</button>`}
      </div>
    </article>`;
  }
  const grid = (list) => `<div class="lr-grid">${list.map((p, i) => card(p, i)).join('')}</div>`;

  function shipProgress(sub) {
    const left = FREE_SHIP - sub;
    const pct = Math.max(2, Math.min(100, (sub / FREE_SHIP) * 100));
    return `<div class="lr-meter${left <= 0 ? ' is-done' : ''}"><p>${left > 0 ? `<b>${money(left)}</b> from complimentary shipping` : '<b>Complimentary shipping</b> on this order'}</p><div class="lr-meter-bar" aria-hidden="true"><span style="width:${pct}%"></span></div></div>`;
  }

  const crumbs = (items) => `<nav class="lr-crumbs" aria-label="Breadcrumb">${items.map(([label, href], i) => (href && i < items.length - 1 ? `<a href="${href}">${esc(label)}</a>` : `<span aria-current="page">${esc(label)}</span>`)).join('<span class="lr-crumb-sep" aria-hidden="true">/</span>')}</nav>`;

  function header() {
    const page = document.body.dataset.page;
    const cur = (on) => (on ? ' aria-current="page"' : '');
    return `<header class="lr-header">
      <div class="lr-wrap lr-header-inner">
        <a class="lr-logo" href="${url.home}" aria-label="LR-CO home">${wordmark()}</a>
        <nav class="lr-headnav" aria-label="Main">
          <a class="lr-hide-sm" href="${url.all}"${cur(page === 'collection')}>Shop</a>
          <a class="lr-hide-sm" href="${url.page('search')}"${cur(page === 'search')}>Search</a>
          <a class="lr-hide-sm" href="${url.page('account')}"${cur(page === 'account')}>Account</a>
          <a href="${url.page('cart')}"${cur(page === 'cart')} aria-label="Bag, items:" class="lr-bag-link">Bag (<span class="lr-cart-count">0</span>)</a>
          <button class="lr-menu-btn" type="button" data-open-menu aria-expanded="false" aria-controls="lrMenu">Menu</button>
        </nav>
      </div>
    </header>`;
  }

  function menuOverlay() {
    const first = CAT.categories[0];
    return `<div class="lr-menu" id="lrMenu" role="dialog" aria-modal="true" aria-label="Menu" hidden>
      <div class="lr-menu-top lr-wrap"><a class="lr-logo" href="${url.home}" aria-label="LR-CO home">${wordmark()}</a><button class="lr-menu-btn" type="button" data-close-menu>Close</button></div>
      <div class="lr-wrap lr-menu-grid">
        <nav class="lr-menu-list" aria-label="Part types">
          <p class="lr-label">The collection</p>
          <ol>${CAT.categories.map((c, i) => `<li><a href="${url.cat(c.id)}" data-preview="${c.id}"><span class="lr-menu-no">${two(i + 1)}</span><span class="lr-menu-name">${esc(c.name)}</span><span class="lr-menu-count">${P.filter((p) => p.category === c.id).length}</span></a></li>`).join('')}</ol>
          <ul class="lr-menu-more">
            <li><a href="${url.all}">Shop all ${P.length}</a></li>
            <li><a href="${url.page('search')}">Search</a></li>
            <li><a href="${url.page('account')}">Account</a></li>
            <li><a href="${url.page('track')}">Track an order</a></li>
            <li><a href="${url.page('contact')}">Help</a></li>
          </ul>
        </nav>
        <figure class="lr-menu-preview" aria-hidden="true">
          <div class="lr-menu-art" id="menuArt">${catArt(first)}</div>
          <figcaption><b id="menuName">${esc(first.name)}</b><span id="menuBlurb">${esc(first.blurb)}</span></figcaption>
        </figure>
      </div>
    </div>`;
  }

  const HELP_LINKS = [['Track order', 'track'], ['Start a return or claim', 'request'], ['Shipping', 'shipping'], ['Returns & refunds', 'refund'], ['Warranty', 'warranty'], ['FAQ', 'faq'], ['Contact us', 'contact']];
  const COMPANY_LINKS = [['About us', 'about'], ['Customer reviews', 'reviews'], ['Military discount', 'military'], ['Social', 'social']];
  const LEGAL_LINKS = [['Privacy policy', 'privacy'], ['Terms & conditions', 'terms'], ['Vehicle compliance waiver', 'vcw'], ['Consumer use agreement', 'cua'], ['Proposition 65', 'prop65']];
  const linkList = (list) => list.map(([label, page]) => `<li><a href="${url.page(page)}">${esc(label)}</a></li>`).join('');

  function footer() {
    return `<footer class="lr-footer">
      <div class="lr-footer-ivory">
        <div class="lr-wrap lr-footer-news">
          <div><p class="lr-label">Correspondence</p><h2>New pieces, now and then.</h2><p>A short note when something new is made. Never more than that.</p></div>
          <form class="lr-news" id="footNews" novalidate><label class="lr-visually-hidden" for="footEmail">Email address</label><input id="footEmail" type="email" placeholder="Email address" autocomplete="email"><button class="lr-btn lr-btn-ink" type="submit">Subscribe</button><p class="lr-form-msg" id="footMsg" role="status"></p></form>
        </div>
      </div>
      <div class="lr-wrap">
        <div class="lr-footer-cols">
          <div><h3>Collection</h3><ul><li><a href="${url.all}">Shop all</a></li>${CAT.categories.map((c) => `<li><a href="${url.cat(c.id)}">${esc(c.name)}</a></li>`).join('')}</ul></div>
          <div><h3>Client care</h3><ul>${linkList(HELP_LINKS)}</ul></div>
          <div><h3>House</h3><ul>${linkList(COMPANY_LINKS)}<li><a href="${url.page('account')}">Account</a></li></ul></div>
          <div><h3>Legal</h3><ul>${linkList(LEGAL_LINKS)}</ul></div>
        </div>
        <p class="lr-footer-word" aria-hidden="true">[LR-CO]</p>
        <div class="lr-footer-bottom">
          <p>&copy; 2026 LR-CO. All rights reserved.</p>
          <p>Design preview: sample products, prices, reviews and orders. Nothing here can be bought. <a href="${url.page('emails')}">Email designs</a></p>
        </div>
      </div>
    </footer>`;
  }

  function overlays(withChat = true) {
    return `<div class="lr-lightbox" id="lrLightbox" role="dialog" aria-modal="true" aria-label="Pictures" hidden>
      <div class="lr-lightbox-top"><span class="lr-lightbox-count" id="lbCount">01 / 04</span><button class="lr-textbtn" type="button" data-close-lightbox>Close</button></div>
      <div class="lr-lightbox-stage" id="lbStage"></div>
      <div class="lr-lightbox-nav"><button class="lr-textbtn" type="button" data-lb="-1" aria-label="Previous picture">${icon('back')}Prev</button><button class="lr-textbtn" type="button" data-lb="1" aria-label="Next picture">Next${icon('chev')}</button></div>
    </div>
    <div class="lr-toast" id="lrToast" role="status" aria-live="polite"></div>
    <div class="lr-float" id="lrFloat" aria-hidden="true"></div>
    ${withChat ? `<button class="lr-concierge" type="button" data-open-chat aria-controls="lrChat" aria-expanded="false">Concierge</button>
    <section class="lr-chat" id="lrChat" hidden role="dialog" aria-labelledby="lrChatTitle">
      <div class="lr-chat-head"><div><b id="lrChatTitle">Concierge</b><small>At your service, any hour</small></div><button class="lr-textbtn" type="button" data-close-chat>Close</button></div>
      <div class="lr-chat-body" id="lrChatBody" aria-live="polite"><div class="lr-bubble is-team"><small>LR-CO Concierge</small><p>Good evening. We’re here to help with an order, delivery, returns or part fitment. How may we help?</p></div></div>
      <form class="lr-chat-form" id="lrChatForm" novalidate><label class="lr-visually-hidden" for="lrChatInput">Message</label><input id="lrChatInput" placeholder="Write a message" autocomplete="off"><button class="lr-btn lr-btn-copper lr-btn-sm" type="submit">Send</button></form>
      <p class="lr-chat-note">Preview: replies aren't live yet.</p>
    </section>` : ''}`;
  }

  function updateBadges() {
    const n = cart.count();
    $$('.lr-cart-count').forEach((el) => { el.textContent = n; });
    $$('.lr-bag-link').forEach((a) => a.setAttribute('aria-label', `Bag, ${n} item${n === 1 ? '' : 's'}`));
  }

  let lastFocus = null;
  function setMenu(open) {
    const menu = document.getElementById('lrMenu');
    if (!menu) return;
    if (open) { lastFocus = document.activeElement; menu.hidden = false; requestAnimationFrame(() => menu.classList.add('is-open')); setTimeout(() => { const a = $('.lr-menu-list a', menu); if (a) a.focus(); }, 60); }
    else { if (menu.hidden) return; menu.classList.remove('is-open'); menu.hidden = true; if (lastFocus && document.contains(lastFocus)) lastFocus.focus(); }
    document.documentElement.classList.toggle('lr-lock', open);
    $$('[data-open-menu]').forEach((b) => b.setAttribute('aria-expanded', String(open)));
  }
  function previewCat(id) {
    const c = catById(id);
    if (!c) return;
    document.getElementById('menuArt').innerHTML = catArt(c);
    document.getElementById('menuName').textContent = c.name;
    document.getElementById('menuBlurb').textContent = c.blurb;
    $$('[data-preview]').forEach((a) => a.classList.toggle('is-on', a.dataset.preview === id));
  }
  function openChat() {
    const panel = document.getElementById('lrChat');
    if (!panel) return;
    panel.hidden = false;
    $$('.lr-concierge').forEach((b) => b.setAttribute('aria-expanded', 'true'));
    setTimeout(() => { const input = document.getElementById('lrChatInput'); if (input) input.focus(); }, 30);
  }
  function closeChat() {
    const panel = document.getElementById('lrChat');
    if (!panel || panel.hidden) return;
    panel.hidden = true;
    $$('.lr-concierge').forEach((b) => { b.setAttribute('aria-expanded', 'false'); b.focus(); });
  }
  function toast(text) {
    const el = document.getElementById('lrToast');
    if (!el) return;
    el.textContent = text;
    el.classList.add('is-on');
    clearTimeout(toast.t);
    toast.t = setTimeout(() => el.classList.remove('is-on'), 2800);
  }

  // Lightbox (product pictures). Opened by the product page with the list of views.
  const lb = { views: [], i: 0, p: null, back: null };
  function drawLightbox() {
    document.getElementById('lbStage').innerHTML = art(lb.p, lb.views[lb.i][0]);
    document.getElementById('lbCount').textContent = `${two(lb.i + 1)} / ${two(lb.views.length)} — ${lb.views[lb.i][1]}`;
  }
  function openLightbox(p, views, i) {
    Object.assign(lb, { p, views, i, back: document.activeElement });
    const box = document.getElementById('lrLightbox');
    box.hidden = false;
    document.documentElement.classList.add('lr-lock');
    drawLightbox();
    setTimeout(() => $('[data-close-lightbox]', box).focus(), 30);
  }
  function stepLightbox(d) { if (!lb.p) return; lb.i = (lb.i + d + lb.views.length) % lb.views.length; drawLightbox(); if (lb.onStep) lb.onStep(lb.i); }
  function closeLightbox() {
    const box = document.getElementById('lrLightbox');
    if (!box || box.hidden) return;
    box.hidden = true;
    document.documentElement.classList.remove('lr-lock');
    if (lb.back && document.contains(lb.back)) lb.back.focus();
  }

  // ------------------------------------------------------------------ pages
  const PAGES = {};
  let onCartChange = null; // the bag page sets this so it redraws when something is added
  let onWishChange = null; // the account wishlist sets this

  // ------------------------------------------------------------------ home
  PAGES.home = () => {
    const hero = byId('accord-94-97-header');
    const feature = byId('350z-03-06-header');
    const quotes = ['integra-94-01-header', 'wrx-08-14-downpipe', 'civic-06-11-intake', '370z-09-20-test-pipes'].map((id) => { const p = byId(id); return { p, r: CAT.featuredReview(p) }; });
    // Spec callouts pinned to the drawing: [value, label, x%, y%, side]
    const callouts = [['3/8" laser-cut', 'Flange', 52, 20, 'r'], ['T304 stainless', 'Material', 31, 50, 'l'], ['TIG, back-purged', 'Welds', 52, 71, 'r']];
    const start = [150, 650];
    return {
      title: 'Engineered for those who notice',
      html: `
      <section class="lr-hero">
        <div class="lr-wrap">
          <p class="lr-label">[LR-CO] &middot; Collection 2026</p>
          <h1 class="lr-hero-title">Engineered for those who notice.</h1>
          <div class="lr-hero-grid">
            <div class="lr-hero-copy">
              <p>Headers, downpipes and intakes in T304 stainless and machined parts, made in small runs and listed with every number that matters. Nothing loud about it.</p>
              <div class="lr-hero-actions"><a class="lr-btn lr-btn-copper" href="${url.all}">Enter the collection</a><a class="lr-textlink" href="${url.product(hero)}">The ${esc(hero.categoryName.toLowerCase().replace(/s$/, ''))}, in detail</a></div>
            </div>
            <figure class="lr-hero-figure">
              <a class="lr-hero-art" href="${url.product(hero)}" aria-label="${esc(title(hero))}, ${money(price(hero))}">${art(hero)}</a>
              <ul class="lr-pins">${callouts.map(([v, k, x, y, side]) => `<li class="lr-pin is-${side}" style="--x:${x}%;--y:${y}%"><i aria-hidden="true"></i><span><small>${k}</small><b>${v}</b></span></li>`).join('')}</ul>
            </figure>
          </div>
        </div>
      </section>

      <section class="lr-section" aria-labelledby="idxTitle">
        <div class="lr-wrap lr-section-head"><div><p class="lr-label">01 &mdash; Index</p><h2 id="idxTitle">The collection</h2></div><a class="lr-textlink" href="${url.all}">All ${P.length} pieces</a></div>
        <div class="lr-cindex" tabindex="0" aria-label="Part types">${CAT.categories.map((c, i) => `<a class="lr-cindex-item" href="${url.cat(c.id)}"><span class="lr-cindex-no">${two(i + 1)}</span><span class="lr-cindex-art">${catArt(c)}</span><b>${esc(c.name)}</b><small>${P.filter((p) => p.category === c.id).length} pieces &middot; from ${money(Math.min(...P.filter((p) => p.category === c.id).map(price))).replace('.00', '')}</small></a>`).join('')}</div>
      </section>

      <section class="lr-section lr-wrap" aria-labelledby="featTitle">
        <div class="lr-feature">
          <a class="lr-feature-art" href="${url.product(feature)}" tabindex="-1" aria-hidden="true">${art(feature)}</a>
          <div class="lr-feature-copy">
            <p class="lr-label">02 &mdash; Featured piece</p>
            <h2 id="featTitle">${esc(title(feature))}</h2>
            <p>Equal-length primaries for the ${esc(feature.engine)}, a collector built for a clean, even note, and a flange cut flat so it seals the first time. Made in a small run.</p>
            <dl class="lr-sheet lr-sheet-sm">${Object.entries(feature.specs).filter(([k]) => ['Material', 'Welds', 'Flange', 'Primary tubes'].includes(k)).map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
            <p class="lr-feature-buy">${priceTag(price(feature), 'lr-price-lg')}<a class="lr-btn lr-btn-line" href="${url.product(feature)}">View the piece</a></p>
          </div>
        </div>
      </section>

      <section class="lr-standard" aria-labelledby="stdTitle">
        <div class="lr-wrap">
          <p class="lr-label">03 &mdash; The standard</p>
          <h2 id="stdTitle">Three numbers we don't compromise on.</h2>
          <div class="lr-standard-grid">
            <div><b>T304</b><p>Stainless steel on every header, downpipe, test pipe and flange.</p></div>
            <div><b>3/8&Prime;</b><p>Laser-cut header flanges, thick enough to stay flat.</p></div>
            <div><b>TIG</b><p>Back-purged welds on every header, inside and out.</p></div>
          </div>
        </div>
      </section>

      <section class="lr-section lr-wrap" aria-labelledby="rangeTitle">
        <div class="lr-range-teaser">
          <div><p class="lr-label">04 &mdash; By price</p><h2 id="rangeTitle">Set your range.</h2><p class="lr-muted">Drag either end. The collection follows.</p></div>
          <div class="lr-range-box">
            <p class="lr-range-value" id="homeRangeLabel">${rangeLabel(start[0], start[1])}</p>
            ${rangeSlider('homeRange', start[0], start[1])}
            <div class="lr-range-scale" aria-hidden="true"><span>$${RANGE.lo}</span><span>$${RANGE.hi}+</span></div>
            <a class="lr-btn lr-btn-copper" id="homeRangeGo" href="${url.all}?min=${start[0]}&max=${start[1]}">Show pieces</a>
            <p class="lr-presets">${PRESETS.map(([label, lo, hi]) => `<a href="${url.all}?min=${lo}&max=${hi}">${label}</a>`).join('')}</p>
          </div>
        </div>
      </section>

      <section class="lr-section lr-wrap" aria-labelledby="quoteTitle">
        <p class="lr-label">05 &mdash; Owners</p>
        <h2 id="quoteTitle" class="lr-visually-hidden">What owners say</h2>
        <div class="lr-rotator" id="rotator" aria-live="polite">
          ${quotes.map(({ p, r }, i) => `<figure class="lr-rquote${i === 0 ? ' is-on' : ''}"${i ? ' hidden' : ''}><blockquote><p>&ldquo;${esc(r.body)}&rdquo;</p></blockquote><figcaption><span>${esc(r.name)}${r.vehicle ? `, ${esc(r.vehicle)}` : ''}</span><a href="${url.product(p)}">${esc(title(p))}</a></figcaption></figure>`).join('')}
        </div>
        <div class="lr-rotator-dots" role="group" aria-label="Choose a quote">${quotes.map((q, i) => `<button type="button" data-quote="${i}" aria-label="Quote ${i + 1}" aria-pressed="${i === 0}"${i === 0 ? ' class="is-on"' : ''}><span></span></button>`).join('')}</div>
      </section>`,
      after() {
        bindRange('homeRange', (lo, hi) => {
          const n = P.filter((p) => inRange(p, lo, hi)).length;
          document.getElementById('homeRangeLabel').textContent = rangeLabel(lo, hi);
          const go = document.getElementById('homeRangeGo');
          go.href = `${url.all}?min=${lo}&max=${hi}`;
          go.textContent = n ? `Show ${n} piece${n === 1 ? '' : 's'}` : 'No pieces in this range';
        });
        document.getElementById('homeRangeMin').dispatchEvent(new Event('input'));
        const figs = $$('#rotator .lr-rquote');
        const dots = $$('[data-quote]');
        let i = 0;
        const show = (n) => {
          i = (n + figs.length) % figs.length;
          figs.forEach((f, k) => { f.hidden = k !== i; f.classList.toggle('is-on', k === i); });
          dots.forEach((d, k) => { d.classList.toggle('is-on', k === i); d.setAttribute('aria-pressed', String(k === i)); });
        };
        dots.forEach((d) => d.addEventListener('click', () => { show(Number(d.dataset.quote)); stop(); }));
        let timer = null;
        const stop = () => { clearInterval(timer); timer = null; };
        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) timer = setInterval(() => show(i + 1), 7000);
        const rot = document.getElementById('rotator');
        rot.addEventListener('mouseenter', stop);
        rot.addEventListener('focusin', stop);
      },
    };
  };

  // ------------------------------------------------------------------ shop (collection): gallery or index, price range
  const SORTS = { featured: 'Featured', 'price-asc': 'Price ↑', 'price-desc': 'Price ↓', new: 'New' };
  function sortList(list, sort) {
    const out = list.slice();
    if (sort === 'price-asc') out.sort((a, b) => price(a) - price(b));
    if (sort === 'price-desc') out.sort((a, b) => price(b) - price(a));
    if (sort === 'new') out.sort((a, b) => Number(b.isNew) - Number(a.isNew));
    if (sort === 'featured') out.sort((a, b) => Number(b.best) - Number(a.best) || Number(b.stock > 0) - Number(a.stock > 0));
    return out;
  }

  PAGES.collection = () => {
    const state = {
      category: catById(params.get('category')) ? params.get('category') : '',
      min: clampRange(params.get('min'), RANGE.lo),
      max: clampRange(params.get('max'), RANGE.hi),
      sort: SORTS[params.get('sort')] ? params.get('sort') : 'featured',
      view: params.get('view') === 'index' ? 'index' : params.get('view') === 'gallery' ? 'gallery' : (store.get('lr_preview_view', 'gallery') === 'index' ? 'index' : 'gallery'),
    };
    if (state.min > state.max - RANGE.step) { state.min = RANGE.lo; state.max = RANGE.hi; }
    const c = catById(state.category);
    return {
      title: c ? c.name : 'The collection',
      html: `<div class="lr-wrap">
        ${crumbs([['Home', url.home], ['Collection']])}
        <header class="lr-page-head">
          <p class="lr-label" id="colLabel">${c ? `${two(CAT.categories.indexOf(c) + 1)} &mdash; ${esc(c.single)}` : 'The collection'}</p>
          <h1 class="lr-page-title" id="colTitle">${esc(c ? c.name : 'All pieces')}</h1>
          <p class="lr-muted" id="colBlurb">${esc(c ? c.blurb : 'Every LR-CO piece. Narrow it by type and price, or switch to the index for the whole list at a glance.')}</p>
        </header>
        <nav class="lr-tabs" aria-label="Part types" id="colTabs">
          <button type="button" data-cat="" aria-pressed="false">All <span>${P.length}</span></button>
          ${CAT.categories.map((x) => `<button type="button" data-cat="${x.id}" aria-pressed="false">${esc(x.name)} <span>${P.filter((p) => p.category === x.id).length}</span></button>`).join('')}
        </nav>
        <div class="lr-shopbar">
          <div class="lr-shop-range">
            <div class="lr-shop-range-head"><span class="lr-label">Price</span><b id="rangeLabel">${rangeLabel(state.min, state.max)}</b></div>
            ${rangeSlider('shopRange', state.min, state.max)}
          </div>
          <div class="lr-shop-ctrl">
            <div class="lr-sorts" role="group" aria-label="Sort">${Object.entries(SORTS).map(([k, v]) => `<button type="button" data-sort="${k}" aria-pressed="false">${esc(v)}</button>`).join('')}</div>
            <div class="lr-views" role="group" aria-label="View"><button type="button" data-view="gallery" aria-pressed="false">Gallery</button><button type="button" data-view="index" aria-pressed="false">Index</button></div>
          </div>
        </div>
        <p class="lr-count" id="colCount" aria-live="polite"></p>
        <div id="colResults"></div>
      </div>`,
      after() {
        const results = document.getElementById('colResults');
        const draw = () => {
          let list = P.filter((p) => (!state.category || p.category === state.category) && inRange(p, state.min, state.max));
          list = sortList(list, state.sort);
          const cc = catById(state.category);
          document.getElementById('colTitle').textContent = cc ? cc.name : 'All pieces';
          document.getElementById('colLabel').innerHTML = cc ? `${two(CAT.categories.indexOf(cc) + 1)} &mdash; ${esc(cc.single)}` : 'The collection';
          document.getElementById('colBlurb').textContent = cc ? cc.blurb : 'Every LR-CO piece. Narrow it by type and price, or switch to the index for the whole list at a glance.';
          document.title = `${cc ? cc.name : 'The collection'} | ${BRAND}`;
          document.getElementById('rangeLabel').textContent = rangeLabel(state.min, state.max);
          $$('[data-cat]').forEach((b) => { const on = b.dataset.cat === state.category; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on)); });
          $$('[data-sort]').forEach((b) => { const on = b.dataset.sort === state.sort; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on)); });
          $$('[data-view]').forEach((b) => { const on = b.dataset.view === state.view; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on)); });
          document.getElementById('colCount').innerHTML = `Showing <b>${list.length}</b> of ${P.length}`;
          if (!list.length) {
            results.innerHTML = `<div class="lr-empty"><p class="lr-label">Nothing here</p><h2>No pieces in this range.</h2><p>Widen the price range or choose another type.</p><button class="lr-btn lr-btn-line" type="button" data-reset>Reset</button></div>`;
          } else if (state.view === 'index') {
            results.innerHTML = `<div class="lr-index" role="table" aria-label="Index of pieces">
              <div class="lr-irow lr-ihead" role="row"><span role="columnheader">No.</span><span role="columnheader">Piece</span><span role="columnheader">Type</span><span role="columnheader">Part no.</span><span role="columnheader">Price</span></div>
              ${list.map((p, i) => `<div class="lr-irow${p.stock <= 0 ? ' is-out' : ''}" role="row" data-float="${p.id}"><span role="cell" class="lr-ino">${two(i + 1)}</span><span role="cell" class="lr-ititle"><a href="${url.product(p)}">${esc(title(p))}</a>${p.stock <= 0 ? ' <em>Sold out</em>' : ''}</span><span role="cell" class="lr-itype">${esc(p.categoryName)}</span><span role="cell" class="lr-isku">${esc(p.sku)}</span><span role="cell" class="lr-iprice">${money(price(p))}</span></div>`).join('')}
            </div>`;
          } else {
            results.innerHTML = `<div class="lr-gallery">${list.map((p, i) => card(p, i)).join('')}</div>`;
          }
          const q = new URLSearchParams();
          if (state.category) q.set('category', state.category);
          if (state.min > RANGE.lo) q.set('min', state.min);
          if (state.max < RANGE.hi) q.set('max', state.max);
          if (state.sort !== 'featured') q.set('sort', state.sort);
          if (state.view === 'index') q.set('view', 'index');
          if (params.get('checkout')) q.set('checkout', params.get('checkout'));
          try { window.history.replaceState(null, '', `${window.location.pathname}${q.toString() ? `?${q}` : ''}`); } catch (e) { /* ignore */ }
        };
        const range = bindRange('shopRange', (lo, hi) => { state.min = lo; state.max = hi; draw(); });
        document.querySelector('.lr-main').addEventListener('click', (e) => {
          const cat = e.target.closest('[data-cat]');
          const sort = e.target.closest('[data-sort]');
          const view = e.target.closest('[data-view]');
          if (cat) { state.category = cat.dataset.cat; draw(); }
          if (sort) { state.sort = sort.dataset.sort; draw(); }
          if (view) { state.view = view.dataset.view; store.set('lr_preview_view', state.view); draw(); }
          if (e.target.closest('[data-reset]')) { state.category = ''; range.set(RANGE.lo, RANGE.hi); }
        });
        // Index rows: a picture follows the cursor (mouse only). Touch just follows the link.
        const float = document.getElementById('lrFloat');
        results.addEventListener('mousemove', (e) => {
          if (!finePointer()) return;
          const row = e.target.closest('[data-float]');
          if (!row) { float.classList.remove('is-on'); return; }
          if (float.dataset.id !== row.dataset.float) { float.dataset.id = row.dataset.float; float.innerHTML = art(byId(row.dataset.float)); }
          float.style.transform = `translate(${e.clientX + 24}px, ${e.clientY - 90}px)`;
          float.classList.add('is-on');
        });
        results.addEventListener('mouseleave', () => float.classList.remove('is-on'));
        draw();
      },
    };
  };

  // ------------------------------------------------------------------ search: filters live as you type
  const SUGGEST = ['Header', 'Downpipe', 'Intake', 'Test pipe', 'Flange', 'Civic', 'HDR-1001'];
  PAGES.search = () => {
    const state = { q: (params.get('q') || '').trim(), type: '' };
    return {
      title: state.q ? `Search: ${state.q}` : 'Search',
      html: `<div class="lr-wrap lr-search-page">
        ${crumbs([['Home', url.home], ['Search']])}
        <form class="lr-search-field" role="search" action="${BASE}/search/" method="get">
          <label class="lr-label" for="searchQ">Search the collection</label>
          <input id="searchQ" name="q" type="search" value="${esc(state.q)}" placeholder="Part type, model or part number" autocomplete="off" autofocus>
        </form>
        <p class="lr-count" id="searchCount" aria-live="polite"></p>
        <div class="lr-search-grid">
          <nav class="lr-facets" id="facets" aria-label="Filter results by type"></nav>
          <div id="searchResults"></div>
        </div>
      </div>`,
      after() {
        const input = document.getElementById('searchQ');
        const draw = () => {
          const found = searchProducts(state.q);
          const types = CAT.categories.map((c) => [c, found.filter((p) => p.category === c.id).length]).filter(([, n]) => n);
          if (state.type && !types.some(([c]) => c.id === state.type)) state.type = '';
          const list = found.filter((p) => !state.type || p.category === state.type);
          document.title = `${state.q ? `Search: ${state.q}` : 'Search'} | ${BRAND}`;
          document.getElementById('searchCount').innerHTML = state.q ? `<b>${found.length}</b> result${found.length === 1 ? '' : 's'} for &ldquo;${esc(state.q)}&rdquo;` : '';
          document.getElementById('facets').innerHTML = found.length ? `<p class="lr-label">Type</p><button type="button" data-type="" aria-pressed="${!state.type}"${!state.type ? ' class="is-on"' : ''}>All <span>${found.length}</span></button>${types.map(([c, n]) => `<button type="button" data-type="${c.id}" aria-pressed="${state.type === c.id}"${state.type === c.id ? ' class="is-on"' : ''}>${esc(c.name)} <span>${n}</span></button>`).join('')}` : '';
          document.getElementById('facets').hidden = !found.length;
          const res = document.getElementById('searchResults');
          if (!state.q) {
            res.innerHTML = `<div class="lr-empty lr-empty-left"><h2>Start typing.</h2><p>Results appear as you type. Try one of these:</p><p class="lr-suggest">${SUGGEST.map((s) => `<button type="button" data-suggest="${esc(s)}">${esc(s)}</button>`).join('')}</p></div>`;
            return;
          }
          if (!found.length) {
            res.innerHTML = `<div class="lr-empty lr-empty-left"><h2>Nothing matches &ldquo;${esc(state.q)}&rdquo;.</h2><p>Try a part type, a model or a part number:</p><p class="lr-suggest">${SUGGEST.map((s) => `<button type="button" data-suggest="${esc(s)}">${esc(s)}</button>`).join('')}</p></div><div class="lr-section-head lr-section-head-tight"><h2>Most chosen</h2></div>${grid(P.filter((p) => p.best).slice(0, 3))}`;
            return;
          }
          res.innerHTML = `<ol class="lr-results">${list.map((p, i) => `<li class="lr-result${p.stock <= 0 ? ' is-out' : ''}">
            <span class="lr-result-no">${two(i + 1)}</span>
            <a class="lr-result-art" href="${url.product(p)}" tabindex="-1" aria-hidden="true">${art(p)}</a>
            <div class="lr-result-info"><a class="lr-result-title" href="${url.product(p)}">${highlight(title(p), state.q)}</a><p>${highlight(p.sku, state.q)} &middot; ${esc(p.categoryName)} &middot; ${p.universal ? 'Universal fit' : `Fits ${esc(fitText(p))}`}${p.stock <= 0 ? ' &middot; <b>Sold out</b>' : ''}</p></div>
            <div class="lr-result-buy">${priceTag(price(p))}${p.stock > 0 ? `<button class="lr-add-link" type="button" data-add="${p.id}" aria-label="Add ${esc(title(p))} to bag">+ Add</button>` : ''}</div>
          </li>`).join('')}</ol>`;
        };
        const sync = () => {
          state.q = input.value.trim();
          try { window.history.replaceState(null, '', `${window.location.pathname}${state.q ? `?q=${encodeURIComponent(state.q)}` : ''}`); } catch (e) { /* ignore */ }
          draw();
        };
        input.addEventListener('input', sync);
        input.form.addEventListener('submit', (e) => { e.preventDefault(); sync(); input.blur(); });
        document.querySelector('.lr-search-page').addEventListener('click', (e) => {
          const t = e.target.closest('[data-type]');
          const s = e.target.closest('[data-suggest]');
          if (t) { state.type = t.dataset.type; draw(); }
          if (s) { input.value = s.dataset.suggest; sync(); input.focus(); }
        });
        if (!isPhone() || !state.q) setTimeout(() => { input.focus(); const n = input.value.length; try { input.setSelectionRange(n, n); } catch (e) { /* type=search */ } }, 30);
        draw();
      },
    };
  };

  // ------------------------------------------------------------------ product
  const COMPLEMENTS = {
    header: ['header-install-kit', 'o2-spacer-90-pair', 'flange-3-bolt-3in'],
    downpipe: ['flange-3-bolt-3in', 'o2-spacer-90-pair', 'header-install-kit'],
    'test-pipe': ['resonator-3in', 'slant-tip-3-4', 'o2-spacer-90-pair'],
    'cold-air-intake': ['slant-tip-3-4', 'resonator-3in', 'header-install-kit'],
    'cnc-part': ['header-install-kit', 'o2-spacer-90-pair', 'flange-3-bolt-3in'],
    'more-products': ['slant-tip-3-4', 'header-install-kit', 'resonator-3in'],
  };
  const isOffroad = (p) => p.category === 'downpipe' || p.category === 'test-pipe';

  function describe(p) {
    const c = catById(p.category);
    const where = p.universal ? 'a wide range of builds' : p.fits.map((f) => `the ${f.from}–${f.to} ${f.make} ${f.model}`).join(' and the ');
    const lines = {
      header: `Made for ${where} with the ${p.engine}. Equal-length primaries, a collector shaped for an even note, and a flange cut flat so it seals the first time.`,
      downpipe: `A full 3" path off the turbo for ${where} with the ${p.engine}. Quicker spool and a deeper note. A tune is part of the job.`,
      'test-pipe': `Straight-through pipe that replaces the factory section on ${where}. For off-road and competition use only.`,
      'cold-air-intake': `Draws cooler air from outside the engine bay through a washable filter. Made for ${where} with the ${p.engine}.`,
      'cnc-part': `Machined flat and true from solid stock, so it seals without fuss. Fits ${where}.`,
      'more-products': `A small part that finishes the job properly. Works on ${where}.`,
    };
    return `<p class="lr-lead">${esc(lines[p.category] || c.blurb)}</p><p>${esc(c.blurb)} Every piece is inspected before it ships and carries a ${esc(p.warranty)} warranty against defects such as cracked welds and warped flanges.</p>`;
  }

  PAGES.product = () => {
    const p = byId(params.get('p'));
    if (!p) {
      return { title: 'Piece not found', html: `<div class="lr-wrap"><div class="lr-empty"><p class="lr-label">404</p><h1>This piece isn't here.</h1><p>It may have moved. The whole collection is one step away.</p><a class="lr-btn lr-btn-copper" href="${url.all}">Enter the collection</a></div></div>` };
    }
    const c = catById(p.category);
    const out = p.stock <= 0;
    const reviews = CAT.reviewsFor(p);
    const reviewCard = (r) => `<article class="lr-review"><div class="lr-review-top">${stars(r.rating)}<b>${esc(r.title)}</b></div><p>${esc(r.body)}</p><p class="lr-review-by">${esc(r.name)}${r.vehicle ? ` &middot; ${esc(r.vehicle)}` : ''} &middot; ${niceDate(r.date)}${r.verified ? ' &middot; Verified buyer' : ''}</p></article>`;
    const set = (COMPLEMENTS[p.category] || []).filter((id) => id !== p.id).map(byId);
    const views = [['main', 'Front'], ['flip', 'Reverse'], ['detail', 'Detail'], ['box', 'In the box']];
    const sheet = { 'Part number': p.sku, Type: c.single, ...p.specs, Fits: p.universal ? 'Universal' : fitText(p) };
    return {
      title: title(p),
      html: `<div class="lr-wrap">
        ${crumbs([['Home', url.home], [c.name, url.cat(c.id)], [p.sku]])}
        <div class="lr-pdp">
          <div class="lr-viewer">
            <button class="lr-stage" type="button" id="stage" aria-label="Open the pictures full screen">
              <span id="stageArt">${art(p)}</span>
              <span class="lr-lens" id="lens" aria-hidden="true"><span id="lensInner"></span></span>
              <span class="lr-stage-hint" aria-hidden="true">${icon('expand')}<span>Full screen</span></span>
            </button>
            <div class="lr-film">
              <button class="lr-textbtn" type="button" data-film="-1" aria-label="Previous picture">${icon('back')}</button>
              <span class="lr-film-count" id="filmCount" aria-live="polite">01 / 04</span>
              <button class="lr-textbtn" type="button" data-film="1" aria-label="Next picture">${icon('chev')}</button>
              <div class="lr-film-thumbs" role="group" aria-label="Pictures">${views.map(([v, label], i) => `<button type="button" class="lr-thumb${i === 0 ? ' is-on' : ''}" data-view="${i}" aria-pressed="${i === 0}" aria-label="${label}"><span>${two(i + 1)}</span>${art(p, v)}</button>`).join('')}</div>
            </div>
          </div>
          <div class="lr-buy">
            <p class="lr-label"><a href="${url.cat(c.id)}">${esc(c.name)}</a> &middot; ${esc(p.sku)}${p.isNew ? ' &middot; New' : ''}</p>
            <h1 class="lr-buy-title">${esc(title(p))}</h1>
            <p class="lr-buy-price">${priceTag(price(p), 'lr-price-xl')}</p>
            <p class="lr-buy-rating"><a href="#reviews">${stars(p.rating)}<span>${p.rating} &middot; ${p.reviewCount} reviews</span></a></p>
            <dl class="lr-buy-facts">
              <div><dt>${p.universal ? 'Fit' : 'Fits'}</dt><dd>${p.universal ? 'Universal. Check the sizes in the specification.' : `${esc(fitText(p))}<br><span>${esc(p.engine)}</span>`}</dd></div>
              <div><dt>Availability</dt><dd class="lr-stock${out ? ' is-out' : p.stock < 10 ? ' is-low' : ''}">${out ? 'Sold out' : p.stock < 10 ? `Only ${p.stock} left` : 'In stock, ready to ship'}</dd></div>
              <div><dt>Warranty</dt><dd>${esc(p.warranty)}, replacement first</dd></div>
            </dl>
            <a class="lr-textlink lr-askfit" href="${url.page('contact')}">Not certain it fits? Ask us.</a>
            ${out ? `<div class="lr-notify"><p class="lr-label">Notify me</p><p>One email when it returns. It doesn't hold a piece for you.</p><form class="lr-inline-form" id="notifyForm" novalidate><label class="lr-visually-hidden" for="notifyEmail">Email for a restock note</label><input id="notifyEmail" type="email" placeholder="Email address"><button class="lr-btn lr-btn-line" type="submit">Notify me</button></form><p class="lr-form-msg" id="notifyMsg" role="status"></p></div>` : `
            <div class="lr-qty" role="group" aria-label="Quantity"><span class="lr-label">Quantity</span><div class="lr-qty-btns">${[1, 2, 3, 4, 5].map((n) => `<button type="button" data-qty="${n}" aria-pressed="${n === 1}"${n === 1 ? ' class="is-on"' : ''}>${n}</button>`).join('')}</div></div>
            <div class="lr-buy-actions" id="buyActions">
              <button class="lr-btn lr-btn-copper lr-btn-lg" type="button" id="pdpAdd">Add to bag &mdash; ${money(price(p))}</button>
              <a class="lr-added" id="pdpAdded" href="${url.page('cart')}" hidden>${icon('check')}<span>Added &mdash; View bag</span></a>
            </div>
            <div class="lr-buy-row2"><button class="lr-btn lr-btn-line" type="button" id="pdpBuy">Buy now</button>${wishButton(p)}</div>`}
            ${isOffroad(p) ? `<p class="lr-legal">Off-road and competition use only. Not legal for street use in California or states with similar emissions laws. <a href="${url.page('vcw')}">Read the waiver</a>.</p>` : ''}
          </div>
        </div>

        <section class="lr-psec" aria-labelledby="s1"><h2 id="s1"><span>01</span>Overview</h2><div class="lr-psec-body"><div class="lr-prose">${describe(p)}</div><div class="lr-inbox"><p class="lr-label">In the box</p><ul>${p.inBox.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div></div></section>
        <section class="lr-psec" aria-labelledby="s2"><h2 id="s2"><span>02</span>Specification</h2><div class="lr-psec-body"><dl class="lr-sheet">${Object.entries(sheet).map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl></div></section>
        <section class="lr-psec" aria-labelledby="s3"><h2 id="s3"><span>03</span>Delivery &amp; returns</h2><div class="lr-psec-body lr-cols3">
          <div><p class="lr-label">Delivery</p><p>Complimentary in the lower 48 states on orders of $${FREE_SHIP} or more, otherwise $${SHIP_FLAT}. Alaska and Hawaii $${SHIP_ZONES.akhi[1]}, Canada $${SHIP_ZONES.ca[1]}, other countries $${SHIP_ZONES.intl[1]}. Tracked, always.</p><a class="lr-textlink" href="${url.page('shipping')}">Delivery details</a></div>
          <div><p class="lr-label">Returns</p><p>Unused and uninstalled, within ${RETURN_DAYS} days of delivery, with a prepaid label. Refunds to card carry a 5% restocking fee; store credit carries none.</p><a class="lr-textlink" href="${url.page('refund')}">Return policy</a></div>
          <div><p class="lr-label">Warranty</p><p>${esc(p.warranty)} against defects such as cracked welds or warped flanges, for the original buyer. We replace first.</p><a class="lr-textlink" href="${url.page('warranty')}">Warranty</a></div>
        </div></section>
        <section class="lr-psec" id="reviews" aria-labelledby="s4"><h2 id="s4"><span>04</span>Reviews</h2><div class="lr-psec-body">
          <div class="lr-revhead"><p class="lr-score"><b>${p.rating}</b>${stars(p.rating)}<span>${p.reviewCount} reviews</span></p><button class="lr-textbtn" type="button" id="writeReview">Write a review</button></div>
          <p class="lr-form-msg" id="reviewMsg" role="status"></p>
          <div class="lr-review-main"><div class="lr-review-tools"><p class="lr-review-count" id="revCount"></p><label class="lr-select"><span>Sort</span><select id="revSort"><option value="new">Most recent</option><option value="high">Highest rated</option><option value="low">Lowest rated</option></select></label></div><div class="lr-review-list" id="revList"></div><div class="lr-review-more"><button class="lr-btn lr-btn-line" type="button" id="revMore"></button><button class="lr-btn lr-btn-line" type="button" id="revAll"></button></div></div>
        </div></section>
        ${set.length ? `<section class="lr-section" aria-labelledby="setTitle"><div class="lr-section-head"><div><p class="lr-label">05 &mdash; Complete the set</p><h2 id="setTitle">Made to go with it</h2></div></div>${grid(set)}</section>` : ''}
      </div>`,
      after() {
        let view = 0;
        const stageArt = document.getElementById('stageArt');
        const setView = (i) => {
          view = (i + views.length) % views.length;
          stageArt.innerHTML = art(p, views[view][0]);
          document.getElementById('filmCount').textContent = `${two(view + 1)} / ${two(views.length)}`;
          $$('.lr-thumb').forEach((t, k) => { t.classList.toggle('is-on', k === view); t.setAttribute('aria-pressed', String(k === view)); });
        };
        $$('[data-film]').forEach((b) => b.addEventListener('click', () => setView(view + Number(b.dataset.film))));
        $$('.lr-thumb').forEach((t) => t.addEventListener('click', () => setView(Number(t.dataset.view))));
        // Magnifier lens (mouse only) and full-screen lightbox.
        const stage = document.getElementById('stage');
        const lens = document.getElementById('lens');
        const inner = document.getElementById('lensInner');
        const Z = 2.4;
        stage.addEventListener('mousemove', (e) => {
          if (!finePointer()) return;
          const r = stage.getBoundingClientRect();
          const x = e.clientX - r.left;
          const y = e.clientY - r.top;
          const R = lens.offsetWidth / 2 || 80;
          if (inner.dataset.v !== String(view) || inner.dataset.w !== String(r.width)) { inner.innerHTML = art(p, views[view][0]); inner.dataset.v = String(view); inner.dataset.w = String(r.width); inner.style.width = `${r.width * Z}px`; inner.style.height = `${r.height * Z}px`; }
          lens.style.transform = `translate(${x - R}px, ${y - R}px)`;
          inner.style.transform = `translate(${-(x * Z - R)}px, ${-(y * Z - R)}px)`;
          stage.classList.add('is-zoom');
        });
        stage.addEventListener('mouseleave', () => stage.classList.remove('is-zoom'));
        stage.addEventListener('click', () => { stage.classList.remove('is-zoom'); lb.onStep = setView; openLightbox(p, views, view); });
        const qtyBtns = $$('[data-qty]');
        let qty = 1;
        qtyBtns.forEach((b) => b.addEventListener('click', () => { qty = Number(b.dataset.qty); qtyBtns.forEach((x) => { x.classList.toggle('is-on', x === b); x.setAttribute('aria-pressed', String(x === b)); }); }));
        const add = document.getElementById('pdpAdd');
        if (add) {
          const added = document.getElementById('pdpAdded');
          add.addEventListener('click', () => {
            addToCart(p.id, qty, true);
            add.hidden = true;
            added.hidden = false;
            $('span', added).textContent = `Added ${qty > 1 ? `${qty} ` : ''}— View bag`;
            added.focus();
            clearTimeout(add.t);
            add.t = setTimeout(() => { const back = document.activeElement === added; added.hidden = true; add.hidden = false; if (back) add.focus(); }, 4000);
          });
          document.getElementById('pdpBuy').addEventListener('click', () => { cart.add(p.id, qty); window.location.href = url.page('checkout') + (params.get('checkout') ? `?checkout=${encodeURIComponent(params.get('checkout'))}` : ''); });
        }
        const notify = document.getElementById('notifyForm');
        if (notify) notify.addEventListener('submit', (e) => {
          e.preventDefault();
          const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(document.getElementById('notifyEmail').value.trim());
          const msg = document.getElementById('notifyMsg');
          msg.textContent = ok ? 'Noted. One email when it returns. (Preview: nothing was sent.)' : 'Enter a valid email address.';
          msg.className = `lr-form-msg ${ok ? 'is-ok' : 'is-bad'}`;
        });
        // Every review can be read: a page at a time, or all at once.
        CAT.pageReviews({ reviews: reviews, card: reviewCard, list: document.getElementById('revList'), count: document.getElementById('revCount'), more: document.getElementById('revMore'), all: document.getElementById('revAll'), sort: document.getElementById('revSort') });
        document.getElementById('writeReview').addEventListener('click', () => {
          const msg = document.getElementById('reviewMsg');
          msg.textContent = 'We email a review link 7 days after delivery. We read every review before it is published, good or bad. (Preview)';
          msg.className = 'lr-form-msg is-ok';
        });
      },
    };
  };

  function totals(lines, zone = 'us', discount = 0, credit = 0) {
    const sub = lines.reduce((a, l) => a + price(byId(l.id)) * l.qty, 0);
    const off = Math.round(sub * discount * 100) / 100;
    const ship = lines.length ? shipFor(zone, sub - off) : 0;
    const before = sub - off + ship;
    const used = Math.min(credit, before);
    return { sub, off, ship, tax: 0, credit: used, total: Math.round((before - used) * 100) / 100 };
  }
  // When CFOODS can't confirm stock, browsing stays up and checkout pauses. Preview it with ?checkout=paused.
  const checkoutPaused = () => params.get('checkout') === 'paused';
  const pausedNote = () => `<div class="lr-paused" role="status">${icon('clock')}<div><b>Checkout is paused for a few minutes.</b><span>Your cart is saved and you can keep browsing. Try again shortly.</span></div></div>`;

  // LR-CO's bag: a typographic list with typed quantities.
  PAGES.cart = () => {
    let busy = false; // removing a focused quantity box fires 'change' again; ignore that echo
    const draw = () => {
      if (busy) return;
      busy = true;
      try { drawBag(); } finally { busy = false; }
    };
    const drawBag = () => {
      const lines = cart.read();
      const holder = document.getElementById('cartHolder');
      if (!lines.length) {
        holder.innerHTML = `<div class="lr-empty lr-empty-left"><h2>Your bag is empty.</h2><p>Nothing chosen yet. The collection is one step away.</p><div class="lr-empty-actions"><a class="lr-btn lr-btn-copper" href="${url.all}">Enter the collection</a><a class="lr-btn lr-btn-line" href="${url.page('search')}">Search</a></div></div>
          <section class="lr-section"><div class="lr-section-head"><div><p class="lr-label">Most chosen</p><h2>Start here</h2></div></div>${grid(P.filter((p) => p.best).slice(0, 3))}</section>`;
        return;
      }
      const t = totals(lines);
      holder.innerHTML = `<div class="lr-bag">
        <div class="lr-bag-main">
          <div class="lr-bag-head" aria-hidden="true"><span>Piece</span><span>Quantity</span><span>Total</span></div>
          <ol class="lr-lines">${lines.map((l, i) => { const p = byId(l.id); return `<li class="lr-line">
            <span class="lr-line-no">${two(i + 1)}</span>
            <a class="lr-line-art" href="${url.product(p)}" tabindex="-1" aria-hidden="true">${art(p)}</a>
            <div class="lr-line-info">
              <a class="lr-line-title" href="${url.product(p)}">${esc(title(p))}</a>
              <p>${esc(p.sku)} &middot; ${money(price(p))} each${isOffroad(p) ? ' &middot; Off-road use' : ''}</p>
              <button class="lr-textbtn lr-line-rm" type="button" data-remove="${p.id}" aria-label="Remove ${esc(title(p))}">Remove</button>
            </div>
            <div class="lr-qtyin" role="group" aria-label="Quantity for ${esc(title(p))}">
              <button class="lr-textbtn" type="button" data-bump="${p.id}" data-d="-1" aria-label="One fewer"${l.qty <= 1 ? ' disabled' : ''}>&minus;</button>
              <input type="text" inputmode="numeric" value="${l.qty}" data-qtyin="${p.id}" aria-label="Quantity" maxlength="2">
              <button class="lr-textbtn" type="button" data-bump="${p.id}" data-d="1" aria-label="One more"${l.qty >= 20 ? ' disabled' : ''}>+</button>
            </div>
            <strong class="lr-line-total">${money(price(p) * l.qty)}</strong>
          </li>`; }).join('')}</ol>
          ${shipProgress(t.sub)}
        </div>
        <aside class="lr-summary" aria-label="Order summary">
          <p class="lr-label">Summary</p>
          <dl>
            <div><dt>Subtotal, ${cart.count()} piece${cart.count() === 1 ? '' : 's'}</dt><dd>${money(t.sub)}</dd></div>
            <div><dt>Delivery, lower 48</dt><dd>${t.ship ? money(t.ship) : 'Complimentary'}</dd></div>
            <div><dt>Sales tax</dt><dd>${money(0)}</dd></div>
            <div class="lr-total"><dt>Total</dt><dd>${money(t.total)}</dd></div>
          </dl>
          <p class="lr-small lr-muted">Alaska, Hawaii, Canada and other countries are priced at checkout.</p>
          ${checkoutPaused() ? `${pausedNote()}<button class="lr-btn lr-btn-copper lr-btn-lg lr-btn-block" type="button" disabled>Checkout paused</button>` : `<a class="lr-btn lr-btn-copper lr-btn-lg lr-btn-block" href="${url.page('checkout')}">Checkout</a>`}
          <p class="lr-pay-ways" aria-label="Ways to pay"><span>Card</span><span>Apple Pay</span><span>Google Pay</span><span>Link</span></p>
          <a class="lr-textlink" href="${url.all}">Continue shopping</a>
        </aside>
      </div>`;
    };
    return {
      title: 'Bag',
      html: `<div class="lr-wrap lr-cart-page">${crumbs([['Home', url.home], ['Bag']])}<h1 class="lr-page-title">Bag</h1><div id="cartHolder"></div></div>`,
      after() {
        draw();
        const holder = document.getElementById('cartHolder');
        holder.addEventListener('click', (e) => {
          const bump = e.target.closest('[data-bump]');
          const rm = e.target.closest('[data-remove]');
          if (bump) {
            const line = cart.read().find((l) => l.id === bump.dataset.bump);
            if (line) { cart.setQty(line.id, line.qty + Number(bump.dataset.d)); draw(); const again = $(`[data-bump="${line.id}"][data-d="${bump.dataset.d}"]`); if (again && !again.disabled) again.focus(); }
          }
          if (rm) { const t0 = title(byId(rm.dataset.remove)); cart.remove(rm.dataset.remove); draw(); toast(`Removed: ${t0}`); }
        });
        holder.addEventListener('change', (e) => {
          const box = e.target.closest('[data-qtyin]');
          if (!box || busy) return;
          const n = parseInt(box.value, 10);
          if (!Number.isFinite(n) || n < 1) { cart.remove(box.dataset.qtyin); toast('Removed from your bag'); } else cart.setQty(box.dataset.qtyin, n);
          draw();
        });
        holder.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.matches('[data-qtyin]')) { e.preventDefault(); e.target.blur(); } });
        onCartChange = draw;
      },
    };
  };

  const STATES = 'AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY'.split(' ');
  const COUNTRIES = [['US', 'United States'], ['CA', 'Canada'], ['AU', 'Australia'], ['DE', 'Germany'], ['JP', 'Japan'], ['MX', 'Mexico'], ['NZ', 'New Zealand'], ['SE', 'Sweden'], ['GB', 'United Kingdom']];
  const zoneOf = (country, st) => (country === 'US' ? (st === 'AK' || st === 'HI' ? 'akhi' : 'us') : country === 'CA' ? 'ca' : 'intl');
  const zoneLabel = (zone) => (SHIP_ZONES[zone] || SHIP_ZONES.us)[0];
  const signedInUser = () => store.session('lr_preview_user');
  const CREDIT_BALANCE = 15; // sample store credit for the signed-in preview account (see the account ledger)

  // LR-CO's checkout: one scrolling form with a progress rail that fills in as each section becomes valid.
  PAGES.checkout = () => {
    const lines = cart.read();
    if (!lines.length) {
      return { title: 'Checkout', chrome: 'checkout', html: `<div class="lr-wrap"><div class="lr-empty"><h1>Your bag is empty.</h1><p>Choose a piece before checking out.</p><a class="lr-btn lr-btn-copper" href="${url.all}">Enter the collection</a></div></div>` };
    }
    if (checkoutPaused()) {
      return { title: 'Checkout', chrome: 'checkout', html: `<div class="lr-wrap lr-paused-page">${pausedNote()}<p>Nothing was charged. <a href="${url.page('cart')}">Return to your bag</a> or <a href="${url.all}">continue shopping</a>.</p></div>` };
    }
    const user = signedInUser();
    const offroad = lines.map((l) => byId(l.id)).filter(isOffroad);
    const state = { zone: 'us', country: 'US', discount: 0, code: '', useCredit: false };
    const field = (id, label, type = 'text', extra = '') => `<label class="lr-field" for="${id}"><span>${label}</span><span class="lr-field-box"><input id="${id}" name="${id}" type="${type}" ${extra}><i class="lr-field-ok" aria-hidden="true">${icon('check')}</i></span><em class="lr-field-err" id="${id}Err"></em></label>`;
    const drawSummary = () => {
      const t = totals(lines, state.zone, state.discount, state.useCredit ? CREDIT_BALANCE : 0);
      document.getElementById('coSummaryBody').innerHTML = `
        <ul class="lr-co-lines">${lines.map((l) => { const p = byId(l.id); return `<li><span class="lr-co-art">${art(p)}</span><span>${esc(title(p))}<small>${esc(p.sku)} &middot; Qty ${l.qty}</small></span><b>${money(price(p) * l.qty)}</b></li>`; }).join('')}</ul>
        <form class="lr-code" id="codeForm" novalidate><label class="lr-visually-hidden" for="code">Discount code</label><input id="code" placeholder="Discount code" value="${esc(state.code)}" autocomplete="off"><button class="lr-btn lr-btn-line lr-btn-sm" type="submit">Apply</button></form>
        <p class="lr-form-msg${state.discount ? ' is-ok' : ''}" id="codeMsg" role="status">${state.discount ? `Code ${esc(state.code)} applied: ${state.discount * 100}% off` : ''}</p>
        <dl>
          <div><dt>Subtotal</dt><dd>${money(t.sub)}</dd></div>
          ${t.off ? `<div class="lr-discount"><dt>Discount</dt><dd>&minus;${money(t.off)}</dd></div>` : ''}
          <div><dt>Delivery, ${esc(zoneLabel(state.zone))}</dt><dd>${t.ship ? money(t.ship) : 'Complimentary'}</dd></div>
          <div><dt>Sales tax</dt><dd>${money(0)}</dd></div>
          ${t.credit ? `<div class="lr-discount"><dt>Store credit</dt><dd>&minus;${money(t.credit)}</dd></div>` : ''}
          <div class="lr-total"><dt>Total</dt><dd>${money(t.total)}</dd></div>
        </dl>`;
      document.getElementById('coToggleTotal').textContent = money(t.total);
      document.getElementById('coPlace').textContent = `Place order — ${money(t.total)}`;
      document.getElementById('shipBox').innerHTML = `<div class="lr-ship-row"><span><b>Tracked delivery</b><small>${esc(zoneLabel(state.zone))}${state.zone === 'us' && t.sub - t.off < FREE_SHIP ? ` &middot; complimentary on orders of $${FREE_SHIP}+` : ''}</small></span><em>${t.ship ? money(t.ship) : 'Complimentary'}</em></div>
        ${state.zone === 'ca' || state.zone === 'intl' ? `<p class="lr-co-note">Import duties, taxes and brokerage fees may be charged by your country on delivery. They are paid by you and are not included here.</p>` : ''}`;
      document.getElementById('codeForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const val = document.getElementById('code').value.trim().toUpperCase();
        if (val === 'LRCO10') { state.discount = 0.1; state.code = val; drawSummary(); return; }
        const msg = document.getElementById('codeMsg');
        msg.textContent = val ? 'That code isn’t valid.' : 'Enter a code.';
        msg.className = 'lr-form-msg is-bad';
      });
    };
    const section = (n, key, name, inner) => `<section class="lr-co-sec" data-sec="${key}" aria-labelledby="coH${n}"><span class="lr-rail-dot" aria-hidden="true"><b>${two(n)}</b>${icon('check')}</span><h2 id="coH${n}">${name}<span class="lr-visually-hidden" id="coS${n}"> (not complete)</span></h2>${inner}</section>`;
    return {
      title: 'Checkout',
      chrome: 'checkout',
      html: `
      <div class="lr-wrap lr-checkout">
        <button class="lr-co-toggle" type="button" id="coToggle" aria-expanded="false" aria-controls="coSummary"><span>Order summary</span><b id="coToggleTotal"></b>${icon('down')}</button>
        <div class="lr-co-main">
          <div class="lr-express" aria-label="Express checkout">
            <span class="lr-label">Express</span>
            <button type="button" class="lr-pay" data-preview-msg="Preview: Apple Pay would open here, through LR-CO's own Stripe account.">Apple Pay</button>
            <button type="button" class="lr-pay" data-preview-msg="Preview: Google Pay would open here, through LR-CO's own Stripe account.">Google Pay</button>
            <button type="button" class="lr-pay" data-preview-msg="Preview: Link would fill in your saved details here.">Link</button>
          </div>
          <p class="lr-co-guest">${user ? `Signed in as <b>${esc(user.email)}</b>.` : `Checking out as a guest. <a href="${url.page('login')}">Sign in</a> to use store credit and keep this order in your account.`}</p>
          <form id="coForm" class="lr-rail" novalidate>
            ${section(1, 'contact', 'Contact', `${field('email', 'Email', 'email', `autocomplete="email" required value="${user ? esc(user.email) : ''}"`)}
              <label class="lr-check-line"><input type="checkbox" id="optin"> <span>Send me a note when new pieces are made (optional)</span></label>`)}
            ${section(2, 'delivery', 'Delivery', `
              <label class="lr-field" for="country"><span>Country</span><span class="lr-field-box"><select id="country" autocomplete="country">${COUNTRIES.map(([c, n]) => `<option value="${c}">${n}</option>`).join('')}</select></span></label>
              <div class="lr-field-row">${field('first', 'First name', 'text', 'autocomplete="given-name" required')}${field('last', 'Last name', 'text', 'autocomplete="family-name" required')}</div>
              ${field('address', 'Street address', 'text', 'autocomplete="address-line1" required')}
              ${field('address2', 'Apartment, suite (optional)', 'text', 'autocomplete="address-line2"')}
              <div class="lr-field-row lr-field-row-3">${field('city', 'City', 'text', 'autocomplete="address-level2" required')}
                <label class="lr-field" for="state" id="stateWrap"><span>State</span><span class="lr-field-box"><select id="state" required autocomplete="address-level1"><option value="">Select</option>${STATES.map((s) => `<option>${s}</option>`).join('')}</select><i class="lr-field-ok" aria-hidden="true">${icon('check')}</i></span><em class="lr-field-err" id="stateErr"></em></label>
                <label class="lr-field" for="region" id="regionWrap" hidden><span>Province / region</span><span class="lr-field-box"><input id="region" autocomplete="address-level1"><i class="lr-field-ok" aria-hidden="true">${icon('check')}</i></span><em class="lr-field-err" id="regionErr"></em></label>
                <label class="lr-field" for="zip"><span id="zipLabel">ZIP code</span><span class="lr-field-box"><input id="zip" name="zip" autocomplete="postal-code" required><i class="lr-field-ok" aria-hidden="true">${icon('check')}</i></span><em class="lr-field-err" id="zipErr"></em></label></div>
              ${field('phone', 'Phone, for delivery questions (optional)', 'tel', 'autocomplete="tel"')}
              <div id="shipBox"></div>`)}
            ${section(3, 'payment', 'Payment', `
              <div class="lr-pay-box"><b>Card details are entered in Stripe's secure form.</b><p>On the live store this is Stripe's payment form for LR-CO's own merchant account. Card numbers are never typed into these pages.</p></div>
              <p class="lr-pay-ways" aria-label="Ways to pay"><span>Card</span><span>Apple Pay</span><span>Google Pay</span><span>Link</span></p>
              ${user ? `<label class="lr-check-line"><input type="checkbox" id="useCredit"> <span>Use store credit (<b>${money(CREDIT_BALANCE)}</b> available). You'll confirm with your passkey or authenticator app.</span></label>` : `<p class="lr-co-note">Have store credit? <a href="${url.page('login')}">Sign in</a> to use it.</p>`}
              ${offroad.length ? `<div class="lr-ack"><p class="lr-label">Before you order</p><p>These pieces are for off-road and competition use only: ${offroad.map((p) => esc(title(p))).join(', ')}.</p>
                <label class="lr-check-line"><input type="checkbox" id="ack"> <span>I've read the <a href="${url.page('vcw')}" target="_blank" rel="noopener">vehicle compliance waiver</a> and will only use these parts off-road, where it's legal.</span></label><em class="lr-field-err" id="ackErr"></em></div>` : ''}
              <p class="lr-preview-flag">Design preview: placing this order charges nothing. It shows the confirmation page.</p>
              <button class="lr-btn lr-btn-copper lr-btn-lg lr-btn-block" type="submit" id="coPlace">Place order</button>
              <p class="lr-co-legal">By placing your order you agree to the <a href="${url.page('terms')}">terms</a>, <a href="${url.page('refund')}">return policy</a> and <a href="${url.page('privacy')}">privacy policy</a>.</p>`)}
          </form>
        </div>
        <aside class="lr-co-summary" id="coSummary" aria-label="Order summary"><p class="lr-label">Summary</p><div id="coSummaryBody"></div></aside>
      </div>`,
      after() {
        const $id = (id) => document.getElementById(id);
        const us = () => state.country === 'US';
        const RULES = () => ({
          contact: { email: (x) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x) || 'Enter a valid email.' },
          delivery: {
            first: (x) => Boolean(x) || 'Enter a first name.',
            last: (x) => Boolean(x) || 'Enter a last name.',
            address: (x) => x.length > 3 || 'Enter a street address.',
            city: (x) => Boolean(x) || 'Enter a city.',
            ...(us() ? { state: (x) => Boolean(x) || 'Choose a state.' } : {}),
            ...(state.country === 'CA' ? { region: (x) => Boolean(x) || 'Enter a province.' } : {}),
            zip: (x) => (us() ? /^\d{5}(-\d{4})?$/.test(x) || 'Enter a 5-digit ZIP.' : state.country === 'CA' ? /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(x) || 'Enter a postal code like K1A 0B1.' : x.length >= 3 || 'Enter a postal code.'),
          },
        });
        const ruleFor = (id) => { const r = RULES(); return (r.contact[id] || r.delivery[id]) || null; };
        // Validate one field: show the message (when asked) and a check mark when it's good.
        const checkField = (id, show) => {
          const test = ruleFor(id);
          const el = $id(id);
          if (!test || !el) return true;
          const res = test(el.value.trim());
          const box = el.closest('.lr-field');
          box.classList.toggle('is-ok', res === true);
          if (show) {
            $id(`${id}Err`).textContent = res === true ? '' : res;
            if (res !== true) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid');
          }
          return res === true;
        };
        const secValid = (key) => Object.keys(RULES()[key]).every((id) => { const test = ruleFor(id); return test($id(id).value.trim()) === true; });
        const rail = () => {
          const done = { contact: secValid('contact'), delivery: secValid('delivery') };
          const ack = $id('ack');
          done.payment = done.contact && done.delivery && (!ack || ack.checked);
          ['contact', 'delivery', 'payment'].forEach((k, i) => {
            const sec = $(`[data-sec="${k}"]`);
            sec.classList.toggle('is-done', done[k]);
            $id(`coS${i + 1}`).textContent = done[k] ? ' (complete)' : ' (not complete)';
          });
        };
        const syncCountry = () => {
          state.country = $id('country').value;
          $id('stateWrap').hidden = !us();
          $id('regionWrap').hidden = us();
          $id('zipLabel').textContent = us() ? 'ZIP code' : 'Postal code';
          state.zone = zoneOf(state.country, $id('state').value);
          drawSummary();
          if ($id('zip').value) checkField('zip', true);
          rail();
        };
        $id('country').addEventListener('change', syncCountry);
        $id('state').addEventListener('change', () => { syncCountry(); checkField('state', true); rail(); });
        const credit = $id('useCredit');
        if (credit) credit.addEventListener('change', () => { state.useCredit = credit.checked; drawSummary(); });
        syncCountry();
        const toggle = $id('coToggle');
        toggle.addEventListener('click', () => {
          const open = $id('coSummary').classList.toggle('is-open');
          toggle.setAttribute('aria-expanded', String(open));
        });
        const form = $id('coForm');
        form.addEventListener('focusout', (e) => { if (e.target.id && ruleFor(e.target.id) && e.target.value.trim()) { checkField(e.target.id, true); rail(); } });
        form.addEventListener('input', (e) => {
          const err = $id(`${e.target.id}Err`);
          if (err && err.textContent && checkField(e.target.id, false)) { err.textContent = ''; e.target.removeAttribute('aria-invalid'); }
          if (ruleFor(e.target.id)) checkField(e.target.id, false);
          rail();
        });
        form.addEventListener('change', (e) => { if (e.target.id === 'ack') { $id('ackErr').textContent = ''; rail(); } });
        if (user) { checkField('email', false); rail(); }
        const val = (id) => $id(id).value.trim();
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          let bad = null;
          ['contact', 'delivery'].forEach((k) => Object.keys(RULES()[k]).forEach((id) => { if (!checkField(id, true) && !bad) bad = $id(id); }));
          const ack = $id('ack');
          if (ack && !ack.checked) { $id('ackErr').textContent = 'Please confirm you’ve read the waiver for off-road parts.'; if (!bad) bad = ack; }
          rail();
          if (bad) { bad.focus(); return; }
          const t = totals(lines, state.zone, state.discount, state.useCredit ? CREDIT_BALANCE : 0);
          const countryName = (COUNTRIES.find(([c]) => c === state.country) || [])[1] || '';
          store.session('lr_preview_order', {
            n: `LRC-${String(Date.now()).slice(-6)}`,
            email: val('email'), name: `${val('first')} ${val('last')}`, guest: !user,
            address: [val('address'), val('address2'), us() ? `${val('city')}, ${val('state')} ${val('zip')}` : `${val('city')} ${val('region')} ${val('zip')}`.replace(/\s+/g, ' ').trim(), us() ? '' : countryName].filter(Boolean),
            zone: state.zone, lines, ...t,
          });
          cart.clear();
          window.location.href = url.page('confirmation');
        });
      },
    };
  };

  // Sample orders, dated relative to today: one being packed, one delivered 2 days ago (still returnable),
  // one delivered two weeks ago (return window closed, warranty open) and an older one.
  const SAMPLE_ORDERS = [
    { n: 'LRC-104611', date: daysAgo(1), status: 1, items: [['civic-06-11-intake', 1]], credit: 10, tracking: '', carrier: 'UPS Ground' },
    { n: 'LRC-104590', date: daysAgo(6), status: 5, items: [['wrx-08-14-downpipe', 1], ['o2-spacer-90-pair', 1]], tracking: '1Z RR4 590 03 1288 4410', carrier: 'UPS Ground' },
    { n: 'LRC-104233', date: daysAgo(18), status: 5, items: [['accord-94-97-header', 1], ['header-install-kit', 1]], tracking: '1Z RR4 233 03 1842 7731', carrier: 'UPS Ground' },
    { n: 'LRC-103871', date: daysAgo(64), status: 5, items: [['slant-tip-3-4', 2]], tracking: '9400 1112 0261 3871 0042 19', carrier: 'USPS Ground Advantage' },
  ];
  const STEPS = ['Order placed', 'Packed', 'Shipped', 'Out for delivery', 'Delivered'];
  const orderTotals = (o) => totals(o.items.map(([id, qty]) => ({ id, qty })), 'us', 0, o.credit || 0);
  const deliveredOn = (o) => (o.status >= 5 ? addDays(o.date, 4) : null);
  const returnUntil = (o) => (deliveredOn(o) ? addDays(deliveredOn(o), RETURN_DAYS) : null);
  const canReturn = (o) => Boolean(returnUntil(o)) && returnUntil(o) >= daysAgo(0);
  function timeline(status, date) {
    const d = new Date(`${date}T12:00:00`);
    return `<ol class="lr-timeline">${STEPS.map((s, i) => {
      const when = new Date(d); when.setDate(d.getDate() + [0, 1, 1, 4, 4][i]);
      const state = i < status ? 'is-done' : i === status ? 'is-now' : '';
      return `<li class="${state}"><span class="lr-dot">${i < status ? icon('check') : ''}</span><b>${s}</b><small>${i < status ? when.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : i === status ? 'Next' : ''}</small></li>`;
    }).join('')}</ol>`;
  }
  const signedIn = () => store.session('lr_preview_user') || { first: 'Jamie', last: 'Rivera', email: 'jamie.rivera@example.com' };
  const statusName = (s) => (s >= 5 ? 'Delivered' : STEPS[s - 1] || 'Processing');

  PAGES.confirmation = () => {
    const o = store.session('lr_preview_order') || {
      n: 'LRC-104612', email: 'jamie.rivera@example.com', name: 'Jamie Rivera', address: ['1420 Main Street', 'Apt 3', 'Denver, CO 80202'], zone: 'us', guest: true,
      lines: [{ id: 'accord-94-97-header', qty: 1 }, { id: 'header-install-kit', qty: 1 }], ...totals([{ id: 'accord-94-97-header', qty: 1 }, { id: 'header-install-kit', qty: 1 }]),
    };
    return {
      title: 'Order confirmed',
      html: `<div class="lr-wrap lr-confirm">
        <div class="lr-confirm-head">
          <span class="lr-confirm-check">${icon('check')}</span>
          <p class="lr-label">Order ${esc(o.n)}</p>
          <h1>Thanks, ${esc(o.name.split(' ')[0])}. Your parts are on the list.</h1>
          <p>A receipt is on its way to <b>${esc(o.email)}</b>. We'll email tracking as soon as it ships.</p>
        </div>
        <div class="lr-confirm-grid">
          <section class="lr-card-box"><h2>What happens next</h2>${timeline(1, daysAgo(0))}</section>
          <section class="lr-card-box"><h2>Your order</h2>
            <ul class="lr-co-lines">${o.lines.map((l) => { const p = byId(l.id); return p ? `<li><span class="lr-co-art">${art(p)}<i>${l.qty}</i></span><span>${esc(title(p))}</span><b>${money(price(p) * l.qty)}</b></li>` : ''; }).join('')}</ul>
            <dl><div><dt>Subtotal</dt><dd>${money(o.sub)}</dd></div>${o.off ? `<div class="lr-discount"><dt>Discount</dt><dd>&minus;${money(o.off)}</dd></div>` : ''}<div><dt>Shipping (${esc(zoneLabel(o.zone))})</dt><dd>${o.ship ? money(o.ship) : 'Free'}</dd></div>${o.credit ? `<div class="lr-discount"><dt>Store credit</dt><dd>&minus;${money(o.credit)}</dd></div>` : ''}<div class="lr-summary-total"><dt>Total</dt><dd>${money(o.total)}</dd></div></dl>
          </section>
          <section class="lr-card-box"><h2>Shipping to</h2><p>${esc(o.name)}<br>${o.address.map(esc).join('<br>')}</p>
            ${o.guest ? `<h2>Keep track of it</h2><p>Make a LR-CO account with <b>${esc(o.email)}</b> to see this order, start returns and get store credit.</p><a class="lr-btn lr-btn-line lr-btn-sm" href="${url.page('signup')}">Create account</a>` : ''}
          </section>
        </div>
        <div class="lr-confirm-actions"><a class="lr-btn lr-btn-copper" href="${url.page('track')}?order=${encodeURIComponent(o.n)}">${icon('truck')}Track this order</a><a class="lr-btn lr-btn-line" href="${url.all}">Keep shopping</a></div>
        <p class="lr-preview-flag">Design preview: no order was placed and nothing was charged.</p>
      </div>`,
    };
  };

  function authShell(kind) {
    const isLogin = kind === 'login';
    return `<div class="lr-wrap lr-auth">
      <div class="lr-auth-card">
        <h1>${isLogin ? 'Sign in' : 'Create your account'}</h1>
        <p class="lr-muted">${isLogin ? 'Track orders, start returns and check out faster.' : 'Takes 30 seconds. See every order in one place.'}</p>
        <form id="authForm" novalidate>
          ${isLogin ? '' : '<div class="lr-field-row"><label class="lr-field"><span>First name</span><input id="aFirst" autocomplete="given-name" required><em class="lr-field-err" id="aFirstErr"></em></label><label class="lr-field"><span>Last name</span><input id="aLast" autocomplete="family-name" required><em class="lr-field-err" id="aLastErr"></em></label></div>'}
          <label class="lr-field"><span>Email</span><input id="aEmail" type="email" autocomplete="email" required><em class="lr-field-err" id="aEmailErr"></em></label>
          <label class="lr-field"><span>Password${isLogin ? '' : ' (8+ characters)'}</span><span class="lr-pass"><input id="aPass" type="password" autocomplete="${isLogin ? 'current-password' : 'new-password'}" required><button type="button" class="lr-link-btn" id="aShow" aria-label="Show password">${icon('eye')}</button></span><em class="lr-field-err" id="aPassErr"></em></label>
          ${isLogin ? `<p class="lr-auth-forgot"><button type="button" class="lr-link-btn" id="aForgot">Forgot password?</button></p>` : ''}
          <button class="lr-btn lr-btn-copper lr-btn-lg lr-btn-block" type="submit">${isLogin ? 'Sign in' : 'Create account'}</button>
          <p class="lr-form-msg" id="authMsg" role="status"></p>
        </form>
        <p class="lr-auth-switch">${isLogin ? `New to LR-CO? <a href="${url.page('signup')}">Create an account</a>` : `Already have an account? <a href="${url.page('login')}">Sign in</a>`}</p>
      </div>
      <aside class="lr-auth-side">
        <h2>Why make an account?</h2>
        <ul class="lr-checklist">
          <li>${icon('truck')}Track every order in one place</li>
          <li>${icon('pin')}Save your address for faster checkout</li>
          <li>${icon('returns')}Start returns in two clicks</li>
          <li>${icon('tag')}Get deal drops before anyone else</li>
        </ul>
        <span class="lr-auth-art">${art(byId('wrx-08-14-downpipe'))}</span>
      </aside>
    </div>`;
  }
  function bindAuth(kind) {
    const form = document.getElementById('authForm');
    const pass = document.getElementById('aPass');
    document.getElementById('aShow').addEventListener('click', (e) => { pass.type = pass.type === 'password' ? 'text' : 'password'; e.currentTarget.setAttribute('aria-label', pass.type === 'password' ? 'Show password' : 'Hide password'); });
    const forgot = document.getElementById('aForgot');
    if (forgot) forgot.addEventListener('click', () => {
      const msg = document.getElementById('authMsg');
      const email = document.getElementById('aEmail').value.trim();
      msg.className = `lr-form-msg ${email ? 'is-ok' : 'is-bad'}`;
      msg.textContent = email ? `If there's an account for ${email}, a reset link is on its way. (Preview: nothing was sent.)` : 'Enter your email first, then press Forgot password.';
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const rules = [['aEmail', (x) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x) || 'Enter a valid email.'], ['aPass', (x) => (kind === 'login' ? x.length > 0 : x.length >= 8) || (kind === 'login' ? 'Enter your password.' : 'Use at least 8 characters.')]];
      if (kind === 'signup') rules.unshift(['aFirst', (x) => Boolean(x) || 'Enter your first name.'], ['aLast', (x) => Boolean(x) || 'Enter your last name.']);
      let bad = null;
      rules.forEach(([id, test]) => { const el = document.getElementById(id); const r = test(el.value.trim()); document.getElementById(`${id}Err`).textContent = r === true ? '' : r; if (r !== true && !bad) bad = el; });
      if (bad) { bad.focus(); return; }
      const email = document.getElementById('aEmail').value.trim();
      const first = kind === 'signup' ? document.getElementById('aFirst').value.trim() : 'Jamie';
      const last = kind === 'signup' ? document.getElementById('aLast').value.trim() : 'Rivera';
      store.session('lr_preview_user', { first, last, email });
      window.location.href = url.page('account');
    });
  }
  PAGES.login = () => ({ title: 'Sign in', html: authShell('login'), after: () => bindAuth('login') });
  PAGES.signup = () => ({ title: 'Create account', html: authShell('signup'), after: () => bindAuth('signup') });

  // Sample support threads (Messages tab).
  const THREADS = [
    { subject: 'When will my intake ship?', order: 'LRC-104611', date: daysAgo(1), status: 'Answered', messages: [
      ['you', 'Hi, I ordered the Civic intake yesterday. When will it ship?'],
      ['team', 'Thanks for your order! LRC-104611 is being packed now. You’ll get an email with tracking as soon as the label is made.'],
    ] },
    { subject: 'Will the WRX downpipe fit a 2011 STI?', order: '', date: daysAgo(9), status: 'Answered', messages: [
      ['you', 'Will the 3" downpipe for the 2008–2014 WRX fit my 2011 STI?'],
      ['team', 'Good question. This downpipe is listed for the 2008–2014 Subaru WRX with the 2.5L EJ255. The STI uses a different engine, so we can’t confirm it fits yet. We’re checking with our parts team and will reply here.'],
      ['staff', 'Checked it: the STI’s turbo outlet and length are different, so this one won’t fit. Sorry about that!'],
    ] },
  ];
  const CREDIT_LEDGER = [
    { date: daysAgo(58), what: 'Refund as store credit: 1 × Slant-Cut Exhaust Tip (LRC-103871). No restocking fee.', amount: 25 },
    { date: daysAgo(1), what: 'Used on order LRC-104611', amount: -10 },
  ];

  // LR-CO's account: an accordion. Each section is a full-width row that opens in place; one open at a time.
  PAGES.account = () => {
    const u = signedIn();
    const twoStep = () => store.session('lr_preview_2fa') === true;
    const passkeys = () => store.session('lr_preview_passkeys') || [];
    let balance = 0;
    const ledger = CREDIT_LEDGER.map((r) => { balance += r.amount; return { ...r, balance }; });
    const open = SAMPLE_ORDERS.filter((o) => o.status < 5).length;
    const secured = () => twoStep() || passkeys().length > 0;
    const summaries = () => ({
      orders: `${SAMPLE_ORDERS.length} orders${open ? `, ${open} on the way` : ''}`,
      messages: `${THREADS.length} conversations`,
      credit: `${money(balance)} available`,
      wishlist: `${wish.read().length} saved`,
      addresses: '1 address',
      security: secured() ? (twoStep() ? 'Two-step sign-in on' : 'Passkey added') : 'Needs attention',
    });
    const SECTIONS = [['orders', 'Orders'], ['messages', 'Messages'], ['credit', 'Store credit'], ['wishlist', 'Wishlist'], ['addresses', 'Addresses'], ['security', 'Security']];
    const securityState = () => `<span class="lr-status ${twoStep() ? 's5' : 's3'}">${twoStep() ? 'On' : 'Off'}</span>`;
    const creditGuard = () => (secured()
      ? `<p class="lr-credit-guard is-on">${icon('shield')}<span>Protected. You'll confirm with your ${twoStep() ? 'authenticator app or ' : ''}passkey each time you use credit.</span></p>`
      : `<p class="lr-credit-guard">${icon('lock')}<span>To use store credit, turn on two-step sign-in or add a passkey. <button class="lr-textbtn" type="button" data-open="security">Set it up</button></span></p>`);
    const drawSummaries = () => {
      const s = summaries();
      SECTIONS.forEach(([id]) => { const el = document.getElementById(`sum-${id}`); if (el) { el.textContent = s[id]; el.classList.toggle('is-warn', id === 'security' && !secured()); } });
    };
    const drawWishlist = () => {
      const list = wish.read().map(byId);
      document.getElementById('wishHolder').innerHTML = list.length ? grid(list) : `<div class="lr-empty-small"><p>Nothing saved yet. Choose <b>Save</b> on any piece to keep it here.</p><a class="lr-btn lr-btn-line" href="${url.all}">Enter the collection</a></div>`;
      drawSummaries();
    };
    const body = {
      orders: `<ul class="lr-order-list">${SAMPLE_ORDERS.map((o) => { const t = orderTotals(o); return `<li class="lr-order">
          <div class="lr-order-top"><div><b>${o.n}</b><span>${niceDate(o.date)}</span></div><span class="lr-status s${o.status}">${statusName(o.status)}</span><strong>${money(t.total)}</strong></div>
          <div class="lr-order-items">${o.items.map(([id, q]) => `<span class="lr-mini-art" title="${esc(title(byId(id)))}">${art(byId(id))}${q > 1 ? `<i>${q}</i>` : ''}</span>`).join('')}<p>${o.items.map(([id]) => esc(title(byId(id)))).join(', ')}</p></div>
          <div class="lr-order-actions"><a class="lr-btn lr-btn-line lr-btn-sm" href="${url.page('orderview')}?n=${o.n}">View order</a><a class="lr-btn lr-btn-line lr-btn-sm" href="${url.page('track')}?order=${o.n}">Track</a>${canReturn(o) ? `<a class="lr-btn lr-btn-line lr-btn-sm" href="${url.page('request')}?type=return&n=${o.n}">Return</a>` : ''}</div>
        </li>`; }).join('')}</ul>`,
      messages: `<p class="lr-muted lr-panel-intro">Your conversations with LR-CO. Write to us any hour; we reply right here and by email.</p>
        <div class="lr-threads">${THREADS.map((th, i) => `<details class="lr-thread"${i === 0 ? ' open' : ''}>
          <summary><span><b>${esc(th.subject)}</b><small>${th.order ? `${th.order} &middot; ` : ''}${niceDate(th.date)}</small></span><span class="lr-status s5">${th.status}</span></summary>
          <div class="lr-bubbles">${th.messages.map(([who, text]) => `<div class="lr-bubble is-${who}"><small>${who === 'you' ? 'You' : who === 'team' ? 'LR-CO Concierge' : 'Sam at LR-CO'}</small><p>${esc(text)}</p></div>`).join('')}</div>
          <form class="lr-reply" data-reply novalidate><label class="lr-visually-hidden" for="reply${i}">Reply</label><textarea id="reply${i}" rows="2" placeholder="Write a reply"></textarea><button class="lr-btn lr-btn-line lr-btn-sm" type="submit">Send</button></form>
        </details>`).join('')}</div>
        <a class="lr-btn lr-btn-line" href="${url.page('contact')}">Start a new message</a>`,
      credit: `<div class="lr-credit-card"><div><small>Available</small><strong>${money(balance)}</strong></div><p>LR-CO only &middot; never expires &middot; can't be cashed out</p></div>
        <div id="creditGuard">${creditGuard()}</div>
        <div class="lr-table-wrap"><table class="lr-table lr-ledger"><thead><tr><th>Date</th><th>What happened</th><th>Amount</th><th>Balance</th></tr></thead><tbody>${ledger.slice().reverse().map((r) => `<tr><td>${niceDate(r.date)}</td><td>${esc(r.what)}</td><td class="${r.amount > 0 ? 'lr-plus' : 'lr-minus'}">${r.amount > 0 ? '+' : '&minus;'}${money(Math.abs(r.amount))}</td><td>${money(r.balance)}</td></tr>`).join('')}</tbody></table></div>
        <p class="lr-muted lr-small">Store credit comes from refunds you choose to take as credit, or from our team. Every change is listed here and emailed to you. Credit pays for parts, delivery and tax, and works with discount codes.</p>`,
      wishlist: '<div id="wishHolder"></div>',
      addresses: `<div class="lr-address-card"><span class="lr-badge">Default</span><p><b>${esc(u.first)} ${esc(u.last)}</b><br>1420 Main Street, Apt 3<br>Denver, CO 80202</p><button class="lr-textbtn" type="button" data-preview-msg="Editing addresses is not part of the preview.">Edit</button></div>
        <p class="lr-muted lr-small">Saved cards are kept by Stripe, our payment processor. LR-CO never sees or keeps your full card number.</p>`,
      security: `<div class="lr-sec-list">
          <div class="lr-sec-row">
            <div class="lr-sec-head"><div><b>Two-step sign-in</b><span>An authenticator app such as Google Authenticator. Needed to use store credit (or add a passkey).</span></div><span id="twoStepState">${securityState()}</span></div>
            <div id="twoStepBody">${twoStep() ? '<p class="lr-muted">On. You’ll enter a 6-digit code when you sign in on a new device and each time you use store credit.</p>' : '<button class="lr-btn lr-btn-line lr-btn-sm" type="button" id="twoStepStart">Set up</button>'}</div>
          </div>
          <div class="lr-sec-row">
            <div class="lr-sec-head"><div><b>Passkeys</b><span>Sign in with Face ID, Touch ID or your device PIN instead of a password.</span></div></div>
            <ul class="lr-passkeys" id="passkeyList"></ul>
            <button class="lr-btn lr-btn-line lr-btn-sm" type="button" id="addPasskey">Add a passkey</button>
          </div>
          <div class="lr-sec-row">
            <div class="lr-sec-head"><div><b>Emails on this account</b><span>Add other emails you've ordered with, to see those guest orders here.</span></div></div>
            <p class="lr-email-line"><b>${esc(u.email)}</b> <span class="lr-badge">Primary</span></p>
            <form class="lr-inline-form" id="addEmailForm" novalidate><input type="email" id="addEmail" placeholder="another@email.com" aria-label="Another email address"><button class="lr-btn lr-btn-line" type="submit">Send code</button></form>
            <p class="lr-form-msg" id="addEmailMsg" role="status"></p>
          </div>
          <form class="lr-sec-row lr-settings-form" id="pwForm" novalidate>
            <div class="lr-sec-head"><div><b>Password</b><span>At least 8 characters.</span></div></div>
            <label class="lr-field"><span>Current password</span><span class="lr-field-box"><input type="password" id="pw0" autocomplete="current-password"></span></label>
            <label class="lr-field"><span>New password</span><span class="lr-field-box"><input type="password" id="pw1" autocomplete="new-password"></span></label>
            <button class="lr-btn lr-btn-line" type="submit">Update password</button>
            <p class="lr-form-msg" id="pwMsg" role="status"></p>
          </form>
          <div class="lr-sec-row">
            <div class="lr-sec-head"><div><b>Email preferences</b><span>Order, delivery and account emails always go out.</span></div></div>
            <label class="lr-toggle"><input type="checkbox" checked disabled><span class="lr-toggle-ui" aria-hidden="true"></span><span>Order and delivery emails (always on)</span></label>
            <label class="lr-toggle"><input type="checkbox" id="optDeals"><span class="lr-toggle-ui" aria-hidden="true"></span><span>New pieces and occasional offers</span></label>
          </div>
          <div class="lr-sec-row lr-sec-danger">
            <div class="lr-sec-head"><div><b>Delete account</b><span>Order records and any store credit are kept as the law requires. You can recover your credit later by proving it's you.</span></div></div>
            <button class="lr-btn lr-btn-line lr-btn-sm" type="button" data-preview-msg="On the live store this asks you to confirm with your password, then deletes your account.">Delete my account</button>
          </div>
        </div>`,
    };
    return {
      title: 'Account',
      html: `<div class="lr-wrap lr-account">
        ${crumbs([['Home', url.home], ['Account']])}
        <div class="lr-account-head"><div><p class="lr-label">Account</p><h1 class="lr-page-title">Good evening, ${esc(u.first)}.</h1><p class="lr-muted">${esc(u.email)}</p></div><button class="lr-btn lr-btn-line lr-btn-sm" type="button" id="signOut">Sign out</button></div>
        <div class="lr-acc">${SECTIONS.map(([id, label], i) => `<section class="lr-acc-item" id="acc-${id}">
          <h2 class="lr-acc-h"><button type="button" class="lr-acc-btn" data-acc="${id}" aria-expanded="false" aria-controls="panel-${id}"><span class="lr-acc-no">${two(i + 1)}</span><span class="lr-acc-name">${label}</span><span class="lr-acc-sum" id="sum-${id}"></span><span class="lr-acc-chev" aria-hidden="true">${icon('down')}</span></button></h2>
          <div class="lr-acc-panel" id="panel-${id}" data-acct-panel="${id}" hidden>${body[id]}</div>
        </section>`).join('')}</div>
      </div>`,
      after() {
        const ids = SECTIONS.map(([id]) => id);
        const openRow = (id, scroll) => {
          const valid = ids.includes(id) ? id : '';
          $$('[data-acc]').forEach((b) => b.setAttribute('aria-expanded', String(b.dataset.acc === valid)));
          $$('.lr-acc-panel').forEach((p) => { p.hidden = p.dataset.acctPanel !== valid; });
          $$('.lr-acc-item').forEach((s) => s.classList.toggle('is-open', s.id === `acc-${valid}`));
          try { window.history.replaceState(null, '', valid ? `#${valid}` : window.location.pathname + window.location.search); } catch (e) { /* ignore */ }
          if (valid && scroll) {
            const row = document.getElementById(`acc-${valid}`);
            const top = row.getBoundingClientRect().top;
            if (top < 0 || top > window.innerHeight * 0.6) row.scrollIntoView({ block: 'start', behavior: 'smooth' });
          }
        };
        document.querySelector('.lr-acc').addEventListener('click', (e) => {
          const b = e.target.closest('[data-acc]');
          if (b) openRow(b.getAttribute('aria-expanded') === 'true' ? '' : b.dataset.acc, true);
          const o = e.target.closest('[data-open]');
          if (o) { openRow(o.dataset.open, true); const btn = $(`[data-acc="${o.dataset.open}"]`); if (btn) btn.focus({ preventScroll: true }); }
        });
        window.addEventListener('hashchange', () => openRow(window.location.hash.slice(1), true));
        drawWishlist();
        openRow(window.location.hash.slice(1) || 'orders', Boolean(window.location.hash));
        onWishChange = drawWishlist;
        document.getElementById('signOut').addEventListener('click', () => { store.session('lr_preview_user', null); window.location.href = url.page('login'); });
        $$('[data-reply]').forEach((f) => f.addEventListener('submit', (e) => {
          e.preventDefault();
          const box = $('textarea', f);
          if (!box.value.trim()) { box.focus(); return; }
          box.value = '';
          toast('Sent to LR-CO (preview)');
        }));
        const refreshSecurity = () => {
          document.getElementById('twoStepState').innerHTML = securityState();
          document.getElementById('creditGuard').innerHTML = creditGuard();
          drawSummaries();
        };
        // Two-step sign-in setup (sample: any 6 digits works)
        const tsBody = document.getElementById('twoStepBody');
        const start = document.getElementById('twoStepStart');
        if (start) start.addEventListener('click', () => {
          tsBody.innerHTML = `<div class="lr-totp"><div class="lr-qr" aria-hidden="true"></div><div><p>Scan this with your authenticator app, or type the key:</p><p class="lr-totp-key">LRPV 7K2M 4QXD 9LTA</p>
            <form class="lr-inline-form" id="totpForm" novalidate><input id="totpCode" inputmode="numeric" maxlength="6" placeholder="6-digit code" aria-label="6-digit code" autocomplete="one-time-code"><button class="lr-btn lr-btn-line" type="submit">Turn on</button></form><p class="lr-form-msg" id="totpMsg" role="status"></p></div></div>`;
          document.getElementById('totpCode').focus();
          document.getElementById('totpForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const code = document.getElementById('totpCode').value.trim();
            const msg = document.getElementById('totpMsg');
            if (!/^\d{6}$/.test(code)) { msg.textContent = 'Enter the 6-digit code from your app.'; msg.className = 'lr-form-msg is-bad'; return; }
            store.session('lr_preview_2fa', true);
            tsBody.innerHTML = '<p class="lr-form-msg is-ok">Two-step sign-in is on. Keep your recovery codes somewhere safe. (Preview)</p>';
            refreshSecurity();
          });
        });
        const keys = document.getElementById('passkeyList');
        const drawKeys = () => { const list = passkeys(); keys.innerHTML = list.length ? list.map((k) => `<li>${icon('key')}<span>${esc(k)}</span></li>`).join('') : '<li class="lr-muted">No passkeys yet.</li>'; };
        drawKeys();
        document.getElementById('addPasskey').addEventListener('click', () => {
          store.session('lr_preview_passkeys', [...passkeys(), `This device · added ${niceDate(daysAgo(0))}`]);
          drawKeys();
          refreshSecurity();
          toast('Passkey added (preview: your device would ask for Face ID or your PIN)');
        });
        document.getElementById('addEmailForm').addEventListener('submit', (e) => {
          e.preventDefault();
          const v = document.getElementById('addEmail').value.trim();
          const msg = document.getElementById('addEmailMsg');
          const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
          msg.textContent = ok ? `We sent a code to ${v}. Enter it to add the email. (Preview: nothing was sent.)` : 'Enter a valid email address.';
          msg.className = `lr-form-msg ${ok ? 'is-ok' : 'is-bad'}`;
        });
        document.getElementById('pwForm').addEventListener('submit', (e) => {
          e.preventDefault();
          const msg = document.getElementById('pwMsg');
          const ok = document.getElementById('pw0').value && document.getElementById('pw1').value.length >= 8;
          msg.textContent = ok ? 'Password updated. (Preview: nothing was saved.)' : 'Enter your current password and a new one with 8+ characters.';
          msg.className = `lr-form-msg ${ok ? 'is-ok' : 'is-bad'}`;
        });
      },
    };
  };

  PAGES.orderview = () => {
    const o = SAMPLE_ORDERS.find((x) => x.n === params.get('n')) || SAMPLE_ORDERS[1];
    const t = orderTotals(o);
    const u = signedIn();
    const returnLine = o.status < 5 ? 'Returns open once it’s delivered.' : canReturn(o) ? `Returns open until ${niceDate(returnUntil(o))}.` : `The return window closed ${niceDate(returnUntil(o))}. Warranty claims are still open.`;
    return {
      title: `Order ${o.n}`,
      html: `<div class="lr-wrap">
        ${crumbs([['Home', url.home], ['My account', url.page('account')], [`Order ${o.n}`]])}
        <div class="lr-account-head"><div><h1 class="lr-page-title">Order ${o.n}</h1><p class="lr-muted">Placed ${niceDate(o.date)} &middot; <span class="lr-status s${o.status}">${statusName(o.status)}</span></p></div><a class="lr-btn lr-btn-line lr-btn-sm" href="${url.page('account')}">${icon('back')}All orders</a></div>
        <section class="lr-card-box">${timeline(o.status, o.date)}<p class="lr-tracking">${icon('truck')}${o.tracking ? `${esc(o.carrier)} &middot; <b>${esc(o.tracking)}</b>` : 'Tracking is emailed as soon as the label is made.'}</p></section>
        <div class="lr-confirm-grid">
          <section class="lr-card-box"><h2>Items</h2>
            <ul class="lr-co-lines">${o.items.map(([id, q]) => { const p = byId(id); return `<li><span class="lr-co-art">${art(p)}<i>${q}</i></span><span><a href="${url.product(p)}">${esc(title(p))}</a></span><b>${money(price(p) * q)}</b></li>`; }).join('')}</ul>
            <dl><div><dt>Subtotal</dt><dd>${money(t.sub)}</dd></div><div><dt>Shipping</dt><dd>${t.ship ? money(t.ship) : 'Free'}</dd></div><div><dt>Sales tax</dt><dd>${money(0)}</dd></div>${t.credit ? `<div class="lr-discount"><dt>Store credit</dt><dd>&minus;${money(t.credit)}</dd></div>` : ''}<div class="lr-summary-total"><dt>Total</dt><dd>${money(t.total)}</dd></div></dl>
          </section>
          <section class="lr-card-box"><h2>Shipped to</h2><p>${esc(u.first)} ${esc(u.last)}<br>1420 Main Street, Apt 3<br>Denver, CO 80202</p><h2>Paid with</h2><p>Visa ending in 4242${t.credit ? ` and ${money(t.credit)} store credit` : ''}</p></section>
          <section class="lr-card-box"><h2>Need something?</h2>
            <p class="lr-muted lr-small">${returnLine}</p>
            <div class="lr-stack">
              ${canReturn(o) ? `<a class="lr-btn lr-btn-line lr-btn-block" href="${url.page('request')}?type=return&n=${o.n}">${icon('returns')}Start a return</a>` : ''}
              ${o.status >= 5 ? `<a class="lr-btn lr-btn-line lr-btn-block" href="${url.page('request')}?type=warranty&n=${o.n}">${icon('shield')}Warranty claim</a>` : ''}
              ${o.status < 3 ? `<button class="lr-btn lr-btn-line lr-btn-block" type="button" data-preview-msg="You can cancel before it ships. Refunds to your card have a 5% fee where allowed; choose store credit and there's no fee.">${icon('x')}Cancel order</button>` : ''}
              <a class="lr-btn lr-btn-line lr-btn-block" href="${url.page('account')}#messages">${icon('chat')}Ask about this order</a>
              ${o.status >= 5 ? `<button class="lr-btn lr-btn-line lr-btn-block" type="button" data-preview-msg="We email a review link 7 days after delivery. We read every review before it goes up.">${icon('star')}Review your parts</button>` : ''}
            </div>
          </section>
        </div>
      </div>`,
    };
  };

  PAGES.track = () => {
    const n = (params.get('order') || '').trim().toUpperCase();
    const o = n ? (SAMPLE_ORDERS.find((x) => x.n === n) || (/^LRC-\d{6}$/.test(n) ? { n, date: daysAgo(0), status: 1, carrier: 'UPS Ground', tracking: '' } : null)) : null;
    return {
      title: 'Track your order',
      html: `<div class="lr-wrap lr-track">
        <div class="lr-track-card">
          <span class="lr-modal-icon">${icon('truck')}</span>
          <h1>Track your order</h1>
          <p class="lr-muted">Enter the order number from your receipt (it starts with LRC-).</p>
          <form class="lr-track-form" action="${url.page('track')}" method="get" novalidate>
            <label class="lr-field"><span>Order number</span><input name="order" value="${esc(n)}" placeholder="LRC-104590" required></label>
            <label class="lr-field"><span>Email or ZIP code</span><input name="check" value="${esc(params.get('check') || '')}" placeholder="you@email.com"></label>
            <button class="lr-btn lr-btn-copper lr-btn-lg" type="submit">Track</button>
          </form>
        </div>
        ${n ? (o ? `<section class="lr-card-box lr-track-result"><div class="lr-track-result-head"><div><p class="lr-label">Order ${esc(o.n)}</p><h2>${statusName(o.status)}</h2></div><span class="lr-status s${o.status}">${statusName(o.status)}</span></div>${timeline(o.status, o.date)}<p class="lr-tracking">${icon('truck')}${o.tracking ? `${esc(o.carrier)} &middot; <b>${esc(o.tracking)}</b>` : 'Tracking is emailed as soon as the label is made.'}</p>${o.status >= 5 ? `<p class="lr-track-more"><a class="lr-btn lr-btn-line lr-btn-sm" href="${url.page('request')}?n=${o.n}&type=${canReturn(o) ? 'return' : 'warranty'}">${canReturn(o) ? 'Start a return' : 'Start a warranty claim'}</a></p>` : ''}</section>` : `<div class="lr-empty">${icon('search')}<h2>No order matches ${esc(n)}</h2><p>Check the number on your receipt email. Sample numbers: ${SAMPLE_ORDERS.map((x) => `<a href="${url.page('track')}?order=${x.n}">${x.n}</a>`).join(', ')}.</p></div>`) : ''}
      </div>`,
    };
  };

  // Returns and warranty claims: from the account, or as a guest with order number + email.
  PAGES.request = () => {
    const type = params.get('type') === 'warranty' ? 'warranty' : 'return';
    const n = (params.get('n') || '').trim().toUpperCase();
    const o = SAMPLE_ORDERS.find((x) => x.n === n);
    const isReturn = type === 'return';
    const tabsHtml = `<div class="lr-chips lr-req-tabs" role="navigation" aria-label="Request type"><a class="lr-chip${isReturn ? ' is-on' : ''}" href="${url.page('request')}?type=return${o ? `&n=${o.n}` : ''}">Return</a><a class="lr-chip${isReturn ? '' : ' is-on'}" href="${url.page('request')}?type=warranty${o ? `&n=${o.n}` : ''}">Warranty claim</a></div>`;
    const head = `<section class="lr-info-head"><div class="lr-wrap">${crumbs([['Home', url.home], ['Returns & warranty claims']])}<p class="lr-label">Help</p><h1 class="lr-page-title">${isReturn ? 'Start a return' : 'Warranty claim'}</h1><p class="lr-page-sub">${isReturn ? `Unused, uninstalled parts within ${RETURN_DAYS} days of delivery. The return label is free.` : 'A part failed or arrived broken? We replace first.'}</p></div></section>`;
    if (!o) {
      return {
        title: isReturn ? 'Start a return' : 'Warranty claim',
        html: `${head}<div class="lr-wrap lr-request">${tabsHtml}
          <form class="lr-card-box lr-lookup" action="${url.page('request')}" method="get" novalidate>
            <h2>Find your order</h2>
            <input type="hidden" name="type" value="${type}">
            <label class="lr-field"><span>Order number</span><input name="n" value="${esc(n)}" placeholder="LRC-104590" required></label>
            <label class="lr-field"><span>Email used for the order</span><input name="email" type="email" placeholder="you@email.com"></label>
            <button class="lr-btn lr-btn-copper" type="submit">Continue</button>
            ${n ? `<p class="lr-form-msg is-bad">We couldn't find ${esc(n)}. Check your receipt email.</p>` : ''}
            <p class="lr-muted lr-small">Signed in? Your orders are in <a href="${url.page('account')}">your account</a>. Sample orders: ${SAMPLE_ORDERS.filter((x) => x.status >= 5).map((x) => `<a href="${url.page('request')}?type=${type}&n=${x.n}">${x.n}</a>`).join(', ')}.</p>
          </form></div>`,
      };
    }
    const blocked = isReturn && !canReturn(o)
      ? (o.status < 5 ? 'You can start a return once this order is delivered.' : `The ${RETURN_DAYS}-day return window for this order closed ${niceDate(returnUntil(o))}. If a part failed or arrived broken, start a warranty claim instead.`)
      : (!isReturn && o.status < 5 ? 'Warranty claims open once the order is delivered.' : '');
    const REASONS = isReturn
      ? [['changed', 'Changed my mind'], ['wrong-order', 'Ordered the wrong part'], ['nofit', "Doesn't fit my car"], ['damaged', 'Arrived damaged'], ['wrong-item', 'You sent the wrong item'], ['other', 'Something else']]
      : [['cracked', 'Cracked weld or crack'], ['warped', 'Warped flange or leak'], ['broken', 'Part broke or failed'], ['other', 'Something else']];
    const OUR_FAULT = ['damaged', 'wrong-item'];
    return {
      title: isReturn ? `Return for ${o.n}` : `Warranty claim for ${o.n}`,
      html: `${head}<div class="lr-wrap lr-request">${tabsHtml}
        <p class="lr-req-order">${icon('box')}Order <b>${o.n}</b> &middot; placed ${niceDate(o.date)}${deliveredOn(o) ? ` &middot; delivered ${niceDate(deliveredOn(o))}` : ''}</p>
        ${blocked ? `<div class="lr-callout">${icon('clock')}<div><b>${isReturn ? 'Return not available' : 'Not yet'}</b><p>${blocked}</p>${isReturn && o.status >= 5 ? `<p><a class="lr-btn lr-btn-line lr-btn-sm" href="${url.page('request')}?type=warranty&n=${o.n}">Start a warranty claim</a></p>` : ''}</div></div>` : `
        <form class="lr-req-grid" id="reqForm" novalidate>
          <div class="lr-req-main">
            <section class="lr-card-box"><h2>Which parts?</h2>
              <ul class="lr-req-items">${o.items.map(([id, q]) => { const p = byId(id); return `<li><label class="lr-check"><input type="checkbox" data-item="${id}"><span class="lr-mini-art">${art(p)}</span><span>${esc(title(p))}<small>${money(price(p))} each${isReturn ? '' : ` &middot; ${esc(p.warranty)} warranty`}</small></span></label>${q > 1 ? `<label class="lr-select"><span>Qty</span><select data-qty="${id}">${Array.from({ length: q }, (_, k) => `<option>${k + 1}</option>`).join('')}</select></label>` : ''}</li>`; }).join('')}</ul>
              <em class="lr-field-err" id="itemsErr"></em>
            </section>
            <section class="lr-card-box"><h2>${isReturn ? 'Why are you returning it?' : 'What went wrong?'}</h2>
              <label class="lr-field"><span>Reason</span><select id="reason"><option value="">Choose a reason</option>${REASONS.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select><em class="lr-field-err" id="reasonErr"></em></label>
              <label class="lr-field"><span>Tell us more${isReturn ? ' (optional)' : ''}</span><textarea id="details" rows="4" placeholder="${isReturn ? 'Anything we should know' : 'When did it happen, and how is the part installed?'}"></textarea><em class="lr-field-err" id="detailsErr"></em></label>
              <label class="lr-field lr-upload"><span>Photos or video ${isReturn ? '(needed if it arrived damaged or wrong)' : '(needed)'}</span><input type="file" id="photos" multiple accept="image/*,video/*,application/pdf"><em class="lr-field-err" id="photosErr"></em></label>
              <ul class="lr-file-list" id="fileList"></ul>
            </section>
            ${isReturn ? `<section class="lr-card-box"><h2>How should we refund you?</h2>
              <label class="lr-radio-card"><input type="radio" name="refund" value="card" checked><span><b>Original payment</b><small id="cardNote">5% restocking fee</small></span><em id="cardAmt"></em></label>
              <label class="lr-radio-card"><input type="radio" name="refund" value="credit"><span><b>LR-CO store credit</b><small>No fee &middot; never expires &middot; needs two-step sign-in or a passkey</small></span><em id="creditAmt"></em></label>
            </section>` : `<section class="lr-card-box"><h2>What happens next</h2><ol class="lr-steps-list"><li><b>We review it</b><span>Usually within one business day. We may ask for more photos.</span></li><li><b>Send it back if needed</b><span>If we need the part, we email a free return label.</span></li><li><b>We replace it</b><span>Replacement comes first. If we're out, you're first in line for the next delivery.</span></li></ol></section>`}
          </div>
          <aside class="lr-card-box lr-req-summary"><h2>Summary</h2>
            <dl id="reqSummary"></dl>
            <button class="lr-btn lr-btn-copper lr-btn-lg lr-btn-block" type="submit">${isReturn ? 'Request return' : 'Send claim'}</button>
            <p class="lr-muted lr-small">${isReturn ? 'Tax is refunded in proportion. Parts that were used or broken in use go through warranty instead.' : 'Warranty covers the original buyer. It doesn’t change any rights you have by law.'}</p>
          </aside>
        </form>
        <div id="reqDone" hidden></div>`}
      </div>`,
      after() {
        const form = document.getElementById('reqForm');
        if (!form) return;
        const $id = (id) => document.getElementById(id);
        const picked = () => $$('[data-item]').filter((c) => c.checked).map((c) => { const sel = $(`[data-qty="${c.dataset.item}"]`); return { p: byId(c.dataset.item), qty: sel ? Number(sel.value) : 1 }; });
        const calc = () => {
          const value = picked().reduce((a, x) => a + price(x.p) * x.qty, 0);
          const waived = OUR_FAULT.includes($id('reason').value);
          const fee = isReturn && !waived ? Math.round(value * RESTOCK * 100) / 100 : 0;
          return { value, fee, waived };
        };
        const draw = () => {
          const { value, fee, waived } = calc();
          if (isReturn) {
            const toCard = $$('input[name="refund"]').find((r) => r.checked).value === 'card';
            $id('cardNote').textContent = waived ? 'No fee: this one is on us' : '5% restocking fee';
            $id('cardAmt').textContent = money(value - fee);
            $id('creditAmt').textContent = money(value);
            $id('reqSummary').innerHTML = `<div><dt>Parts</dt><dd>${money(value)}</dd></div>${toCard && fee ? `<div><dt>Restocking fee (5%)</dt><dd>&minus;${money(fee)}</dd></div>` : ''}<div><dt>Return label</dt><dd><b class="lr-free">Free</b></dd></div><div class="lr-summary-total"><dt>${toCard ? 'Back to your card' : 'Store credit'}</dt><dd>${money(toCard ? value - fee : value)}</dd></div>`;
          } else {
            $id('reqSummary').innerHTML = `<div><dt>Parts</dt><dd>${picked().reduce((a, x) => a + x.qty, 0) || 0}</dd></div><div><dt>Remedy</dt><dd>Replacement</dd></div><div><dt>Return label</dt><dd><b class="lr-free">Free if needed</b></dd></div>`;
          }
        };
        form.addEventListener('change', (e) => {
          if (e.target.id === 'photos') $id('fileList').innerHTML = Array.from(e.target.files || []).map((f) => `<li>${icon('upload')}${esc(f.name)}</li>`).join('');
          ['itemsErr', 'reasonErr', 'photosErr', 'detailsErr'].forEach((k) => { $id(k).textContent = ''; });
          draw();
        });
        draw();
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const reason = $id('reason').value;
          const needPhotos = !isReturn || OUR_FAULT.includes(reason);
          let ok = true;
          if (!picked().length) { $id('itemsErr').textContent = 'Pick at least one part.'; ok = false; }
          if (!reason) { $id('reasonErr').textContent = 'Choose a reason.'; ok = false; }
          if (!isReturn && $id('details').value.trim().length < 10) { $id('detailsErr').textContent = 'Tell us what happened (10+ characters).'; ok = false; }
          if (needPhotos && !($id('photos').files || []).length) { $id('photosErr').textContent = 'Add at least one photo or video.'; ok = false; }
          if (!ok) return;
          const ref = `${isReturn ? 'LRC-R' : 'LRC-W'}-${String(Date.now()).slice(-5)}`;
          form.hidden = true;
          const done = $id('reqDone');
          done.hidden = false;
          done.innerHTML = `<div class="lr-card-box lr-req-done"><span class="lr-confirm-check">${icon('check')}</span><h2>Request ${ref} sent</h2><p>${isReturn ? 'We review it within one business day, then email your free return label. Your refund goes out once the part is back and checked.' : 'We review it within one business day and email you what happens next.'}</p><p class="lr-preview-flag">Design preview: nothing was sent or uploaded.</p><a class="lr-btn lr-btn-line" href="${url.page('account')}">Back to my account</a></div>`;
          done.scrollIntoView({ block: 'start', behavior: 'smooth' });
        });
      },
    };
  };

  // ------------------------------------------------------------------ help, company and legal pages
  const SAMPLE_LEGAL = '<p class="lr-sample-note">Sample text for the design preview. Replace with LR-CO’s real policy before launch.</p>';
  const INFO = {
    about: {
      title: 'About us', kicker: 'The house', lead: 'Fewer pieces, made properly, described honestly.',
      body: () => `<p>LR-CO makes a short list of performance parts and makes them carefully: T304 stainless where it matters, flanges cut flat, welds back-purged, every number written down. We would rather sell fewer pieces than explain away a bad one.</p>
        <div class="lr-values">${[['tag', 'Honest prices', 'No inflated compare-at prices and no countdown timers. The price is the price.'], ['sliders', 'Every number listed', 'Tubing, flange, material and warranty, on every piece.'], ['truck', `Complimentary delivery over $${FREE_SHIP}`, 'To the lower 48 states, tracked on every order.'], ['shield', 'A warranty on every piece', 'A cracked weld or a warped flange is replaced first.']].map(([ic, h, t]) => `<div>${icon(ic)}<h3>${h}</h3><p>${t}</p></div>`).join('')}</div>
        <div class="lr-stat-band"><div><b>${P.length}</b><span>pieces in the collection</span></div><div><b>4.7</b><span>average rating</span></div><div><b>24/7</b><span>client care by chat or email</span></div></div>
        <p>If something isn't right, tell us. We will make it right.</p>`,
    },
    contact: {
      title: 'Contact us', kicker: 'Help', lead: 'Chat or email any time. We answer promptly and we’re here to help with anything about your order or your car.',
      body: () => `<div class="lr-contact-grid">
        <form class="lr-contact-form" id="contactForm" novalidate>
          <div class="lr-field-row"><label class="lr-field"><span>Name</span><input id="cName" autocomplete="name" required><em class="lr-field-err" id="cNameErr"></em></label><label class="lr-field"><span>Email</span><input id="cEmail" type="email" autocomplete="email" required><em class="lr-field-err" id="cEmailErr"></em></label></div>
          <div class="lr-field-row"><label class="lr-field"><span>Order number (optional)</span><input id="cOrder" placeholder="LRC-104590"></label><label class="lr-field"><span>Topic</span><select id="cTopic"><option>Fitment question</option><option>Order status</option><option>Return or exchange</option><option>Warranty claim</option><option>Something else</option></select></label></div>
          <label class="lr-field"><span>Message</span><textarea id="cMsg" rows="6" required></textarea><em class="lr-field-err" id="cMsgErr"></em></label>
          <button class="lr-btn lr-btn-copper lr-btn-lg" type="submit">Send message</button>
          <p class="lr-form-msg" id="contactMsg" role="status"></p>
        </form>
        <div class="lr-contact-side">
          <div class="lr-card-box">${icon('chat')}<h3>Help 24/7</h3><p>Chat from any page, or send this form. Orders, fit, returns or anything else, we’re here to help.</p><button class="lr-btn lr-btn-line lr-btn-sm" type="button" data-open-chat>Open chat</button></div>
          <div class="lr-card-box">${icon('wrench')}<h3>Fitment questions</h3><p>Include your year, make, model and engine. A VIN is even better.</p></div>
          <div class="lr-card-box">${icon('truck')}<h3>Where's my order?</h3><p><a href="${url.page('track')}">Track it here</a> with your order number.</p></div>
        </div>
      </div>`,
      after() {
        document.getElementById('contactForm').addEventListener('submit', (e) => {
          e.preventDefault();
          const rules = [['cName', (x) => Boolean(x) || 'Enter your name.'], ['cEmail', (x) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x) || 'Enter a valid email.'], ['cMsg', (x) => x.length >= 10 || 'Tell us a bit more (10+ characters).']];
          let bad = null;
          rules.forEach(([id, test]) => { const el = document.getElementById(id); const r = test(el.value.trim()); document.getElementById(`${id}Err`).textContent = r === true ? '' : r; if (r !== true && !bad) bad = el; });
          const msg = document.getElementById('contactMsg');
          if (bad) { bad.focus(); msg.textContent = ''; return; }
          msg.textContent = 'Thanks. You’ll get an answer by email, and it will show up under Messages in your account. (Preview: nothing was sent.)';
          msg.className = 'lr-form-msg is-ok';
          e.target.reset();
        });
      },
    },
    reviews: {
      title: 'Customer reviews', kicker: 'Reviews', lead: 'What people say after the parts are on the car.',
      body: () => {
        const total = P.reduce((a, p) => a + p.reviewCount, 0);
        const avg = (P.reduce((a, p) => a + CAT.reviewsFor(p).reduce((b, r) => b + r.rating, 0), 0) / total).toFixed(1);
        return `<div class="lr-reviews-top"><div><p class="lr-big-score">${avg}</p>${stars(Number(avg))}<p>${total.toLocaleString()} reviews across ${P.length} parts</p></div>
          <div class="lr-chips" id="revChips"><button type="button" class="lr-chip is-on" data-rcat="">All</button>${CAT.categories.map((c) => `<button type="button" class="lr-chip" data-rcat="${c.id}">${esc(c.name)}</button>`).join('')}</div></div>
          <div class="lr-review-tools"><p class="lr-review-count" id="revCount"></p><label class="lr-select"><span>Sort</span><select id="revSort"><option value="new">Most recent</option><option value="high">Highest rated</option><option value="low">Lowest rated</option></select></label></div><div class="lr-review-wall" id="revWall"></div><div class="lr-review-more"><button class="lr-btn lr-btn-line" type="button" id="revMore"></button><button class="lr-btn lr-btn-line" type="button" id="revAll"></button></div>`;
      },
      after() {
        // Every review from every part, newest first, a page at a time; the chips narrow it to one kind of part.
        const all = P.flatMap((p) => CAT.reviewsFor(p).map((r) => ({ ...r, p })));
        const card = (r) => `<article class="lr-review" data-rc="${r.p.category}"><div class="lr-review-top">${stars(r.rating)}<b>${esc(r.title)}</b></div><p>${esc(r.body)}</p><p class="lr-review-by">${esc(r.name)}${r.vehicle ? ` &middot; ${esc(r.vehicle)}` : ''} &middot; ${niceDate(r.date)}</p><a class="lr-review-product" href="${url.product(r.p)}"><span class="lr-mini-art">${art(r.p)}</span>${esc(title(r.p))}</a></article>`;
        const wall = CAT.pageReviews({ reviews: all, card: card, list: document.getElementById('revWall'), count: document.getElementById('revCount'), more: document.getElementById('revMore'), all: document.getElementById('revAll'), sort: document.getElementById('revSort'), first: 24, step: 24 });
        $$('[data-rcat]').forEach((b) => b.addEventListener('click', () => {
          $$('[data-rcat]').forEach((x) => { x.classList.toggle('is-on', x === b); x.setAttribute('aria-pressed', String(x === b)); });
          wall.filter(b.dataset.rcat ? (r) => r.p.category === b.dataset.rcat : null);
        }));
      },
      wide: true,
    },
    shipping: {
      title: 'Shipping', kicker: 'Help', lead: `Free shipping to the lower 48 states on orders of $${FREE_SHIP} or more.`,
      body: () => `${SAMPLE_LEGAL}<table class="lr-table lr-ship-table"><thead><tr><th>Where it's going</th><th>Shipping</th></tr></thead><tbody>
          <tr><td>Lower 48 states</td><td>Free on orders of $${FREE_SHIP}+, otherwise $${SHIP_FLAT}</td></tr>
          <tr><td>Alaska and Hawaii</td><td>$${SHIP_ZONES.akhi[1]}</td></tr>
          <tr><td>Canada</td><td>$${SHIP_ZONES.ca[1]}</td></tr>
          <tr><td>Other countries we ship to</td><td>$${SHIP_ZONES.intl[1]}</td></tr></tbody></table>
        <h2>How it ships</h2><p>Every order ships with tracking from our warehouse, using the best carrier for where it's going. You get an email with the tracking number as soon as the label is made. Big orders can ship in more than one box, each with its own tracking.</p>
        <h2>Outside the US</h2><p>Import duties, taxes and brokerage fees are set by your country, are paid by you on delivery and are not included in our prices or shipping.</p>
        <h2>Damaged in shipping</h2><p>Send photos of the box and the part through a <a href="${url.page('request')}?type=return">return request</a> and we'll sort it out. Keep the packaging until it's settled.</p>`,
    },
    refund: {
      title: 'Returns & refunds', kicker: 'Help', lead: `${RETURN_DAYS} days to send back a part you haven't used. The return label is free.`,
      body: () => `${SAMPLE_LEGAL}<ol class="lr-steps-list"><li><b>Start the return</b><span>From your account, open the order and press Start a return. No account? <a href="${url.page('request')}?type=return">Start it with your order number and email</a>.</span></li><li><b>Tell us why, add photos</b><span>Pick the parts and the reason. Photos are needed if a part arrived damaged or wrong.</span></li><li><b>Ship it free</b><span>Once we approve it, we email you a prepaid return label.</span></li><li><b>Get your refund</b><span>We check the part when it arrives, then refund you the way you chose.</span></li></ol>
        <h2>What can be returned</h2><p>Parts that are unused and uninstalled, within ${RETURN_DAYS} days of delivery. Test-fitting a part without running it is fine. A part that broke while in use is a <a href="${url.page('warranty')}">warranty claim</a>, not a return.</p>
        <h2>Your refund</h2><table class="lr-table"><tbody>
          <tr><th scope="row">Back to your card</th><td>Minus a 5% restocking fee</td></tr>
          <tr><th scope="row">As LR-CO store credit</th><td>Full amount, no fee</td></tr>
          <tr><th scope="row">Our mistake (damaged, wrong item, defect)</th><td>No fee either way</td></tr></tbody></table>
        <p>Tax is refunded in proportion to what you return. If you paid partly with store credit, that part comes back as credit.</p>
        <h2>Cancelling an order</h2><p>You can cancel before it ships. Refunds to your card have the same 5% fee where allowed; choose store credit and there's no fee. If we cancel, or a delay means you're owed a full refund, there's no fee.</p>`,
    },
    warranty: {
      title: 'Warranty', kicker: 'Help', lead: 'Every part has a warranty. We replace first.',
      body: () => `${SAMPLE_LEGAL}<p>Each part's warranty period is listed on its page, under Specs. It covers defects in materials and workmanship, like a cracked weld or a warped flange, for the original buyer.</p>
        <h2>Making a claim</h2><ol class="lr-steps-list"><li><b>Start a claim</b><span>From your account, or <a href="${url.page('request')}?type=warranty">with your order number and email</a>. Your receipt works too.</span></li><li><b>Show us</b><span>Add photos or a short video. Sometimes we'll need the part back, and we send a free label for it.</span></li><li><b>Get a replacement</b><span>If we're out of stock, you're first in line when the next ones arrive. You keep the rest of your original warranty on the replacement.</span></li></ol>
        <h2>Not covered</h2><ul class="lr-bullets"><li>Damage from installation mistakes, accidents or impacts</li><li>Discoloring from heat (normal on stainless)</li><li>Parts that have been modified</li><li>Labor, tuning or other costs</li></ul>
        <p>This warranty doesn't take away any rights you have by law.</p>`,
    },
    faq: {
      title: 'FAQ', kicker: 'Help', lead: 'Quick answers to what people ask most.',
      body: () => `<div class="lr-faq">${[
        ['How do I know a part fits my car?', `Every part lists the years, models and engine it fits, right under the price. Still not sure? <a href="${url.page('contact')}">Send us your VIN</a> and we'll confirm before you order.`],
        ['How much is shipping?', `Free to the lower 48 states on orders of $${FREE_SHIP}+, otherwise $${SHIP_FLAT}. Alaska and Hawaii $${SHIP_ZONES.akhi[1]}, Canada $${SHIP_ZONES.ca[1]}, other countries $${SHIP_ZONES.intl[1]}. <a href="${url.page('shipping')}">Shipping details</a>.`],
        ['Do you ship outside the US?', `Yes, to Canada and many other countries. Import duties and taxes are paid by you on delivery.`],
        ['Can I return a part?', `Yes, within ${RETURN_DAYS} days of delivery if it's unused and uninstalled. The return label is free. Refunds to your card have a 5% restocking fee; store credit has none. <a href="${url.page('refund')}">Return policy</a>.`],
        ['What is store credit?', 'Money in your LR-CO account from a refund you chose to take as credit. It never expires, works on anything (including shipping), and is protected by two-step sign-in or a passkey.'],
        ['Do I need a tune for a downpipe?', 'On most turbo cars, yes. Without one the car may run poorly or show a check engine light.'],
        ['Are your parts street legal?', 'Parts marked for off-road use are for off-road and competition vehicles only. Check your state’s emissions laws before installing.'],
        ['Can I change or cancel my order?', 'Yes, before it ships. Message us right away. Refunds to your card have a 5% fee where allowed; store credit has none.'],
        ['Do you sell gift cards?', 'Not right now.'],
        ['Do you offer a military discount?', `Yes. See the <a href="${url.page('military')}">military discount page</a>.`],
      ].map(([q, a], i) => `<details${i === 0 ? ' open' : ''}><summary>${q}${icon('plus')}</summary><p>${a}</p></details>`).join('')}</div>`,
    },
    military: {
      title: 'Military discount', kicker: 'Company', lead: '10% off for active duty, veterans, Guard and Reserve.',
      body: () => `<div class="lr-callout">${icon('medal')}<div><b>Thank you for your service.</b><p>Get 10% off every order, with no limit on how often you use it.</p></div></div>
        <ol class="lr-steps-list"><li><b>Send proof</b><span>Use the <a href="${url.page('contact')}">contact form</a> and pick Something else. A photo of a military ID or DD-214 with personal numbers covered is fine.</span></li><li><b>Get your code</b><span>We reply with a personal code within one business day.</span></li><li><b>Save on every order</b><span>Enter the code at checkout.</span></li></ol>`,
    },
    social: {
      title: 'Social', kicker: 'Company', lead: 'Builds, installs and new parts. Tag yours with #LRCOBuilt.',
      body: () => `<div class="lr-social-cards">${[['camera', 'Instagram', 'Build photos and new parts'], ['play', 'YouTube', 'Install walk-throughs and sound clips'], ['bolt', 'TikTok', 'Quick before-and-after sound checks'], ['chat', 'Facebook', 'Group for owners and questions']].map(([ic, n, t]) => `<div class="lr-card-box">${icon(ic)}<h3>${n}</h3><p>${t}</p><span class="lr-soon">Coming soon</span></div>`).join('')}</div>
        <h2>From the community</h2>
        <div class="lr-builds">${[['wrx-08-14-downpipe', '2011 WRX', '3" downpipe and a pro tune'], ['accord-94-97-header', '1996 Accord', 'The $100 header, installed in an afternoon'], ['370z-09-20-test-pipes', '2015 370Z', 'Test pipes for track days'], ['civic-06-11-intake', '2009 Civic', 'Intake and a cleaner sound'], ['mustang-gt-11-14-x-pipe', '2013 Mustang GT', 'X-pipe for the crossover rasp'], ['miata-99-05-intake', '2003 Miata', 'Weekend autocross build']].map(([id, car, cap]) => `<a class="lr-build" href="${url.product(byId(id))}"><span>${art(byId(id))}</span><b>${car}</b><small>${cap}</small></a>`).join('')}</div>`,
      wide: true,
    },
    privacy: {
      title: 'Privacy policy', kicker: 'Legal', lead: 'What we collect, why, and what you can do about it.',
      body: () => `${SAMPLE_LEGAL}<h2>What we collect</h2><p>Your name, email, shipping address and phone number when you order. Your order history, wishlist and support messages if you make an account. Basic device and browsing data to keep the site working.</p>
        <h2>Your LR-CO account is only for LR-CO</h2><p>Your account, orders, store credit and emails here are kept separate from any other store.</p>
        <h2>How we use it</h2><p>To fill and ship orders, answer questions, prevent fraud and, if you opt in, send deal emails.</p>
        <h2>Who we share it with</h2><p>Only the companies that help us run the store: our payment processor, shipping carriers and email provider. We never sell your information.</p>
        <h2>Payments</h2><p>Card details go straight to our payment processor. LR-CO never sees or stores your full card number.</p>
        <h2>Your choices</h2><p>Deal emails are only sent if you opt in, and you can unsubscribe at any time. You can delete your account yourself; order and payment records are kept as the law requires. Ask us to see or correct your data through the <a href="${url.page('contact')}">contact page</a>.</p>`,
    },
    terms: {
      title: 'Terms & conditions', kicker: 'Legal', lead: 'The rules for buying from LR-CO.',
      body: () => `${SAMPLE_LEGAL}<h2>Orders</h2><p>An order is accepted when it ships. We may cancel an order with a pricing or stock error and refund it in full.</p>
        <h2>Prices</h2><p>Prices are in US dollars and can change without notice. The price at checkout is the price you pay.</p>
        <h2>Installation and use</h2><p>Performance parts should be installed by someone qualified. You are responsible for following the laws where you drive, including emissions laws.</p>
        <h2>Off-road parts</h2><p>Parts marked for off-road use may not be installed on vehicles driven on public roads. See the <a href="${url.page('vcw')}">vehicle compliance waiver</a>.</p>
        <h2>Returns, cancellations and store credit</h2><p>See the <a href="${url.page('refund')}">return policy</a>. Store credit can only be used at LR-CO, doesn't expire and can't be exchanged for cash unless the law requires it.</p>
        <h2>Limits</h2><p>Our responsibility is limited to the price you paid for the part, except where the law says otherwise.</p>`,
    },
    vcw: {
      title: 'Vehicle compliance waiver', kicker: 'Legal', lead: 'Read this before buying parts marked for off-road use.',
      body: () => `${SAMPLE_LEGAL}<p>Some parts on this site, including catless downpipes and test pipes, change or remove emissions equipment. They are sold for off-road and competition vehicles only.</p>
        <h2>By buying an off-road part you confirm that</h2><ul class="lr-bullets"><li>The part will be installed on a vehicle that is not driven on public roads</li><li>You understand federal and state emissions laws and will follow them</li><li>You are responsible for any fines, failed inspections or warranty loss that come from installing the part</li></ul>
        <h2>California and similar states</h2><p>These parts are not legal for use on public roads in California or states that follow California emissions rules.</p>`,
    },
    cua: {
      title: 'Consumer use agreement', kicker: 'Legal', lead: 'How LR-CO parts are meant to be used.',
      body: () => `${SAMPLE_LEGAL}<p>Performance parts change how a vehicle runs. Installing them can affect drivability, emissions, noise and manufacturer warranties.</p>
        <h2>You agree to</h2><ul class="lr-bullets"><li>Have parts installed by a qualified person</li><li>Check fitment before installing</li><li>Use parts only where it is legal to do so</li><li>Stop using a part that is damaged or not working correctly</li></ul>`,
    },
    prop65: {
      title: 'Proposition 65', kicker: 'Legal', lead: 'Information for California customers.',
      body: () => `${SAMPLE_LEGAL}<div class="lr-callout lr-callout-warn">${icon('shield')}<div><b>WARNING</b><p>These products can expose you to chemicals including nickel and chromium (hexavalent compounds), which are known to the State of California to cause cancer. For more information go to www.P65Warnings.ca.gov.</p></div></div>
        <p>Stainless steel exhaust parts contain nickel and chromium. Wear gloves when handling and cutting parts, and wash your hands after installation.</p>`,
    },
  };
  const INFO_NAV = [['Help', HELP_LINKS.filter(([, k]) => k !== 'track' && k !== 'request')], ['Company', COMPANY_LINKS], ['Legal', LEGAL_LINKS]];

  Object.entries(INFO).forEach(([key, info]) => {
    PAGES[key] = () => ({
      title: info.title,
      html: `<section class="lr-info-head"><div class="lr-wrap">${crumbs([['Home', url.home], [info.title]])}<p class="lr-label">${esc(info.kicker)}</p><h1 class="lr-page-title">${esc(info.title)}</h1><p class="lr-page-sub">${esc(info.lead)}</p></div></section>
        <div class="lr-wrap lr-info${info.wide ? ' is-wide' : ''}">
          ${info.wide ? '' : `<nav class="lr-info-nav" aria-label="Help pages">${INFO_NAV.map(([group, links]) => `<p>${group}</p><ul>${links.map(([label, k]) => `<li><a href="${url.page(k)}"${k === key ? ' aria-current="page"' : ''}>${esc(label)}</a></li>`).join('')}</ul>`).join('')}</nav>`}
          <article class="lr-prose">${info.body()}</article>
        </div>`,
      after: info.after,
    });
  });

  // LR-CO's transactional email designs (each store sends its own, from its own domain).
  PAGES.emails = () => {
    const o = SAMPLE_ORDERS[1];
    const t = orderTotals(o);
    const u = signedIn();
    const btn = (label) => `<span class="lr-mail-btn">${label}</span>`;
    const itemRows = o.items.map(([id, q]) => { const p = byId(id); return `<tr><td class="lr-mail-art">${art(p)}</td><td>${esc(title(p))}<small>Qty ${q}</small></td><td>${money(price(p) * q)}</td></tr>`; }).join('');
    const mail = (id, label, subject, inner) => `<section class="lr-mail-wrap" id="${id}">
      <p class="lr-mail-label">${label}</p>
      <div class="lr-mail-meta"><p><b>From</b> LR-CO</p><p><b>Subject</b> ${subject}</p></div>
      <div class="lr-mail">
        <div class="lr-mail-top"><span class="lr-logo">${logo(true)}</span></div>
        <div class="lr-mail-rails" aria-hidden="true"></div>
        <div class="lr-mail-body">${inner}</div>
        <div class="lr-mail-foot"><p><b>LR-CO</b> &middot; Help 24/7: reply to this email or chat on the site</p><p>You're getting this email because you ordered from LR-CO.</p></div>
      </div>
    </section>`;
    const list = [
      ['confirm', 'Order confirmed', `Order ${o.n} confirmed`, `<h1>Thanks, ${esc(u.first)}. We've got your order.</h1><p>We'll email tracking as soon as it ships.</p>
        <table class="lr-mail-items">${itemRows}</table>
        <table class="lr-mail-totals"><tr><td>Subtotal</td><td>${money(t.sub)}</td></tr><tr><td>Shipping</td><td>${t.ship ? money(t.ship) : 'Free'}</td></tr><tr class="is-total"><td>Total</td><td>${money(t.total)}</td></tr></table>${btn('View your order')}`],
      ['shipped', 'Shipped', 'Your LR-CO order is on the way', `<h1>It's on the way.</h1><p>Order ${o.n} left our warehouse.</p><div class="lr-mail-box"><small>${esc(o.carrier)}</small><b>${esc(o.tracking)}</b></div>${btn('Track package')}<p class="lr-mail-small">Big orders can ship in more than one box. Each one gets its own tracking email.</p>`],
      ['return', 'Return approved', 'Return approved: your free label is ready', `<h1>Your return is approved.</h1><ol class="lr-mail-steps"><li>Print the label below.</li><li>Pack the part, in its original box if you can.</li><li>Drop it off with the carrier within 7 days.</li></ol>${btn('Download return label')}<p class="lr-mail-small">We'll refund you the way you chose once the part is back and checked: to your card (minus the 5% restocking fee) or as store credit with no fee.</p>`],
      ['credit', 'Store credit added', 'You have $25.00 in LR-CO store credit', `<h1>$25.00 store credit added.</h1><div class="lr-mail-box lr-mail-credit"><small>Your balance</small><b>${money(25)}</b></div><p>From your return on order LRC-103871. It never expires and works on anything at LR-CO, including shipping.</p><p class="lr-mail-small">To use it you'll confirm with your passkey or authenticator app, so only you can spend it.</p>${btn('See your store credit')}`],
      ['review', 'Review request (7 days after delivery)', `How's the ${esc(title(byId(o.items[0][0])))}?`, `<h1>How's it going on the car?</h1><p>Rate your ${esc(title(byId(o.items[0][0])))}. It helps other people pick the right part.</p><p class="lr-mail-stars">${[1, 2, 3, 4, 5].map((n) => `<span aria-label="${n} stars">&#9733;</span>`).join('')}</p><p class="lr-mail-small">We read every review before it's posted, good or bad.</p>`],
    ];
    return {
      title: 'Email designs',
      html: `<section class="lr-info-head"><div class="lr-wrap">${crumbs([['Home', url.home], ['Email designs']])}<p class="lr-label">Design preview</p><h1 class="lr-page-title">LR-CO emails</h1><p class="lr-page-sub">How LR-CO's order emails look. Each store sends its own, from its own address.</p></div></section>
        <div class="lr-wrap lr-mails">
          <div class="lr-chips">${list.map(([id, label]) => `<a class="lr-chip" href="#${id}">${label.replace(/ \(.*\)/, '')}</a>`).join('')}</div>
          <div class="lr-mail-grid">${list.map(([id, label, subject, inner]) => mail(id, label, subject, inner)).join('')}</div>
        </div>`,
    };
  };

  PAGES.notfound = () => ({ title: 'Page not found', html: `<div class="lr-wrap"><div class="lr-empty">${icon('search')}<h1>This page isn\u2019t here</h1><p>Try the search, or head back home.</p><a class="lr-btn lr-btn-copper" href="${url.home}">Go home</a></div></div>` });


  // ------------------------------------------------------------------ render and global events
  // Adding never opens a drawer or pop-up: the "+ Add" link itself confirms, and the header bag count ticks up.
  function addToCart(id, qty = 1, quiet = false) {
    const p = byId(id);
    if (!p || p.stock <= 0) return;
    cart.add(id, qty);
    if (onCartChange) onCartChange();
    $$('.lr-bag-link').forEach((a) => { a.classList.remove('is-tick'); void a.offsetWidth; a.classList.add('is-tick'); });
    if (!quiet && isPhone()) toast(`Added to bag: ${title(p)}`);
  }

  function render() {
    const root = document.getElementById('lr-root');
    const key = document.body.dataset.page;
    const view = (PAGES[key] || PAGES.notfound)();
    document.title = `${view.title} | ${BRAND}`;
    const checkoutChrome = view.chrome === 'checkout';
    document.documentElement.classList.toggle('lr-checkout-chrome', checkoutChrome);
    root.innerHTML = (checkoutChrome
      ? `<a class="lr-skip" href="#main">Skip to content</a><header class="lr-header lr-co-header"><div class="lr-wrap lr-header-inner"><a class="lr-logo" href="${url.home}" aria-label="LR-CO home">${wordmark()}</a><span class="lr-co-secure">Secure checkout</span><a class="lr-headlink" href="${url.page('cart')}">Return to bag</a></div></header>`
      : `<a class="lr-skip" href="#main">Skip to content</a>${header()}${menuOverlay()}`)
      + `<main id="main" class="lr-main lr-page-${esc(key)}" tabindex="-1">${view.html}</main>`
      + (checkoutChrome ? `<footer class="lr-co-footer"><div class="lr-wrap"><a href="${url.page('refund')}">Returns</a><a href="${url.page('shipping')}">Delivery</a><a href="${url.page('privacy')}">Privacy</a><a href="${url.page('terms')}">Terms</a></div></footer>` : footer())
      + overlays(!checkoutChrome);
    updateBadges();
    onCartChange = null;
    onWishChange = null;
    if (view.after) view.after();
  }

  document.addEventListener('click', (e) => {
    const add = e.target.closest('[data-add]');
    if (add) {
      e.preventDefault();
      addToCart(add.dataset.add, 1);
      if (add.classList.contains('lr-add-link')) {
        add.textContent = 'Added ✓';
        add.classList.add('is-added');
        clearTimeout(add.t);
        add.t = setTimeout(() => { add.textContent = '+ Add'; add.classList.remove('is-added'); }, 1800);
      }
      return;
    }
    if (e.target.closest('[data-open-menu]')) { setMenu(true); return; }
    if (e.target.closest('[data-close-menu]')) { setMenu(false); return; }
    if (e.target.closest('[data-close-lightbox]')) { closeLightbox(); return; }
    const lbBtn = e.target.closest('[data-lb]');
    if (lbBtn) { stepLightbox(Number(lbBtn.dataset.lb)); return; }
    if (e.target.closest('.lr-lightbox-stage')) { closeLightbox(); return; }
    if (e.target.closest('[data-open-chat]')) { const panel = document.getElementById('lrChat'); if (panel && !panel.hidden) closeChat(); else openChat(); return; }
    if (e.target.closest('[data-close-chat]')) { closeChat(); return; }
    const save = e.target.closest('[data-wish]');
    if (save) {
      const on = wish.toggle(save.dataset.wish);
      $$(`[data-wish="${save.dataset.wish}"]`).forEach((b) => { b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on)); const s = $('span', b); if (s) s.textContent = on ? 'Saved' : 'Save'; });
      toast(on ? 'Saved to your wishlist' : 'Removed from your wishlist');
      if (onWishChange) onWishChange();
      return;
    }
    const msg = e.target.closest('[data-preview-msg]');
    if (msg) toast(msg.dataset.previewMsg);
  });

  // Menu preview picture follows hover and keyboard focus.
  document.addEventListener('mouseover', (e) => { const a = e.target.closest('[data-preview]'); if (a) previewCat(a.dataset.preview); });
  document.addEventListener('focusin', (e) => { const a = e.target.closest('[data-preview]'); if (a) previewCat(a.dataset.preview); });

  document.addEventListener('keydown', (e) => {
    const box = document.getElementById('lrLightbox');
    if (box && !box.hidden) {
      if (e.key === 'Escape') { closeLightbox(); return; }
      if (e.key === 'ArrowRight') { stepLightbox(1); return; }
      if (e.key === 'ArrowLeft') { stepLightbox(-1); return; }
      if (e.key === 'Tab') { const f = $$('button', box); const i = f.indexOf(document.activeElement); if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); } }
      return;
    }
    if (e.key !== 'Escape') return;
    const menu = document.getElementById('lrMenu');
    if (menu && !menu.hidden) { setMenu(false); return; }
    closeChat();
  });

  // Swipe in the lightbox.
  let touchX = null;
  document.addEventListener('touchstart', (e) => { if (e.target.closest('#lrLightbox')) touchX = e.touches[0].clientX; }, { passive: true });
  document.addEventListener('touchend', (e) => {
    if (touchX == null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    touchX = null;
    if (Math.abs(dx) > 50) stepLightbox(dx < 0 ? 1 : -1);
  }, { passive: true });

  document.addEventListener('submit', (e) => {
    if (e.target.id === 'footNews') {
      e.preventDefault();
      const email = document.getElementById('footEmail');
      const msg = document.getElementById('footMsg');
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
      msg.textContent = ok ? 'Thank you. You’re on the list. (Preview: nothing was sent.)' : 'Enter a valid email address.';
      msg.className = `lr-form-msg ${ok ? 'is-ok' : 'is-bad'}`;
      if (ok) email.value = '';
      return;
    }
    if (e.target.id !== 'lrChatForm') return;
    e.preventDefault();
    const input = document.getElementById('lrChatInput');
    const text = input.value.trim();
    if (!text) { input.focus(); return; }
    const body = document.getElementById('lrChatBody');
    body.insertAdjacentHTML('beforeend', `<div class="lr-bubble is-you"><small>You</small><p>${esc(text)}</p></div>`);
    input.value = '';
    setTimeout(() => {
      body.insertAdjacentHTML('beforeend', '<div class="lr-bubble is-team"><small>LR-CO Concierge</small><p>Thank you. On the live store we’d answer right here, any hour. (Preview)</p></div>');
      body.scrollTop = body.scrollHeight;
    }, 450);
    body.scrollTop = body.scrollHeight;
  });

  window.addEventListener('storage', (e) => { if (e.key === 'lr_preview_cart') { updateBadges(); if (onCartChange) onCartChange(); } });
  window.addEventListener('scroll', () => { document.documentElement.classList.toggle('lr-scrolled', window.scrollY > 10); }, { passive: true });

  render();
})();
