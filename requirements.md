# Custom Wiki - Requirements

## Проблема
Wiki.js слишком сложен для простой задачи: редактирую .md файлы на диске → сразу вижу изменения в браузере.

## Решение
Простая веб-морда на Nuxt 4 для сервировки markdown файлов.

## Key Design Decisions

### Живые обновления
**Механизм:** Server-Sent Events (SSE)
- File watcher (chokidar) → обнаружил изменение → broadcast через SSE
- Клиент получает event → показывает banner "Страница обновлена" → soft reload по клику
- **Debounce:** 300ms (не спамить событиями при массовых изменениях)

### Конфликты при просмотре
**Сценарий:** Файл изменился на диске пока пользователь его читает
- Показать banner: "📝 Страница обновлена. [Перезагрузить]"
- Клик → soft reload (без полной перезагрузки страницы)

### Редактирование (v2.0)
**Сохранение:** По кнопке "Save" (Ctrl+S)
- **Без auto-save в файл** (слишком опасно для случайных изменений)
- **Auto-save draft в localStorage** (каждые 10 сек) — только для восстановления после краша
- **Conflict detection:** При сохранении проверяем hash файла → если изменился → показываем warning с опциями

### Конфликты при редактировании (v2.0)
**Сценарий:** Файл изменился на диске пока пользователь редактирует
- При попытке Save → проверить hash файла
- Если hash изменился:
  1. Показать warning: "⚠️ Файл изменился на диске"
  2. Опции:
     - **Перезагрузить** → показать diff → подтвердить потерю изменений
     - **Сохранить как новый файл** → `{original}-conflict-{timestamp}.md`
     - **Force save** → перезаписать (с confirmation dialog)
- **Background check:** Каждые 30 сек проверять hash файла → если изменился → показать passive notification

### Поиск
**Решение:** Fuse.js (fuzzy search, легковесный, работает на клиенте)
- Индекс строится при загрузке навигации (title + path + tags из front-matter)
- Поиск по заголовкам, путям, тегам, контенту
- Hotkey `/` → открыть поиск
- Live поиск (debounce 150ms)
- Показывать топ-10 результатов с highlight
- Навигация стрелками ↑↓, Enter для перехода
```javascript
// Конфиг Fuse.js
{
  keys: ['title', 'path', 'tags', 'content'],
  threshold: 0.3, // fuzzy match агрессивность
  minMatchCharLength: 2
}
```

### Images & Assets
**Решение:** Сервировать из той же директории что и markdown
- URL `![image](./images/foo.png)` → сервировать `/wiki/projects/images/foo.png`
- Nuxt static file serving из `wikiPath`
- Поддержка форматов: `.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`, `.webp`
- Также: `.pdf`, `.zip` и другие файлы (для скачивания)

### Link Handling
**Решение:** Парсинг и конвертация markdown ссылок
- `[link](../other-page.md)` → конвертировать в `/other-page`
- `[link](./sub/page.md)` → `/projects/sub/page`
- Абсолютные ссылки `[link](/root/page.md)` → `/root/page`
- External links остаются как есть
- Anchor links: `[section](#heading)` → scroll to heading

### Security
**Path Traversal Prevention:**
```javascript
// Валидация path перед доступом к файлу
const safePath = path.normalize(requestedPath).replace(/^(\.\.[\/\\])+/, '');
if (!safePath.startsWith(wikiPath)) throw new Error('Access denied');
```

**XSS Protection:**
- `markdown-it-sanitizer` plugin или `DOMPurify` на клиенте
- Sanitize HTML в markdown (запретить `<script>`, опасные attrs)
- Content Security Policy headers

**Allowed HTML tags в markdown:**
- Safe: `<b>`, `<i>`, `<em>`, `<strong>`, `<code>`, `<pre>`, `<a>`, `<img>`
- Blocked: `<script>`, `<iframe>`, `<object>`, event handlers (`onclick`, etc.)

