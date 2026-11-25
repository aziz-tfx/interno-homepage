/*
 * funnel.js — единый трекинг воронки лендингов INTERNO.
 * Один и тот же файл лежит в корне каждого лендинга; подключается одной строкой
 * <script src="/funnel.js" defer></script> перед PromoBanner.js.
 *
 * Что делает:
 *  1. Подключает Microsoft Clarity и Яндекс Метрику (с Вебвизором), если ниже указаны ID,
 *     и Vercel Web Analytics (начнёт собирать данные, когда аналитику включат в проекте Vercel).
 *  2. Запоминает метки первого касания (utm_*, fbclid, ttclid) на 30 дней — window.funnel.utm().
 *  3. Шлёт одинаковые события воронки во все подключённые системы:
 *       form_view    — форма появилась на экране (≥50% видимости)
 *       form_start   — посетитель начал заполнять форму
 *       form_submit  — нажал «отправить»
 *       form_error   — браузер или скрипт страницы отклонил поля
 *       lead_success — сервер подтвердил приём заявки
 *       lead_fail    — заявка не ушла (ошибка сети или сервера)
 *       scroll_25/50/75/100, engaged_30s (в Meta не отправляются)
 *     В Meta уходят как пользовательские события FormView, FormStart, FormSubmit, FormError,
 *     LeadSuccess, LeadFail (trackCustom) — штатный Lead страницы не задваивается.
 *  Код страниц менять не нужно: успех/ошибка заявки определяются по ответу на запросы
 *  к /api/lead, /api/notify и формам amoCRM.
 */
