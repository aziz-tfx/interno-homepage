#!/usr/bin/env node
// Узбекская версия новогоднего лендинга: uz/newyear/index.html собирается из newyear/index.html.
// Запуск: node scripts/build-newyear-uz.mjs  (после любых правок русской страницы)
// Разметка, стили и логика берутся из русской версии, тексты — из словаря ниже.
// Если на русской странице появился текст без перевода, сборка падает и показывает его.
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let src = readFileSync(join(root, 'newyear/index.html'), 'utf8');

// [русский текст, узбекский текст] — заменяются все вхождения; порядок важен: длинные строки раньше коротких
const TEXT = [
  // <head>
  ['<html lang="ru">', '<html lang="uz">'],
  ['Новогодняя акция — скидка до 40% и курс в подарок | INTERNO', "Yangi yil aksiyasi — 40% gacha chegirma va kurs sovg'a | INTERNO"],
  ['Новогодняя акция в INTERNO: скидка до 40% на курс — дизайн интерьера, архитектура, аналитика данных или ИИ — и второй курс в подарок. Офлайн в Ташкенте, Самарканде и Фергане.',
   "INTERNO'da Yangi yil aksiyasi: kursga 40% gacha chegirma — interyer dizayni, arxitektura, ma'lumotlar tahlili yoki sun'iy intellekt — va ikkinchi kurs sovg'a. Toshkent, Samarqand va Farg'onada oflayn."],
  ['Скидка до 40% на курс в INTERNO и второй курс бесплатно: графический дизайн или искусственный интеллект.',
   "INTERNO kursiga 40% gacha chegirma va ikkinchi kurs bepul: grafik dizayn yoki sun'iy intellekt."],
  ['<link rel="canonical" href="https://internoedu.uz/newyear/">', '<link rel="canonical" href="https://internoedu.uz/uz/newyear/">'],
  ['<meta property="og:url" content="https://internoedu.uz/newyear/">', '<meta property="og:url" content="https://internoedu.uz/uz/newyear/">'],
  ['https://internoedu.uz/newyear/img/og.jpg', 'https://internoedu.uz/newyear/img/og-uz.jpg'],
  ['content="ru_RU"', 'content="uz_UZ"'],
  // переключатель языка и ссылки на главную
  ['aria-label="Язык"', 'aria-label="Til"'],
  ['<a href="/newyear/" hreflang="ru" lang="ru" class="active" aria-current="page">RU</a><span>/</span><a href="/uz/newyear/" hreflang="uz" lang="uz">UZ</a>',
   '<a href="/newyear/" hreflang="ru" lang="ru">RU</a><span>/</span><a href="/uz/newyear/" hreflang="uz" lang="uz" class="active" aria-current="page">UZ</a>'],
  ['<a class="nav-logo" href="/">', '<a class="nav-logo" href="/uz/">'],
  ['<a href="/">internoedu.uz</a>', '<a href="/uz/">internoedu.uz</a>'],
  ['INTERNO — Школа современных профессий', 'INTERNO — Zamonaviy kasblar maktabi'],
  // бегущая строка и шапка
  ['Новогодняя акция — скидка до 40% и курс в подарок', "Yangi yil aksiyasi — 40% gacha chegirma va kurs sovg'a"],
  ['Новогодняя акция<i></i>Скидка до 40%<i></i>Курс в подарок<i></i>', "Yangi yil aksiyasi<i></i>40% gacha chegirma<i></i>Kurs sovg'a<i></i>"],
  ['>Что в акции</a>', '>Aksiyada nima bor</a>'],
  ['>Курсы</a>', '>Kurslar</a>'],
  ['>Подарок</a>', ">Sovg'a</a>"],
  ['>Почему мы</a>', '>Nega biz</a>'],
  ['href="#courses">Выбрать курс</a>', 'href="#courses">Kurs tanlash</a>'],
  // hero
  ['<h1 class="display">Скидка <span class="tape">до 40%</span></h1>', '<h1 class="display">Chegirma <span class="tape">40% gacha</span></h1>'],
  ['<span class="plus">+</span> курс в подарок</p>', "<span class=\"plus\">+</span> kurs sovg'a</p>"],
  ['Запишитесь на курс в INTERNO со скидкой до 40% и получите второй бесплатно: <b>Графический дизайн</b> или <b>Искусственный интеллект</b>.',
   "INTERNO kursiga 40% gacha chegirma bilan yoziling va ikkinchisini bepul oling: <b>Grafik dizayn</b> yoki <b>Sun'iy intellekt</b>."],
  ['Выбрать курс <svg', 'Kurs tanlash <svg'],
  ['<span class="hero-note">Количество мест ограничено</span>', '<span class="hero-note">Joylar soni cheklangan</span>'],
  ['<span>До конца акции</span>', '<span>Aksiya tugashiga</span>'],
  ['<span class="t-cap">дни</span>', '<span class="t-cap">kun</span>'],
  ['<span class="t-cap">часы</span>', '<span class="t-cap">soat</span>'],
  ['<span class="t-cap">минуты</span>', '<span class="t-cap">daqiqa</span>'],
  // что в акции
  ['Что вы получаете <span class="tape">по акции</span>', "Aksiya bo'yicha <span class=\"tape\">nima olasiz</span>"],
  ['Скидка на курс, который выбираете вы, и второй курс в подарок от нас. Учим с нуля — опыт не нужен.',
   "Siz tanlagan kursga chegirma va bizdan ikkinchi kurs sovg'a. Noldan o'rgatamiz — tajriba shart emas."],
  ['<h3>Скидка на курс</h3>', '<h3>Kursga chegirma</h3>'],
  ['До 40% на обучение: Дизайн интерьера, Архитектура, Аналитика данных или Искусственный интеллект.',
   "O'qishga 40% gacha: Interyer dizayni, Arxitektura, Ma'lumotlar tahlili yoki Sun'iy intellekt."],
  ['>Курс в подарок</h3>', ">Kurs sovg'a</h3>"],
  ['Графический дизайн или Искусственный интеллект в подарок.', "Grafik dizayn yoki Sun'iy intellekt sovg'a sifatida."],
  ['<h3>Две профессии</h3>', '<h3>Ikki kasb</h3>'],
  ['Портфолио по обоим курсам и помощь с первыми клиентами.', "Ikkala kurs bo'yicha portfolio va birinchi mijozlarni topishda yordam."],
  // курсы
  ['Новогодняя акция · выберите курс', 'Yangi yil aksiyasi · kursni tanlang'],
  ['Выбирайте курс — <span class="tape">скидка и подарок</span>', "Kursni tanlang — <span class=\"tape\">chegirma va sovg'a</span>"],
  ['Нажмите на карточку — откроется форма, курс в ней уже будет выбран.', "Kartochkani bosing — forma ochiladi, kurs unda allaqachon tanlangan bo'ladi."],
  ['aria-label="Записаться со скидкой на курс «', 'aria-label="«'],
  ['» по акции"', '» kursiga chegirma bilan yozilish"'],
  ['Планировки и 3D-визуализация. Свои клиенты и проекты', "Rejalar va 3D-vizualizatsiya. O'z mijozlaringiz va loyihalaringiz"],
  ['Чертежи и 3D-модели зданий. Работа в бюро и строительных компаниях', 'Binolarning chizmalari va 3D-modellari. Byuro va qurilish kompaniyalarida ish'],
  ['Python, SQL, Power BI. Удалённая работа с бизнесом', 'Python, SQL, Power BI. Biznes bilan masofaviy ish'],
  ['Нейросети и AI-инструменты. Быстрее работа и заказы на фрилансе', 'Neyrotarmoqlar va AI-vositalar. Tezroq ish va frilansdagi buyurtmalar'],
  ['<span class="gift-badge">До −40% <svg><use href="#plus"/></svg> курс в подарок</span>', "<span class=\"gift-badge\">−40% gacha <svg><use href=\"#plus\"/></svg> kurs sovg'a</span>"],
  ['Записаться со скидкой <svg', 'Chegirma bilan yozilish <svg'],
  ['Скидка до 40% на любой из четырёх курсов и второй курс бесплатно. Точный размер скидки назовёт менеджер при записи',
   "To'rtta kursdan istalganiga 40% gacha chegirma va ikkinchi kurs bepul. Chegirmaning aniq miqdorini menejer yozilishda aytadi"],
  // подарок
  ['Новогодняя акция · ваш подарок', "Yangi yil aksiyasi · sizning sovg'angiz"],
  ['Второй курс — <span class="tape">0 сум</span>', "Ikkinchi kurs — <span class=\"tape\">0 so'm</span>"],
  ['Один курс на выбор — забираете его вместе с основным курсом.', "Tanlov bo'yicha bitta kurs — uni asosiy kurs bilan birga olasiz."],
  ['🎁 Подарок · 0 сум', "🎁 Sovg'a · 0 so'm"],
  ['Логотипы, упаковка, дизайн для соцсетей', 'Logotiplar, qadoq, ijtimoiy tarmoqlar uchun dizayn'],
  ['Нейросети для работы и фриланса', 'Ish va frilans uchun neyrotarmoqlar'],
  ['<p>Один курс на выбор</p>', "<p>Tanlov bo'yicha bitta kurs</p>"],
  ['Забрать подарок <svg', "Sovg'ani olish <svg"],
  [".or::after{content:'или';", ".or::after{content:'yoki';"],
  // почему INTERNO
  ['Новогодняя акция · почему INTERNO', 'Yangi yil aksiyasi · nega INTERNO'],
  ['Почему <span class="tape">INTERNO</span>', 'Nega <span class="tape">INTERNO</span>'],
  ['Курс строится вокруг практики: разобраться, сделать, получить обратную связь и собрать проект в портфолио.',
   "Kurs amaliyot asosida qurilgan: tushunish, bajarish, fikr-mulohaza olish va loyihani portfolioga qo'shish."],
  ['<h3>Учим с нуля</h3>', "<h3>Noldan o'rgatamiz</h3>"],
  ['Опыт не нужен — начинаем с основ и ведём до первых проектов.', 'Tajriba shart emas — asoslardan boshlab, birinchi loyihalargacha olib boramiz.'],
  ['<h3>Офлайн в Ташкенте, Самарканде и Фергане</h3>', "<h3>Toshkent, Samarqand va Farg'onada oflayn</h3>"],
  ['Живые занятия с ментором в аудиториях школы.', 'Maktab auditoriyalarida mentor bilan jonli darslar.'],
  ['<h3>Портфолио и помощь с первыми клиентами</h3>', '<h3>Portfolio va birinchi mijozlarni topishda yordam</h3>'],
  ['<h3>Рассрочка до 6 месяцев без переплат</h3>', "<h3>6 oygacha ustamasiz bo'lib to'lash</h3>"],
  // финал
  ['Акция <span class="tape">заканчивается</span>', 'Aksiya <span class="tape">tugayapti</span>'],
  ['Успейте записаться со скидкой до 40% и забрать второй курс в подарок. Количество мест ограничено.',
   "40% gacha chegirma bilan yozilishga va ikkinchi kursni sovg'aga olishga ulguring. Joylar soni cheklangan."],
  ['Выбрать курс со скидкой <svg', 'Chegirma bilan kurs tanlash <svg'],
  // футер
  ['Школа современных профессий: дизайн, архитектура, видеомонтаж, аналитика, ИИ и бухгалтерия. Ташкент · Самарканд · Фергана.',
   "Zamonaviy kasblar maktabi: dizayn, arxitektura, videomontaj, analitika, sun'iy intellekt va buxgalteriya. Toshkent · Samarqand · Farg'ona."],
  ['<h5>Курсы по акции</h5>', '<h5>Aksiyadagi kurslar</h5>'],
  ['>Data-аналитика</a>', '>Data-analitika</a>'],
  ['<h5>Контакты</h5>', '<h5>Kontaktlar</h5>'],
  ['<h5>Адреса</h5>', '<h5>Manzillar</h5>'],
  ['Ташкент · Мирзо-Улугбекский р-н, ул. Хирмонтепа, 34Б (м. Буюк Ипак Йули)', 'Toshkent · Mirzo Ulug‘bek tumani, Xirmontepa ko‘chasi, 34B (Buyuk Ipak Yo‘li metrosi)'],
  ['Самарканд · ул. Давлатабад', 'Samarqand · Davlatobod ko‘chasi'],
  ['Фергана · ул. Комус, 40', 'Farg‘ona · Komus ko‘chasi, 40'],
  ['© 2026 INTERNO School. Все права защищены.', '© 2026 INTERNO School. Barcha huquqlar himoyalangan.'],
  // форма
  ['aria-label="Закрыть"', 'aria-label="Yopish"'],
  ['Запись по новогодней акции', 'Yangi yil aksiyasiga yozilish'],
  ['<span>Имя</span>', '<span>Ism</span>'],
  ['placeholder="Как к вам обращаться"', 'placeholder="Ismingiz"'],
  ['<span>Телефон</span>', '<span>Telefon</span>'],
  ['Введите номер полностью — 9 цифр после +998', "Raqamni to'liq kiriting — +998 dan keyin 9 raqam"],
  ['<span>Курс</span>', '<span>Kurs</span>'],
  ['<span>Город</span>', '<span>Shahar</span>'],
  ['<option value="tsh">Ташкент</option>', '<option value="tsh">Toshkent</option>'],
  ['<option value="smr">Самарканд</option>', '<option value="smr">Samarqand</option>'],
  ['<option value="frg">Фергана</option>', "<option value=\"frg\">Farg'ona</option>"],
  ['Забрать скидку и подарок</button>', "Chegirma va sovg'ani olish</button>"],
  ['Нажимая на кнопку, я соглашаюсь на обработку персональных данных', "Tugmani bosish orqali shaxsiy ma'lumotlarni qayta ishlashga rozilik bildiraman"],
  ['<h3 class="display">Готово!</h3>', '<h3 class="display">Tayyor!</h3>'],
  ['Скидка и подарок закреплены за вами. Мы перезвоним, назовём точную стоимость и запишем вас на бесплатный урок.',
   "Chegirma va sovg'a siz uchun band qilindi. Sizga qo'ng'iroq qilamiz, aniq narxni aytamiz va bepul darsga yozamiz."],
  ['data-modal-close>Закрыть</button>', 'data-modal-close>Yopish</button>'],
  // названия курсов и общий тег — в самом конце, после длинных фраз
  ['Дизайн интерьера', 'Interyer dizayni'],
  ['Архитектура', 'Arxitektura'],
  ['Аналитика данных', "Ma'lumotlar tahlili"],
  ['Искусственный интеллект', "Sun'iy intellekt"],
  ['Графический дизайн', 'Grafik dizayn'],
  ['Новогодняя акция', 'Yangi yil aksiyasi'],
];

