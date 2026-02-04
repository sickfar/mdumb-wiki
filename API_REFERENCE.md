# MDumb Wiki API Reference

## Editing Backend Endpoints (Phase 2)

### GET /api/file

Retrieve file content with hash for editing.

**Query Parameters:**
- `path` (required) - Relative path to file (e.g., "guides/setup.md")

**Response (Success):**
```json
{
  "exists": true,
  "path": "guides/setup.md",
  "content": "# Setup Guide\n\nContent here...",
  "hash": "a7f8d9e1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9"
}
```

**Response (Not Found):**
```json
{
  "exists": false,
  "path": "guides/nonexistent.md"
}
```

**Errors:**
- `400` - Missing path parameter or invalid path (traversal attempt)
- `500` - Server error reading file

---

### POST /api/file

Create or update a file with optional conflict detection.

**Request Body:**
```json
{
  "path": "guides/setup.md",
  "content": "# Setup Guide\n\nUpdated content...",
  "hash": "a7f8d9e1..." // or null for no conflict check
}
```

**Fields:**
- `path` (required, string) - Relative path to file
- `content` (required, string) - File content
- `hash` (optional, string|null) - Current file hash for conflict detection
  - If `null`: Create/overwrite without checking
  - If string: Only write if current hash matches

**Response (Success):**
```json
{
  "success": true,
  "newHash": "b8e9f0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9"
}
```

**Response (Conflict):**
```json
{
  "success": false,
  "conflict": {
    "conflictDetected": true,
    "currentHash": "c9f0e1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9"
  }
}
```

**Errors:**
- `400` - Missing path/content, invalid JSON, or path traversal
- `500` - Server error writing file

**Notes:**
- Parent directories are created automatically
- Hash uses SHA-256
- Conflict detection prevents overwriting concurrent edits

---

### POST /api/folder

Create a new folder with optional index.md file.

**Request Body:**
```json
{
  "path": "new-section",
  "createIndex": true
}
```

**Fields:**
- `path` (required, string) - Relative path for new folder
- `createIndex` (optional, boolean) - Create index.md with template (default: false)

**Response (Success):**
```json
{
  "success": true,
  "path": "new-section"
}
```

**Response (Already Exists):**
```json
{
  "success": false,
  "path": "new-section",
  "error": "Folder already exists"
}
```

**Errors:**
- `400` - Missing path, invalid JSON, or path traversal
- `500` - Server error creating folder

**Notes:**
- Creates parent directories recursively
- If `createIndex: true`, generates:
  ```markdown
  # folder-name

  This folder was created on YYYY-MM-DD.
  ```

---

### POST /api/file/promote

Convert a file to a folder by moving file.md to folder/index.md.

**Request Body:**
```json
{
  "path": "guide.md"
}
```

**Fields:**
- `path` (required, string) - Path to file to promote (must end in .md)

**Response (Success):**
```json
{
  "success": true,
  "newPath": "guide"
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "File does not exist"
}
```

or

```json
{
  "success": false,
  "error": "Target folder already exists"
}
```

**Errors:**
- `400` - Missing path, invalid JSON, or path traversal
- `500` - Server error during promotion

**Notes:**
- Original file is deleted after successful promotion
- File content is preserved exactly
- Useful for converting single pages into sections

**Example:**
```
Before:  wiki/guide.md
After:   wiki/guide/index.md  (same content)
         wiki/guide.md        (deleted)
```

---

## Existing Endpoints (Phase 1)

