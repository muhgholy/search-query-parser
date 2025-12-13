import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { parseDate, resolveRelativeDate, formatDateValue } from '../src/date'

describe('date', () => {
    describe('parseDate', () => {
        describe('absolute dates', () => {
            it('should parse YYYY-MM-DD format', () => {
                const result = parseDate('2024-01-15')
                expect(result).not.toBeNull()
                expect(result?.date.getFullYear()).toBe(2024)
                expect(result?.date.getMonth()).toBe(0) // January
                expect(result?.date.getDate()).toBe(15)
            })

            it('should parse ISO format', () => {
                const result = parseDate('2024-06-15T10:30:00')
                expect(result).not.toBeNull()
                expect(result?.date.getFullYear()).toBe(2024)
            })

            it('should return null for invalid dates', () => {
                expect(parseDate('not-a-date')).toBeNull()
                expect(parseDate('abc')).toBeNull()
            })
        })

        describe('relative dates', () => {
            beforeEach(() => {
                vi.useFakeTimers()
                vi.setSystemTime(new Date('2024-06-15T12:00:00'))
            })

            afterEach(() => {
                vi.useRealTimers()
            })

            it('should parse -Nd format (days)', () => {
                const result = parseDate('-7d')
                expect(result).not.toBeNull()
                expect(result?.date.toISOString().split('T')[0]).toBe('2024-06-08')
            })

            it('should parse -Nh format (hours)', () => {
                const result = parseDate('-24h')
                expect(result).not.toBeNull()
                expect(result?.date.toISOString()).toContain('2024-06-14')
            })

            it('should parse -Nw format (weeks)', () => {
                const result = parseDate('-2w')
                expect(result).not.toBeNull()
                expect(result?.date.toISOString().split('T')[0]).toBe('2024-06-01')
            })

            it('should parse -Nm format (months)', () => {
                const result = parseDate('-1m')
                expect(result).not.toBeNull()
                expect(result?.date.getMonth()).toBe(4) // May
            })

            it('should parse -Ny format (years)', () => {
                const result = parseDate('-1y')
                expect(result).not.toBeNull()
                expect(result?.date.getFullYear()).toBe(2023)
            })

            it('should be case-insensitive', () => {
                const result = parseDate('-7D')
                expect(result).not.toBeNull()
            })
        })

        describe('natural dates', () => {
            beforeEach(() => {
                vi.useFakeTimers()
                vi.setSystemTime(new Date('2024-06-15T12:00:00'))
            })

            afterEach(() => {
                vi.useRealTimers()
            })

            it('should parse "today"', () => {
                const result = parseDate('today')
                expect(result).not.toBeNull()
                // Compare local date parts instead of ISO string
                expect(result?.date.getFullYear()).toBe(2024)
                expect(result?.date.getMonth()).toBe(5) // June
                expect(result?.date.getDate()).toBe(15)
            })

            it('should parse "yesterday"', () => {
                const result = parseDate('yesterday')
                expect(result).not.toBeNull()
                expect(result?.date.getFullYear()).toBe(2024)
                expect(result?.date.getMonth()).toBe(5)
                expect(result?.date.getDate()).toBe(14)
            })

            it('should parse "tomorrow"', () => {
                const result = parseDate('tomorrow')
                expect(result).not.toBeNull()
                expect(result?.date.getFullYear()).toBe(2024)
                expect(result?.date.getMonth()).toBe(5)
                expect(result?.date.getDate()).toBe(16)
            })

            it('should parse "last week"', () => {
                const result = parseDate('last week')
                expect(result).not.toBeNull()
                expect(result?.date.getFullYear()).toBe(2024)
                expect(result?.date.getMonth()).toBe(5)
                expect(result?.date.getDate()).toBe(8)
            })

            it('should parse "last month"', () => {
                const result = parseDate('last month')
                expect(result).not.toBeNull()
                expect(result?.date.getMonth()).toBe(4) // May
            })

            it('should parse "last year"', () => {
                const result = parseDate('last year')
                expect(result).not.toBeNull()
                expect(result?.date.getFullYear()).toBe(2023)
            })

            it('should be case-insensitive', () => {
                const result = parseDate('YESTERDAY')
                expect(result).not.toBeNull()
            })
        })
    })

    describe('resolveRelativeDate', () => {
        beforeEach(() => {
            vi.useFakeTimers()
            vi.setSystemTime(new Date('2024-06-15T12:00:00'))
        })

        afterEach(() => {
            vi.useRealTimers()
        })

        it('should resolve hours', () => {
            const result = resolveRelativeDate(2, 'h')
            expect(result.getHours()).toBe(10)
        })

        it('should resolve days', () => {
            const result = resolveRelativeDate(5, 'd')
            expect(result.getDate()).toBe(10)
        })

        it('should resolve weeks', () => {
            const result = resolveRelativeDate(1, 'w')
            expect(result.getDate()).toBe(8)
        })

        it('should resolve months', () => {
            const result = resolveRelativeDate(3, 'm')
            expect(result.getMonth()).toBe(2) // March
        })

        it('should resolve years', () => {
            const result = resolveRelativeDate(2, 'y')
            expect(result.getFullYear()).toBe(2022)
        })
    })

    describe('formatDateValue', () => {
        it('should format date as YYYY-MM-DD', () => {
            const date = new Date('2024-06-15T12:00:00')
            expect(formatDateValue(date)).toBe('2024-06-15')
        })
    })
})
