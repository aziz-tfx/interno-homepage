# INTERNO School — главная страница

Хоум-пейдж школы современных профессий (референс структуры — proweb.uz): hero с видео-фоном, каталог направлений со ссылками на лендинги курсов, преимущества, форматы обучения, CTA открытого урока.

## Структура

Один самодостаточный `index.html` (стили и скрипты инлайном) + папка `assets/`:

- `assets/icon-*.png` — 3D-иконки, сгенерированы в Higgsfield (Recraft V4.1) в едином стиле бренда
- `assets/hero-bg.png` — постер hero-фона (16:9, 2K)
- `assets/hero-loop.mp4` — анимированный hero-фон (Kling 3.0 Turbo, image-to-video)
- `assets/logo.svg` — логотип школы

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