### Error Pages
**404 - Page Not Found:**
- Кастомная страница с поиском похожих страниц (Fuse.js)
- "Страница не найдена. Попробуйте поиск или вернитесь на [главную](/)."

**500 - Server Error:**
- Generic error page
- Логировать полный stack trace (pino)
- "Что-то пошло не так. Попробуйте перезагрузить страницу."

**Git Sync Errors:**
- Banner в UI: "⚠️ Git sync failed: [error message]"
- Показывать в `/api/health` endpoint
- Опция "Retry" для ручного триггера sync

### Mobile UX
**Responsive Design:**
- Breakpoints: `sm` (640px), `md` (768px), `lg` (1024px)
- Mobile: бургер-меню (3 lines icon) → slide-in sidebar
- Touch-friendly: кнопки min 44x44px (Apple HIG)
- Swipe gestures: swipe right → open sidebar, swipe left → close

**Бургер-меню:**
```vue
<button @click="toggleSidebar" class="md:hidden">
  <Icon name="heroicons:bars-3" />
</button>
```

### Performance
**Markdown Caching:**
- Кэшировать парсинг MD → HTML в памяти (LRU cache)
- Invalidate при file change event
- Library: `lru-cache` (max 100 файлов)

**Lazy Loading:**
- Sidebar: виртуальный скролл для больших структур (>100 файлов)
- Images: `loading="lazy"` attribute
- Code blocks: lazy highlight (только visible blocks)

**Pagination:**
- Для папок с >50 файлов → paginate список
- "Load more" button или infinite scroll

### File & Folder Management (v2.0)

**UI Components:**

**Context Menu (правый клик на файле/папке):**
```
┌─────────────────────────┐
│ ✏️  Редактировать       │
│ 📁 Превратить в папку   │ ← только для файлов
│ ➕ Добавить подстраницу │ ← только для папок
│ 🗑️  Удалить            │
└─────────────────────────┘
```

**Кнопка "+" в sidebar:**
- Hover на папку → показать "+" справа
- Клик → dropdown:
  ```
  ┌──────────────────┐
  │ 📄 Новый файл    │
  │ 📁 Новая папка   │
  └──────────────────┘
  ```

**Modal для создания:**
```
┌─────────────────────────────────────┐
│ Создать новый файл                  │
├─────────────────────────────────────┤
│ Имя: [my-page________________]      │
│                                     │
│ Будет создан:                       │
│ /projects/my-page.md                │
│                                     │
│     [Отмена]    [Создать]           │
└─────────────────────────────────────┘
```

