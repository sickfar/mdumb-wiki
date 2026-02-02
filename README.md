# MDumb Wiki

A simple, fast, file-based markdown wiki built with Nuxt 4 and Bun.

## Features

- 📝 GitHub Flavored Markdown with syntax highlighting
- 🗂️ File-based structure - your filesystem is the database
- ⚡ Built with Nuxt 4 and Bun for maximum performance
- 🔍 **Fuzzy search** with keyboard shortcuts (`/` or `Ctrl+K`)
- 🔄 **Live reload** - automatic page updates when files change (SSE)
- 🐳 Docker ready with Bun-based images
- ⚙️ Configurable via JSON + environment variables
- 📊 Structured logging with Pino
- 🧪 Full test coverage with Vitest (183 tests)
- 🔒 Path traversal protection and XSS prevention
- 📱 Responsive design

## Quick Start

### Development

```bash
# Install dependencies
bun install

# Run development server
bun run dev

# Run tests
bun run test

# Run tests with UI
bun run test:ui
```

Visit http://localhost:3000 to see your wiki.

### Docker Deployment

```bash
# Build and run with docker-compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

## Configuration

### Config File

Create a configuration file at `~/.config/sickfar-wiki/config.json`:

```json
{
  "contentPath": "/home/sickfar/wiki",
  "port": 3020,
  "host": "localhost",
  "watch": true,
  "logLevel": "info",
  "title": "My Wiki",
  "description": "Personal knowledge base",
  "syntaxTheme": "github-dark",
  "maxConcurrentOps": 10,
  "cacheTTL": 60000,
  "enableCache": true
}
```

### Environment Variables

Override config with environment variables:

- `PORT` - Server port (default: 3020)
- `WIKI_PATH` - Path to wiki content directory
- `WIKI_CONFIG_PATH` - Path to config.json file
- `LOG_LEVEL` - Logging level (trace, debug, info, warn, error, fatal)
- `NODE_ENV` - Environment (development, production)

**Priority:** ENV variables > config.json > defaults

### Docker Volumes

```yaml
volumes:
  - /path/to/your/wiki:/wiki:ro
  - /path/to/config.json:/app/config.json:ro
```

## Project Structure

```
mdumb-wiki/
├── server/              # Nuxt server (backend)
│   ├── api/            # API endpoints
│   │   ├── health.get.ts
│   │   ├── navigation.get.ts
│   │   └── content/[...path].get.ts
│   ├── plugins/        # Server plugins
│   │   └── 01.init.ts  # Logger initialization
│   └── utils/          # Server utilities
│       ├── config.ts   # Config management
│       ├── logger.ts   # Pino logger
│       ├── markdown.ts # Markdown parsing
│       ├── navigation.ts # File tree generation
│       └── security.ts # Path validation
├── app/                # Frontend
│   ├── pages/          # Vue pages/routes
│   │   ├── index.vue
│   │   └── [...slug].vue
│   ├── components/     # Vue components
│   │   ├── WikiSidebar.vue
│   │   ├── WikiNavItem.vue
│   │   └── WikiContent.vue
│   └── app.vue         # Root component
├── types/              # TypeScript types
│   ├── config.ts
│   ├── wiki.ts
│   └── index.ts
├── tests/              # Test files
│   ├── unit/
│   │   ├── config.test.ts
│   │   ├── security.test.ts
│   │   ├── logger.test.ts
│   │   ├── markdown.test.ts
│   │   └── navigation.test.ts
│   └── setup.ts
├── wiki/               # Wiki content directory
├── Dockerfile          # Bun-based Docker image
└── docker-compose.yml  # Docker compose config
```

## API Endpoints

- `GET /api/health` - Health check with uptime, watcher status, and system info
- `GET /api/navigation` - Get wiki navigation tree
- `GET /api/content/{path}` - Get markdown content for a page
- `GET /api/search` - Get search index (all pages with titles, paths, tags, excerpts)
- `GET /api/events` - Server-Sent Events stream for live reload (file change notifications)

### Health Endpoint Response

```json
{
  "status": "healthy",
  "uptime": 123456,
  "timestamp": "2026-02-01T12:00:00.000Z",
  "contentPath": "/wiki",
  "watcherActive": false,
  "pagesLoaded": 0
}
```

### Navigation Endpoint Response

```json
[
  {
    "title": "Guides",
    "slug": "guides",
    "order": 0,
    "path": "guides",
    "children": [
      {
        "title": "Installation",
        "slug": "guides/installation",
        "order": 0,
        "path": "guides/installation.md"
      }
    ]
  }
]
```

### Content Endpoint Response

```json
{
  "slug": "guides/installation",
  "title": "Installation Guide",
  "description": "How to install MDumb Wiki",
  "content": "# Installation\n\n...",
  "html": "<h1>Installation</h1>...",
  "frontmatter": {
    "title": "Installation Guide",
    "description": "How to install MDumb Wiki"
  },
  "path": "guides/installation.md",
  "modifiedAt": "2026-02-01T12:00:00.000Z",
  "createdAt": "2026-01-01T12:00:00.000Z"
}
```

## Live Reload

MDumb Wiki automatically detects file changes and notifies you to reload the page.

### How It Works

1. **File Watcher**: Uses `chokidar` to monitor your wiki directory for changes
2. **SSE Connection**: Establishes a Server-Sent Events connection to `/api/events`
3. **Real-time Updates**: When files change, a banner appears: "📝 Page updated. [Reload]"
4. **Soft Reload**: Click "Reload" to refresh content without losing your position

### Configuration

Enable/disable live reload in your config:

```json
{
  "watch": true
}
```

Or via environment variable:
```bash
WATCH=false bun run dev
```

### Features

- Debouncing (300ms) to avoid spam during mass changes
- Detects file creation, modification, and deletion
- Automatic reconnection on connection loss
- Ignores hidden files (`.git`, `.DS_Store`, etc.)

## Search

Fast client-side fuzzy search across all your wiki pages.

### Keyboard Shortcuts

- **`/`** - Open search modal
- **`Ctrl+K`** or **`Cmd+K`** - Open search (alternative)
- **`↑` / `↓`** - Navigate results
- **`Enter`** - Select current result
- **`Esc`** - Close search modal

### Search Index

The search index includes:
- Page titles
- File paths
- Tags from front-matter
- Content excerpts (first 200 chars)

Search results are **fuzzy matched** (finds "instal" in "installation") and limited to the top 10 matches.

### How It Works

1. **Index Building**: Server scans all `.md` files and builds a search index at `/api/search`
2. **Client Search**: Uses Fuse.js for fast fuzzy matching
3. **Live Updates**: Search index rebuilds when files change
4. **Debouncing**: 150ms debounce for smooth typing experience

## Writing Content

### File Structure

Place markdown files in your wiki directory:

```
wiki/
├── index.md              # Homepage (required)
├── about.md             # Top-level page
└── guides/              # Folder
    ├── index.md         # Folder overview (optional)
    ├── installation.md  # Guide page
    └── configuration.md # Another guide
