# MDumb Wiki

A simple, fast, file-based markdown wiki built with Nuxt 4 and Bun.

## Features

- **Markdown Rendering** - GitHub Flavored Markdown with syntax highlighting (19 languages)
- **File-based Structure** - Your filesystem is the database
- **Web-based Editor** - Create, edit, and delete pages from the browser
- **Live Reload** - Automatic page updates when files change (SSE)
- **Fuzzy Search** - Fast client-side search with keyboard shortcuts
- **Git Integration** - Optional auto-sync with git repositories
- **Theme Toggle** - Light, dark, and auto themes
- **Responsive Design** - Mobile-friendly with sidebar navigation
- **Docker Ready** - Production-ready multi-stage images
- **Security** - Path traversal protection and XSS prevention

---

## Installation with Docker

### Prerequisites

- Docker Engine 20.10+
- Docker Compose v2.0+
- A directory with markdown files (your wiki content)

### Quick Start

1. **Create a directory for your wiki content:**

```bash
mkdir -p ./wiki
echo "# Welcome to My Wiki" > ./wiki/index.md
```

2. **Create a `docker-compose.yml` file:**

```yaml
version: '3.8'

services:
  wiki:
    image: ghcr.io/sickfar/mdumb-wiki:latest
    container_name: mdumb-wiki
    ports:
      - "3020:3020"
    volumes:
      - ./wiki:/wiki
    restart: unless-stopped
```

3. **Start the container:**

```bash
docker-compose up -d
```

4. **Access the wiki:**

Open http://localhost:3020 in your browser.

The container uses sensible defaults: port `3020`, wiki path `/wiki`, log level `info`, and file watching enabled.

### Building from Source

```bash
# Clone the repository
git clone https://github.com/sickfar/mdumb-wiki.git
cd mdumb-wiki

# Build the Docker image
docker-compose build

# Start the container
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the container
docker-compose down
```

### Docker Image Details

The image uses a multi-stage build:

| Stage | Base Image | Purpose |
|-------|------------|---------|
| `base` | `oven/bun:1` | Build environment |
| `deps` | `oven/bun:1` | Installs dependencies with frozen lockfile |
| `builder` | `oven/bun:1` | Runs `bun run build` to create production output |
| `runner` | `node:22-slim` | Minimal production image with `.output/` only |

**Image size:** ~250MB (slim Node.js runtime)

**Note:** If no wiki content is mounted, a welcome page with getting started instructions is displayed.

---

## Configuration in Docker

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3020` |
| `WIKI_PATH` | Path to wiki content inside container | `/wiki` |
| `WIKI_CONFIG_PATH` | Path to config file inside container | - |
| `LOG_LEVEL` | Logging verbosity: `trace`, `debug`, `info`, `warn`, `error`, `fatal` | `info` |
| `NODE_ENV` | Environment mode | `production` |
| `GIT_ENABLED` | Enable git sync (`true`/`false`) | `false` |
| `GIT_SYNC_INTERVAL` | Sync interval in minutes | `5` |
| `GIT_AUTO_PUSH` | Auto-push changes (`true`/`false`) | `true` |
| `GIT_CONFLICT_STRATEGY` | Conflict resolution: `rebase`, `merge`, `branch` | `rebase` |

### Volume Mounts

```yaml
volumes:
  # Wiki content (required, read-write for editor)
  - /path/to/your/wiki:/wiki

  # Config file (optional, read-only)
  - /path/to/config.json:/app/config.json:ro
