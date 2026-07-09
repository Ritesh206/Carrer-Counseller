/* ═══════════════════════════════════════════════════════════════════════════
   CareerCompass AI — main.js
   Shared utilities: dark-mode, counter animations, scroll effects, toasts
═══════════════════════════════════════════════════════════════════════════ */

/* ── DARK MODE ────────────────────────────────────────────────────────────── */
(function initTheme() {
  const stored = localStorage.getItem('cc-theme') || 'light';
  document.documentElement.setAttribute('data-theme', stored);
  updateThemeIcon(stored);
})();

function updateThemeIcon(theme) {
  const icon = document.getElementById('themeIcon');
  if (!icon) return;
  icon.className = theme === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-fill';
}

document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('themeToggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('cc-theme', next);
      updateThemeIcon(next);
    });
  }

  // ── COUNTER ANIMATION ─────────────────────────────────────────────────
  const counters = document.querySelectorAll('.stat-number[data-target]');
  if (counters.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(el => observer.observe(el));
  }

  // ── SCROLL-REVEAL ANIMATIONS ───────────────────────────────────────────
  const revealEls = document.querySelectorAll('.feature-card, .step-item');
  if (revealEls.length) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.classList.add('anim-visible');
            entry.target.classList.remove('anim-hidden');
          }, i * 80);
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    revealEls.forEach(el => {
      el.classList.add('anim-hidden');
      revealObserver.observe(el);
    });
  }
});

function animateCounter(el) {
  const target = parseInt(el.dataset.target, 10);
  const suffix = el.dataset.suffix || '+';
  const duration = 1800;
  const step = 16;
  const increment = target / (duration / step);
  let current = 0;
  const timer = setInterval(() => {
    current = Math.min(current + increment, target);
    el.textContent = Math.floor(current) + (current >= target ? suffix : '');
    if (current >= target) clearInterval(timer);
  }, step);
}

/* ── GLOBAL TOAST HELPER ──────────────────────────────────────────────────── */
function showToast(message, type = 'success') {
  const container = getOrCreateToastContainer();
  const toast = document.createElement('div');
  const icons  = { success: 'check-circle-fill', error: 'x-circle-fill', info: 'info-circle-fill', warning: 'exclamation-triangle-fill' };
  const colors = { success: '#059669', error: '#dc2626', info: '#0284c7', warning: '#d97706' };
  toast.style.cssText = `
    background:var(--surface);border:1px solid var(--border);color:var(--text);
    border-radius:10px;padding:.85rem 1.25rem;
    display:flex;align-items:center;gap:.75rem;
    box-shadow:var(--shadow-lg);min-width:260px;max-width:380px;
    animation:toastIn .3s ease;font-size:.9rem;
    border-left:3px solid ${colors[type]};
  `;
  toast.innerHTML = `<i class="bi bi-${icons[type]}" style="color:${colors[type]};font-size:1.1rem;flex-shrink:0"></i><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toastOut .3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function getOrCreateToastContainer() {
  let c = document.getElementById('cc-toast-container');
  if (!c) {
    c = document.createElement('div');
    c.id = 'cc-toast-container';
    c.style.cssText = 'position:fixed;bottom:1.5rem;right:1.5rem;z-index:9999;display:flex;flex-direction:column;gap:.6rem;';
    document.body.appendChild(c);
    const style = document.createElement('style');
    style.textContent = '@keyframes toastIn{from{opacity:0;transform:translateX(30px)}to{opacity:1;transform:translateX(0)}}@keyframes toastOut{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(30px)}}';
    document.head.appendChild(style);
  }
  return c;
}

/* ── GLOBAL FETCH WRAPPER ─────────────────────────────────────────────────── */
async function apiPost(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `HTTP ${response.status}`);
  }
  return response.json();
}
