# Changelog

All notable changes to this project are documented here. This project follows Semantic Versioning.

## 2.1.0 - 2025-09-26
### Node Mode Enhancements:
- **UI Improvements**: Phone rewrite/format options now automatically hide in Output Validation Results and Output Items modes for cleaner interface
- **Output Items Mode**: Added `isValid` property to output while preserving all original item data and existing error behaviour
- **Rewrite/Format Phone Numbers Mode**: Added `isValid` validation status to output alongside phone formatting
- **New Feature**: Added "Phone Rewrite Output Mode" option in Rewrite/Format mode with choice between:
  - **Separate Fields** (default): Creates new formatted fields (existing behaviour, backward compatible)
  - **Overwrite Original**: Replaces original field values with formatted phone numbers
- **Enhanced Metadata**: Updated `phoneRewrites` array to accurately reflect actual output locations based on user choice
- **Backward Compatibility**: All changes maintain existing workflow behaviour with new features as opt-in defaults
- Enabled usableAsTool

## 2.0.2 - 2025-09-24

- Removed Custom Message As New Sentence

## 2.0.1 - 2025-09-23

- Breaking: Node internal name changed from `validatorNode` to `inputValidator` (existing workflows may need to re-add the node).
- Breaking: Package renamed to `n8n-nodes-input-validator` and moved to a new repository.
- Licence: Remains MIT. Reconfirmed and aligned repository files and package metadata.
- Added: Modular validation architecture with pluggable handlers (string, number, boolean, date, enum) and a central registry.
- Added: Expanded string formats (email, URL, UUID, IP, postal code, JWT, FQDN, ISBN, JSON, hash, colour, currency, semver, slug, port, MAC, MIME, crypto addresses, VAT, tax ID, time, ISO8601/RFC3339, custom regex).
- Added: International phone validation using google-libphonenumber with region, validation mode and allowed type filters; optional enriched phone details when outputting validation results.
- Added: Number validation modes — `min`, `max`, `range`, `oneOf`.
- Docs: Updated README (Install, Features, Usage, Attribution) and added NOTICE.
- Housekeeping: Updated package metadata and `index.js` export.

## 1.x - 2024–2025

- Pre-fork history and releases by the original author (cdmx1). Refer to the original repository for details.
