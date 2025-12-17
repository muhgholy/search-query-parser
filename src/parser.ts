/**
 * Search Query Parser - Parser
 * Converts tokens into array of parsed terms
 */

import type { TToken, TParsedTerm, TParseResult, TTermType, TOperatorDef, TParserOptions, TDefaultTermType } from './types'
import { tokenize, parseOperator } from './tokenizer'
import { parseDate } from './date'

// ** Default operators
const DEFAULT_OPERATORS: TOperatorDef<TDefaultTermType>[] = [
     { name: 'from', aliases: ['f', 'sender'], type: 'string', allowNegation: true },
     { name: 'to', aliases: ['t', 'recipient'], type: 'string', allowNegation: true },
     { name: 'subject', aliases: ['subj', 's'], type: 'string', allowNegation: true },
     { name: 'body', aliases: ['content', 'b'], type: 'string', allowNegation: true },
     { name: 'has', aliases: [], type: 'string', allowNegation: true },
     { name: 'is', aliases: [], type: 'string', allowNegation: true },
     { name: 'in', aliases: ['folder', 'box', 'mailbox'], type: 'string', allowNegation: true },
     { name: 'date', aliases: ['d'], type: 'date', allowNegation: false },
     { name: 'before', aliases: ['b4', 'older', 'older_than'], type: 'date', allowNegation: false },
     { name: 'after', aliases: ['af', 'newer', 'newer_than'], type: 'date', allowNegation: false },
     { name: 'label', aliases: ['tag', 'l'], type: 'string', allowNegation: true },
     { name: 'header-k', aliases: ['hk', 'header-key'], type: 'string', allowNegation: false },
     { name: 'header-v', aliases: ['hv', 'header-value'], type: 'string', allowNegation: false },
     { name: 'size', aliases: ['larger', 'smaller'], type: 'size', allowNegation: false },
]

/**
 * Find operator definition by key
 */
const findOperator = <T extends string>(key: string, operators: TOperatorDef<T>[]): TOperatorDef<T> | null => {
     const lowerKey = key.toLowerCase()
     for (const op of operators) {
          if (op.name === lowerKey || op.aliases.includes(lowerKey)) {
               return op
          }
     }
     return null
}

/**
 * Parse size string (e.g., ">10mb", "<1kb", "500")
 */
const parseSize = (value: string): { op: 'gt' | 'lt' | 'eq'; bytes: number } | null => {
     const match = value.match(/^([<>=]?)(\d+)([kmg]?b?)?$/i)
     if (!match) return null

     const op = match[1] === '<' ? 'lt' : match[1] === '>' ? 'gt' : 'eq'
     let bytes = parseInt(match[2], 10)
     const unit = (match[3] || '').toLowerCase()

     if (unit.startsWith('k')) bytes *= 1024
     else if (unit.startsWith('m')) bytes *= 1024 * 1024
     else if (unit.startsWith('g')) bytes *= 1024 * 1024 * 1024

     return { op, bytes }
}

/**
 * Parse search string into array of terms
 */
export const parse = <T extends string = TTermType>(input: string, options: TParserOptions<T | TDefaultTermType> = {}): TParseResult<T | TDefaultTermType> => {
     const defaultOps = DEFAULT_OPERATORS as TOperatorDef<T | TDefaultTermType>[]
     const userOps = options.operators || []
     const operators = [...userOps, ...defaultOps]

     const tokens = tokenize(input)
     return parseTokens(tokens, operators, options)
}

/**
 * Recursive function to parse tokens
 */
