# Search Query Parser

[![npm version](https://badge.fury.io/js/@muhgholy%2Fsearch-query-parser.svg)](https://www.npmjs.com/package/@muhgholy/search-query-parser)
[![CI](https://github.com/muhgholy/search-query-parser/actions/workflows/ci.yml/badge.svg)](https://github.com/muhgholy/search-query-parser/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A portable, framework-agnostic search query parser with Gmail-like syntax support. Zero dependencies, TypeScript-first, and optimized for performance.

## Features

-    🚀 **Zero dependencies** - Lightweight and fast
-    📝 **Gmail-like syntax** - Familiar search operators
-    🔧 **Framework-agnostic** - Works anywhere (Node.js, browser, edge)
-    📦 **TypeScript-first** - Full type safety
-    ⚡ **Optimized** - Returns simple array for easy iteration
-    🎯 **Extensible** - Custom operators support

## Installation

```bash
npm install @muhgholy/search-query-parser
```

```bash
yarn add @muhgholy/search-query-parser
```

```bash
pnpm add @muhgholy/search-query-parser
```

## Usage

```typescript
import { parse } from "@muhgholy/search-query-parser";

const terms = parse('"Promo Code" -spam from:newsletter after:-7d');

// Returns: TParsedTerm[]
// [
//   { type: 'phrase', value: 'Promo Code', negated: false },
//   { type: 'text', value: 'spam', negated: true },
//   { type: 'from', value: 'newsletter', negated: false },
//   { type: 'after', value: '-7d', negated: false, date: Date }
// ]

// Simple iteration
for (const term of terms) {
	switch (term.type) {
		case "text":
		case "phrase":
			// Handle text search
			break;
		case "from":
			// Handle from filter
			break;
		case "after":
			if (term.date) {
				// Use resolved date
			}
			break;
		case "or":
			// Handle OR logic
			// term.terms contains the operands
			break;
		case "group":
			// Handle group
			// term.terms contains the inner terms
			break;
	}
}
```

## Supported Syntax

### Text Search

| Syntax      | Description        | Example               |
| ----------- | ------------------ | --------------------- |
| `word`      | Plain text search  | `hello`               |
| `"phrase"`  | Exact phrase match | `"hello world"`       |
| `-word`     | Exclude term       | `-spam`               |
| `-"phrase"` | Exclude phrase     | `-"unsubscribe here"` |
| `( ... )`   | Grouping           | `(term1 term2)`       |
| `OR`        | Logical OR         | `term1 OR term2`      |

### Operators

| Operator    | Aliases            | Description       | Example                   |
| ----------- | ------------------ | ----------------- | ------------------------- |
| `from:`     | `f:`, `sender:`    | From address/name | `from:john@example.com`   |
| `to:`       | `t:`, `recipient:` | To address/name   | `to:jane`                 |
| `subject:`  | `subj:`, `s:`      | Subject line      | `subject:meeting`         |
| `body:`     | `content:`, `b:`   | Body content      | `body:invoice`            |
| `has:`      | -                  | Has property      | `has:attachment`          |
| `is:`       | -                  | Status filter     | `is:unread`               |
| `in:`       | `folder:`, `box:`  | Folder/mailbox    | `in:inbox`                |
| `label:`    | `tag:`, `l:`       | Label/tag         | `label:important`         |
| `header-k:` | `hk:`              | Header key        | `header-k:X-Custom`       |
| `header-v:` | `hv:`              | Header value      | `header-v:"custom value"` |

### Date Filters

| Syntax              | Description            | Example             |
| ------------------- | ---------------------- | ------------------- |
| `after:YYYY-MM-DD`  | After date (absolute)  | `after:2024-01-01`  |
| `before:YYYY-MM-DD` | Before date (absolute) | `before:2024-12-31` |
| `after:-Nd`         | After N days ago       | `after:-7d`         |
| `after:-Nh`         | After N hours ago      | `after:-24h`        |
| `after:-Nw`         | After N weeks ago      | `after:-2w`         |
| `after:-Nm`         | After N months ago     | `after:-1m`         |
| `after:-Ny`         | After N years ago      | `after:-1y`         |
| `after:"natural"`   | Natural language       | `after:"last week"` |

**Supported natural dates:** `today`, `yesterday`, `tomorrow`, `last week`, `last month`, `last year`, `this week`, `this month`, `this year`

### Size Filters

| Syntax    | Description          | Example       |
| --------- | -------------------- | ------------- |
| `size:>N` | Larger than N bytes  | `size:>1mb`   |
| `size:<N` | Smaller than N bytes | `size:<100kb` |
| `size:N`  | Equal to N bytes     | `size:500`    |

**Supported units:** `b`, `kb`, `mb`, `gb`

## API Reference

### `parse(input: string, options?: TParserOptions): TParseResult`

Parse a search query string into an array of terms.

```typescript
const terms = parse('"hello world" from:john -spam', {
	allowedOperators: ["from", "to"], // Only allow specific operators
	// OR
	disallowedOperators: ["size"], // Block specific operators
});
```

### `tokenize(input: string): TToken[]`

Low-level tokenizer for custom parsing needs.

```typescript
const tokens = tokenize('from:john "hello world"');
```

### `parseDate(value: string): { date: Date } | null`

Parse date strings (absolute, relative, natural).

```typescript
parseDate("-7d"); // { date: Date (7 days ago) }
parseDate("2024-01-01"); // { date: Date }
parseDate("last week"); // { date: Date }
```

### `escapeRegex(str: string): string`

Escape special regex characters.

```typescript
escapeRegex("hello.*world"); // 'hello\\.\\*world'
```

### `validate(input: string): { valid: boolean; errors: string[] }`

Validate search query syntax.

```typescript
validate('"unclosed quote'); // { valid: false, errors: ['Unmatched quote: "'] }
```

### `hasTerms(input: string): boolean`

Check if search string has any terms.

```typescript
hasTerms(""); // false
hasTerms("hello"); // true
```

### `summarize(input: string): string[]`

Get human-readable summary of search query.

```typescript
summarize('"Promo" from:newsletter after:-7d');
// ['Exact: "Promo"', 'From: newsletter', 'After: 12/6/2024']
```

## Types

```typescript
type TTermType =
	| "text" // Plain text
	| "phrase" // Exact phrase
	| "from" // From filter
	| "to" // To filter
	| "subject" // Subject filter
	| "body" // Body filter
	| "header-key" // Header key
	| "header-value" // Header value
	| "has" // Has property
	| "is" // Status filter
	| "in" // Folder filter
	| "before" // Before date
	| "after" // After date
	| "label" // Label filter
	| "size" // Size filter
	| "or" // Logical OR
	| "group"; // Parenthesized group

type TParsedTerm = {
	type: TTermType;
	value: string;
	negated: boolean;
	date?: Date; // Resolved date (for date types)
	size?: {
		// Parsed size (for size type)
		op: "gt" | "lt" | "eq";
		bytes: number;
	};
	terms?: TParsedTerm[]; // For 'or' and 'group' types
};

type TParseResult = TParsedTerm[];

type TParserOptions = {
	operators?: TOperatorDef[];
	caseSensitive?: boolean;
	allowedOperators?: string[];
	disallowedOperators?: string[];
};
```

## Examples

### MongoDB Integration

```typescript
import { parse, escapeRegex } from "@muhgholy/search-query-parser";

function buildMongoQuery(searchQuery: string) {
	const terms = parse(searchQuery);
	const conditions = [];

	for (const term of terms) {
		const regex = { $regex: escapeRegex(term.value), $options: "i" };

		switch (term.type) {
			case "text":
			case "phrase":
				conditions.push({
					$or: [{ title: term.negated ? { $not: regex } : regex }, { content: term.negated ? { $not: regex } : regex }],
				});
				break;
			case "from":
				conditions.push({ "from.email": regex });
				break;
			case "after":
				if (term.date) {
					conditions.push({ createdAt: { $gte: term.date } });
				}
				break;
		}
	}

	return conditions.length ? { $and: conditions } : {};
}
```

### SQL Integration

```typescript
import { parse, escapeRegex } from "@muhgholy/search-query-parser";

function buildSQLWhere(searchQuery: string) {
	const terms = parse(searchQuery);
	const clauses = [];
	const params = [];

	for (const term of terms) {
		switch (term.type) {
			case "text":
				clauses.push(term.negated ? "(title NOT LIKE ? AND content NOT LIKE ?)" : "(title LIKE ? OR content LIKE ?)");
				params.push(`%${term.value}%`, `%${term.value}%`);
				break;
			case "after":
				if (term.date) {
					clauses.push("created_at >= ?");
					params.push(term.date.toISOString());
				}
				break;
		}
	}

	return { where: clauses.join(" AND "), params };
}
```

## License

MIT © [Muhammad Gholy](https://github.com/muhgholy)