// Тексты скрипта страницы (блок ui:start … ui:end)
const UI_UZ = `/* ui:start — тексты страницы; блок подставлен scripts/build-newyear-uz.mjs */
const UI = {
  tag:"Yangi yil aksiyasi",
  until:(day, month) => \`\${day}-\${['yanvar','fevral','mart','aprel','may','iyun','iyul','avgust','sentabr','oktabr','noyabr','dekabr'][month]}gacha\`,
  courses:{interior:"Interyer dizayni", arch:"Arxitektura", data:"Ma'lumotlar tahlili", ai:"Sun'iy intellekt"},
  plaqueDiscount:"40% gacha chegirma",
  plaqueGiftAi:"+ Grafik dizayn sovg'a",
  plaqueGiftAny:"+ kurs sovg'a: Grafik dizayn yoki Sun'iy intellekt",
  sending:"Yuborilmoqda…",
};
/* ui:end */`;

// На узбекских заголовках строка «40% gacha» длиннее «до 40%» — на телефоне шрифт h1 чуть меньше
const CSS_UZ = `
/* uz: заголовок hero длиннее русского */
.hero h1{font-size:clamp(64px,8vw,120px)}
@media (max-width:700px){.hero h1{font-size:clamp(42px,13.4vw,84px)}}
</style>`;

