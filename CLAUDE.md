# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MDumb Wiki is a file-based markdown wiki built with Nuxt 4 and Bun. The filesystem serves as the database - markdown files are organized in folders and rendered with syntax highlighting, front-matter support, and hierarchical navigation.

**Runtime:** Bun (not npm/node) - use `bun` for all package management and script execution.

## Essential Commands

```bash
# Development
bun install                    # Install dependencies
WIKI_PATH=./wiki bun run dev   # Start dev server on :3000
bun run build                  # Production build
bun run preview                # Preview production build

# Testing
bun run test                   # Run all tests (unit tests only)
bun run test:ui                # Run tests with UI
bun run test:watch             # Watch mode
bun test tests/unit/config.test.ts  # Run single test file

# Linting
bun run lint                   # Lint codebase

# Docker
docker-compose build           # Build Bun-based image
docker-compose up -d           # Run in container
docker-compose logs -f         # View logs
```

## Architecture

### Configuration System (Priority: ENV > JSON > Defaults)

**File:** `server/utils/config.ts`

The config system implements a three-tier priority:
1. Environment variables (highest priority)
2. JSON config file at `~/.config/sickfar-wiki/config.json` or `WIKI_CONFIG_PATH`
3. Hard-coded defaults in `DEFAULT_CONFIG`

**Deep merge strategy:** Nested objects are recursively merged, not replaced. This allows partial config files.

**Caching:** Config is loaded once and cached in memory. Use `clearConfigCache()` for testing.

**Key ENV variables:**
- `WIKI_PATH` / `PORT` / `LOG_LEVEL` / `WIKI_CONFIG_PATH`

### Markdown Processing Pipeline

**File:** `server/utils/markdown.ts`

**Singleton pattern:** The markdown parser (`MarkdownIt` + Shiki highlighter) is initialized once asynchronously and reused. Initialization takes ~500ms due to Shiki loading language grammars.

**Flow:**
1. `parseMarkdown(content)` called with raw markdown string
2. Front-matter extracted with `gray-matter` (YAML between `---` delimiters)
3. Markdown body passed to `markdown-it` with Shiki plugin
4. Returns `WikiPage` object with both raw content and rendered HTML

**Supported languages:** 19 languages including TypeScript, Python, Bash, JSON, YAML (see line 43-61 in markdown.ts)

**Theme:** Configurable via `config.syntaxTheme` (default: `github-dark`)

### Navigation Generation

**File:** `server/utils/navigation.ts`

**Recursive filesystem traversal:** Builds a tree of `NavigationItem[]` from the wiki content directory.

**Key behaviors:**
- Folders come before files in sorting
- Hidden files (starting with `.`) are skipped
- Title extracted from YAML front-matter `title:` field, falls back to filename
- `index.md` files represent their parent folder (not shown as separate items in subdirectories)
- Paths stored without `.md` extension for cleaner URLs

**Performance note:** Navigation is built on-demand for each request. No caching yet (planned for v1.1).

### Security: Path Validation

**File:** `server/utils/security.ts`

**Critical function:** `validatePath(requestedPath, wikiPath)` prevents directory traversal attacks.

**Validation steps:**
1. Normalize path (convert `\` to `/`, remove relative segments)
2. Reject absolute paths (starting with `/`)
3. Join with `wikiPath` root
4. Verify resolved path doesn't escape `wikiPath` using `path.relative()`
5. Throw error if traversal detected

**Always call** `validatePath()` before any file read operation. Never use user input directly in `readFileSync()`.

### API Endpoints (Nuxt File-based Routing)

**Location:** `server/api/`

- `health.get.ts` - Health check with uptime, content path
- `navigation.get.ts` - Returns hierarchical navigation tree
- `content/[...path].get.ts` - Serves markdown as HTML (supports `index.md` fallback)

**Endpoint naming:** `.get.ts` suffix means GET-only handler. Use `defineEventHandler()` from Nuxt/H3.

**Path handling in content endpoint:**
- `/api/content/index` → `wiki/index.md`
- `/api/content/guides/installation` → `wiki/guides/installation.md` OR `wiki/guides/installation/index.md`

### Frontend Structure

**Location:** `app/`

**Pages:**
- `pages/index.vue` - Homepage (fetches `/api/content/index`)
- `pages/[...slug].vue` - Dynamic pages (fetches `/api/content/{slug}`)

**Components:**
- `WikiSidebar.vue` - Left navigation (280px fixed width)
- `WikiNavItem.vue` - Recursive component for folders/files
- `WikiContent.vue` - Renders markdown HTML with `.markdown-body` styling

**Data fetching:** Uses Nuxt's `useFetch()` which works on both server (SSR) and client.

### Logging

**File:** `server/utils/logger.ts`

**Pino-based structured logging:** Returns singleton logger instance configured from `config.logLevel`.

**Pretty printing:** Enabled automatically in development (`NODE_ENV !== 'production'`), disabled in production for JSON logs.

**Initialization:** Logger starts in `server/plugins/01.init.ts` (runs on Nitro server startup).

## Testing Strategy (TDD)

All tests in `tests/unit/` use Vitest. The project was built following TDD - tests were written before implementation.

**Test coverage:**
- `config.test.ts` (31 tests) - Config loading, merging, ENV overrides
- `security.test.ts` (10 tests) - Path traversal prevention
- `logger.test.ts` (7 tests) - Logger initialization
- `markdown.test.ts` (26 tests) - Markdown parsing, front-matter, syntax highlighting
- `navigation.test.ts` (12 tests) - File tree generation

**Running single test:**
```bash
bun test tests/unit/config.test.ts
```

**Expected test errors:** Some tests intentionally trigger errors (malformed YAML, invalid JSON) to verify error handling. These appear as logged errors but tests still pass.

## TypeScript Types

**Location:** `types/`

- `config.ts` - `WikiConfig` interface (all configuration fields)
- `wiki.ts` - `WikiPage`, `NavigationItem`, `HealthStatus`, `SearchResult`, `FrontMatter`
- `index.ts` - Re-exports all types

**Import pattern:** Use `import type { ... } from '~/types'` for all type imports.

## Docker Deployment

**Multi-stage Bun-based Dockerfile:**
1. `deps` stage: Install dependencies with frozen lockfile
2. `builder` stage: Run `nuxt build`
3. `runner` stage: Copy `.output/` and run with Bun

**Volume mounts:**
- Wiki content: `./wiki:/wiki:ro` (read-only)
- Optional config: `./config.json:/app/config.json:ro`

**Health check:** `curl -f http://localhost:3020/api/health`

## Important Constraints

1. **@nuxt/ui removed:** Tailwind CSS v4 has compatibility issues with @nuxt/ui. Use custom CSS only.
2. **Bun only:** Never use `npm` or `node` - this project requires Bun runtime.
3. **Wiki path required:** Set `WIKI_PATH=./wiki` when running dev server, or create `~/.config/sickfar-wiki/config.json`.
4. **Path security:** Always use `validatePath()` before file operations. Never trust user input.
5. **Async markdown parser:** `getMarkdownParser()` is async - always await it before use.

## Future Work (v1.1+)

Planned features not yet implemented:
- Live reload with SSE (chokidar file watching)
- Search with Fuse.js
- Git auto-sync
- Dark theme toggle
- Breadcrumb navigation
- Navigation caching
