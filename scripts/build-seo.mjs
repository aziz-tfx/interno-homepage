#!/usr/bin/env node
// SEO/GEO-сборка главной: node scripts/build-seo.mjs
//
// Источник правды — index.html и словарь I18N в нём. Скрипт:
//  1. заполняет тексты [data-i18n] русской версии и пишет SEO-блок <head> (title, description,
//     canonical, hreflang, Open Graph, JSON-LD: школа, курсы, менторы, FAQ);
//  2. собирает узбекскую версию uz/index.html — отдельный URL, который индексируют Google, Яндекс и LLM
//     (текст, переключаемый скриптом на одной странице, поисковики не видят);
//  3. пишет sitemap.xml, robots.txt и llms.txt.
// Запускать после любой правки текстов в index.html. Зависимостей нет — только Node 18+.

import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://internoedu.uz';
const TODAY = new Date().toISOString().slice(0, 10);

const PHONE = '+998781131808';
const PHONE_HUMAN = '+998 78 113 18 08';
const SAME_AS = ['https://t.me/interno_school', 'https://instagram.com/interno.school'];

// Лендинги курсов: ключ словаря → поддомен
const COURSES = [
  ['interior', 'https://interior.internoedu.uz'],
  ['arch', 'https://architecture.internoedu.uz'],
  ['graphic', 'https://graphic.internoedu.uz'],
  ['video', 'https://videomontaj.internoedu.uz'],
  ['data', 'https://data.internoedu.uz'],
  ['ai', 'https://ai.internoedu.uz'],
  ['acc', 'https://buxgalteriya.internoedu.uz'],
];
const MENTORS = [
  ['asad', '/assets/mentor-asad.jpg'],
  ['vlad', '/assets/mentor-vlad.jpg'],
  ['asliddin', '/assets/mentor-asliddin.jpg'],
];
const FAQ_COUNT = 7;

// Мета по языкам. Title ≤ ~65 символов, description ≤ ~160: главные запросы — в начале.
const LANGS = {
  ru: {
    path: '/', file: 'index.html', locale: 'ru_RU', og: '/assets/og.jpg',
    title: 'Курсы дизайна, архитектуры, IT и бухгалтерии в Ташкенте | INTERNO',
    description: 'Офлайн-курсы в Ташкенте, Самарканде и Фергане: дизайн интерьера, архитектура, графдизайн, видеомонтаж, data-аналитика, ИИ и бухгалтерия. Бесплатный открытый урок.',
    orgDescription: 'INTERNO School — школа современных профессий в Узбекистане. Офлайн-курсы с менторами-практиками в Ташкенте, Самарканде и Фергане: дизайн интерьера, архитектура, графический дизайн, видеомонтаж, data-аналитика, искусственный интеллект и бухгалтерия.',
    cities: ['Ташкент', 'Самарканд', 'Фергана'],
    country: 'Узбекистан',
  },
  uz: {
    path: '/uz/', file: 'uz/index.html', locale: 'uz_UZ', og: '/assets/og-uz.jpg',
    title: "Toshkentda dizayn, arxitektura, IT va buxgalteriya kurslari | INTERNO",
    description: "Toshkent, Samarqand va Farg'onada oflayn kurslar: interyer dizayni, arxitektura, grafik dizayn, videomontaj, data-analitika, sun'iy intellekt, buxgalteriya. Bepul ochiq dars.",
    orgDescription: "INTERNO School — O'zbekistondagi zamonaviy kasblar maktabi. Toshkent, Samarqand va Farg'onada amaliyotchi mentorlar bilan oflayn kurslar: interyer dizayni, arxitektura, grafik dizayn, videomontaj, data-analitika, sun'iy intellekt va buxgalteriya.",
    cities: ['Toshkent', 'Samarqand', "Farg'ona"],
    country: "O'zbekiston",
  },
};
const CITIES_EN = ['Tashkent', 'Samarkand', 'Fergana'];
const CITY_KEYS = ['tsh', 'smr', 'frg'];

// ---------- словарь из index.html ----------
const srcPath = join(ROOT, 'index.html');
const src = readFileSync(srcPath, 'utf8');
const dictMatch = src.match(/const I18N=(\{[\s\S]*?\n\});/);
if (!dictMatch) throw new Error('I18N не найден в index.html');
const I18N = new Function(`return (${dictMatch[1]})`)();
for (const l of Object.keys(LANGS)) {
  const miss = Object.keys(I18N.ru).filter(k => !(k in I18N[l]));
  if (miss.length) throw new Error(`В словаре ${l} нет ключей: ${miss.join(', ')}`);
}