(function () {
  'use strict';
  if (window.funnel) return;

  // ── Заполнить один раз для этого лендинга ─────────────────────────────
  var CONFIG = {
    CLARITY_ID: '',   // clarity.microsoft.com → Settings → Overview → Project ID
    YM_ID: 0          // metrika.yandex.ru → номер счётчика
  };
  // ──────────────────────────────────────────────────────────────────────

  var cfg = Object.assign({}, CONFIG, window.FUNNEL_CONFIG || {});
  var site = window.SITE_CONFIG || {};
  if (!cfg.CLARITY_ID && site.CLARITY_ID) cfg.CLARITY_ID = site.CLARITY_ID;
  if (!cfg.YM_ID && site.YM_ID) cfg.YM_ID = site.YM_ID;

  var PAGE = location.hostname.split('.')[0] + location.pathname.replace(/\/index\.html$/, '/');

  function safe(fn) { try { fn(); } catch (e) { /* аналитика не должна ломать страницу */ } }

  // ── Загрузчики ────────────────────────────────────────────────────────
  safe(function () {
    if (cfg.CLARITY_ID && !window.clarity) {
      (function (c, l, a, r, i, t, y) {
        c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
        t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
        y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
      })(window, document, 'clarity', 'script', cfg.CLARITY_ID);
    }
  });

  safe(function () {
    if (cfg.YM_ID && !window.ym) {
      (function (m, e, t, r, i, k, a) {
        m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
        m[i].l = 1 * new Date();
        k = e.createElement(t); a = e.getElementsByTagName(t)[0];
        k.async = 1; k.src = r; a.parentNode.insertBefore(k, a);
      })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');
      window.ym(cfg.YM_ID, 'init', { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: true });
    }
  });

  safe(function () {
    if (!/^(localhost|127\.)/.test(location.hostname)) {
      window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
      var s = document.createElement('script');
      s.defer = true; s.src = '/_vercel/insights/script.js';
      document.head.appendChild(s);
    }
  });

  // ── Метки первого касания ─────────────────────────────────────────────
  var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'ttclid'];
  var STORE = 'interno_ft';
  var TTL = 30 * 24 * 3600 * 1000;

  function readStore() {
    try {
      var v = JSON.parse(localStorage.getItem(STORE) || 'null');
      if (v && Date.now() - v.t < TTL) return v.u;
    } catch (e) {}
    return null;
  }

  safe(function () {
    var p = new URLSearchParams(location.search), u = {}, has = false;
    UTM_KEYS.forEach(function (k) { var v = p.get(k); if (v) { u[k] = v.slice(0, 200); has = true; } });
    if (has || !readStore()) {
      if (!has && document.referrer && document.referrer.indexOf(location.host) === -1) {
        u.utm_source = new URL(document.referrer).hostname; u.utm_medium = 'referral'; has = true;
      }
      if (has) localStorage.setItem(STORE, JSON.stringify({ t: Date.now(), u: u, landing: PAGE }));
    }
  });

  function utm() {
    var p = new URLSearchParams(location.search), cur = {};
    UTM_KEYS.forEach(function (k) { var v = p.get(k); if (v) cur[k] = v; });
    return Object.keys(cur).length ? cur : (readStore() || {});
  }

  // ── Отправка событий ──────────────────────────────────────────────────
  var sent = {};
  function track(name, params, once) {
    if (once) { // один раз на страницу (для событий формы — один раз на каждую форму)
      var key = name + (params && params.form ? ':' + params.form : '');
      if (sent[key]) return; sent[key] = 1;
    }
    params = Object.assign({ page: PAGE }, params || {});
    // в Meta — только шаги формы и заявки, без событий прокрутки; имена в CamelCase (FormView, LeadSuccess…),
    // чтобы не смешиваться с собственными событиями страниц вроде form_submit
    safe(function () {
      if (window.fbq && /^(form|lead)_/.test(name)) {
        window.fbq('trackCustom', name.replace(/(^|_)(\w)/g, function (m, p1, c) { return c.toUpperCase(); }), params);
      }
    });
    safe(function () { if (window.ym && cfg.YM_ID) window.ym(cfg.YM_ID, 'reachGoal', name, params); });
    safe(function () { if (window.clarity) { window.clarity('event', name); } });
    safe(function () { if (window.gtag) window.gtag('event', name, params); });
    safe(function () { if (window.ttq && name === 'lead_success') window.ttq.track('CompleteRegistration'); });
    safe(function () { if (window.va) window.va('event', { name: name, data: params }); });
  }

  // Clarity: метки для фильтров записей сессий
  safe(function () {
    var u = utm();
    if (window.clarity) {
      window.clarity('set', 'page', PAGE);
      if (u.utm_source) window.clarity('set', 'utm_source', u.utm_source);
      if (u.utm_campaign) window.clarity('set', 'utm_campaign', u.utm_campaign);
      if (window.AB_HERO) window.clarity('set', 'ab_variant', String(window.AB_HERO));
    }
  });

  // ── Формы ─────────────────────────────────────────────────────────────
  function formId(f) {
    return f.id || f.getAttribute('name') || f.getAttribute('data-source') ||
      ('form' + Array.prototype.indexOf.call(document.forms, f));
  }

  var pending = null; // форма, чья заявка сейчас отправляется

  function bindForms() {
    var forms = document.querySelectorAll('form');
    forms.forEach(function (f) {
      if (f.__funnel) return; f.__funnel = 1;
      var id = formId(f);
      f.addEventListener('focusin', function () {
        track('form_view', { form: id }, true); // начал заполнять — значит точно видел
        track('form_start', { form: id }, true);
      });
      f.addEventListener('invalid', function (e) {
        var t = e.target || {};
        track('form_error', { form: id, field: t.name || t.type || '' });
      }, true);
      f.addEventListener('submit', function () {
        track('form_submit', { form: id });
        pending = { form: id, t: Date.now() };
        // скрипт страницы может отклонить отправку своей валидацией — проверим через мгновение
        setTimeout(function () {
          var bad = f.querySelector('.bad, .error, .invalid, [aria-invalid="true"]');
          if (bad && pending && pending.form === id && Date.now() - pending.t < 1500) {
            track('form_error', { form: id, field: (bad.querySelector('input,select') || bad).name || '' });
          }
        }, 300);
      }, true);
      if ('IntersectionObserver' in window) {
        // форма в зоне экрана, но может быть скрыта (попап с opacity:0) — тогда ждём, пока станет видимой
        var timer = null;
        var seen = function () {
          return !f.checkVisibility || f.checkVisibility({ opacityProperty: true, visibilityProperty: true });
        };
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) {
            clearInterval(timer);
            if (!en.isIntersecting) return;
            var check = function () {
              if (seen()) { clearInterval(timer); io.disconnect(); track('form_view', { form: id }, true); }
            };
            check();
            timer = setInterval(check, 1000);
          });
        }, { threshold: 0.5 });
        io.observe(f);
      }
    });
  }

  // Подтверждение заявки по ответу сервера
  var LEAD_URL = /\/api\/(lead|notify)\b|amo-?forms?\.|amocrm\.ru\/queue|sheets\.googleapis/;
  var leadDone = false;
  safe(function () {
    var orig = window.fetch;
    if (!orig) return;
    window.fetch = function (input, init) {
      var url = typeof input === 'string' ? input : (input && input.url) || '';
      var p = orig.apply(this, arguments);
      if (LEAD_URL.test(url) && (!init || !init.method || String(init.method).toUpperCase() === 'POST')) {
        var form = pending ? pending.form : '';
        p.then(function (r) {
          // no-cors запросы к amo возвращают opaque-ответ — это успешная отправка
          if (r.ok || r.type === 'opaque') {
            if (!leadDone) { leadDone = true; track('lead_success', { form: form, endpoint: url.split('?')[0] }); }
          } else {
            track('lead_fail', { form: form, endpoint: url.split('?')[0], status: r.status });
          }
        }, function () {
          track('lead_fail', { form: form, endpoint: url.split('?')[0], status: 0 });
        });
      }
      return p;
    };
  });

  // ── Вовлечённость ─────────────────────────────────────────────────────
  safe(function () {
    var marks = [25, 50, 75, 100], ticking = false;
    function onScroll() {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        var h = document.documentElement.scrollHeight - innerHeight;
        var pct = h > 0 ? (scrollY / h) * 100 : 100;
        while (marks.length && pct >= marks[0] - 1) track('scroll_' + marks.shift(), null, true);
        if (!marks.length) removeEventListener('scroll', onScroll);
      });
    }
    addEventListener('scroll', onScroll, { passive: true });
    setTimeout(function () { if (document.visibilityState === 'visible') track('engaged_30s', null, true); }, 30000);
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindForms);
  else bindForms();
  // формы, которые страница дорисовывает позже (React, модальные окна)
  safe(function () {
    var t = null;
    new MutationObserver(function () {
      if (t) return;
      t = setTimeout(function () { t = null; bindForms(); }, 500);
    }).observe(document.documentElement, { childList: true, subtree: true });
  });

  window.funnel = { track: track, utm: utm, config: cfg };
})();
