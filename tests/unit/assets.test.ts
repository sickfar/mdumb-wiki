import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { mkdir, rm } from 'fs/promises'
import { join } from 'path'
import {
  resolveAssetPath,
  isValidAssetExtension,
  getAssetMimeType
} from '../../server/utils/assets'

const testWikiPath = join(process.cwd(), 'tests', 'fixtures', 'assets-test')

describe('resolveAssetPath', () => {
  beforeEach(async () => {
    await mkdir(testWikiPath, { recursive: true })
    await mkdir(join(testWikiPath, 'images'), { recursive: true })
    await mkdir(join(testWikiPath, 'docs'), { recursive: true })
  })

  afterEach(async () => {
    await rm(testWikiPath, { recursive: true, force: true })
  })

  test('resolves relative path from current directory', async () => {
    const markdownPath = 'guide.md'
    const assetPath = './images/test.png'

    const resolved = await resolveAssetPath(assetPath, markdownPath, testWikiPath)
    expect(resolved).toBe(join(testWikiPath, 'images', 'test.png'))
  })

  test('resolves parent directory path', async () => {
    const markdownPath = 'docs/api.md'
    const assetPath = '../logo.png'

    const resolved = await resolveAssetPath(assetPath, markdownPath, testWikiPath)
    expect(resolved).toBe(join(testWikiPath, 'logo.png'))
  })

  test('resolves absolute path from wiki root', async () => {
    const markdownPath = 'docs/guide.md'
    const assetPath = '/assets/banner.png'

    const resolved = await resolveAssetPath(assetPath, markdownPath, testWikiPath)
    expect(resolved).toBe(join(testWikiPath, 'assets', 'banner.png'))
  })

  test('throws on path traversal attack', async () => {
    const markdownPath = 'guide.md'
    const assetPath = '../../../etc/passwd'

    await expect(
      resolveAssetPath(assetPath, markdownPath, testWikiPath)
    ).rejects.toThrow('Path traversal detected')
  })

  test('normalizes paths with multiple slashes', async () => {
    const markdownPath = 'guide.md'
    const assetPath = './images//test.png'

    const resolved = await resolveAssetPath(assetPath, markdownPath, testWikiPath)
    expect(resolved).toBe(join(testWikiPath, 'images', 'test.png'))
  })

  test('normalizes paths with backslashes', async () => {
    const markdownPath = 'guide.md'
    const assetPath = '.\\images\\test.png'

    const resolved = await resolveAssetPath(assetPath, markdownPath, testWikiPath)
    expect(resolved).toBe(join(testWikiPath, 'images', 'test.png'))
  })

  test('handles nested markdown path', async () => {
    const markdownPath = 'docs/tutorials/getting-started.md'
    const assetPath = './screenshot.png'

    const resolved = await resolveAssetPath(assetPath, markdownPath, testWikiPath)
    expect(resolved).toBe(join(testWikiPath, 'docs', 'tutorials', 'screenshot.png'))
  })
})

describe('isValidAssetExtension', () => {
  test('allows .png extension', async () => {
    const result = await isValidAssetExtension('image.png')
    expect(result).toBe(true)
  })

  test('allows .jpg extension', async () => {
    const result = await isValidAssetExtension('photo.jpg')
    expect(result).toBe(true)
  })

  test('allows .pdf extension', async () => {
    const result = await isValidAssetExtension('document.pdf')
    expect(result).toBe(true)
  })

  test('allows .zip extension', async () => {
    const result = await isValidAssetExtension('archive.zip')
    expect(result).toBe(true)
  })

  test('rejects .exe extension', async () => {
    const result = await isValidAssetExtension('malware.exe')
    expect(result).toBe(false)
  })

  test('rejects .sh extension', async () => {
    const result = await isValidAssetExtension('script.sh')
    expect(result).toBe(false)
  })

  test('is case-insensitive', async () => {
    const result = await isValidAssetExtension('IMAGE.PNG')
    expect(result).toBe(true)
  })

  test('handles paths with multiple dots', async () => {
    const result = await isValidAssetExtension('my.file.name.jpg')
    expect(result).toBe(true)
  })

  test('allows .svg extension', async () => {
    const result = await isValidAssetExtension('icon.svg')
    expect(result).toBe(true)
  })
})

describe('getAssetMimeType', () => {
  test('returns correct MIME type for .png', () => {
    const mimeType = getAssetMimeType('image.png')
    expect(mimeType).toBe('image/png')
  })

  test('returns correct MIME type for .jpg', () => {
    const mimeType = getAssetMimeType('photo.jpg')
    expect(mimeType).toBe('image/jpeg')
  })

  test('returns correct MIME type for .pdf', () => {
    const mimeType = getAssetMimeType('document.pdf')
    expect(mimeType).toBe('application/pdf')
  })

  test('returns correct MIME type for .svg', () => {
    const mimeType = getAssetMimeType('icon.svg')
    expect(mimeType).toBe('image/svg+xml')
  })

  test('returns default for unknown extension', () => {
    const mimeType = getAssetMimeType('file.unknown')
    expect(mimeType).toBe('application/octet-stream')
  })

  test('is case-insensitive', () => {
    const mimeType = getAssetMimeType('IMAGE.PNG')
    expect(mimeType).toBe('image/png')
  })
})