// ---------- утилиты ----------
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const plain = html => String(html).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const abs = path => SITE + path;

// Заменяет содержимое элемента, открывающий тег которого начинается в позиции `start`.
// Ищет парный закрывающий тег с учётом вложенности одноимённых тегов.
function elementBounds(html, start) {
  const open = html.slice(start).match(/^<([a-zA-Z0-9]+)\b[^>]*>/);
  const tag = open[1].toLowerCase();
  const innerStart = start + open[0].length;
  const re = new RegExp(`<(/?)${tag}\\b[^>]*>`, 'gi');
  re.lastIndex = innerStart;
  let depth = 1, m;
  while ((m = re.exec(html))) {
    depth += m[1] ? -1 : 1;
    if (!depth) return {openTag: open[0], innerStart, innerEnd: m.index};
  }
  throw new Error(`Не закрыт <${tag}> на позиции ${start}`);
}
const setAttr = (tag, name, value) => {
  const re = new RegExp(`\\s${name}="[^"]*"`);
  return re.test(tag) ? tag.replace(re, ` ${name}="${esc(value)}"`) : tag.replace(/\s*\/?>$/, m => ` ${name}="${esc(value)}"${m}`);
};

// Переводит разметку body (до основного <script>) словарём t
function translateBody(html, t) {
  const bodyStart = html.indexOf('<body');
  const scriptStart = html.indexOf('\n<script>', bodyStart);
  let body = html.slice(bodyStart, scriptStart);
  const get = k => { if (!(k in t)) throw new Error(`Нет ключа ${k}`); return t[k]; };

  // атрибуты
  body = body.replace(/<[a-zA-Z][^>]*\sdata-i18n-(alt|aria|href)="[^"]+"[^>]*>/g, tag => {
    for (const [, kind, key] of tag.matchAll(/data-i18n-(alt|aria|href)="([^"]+)"/g)) {
      tag = setAttr(tag, {alt: 'alt', aria: 'aria-label', href: 'href'}[kind], get(key));
    }
    return tag;
  });
  // содержимое: идём с конца, чтобы не сбивать позиции
  const hits = [...body.matchAll(/<[a-zA-Z][^>]*\sdata-i18n(-html)?="([^"]+)"[^>]*>/g)].reverse();
  for (const h of hits) {
    const {innerStart, innerEnd} = elementBounds(body, h.index);
    const v = get(h[2]);
    body = body.slice(0, innerStart) + (h[1] ? v : esc(v)) + body.slice(innerEnd);
  }
  return html.slice(0, bodyStart) + body + html.slice(scriptStart);
}

// ---------- JSON-LD ----------
function jsonLd(lang) {
  const L = LANGS[lang], t = I18N[lang], url = abs(L.path), OG_IMAGE = abs(L.og);
  const orgId = `${SITE}/#org`;
  // Адреса филиалов — из футера (ключи addr.*: «Город · улица»)
  const street = k => t[`addr.${k}`].split(' · ').slice(1).join(' · ');
  const places = L.cities.map((c, i) => ({
    '@type': 'Place',
    name: `INTERNO School — ${c}`,
    address: {'@type': 'PostalAddress', streetAddress: street(CITY_KEYS[i]), addressLocality: CITIES_EN[i], addressCountry: 'UZ'},
  }));
  const courses = COURSES.map(([k, href]) => ({
    '@type': 'Course',
    '@id': `${href}/#course`,
    name: t[`course.${k}`],
    description: `${t[`desc.${k}`]} ${t[`card.${k}`]}.`,
    url: href,
    inLanguage: ['ru', 'uz'],
    provider: {'@id': orgId},
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'Onsite',
      location: places,
    },
  }));
  const graph = [
    {
      '@type': 'EducationalOrganization',
      '@id': orgId,
      name: 'INTERNO School',
      alternateName: ['INTERNO', 'Интерно', 'Interno Edu', 'Интерно скул'],
      url: `${SITE}/`,
      logo: {'@type': 'ImageObject', url: `${SITE}/assets/icon-512.png`, width: 512, height: 512},
      image: OG_IMAGE,
      description: L.orgDescription,
      slogan: plain(t['hero.title']),
      telephone: PHONE,
      sameAs: SAME_AS,
      address: places[0].address,
      location: places,
      areaServed: {'@type': 'Country', name: L.country},
      knowsLanguage: ['ru', 'uz'],
      contactPoint: {
        '@type': 'ContactPoint', telephone: PHONE, contactType: 'admissions',
        areaServed: 'UZ', availableLanguage: ['Russian', 'Uzbek'],
      },
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: t['courses.tag'],
        itemListElement: courses.map(c => ({'@type': 'Offer', itemOffered: {'@id': c['@id']}})),
      },
      employee: MENTORS.map(([k, img]) => ({
        '@type': 'Person',
        name: t[`mentors.${k}Name`],
        jobTitle: t[`mentors.${k}Role`],
        image: abs(img),
        knowsAbout: t[`mentors.${k}Course`],
        description: [1, 2, 3].map(i => t[`mentors.${k}${i}`]).join('. '),
      })),
    },
    {
      '@type': 'WebSite', '@id': `${SITE}/#website`, url: `${SITE}/`, name: 'INTERNO School',
      inLanguage: ['ru', 'uz'], publisher: {'@id': orgId},
    },
    {
      '@type': 'WebPage', '@id': `${url}#webpage`, url, name: L.title, description: L.description,
      inLanguage: lang, isPartOf: {'@id': `${SITE}/#website`}, about: {'@id': orgId},
      primaryImageOfPage: OG_IMAGE, dateModified: TODAY,
    },
    {
      '@type': 'ItemList', '@id': `${url}#courses`, name: t['courses.title'],
      itemListElement: courses.map((c, i) => ({'@type': 'ListItem', position: i + 1, item: c})),
    },
    {
      '@type': 'FAQPage', '@id': `${url}#faq`, inLanguage: lang,
      mainEntity: Array.from({length: FAQ_COUNT}, (_, i) => ({
        '@type': 'Question', name: t[`faq.q${i + 1}`],
        acceptedAnswer: {'@type': 'Answer', text: plain(t[`faq.a${i + 1}`])},
      })),
    },
  ];
  return JSON.stringify({'@context': 'https://schema.org', '@graph': graph}, null, 1)
    .replace(/</g, '\\u003c');
}

