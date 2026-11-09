/* ===== Акция 11.11 «Второй курс в подарок» — sticky-баннер =====
   Дедлайн акции задаётся ТОЛЬКО здесь: INTERNO_PROMO читают и баннер,
   и карточка PromoOffer.js (подключается после этого файла). После
   hideAfter промо не рендерится вовсе — выключается без деплоя.
   Клик ведёт на страницу акции internoedu.uz/aksiya/ с UTM-метками. */
window.INTERNO_PROMO = {
  deadline:  '2026-11-15T23:59:59+05:00', // конец обратного отсчёта (Ташкент)
  hideAfter: '2026-11-16T00:00:00+05:00', // с этого момента промо не рендерится
  url: '/aksiya/', // страница акции
  site: 'homepage', // utm_source
  nav: ".nav", // шапка, которую баннер сдвигает вниз
  offerBefore: "#open-lesson", // перед каким блоком PromoOffer.js вставит карточку
  icon: '/promo-gift-1111.webp',
  displayFont: "'Oswald',sans-serif"
};

(function(){
  var P = window.INTERNO_PROMO;
  if (!P || new Date() >= new Date(P.hideAfter)) return;
  if (P.onlyPaths && P.onlyPaths.indexOf(location.pathname) === -1) return;
  var closed = false;
  try { closed = sessionStorage.getItem('interno_promo1111_closed') === '1'; } catch(_) {}
  if (closed) return;

  // ссылка на страницу акции с UTM: откуда пришли (сайт) и с какого элемента
  P.link = function(medium){
    var u = P.url + (P.url.indexOf('?') === -1 ? '?' : '&');
    return u + 'utm_source=' + encodeURIComponent(P.site) + '&utm_medium=' + medium + '&utm_campaign=promo_1111';
  };

  var T = {
    ru: { full: '🎁 Акция 11.11: второй курс в подарок — до 15 ноября',
          short: '🎁 Акция 11.11: 2-й курс в подарок',
          more: 'Подробнее', units: ['д','ч','м'], close: 'Закрыть' },
    uz: { full: "🎁 11.11 aksiyasi: ikkinchi kurs sovg'a — 15-noyabrgacha",
          short: "🎁 11.11: 2-kurs sovg'a",
          more: 'Batafsil', units: ['k','s','d'], close: 'Yopish' }
  };
  function lang(){ return (document.documentElement.lang || '').slice(0,2) === 'uz' ? 'uz' : 'ru'; }

  var style = document.createElement('style');
  style.textContent = [
    '.promo-banner{position:sticky;top:0;z-index:1500;background:#5B2BE0;color:#F3EEE6;font-family:inherit}',
    '.promo-banner__inner{position:relative;max-width:1200px;margin:0 auto;display:flex;align-items:center;justify-content:center;gap:14px;padding:9px 48px;white-space:nowrap;overflow:hidden;color:inherit;text-decoration:none}',
    '.promo-banner__text{font-weight:600;font-size:14px;overflow:hidden;text-overflow:ellipsis}',
    '.promo-banner__text--short{display:none}',
    '.promo-banner__timer{display:inline-flex;align-items:baseline;gap:3px;flex:none;font-weight:700;font-size:13px;font-variant-numeric:tabular-nums;background:rgba(10,9,13,.3);border-radius:999px;padding:3px 11px}',
    '.promo-banner__timer i{font-style:normal;font-weight:500;font-size:11px;opacity:.8}',
    '.promo-banner__more{flex:none;font-weight:800;font-size:12.5px;letter-spacing:.04em;background:#D6F23B;color:#0A090D;border-radius:999px;padding:4px 12px}',
    '.promo-banner__inner:hover .promo-banner__more{background:#fff}',
    '.promo-banner__close{position:absolute;right:8px;top:50%;transform:translateY(-50%);width:32px;height:32px;padding:0;background:none;border:0;cursor:pointer;font-family:inherit;font-size:20px;line-height:1;color:#F3EEE6;opacity:.85;border-radius:50%}',
    '.promo-banner__close:hover{opacity:1;background:rgba(10,9,13,.3)}',
    '@media(max-width:640px){',
    ' .promo-banner__text--full{display:none}',
    ' .promo-banner__text--short{display:block;font-size:12.5px}',
    ' .promo-banner__inner{gap:8px;padding:8px 40px 8px 10px}',
    ' .promo-banner__timer{font-size:12px;padding:2px 8px}',
    ' .promo-banner__more{display:none}',
    '}'
  ].join('\n');
  document.head.appendChild(style);

  var el = document.createElement('div');
  el.className = 'promo-banner';
  el.innerHTML =
    '<a class="promo-banner__inner">' +
      '<span class="promo-banner__text promo-banner__text--full"></span>' +
      '<span class="promo-banner__text promo-banner__text--short"></span>' +
      '<span class="promo-banner__timer">' +
        '<b data-pb="d">00</b><i data-pbu="0"></i>&nbsp;: ' +
        '<b data-pb="h">00</b><i data-pbu="1"></i>&nbsp;: ' +
        '<b data-pb="m">00</b><i data-pbu="2"></i>' +
      '</span>' +
      '<span class="promo-banner__more"></span>' +
    '</a>' +
    '<button type="button" class="promo-banner__close">&times;</button>';
  el.querySelector('a').href = P.link('banner');
  document.body.insertBefore(el, document.body.firstChild);

  // Сдвиг шапки — CSS-правилом, а не инлайн-стилем: так он переживает перерисовку шапки скриптами сайта.
  var navStyle = document.createElement('style');
  document.head.appendChild(navStyle);
  function syncNav(){
    var nav = P.nav ? document.querySelector(P.nav) : null;
    if(!nav) return;
    navStyle.textContent = '';
    var pos = getComputedStyle(nav).position;
    if(pos === 'sticky' || pos === 'fixed')
      navStyle.textContent = P.nav + '{top:' + (el.offsetHeight + (P.navGap || 0)) + 'px!important}';
  }
  syncNav();
  window.addEventListener('resize', syncNav);

  function applyTexts(){
    var t = T[lang()];
    el.querySelector('.promo-banner__text--full').textContent = t.full;
    el.querySelector('.promo-banner__text--short').textContent = t.short;
    el.querySelector('.promo-banner__more').textContent = t.more + ' →';
    el.querySelectorAll('[data-pbu]').forEach(function(u){ u.textContent = t.units[+u.getAttribute('data-pbu')]; });
    el.querySelector('.promo-banner__close').setAttribute('aria-label', t.close);
    syncNav();
  }
  applyTexts();
  // тексты следуют за переключением языка страницы (lang на <html>)
  new MutationObserver(applyTexts)
    .observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

  function teardown(){
    el.remove();
    navStyle.remove();
    clearInterval(timerId);
  }

  var deadline = new Date(P.deadline);
  function tickTimer(){
    var diff = deadline - new Date();
    if(diff <= 0){ teardown(); return; }
    var d = Math.floor(diff/86400000),
        h = Math.floor(diff%86400000/3600000),
        m = Math.floor(diff%3600000/60000);
    el.querySelector('[data-pb="d"]').textContent = String(d).padStart(2,'0');
    el.querySelector('[data-pb="h"]').textContent = String(h).padStart(2,'0');
    el.querySelector('[data-pb="m"]').textContent = String(m).padStart(2,'0');
  }
  tickTimer();
  var timerId = setInterval(tickTimer, 15000);

  el.querySelector('.promo-banner__close').addEventListener('click', function(e){
    e.stopPropagation();
    try { sessionStorage.setItem('interno_promo1111_closed', '1'); } catch(_) {}
    teardown();
  });
})();
