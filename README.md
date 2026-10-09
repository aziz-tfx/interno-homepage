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
| Дизайн интерьера | https://interno-open-lesson.vercel.app |
| Графический дизайн | https://github.com/aziz-tfx/interno-graphic-design (TODO: задеплоить и заменить ссылку в index.html) |
| Data-аналитика | https://interno-data-analytics.vercel.app |
| Искусственный интеллект | https://ai-praktik-landing.vercel.app |