// ---------- <head> ----------
function seoHead(lang) {
  const L = LANGS[lang], url = abs(L.path), OG_IMAGE = abs(L.og);
  const alt = Object.entries(LANGS).map(([l, x]) => `<link rel="alternate" hreflang="${l}" href="${abs(x.path)}">`);
  const ogAlt = Object.entries(LANGS).filter(([l]) => l !== lang).map(([, x]) => `<meta property="og:locale:alternate" content="${x.locale}">`);
  return `<!-- seo:start — блок генерирует scripts/build-seo.mjs, правки вносите там -->
<title>${esc(L.title)}</title>
<meta name="description" content="${esc(L.description)}">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
<link rel="canonical" href="${url}">
${alt.join('\n')}
<link rel="alternate" hreflang="x-default" href="${abs('/')}">
<meta name="theme-color" content="#0A090D">
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" href="/assets/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta property="og:type" content="website">
<meta property="og:site_name" content="INTERNO School">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${esc(L.title)}">
<meta property="og:description" content="${esc(L.description)}">
<meta property="og:image" content="${OG_IMAGE}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(I18N[lang]['logo.alt'])}">
<meta property="og:locale" content="${L.locale}">
${ogAlt.join('\n')}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(L.title)}">
<meta name="twitter:description" content="${esc(L.description)}">
<meta name="twitter:image" content="${OG_IMAGE}">
<script type="application/ld+json">
${jsonLd(lang)}
</script>
<!-- seo:end -->`;
}
const withHead = (html, lang) =>
  html.replace(/<!-- seo:start[\s\S]*?<!-- seo:end -->/, () => seoHead(lang));

// ---------- страницы ----------
const ru = withHead(translateBody(src, I18N.ru), 'ru');
writeFileSync(srcPath, ru);

let uz = withHead(translateBody(ru, I18N.uz), 'uz')
  .replace('<html lang="ru">', '<html lang="uz">')
  .replace(/<a href="\/" hreflang="ru" lang="ru" data-lang="ru" class="active" aria-current="page">/, '<a href="/" hreflang="ru" lang="ru" data-lang="ru">')
  .replace(/<a href="\/uz\/" hreflang="uz" lang="uz" data-lang="uz">/, '<a href="/uz/" hreflang="uz" lang="uz" data-lang="uz" class="active" aria-current="page">');
uz = uz.replace('<!-- seo:start', '<!-- СГЕНЕРИРОВАНО scripts/build-seo.mjs из index.html — не редактируйте вручную -->\n<!-- seo:start');
mkdirSync(join(ROOT, 'uz'), {recursive: true});
writeFileSync(join(ROOT, 'uz/index.html'), uz);

