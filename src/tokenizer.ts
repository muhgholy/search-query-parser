/**
 * Search Builder - Tokenizer
 * Converts raw search string into tokens
 */

import type { TToken } from './types'

// ** Character constants
const CHAR_QUOTE_DOUBLE = '"'
const CHAR_QUOTE_SINGLE = "'"
const CHAR_NEGATION = '-'
const CHAR_COLON = ':'
const CHAR_ESCAPE = '\\'
const CHAR_SPACE = ' '
const CHAR_LPAREN = '('
const CHAR_RPAREN = ')'

/**
 * Tokenize a search query string into tokens
 * Handles: quoted strings, negation, operators (key:value), parentheses, OR
 */
export const tokenize = (input: string): TToken[] => {
    const tokens: TToken[] = []
    const length = input.length
    let position = 0

    // ** Helper: Skip whitespace
    const skipWhitespace = (): void => {
        while (position < length && input[position] === CHAR_SPACE) {
            position++
        }
    }

    // ** Helper: Read quoted string
    const readQuoted = (quoteChar: string): string => {
        let result = ''
        position++ // Skip opening quote

        while (position < length) {
            const char = input[position]

            if (char === CHAR_ESCAPE && position + 1 < length) {
                // Handle escaped character
                result += input[position + 1]
                position += 2
                continue
            }

            if (char === quoteChar) {
                position++ // Skip closing quote
                break
            }

            result += char
            position++
        }

        return result
    }

    // ** Helper: Read until delimiter
    const readUntilDelimiter = (): string => {
        let result = ''

        while (position < length) {
            const char = input[position]

            // Stop at space, quote, or parentheses
            if (
                char === CHAR_SPACE ||
                char === CHAR_QUOTE_DOUBLE ||
                char === CHAR_QUOTE_SINGLE ||
                char === CHAR_LPAREN ||
                char === CHAR_RPAREN
            ) {
                break
            }

            result += char
            position++
        }

        return result
    }

    // ** Main tokenization loop
    while (position < length) {
        skipWhitespace()

        if (position >= length) break

        const startPos = position
        const char = input[position]

        // ** Parentheses
        if (char === CHAR_LPAREN) {
            tokens.push({
                type: 'LPAREN',
                value: '(',
                raw: '(',
                position: startPos
            })
            position++
            continue
        }

        if (char === CHAR_RPAREN) {
            tokens.push({
                type: 'RPAREN',
                value: ')',
                raw: ')',
                position: startPos
            })
            position++
            continue
        }

        // ** Negation prefix
        if (char === CHAR_NEGATION && position + 1 < length) {
            const nextChar = input[position + 1]

            // Check if next char is space, if so, treat '-' as text
            if (nextChar === CHAR_SPACE) {
                // Fall through to text handling
            } else {
                position++ // Skip negation

                // Negated quoted string: -"something"
                if (nextChar === CHAR_QUOTE_DOUBLE || nextChar === CHAR_QUOTE_SINGLE) {
                    const value = readQuoted(nextChar)
                    tokens.push({
                        type: 'NEGATED',
                        value,
                        raw: input.slice(startPos, position),
                        position: startPos
                    })
                    continue
                }

                // Negated group: -(...)
                if (nextChar === CHAR_LPAREN) {
                    // We don't handle negated groups directly in tokenizer as a single token
                    // Instead, we emit a NEGATED token with empty value or special marker?
                    // Actually, for -(...), we might want to treat it as a NEGATED token followed by a GROUP?
                    // Or maybe just emit a special token?
                    // Let's stick to simple tokens. 
                    // If we see -(, it's a negation of the group.
                    // But our current NEGATED token expects a value.
                    // Let's treat -( as a special case in parser, or maybe just emit a NEGATED token with value '('?
                    // No, that's confusing.

                    // Let's try to read until delimiter.
                    // If we have -(term), readUntilDelimiter will stop at (.
                    // Wait, readUntilDelimiter stops at (.

                    // If we have -term, readUntilDelimiter reads 'term'.
                    // If we have -(, readUntilDelimiter reads empty string.

                    // Let's handle it:
                    const value = readUntilDelimiter()
                    if (value) {
                        tokens.push({
                            type: 'NEGATED',
                            value,
                            raw: input.slice(startPos, position),
                            position: startPos
                        })
                    } else if (input[position] === CHAR_LPAREN) {
                        // It was a negation before a parenthesis
                        // We can emit a special NEGATED token that indicates the next thing is negated?
                        // Or maybe we just treat it as text '-' and let parser handle it?
                        // But parser expects NEGATED token.

                        // Let's backtrack. If we see -(, we should probably treat it as a NEGATED token with empty value?
                        // Or maybe we change NEGATED to be a modifier?

                        // For now, let's assume the user won't do -(...) for this iteration, 
                        // or if they do, we handle it as text '-' then '('.
                        // But wait, the user requirement is ("discount" or "promo") -minimum.
                        // -minimum is standard negation.

                        // If the user does -(foo or bar), that's harder.
                        // Let's stick to the requested requirement first.

                        // Revert position for now if we didn't find a value
                        // position--
                        // Actually, if readUntilDelimiter returns empty, it means we hit a delimiter immediately.
                        // If it's (, then we have -(.

                        // Let's just treat - as text if it's not followed by something we can negate immediately?
                        // Or we can emit a TEXT token for '-'.

                        // Let's keep it simple. If readUntilDelimiter returns empty, we assume it's not a negation token we can handle here.
                        // We backtrack and let it be handled as text or symbol.
                        position--
                    }
                    continue
                }

                // Negated term: -something
                const value = readUntilDelimiter()
                if (value) {
                    tokens.push({
                        type: 'NEGATED',
                        value,
                        raw: input.slice(startPos, position),
                        position: startPos
                    })
                }
                continue
            }
        }

        // ** Quoted string
        if (char === CHAR_QUOTE_DOUBLE || char === CHAR_QUOTE_SINGLE) {
            const value = readQuoted(char)
            tokens.push({
                type: 'QUOTED',
                value,
                raw: input.slice(startPos, position),
                position: startPos
            })
            continue
        }

        // ** Regular text (may contain operator)
        const text = readUntilDelimiter()

        if (!text) {
            // If we are here, it means we hit a delimiter that we didn't handle above.
            // It could be a stray character or something.
            // Just advance to avoid infinite loop if we didn't advance.
            if (position === startPos) position++
            continue
        }

        // Check for OR keyword
        if (text.toUpperCase() === 'OR') {
            tokens.push({
                type: 'OR',
                value: 'OR',
                raw: input.slice(startPos, position),
                position: startPos
            })
            continue
        }

        // Check for operator syntax (key:value)
        const colonIndex = text.indexOf(CHAR_COLON)

        if (colonIndex > 0 && colonIndex < text.length - 1) {
            // Has colon with content on both sides = operator
            tokens.push({
                type: 'OPERATOR',
                value: text,
                raw: input.slice(startPos, position),
                position: startPos
            })
        } else if (colonIndex > 0 && colonIndex === text.length - 1) {
            // Colon at end: operator with quoted value following
            // e.g., from:"John Doe"
            const key = text.slice(0, -1)
            skipWhitespace()

            if (position < length) {
                const nextChar = input[position]

                if (nextChar === CHAR_QUOTE_DOUBLE || nextChar === CHAR_QUOTE_SINGLE) {
                    const quotedValue = readQuoted(nextChar)
                    tokens.push({
                        type: 'OPERATOR',
                        value: `${key}:${quotedValue}`,
                        raw: input.slice(startPos, position),
                        position: startPos
                    })
                    continue
                }
            }

            // No quoted value, treat as text
            tokens.push({
                type: 'TEXT',
                value: text,
                raw: input.slice(startPos, position),
                position: startPos
            })
        } else {
            // Plain text
            tokens.push({
                type: 'TEXT',
                value: text,
                raw: input.slice(startPos, position),
                position: startPos
            })
        }
    }

    return tokens
}

/**
 * Check if token is an operator with specific key
 */
export const isOperator = (token: TToken, key: string): boolean => {
    if (token.type !== 'OPERATOR') return false
    const [tokenKey] = token.value.split(':', 2)
    return tokenKey.toLowerCase() === key.toLowerCase()
}

/**
 * Extract operator key and value from token
 */
export const parseOperator = (token: TToken): { key: string; value: string } | null => {
    if (token.type !== 'OPERATOR') return null

    const colonIndex = token.value.indexOf(':')
    if (colonIndex === -1) return null

    return {
        key: token.value.slice(0, colonIndex).toLowerCase(),
        value: token.value.slice(colonIndex + 1)
    }
}