### GET /api/health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "uptime": 12345,
  "contentPath": "/path/to/wiki",
  "timestamp": "2026-02-02T18:00:00.000Z"
}
```

---

### GET /api/navigation

Get hierarchical navigation tree.

**Response:**
```json
{
  "navigation": [
    {
      "title": "Home",
      "path": "index",
      "isFolder": false
    },
    {
      "title": "Guides",
      "path": "guides",
      "isFolder": true,
      "children": [
        {
          "title": "Setup",
          "path": "guides/setup",
          "isFolder": false
        }
      ]
    }
  ]
}
```

---

### GET /api/content/:path

Get rendered markdown content.

**Example:** `/api/content/guides/setup`

**Response:**
```json
{
  "html": "<h1>Setup Guide</h1><p>Content...</p>",
  "frontMatter": {
    "title": "Setup Guide",
    "date": "2026-02-02"
  },
  "path": "guides/setup"
}
```

**Notes:**
- Automatically appends `.md` extension
- Falls back to `index.md` for folders
- Sanitizes HTML output (XSS protection)

---

## Security Notes

### Path Validation
All endpoints validate paths using `validatePath()`:
- Blocks absolute paths (starting with `/`)
- Blocks path traversal (`../`, `..\`)
- Ensures paths stay within `contentPath` boundary
- Returns generic error messages (no internal path exposure)

### Conflict Detection
The hash-based conflict detection prevents:
- Lost updates (two users editing same file)
- Race conditions in concurrent writes
- Data corruption from simultaneous saves

**Workflow:**
1. GET /api/file → receive content + hash
2. User edits content
3. POST /api/file with original hash
4. Server checks if hash still matches
5. If match → save; if mismatch → return conflict

### Content Validation
- UTF-8 encoding enforced
- No binary file support (markdown only)
- XSS protection via content sanitization (on render)

---

## Error Response Format

All endpoints use H3's `createError()` for consistent error handling:

```json
{
  "statusCode": 400,
  "statusMessage": "Bad Request",
  "message": "path parameter is required"
}
```

**Common Status Codes:**
- `400` - Bad Request (validation error, invalid path)
- `404` - Not Found (missing endpoint)
- `500` - Internal Server Error (file operation failure)

---

## Testing

All endpoints are thoroughly tested with unit tests:

```bash
# Test individual utilities
bun test tests/unit/file-hash.test.ts
bun test tests/unit/slug.test.ts

# Test API logic
bun test tests/unit/api/file-get.test.ts
bun test tests/unit/api/file-post.test.ts
bun test tests/unit/api/folder-post.test.ts
bun test tests/unit/api/file-promote-post.test.ts

# Test all Phase 2
bun test tests/unit/api/
```

Test coverage: 39 tests, 111 assertions, 0 failures

---

## Development Notes

### File Operations Utilities

Business logic is separated into `server/utils/file-operations.ts`:

```typescript
// Read with hash
readWikiFile(path, contentPath): FileReadResult

// Write with conflict detection
writeWikiFile({ path, content, hash, contentPath }): FileWriteResult

// Create folder
createWikiFolder({ path, createIndex, contentPath }): FolderCreateResult

// Promote file to folder
promoteFileToFolder({ path, contentPath }): FilePromoteResult
```

### Logging

All operations are logged via Pino:

```typescript
logger.info({ path, hash }, 'File retrieved successfully')
logger.warn({ path, error }, 'Failed to create folder')
logger.error({ path, error }, 'Failed to write file')
```

---

## Examples

### Edit Workflow with Conflict Detection

```javascript
// 1. Fetch file for editing
const response = await fetch('/api/file?path=guide.md')
const { content, hash } = await response.json()

// 2. User edits content
const updatedContent = content + '\n\nNew section...'

// 3. Save with conflict detection
const saveResponse = await fetch('/api/file', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    path: 'guide.md',
    content: updatedContent,
    hash // Original hash
  })
})

const result = await saveResponse.json()

if (result.success) {
  console.log('Saved successfully')
} else if (result.conflict) {
  console.error('Conflict detected - file was modified by another user')
  // Handle conflict (show diff, ask user to merge, etc.)
}
```

### Create Section with Pages

```javascript
// Create folder with index
await fetch('/api/folder', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    path: 'tutorials',
    createIndex: true
  })
})

// Add pages
await fetch('/api/file', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    path: 'tutorials/getting-started.md',
    content: '# Getting Started\n\n...',
    hash: null
  })
})
```

### Convert Page to Section

```javascript
// Promote guide.md to guide/index.md
await fetch('/api/file/promote', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    path: 'guide.md'
  })
})

// Now add sub-pages
await fetch('/api/file', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    path: 'guide/advanced.md',
    content: '# Advanced Topics\n\n...',
    hash: null
  })
})
```