// ---------- sitemap.xml ----------
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${Object.values(LANGS).map(L => `  <url>
    <loc>${abs(L.path)}</loc>
    <lastmod>${TODAY}</lastmod>
${Object.entries(LANGS).map(([l, x]) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${abs(x.path)}"/>`).join('\n')}
    <xhtml:link rel="alternate" hreflang="x-default" href="${abs('/')}"/>
  </url>`).join('\n')}
</urlset>
`;
writeFileSync(join(ROOT, 'sitemap.xml'), sitemap);

// ---------- robots.txt ----------
// Поисковые и AI-краулеры пускаем явно: ответы ChatGPT, Claude, Perplexity, Gemini, Алисы
// строятся на том, что эти боты смогли прочитать.
const AI_BOTS = [
  'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-User', 'Claude-SearchBot',
  'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot-Extended', 'Applebot',
  'Bingbot', 'YandexBot', 'YandexAdditional', 'YandexAdditionalBot', 'DuckAssistBot',
  'meta-externalagent', 'Amazonbot', 'MistralAI-User', 'CCBot',
];
const robots = `# INTERNO School — ${SITE}
User-agent: *
Allow: /
Disallow: /api/

${AI_BOTS.map(b => `User-agent: ${b}`).join('\n')}
Allow: /
Disallow: /api/

# Яндекс: UTM и клик-ID не создают дублей страниц
Clean-param: utm_source&utm_medium&utm_campaign&utm_content&utm_term&fbclid&gclid&yclid

Sitemap: ${SITE}/sitemap.xml
`;
writeFileSync(join(ROOT, 'robots.txt'), robots);

// ---------- llms.txt (https://llmstxt.org) ----------
function llmsBlock(lang) {
  const t = I18N[lang], L = LANGS[lang];
  const h = lang === 'ru'
    ? {facts: 'Ключевые факты', courses: 'Курсы (у каждого — свой сайт с программой)', mentors: 'Менторы', faq: 'Частые вопросы', contacts: 'Контакты',
       f: [`Формат: офлайн, небольшие группы; города: ${L.cities.join(', ')}`, `Адреса: ${CITY_KEYS.map(k => t[`addr.${k}`]).join('; ')}`, `Первый шаг — бесплатный открытый урок; запись по телефону ${PHONE_HUMAN} или на ${abs(L.path)}`,
           'Рассрочка до 6 месяцев без переплат', 'Итог обучения: проекты в портфолио и сертификат', 'Языки сайта: русский и узбекский']}
    : {facts: 'Asosiy faktlar', courses: "Kurslar (har birining dasturi yozilgan alohida sayti bor)", mentors: 'Mentorlar', faq: "Ko'p so'raladigan savollar", contacts: 'Aloqa',
       f: [`Format: oflayn, kichik guruhlar; shaharlar: ${L.cities.join(', ')}`, `Manzillar: ${CITY_KEYS.map(k => t[`addr.${k}`]).join('; ')}`, `Birinchi qadam — bepul ochiq dars; yozilish: ${PHONE_HUMAN} yoki ${abs(L.path)}`,
           "6 oygacha ustama to'lovsiz bo'lib to'lash", "O'qish natijasi: portfolio loyihalari va sertifikat", "Sayt tillari: rus va o'zbek"]};
  return [
    `## ${h.facts}`, '', ...h.f.map(x => `- ${x}`), '',
    `## ${h.courses}`, '', ...COURSES.map(([k, href]) => `- [${t[`course.${k}`]}](${href}): ${t[`desc.${k}`]} ${t[`card.${k}`]}.`), '',
    `## ${h.mentors}`, '', ...MENTORS.map(([k]) => `- ${t[`mentors.${k}Name`]} — ${t[`mentors.${k}Role`]} (${t[`mentors.${k}Course`]}). ${[1, 2, 3].map(i => t[`mentors.${k}${i}`]).join('; ')}.`), '',
    `## ${h.faq}`, '', ...Array.from({length: FAQ_COUNT}, (_, i) => `### ${t[`faq.q${i + 1}`]}\n\n${plain(t[`faq.a${i + 1}`])}\n`),
    `## ${h.contacts}`, '', `- ${PHONE_HUMAN}`, ...SAME_AS.map(u => `- ${u}`), `- ${abs(L.path)}`, '',
  ].join('\n');
}
const llms = `# INTERNO School

> ${LANGS.ru.orgDescription}

> ${LANGS.uz.orgDescription}

- [Главная (русский)](${abs('/')})
- [Bosh sahifa (o'zbekcha)](${abs('/uz/')})

${llmsBlock('ru')}
---

# INTERNO School — o'zbekcha

${llmsBlock('uz')}`;
writeFileSync(join(ROOT, 'llms.txt'), llms);

console.log(`Готово: index.html, uz/index.html, sitemap.xml, robots.txt, llms.txt (${TODAY})`);
