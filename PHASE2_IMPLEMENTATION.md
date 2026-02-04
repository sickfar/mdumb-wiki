# Phase 2 Implementation: Editing Backend API Endpoints

## Summary

Successfully implemented Phase 2 of MDumb Wiki - the complete editing backend with TDD approach. All 39 new tests pass.

## Files Created

### Utilities

1. **server/utils/file-hash.ts**
   - `computeContentHash(content: string): string` - SHA-256 hash from string
   - `computeFileHash(filePath: string): Promise<string>` - SHA-256 hash from file
   - Used for conflict detection in file editing

2. **server/utils/slug.ts**
   - `slugify(text: string): string` - Convert text to URL-safe slug
   - Lowercase, spaces to dashes, removes special chars
   - Example: "My Page!" → "my-page"

3. **server/utils/file-operations.ts** (Core business logic)
   - `readWikiFile(path, contentPath): FileReadResult` - Read file with hash
   - `writeWikiFile(request): FileWriteResult` - Write with conflict detection
   - `createWikiFolder(request): FolderCreateResult` - Create folder with optional index.md
   - `promoteFileToFolder(request): FilePromoteResult` - Convert file.md to folder/index.md
   - All functions use `validatePath()` for security

### API Endpoints

1. **server/api/file.get.ts**
   - GET /api/file?path=foo/bar.md
   - Returns: `{ exists, path, content, hash }`
   - Uses readWikiFile utility

2. **server/api/file.post.ts**
   - POST /api/file with `{ path, content, hash }`
   - Conflict detection: if hash provided, checks current file hash
   - Returns: `{ success, newHash }` or `{ success: false, conflict: {...} }`
   - Uses writeWikiFile utility

3. **server/api/folder.post.ts**
   - POST /api/folder with `{ path, createIndex }`
   - Creates folder, optionally with index.md template
   - Returns: `{ success, path }` or `{ success: false, error }`
   - Uses createWikiFolder utility

4. **server/api/file/promote.post.ts**
   - POST /api/file/promote with `{ path }`
   - Converts file.md to folder/index.md
   - Deletes original file after promotion
   - Returns: `{ success, newPath }` or `{ success: false, error }`
   - Uses promoteFileToFolder utility

### Tests

All tests follow TDD approach (written before implementation):

1. **tests/unit/file-hash.test.ts** (6 tests)
   - Same content → same hash
   - Different content → different hash
   - File vs content hash match
   - Empty string handling
   - Non-existent file throws

2. **tests/unit/slug.test.ts** (7 tests)
   - Space conversion
   - Special character removal
   - Unicode handling
   - Already slugified
   - Edge cases
   - Trim leading/trailing dashes
   - Collapse multiple dashes

3. **tests/unit/api/file-get.test.ts** (5 tests)
   - Valid file returns content and hash
   - Non-existent file returns exists: false
   - Path traversal rejected
   - Nested file handling
   - Hash computed correctly

4. **tests/unit/api/file-post.test.ts** (8 tests)
   - Create new file
   - Update with matching hash
   - Conflict detection with mismatched hash
   - Path traversal rejected
   - Nested directories auto-created
   - Conflict when file modified
   - Force overwrite without hash
   - Unicode content preservation

5. **tests/unit/api/folder-post.test.ts** (5 tests)
   - Create without index.md
   - Create with index.md (includes template)
   - Already exists error
   - Path traversal rejected
   - Nested folder creation

6. **tests/unit/api/file-promote-post.test.ts** (8 tests)
   - Promote file to folder
   - Content preservation
   - Original file deletion
   - Non-existent file error
   - Folder already exists error
   - Path traversal rejected
   - Index.md conflict detection
   - Nested file promotion

## Test Results

```
 39 pass
 0 fail
 111 expect() calls
Ran 39 tests across 6 files. [25-27ms]
```

## Security Features

### Path Validation
- **EVERY** file operation calls `validatePath()` before execution
- Prevents directory traversal attacks (../, absolute paths)
- Validates paths stay within contentPath boundary
- Tests verify path traversal is blocked

### Error Handling
- Generic error messages (don't expose internal paths)
- Structured logging with pino
- 400 for validation errors, 500 for server errors
- Type-safe error handling (unknown → Error)

### Conflict Detection
- SHA-256 hashes for file content
- Optional hash parameter in write operations
- Returns conflict information without data loss
- Clients can implement 3-way merge or manual resolution

## Architecture Patterns

### Separation of Concerns
- **Utilities** contain pure business logic (testable without H3/Nuxt)
- **API endpoints** handle HTTP layer (validation, logging, error formatting)
- Tests focus on utility functions, not HTTP mocking

### Type Safety
- TypeScript interfaces for all requests/responses
- No `any` types (eslint compliant)
- Explicit error type handling

### TDD Workflow
1. Write tests first (describe expected behavior)
2. Run tests (watch them fail)
3. Implement minimum code to pass
4. Refactor while keeping tests green
5. Verify all tests pass

## Usage Examples

### Read File
```typescript
GET /api/file?path=guides/setup.md

Response:
{
  exists: true,
  path: "guides/setup.md",
  content: "# Setup Guide...",
  hash: "a7f8d9e..."
}
```

### Create New File
```typescript
POST /api/file
{
  path: "new-page.md",
  content: "# New Page",
  hash: null  // null = no conflict check
}

Response:
{
  success: true,
  newHash: "b8e9f0c..."
}
```

### Update with Conflict Detection
```typescript
POST /api/file
{
  path: "existing.md",
  content: "Updated content",
  hash: "a7f8d9e..."  // Must match current
}

Response (success):
{
  success: true,
  newHash: "c9f0e1d..."
}

Response (conflict):
{
  success: false,
  conflict: {
    conflictDetected: true,
    currentHash: "different_hash"
  }
}
```

### Create Folder
```typescript
POST /api/folder
{
  path: "new-section",
  createIndex: true
}

Response:
{
  success: true,
  path: "new-section"
}

// Creates new-section/index.md with:
// # new-section
// This folder was created on 2026-02-02.
```

### Promote File to Folder
```typescript
POST /api/file/promote
{
  path: "guide.md"
}

Response:
{
  success: true,
  newPath: "guide"
}

// Before: guide.md
// After:  guide/index.md (content preserved)
//         guide.md (deleted)
```

## Integration with Existing Code

- Uses existing `validatePath()` from security.ts
- Uses existing `getConfig()` and `getLogger()` utilities
- Follows patterns from existing API endpoints
- Compatible with Nuxt 4 + Bun runtime
- No breaking changes to existing functionality

## Next Steps (Phase 3)

With backend APIs complete, Phase 3 can implement:
- Frontend editor component
- File tree management UI
- Conflict resolution UI
- Real-time preview
- Auto-save with debounce

All backend operations are ready and tested!