const parseTokens = <T extends string>(tokens: TToken[], operators: TOperatorDef<T>[], options: TParserOptions<T>): TParseResult<T> => {
     const terms: TParsedTerm<T>[] = []
     let i = 0

     while (i < tokens.length) {
          const token = tokens[i]

          if (token.type === 'LPAREN') {
               // Find matching RPAREN
               let balance = 1
               let j = i + 1
               while (j < tokens.length) {
                    if (tokens[j].type === 'LPAREN') balance++
                    if (tokens[j].type === 'RPAREN') balance--
                    if (balance === 0) break
                    j++
               }

               if (balance === 0) {
                    // Found matching paren
                    const innerTokens = tokens.slice(i + 1, j)
                    const innerTerms = parseTokens(innerTokens, operators, options)

                    // If inner terms are empty, skip
                    if (innerTerms.length > 0) {
                         terms.push({
                              type: 'group' as T,
                              value: '',
                              negated: false,
                              terms: innerTerms
                         })
                    }

                    i = j + 1
                    continue
               } else {
                    // Unmatched paren, treat as text? Or just ignore?
                    // For now, let's treat it as text if possible, or just skip
                    // Current behavior: consume as text if possible, but here we are in token loop
                    // Let's just skip the LPAREN and continue
                    i++
                    continue
               }
          }

          if (token.type === 'RPAREN') {
               // Unmatched RPAREN (since LPAREN handling skips matched ones)
               // Treat as text or ignore
               i++
               continue
          }

          if (token.type === 'OR') {
               terms.push({
                    type: 'or' as T,
                    value: 'OR',
                    negated: false
               })
               i++
               continue
          }

          const term = parseToken(token, operators, options)
          if (term) {
               if (Array.isArray(term)) {
                    terms.push(...term)
               } else {
                    terms.push(term)
               }
          }
          i++
     }

     return processOrLogic(terms)
}

/**
 * Handle OR logic and implicit AND grouping
 */
const processOrLogic = <T extends string>(terms: TParsedTerm<T>[]): TParsedTerm<T>[] => {
     // Check if there are any OR terms
     const hasOr = terms.some(t => t.type === 'or')
     if (!hasOr) return terms

     let currentGroup: TParsedTerm<T>[] = []
     const orGroups: TParsedTerm<T>[][] = []

     for (const term of terms) {
          if (term.type === 'or') {
               if (currentGroup.length > 0) {
                    orGroups.push(currentGroup)
                    currentGroup = []
               }
          } else {
               currentGroup.push(term)
          }
     }

     if (currentGroup.length > 0) {
          orGroups.push(currentGroup)
     }

     // If we have multiple groups separated by OR
     if (orGroups.length > 1) {
          const processedGroups = orGroups.map(group => {
               if (group.length === 1) return group[0]
               return {
                    type: 'group' as T,
                    value: '',
                    negated: false,
                    terms: group
               }
          })

          return [{
               type: 'or' as T,
               value: '',
               negated: false,
               terms: processedGroups
          }]
     }

     return terms
}

/**
 * Parse a single token into a parsed term
 */
const parseToken = <T extends string>(token: TToken, operators: TOperatorDef<T>[], options: TParserOptions<T>): TParsedTerm<T> | TParsedTerm<T>[] | null => {
     switch (token.type) {
          case 'TEXT':
               return {
                    type: 'text' as T,
                    value: token.value,
                    negated: false
               }

          case 'QUOTED':
               return {
                    type: 'phrase' as T,
                    value: token.value,
                    negated: false
               }

          case 'NEGATED': {
               // Check if it's a negated operator
               if (token.value.includes(':')) {
                    const parsed = parseOperator({ ...token, type: 'OPERATOR' })
                    if (parsed) {
                         const opDef = findOperator(parsed.key, operators)
                         if (opDef && opDef.allowNegation) {
                              validateOperator(opDef, options)

                              const values = splitValues(parsed.value)
                              if (values.length > 1) {
                                   // Negated list: -to:a,b -> NOT a AND NOT b
                                   return values.map(v => {
                                        let cleanVal = v
                                        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
                                             cleanVal = v.slice(1, -1)
                                        }
                                        return buildTerm(opDef.name as T, cleanVal, true, opDef.type)
                                   })
                              }

                              let cleanVal = parsed.value
                              if ((cleanVal.startsWith('"') && cleanVal.endsWith('"')) || (cleanVal.startsWith("'") && cleanVal.endsWith("'"))) {
                                   cleanVal = cleanVal.slice(1, -1)
                              }
                              return buildTerm(opDef.name as T, cleanVal, true, opDef.type)
                         }
                    }
               }

               // Check if quoted
               const isPhrase = token.raw.includes('"') || token.raw.includes("'")

               return {
                    type: isPhrase ? 'phrase' as T : 'text' as T,
                    value: token.value,
                    negated: true
               }
          }

          case 'OPERATOR': {
               const parsed = parseOperator(token)
               if (!parsed) return null

               const opDef = findOperator(parsed.key, operators)

               if (opDef) {
                    validateOperator(opDef, options)

                    const values = splitValues(parsed.value)
                    if (values.length > 1) {
                         // List: to:a,b -> a OR b
                         const subTerms = values.map(v => {
                              let cleanVal = v
                              if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
                                   cleanVal = v.slice(1, -1)
                              }
                              return buildTerm(opDef.name as T, cleanVal, false, opDef.type)
                         })

                         return {
                              type: 'or' as T,
                              value: 'OR',
                              negated: false,
                              terms: subTerms
                         }
                    }

                    let cleanVal = parsed.value
                    if ((cleanVal.startsWith('"') && cleanVal.endsWith('"')) || (cleanVal.startsWith("'") && cleanVal.endsWith("'"))) {
                         cleanVal = cleanVal.slice(1, -1)
                    }
                    return buildTerm(opDef.name as T, cleanVal, false, opDef.type)
               }

               // Unknown operator, treat as text
               return {
                    type: 'text' as T,
                    value: token.value,
                    negated: false
               }
          }

          default:
               return null
     }
}

