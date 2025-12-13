/**
 * Search Builder - Date Parser
 * Parses date strings into Date objects
 * Supports: YYYY-MM-DD, relative (-7d, -1w), natural (last week, yesterday)
 */

// ** Relative date regex: -7d, -1w, -2m, -1y, -24h
const RELATIVE_DATE_REGEX = /^-(\d+)([dhwmy])$/i

// ** Natural date mappings
const NATURAL_DATES: Record<string, () => Date> = {
    'today': () => {
        const d = new Date()
        d.setHours(0, 0, 0, 0)
        return d
    },
    'yesterday': () => {
        const d = new Date()
        d.setDate(d.getDate() - 1)
        d.setHours(0, 0, 0, 0)
        return d
    },
    'tomorrow': () => {
        const d = new Date()
        d.setDate(d.getDate() + 1)
        d.setHours(0, 0, 0, 0)
        return d
    },
    'last week': () => {
        const d = new Date()
        d.setDate(d.getDate() - 7)
        d.setHours(0, 0, 0, 0)
        return d
    },
    'last month': () => {
        const d = new Date()
        d.setMonth(d.getMonth() - 1)
        d.setHours(0, 0, 0, 0)
        return d
    },
    'last year': () => {
        const d = new Date()
        d.setFullYear(d.getFullYear() - 1)
        d.setHours(0, 0, 0, 0)
        return d
    },
    'this week': () => {
        const d = new Date()
        const day = d.getDay()
        d.setDate(d.getDate() - day)
        d.setHours(0, 0, 0, 0)
        return d
    },
    'this month': () => {
        const d = new Date()
        d.setDate(1)
        d.setHours(0, 0, 0, 0)
        return d
    },
    'this year': () => {
        const d = new Date()
        d.setMonth(0, 1)
        d.setHours(0, 0, 0, 0)
        return d
    }
}

/**
 * Parse a date string into a Date object
 * Returns null if parsing fails
 */
export const parseDate = (value: string): { date: Date } | null => {
    const trimmed = value.trim().toLowerCase()

    // ** Try relative date (-7d, -1w, etc.)
    const relativeMatch = trimmed.match(RELATIVE_DATE_REGEX)
    if (relativeMatch) {
        const amount = parseInt(relativeMatch[1], 10)
        const unit = relativeMatch[2].toLowerCase() as 'd' | 'h' | 'w' | 'm' | 'y'
        return { date: resolveRelativeDate(amount, unit) }
    }

    // ** Try natural date
    if (NATURAL_DATES[trimmed]) {
        return { date: NATURAL_DATES[trimmed]() }
    }

    // ** Try absolute date (YYYY-MM-DD or other parseable formats)
    const parsed = new Date(value)
    if (!isNaN(parsed.getTime())) {
        return { date: parsed }
    }

    return null
}

/**
 * Resolve relative date to absolute Date
 */
export const resolveRelativeDate = (amount: number, unit: 'd' | 'h' | 'w' | 'm' | 'y'): Date => {
    const now = new Date()

    switch (unit) {
        case 'h':
            now.setHours(now.getHours() - amount)
            break
        case 'd':
            now.setDate(now.getDate() - amount)
            break
        case 'w':
            now.setDate(now.getDate() - (amount * 7))
            break
        case 'm':
            now.setMonth(now.getMonth() - amount)
            break
        case 'y':
            now.setFullYear(now.getFullYear() - amount)
            break
    }

    return now
}

/**
 * Format date for display
 */
export const formatDateValue = (date: Date): string => {
    return date.toISOString().split('T')[0]
}
