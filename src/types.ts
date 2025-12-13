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
export type TDefaultTermType =
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
    | 'date'           // Specific date or range
    | 'before'         // Before date
    | 'after'          // After date
    | 'label'          // Label/tag
    | 'size'           // Size comparison
    | 'or'             // Logical OR
    | 'group'          // Parenthesized group

export type TTermType = TDefaultTermType

// ** Single parsed term - the main output unit
export type TParsedTerm<T extends string = TTermType> = {
    type: T
    value: string
    negated: boolean
    date?: Date              // Resolved date for date types
    dateRange?: {            // Resolved date range
        start: Date
        end: Date
    }
    size?: {                 // Parsed size for size type
        op: 'gt' | 'lt' | 'eq'
        bytes: number
    }
    terms?: TParsedTerm<T>[]    // For 'or' and 'group' types
}

// ** Parser result - simple array
export type TParseResult<T extends string = TTermType> = TParsedTerm<T>[]

// ** Operator Definition for extensibility
export type TOperatorDef<T extends string = TTermType> = {
    name: string
    aliases: string[]
    type: T
    valueType: 'string' | 'date' | 'size'
    allowNegation: boolean
}

// ** Parser Options
export type TParserOptions<T extends string = TTermType> = {
    operators?: TOperatorDef<T>[]
    caseSensitive?: boolean
    operatorsAllowed?: string[]
    operatorsDisallowed?: string[]
}
