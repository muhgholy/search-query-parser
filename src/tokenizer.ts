/**
 * Search Query Parser - Tokenizer
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
                    const value = readUntilDelimiter()
                    if (value) {
                        tokens.push({
                            type: 'NEGATED',
                            value,
                            raw: input.slice(startPos, position),
                            position: startPos
                        })
                    } else if (input[position] === CHAR_LPAREN) {
                        position--
                    }
                    continue
                }

                // Negated term: -something
                let value = readUntilDelimiter()

                // Handle -key:"value" or -key:val1,val2
                if (value.endsWith(CHAR_COLON)) {
                    // It's a negated operator prefix
                    // Try to read the value(s)
                    while (true) {
                        if (position < length) {
                            const nc = input[position]
                            if (nc === CHAR_QUOTE_DOUBLE || nc === CHAR_QUOTE_SINGLE) {
                                const startQ = position
                                readQuoted(nc)
                                value += input.slice(startQ, position)
                            } else {
                                // Read text part until comma or delimiter
                                let part = ''
                                while (position < length) {
                                    const c = input[position]
                                    if (c === ',' || c === CHAR_SPACE || c === CHAR_LPAREN || c === CHAR_RPAREN || c === CHAR_QUOTE_DOUBLE || c === CHAR_QUOTE_SINGLE) {
                                        break
                                    }
                                    part += c
                                    position++
                                }
                                value += part
                            }
                        }

                        // Check for comma to continue
                        if (position < length && input[position] === ',') {
                            value += ','
                            position++
                            continue
                        }
                        break
                    }
                }

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

        if (colonIndex > 0) {
            let key = ''
            let fullValue = ''

            if (colonIndex === text.length - 1) {
                key = text.slice(0, -1)
            } else {
                key = text.slice(0, colonIndex)
                fullValue = text.slice(colonIndex + 1)
            }

            // Try to extend value (comma separated or quoted following colon)
            while (true) {
                // If we are at the start (empty value) or just consumed a comma, we expect a value
                // If fullValue is empty (case key:), we definitely look for next
                // If fullValue ends with comma, we look for next

                const needsValue = fullValue.length === 0 || fullValue.endsWith(',')

                if (needsValue && position < length) {
                    const nc = input[position]
                    if (nc === CHAR_QUOTE_DOUBLE || nc === CHAR_QUOTE_SINGLE) {
                        const startQ = position
                        readQuoted(nc)
                        fullValue += input.slice(startQ, position)
                    } else if (fullValue.length === 0) {
                        // If we are at key: and no quote, and we already read text which was just key:
                        // Then we might have text following?
                        // But readUntilDelimiter already consumed text.
                        // So if fullValue is empty, it means text was just "key:".
                        // So we look for value.

                        // Read text part
                        let part = ''
                        while (position < length) {
                            const c = input[position]
                            if (c === ',' || c === CHAR_SPACE || c === CHAR_LPAREN || c === CHAR_RPAREN || c === CHAR_QUOTE_DOUBLE || c === CHAR_QUOTE_SINGLE) {
                                break
                            }
                            part += c
                            position++
                        }
                        fullValue += part
                    } else {
                        // We have some value, but it ended with comma (handled below)
                        // So we read next part
                        let part = ''
                        while (position < length) {
                            const c = input[position]
                            if (c === ',' || c === CHAR_SPACE || c === CHAR_LPAREN || c === CHAR_RPAREN || c === CHAR_QUOTE_DOUBLE || c === CHAR_QUOTE_SINGLE) {
                                break
                            }
                            part += c
                            position++
                        }
                        fullValue += part
                    }
                }

                // Check for comma
                if (position < length && input[position] === ',') {
                    fullValue += ','
                    position++
                    continue
                }

                break
            }

            // If we have a value or it was just key: (which might be treated as text later if invalid)
            // But here we assume it's operator if it has colon.
            // If value is empty, it's key: which is valid operator with empty value?
            // Or maybe text?
            // Original code: if colonIndex === text.length - 1, and no quoted value, treat as text.

            if (fullValue.length > 0 || colonIndex < text.length - 1) {
                tokens.push({
                    type: 'OPERATOR',
                    value: `${key}:${fullValue}`,
                    raw: input.slice(startPos, position),
                    position: startPos
                })
                continue
            } else {
                // key: with no value. Treat as text.
                tokens.push({
                    type: 'TEXT',
                    value: text,
                    raw: input.slice(startPos, position),
                    position: startPos
                })
                continue
            }
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