**Validation при создании:**
- Проверка на существование (если существует → показать ошибку)
- Auto-slug: пробелы → дефисы, lowercase, убрать спецсимволы
- Запретить: `..`, `/`, `\`, специальные символы в имени

**Превращение в папку - confirmation:**
```
┌─────────────────────────────────────┐
│ Превратить файл в папку?            │
├─────────────────────────────────────┤
│ Файл: foo.md                        │
│                                     │
│ Контент переместится в:             │
│ foo/index.md                        │
│                                     │
│ После этого можно будет добавить    │
│ подстраницы в папку foo/            │
│                                     │
│     [Отмена]    [Превратить]        │
└─────────────────────────────────────┘
```

### Keyboard Shortcuts
**Hotkeys:**
- `/` → открыть поиск (focus input)
- `Ctrl+K` / `Cmd+K` → command palette (навигация)
- `Ctrl+N` / `Cmd+N` → создать новый файл (v2.0)
- `Esc` → закрыть search / modals
- `Ctrl+B` / `Cmd+B` → toggle sidebar
- `↑` / `↓` → навигация в поиске
- `Enter` → перейти на выбранную страницу

**Library:** `@vueuse/core` (useMagicKeys)

### Loading States
**Skeleton UI:**
- При загрузке страницы → показывать skeleton layout
- Плейсхолдеры для: sidebar, content area, code blocks

**Progress Indicators:**
- Git sync в процессе → индикатор в header (spinner + "Syncing...")
- File save (v2.0) → button spinner + "Saving..."

**Компоненты:**
- Tailwind CSS `animate-pulse` для skeleton
- Heroicons для спиннеров

### Testing
**Unit Tests (Vitest):**
- Markdown парсинг
- Link конвертация
- Path traversal validation
- Config loading & merging
- Git conflict handling logic

**E2E Tests (Playwright):**
- Навигация по страницам
- Поиск
- Live reload (file change → page update)
- Mobile responsive
- Keyboard shortcuts

**Coverage target:** >80%

---

## Core Requirements

### 0. Конфигурируемость
- **Всё что можно конфигурировать — конфигурировать в JSON файле**
- Дефолтный путь: `~/.config/sickfar-wiki/config.json`
- Переопределяется через env: `WIKI_CONFIG_PATH`
- Монтируется в Docker как volume
- Если конфиг не найден — работать с дефолтными значениями
- **Приоритет конфигурации:** ENV переменные > config.json > дефолтные значения
  - Пример: `PORT` env переменная важнее чем `port` в config.json

### 1. Файловая система как источник истины
- Вся вики в папке (например `/home/sickfar/wiki`)
- Структура папок = структура навигации
- Markdown файлы рендерятся в HTML
- Никакой БД — только файлы

### 2. Hot Reload (Live Updates)
- **Механизм:** Server-Sent Events (SSE)
  - Endpoint: `GET /api/events` → SSE stream
  - При изменении файла → file watcher → broadcast event через SSE
  - Клиент получает event → перезагружает текущую страницу (soft reload)
- **События:**
  - `file:changed` → `{ path: "/wiki/projects/foo.md", type: "update" }`
  - `file:deleted` → `{ path: "/wiki/bar.md", type: "delete" }`
  - `file:created` → `{ path: "/wiki/new.md", type: "create" }`
- **Конфликты при просмотре:**
  - Если файл изменился на диске пока пользователь читает → показать banner: "📝 Страница обновлена. [Перезагрузить]"
  - Клик на banner → soft reload страницы
- Без ручного рефреша — живое обновление

### 3. Markdown рендеринг
- GitHub Flavored Markdown
- Syntax highlighting для code blocks
- Поддержка таблиц, чекбоксов, эмодзи
- Ссылки между страницами (относительные пути)

### 4. Навигация
- Боковое меню (sidebar) на основе структуры папок
- Breadcrumbs (хлебные крошки)
- Главная страница (`index.md` или `README.md` в корне)
- Автоматическая генерация меню из файловой структуры

### 5. UI/UX
- Минималистичный дизайн (без лишнего)
- Адаптивная верстка (работает на телефоне)
- Тёмная/светлая тема (переключатель)
- Поиск по содержимому (простой text search)

### 6. Git Auto-sync
- Опрос изменений раз в N минут (configurable, default: 5 минут)
- При обнаружении изменений → `git add . && git commit && git push`
- Автоматический commit message с timestamp
- Работает в фоне (background task)

### 7. Docker
- Dockerfile для деплоя
- Docker Compose конфиг
- Volumes:
  - `/home/sickfar/wiki` → `/wiki` (вики файлы)
  - `~/.config/sickfar-wiki/config.json` → `/app/config.json` (конфиг)
- Environment: `WIKI_CONFIG_PATH=/app/config.json`

### 8. Логирование
- Структурированные логи (JSON для production, pretty для dev)
- Уровни: `debug`, `info`, `warn`, `error`
- Логировать:
  - Изменения файлов: `"file changed: /wiki/projects/foo.md"`
  - Git операции: `"committed: 3 files, hash: abc123"`, `"pushed to origin/main"`
  - Ошибки с полным stack trace
  - Startup/shutdown события
- Библиотека: `pino` (fast, structured)

### 9. Git Conflict Handling
- При ошибке auto-push (например, конфликт):
  - Попытка 1: `git pull --rebase` → retry push
  - Попытка 2: `git pull --no-rebase` (merge) → retry push
  - Если не вышло:
    - Залогировать ошибку с деталями
    - Создать fallback branch: `conflict-{timestamp}`
    - Push в fallback branch
    - Отправить warning в лог
- Опция в конфиге: `git.conflictStrategy` (`rebase` / `merge` / `branch`)

### 10. Health Check Endpoint
- `GET /api/health` → JSON response
```json
{
  "status": "ok",
  "uptime": 3600,
  "git": {
    "enabled": true,
    "lastSync": "2026-02-01T20:15:00Z",
    "upToDate": true,
    "branch": "main",
    "lastCommit": "abc123"
  },
  "watcher": {
    "active": true,
    "watchedFiles": 142
  }
}
```
- При ошибках: `{ "status": "degraded", "errors": [...] }`

### 11. Graceful Shutdown
- Обработка сигналов: `SIGTERM`, `SIGINT` (Ctrl+C)
- При shutdown:
  1. Остановить file watcher
  2. Дождаться завершения текущего git commit/push
  3. Сохранить pending changes (если есть)
  4. Закрыть соединения
  5. Exit code 0
- Timeout: 30 секунд (если не успели — force exit)

### 12. YAML Front-Matter Support
- Парсинг метаданных из markdown файлов:
```markdown
---
title: Custom Wiki Requirements
tags: [project, wiki, nuxt]
updated: 2026-02-01
author: Roman
---
# Content here
```
- Использование:
  - Переопределение заголовка страницы (`title`)
  - Фильтрация по тегам
  - Сортировка по дате обновления
  - Опционально для v1.0, но парсер должен быть готов
- Библиотека: `gray-matter`

### 13. Deployment
- Порт: 3020 (чтобы не конфликтовать с Wiki.js на 3010)
- Доступ без авторизации (локальная сеть)
- SSR (Server-Side Rendering) для быстрой загрузки

## Tech Stack

### Frontend & Backend
- **Nuxt 4** (latest)
- **Vue 3** + Composition API
- **TypeScript**

### Markdown Processing
- `markdown-it` — парсинг MD в HTML
- `shiki` — syntax highlighting
- `gray-matter` — YAML front-matter

### Logging
- `pino` — structured logging (fast, production-ready)
- `pino-pretty` — pretty logs для development

### File Watching & Live Updates
- `chokidar` — file watcher для отслеживания изменений
- **SSE (Server-Sent Events)** — для live updates (встроено в Nuxt/Node.js, no library needed)

### Styling
- **Tailwind CSS** — utility-first CSS

### Search
- **Fuse.js** — fuzzy search (легковесный, работает на клиенте)

### Performance & Caching
- `lru-cache` — LRU кэш для markdown рендеринга

### Security
- `markdown-it-sanitizer` или `DOMPurify` — XSS protection

### Keyboard Shortcuts
- `@vueuse/core` (useMagicKeys) — hotkeys handling

### Testing
- `vitest` — unit testing
- `playwright` — e2e testing
- `@nuxt/test-utils` — Nuxt testing utilities

## File Structure

```
/home/sickfar/wiki/
├── index.md                     # Главная страница
├── projects/
│   ├── uclass/
│   │   ├── README.md
│   │   └── screens.md
│   ├── capoeira/
│   │   └── index.md
│   └── custom-wiki/
│       └── requirements.md      # 👈 Этот файл
└── smart-home/
    └── index.md
