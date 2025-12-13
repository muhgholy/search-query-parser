# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-12-13

### Added

-    Initial release
-    Tokenizer for parsing search query strings
-    Parser for converting tokens to structured terms
-    Date parser with support for absolute, relative, and natural dates
-    Support for Gmail-like operators: `from:`, `to:`, `subject:`, `body:`, `has:`, `is:`, `in:`, `label:`, `header-k:`, `header-v:`
-    Date operators: `after:`, `before:`, `older:`, `newer:`
-    Size operator with comparison support
-    Negation support for terms and operators
-    Quoted phrase support
-    Helper functions: `hasTerms`, `escapeRegex`, `summarize`, `validate`
-    Full TypeScript support with exported types
-    ESM and CommonJS builds
