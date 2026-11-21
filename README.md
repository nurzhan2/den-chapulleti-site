# DEN CHAPULLETI — сайт

Node.js без фреймворков: `server.js` (роутинг, SEO-страницы, sitemap, заявки) + `views.js` (шаблоны) + `public/assets` (стили, 3D-сцена, анимации).

## Запуск
```
npm i
npm start          # http://localhost:3000
```

## Контент
- Работы — `data/exhibits.js`. Новая работа = новый объект, страница `/exhibits/<slug>` и запись в sitemap появятся сами.
- Фото работ — `public/media/exhibits/<slug>/01.jpg, 02.jpg…` (берутся по алфавиту, первое — обложка). Видео работы — любой `.mp4` в той же папке.
- Видео первого экрана — `public/media/lava-hero.mp4` (+ `lava-hero.webm`, постер `lava-hero.jpg`). Пока файла нет, первым экраном показывается 3D-сцена.
- Логотип — `public/media/logo.svg` или `logo.png`.
- 3D-модели для витрины — `public/media/models/lava.glb`, `moai.glb`, `bulldog.glb` (Draco поддерживается). Для AR на странице работы — `public/media/models/<slug>.glb` (+ `<slug>.usdz` для iPhone).
- Соцсети — `data/contacts.js` (пустые не выводятся).

## Заявки
Переменные окружения:
- `TG_BOT_TOKEN`, `TG_CHAT_ID` — Telegram
- `MAX_BOT_TOKEN`, `MAX_CHAT_ID` — MAX (бот из бизнес-кабинета MAX)
- `SITE_URL` — домен для sitemap/canonical (например https://denchapulleti.ru)

Без токенов заявки пишутся в лог сервиса. UTM-метки и yclid цепляются автоматически.

## Шрифты
Шрифты лежат локально (`@fontsource`), Google Fonts не нужен.
Варианты для сравнения: `?font=1` (Cormorant Garamond, по умолчанию), `?font=2` (Playfair Display), `?font=3` (Old Standard TT). Выбранный вариант держится до закрытия вкладки.