```

## Features Roadmap

### MVP (v1.0)
- [ ] Markdown рендеринг (markdown-it + shiki)
- [ ] YAML front-matter парсинг (gray-matter)
- [ ] File watching + hot reload via SSE (chokidar)
- [ ] Sidebar навигация (auto-generated from folder structure)
- [ ] **Быстрый поиск** (Fuse.js fuzzy search + hotkey `/`)
- [ ] **Images & Assets handling** (сервировка из вики директории)
- [ ] **Link handling** (конвертация .md ссылок в URL)
- [ ] **Security** (path traversal, XSS sanitization)
- [ ] **Error pages** (404, 500, git errors)
- [ ] **Mobile UX** (responsive + бургер-меню)
- [ ] **Performance** (markdown кэш, lazy loading)
- [ ] **Keyboard shortcuts** (навигация, поиск)
- [ ] **Loading states** (skeleton UI, progress indicators)
- [ ] Git auto-commit + push (раз в N минут)
- [ ] Git conflict handling (rebase → merge → fallback branch)
- [ ] Структурированное логирование (pino)
- [ ] Health check endpoint (`/api/health`)
- [ ] Graceful shutdown (SIGTERM/SIGINT)
- [ ] JSON конфигурация + ENV overrides
- [ ] Docker деплой
- [ ] **Testing** (unit: Vitest, e2e: Playwright)
- [ ] Минимальный UI (Tailwind CSS)

### v1.1
- [ ] Breadcrumbs
- [ ] Тёмная тема toggle
- [ ] Advanced search filters (по тегам, датам)
- [ ] Prometheus metrics endpoint (`/metrics`) для мониторинга

### v2.0 (Web Editor - опционально)
- [ ] **Редактирование через UI**
  - Markdown редактор с превью
  - **Сохранение:** По кнопке "Save" (Ctrl+S)
  - **Auto-save draft:** В localStorage каждые 10 секунд (черновик, не файл)
  - **Конфликты при редактировании:**
    - При попытке сохранить → проверить hash файла на диске
    - Если изменился → показать warning: "⚠️ Файл изменился на диске. [Перезагрузить] [Сохранить как новый]"
    - Опции:
      1. Перезагрузить → потерять изменения (показать diff перед этим)
      2. Сохранить как новый файл → `{original}-conflict-{timestamp}.md`
      3. Force save → перезаписать (опасно, confirmation dialog)
  - **Debounced validation:** Проверка конфликтов каждые 30 секунд в фоне

- [ ] **Создание файлов и папок**
  - UI: кнопка "+" в sidebar рядом с папкой → dropdown:
    - "Новый файл" → modal с полем "Имя файла" → создаёт `{name}.md`
    - "Новая папка" → modal с полем "Имя папки" → создаёт папку с `index.md` внутри
  - Файловая система:
    - Создать файл: `fs.writeFile(path, '# Title\n\nContent here...')`
    - Создать папку: `fs.mkdir(path)` + создать `index.md` внутри
  - Validation:
    - Проверить что имя файла/папки валидное (no special chars, no `..`)
    - Проверить что не существует уже
    - Auto-slug: "My Page" → `my-page.md`

- [ ] **Превращение файла в папку (promote to folder)**
  - UI: кнопка "Convert to folder" в контекстном меню файла
  - Use case: `/projects/foo.md` → хочу добавить подстраницы
  - Алгоритм:
    1. Создать папку `/projects/foo/`
    2. Переместить контент `foo.md` → `foo/index.md`
    3. Удалить `foo.md`
    4. Обновить git:
       ```bash
       mkdir /projects/foo
       mv /projects/foo.md /projects/foo/index.md
       git add .
       git commit -m "Convert foo.md to folder"
       ```
  - Ссылки на эту страницу остаются рабочими:
    - `/projects/foo` → рендерится `foo/index.md`
  - Confirmation dialog: "Превратить 'foo.md' в папку? Контент станет index.md, можно будет добавить подстраницы."

- [ ] История изменений (через git log)
- [ ] Diff viewer для просмотра изменений
- [ ] Markdown preview (split view / side-by-side)

## Non-Goals (что НЕ делаем)
- ❌ Авторизация / RBAC
- ❌ Базы данных
- ❌ CMS функции (создание/удаление файлов через UI в MVP)
- ❌ Сложная поисковая индексация
- ❌ Мультиязычность

## Installation & Usage

```bash
# Development
git clone <repo> custom-wiki
cd custom-wiki
npm install
npm run dev