const cut = (s, a, b) => { const i = s.indexOf(a), j = s.indexOf(b, i); if (i < 0 || j < 0) throw new Error(`Нет блока ${a} … ${b}`); return [s.slice(0, i), s.slice(i, j + b.length), s.slice(j + b.length)]; };

// 1. Блоки скрипта: UI заменяем целиком, CRM остаётся по-русски (меняются язык и источник)
let [beforeUi, , afterUi] = cut(src, '/* ui:start', '/* ui:end */');
let [between, crm, tail] = cut(afterUi, '/* crm:start', '/* crm:end */');
const crmUz = crm.replace("lang:'Русский'", "lang:'Узбекский'").replace('(internoedu.uz/newyear)', '(internoedu.uz/uz/newyear)');
if (crmUz === crm) throw new Error('Блок CRM не изменился — проверьте lang и source');

// 2. Всё остальное переводим по словарю
const missing = [];
const translate = part => {
  for (const [ru, uz] of TEXT) if (part.includes(ru)) { part = part.split(ru).join(uz); used.add(ru); }
  return part;
};
const used = new Set();
beforeUi = translate(beforeUi); between = translate(between); tail = translate(tail);
for (const [ru] of TEXT) if (!used.has(ru)) missing.push(ru);
if (missing.length) throw new Error('Строки словаря не найдены на русской странице (текст изменился?):\n  ' + missing.join('\n  '));

if (!beforeUi.includes('</style>')) throw new Error('Не найден </style>');
beforeUi = beforeUi.replace('</style>', CSS_UZ);

// 3. Проверка: вне комментариев и блоков CRM (crm, crm-note) не должно остаться кириллицы
const visible = (beforeUi + between + tail)
  .replace(/\/\* crm-note:start[\s\S]*?crm-note:end \*\//g, '')
  .replace(/<!--[\s\S]*?-->/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[\s;{}),])\/\/[^\n]*/g, '$1');
const left = [...new Set(visible.split('\n').filter(l => /[А-Яа-яЁё]/.test(l)).map(l => l.trim()))];
if (left.length) throw new Error('Остался непереведённый текст — добавьте в словарь TEXT:\n  ' + left.join('\n  '));

const out = '<!-- Собрано scripts/build-newyear-uz.mjs из newyear/index.html — не редактируйте вручную -->\n';
const html = (beforeUi + UI_UZ + between + crmUz + tail).replace('<!DOCTYPE html>\n', '<!DOCTYPE html>\n' + out);
mkdirSync(join(root, 'uz/newyear'), {recursive: true});
writeFileSync(join(root, 'uz/newyear/index.html'), html);
console.log('uz/newyear/index.html');
