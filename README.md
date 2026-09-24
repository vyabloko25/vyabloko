# vyabloko.art — Cloudflare (Pages + D1 + R2)

Настоящий бэкенд: сайт на Cloudflare Pages, данные в D1 (база), картинки в R2
(раздаются с CDN, без платы за трафик), вход по паролю на сервере. Правки в
кабинете видны у всех сразу — ручной заливки больше нет.

## Что в проекте
- `public/index.html` — сайт и кабинет (тот же дизайн).
- `public/_redirects` — чтобы работал адрес входа `/cabinet`.
- `functions/` — серверная часть (API): данные, загрузка картинок, вход.
- `schema.sql` — таблица для данных.
- `wrangler.toml` — конфиг с привязками D1 и R2.

---

## Что понадобится
- Аккаунт Cloudflare (бесплатный) — https://dash.cloudflare.com
- Node.js на компьютере (для команды `npx wrangler`).

Все команды ниже выполняются из папки проекта. `npx wrangler` при первом запуске
попросит войти в Cloudflare (откроется браузер).

## Шаг 1. База данных D1
    npx wrangler d1 create vyabloko
Скопируй выданный `database_id` и вставь его в `wrangler.toml`
(строка `database_id = "..."`). Затем создай таблицу:
    npx wrangler d1 execute vyabloko --remote --file=schema.sql

## Шаг 2. Хранилище картинок R2
    npx wrangler r2 bucket create vyabloko-images

## Шаг 3. Первый деплой
    npx wrangler pages project create vyabloko --production-branch main
    npx wrangler pages deploy public --project-name vyabloko
Получишь адрес вида `https://vyabloko.pages.dev` — это уже рабочий сайт.

## Шаг 4. Пароль и секрет входа
    npx wrangler pages secret put ADMIN_PASSWORD --project-name vyabloko
    npx wrangler pages secret put AUTH_SECRET --project-name vyabloko
- `ADMIN_PASSWORD` — твой пароль в кабинет (задай любой надёжный).
- `AUTH_SECRET` — длинная случайная строка (например из менеджера паролей).

## Шаг 5. Привязать D1 и R2 к сайту (если деплой их не подхватил)
В панели Cloudflare: Workers & Pages → vyabloko → Settings → Functions →
- D1 database bindings: имя `DB` → база `vyabloko`.
- R2 bucket bindings: имя `BUCKET` → бакет `vyabloko-images`.
Затем сделай повторный деплой (Шаг 3, вторая команда).

## Шаг 6. Домен vyabloko.art
В панели: vyabloko → Custom domains → Set up a custom domain → `vyabloko.art`.
Cloudflare покажет, что прописать (обычно перенос домена под управление
Cloudflare — смена nameservers у Namecheap на выданные Cloudflare, как мы делали
для Netlify, только адреса от Cloudflare). После распространения HTTPS выпустится сам.

## Шаг 7. Вход и наполнение
Открой `https://vyabloko.art/cabinet` → введи `ADMIN_PASSWORD`.
Добавляй работы (Add multiple — сразу пачкой), правь тексты, порядок и оформление.
Всё сохраняется на сервер автоматически (индикатор Saved вверху) и сразу видно всем.

## Перенос уже введённых работ
Если у тебя остался последний бэкап `data.json` со старой версии (с картинками):
кабинет → Manage → (кнопка Import вверху) → выбери файл. Он загрузит картинки в R2
и создаст работы. Дубликаты потом можно удалить.

## Обновление кода в будущем
Повторяй Шаг 3 (вторая команда) — она перезальёт сайт и функции. Данные и картинки
при этом не трогаются (они в D1 и R2).

---

## Заметки
- Бесплатные лимиты Cloudflare для портфолио с запасом: R2 10 ГБ и нулевая плата за
  отдачу, D1 до 5 ГБ, Pages — обычный трафик без ограничений. Ничего не «засыпает».
- Пароль теперь настоящий (проверяется на сервере), а не в браузере.
- Резервная копия: кнопка Backup в кабинете скачивает JSON с текстами/настройками
  (картинки и так надёжно лежат в R2).
