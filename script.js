/* ============================================================
   PriceRadar — Landing Page Script
   ============================================================ */

// ── Telegram Bot Config (замените токен и chat_id на свои) ────────────────
const TG_BOT_TOKEN = 'YOUR_BOT_TOKEN';      // Вставьте токен @BotFather
const TG_CHAT_ID   = 'YOUR_CHAT_ID';        // ID вашего чата или канала
const TG_USERNAME  = 'vorontsov_dmitriy';   // Для прямых ссылок на Telegram

// ── Header scroll effect ──────────────────────────────────────────────────
const header = document.getElementById('site-header');
const onScroll = () => {
  header.classList.toggle('scrolled', window.scrollY > 10);
};
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// ── Mobile nav ────────────────────────────────────────────────────────────
const burger  = document.getElementById('burger');
const mobNav  = document.getElementById('mob-nav');
burger.addEventListener('click', () => {
  burger.classList.toggle('open');
  mobNav.classList.toggle('open');
  document.body.style.overflow = mobNav.classList.contains('open') ? 'hidden' : '';
});
// Close on link click
mobNav.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    burger.classList.remove('open');
    mobNav.classList.remove('open');
    document.body.style.overflow = '';
  });
});
// Close on ESC
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && mobNav.classList.contains('open')) {
    burger.classList.remove('open');
    mobNav.classList.remove('open');
    document.body.style.overflow = '';
  }
});

// ── Scroll reveal (Intersection Observer) ────────────────────────────────
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('revealed');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ── Animated counters ────────────────────────────────────────────────────
function animateCounter(el, target, suffix, duration) {
  let start = 0;
  const step = target / (duration / 16);
  const tick = () => {
    start = Math.min(start + step, target);
    const formatted = target >= 1000
      ? Math.round(start).toLocaleString('ru-RU')
      : Math.round(start);
    el.textContent = formatted + suffix;
    if (start < target) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const target   = parseInt(el.dataset.target);
      const suffix   = el.dataset.suffix || '';
      const duration = parseInt(el.dataset.duration) || 1200;
      animateCounter(el, target, suffix, duration);
      counterObserver.unobserve(el);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('[data-counter]').forEach(el => counterObserver.observe(el));

// ── Active nav link ───────────────────────────────────────────────────────
const sections  = document.querySelectorAll('section[id]');
const navLinks  = document.querySelectorAll('nav a[href^="#"]');
const navObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.id;
      navLinks.forEach(a => {
        a.style.color = a.getAttribute('href') === '#' + id
          ? 'var(--brand)' : '';
        a.style.background = a.getAttribute('href') === '#' + id
          ? 'var(--brand-bg)' : '';
      });
    }
  });
}, { threshold: 0.4 });
sections.forEach(s => navObserver.observe(s));

// ── FAQ accordion ────────────────────────────────────────────────────────
document.querySelectorAll('.faq-item').forEach(item => {
  item.querySelector('.faq-q').addEventListener('click', () => {
    const isOpen = item.classList.contains('open');
    // Close all
    document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
    // Toggle current
    if (!isOpen) item.classList.add('open');
  });
});

// ── Feedback modal ────────────────────────────────────────────────────────
const modal         = document.getElementById('feedback-modal');
const feedbackForm  = document.getElementById('feedback-form');
const statusEl      = document.getElementById('feedback-status');
const sendBtn       = document.getElementById('send-btn');

function openFeedback() {
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  setTimeout(() => document.getElementById('fb-contact').focus(), 200);
}
function closeFeedback() {
  modal.classList.remove('open');
  document.body.style.overflow = '';
  statusEl.className = 'modal-status';
  statusEl.textContent = '';
  feedbackForm.reset();
  sendBtn.disabled = false;
  sendBtn.textContent = 'Отправить';
}
window.openFeedback  = openFeedback;
window.closeFeedback = closeFeedback;

// Click outside to close
modal.addEventListener('click', e => { if (e.target === modal) closeFeedback(); });

// ESC to close
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && modal.classList.contains('open')) closeFeedback();
});

// Send form
document.getElementById('fb-submit').addEventListener('click', async () => {
  const contact = document.getElementById('fb-contact').value.trim();
  const message = document.getElementById('fb-message').value.trim();
  if (!message) {
    showStatus('Пожалуйста, напишите сообщение', 'err');
    return;
  }

  sendBtn.disabled = true;
  sendBtn.textContent = 'Отправляю...';

  const text = `📩 Сообщение с сайта PriceRadar\n\n` +
               `👤 Контакт: ${contact || 'не указан'}\n` +
               `💬 Сообщение:\n${message}`;

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: TG_CHAT_ID, text, parse_mode: 'HTML' })
      }
    );
    const data = await res.json();
    if (data.ok) {
      showStatus('✅ Сообщение отправлено! Ответим в Telegram.', 'ok');
      feedbackForm.reset();
      setTimeout(closeFeedback, 3000);
    } else {
      throw new Error(data.description || 'Ошибка API');
    }
  } catch (err) {
    console.warn('[Feedback] Telegram API error:', err);
    // Fallback: open Telegram directly
    showStatus(
      `❗ Не удалось отправить автоматически. <a href="https://t.me/${TG_USERNAME}" target="_blank" rel="noopener">Напишите напрямую в Telegram →</a>`,
      'err'
    );
    sendBtn.disabled = false;
    sendBtn.textContent = 'Отправить';
  }
});

function showStatus(msg, type) {
  statusEl.innerHTML = msg;
  statusEl.className = 'modal-status ' + type;
}

// ── Toast utility ────────────────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._tt);
  t._tt = setTimeout(() => t.classList.remove('show'), 2800);
}
window.showToast = showToast;

// ── Smooth CTA pulse animation (hero) ────────────────────────────────────
const heroCta = document.querySelector('.btn-primary-lg');
if (heroCta) {
  setTimeout(() => {
    heroCta.style.animation = 'pulse-ring 3s ease-in-out 3';
  }, 2000);
}

// ── Mockup table row hover animation ────────────────────────────────────
document.querySelectorAll('.mt-row').forEach((row, i) => {
  row.style.opacity = '0';
  row.style.transform = 'translateX(-8px)';
  row.style.transition = `opacity .4s ${i * 0.08}s ease, transform .4s ${i * 0.08}s ease`;
});

const mockupObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      document.querySelectorAll('.mt-row').forEach(row => {
        row.style.opacity = '1';
        row.style.transform = 'translateX(0)';
      });
      mockupObserver.disconnect();
    }
  });
}, { threshold: 0.3 });

const mockup = document.querySelector('.app-mockup');
if (mockup) mockupObserver.observe(mockup);

// ── Comparison table: animate column highlight ───────────────────────────
const compareObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.querySelectorAll('.col-ours').forEach((cell, i) => {
        cell.style.transition = `background .3s ${i * 0.04}s ease`;
      });
    }
  });
}, { threshold: 0.2 });

const compareTable = document.querySelector('.compare-wrap');
if (compareTable) compareObserver.observe(compareTable);
