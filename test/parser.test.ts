import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { parse, extractOperators, validate } from '../src/parser'

describe('parser', () => {
    describe('parse', () => {
        describe('text terms', () => {
            it('should parse plain text', () => {
                const result = parse('hello world')
                expect(result).toHaveLength(2)
                expect(result[0]).toEqual({ type: 'text', value: 'hello', negated: false })
                expect(result[1]).toEqual({ type: 'text', value: 'world', negated: false })
            })

            it('should parse quoted phrases', () => {
                const result = parse('"hello world"')
                expect(result).toHaveLength(1)
                expect(result[0]).toEqual({ type: 'phrase', value: 'hello world', negated: false })
            })

            it('should parse negated text', () => {
                const result = parse('-spam')
                expect(result).toHaveLength(1)
                expect(result[0]).toEqual({ type: 'text', value: 'spam', negated: true })
            })

            it('should parse negated phrases', () => {
                const result = parse('-"no thanks"')
                expect(result).toHaveLength(1)
                expect(result[0]).toEqual({ type: 'phrase', value: 'no thanks', negated: true })
            })
        })

        describe('operators', () => {
            it('should parse from operator', () => {
                const result = parse('from:john')
                expect(result).toHaveLength(1)
                expect(result[0]).toEqual({ type: 'from', value: 'john', negated: false })
            })

            it('should parse to operator', () => {
                const result = parse('to:jane')
                expect(result).toHaveLength(1)
                expect(result[0]).toEqual({ type: 'to', value: 'jane', negated: false })
            })

            it('should parse subject operator', () => {
                const result = parse('subject:meeting')
                expect(result).toHaveLength(1)
                expect(result[0]).toEqual({ type: 'subject', value: 'meeting', negated: false })
            })

            it('should parse has operator', () => {
                const result = parse('has:attachment')
                expect(result).toHaveLength(1)
                expect(result[0]).toEqual({ type: 'has', value: 'attachment', negated: false })
            })

            it('should parse is operator', () => {
                const result = parse('is:unread')
                expect(result).toHaveLength(1)
                expect(result[0]).toEqual({ type: 'is', value: 'unread', negated: false })
            })

            it('should parse in operator', () => {
                const result = parse('in:inbox')
                expect(result).toHaveLength(1)
                expect(result[0]).toEqual({ type: 'in', value: 'inbox', negated: false })
            })

            it('should parse label operator', () => {
                const result = parse('label:important')
                expect(result).toHaveLength(1)
                expect(result[0]).toEqual({ type: 'label', value: 'important', negated: false })
            })

            it('should parse header-k operator', () => {
                const result = parse('header-k:X-Custom')
                expect(result).toHaveLength(1)
                expect(result[0]).toEqual({ type: 'header-key', value: 'X-Custom', negated: false })
            })

            it('should parse header-v operator', () => {
                const result = parse('header-v:custom-value')
                expect(result).toHaveLength(1)
                expect(result[0]).toEqual({ type: 'header-value', value: 'custom-value', negated: false })
            })

            it('should parse negated operators', () => {
                const result = parse('-from:spam@example.com')
                expect(result).toHaveLength(1)
                expect(result[0]).toEqual({ type: 'from', value: 'spam@example.com', negated: true })
            })

            it('should handle operator aliases', () => {
                const result = parse('f:john')
                expect(result[0].type).toBe('from')

                const result2 = parse('sender:john')
                expect(result2[0].type).toBe('from')
            })

            it('should treat unknown operators as text', () => {
                const result = parse('unknown:value')
                expect(result[0].type).toBe('text')
                expect(result[0].value).toBe('unknown:value')
            })
        })

        describe('date operators', () => {
            beforeEach(() => {
                vi.useFakeTimers()
                vi.setSystemTime(new Date('2024-06-15T12:00:00'))
            })

            afterEach(() => {
                vi.useRealTimers()
            })

            it('should parse after with absolute date', () => {
                const result = parse('after:2024-01-01')
                expect(result).toHaveLength(1)
                expect(result[0].type).toBe('after')
                expect(result[0].value).toBe('2024-01-01')
                expect(result[0].date).toBeDefined()
                expect(result[0].date?.getFullYear()).toBe(2024)
            })

            it('should parse before with absolute date', () => {
                const result = parse('before:2024-12-31')
                expect(result).toHaveLength(1)
                expect(result[0].type).toBe('before')
                expect(result[0].date).toBeDefined()
            })

            it('should parse after with relative date', () => {
                const result = parse('after:-7d')
                expect(result).toHaveLength(1)
                expect(result[0].type).toBe('after')
                expect(result[0].date).toBeDefined()
                expect(result[0].date?.toISOString().split('T')[0]).toBe('2024-06-08')
            })

            it('should parse before with relative date', () => {
                const result = parse('before:-1m')
                expect(result).toHaveLength(1)
                expect(result[0].type).toBe('before')
                expect(result[0].date?.getMonth()).toBe(4) // May
            })

            it('should handle older alias for before', () => {
                const result = parse('older:-7d')
                expect(result[0].type).toBe('before')
            })

            it('should handle newer alias for after', () => {
                const result = parse('newer:-7d')
                expect(result[0].type).toBe('after')
            })
        })

        describe('size operator', () => {
            it('should parse size with greater than', () => {
                const result = parse('size:>1mb')
                expect(result).toHaveLength(1)
                expect(result[0].type).toBe('size')
                expect(result[0].size).toEqual({ op: 'gt', bytes: 1048576 })
            })

            it('should parse size with less than', () => {
                const result = parse('size:<100kb')
                expect(result).toHaveLength(1)
                expect(result[0].size).toEqual({ op: 'lt', bytes: 102400 })
            })

            it('should parse size with equals', () => {
                const result = parse('size:500')
                expect(result).toHaveLength(1)
                expect(result[0].size).toEqual({ op: 'eq', bytes: 500 })
            })

            it('should handle different units', () => {
                expect(parse('size:>1gb')[0].size?.bytes).toBe(1073741824)
                expect(parse('size:>1mb')[0].size?.bytes).toBe(1048576)
                expect(parse('size:>1kb')[0].size?.bytes).toBe(1024)
            })
        })

        describe('complex queries', () => {
            beforeEach(() => {
                vi.useFakeTimers()
                vi.setSystemTime(new Date('2024-06-15T12:00:00'))
            })

            afterEach(() => {
                vi.useRealTimers()
            })

            it('should parse complex query', () => {
                const result = parse('"Promo Code" -spam from:newsletter after:-7d has:attachment')
                expect(result).toHaveLength(5)

                expect(result[0]).toEqual({ type: 'phrase', value: 'Promo Code', negated: false })
                expect(result[1]).toEqual({ type: 'text', value: 'spam', negated: true })
                expect(result[2]).toEqual({ type: 'from', value: 'newsletter', negated: false })
                expect(result[3].type).toBe('after')
                expect(result[3].date).toBeDefined()
                expect(result[4]).toEqual({ type: 'has', value: 'attachment', negated: false })
            })

            it('should handle empty input', () => {
                const result = parse('')
                expect(result).toHaveLength(0)
            })

            it('should handle whitespace only', () => {
                const result = parse('   ')
                expect(result).toHaveLength(0)
            })
        })

        describe('grouping and OR logic', () => {
            it('should parse parenthesized groups', () => {
                const result = parse('(hello world)')
                expect(result).toHaveLength(1)
                expect(result[0].type).toBe('group')
                expect(result[0].terms).toHaveLength(2)
                expect(result[0].terms?.[0].value).toBe('hello')
                expect(result[0].terms?.[1].value).toBe('world')
            })

            it('should parse OR operator', () => {
                const result = parse('hello OR world')
                expect(result).toHaveLength(1)
                expect(result[0].type).toBe('or')
                expect(result[0].terms).toHaveLength(2)
                expect(result[0].terms?.[0].value).toBe('hello')
                expect(result[0].terms?.[1].value).toBe('world')
            })

            it('should parse OR with groups', () => {
                const result = parse('(hello OR world)')
                expect(result).toHaveLength(1)
                expect(result[0].type).toBe('group')
                expect(result[0].terms).toHaveLength(1)
                expect(result[0].terms?.[0].type).toBe('or')
            })

            it('should parse complex OR logic: ("discount" or "promo") -minimum', () => {
                const result = parse('("discount" or "promo") -minimum')
                expect(result).toHaveLength(2)

                // First term: group containing OR
                const group = result[0]
                expect(group.type).toBe('group')
                expect(group.terms).toHaveLength(1)

                const orTerm = group.terms?.[0]
                expect(orTerm?.type).toBe('or')
                expect(orTerm?.terms).toHaveLength(2)
                expect(orTerm?.terms?.[0].type).toBe('phrase')
                expect(orTerm?.terms?.[0].value).toBe('discount')
                expect(orTerm?.terms?.[1].type).toBe('phrase')
                expect(orTerm?.terms?.[1].value).toBe('promo')

                // Second term: negated text
                const negated = result[1]
                expect(negated.type).toBe('text')
                expect(negated.value).toBe('minimum')
                expect(negated.negated).toBe(true)
            })

            it('should parse nested groups', () => {
                const result = parse('((a OR b) c)')
                expect(result).toHaveLength(1)
                const outerGroup = result[0]
                expect(outerGroup.type).toBe('group')

                const innerTerms = outerGroup.terms
                expect(innerTerms).toHaveLength(2)

                const innerGroup = innerTerms?.[0]
                expect(innerGroup?.type).toBe('group')
                expect(innerGroup?.terms?.[0].type).toBe('or')

                const cTerm = innerTerms?.[1]
                expect(cTerm?.value).toBe('c')
            })
        })

        describe('operator validation', () => {
            it('should allow allowed operators', () => {
                const result = parse('from:john', { operatorsAllowed: ['from'] })
                expect(result).toHaveLength(1)
                expect(result[0].type).toBe('from')
            })

            it('should throw error for disallowed operators (via operatorsAllowed)', () => {
                expect(() => {
                    parse('to:jane', { operatorsAllowed: ['from'] })
                }).toThrow("Operator 'to' is not allowed")
            })

            it('should throw error for disallowed operators (via operatorsDisallowed)', () => {
                expect(() => {
                    parse('from:john', { operatorsDisallowed: ['from'] })
                }).toThrow("Operator 'from' is not allowed")
            })

            it('should allow operators not in operatorsDisallowed', () => {
                const result = parse('to:jane', { operatorsDisallowed: ['from'] })
                expect(result).toHaveLength(1)
                expect(result[0].type).toBe('to')
            })

            it('should validate negated operators', () => {
                expect(() => {
                    parse('-from:john', { operatorsDisallowed: ['from'] })
                }).toThrow("Operator 'from' is not allowed")
            })
        })

        describe('new features', () => {
            it('should parse date range', () => {
                const result = parse('date:2023-01-01-2023-12-31')
                expect(result).toHaveLength(1)
                expect(result[0]).toMatchObject({
                    type: 'date',
                    dateRange: {
                        start: expect.any(Date),
                        end: expect.any(Date)
                    }
                })
            })

            it('should parse list of values', () => {
                const result = parse('to:"String 1",String2')
                expect(result).toHaveLength(1)
                expect(result[0]).toMatchObject({
                    type: 'or',
                    terms: [
                        { type: 'to', value: 'String 1' },
                        { type: 'to', value: 'String2' }
                    ]
                })
            })

            it('should parse negated operator with quotes', () => {
                const result = parse('-from:"some@example.com"')
                expect(result).toHaveLength(1)
                expect(result[0]).toMatchObject({
                    type: 'from',
                    value: 'some@example.com',
                    negated: true
                })
            })
        })

        describe('custom operators', () => {
            it('should support custom operators', () => {
                const customOps = [
                    { name: 'priority', aliases: ['p'], type: 'priority', valueType: 'string', allowNegation: true }
                ]

                // @ts-expect-error - custom type
                const result = parse('priority:high', { operators: customOps })
                expect(result).toHaveLength(1)
                expect(result[0]).toMatchObject({
                    type: 'priority',
                    value: 'high',
                    negated: false
                })
            })

            it('should override default operators', () => {
                const result = parse('from:me', {
                    operators: [
                        { name: 'from', aliases: [], type: 'custom-from', valueType: 'string', allowNegation: true }
                    ]
                })

                expect(result).toHaveLength(1)
                expect(result[0]).toMatchObject({
                    type: 'custom-from',
                    value: 'me'
                })
            })

            it('should work with aliases', () => {
                const customOps = [
                    { name: 'priority', aliases: ['p'], type: 'priority', valueType: 'string', allowNegation: true }
                ]

                // @ts-expect-error - custom type
                const result = parse('p:high', { operators: customOps })
                expect(result).toHaveLength(1)
                expect(result[0]).toMatchObject({
                    type: 'priority',
                    value: 'high'
                })
            })
        })
    })

    describe('extractOperators', () => {
        it('should extract operator keys', () => {
            const operators = extractOperators('from:john to:jane subject:meeting hello')
            expect(operators).toContain('from')
            expect(operators).toContain('to')
            expect(operators).toContain('subject')
            expect(operators).toHaveLength(3)
        })

        it('should return empty array for no operators', () => {
            const operators = extractOperators('hello world')
            expect(operators).toHaveLength(0)
        })

        it('should return unique operators', () => {
            const operators = extractOperators('from:john from:jane')
            expect(operators).toEqual(['from'])
        })
    })

    describe('validate', () => {
        it('should return valid for correct queries', () => {
            expect(validate('hello world').valid).toBe(true)
            expect(validate('"quoted phrase"').valid).toBe(true)
            expect(validate('from:john -spam').valid).toBe(true)
        })

        it('should return invalid for unmatched quotes', () => {
            const result = validate('"unclosed quote')
            expect(result.valid).toBe(false)
            expect(result.errors).toContain('Unmatched quote: "')
        })

        it('should return invalid for unmatched single quotes', () => {
            const result = validate("'unclosed quote")
            expect(result.valid).toBe(false)
            expect(result.errors).toContain("Unmatched quote: '")
        })

        it('should handle empty input', () => {
            expect(validate('').valid).toBe(true)
        })
    })
})
