import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { hasTerms, escapeRegex, summarize } from '../src/index'

describe('index', () => {
    describe('hasTerms', () => {
        it('should return true for non-empty queries', () => {
            expect(hasTerms('hello')).toBe(true)
            expect(hasTerms('"phrase"')).toBe(true)
            expect(hasTerms('from:john')).toBe(true)
        })

        it('should return false for empty queries', () => {
            expect(hasTerms('')).toBe(false)
            expect(hasTerms('   ')).toBe(false)
        })
    })

    describe('escapeRegex', () => {
        it('should escape special regex characters', () => {
            expect(escapeRegex('hello.world')).toBe('hello\\.world')
            expect(escapeRegex('test*')).toBe('test\\*')
            expect(escapeRegex('a+b')).toBe('a\\+b')
            expect(escapeRegex('a?b')).toBe('a\\?b')
            expect(escapeRegex('a^b$c')).toBe('a\\^b\\$c')
            expect(escapeRegex('(test)')).toBe('\\(test\\)')
            expect(escapeRegex('[a-z]')).toBe('\\[a-z\\]')
            expect(escapeRegex('a|b')).toBe('a\\|b')
            expect(escapeRegex('a\\b')).toBe('a\\\\b')
        })

        it('should not modify strings without special characters', () => {
            expect(escapeRegex('hello')).toBe('hello')
            expect(escapeRegex('hello world')).toBe('hello world')
        })
    })

    describe('summarize', () => {
        beforeEach(() => {
            vi.useFakeTimers()
            vi.setSystemTime(new Date('2024-06-15T12:00:00'))
        })

        afterEach(() => {
            vi.useRealTimers()
        })

        it('should summarize text terms', () => {
            const summary = summarize('hello world')
            expect(summary).toContain('Contains: hello, world')
        })

        it('should summarize phrases', () => {
            const summary = summarize('"exact phrase"')
            expect(summary).toContain('Exact: "exact phrase"')
        })

        it('should summarize excluded terms', () => {
            const summary = summarize('-spam -"no thanks"')
            expect(summary).toContain('Excludes: spam, "no thanks"')
        })

        it('should summarize from filter', () => {
            const summary = summarize('from:newsletter')
            expect(summary).toContain('From: newsletter')
        })

        it('should summarize to filter', () => {
            const summary = summarize('to:jane')
            expect(summary).toContain('To: jane')
        })

        it('should summarize subject filter', () => {
            const summary = summarize('subject:meeting')
            expect(summary).toContain('Subject: meeting')
        })

        it('should summarize has filter', () => {
            const summary = summarize('has:attachment')
            expect(summary).toContain('Has: attachment')
        })

        it('should summarize is filter', () => {
            const summary = summarize('is:unread')
            expect(summary).toContain('Is: unread')
        })

        it('should summarize in filter', () => {
            const summary = summarize('in:inbox')
            expect(summary).toContain('In: inbox')
        })

        it('should summarize date filters', () => {
            const summary = summarize('after:-7d')
            expect(summary.some(s => s.startsWith('After:'))).toBe(true)
        })

        it('should summarize complex query', () => {
            const summary = summarize('"Promo" -spam from:newsletter')
            expect(summary.length).toBeGreaterThan(0)
            expect(summary).toContain('Exact: "Promo"')
            expect(summary).toContain('From: newsletter')
            expect(summary).toContain('Excludes: spam')
        })

        it('should return empty array for empty query', () => {
            const summary = summarize('')
            expect(summary).toHaveLength(0)
        })
    })
})
