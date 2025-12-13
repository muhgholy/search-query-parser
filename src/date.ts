/**
 * Search Query Parser - Date Parser
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
export const parseDate = (value: string): { date?: Date; dateRange?: { start: Date; end: Date } } | null => {
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
    // We try this BEFORE range check because YYYY-MM-DD contains hyphens but is a single date
    const parsed = parseAbsoluteDate(trimmed)
    if (parsed) {
        return { date: parsed }
    }

    // ** Try date range (split by hyphen)
    // We iterate through all hyphens to find a split that results in two valid dates
    if (trimmed.includes('-')) {
        const parts = trimmed.split('-')
        // We need at least 2 parts to have a range
        if (parts.length >= 2) {
            for (let i = 1; i < parts.length; i++) {
                const left = parts.slice(0, i).join('-')
                const right = parts.slice(i).join('-')

                // Skip if either side is empty
                if (!left || !right) continue

                // Check if both sides are valid dates
                // We use a stricter check here to avoid false positives
                const d1 = parseAbsoluteDate(left)
                const d2 = parseAbsoluteDate(right)

                if (d1 && d2) {
                    return { dateRange: { start: d1, end: d2 } }
                }
            }
        }
    }

    return null
}

/**
 * Parse absolute date string
 */
const parseAbsoluteDate = (value: string): Date | null => {
    // Simple check to avoid parsing numbers as dates (e.g. "2023") unless intended
    // But new Date("2023") works.
    // However, "1" works too (1901 or 2001?).
    // Let's rely on Date.parse but maybe filter out simple numbers if needed?
    // For now, standard Date parsing.

    // Handle DD/MM/YYYY format which Date.parse might not handle correctly depending on locale
    // But user example `1/10/2013` is ambiguous (Oct 1st or Jan 10th).
    // Assuming standard JS behavior or ISO.
    // If user wants specific format support, we might need a library or custom parser.
    // For now, let's use new Date().

    const parsed = new Date(value)
    if (!isNaN(parsed.getTime())) {
        return parsed
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
