# Changelog

## [2.4.1]

### Fixed - 2025-11-01

- **Boolean Validation - Missing Null Check**
  - Fixed issue where required boolean fields with `null` value were not properly validated
  - Previously only checked for `undefined`, now correctly validates both `null` and `undefined`
  - File: `nodes/ValidatorNode/validation/boolean.ts:14`
- **Phone Validation - Lost Error Messages**
  - Fixed phone validation returning `error: null` in failure cases, causing generic fallback messages
  - Now provides specific error messages based on validation mode (valid, possible, validForRegion, possibleForType)
  - Exception handling now includes error message from caught exceptions
  - Files: `nodes/ValidatorNode/validation/string.ts:98, 131`
- **Phone Rewrite - Null/Undefined in Output**
  - Fixed issue where empty optional phone fields could output `null` or `undefined` in formatted field
  - Now normalizes to empty string for output consistency to prevent serialization issues
  - File: `nodes/ValidatorNode/ValidatorNode.node.ts:224`
- **Number oneOf Validation - Confusing Error Messages**
  - Fixed confusing error messages when `oneOfValues` contains invalid number strings (e.g., 'abc')
  - Now filters out invalid entries (NaN values) and only shows valid numbers in error messages
  - Provides clear error message when configuration contains only invalid entries
  - File: `nodes/ValidatorNode/validation/number.ts:65-69`
- **Enum Validation - Empty enumValues Handling**
  - Added validation to ensure `enumValues` is configured and contains at least one valid value
  - Filters out empty strings from enum values array
  - Provides clear error message when enumValues is empty or not configured
  - File: `nodes/ValidatorNode/validation/enum.ts:11`
- **Code Quality Improvements**
  - Improved error message specificity across validation operations
  - Enhanced null/undefined handling consistency
  - Better error context preservation in validation failures

