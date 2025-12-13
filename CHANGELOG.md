# [2.0.0](https://github.com/muhgholy/search-query-parser/compare/v1.0.0...v2.0.0) (2025-12-13)


* feat!: refactor parser options and types ([fab4698](https://github.com/muhgholy/search-query-parser/commit/fab4698d81a671058487582348fdfe7a37ee9e73))


### Bug Fixes

* retry release v2.0.0 ([83a2637](https://github.com/muhgholy/search-query-parser/commit/83a263759a6fb6bd05004fbc02668c736471319b))


### BREAKING CHANGES

* renamed allowedOperators to operatorsAllowed, disallowedOperators to operatorsDisallowed, and removed customOperators in favor of operators.

# [2.0.0](https://github.com/muhgholy/search-query-parser/compare/v1.0.0...v2.0.0) (2025-12-13)


* feat!: refactor parser options and types ([fab4698](https://github.com/muhgholy/search-query-parser/commit/fab4698d81a671058487582348fdfe7a37ee9e73))


### BREAKING CHANGES

* renamed allowedOperators to operatorsAllowed, disallowedOperators to operatorsDisallowed, and removed customOperators in favor of operators.

# 1.0.0 (2025-12-13)


### Bug Fixes

* allow npm version to set same version ([8f8b71b](https://github.com/muhgholy/string-search-builder/commit/8f8b71b3ef827a0fa5b3167788ed97b21a702b83))
* replace semantic-release/npm with exec to bypass token check ([7e5b4d7](https://github.com/muhgholy/string-search-builder/commit/7e5b4d788054394cf786bd9a237d3cf717bac198))

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