# Production (Docker)
docker compose up -d
```

**docker-compose.yml пример:**
```yaml
services:
  wiki:
    build: .
    ports:
      - "3020:3020"
    volumes:
      - /home/sickfar/wiki:/wiki
      - ~/.config/sickfar-wiki/config.json:/app/config.json
    environment:
      - PORT=3020
      - WIKI_CONFIG_PATH=/app/config.json
      - NODE_ENV=production
    restart: unless-stopped
```

## Configuration

### Config File (JSON)
- **Путь:** `~/.config/sickfar-wiki/config.json` (default)
- Переопределяется через env: `WIKI_CONFIG_PATH`
- Монтируется в Docker как volume

**Пример `config.json`:**
> Примечание: `port` опционален если передаётся через `PORT` env

```json
{
  "wikiPath": "/wiki",
  "port": 3020,
  "liveReload": {
    "enabled": true,
    "debounce": 300
  },
  "search": {
    "enabled": true,
    "fuzzyThreshold": 0.3,
    "minMatchLength": 2,
    "maxResults": 10
  },
  "cache": {
    "markdown": {
      "enabled": true,
      "maxSize": 100
    }
  },
  "security": {
    "sanitizeHtml": true,
    "allowedTags": ["b", "i", "em", "strong", "code", "pre", "a", "img", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "blockquote", "p", "br", "hr"]
  },
  "git": {
    "enabled": true,
    "syncInterval": 5,
    "autoCommit": true,
    "autoPush": true,
    "commitMessageTemplate": "Auto-commit: {timestamp}",
    "conflictStrategy": "rebase"
  },
  "logging": {
    "level": "info",
    "pretty": false
  },
  "ui": {
    "theme": "dark",
    "sidebarWidth": 280,
    "maxContentWidth": 1200,
    "mobileBreakpoint": 768
  },
  "markdown": {
    "syntaxHighlighting": true,
    "theme": "github-dark",
    "parseFrontMatter": true
  },
  "keyboard": {
    "enabled": true,
    "searchHotkey": "/",
    "commandPaletteHotkey": "ctrl+k",
    "newFileHotkey": "ctrl+n"
  },
  "fileManagement": {
    "allowCreate": true,
    "allowDelete": false,
    "allowPromoteToFolder": true,
    "autoSlug": true
  }
}
```

**Всё что можно конфигурировать — в config.json:**
- Путь к директории вики (относительно контейнера)
- Порт приложения
- Hot reload вкл/выкл
- Git sync интервалы, auto-commit/push
- UI настройки (тема, ширина sidebar и т.д.)
- Markdown рендеринг (highlighting theme, plugins)

### Environment Variables (приоритет над config.json)
- `PORT` — порт приложения (default: 3020)
- `WIKI_CONFIG_PATH` — путь к config.json (default: `~/.config/sickfar-wiki/config.json`)
- `NODE_ENV` — окружение (production/development)

### Default Values (если config.json не найден)
```json
{
  "wikiPath": "/wiki",
  "port": 3020,
  "liveReload": {
    "enabled": true,
    "debounce": 300
  },
  "search": {
    "enabled": true,
    "fuzzyThreshold": 0.3,
    "minMatchLength": 2,
    "maxResults": 10
  },
  "cache": {
    "markdown": {
      "enabled": true,
      "maxSize": 100
    }
  },
  "security": {
    "sanitizeHtml": true,
    "allowedTags": ["b", "i", "em", "strong", "code", "pre", "a", "img", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "blockquote", "p", "br", "hr"]
  },
  "git": {
    "enabled": true,
    "syncInterval": 5,
    "autoCommit": true,
    "autoPush": true,
    "commitMessageTemplate": "Auto-commit: {timestamp}",
    "conflictStrategy": "rebase"
  },
  "logging": {
    "level": "info",
    "pretty": false
  },
  "ui": {
    "theme": "light",
    "sidebarWidth": 280,
    "maxContentWidth": 1200,
    "mobileBreakpoint": 768
  },
  "markdown": {
    "syntaxHighlighting": true,
    "theme": "github-light",
    "parseFrontMatter": true
  },
  "keyboard": {
    "enabled": true,
    "searchHotkey": "/",
    "commandPaletteHotkey": "ctrl+k",
    "newFileHotkey": "ctrl+n"
  },
  "fileManagement": {
    "allowCreate": true,
    "allowDelete": false,
    "allowPromoteToFolder": true,
    "autoSlug": true
  }
}
```

## Documentation Requirements

### README.md должен содержать:

**Quick Start:**
```bash
# Development
npm install
npm run dev