/**
 * Validate if operator is allowed
 */
const validateOperator = <T extends string>(opDef: TOperatorDef<T>, options: TParserOptions<T>): void => {
     if (options.operatorsAllowed && !options.operatorsAllowed.includes(opDef.name)) {
          throw new Error(`Operator '${opDef.name}' is not allowed`)
     }
     if (options.operatorsDisallowed && options.operatorsDisallowed.includes(opDef.name)) {
          throw new Error(`Operator '${opDef.name}' is not allowed`)
     }
}

/**
 * Build term with proper value parsing
 */
const buildTerm = <T extends string>(
     type: T,
     value: string,
     negated: boolean,
     valueType: 'string' | 'date' | 'size'
): TParsedTerm<T> => {
     const term: TParsedTerm<T> = { type, value, negated }

     if (valueType === 'date') {
          const dateVal = parseDate(value)
          if (dateVal) {
               if (dateVal.date) {
                    term.date = dateVal.date
               }
               if (dateVal.dateRange) {
                    term.dateRange = dateVal.dateRange
               }
          }
     } else if (valueType === 'size') {
          const sizeVal = parseSize(value)
          if (sizeVal) {
               term.size = sizeVal
          }
     }

     return term
}

/**
 * Get all unique operators from tokens
 */
export const extractOperators = (input: string): string[] => {
     const tokens = tokenize(input)
     const operators: Set<string> = new Set()

     for (const token of tokens) {
          if (token.type === 'OPERATOR') {
               const parsed = parseOperator(token)
               if (parsed) {
                    operators.add(parsed.key)
               }
          }
     }

     return Array.from(operators)
}

/**
 * Validate search query
 */
export const validate = (input: string): { valid: boolean; errors: string[] } => {
     const errors: string[] = []

     let inQuote = false
     let quoteChar = ''
     let parenBalance = 0

     for (const char of input) {
          if ((char === '"' || char === "'") && !inQuote) {
               inQuote = true
               quoteChar = char
          } else if (char === quoteChar && inQuote) {
               inQuote = false
               quoteChar = ''
          } else if (!inQuote) {
               if (char === '(') parenBalance++
               if (char === ')') parenBalance--
          }
     }

     if (inQuote) {
          errors.push(`Unmatched quote: ${quoteChar}`)
     }

     if (parenBalance !== 0) {
          errors.push(parenBalance > 0 ? 'Unmatched (' : 'Unmatched )')
     }

     return { valid: errors.length === 0, errors }
}

/**
 * Split comma-separated values respecting quotes
 */
const splitValues = (input: string): string[] => {
     const values: string[] = []
     let current = ''
     let inQuote = false
     let quoteChar = ''

     for (let i = 0; i < input.length; i++) {
          const char = input[i]
          if ((char === '"' || char === "'") && !inQuote) {
               inQuote = true
               quoteChar = char
               current += char
          } else if (char === quoteChar && inQuote) {
               inQuote = false
               quoteChar = ''
               current += char
          } else if (char === ',' && !inQuote) {
               values.push(current)
               current = ''
          } else {
               current += char
          }
     }
     if (current) values.push(current)
     return values
}