```

### Front Matter

Add YAML front matter to your markdown files:

```markdown
---
title: Installation Guide
description: How to install and configure the wiki
tags: [guide, setup]
author: Your Name
---

# Installation

Your content here...
```

### Markdown Features

- Headings (h1-h6)
- Bold, italic, strikethrough
- Lists (ordered, unordered, nested)
- Code blocks with syntax highlighting
- Tables
- Links (internal and external)
- Images
- Blockquotes
- Horizontal rules

## Development

### Adding Dependencies

```bash
bun add <package>
bun add -D <dev-package>
```

### Running Tests

```bash
# Run all tests
bun run test

# Run tests with UI
bun run test:ui

# Run specific test file
bun run test tests/unit/config.test.ts
```

### Code Quality

```bash
# Lint code
bun run lint
```

## Troubleshooting

### Port Already in Use

Change the port via environment variable:
```bash
PORT=4000 bun run dev
```

### Config Not Loaded

Check the config file path and JSON syntax:
```bash
cat ~/.config/sickfar-wiki/config.json
```

### Wiki Content Not Showing

Verify the `WIKI_PATH` points to a valid directory with `.md` files:
```bash
ls -la ./wiki
```

Or set it explicitly:
```bash
WIKI_PATH=./wiki bun run dev
```

### Dependencies Not Installing

Make sure you're using Bun (not npm/node):
```bash
bun --version  # Should show 1.0+
bun install
```

### Docker Build Fails

Ensure Docker is running and you have network access:
```bash
docker --version
docker-compose build
```

## Tech Stack

- **Framework:** Nuxt 4 (Vue 3, TypeScript)
- **Runtime:** Bun
- **Markdown:** markdown-it, shiki (syntax highlighting)
- **Search:** Fuse.js (fuzzy search)
- **File Watching:** chokidar (live reload)
- **Utilities:** @vueuse/core (keyboard shortcuts, composables)
- **Logging:** pino, pino-pretty
- **Testing:** vitest (183 tests)
- **Styling:** Custom CSS (no framework for minimal design)

## Security

- Path traversal protection (blocks `../` attempts)
- Input validation on all file operations
- Read-only file access
- Configurable allowed HTML tags
- Structured logging for audit trails

## Performance

- Markdown parser singleton pattern
- Config caching
- Async Shiki initialization
- Fast Bun runtime
- Minimal dependencies

## License

MIT

## Roadmap

### v1.0 (Current Skeleton) ✅
- [x] Config management
- [x] Markdown rendering with syntax highlighting
- [x] Basic navigation
- [x] Docker setup
- [x] Testing infrastructure
- [x] Security (path validation)
- [x] Structured logging

### v1.1 (Current) ✅
- [x] Live reload (SSE + file watching)
- [x] Search functionality (Fuse.js)
- [ ] Git auto-sync
- [ ] Dark theme toggle
- [ ] Breadcrumbs navigation

### v1.2 (Next)
- [ ] Mobile optimizations
- [ ] Table of contents
- [ ] Recent changes feed

### v2.0 (Future)
- [ ] Web-based editor
- [ ] File/folder management UI
- [ ] Conflict detection
- [ ] History viewer
- [ ] Multi-user support
- [ ] Authentication

## Contributing

This is a personal project, but suggestions and bug reports are welcome via GitHub issues.

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the configuration documentation
3. Check existing GitHub issues
4. Open a new issue with details
