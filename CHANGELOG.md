# Changelog

All notable changes to this project are documented here. This project follows Semantic Versioning.

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
