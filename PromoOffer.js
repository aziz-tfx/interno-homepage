/* ===== Акция 11.11 «Второй курс в подарок» — промо-карточка =====
   Конфиг и дедлайн — в INTERNO_PROMO (PromoBanner.js, подключается
   первым). Без offerBefore карточка не показывается. После hideAfter
   карточка не рендерится — без деплоя. */
(function(){
  var P = window.INTERNO_PROMO;
  if (!P || !P.offerBefore || new Date() >= new Date(P.hideAfter)) return;
  if (P.onlyPaths && P.onlyPaths.indexOf(location.pathname) === -1) return;

  var T = {
    ru: { badge: 'Акция 11.11', title: 'Запишитесь на курс — второй в подарок',
          gifts: ['Курс на выбор: дизайн интерьера, архитектура, аналитика данных или ИИ',
                  'Второй курс бесплатно: графический дизайн или искусственный интеллект'],
          note: 'Акция до 15 ноября. Количество мест ограничено.',
          cta: 'Выбрать курс и забрать подарок' },
    uz: { badge: '11.11 aksiyasi', title: "Kursga yoziling — ikkinchisi sovg'a",
          gifts: ["Tanlov kursi: interyer dizayni, arxitektura, ma'lumotlar tahlili yoki sun'iy intellekt",
                  "Ikkinchi kurs bepul: grafik dizayn yoki sun'iy intellekt"],
          note: '15-noyabrgacha. Joylar soni cheklangan.',
          cta: "Kursni tanlash va sovg'ani olish" }
  };
  function lang(){ return (document.documentElement.lang || '').slice(0,2) === 'uz' ? 'uz' : 'ru'; }
  function link(){
    var u = P.url + (P.url.indexOf('?') === -1 ? '?' : '&');
    return u + 'utm_source=' + encodeURIComponent(P.site) + '&utm_medium=card&utm_campaign=promo_1111';
  }

  var style = document.createElement('style');
  style.textContent = [
    '.promo-offer{padding:24px 20px}',
    '.promo-offer__card{position:relative;max-width:820px;margin:0 auto;background:#0A090D;color:#F3EEE6;border:1px solid rgba(243,238,230,.1);border-radius:24px;padding:40px 40px 40px 36px;overflow:hidden;display:flex;align-items:center;gap:36px;text-align:left}',
    '.promo-offer__card::before{content:"";position:absolute;top:-90px;right:-90px;width:280px;height:280px;border-radius:50%;background:radial-gradient(circle,rgba(91,43,224,.55),transparent 70%)}',
    '.promo-offer__card::after{content:"";position:absolute;bottom:-120px;left:-60px;width:260px;height:260px;border-radius:50%;background:radial-gradient(circle,rgba(214,242,59,.14),transparent 70%)}',
    '.promo-offer__fig{position:relative;z-index:1;flex:none;width:190px}',
    '.promo-offer__img{display:block;width:190px;height:190px;animation:promoFloat 3s ease-in-out infinite alternate}',
    '.promo-offer__fig-shadow{width:120px;height:20px;margin:2px auto 0;border-radius:50%;background:radial-gradient(ellipse at center,#D6F23B 0%,transparent 70%);opacity:.18;animation:promoShadow 3s ease-in-out infinite alternate}',
    '@keyframes promoFloat{from{transform:translateY(0)}to{transform:translateY(-12px)}}',
    '@keyframes promoShadow{from{transform:scaleX(1);opacity:.18}to{transform:scaleX(.72);opacity:.1}}',
    '@media(prefers-reduced-motion:reduce){.promo-offer__img,.promo-offer__fig-shadow{animation:none}}',
    '.promo-offer__body{position:relative;z-index:1;min-width:0}',
    '.promo-offer__head{display:flex;align-items:center;gap:12px;margin-bottom:16px}',
    '.promo-offer__badge{display:inline-block;background:#5B2BE0;color:#fff;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:6px 12px;transform:rotate(-2deg)}',
    '.promo-offer__mech{font-weight:800;font-size:13px;color:#D6F23B;font-variant-numeric:tabular-nums}',
    '.promo-offer__title{font-family:' + P.displayFont + ';font-weight:700;font-size:clamp(24px,3.4vw,34px);line-height:1.15;margin:0 0 18px;color:#F3EEE6}',
    '.promo-offer__gifts{list-style:none;margin:0 0 16px;padding:0;display:grid;gap:10px}',
    '.promo-offer__gifts li{display:flex;align-items:flex-start;gap:12px;font-size:15.5px;font-weight:500;line-height:1.45;color:#D4CFD9}',
    '.promo-offer__gifts li::before{content:"✓";flex:none;width:24px;height:24px;margin-top:1px;display:inline-flex;align-items:center;justify-content:center;background:#D6F23B;color:#0A090D;font-weight:800;font-size:13px}',
    '.promo-offer__note{color:#9C99A6;font-size:13.5px;margin:0 0 22px}',
    '.promo-offer__cta{display:inline-flex;align-items:center;gap:10px;font-family:inherit;background:#D6F23B;color:#0A090D;font-weight:700;font-size:15.5px;border-radius:8px;padding:16px 26px;text-decoration:none;transition:transform .2s,box-shadow .2s}',
    '.promo-offer__cta:hover{transform:translateY(-2px);box-shadow:0 10px 30px rgba(214,242,59,.25)}',
    '@media(max-width:640px){.promo-offer{padding:16px 12px}.promo-offer__card{padding:28px 22px;border-radius:20px;flex-direction:column;align-items:stretch;gap:14px}.promo-offer__fig{width:130px;margin:0 auto}.promo-offer__img{width:130px;height:130px}.promo-offer__fig-shadow{width:84px;height:14px}.promo-offer__gifts li{font-size:14.5px}.promo-offer__cta{display:flex;justify-content:center;text-align:center;white-space:nowrap;font-size:14.5px;padding:16px 12px}}'
  ].join('\n');
  document.head.appendChild(style);

  var el = document.createElement('section');
  el.className = 'promo-offer';
  el.innerHTML =
    '<div class="promo-offer__card">' +
      '<div class="promo-offer__fig" aria-hidden="true">' +
        '<img class="promo-offer__img" alt="" width="190" height="190" loading="lazy">' +
        '<div class="promo-offer__fig-shadow"></div>' +
      '</div>' +
      '<div class="promo-offer__body">' +
        '<div class="promo-offer__head">' +
          '<span class="promo-offer__badge"></span>' +
          '<span class="promo-offer__mech">1 + 1</span>' +
        '</div>' +
        '<h2 class="promo-offer__title"></h2>' +
        '<ul class="promo-offer__gifts"><li></li><li></li></ul>' +
        '<p class="promo-offer__note"></p>' +
        '<a class="promo-offer__cta"></a>' +
      '</div>' +
    '</div>';
  el.querySelector('.promo-offer__img').src = P.icon;
  el.querySelector('.promo-offer__cta').href = link();

  function applyTexts(){
    var t = T[lang()];
    el.querySelector('.promo-offer__badge').textContent = t.badge;
    el.querySelector('.promo-offer__title').textContent = t.title;
    el.querySelectorAll('.promo-offer__gifts li').forEach(function(li, i){ li.textContent = t.gifts[i]; });
    el.querySelector('.promo-offer__note').textContent = t.note;
    el.querySelector('.promo-offer__cta').textContent = t.cta + ' →';
  }
  applyTexts();
  new MutationObserver(applyTexts)
    .observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

  // Блок-якорь может появиться позже (отрисовка скриптом) — ждём до 10 секунд.
  var tries = 0;
  (function mount(){
    var anchor = document.querySelector(P.offerBefore);
    if (anchor) { anchor.parentNode.insertBefore(el, anchor); return; }
    if (++tries < 40) setTimeout(mount, 250);
  })();

  // Автоотключение, если дедлайн наступил при открытой странице.
  var expireId = setInterval(function(){
    if (new Date() >= new Date(P.hideAfter)){ el.remove(); clearInterval(expireId); }
  }, 60000);
})();
