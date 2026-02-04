import { describe, it, expect } from 'vitest'
import { slugify } from '../../server/utils/slug'

describe('Slug Utility', () => {
  it('should convert spaces to dashes', () => {
    expect(slugify('My Page Title')).toBe('my-page-title')
    expect(slugify('Hello World')).toBe('hello-world')
    expect(slugify('Multiple   Spaces')).toBe('multiple-spaces')
  })

  it('should remove special characters except dash and underscore', () => {
    expect(slugify('My Page!')).toBe('my-page')
    expect(slugify('Test@#$%^&*()File')).toBe('testfile')
    expect(slugify('Hello, World!')).toBe('hello-world')
    expect(slugify('Question?Answer')).toBe('questionanswer')
    expect(slugify('Keep_Underscore-And-Dash')).toBe('keep_underscore-and-dash')
  })

  it('should handle unicode and special characters', () => {
    expect(slugify('Café & Restaurant')).toBe('caf-restaurant')
    expect(slugify('über alles')).toBe('ber-alles')
    expect(slugify('你好世界')).toBe('')
  })

  it('should handle already slugified strings', () => {
    expect(slugify('already-slugified')).toBe('already-slugified')
    expect(slugify('test_file')).toBe('test_file')
    expect(slugify('my-page-123')).toBe('my-page-123')
  })

  it('should handle empty string and edge cases', () => {
    expect(slugify('')).toBe('')
    expect(slugify('   ')).toBe('')
    expect(slugify('---')).toBe('')
    expect(slugify('___')).toBe('___')
    expect(slugify('123')).toBe('123')
  })

  it('should trim leading and trailing dashes', () => {
    expect(slugify('-Leading Dash')).toBe('leading-dash')
    expect(slugify('Trailing Dash-')).toBe('trailing-dash')
    expect(slugify('-Both-')).toBe('both')
    expect(slugify('--Multiple--Dashes--')).toBe('multiple-dashes')
  })

  it('should collapse multiple dashes into one', () => {
    expect(slugify('Multiple---Dashes')).toBe('multiple-dashes')
    expect(slugify('Many     Spaces')).toBe('many-spaces')
    expect(slugify('Mixed- - -Separators')).toBe('mixed-separators')
  })
})