```

**Note:** The wiki volume is mounted read-write by default to allow the web editor to create and modify files. Add `:ro` suffix if you want read-only mode.

### Configuration File

Create a `config.json` file for advanced settings:

```json
{
  "contentPath": "/wiki",
  "port": 3020,
  "host": "0.0.0.0",
  "watch": true,
  "logLevel": "info",
  "title": "My Knowledge Base",
  "description": "Personal wiki with git sync",
  "syntaxTheme": "github-dark",
  "maxConcurrentOps": 10,
  "cacheTTL": 60000,
  "enableCache": true,
  "security": {
    "sanitizeHtml": true,
    "allowedTags": [
      "b", "i", "em", "strong", "code", "pre", "a", "img", "ul", "ol", "li",
      "p", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "hr", "br",
      "table", "thead", "tbody", "tr", "th", "td", "span", "div"
    ],
    "allowedAttributes": {
      "*": ["class", "id"],
      "a": ["href", "title", "target"],
      "img": ["src", "alt", "title", "width", "height"]
    }
  },
  "assets": {
    "allowedExtensions": [".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".pdf"],
    "maxFileSize": 10485760,
    "enableCache": true,
    "cacheDuration": 3600
  },
  "git": {
    "enabled": true,
    "syncInterval": 5,
    "autoCommit": true,
    "autoPush": true,
    "commitMessageTemplate": "Auto-commit: {timestamp}",
    "conflictStrategy": "rebase"
  },
  "cache": {
    "markdown": {
      "enabled": true,
      "maxSize": 100
    }
  }
}
```

**Configuration Priority:** Environment Variables > Config File > Defaults

### Complete Docker Compose Example

```yaml
version: '3.8'

services:
  wiki:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: mdumb-wiki
    ports:
      - "3020:3020"
    volumes:
      # Mount wiki content (read-write for editor)
      - ${WIKI_PATH:-./wiki}:/wiki
      # Mount config file
      - ${CONFIG_PATH:-./config/config.json}:/app/config.json:ro
    environment:
      - NODE_ENV=production
      - PORT=3020
      - WIKI_PATH=/wiki
      - WIKI_CONFIG_PATH=/app/config.json
      - LOG_LEVEL=${LOG_LEVEL:-info}
      - GIT_ENABLED=${GIT_ENABLED:-false}
      - GIT_SYNC_INTERVAL=${GIT_SYNC_INTERVAL:-5}
      - GIT_AUTO_PUSH=${GIT_AUTO_PUSH:-true}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3020/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
```

Run with custom paths:

```bash
WIKI_PATH=/var/wiki CONFIG_PATH=/etc/mdumb-wiki/config.json docker-compose up -d
```

---

## Usage

### Writing Content

#### File Structure

Organize markdown files in your wiki directory:

```
wiki/
├── index.md              # Homepage (required)
├── about.md              # Top-level page
└── guides/               # Folder
    ├── index.md          # Folder overview (optional)
    ├── installation.md   # Guide page
    └── configuration.md  # Another guide
```

#### Front Matter

Add YAML front matter to customize page metadata:

```markdown
---
title: Installation Guide
description: How to install and configure the wiki
tags: [guide, setup, docker]
author: Your Name
---

# Installation

Your content here...
```

#### Supported Markdown Features

- Headings (h1-h6)
- Bold, italic, strikethrough
- Lists (ordered, unordered, nested)
- Code blocks with syntax highlighting
- Tables
- Links (internal and external)
- Images
- Blockquotes
- Horizontal rules

#### Syntax Highlighting

Supported languages: TypeScript, JavaScript, Python, Bash, JSON, YAML, HTML, CSS, SQL, Go, Rust, Java, Kotlin, C, C++, PHP, Ruby, Markdown, Dockerfile.

````markdown
```typescript
function greet(name: string): string {
  return `Hello, ${name}!`
}
```
````

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `/` or `Ctrl+K` | Open search modal |
| `↑` / `↓` | Navigate search results |
| `Enter` | Select current result |
| `Esc` | Close modal |

### Web Editor

Click the "Edit" button on any page to open the web editor:

- **Live Preview** - See rendered markdown as you type
- **Formatting Toolbar** - Bold, italic, code, links, headings
- **Draft Recovery** - Automatically saves drafts to localStorage
- **Conflict Detection** - Warns if file changed since loading

To create new files or folders, use the context menu (right-click) in the sidebar.

### Theme Toggle

Click the theme icon in the sidebar to switch between:
- **Light** - Light background with dark text
- **Dark** - Dark background with light text
- **Auto** - Follows system preference

### Search

The fuzzy search indexes:
- Page titles
- File paths
- Tags from front-matter
- Content excerpts (first 200 characters)

Results are ranked by relevance and limited to the top 10 matches.

### Live Reload

When files change on disk, a banner appears: "Page updated. [Reload]"

Configure file watching:
```json
{
  "watch": true
}
```

Or disable via environment:
```bash
WATCH=false docker-compose up -d
```

### Soft Ignore

Create a `.mdumbignore` file in your wiki root to hide files from navigation:

```
# Hide draft files
drafts/
*.draft.md

# Hide specific files
private.md
```

Patterns work like `.gitignore`. Ignored files are still accessible via direct URL.

### Git Integration

Enable git sync to automatically commit and push changes:

```json
{
  "git": {
    "enabled": true,
    "syncInterval": 5,
    "autoCommit": true,
    "autoPush": true,
    "conflictStrategy": "rebase"
  }
}
```

**Conflict strategies:**
- `rebase` - Rebase local changes on top of remote (default)
- `merge` - Merge remote changes into local
- `branch` - Create a conflict branch for manual resolution

Check git status via the health endpoint:

```bash
curl http://localhost:3020/api/health | jq '.git'
```

---

## API Endpoints

### Health Check

```
GET /api/health
```

Response:
```json
{
  "status": "healthy",
  "uptime": 123456,
  "timestamp": "2026-02-05T12:00:00.000Z",
  "contentPath": "/wiki",
  "watcherActive": true,
  "pagesLoaded": 42,
  "git": {
    "enabled": true,
    "branch": "main",
    "lastCommit": "abc1234",
    "upToDate": true
  }
}
```

### Navigation

```
GET /api/navigation
```

Returns hierarchical navigation tree.

### Content

```
GET /api/content/{path}
```

Returns markdown content with rendered HTML.

### Search Index

```
GET /api/search
```

Returns search index for client-side fuzzy matching.

### Events (SSE)

```
GET /api/events
```

Server-Sent Events stream for live reload notifications.

### File Operations

```
POST /api/file      # Create or update file
DELETE /api/file    # Delete file
POST /api/folder    # Create folder
GET /api/file       # Read raw file content
```

---

## Troubleshooting

### Container won't start

Check logs:
```bash
docker-compose logs wiki
```

Verify wiki directory exists and has `index.md`:
```bash
ls -la ./wiki
```

### Permission denied

Ensure the wiki directory is readable and writable:
```bash
chmod -R 755 ./wiki
```

For read-only mode (no editor), add `:ro` to the volume mount: `./wiki:/wiki:ro`

### Port already in use

Change the port mapping:
```yaml
ports:
  - "8080:3020"
```

### Config not loading

Verify config file syntax:
```bash
cat ./config/config.json | jq .
```

Check container sees the file:
```bash
docker exec mdumb-wiki cat /app/config.json
```

### Health check failing

Check if the server is running:
```bash
docker exec mdumb-wiki curl -f http://localhost:3020/api/health
```

---

## Development

### Local Setup

```bash
# Install Bun (if not installed)
curl -fsSL https://bun.sh/install | bash

# Install dependencies
bun install

# Run development server
WIKI_PATH=./wiki bun run dev

# Run tests
bun run test

# Lint code
bun run lint
```

### Project Structure

```
mdumb-wiki/
├── server/              # Backend (Nuxt/Nitro)
│   ├── api/             # API endpoints
│   ├── plugins/         # Server plugins
│   └── utils/           # Server utilities
├── app/                 # Frontend (Vue 3)
│   ├── pages/           # Vue pages
│   ├── components/      # Vue components
│   └── composables/     # Vue composables
├── types/               # TypeScript types
├── tests/               # Test files
├── wiki/                # Sample wiki content
├── Dockerfile           # Docker build
└── docker-compose.yml   # Docker orchestration
```

---

## Tech Stack

- **Framework:** Nuxt 4 (Vue 3, TypeScript)
- **Runtime:** Bun
- **Markdown:** markdown-it, Shiki (syntax highlighting)
- **Search:** Fuse.js (fuzzy matching)
- **File Watching:** Chokidar
- **Git:** simple-git
- **Logging:** Pino
- **Testing:** Vitest

---

## License

MIT
