# alphy.chat — лендинг

Ванильный порт макета «Alphy v2» из Claude Design: без фреймворков, зависимостей и сборки.

```
index.html     бутстрап (~2 КБ, ~1 КБ gzip) — единственное, что раздаёт Vercel
vercel.json    редиректы легаси-чата на chat.alphy.chat
cdn/           вся статика; её раздаёт jsDelivr прямо из GitHub
  alphy.css    стили
  alphy.js     разметка, логика, WebGL-«океан», SVG-глобус, данные
  logos/       логотипы клиентов
release.sh     выпуск новой версии
```

`index.html` подключает `alphy.min.css` и `alphy.min.js` с
`cdn.jsdelivr.net/gh/nanohit/alphy_web@<тег>/cdn/`. Файлов `.min` в репозитории нет:
jsDelivr минифицирует их сам (terser и clean-css). На `localhost` бутстрап берёт
неминифицированные файлы из `./cdn/`.

## Локально

```bash
python3 -m http.server 8080
```

Затем открыть http://localhost:8080.

## Первый запуск

1. Создать **публичный** репозиторий `github.com/nanohit/alphy_web` (jsDelivr `/gh/`
   работает только с публичными), запушить и поставить тег `1.0.0`:
   `git tag 1.0.0 && git push origin main 1.0.0`.
2. Vercel: импортировать репозиторий. Preset — Other, build command не нужен.
   `.vercelignore` оставляет в деплое только `index.html` и `vercel.json`.
3. Домены (DNS в Porkbun):
   - `chat.alphy.chat` → Render-сервис `alphy-chat` (legacy видеочат): Custom Domain
     в Render и `CNAME chat → alphy-chat-o07d.onrender.com`;
   - `alphy.chat` и `www.alphy.chat` → Vercel-проект `alphy-web`:
     `A @ → 216.198.79.1`, `A @ → 64.29.17.1`,
     `CNAME www → ac0dc15c4bc9f6c9.vercel-dns-017.com`.

## Новая версия

Правим `cdn/` и запускаем:

```bash
./release.sh 1.0.1
```

Скрипт переписывает тег в `index.html`, коммитит и пушит коммит вместе с тегом
(`--atomic`). Vercel передеплоит бутстрап, а jsDelivr отдаст новую статику. Версии на
jsDelivr по тегу неизменяемы и кэшируются навсегда, поэтому каждая выкладка — новый тег.

## Редиректы легаси (`vercel.json`)

| Запрос на alphy.chat | Куда                                    |
| -------------------- | --------------------------------------- |
| `/1234`              | `chat.alphy.chat/1234` (308)            |
| `/room/1234`         | `chat.alphy.chat/1234` (308)            |
| `/?room=…`           | `chat.alphy.chat/?room=…` (307)         |
| любой другой путь    | тот же путь на `chat.alphy.chat` (307)  |
| `/`                  | лендинг                                 |
| `www.alphy.chat/*`   | тот же путь на `alphy.chat` (308)       |

## Настройки в `cdn/alphy.js`

- `API_ENDPOINT` — свой endpoint для демо-панели (POST `{prompt, stream:false}`).
  Если пусто, панель ходит в Groq.
- `SHOW_DEMO_ANSWER` — `false`: панель стартует с плашки «API не подключён».
- `GROQ_KEYS`, `GROQ_MODEL` — ключи (по кругу) и модель для живого демо.

## Отличия от макета

Вёрстка совпадает с макетом попиксельно на 1440, 800 и 375 px (сверено замерами в
браузере). Намеренные изменения:

- `GROQ_MODEL`: `llama-3.1-8b-instant` Groq больше не отдаёт (404), заменена на
  `qwen/qwen3.8-27b`.
- Пристыкованная справа демо-панель в раскрытом виде уезжала под следующие секции и
  схлопывалась от любого клика, в том числе по полю ввода. Теперь она поверх
  контента и закрывается кликом по шапке.
- Когда пользователь отправляет свой промпт, старый автоответ скрывается, а
  незавершённый стрим отменяется.
- Модалки закрываются по Esc; у полей формы есть `<label for>`.
- Глобус больше не встраивает шрифт в base64 (17 КБ): берёт IBM Plex Mono из Google Fonts.

Форма заявки и вход, как и в макете, ничего никуда не отправляют: только показывают
сообщение.
