# Integration Tests

This directory contains integration tests for MDumb Wiki that verify complete workflows across multiple system layers.

## Test Files

### 1. edit-workflow.test.ts (9 tests, 51 assertions)

Tests complete file editing workflows from creation to modification:

**Coverage:**
- Create new file workflow (2 tests)
  - Create and retrieve new file with hash
  - Create file with nested path (auto-create parent directories)

- Edit existing file workflow (2 tests)
  - Load, modify, save existing file with hash tracking
  - Handle multiple sequential edits with hash updates

- Hash tracking workflow (3 tests)
  - Generate different hashes for different content
  - Generate same hash for identical content
  - Maintain hash consistency across read operations

- Error handling workflow (2 tests)
  - Handle reading non-existent file
  - Handle writing to deeply nested path

**Key Scenarios:**
- New file creation with automatic directory creation
- Existing file modification with hash validation
- Hash consistency across operations
- Deep nesting support

### 2. conflict-detection.test.ts (10 tests, 36 assertions)

Tests hash-based conflict detection for concurrent editing scenarios:

**Coverage:**
- Hash-based conflict detection (3 tests)
  - Detect conflict when file modified externally
  - Provide current hash in conflict response
  - Allow save when hash matches

- Multiple concurrent edits (2 tests)
  - Handle race condition between two editors
  - Allow Editor B to save after resolving conflict

- Null hash behavior (2 tests)
  - Skip conflict detection when hash is null
  - Allow creating new file with null hash

- Edge cases (3 tests)
  - Detect conflict when skipping version
  - Handle empty content changes
  - Detect conflict even for small changes

**Key Scenarios:**
- External file modifications detected via hash mismatch
- Race conditions between concurrent editors
- Force overwrite with null hash
- Conflict resolution workflow

### 3. promote-workflow.test.ts (11 tests, 44 assertions)

Tests file promotion to folder (file.md → folder/index.md):

**Coverage:**
- Basic promotion workflow (3 tests)
  - Promote file to folder with index.md
  - Preserve exact content including whitespace
  - Work with nested paths

- Reading promoted files (2 tests)
  - Read promoted file via index.md path
  - Verify old path no longer exists

- Error handling (3 tests)
  - Fail when file does not exist
  - Fail when target folder already exists
  - Fail when trying to promote non-.md file

- Complex workflow scenarios (3 tests)
  - Promote followed by creating child pages
  - Handle promoting deeply nested files
  - Maintain file integrity through promote and edit cycle

**Key Scenarios:**
- Convert file to folder structure
- Content preservation during promotion
- Error handling for edge cases
- Support for deeply nested structures

## Running Tests

```bash
# Run all integration tests
bun test tests/integration/

# Run individual test file
bun test tests/integration/edit-workflow.test.ts
bun test tests/integration/conflict-detection.test.ts
bun test tests/integration/promote-workflow.test.ts

# Watch mode
bun test tests/integration/ --watch

# With coverage
bun test tests/integration/ --coverage
```

## Test Statistics

- **Total Tests:** 30
- **Total Assertions:** 131
- **Success Rate:** 100%
- **Execution Time:** ~22ms

## Test Architecture

### Approach
These tests use **direct function calls** rather than HTTP requests, testing the file-operations layer directly:

- **No HTTP server:** Tests call `readWikiFile()`, `writeWikiFile()`, etc. directly
- **Isolated file system:** Each test uses `/tmp/claude/mdumb-wiki-integration-*` directories
- **Clean state:** `beforeEach` creates fresh directory, `afterEach` removes it
- **Real file operations:** Tests verify actual disk state with `existsSync()` and `readFileSync()`

### Test Structure

```typescript
describe('Workflow Name', () => {
  beforeEach(() => {
    // Clean slate: remove and recreate test directory
    rmSync(TEST_DIR, { recursive: true, force: true })
    mkdirSync(TEST_DIR, { recursive: true })
  })

  afterEach(() => {
    // Clean up
    rmSync(TEST_DIR, { recursive: true, force: true })
  })

  it('should complete workflow', () => {
    // 1. Setup initial state
    // 2. Perform operation
    // 3. Verify API response
    // 4. Verify file system state
    // 5. Verify content correctness
  })
})
```

### What's NOT Tested Here

These integration tests focus on the file-operations layer. The following are tested elsewhere:

- **API endpoints:** Tested separately (would require H3 event mocking)
- **Composables:** Not yet implemented (Phase 3)
- **Browser UI:** E2E tests (not integration tests)
- **SSE/Live reload:** Requires running server

## Test Data Isolation

Each test file uses a separate temporary directory:

- `edit-workflow.test.ts` → `/tmp/claude/mdumb-wiki-integration-edit`
- `conflict-detection.test.ts` → `/tmp/claude/mdumb-wiki-integration-conflict`
- `promote-workflow.test.ts` → `/tmp/claude/mdumb-wiki-integration-promote`

This prevents cross-contamination and allows parallel execution.

## Key Workflows Verified

### Complete Edit Workflow
1. Create new file with POST /api/file (via writeWikiFile)
2. Load file content and hash
3. Modify content locally
4. Save with hash validation
5. Verify persistence on disk
6. Verify hash updates

### Conflict Detection Workflow
1. User A loads file (gets hash H1)
2. User B modifies file externally (creates hash H2)
3. User A attempts save with H1
4. System detects conflict (current hash = H2)
5. User A reloads, gets H2
6. User A saves with H2 successfully

### Promote Workflow
1. Create file.md with content
2. Promote to folder/index.md
3. Verify folder created
4. Verify index.md exists with same content
5. Verify file.md deleted
6. Continue editing at new path

## Verification Strategy

Each test verifies at multiple levels:

1. **API Response:** Success/failure, error messages, data structure
2. **File System:** Files exist/don't exist at expected paths
3. **Content Integrity:** Exact content matches expected (byte-for-byte)
4. **Hash Consistency:** Hashes match across operations
5. **Side Effects:** Parent directories created, old files removed

## Future Enhancements

Potential additions for future phases:

- **Composable integration:** Test useEditor, useFileManagement with mocked $fetch
- **Navigation updates:** Verify navigation tree updates after file operations
- **Search index:** Test search index updates after content changes
- **Git sync:** Test git commit triggers after save operations
- **SSE notifications:** Test live reload events triggered by file changes

## Notes

- Tests use synchronous file operations for simplicity
- Each test is completely isolated (no shared state)
- Tests verify both happy paths and error conditions
- All tests clean up after themselves (no disk pollution)
- Tests run in Node environment (not browser)
