# Changelog

## [2.5.1]

### Added - 2025-11-06

- Omit Empty Fields option
  - New global boolean: "Omit Empty Fields" removes null, undefined, or empty string values from output
  - Useful for cleaning up optional fields that weren't provided (e.g., empty mobilePhone)
  - Recursively cleans nested objects; preserves special fields (isValid, errors, phoneRewrites)


## [2.5.0]

### Added/Changed - 2025-11-06

- Skip Field option for On Invalid
  - New global option: "Skip Field" removes only fields that fail validation and continues outputting the item
  - Set as the default for new nodes; options sorted alphabetically in the picklist
  - Field-level phone validation (`phoneOnInvalid`) now supports `skip-field`
- Implementation details
  - Added `removeFieldAtPath` helper to remove nested fields and handle arrays (objects and primitives)
  - Wired `skip-field` into global and field-level validation failure handling
  - Phone rewrite flow respects `skip-field` (skips writing formatted output for failing fields)
- Fixes
  - Replaced `await import` usage in non-async context with static import to prevent runtime/TS errors

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

