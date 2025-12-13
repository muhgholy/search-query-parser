/**
 * Search Builder
 * A portable, framework-agnostic search query parser
 * 
 * Supports Gmail-like search syntax:
 * - Quoted phrases: "exact match"
 * - Negation: -exclude -"exclude phrase"
 * - Operators: from:john to:jane subject:meeting
 * - Date ranges: after:2024-01-01 before:-7d after:"last week"
 * - Filters: has:attachment is:unread in:inbox
 * - Header search: header-k:X-Custom header-v:"custom value"
 * 
 * @example
 * ```typescript
 * import { parse } from '@muhgholy/string-search-builder'
 * 
 * const terms = parse('"Promo" -Minimum after:-7d from:newsletter')
 * // Returns: TParsedTerm[]
 * 
 * for (const term of terms) {
 *   switch (term.type) {
 *     case 'text':
 *     case 'phrase':
 *       // handle text search
 *       break
 *     case 'from':
 *       // handle from filter
 *       break
 *   }
 * }
 * ```
 */

// ** Types
export type {
    TToken,
    TTokenType,
    TParsedTerm,
    TTermType,
    TParseResult,
    TOperatorDef,
    TParserOptions
} from './types'

// ** Tokenizer
export { tokenize, isOperator, parseOperator } from './tokenizer'

// ** Date utilities
export { parseDate, resolveRelativeDate, formatDateValue } from './date'

// ** Parser
export { parse, extractOperators, validate } from './parser'

// ** Convenience functions
import { parse } from './parser'

/**
 * Quick check if search string has any terms
 */
export const hasTerms = (input: string): boolean => {
    return parse(input).length > 0
}

/**
 * Escape regex special characters
 */
export const escapeRegex = (str: string): string => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Get human-readable summary of search query
 */
export const summarize = (input: string): string[] => {
    const terms = parse(input)
    const summary: string[] = []

    const texts: string[] = []
    const phrases: string[] = []
    const excluded: string[] = []

    for (const term of terms) {
        if (term.negated) {
            excluded.push(term.type === 'phrase' ? `"${term.value}"` : term.value)
            continue
        }

        switch (term.type) {
            case 'text':
                texts.push(term.value)
                break
            case 'phrase':
                phrases.push(term.value)
                break
            case 'from':
                summary.push(`From: ${term.value}`)
                break
            case 'to':
                summary.push(`To: ${term.value}`)
                break
            case 'subject':
                summary.push(`Subject: ${term.value}`)
                break
            case 'has':
                summary.push(`Has: ${term.value}`)
                break
            case 'is':
                summary.push(`Is: ${term.value}`)
                break
            case 'in':
                summary.push(`In: ${term.value}`)
                break
            case 'after':
                summary.push(`After: ${term.date?.toLocaleDateString() || term.value}`)
                break
            case 'before':
                summary.push(`Before: ${term.date?.toLocaleDateString() || term.value}`)
                break
            case 'label':
                summary.push(`Label: ${term.value}`)
                break
            case 'size':
                if (term.size) {
                    const opStr = term.size.op === 'gt' ? '>' : term.size.op === 'lt' ? '<' : '='
                    summary.push(`Size: ${opStr}${term.size.bytes} bytes`)
                }
                break
        }
    }

    if (texts.length > 0) {
        summary.unshift(`Contains: ${texts.join(', ')}`)
    }

    if (phrases.length > 0) {
        summary.unshift(`Exact: "${phrases.join('", "')}"`)
    }

    if (excluded.length > 0) {
        summary.push(`Excludes: ${excluded.join(', ')}`)
    }

    return summary
}