# Production
docker compose up -d
```

**Configuration Examples:**
- Минимальный config.json
- Полный config.json со всеми опциями
- Docker compose пример
- Environment variables

**Troubleshooting:**
- Git push fails → проверить SSH ключи, branch protection
- File changes not detected → проверить file permissions, watcher limits
- Port already in use → изменить `PORT` env
- Config not loaded → проверить `WIKI_CONFIG_PATH`, JSON syntax

**API Endpoints:**
- `GET /` — главная страница
- `GET /api/health` — health check
- `GET /api/events` — SSE stream (live updates)
  ```javascript
  // Client example
  const eventSource = new EventSource('/api/events');
  eventSource.addEventListener('file:changed', (e) => {
    const { path, type } = JSON.parse(e.data);
    if (path === currentPagePath) {
      showUpdateBanner();
    }
  });
  ```
- `GET /api/search?q={query}` — search API (опционально, если нужен server-side search)
  ```json
  {
    "results": [
      { "title": "Custom Wiki", "path": "/projects/custom-wiki", "excerpt": "..." }
    ]
  }
  ```
- `GET /[...path]` — динамические страницы вики
- Static assets: `/wiki/**/*` → сервировка images/files из вики директории

**(v2.0) Web Editor API:**
- `GET /api/file?path=/wiki/foo.md` — получить содержимое файла + hash
- `POST /api/file` — сохранить/создать файл (с conflict detection)
  ```json
  {
    "path": "/wiki/foo.md",
    "content": "...",
    "hash": "abc123"  // hash для conflict detection (null для нового файла)
  }
  ```
- `POST /api/folder` — создать папку
  ```json
  {
    "path": "/wiki/new-folder",
    "createIndex": true  // создать index.md внутри
  }
  ```
- `POST /api/file/promote` — превратить файл в папку
  ```json
  {
    "path": "/wiki/foo.md"
  }
  // Результат: /wiki/foo/index.md создан, foo.md удалён
  ```
- `DELETE /api/file?path=/wiki/foo.md` — удалить файл (опционально, осторожно)
- `DELETE /api/folder?path=/wiki/foo` — удалить папку (опционально, очень осторожно)

**Development:**
- Как запустить в dev режиме
- Как дебажить (логи, breakpoints)
- Структура проекта

**Deployment:**
- Docker build & run
- Environment setup
- Nginx reverse proxy (опционально)

## Success Criteria
✅ Редактирую `/home/sickfar/wiki/file.md` → через 1-2 секунды вижу изменения в браузере  
✅ Навигация работает интуитивно  
✅ Работает на телефоне  
✅ Деплой через Docker за 1 команду  
✅ Git sync работает автоматически без вмешательства  
✅ Логи понятные и структурированные  
✅ Health check показывает актуальный статус  

---

**Начинаем с MVP.** Простота > фичи, но с надёжным фундаментом.
