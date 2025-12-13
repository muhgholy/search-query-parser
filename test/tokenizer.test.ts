import { describe, it, expect } from 'vitest'
import { tokenize, isOperator, parseOperator } from '../src/tokenizer'

describe('tokenizer', () => {
    describe('tokenize', () => {
        it('should tokenize plain text', () => {
            const tokens = tokenize('hello world')
            expect(tokens).toHaveLength(2)
            expect(tokens[0]).toEqual({
                type: 'TEXT',
                value: 'hello',
                raw: 'hello',
                position: 0
            })
            expect(tokens[1]).toEqual({
                type: 'TEXT',
                value: 'world',
                raw: 'world',
                position: 6
            })
        })

        it('should tokenize quoted strings', () => {
            const tokens = tokenize('"hello world"')
            expect(tokens).toHaveLength(1)
            expect(tokens[0]).toEqual({
                type: 'QUOTED',
                value: 'hello world',
                raw: '"hello world"',
                position: 0
            })
        })

        it('should tokenize single-quoted strings', () => {
            const tokens = tokenize("'hello world'")
            expect(tokens).toHaveLength(1)
            expect(tokens[0].type).toBe('QUOTED')
            expect(tokens[0].value).toBe('hello world')
        })

        it('should tokenize negated terms', () => {
            const tokens = tokenize('-spam')
            expect(tokens).toHaveLength(1)
            expect(tokens[0]).toEqual({
                type: 'NEGATED',
                value: 'spam',
                raw: '-spam',
                position: 0
            })
        })

        it('should tokenize negated quoted strings', () => {
            const tokens = tokenize('-"hello world"')
            expect(tokens).toHaveLength(1)
            expect(tokens[0].type).toBe('NEGATED')
            expect(tokens[0].value).toBe('hello world')
        })

        it('should tokenize operators', () => {
            const tokens = tokenize('from:john')
            expect(tokens).toHaveLength(1)
            expect(tokens[0]).toEqual({
                type: 'OPERATOR',
                value: 'from:john',
                raw: 'from:john',
                position: 0
            })
        })

        it('should tokenize operators with quoted values', () => {
            const tokens = tokenize('from:"John Doe"')
            expect(tokens).toHaveLength(1)
            expect(tokens[0].type).toBe('OPERATOR')
            expect(tokens[0].value).toBe('from:John Doe')
        })

        it('should handle mixed tokens', () => {
            const tokens = tokenize('hello from:john "exact phrase" -spam')
            expect(tokens).toHaveLength(4)
            expect(tokens[0].type).toBe('TEXT')
            expect(tokens[1].type).toBe('OPERATOR')
            expect(tokens[2].type).toBe('QUOTED')
            expect(tokens[3].type).toBe('NEGATED')
        })

        it('should handle escaped characters in quotes', () => {
            const tokens = tokenize('"hello \\"world\\""')
            expect(tokens[0].value).toBe('hello "world"')
        })

        it('should handle empty input', () => {
            const tokens = tokenize('')
            expect(tokens).toHaveLength(0)
        })

        it('should handle whitespace only', () => {
            const tokens = tokenize('   ')
            expect(tokens).toHaveLength(0)
        })

        it('should handle multiple spaces between tokens', () => {
            const tokens = tokenize('hello    world')
            expect(tokens).toHaveLength(2)
        })

        it('should tokenize parentheses', () => {
            const tokens = tokenize('(hello)')
            expect(tokens).toHaveLength(3)
            expect(tokens[0].type).toBe('LPAREN')
            expect(tokens[1].type).toBe('TEXT')
            expect(tokens[2].type).toBe('RPAREN')
        })

        it('should tokenize OR operator', () => {
            const tokens = tokenize('hello OR world')
            expect(tokens).toHaveLength(3)
            expect(tokens[1].type).toBe('OR')
        })

        it('should tokenize mixed parentheses and OR', () => {
            const tokens = tokenize('(hello OR world)')
            expect(tokens).toHaveLength(5)
            expect(tokens[0].type).toBe('LPAREN')
            expect(tokens[2].type).toBe('OR')
            expect(tokens[4].type).toBe('RPAREN')
        })
    })

    describe('isOperator', () => {
        it('should return true for matching operator', () => {
            const token = { type: 'OPERATOR' as const, value: 'from:john', raw: 'from:john', position: 0 }
            expect(isOperator(token, 'from')).toBe(true)
        })

        it('should return false for non-matching operator', () => {
            const token = { type: 'OPERATOR' as const, value: 'from:john', raw: 'from:john', position: 0 }
            expect(isOperator(token, 'to')).toBe(false)
        })

        it('should return false for non-operator tokens', () => {
            const token = { type: 'TEXT' as const, value: 'hello', raw: 'hello', position: 0 }
            expect(isOperator(token, 'from')).toBe(false)
        })

        it('should be case-insensitive', () => {
            const token = { type: 'OPERATOR' as const, value: 'FROM:john', raw: 'FROM:john', position: 0 }
            expect(isOperator(token, 'from')).toBe(true)
        })
    })

    describe('parseOperator', () => {
        it('should parse operator key and value', () => {
            const token = { type: 'OPERATOR' as const, value: 'from:john', raw: 'from:john', position: 0 }
            const result = parseOperator(token)
            expect(result).toEqual({ key: 'from', value: 'john' })
        })

        it('should handle values with colons', () => {
            const token = { type: 'OPERATOR' as const, value: 'url:http://example.com', raw: 'url:http://example.com', position: 0 }
            const result = parseOperator(token)
            expect(result).toEqual({ key: 'url', value: 'http://example.com' })
        })

        it('should return null for non-operator tokens', () => {
            const token = { type: 'TEXT' as const, value: 'hello', raw: 'hello', position: 0 }
            expect(parseOperator(token)).toBeNull()
        })

        it('should lowercase the key', () => {
            const token = { type: 'OPERATOR' as const, value: 'FROM:John', raw: 'FROM:John', position: 0 }
            const result = parseOperator(token)
            expect(result?.key).toBe('from')
            expect(result?.value).toBe('John')
        })
    })
})
