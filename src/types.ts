/**
 * Search Query Parser Types
 * Portable type definitions for search query parsing
 */

// ** Token Types (from tokenizer)
export type TTokenType =
    | 'TEXT'           // Plain text
    | 'QUOTED'         // "quoted string"
    | 'NEGATED'        // -term or -"quoted"
    | 'OPERATOR'       // key:value
    | 'LPAREN'         // (
    | 'RPAREN'         // )
    | 'OR'             // OR keyword

export type TToken = {
    type: TTokenType
    value: string
    raw: string
    position: number
}

// ** Parsed Term Types
export type TTermType =
    | 'text'           // General text search
    | 'phrase'         // Exact phrase match
    | 'from'           // From address/name
    | 'to'             // To address/name
    | 'subject'        // Subject line
    | 'body'           // Body content
    | 'header-key'     // Custom header key
    | 'header-value'   // Custom header value
    | 'has'            // Has attachment, etc.
    | 'is'             // Is unread, read, etc.
    | 'in'             // In folder/box
    | 'before'         // Before date
    | 'after'          // After date
    | 'label'          // Label/tag
    | 'size'           // Size comparison
    | 'or'             // Logical OR
    | 'group'          // Parenthesized group

// ** Single parsed term - the main output unit
export type TParsedTerm = {
    type: TTermType
    value: string
    negated: boolean
    date?: Date              // Resolved date for date types
    size?: {                 // Parsed size for size type
        op: 'gt' | 'lt' | 'eq'
        bytes: number
    }
    terms?: TParsedTerm[]    // For 'or' and 'group' types
}

// ** Parser result - simple array
export type TParseResult = TParsedTerm[]

// ** Operator Definition for extensibility
export type TOperatorDef = {
    name: string
    aliases: string[]
    type: TTermType
    valueType: 'string' | 'date' | 'size'
    allowNegation: boolean
}

// ** Parser Options
export type TParserOptions = {
    operators?: TOperatorDef[]
    caseSensitive?: boolean
    allowedOperators?: string[]
    disallowedOperators?: string[]
}
