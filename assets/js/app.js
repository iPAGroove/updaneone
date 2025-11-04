// assets/js/app.js
// URSA IPA — Card Modal Controller (ES Module)

const SELECTORS = {
  catalog: '#catalog',
};

const FOCUSABLE = [
  'a[href]', 'area[href]', 'button:not([disabled])', 'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])', 'textarea:not([disabled])', '[tabindex]:not([tabindex="-1"])'
].join(',');

let modalOverlay, modalEl, closeBtn, actionBtn, titleEl, contentEl, imageEl, tagsEl, badgeEl;
let activeTrigger = null;
let scrollLock = { y: 0 };

// ---------- Build modal once ----------
function buildModal() {
  if (modalOverlay) return;

  const tpl = document.createElement('div');
  tpl.className = 'modal-overlay';
  tpl.id = 'ursaModal';
  tpl.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="ursaModalTitle">
      <div class="modal-header">
        <span class="modal-badge" style="display:none;"></span>
        <h3 class="modal-title" id="ursaModalTitle">Детали</h3>
        <button class="modal-close" aria-label="Закрыть">&times;</button>
      </div>
      <div class="modal-body" style="display:flex; flex-direction:column; gap:12px;">
        <img class="modal-image" alt="" style="display:none; width:100%; border-radius:12px; border:1px solid var(--border);" />
        <div class="modal-tags" style="display:none; gap:8px; flex-wrap:wrap;"></div>
        <div class="modal-content">Описание недоступно.</div>
      </div>
      <button class="modal-btn">Открыть</button>
    </div>
  `;
  document.body.appendChild(tpl);

  // cache refs
  modalOverlay = tpl;
  modalEl = tpl.querySelector('.modal');
  closeBtn = tpl.querySelector('.modal-close');
  actionBtn = tpl.querySelector('.modal-btn');
  titleEl = tpl.querySelector('.modal-title');
  contentEl = tpl.querySelector('.modal-content');
  imageEl = tpl.querySelector('.modal-image');
  tagsEl = tpl.querySelector('.modal-tags');
  badgeEl = tpl.querySelector('.modal-badge');

  // listeners
  closeBtn.addEventListener('click', closeModal);
  actionBtn.addEventListener('click', onActionClick);
  modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });
  document.addEventListener('keydown', onKeydown);

  // prevent iOS vertical bleed inside overlay
  modalOverlay.addEventListener('touchmove', (e) => {
    // allow internal modal scroll, block overlay scroll bounce
    if (!modalEl.contains(e.target)) e.preventDefault();
  }, { passive: false });

  // focus trap
  modalEl.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const focusables = modalEl.querySelectorAll(FOCUSABLE);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
    else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
  });
}

// ---------- Open / Close ----------
function openModalFromCard(card) {
  buildModal();

  activeTrigger = card;

  // read dataset
  const {
    title = 'Информация',
    subtitle = '',
    desc = '',
    img = '',
    tags = '',
    cta = 'Открыть',
    link = '',
    badge = '',
  } = card.dataset;

  titleEl.textContent = title || 'Информация';
  titleEl.title = subtitle || '';

  // Description
  const text = desc || subtitle || 'Описание скоро будет доступно.';
  contentEl.textContent = text;

  // Image (optional)
  if (img) {
    imageEl.src = img;
    imageEl.alt = title || 'изображение';
    imageEl.style.display = '';
  } else {
    imageEl.removeAttribute('src');
    imageEl.style.display = 'none';
  }

  // Tags (comma separated)
  if (tags) {
    tagsEl.innerHTML = '';
    tags.split(',').map(s => s.trim()).filter(Boolean).forEach(tag => {
      const chip = document.createElement('span');
      chip.textContent = tag;
      chip.style.cssText = `
        display:inline-flex; align-items:center; padding:4px 8px; border-radius:999px;
        background: color-mix(in oklab, var(--bg-elev) 90%, #000 10%);
        border:1px solid var(--border); font-size:12px; color: var(--muted);
      `;
      tagsEl.appendChild(chip);
    });
    tagsEl.style.display = 'flex';
  } else {
    tagsEl.style.display = 'none';
    tagsEl.innerHTML = '';
  }

  // Badge (e.g., VIP)
  if (badge) {
    badgeEl.textContent = badge.toUpperCase();
    badgeEl.style.cssText = `
      display:inline-flex; align-items:center; justify-content:center; margin-right:8px;
      padding:4px 8px; border-radius:10px; font-size:11px; font-weight:800;
      color:#001018; background: ${badge.toLowerCase()==='vip' ? 'linear-gradient(90deg,#ffd54f,#ffa000)' : 'linear-gradient(90deg,var(--accent),#00e0ff)'};
      box-shadow: 0 0 12px rgba(0,179,255,.35);
    `;
  } else {
    badgeEl.style.display = 'none';
  }

  // CTA
  actionBtn.textContent = cta || 'Открыть';
  actionBtn.dataset.link = link || '';

  // lock scroll
  lockBodyScroll();

  // show
  modalOverlay.classList.add('active');

  // focus first interactive
  setTimeout(() => {
    (modalEl.querySelector(FOCUSABLE) || closeBtn).focus();
  }, 10);
}

function closeModal() {
  if (!modalOverlay) return;
  modalOverlay.classList.remove('active');
  unlockBodyScroll();
  if (activeTrigger) {
    // return focus to the card user clicked
    activeTrigger.focus?.();
    activeTrigger = null;
  }
}

function onActionClick() {
  const url = actionBtn.dataset.link || '';
  if (!url) { closeModal(); return; }
  // open in new tab — can be adapted later to router
  window.open(url, '_blank', 'noopener,noreferrer');
  closeModal();
}

function onKeydown(e) {
  if (e.key === 'Escape') {
    e.preventDefault();
    closeModal();
  }
}

// ---------- Body scroll lock (no layout jump) ----------
function lockBodyScroll() {
  scrollLock.y = window.scrollY || document.documentElement.scrollTop;
  document.body.style.position = 'fixed';
  document.body.style.top = `-${scrollLock.y}px`;
  document.body.style.width = '100%';
}

function unlockBodyScroll() {
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';
  window.scrollTo(0, scrollLock.y || 0);
}

// ---------- Event delegation for cards ----------
function initCardClicks() {
  const catalog = document.querySelector(SELECTORS.catalog);
  if (!catalog) return;

  catalog.addEventListener('click', (e) => {
    // find .card
    let el = e.target;
    while (el && el !== catalog && !el.classList?.contains('card')) el = el.parentElement;
    if (!el || el === catalog) return;

    // support keyboard activation too
    openModalFromCard(el);
  });

  // make cards tabbable for a11y
  catalog.querySelectorAll('.card').forEach(card => {
    card.setAttribute('tabindex', '0');
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openModalFromCard(card);
      }
    });
  });
}

// ---------- Boot ----------
document.addEventListener('DOMContentLoaded', () => {
  buildModal();
  initCardClicks();
});
