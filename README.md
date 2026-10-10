# INTERNO School — главная страница

Хоум-пейдж школы современных профессий (референс структуры — proweb.uz): hero с видео-фоном, каталог направлений со ссылками на лендинги курсов, преимущества, форматы обучения, CTA открытого урока.

## Структура

Один самодостаточный `index.html` (стили и скрипты инлайном) + папка `assets/`.

Дизайн: тёмные и «бумажные» секции чередуются, заголовки набраны Oswald капсом, фиолетовые плашки-теги, лаймовые маркеры-«скотч», bento-сетки с фотографиями. Секции: hero с переключателем направлений → курсы → портфолио → почему мы → менторы → форматы → CTA открытого урока.

- Фото секций сгенерированы в Higgsfield (GPT Image 2.5). Список — `scripts/photos.json`.
  Сейчас они подгружаются с CDN Higgsfield; чтобы сохранить их в репозиторий как `assets/photos/*.jpg`, запустите `python3 scripts/localize-photos.py` (нужен Pillow).
- `assets/mentor-*.jpg` — фото менторов
- `assets/logo.svg` — логотип школы
- `assets/icon-*.png`, `hero-*`, `float-cap.png` — материалы прошлой версии, в текущей вёрстке не используются

Деплой на любой статический хостинг: Vercel, Netlify, GitHub Pages.

## Локальный запуск

```bash
python3 -m http.server 8734
```

## Ссылки курсов

| Курс | Лендинг |
|---|---|
| Дизайн интерьера | https://interior.internoedu.uz |
| Архитектура | https://architecture.internoedu.uz |
| Графический дизайн | https://graphic.internoedu.uz |
| Видеомонтаж | https://videomontaj.internoedu.uz |
| Data-аналитика | https://data.internoedu.uz |
| Искусственный интеллект | https://ai.internoedu.uz |
| Бухгалтерия | https://buxgalteriya.internoedu.uz |

## Заявки → amoCRM

Все кнопки записи (`data-modal-open`) открывают одну форму `#homepage_modal`. Заявка уходит в
форму amoForms **1751306**: сначала через `api/lead.js` (Vercel Function проверяет ответ amo,
`error_code === 0`), а если функция недоступна — напрямую из браузера на `forms.amo-forms.ru`.
Параллельно уходит уведомление в Telegram. Имена полей (`AMO_FIELDS`) — общие поля аккаунта;
если форму в amo пересоздадут с другими полями, обновите их в `api/lead.js` и `index.html`.
