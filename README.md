# n8n-nodes-input-validator

The **n8n-nodes-input-validator** validates and transforms input data in n8n against configurable criteria. It supports strings, numbers, booleans, dates, enums, and international phone numbers (via google-libphonenumber), with comprehensive options for validation strictness and error handling.

## Install

- From n8n (Community Nodes): search for `n8n-nodes-input-validator` and install.
- Or via npm in your community nodes container/directory:
  ```sh
  npm install n8n-nodes-input-validator
  ```

## Features

- **String Validation**: Validate strings against 40+ formats with optional advanced controls
- **Phone Validation**: Validate and optionally rewrite international phone numbers using google-libphonenumber with region, mode, type filters, and auto-realignment
- **Number Validation**: Validate numbers using min, max, range, or one-of list constraints
- **Boolean Validation**: Validate boolean values with required field support
- **Date Validation**: Validate dates in ISO 8601 format
- **Enum Validation**: Validate values against predefined options
- **Custom Error Messages**: Optional field-level custom error messages with flexible placement (append/prepend/replace)
- **Flexible Error Handling**: Continue, throw error, skip item, skip field, or set invalid fields to null/empty
- **Phone Number Rewriting**: Format phone numbers to E.164, International, National, or RFC3966 formats with type realignment

### Supported String Formats

**Common Formats**: Email, URL, UUID, Alphanumeric, Alpha (letters only), Numeric, Integer, Phone number, Postal code, Credit card

**Network & Technical**: IP Address (IPv4/IPv6), IPv4 Address, IPv6 Address, IP Range (CIDR), MAC Address, Port, FQDN, MIME Type

**Data Formats**: JSON, JWT, Base64, Hexadecimal, Hex Colour, Hash (MD5/SHA1/SHA256/SHA384/SHA512/etc.), MongoDB ObjectId

**Web & URLs**: URL, URL Slug, Mailto URI

**Financial & Business**: Currency, Credit Card, BIC/SWIFT, IBAN, VAT Number, Tax ID, Bitcoin Address, Ethereum Address

**Date & Time**: ISO 8601, RFC 3339, Time

**Identifiers**: ISBN (10/13), UUID (v3/v4/v5), Semantic Version

**Coordinates**: Latitude/Longitude

**Security**: Strong Password, Custom Regex Pattern

## Usage

### Node Configuration

The node operates in **Output Items** mode, validating data and outputting items with an `isValid` property and optional `errors` array.

#### Global Settings

- **Output only isValid**: When enabled, outputs only `isValid` and `errors` properties (excludes item data)
- **Remove Unspecified Fields**: When enabled, removes fields from the output that are not specified in the validator inputs (only visible when "Output only isValid" is disabled)
- **Enable Phone Rewrite**: Enable phone number formatting/rewriting with google-libphonenumber
- **Omit Empty Fields**: When enabled, remove fields with null, undefined, or empty string values from the output (useful for cleaning up optional fields)
- **On Invalid**: Choose how to handle validation failures (options sorted alphabetically):
  - **Continue**: Pass through original data with validation errors included
  - **Set Invalid Fields to Empty**: Set fields that fail validation to empty values (empty string, 0, false, etc.)
  - **Set Invalid Fields to Null**: Set fields that fail validation to null
  - **Skip Field** (default): Remove the field that failed validation but continue to output the item
  - **Skip Item**: Exclude the item from output when validation fails
  - **Throw Error**: Fail the entire item when any validation fails

#### Phone Rewrite Options (when enabled)

- **Pass Through All Incoming Fields**: Keep all original item fields and add formatted outputs
- **Do Not Output Phone Rewrite Details**: Omit the `phoneRewrites` summary array from output
- **Auto realign mismatched types**: Automatically swap phone values between fields when types don't match expected types
- **Allow using same number in multiple fields**: Allow one detected number to be used for multiple output fields

### Field Configuration

Each validation field supports the following properties:

#### Common Properties (All Types)

- **Validation Name**: Name identifier for the validation field
- **Validation Type**: Choose from `string`, `number`, `boolean`, `date`, or `enum`
- **Required**: Whether the input field is required (applies to all types)
- **Custom Error Message**: Optional custom error message with prefix syntax:
  - Plain text = appends to standard message
  - `!text` = replaces standard message
  - `^text` = prepends to standard message

#### String Validation

- **String Data**: The string value to validate
- **String Format**: Choose from 40+ formats (see Supported String Formats above)
- **Regex Pattern**: Custom regex pattern (when format is "Custom Regex Pattern")

**Format-Specific Options** (collapsed by default):
- **Email**: Advanced options toggle for display name, UTF8, TLD requirements, IP domains, max length, domain-specific validation
- **URL**: Require protocol/TLD (visible), advanced options for underscores, trailing dots, fragments, query components, auth, length
- **FQDN**: Require TLD (visible), advanced options for underscores, trailing dots, numeric TLD, wildcards
- **Phone Number**: Region, validation mode, expected types, on-invalid behavior, rewrite options
- **UUID/ISBN**: Version selection
- **Postal Code/VAT/Tax ID**: Locale/country code selection
- **Hash**: Algorithm selection (MD4/MD5/SHA1/SHA256/etc.)
- **Strong Password**: Min length, min lowercase/uppercase/numbers/symbols, return score option
- **Currency**: Symbol, require symbol, negatives, space after symbol, decimal requirements
- **ISO 8601/Time**: Strict mode, separator mode, hour format options

#### Number Validation

- **Number Data**: The number value to validate
- **Number Validation Type**: Choose validation constraint:
  - **None**: No additional constraints
  - **Minimum**: Must be ≥ min value
  - **Maximum**: Must be ≤ max value
  - **Range**: Must be between min and max values
  - **One Of**: Must match one of the specified values
- **Min Value**: Minimum value (for min/range validation)
- **Max Value**: Maximum value (for max/range validation)
- **One Of Values**: Comma-separated list of valid numbers (for oneOf validation)

#### Boolean Validation

- **Boolean Data**: The boolean value to validate

#### Date Validation

- **Date Data**: The date value to validate (ISO 8601 format expected)

#### Enum Validation

- **String Data**: The value to validate against enum options
- **Enum Values**: Comma-separated list of valid enum values

### Example Configurations

#### Basic Email Validation
```javascript
{
  "Validation Name": "customerEmail",
  "Validation Type": "string",
  "String Data": "{{ $json.email }}",
  "String Format": "email",
  "Required": true,
  "Custom Error Message": "Please provide a valid business email address"
}
```

#### Phone Validation with Rewrite
```javascript
{
  "Validation Name": "mobilePhone",
  "Validation Type": "string",
  "String Data": "{{ $json.phone }}",
  "String Format": "Phone Number",
  "Phone Region": "AU",
  "Validation Mode": "Valid (Strict)",
  "Expected Type(s)": ["MOBILE"],
  "Enable Phone Rewrite": true,
  "Output Field Name": "formattedMobile",
  "Rewrite Format": "E.164"
}
```

#### Number Range Validation
```javascript
{
  "Validation Name": "quantity",
  "Validation Type": "number",
  "Number Data": "{{ $json.qty }}",
  "Number Validation Type": "Range",
  "Min Value": 1,
  "Max Value": 100,
  "Required": true,
  "Custom Error Message": "^Quantity out of range."
}
```

#### Enum Validation
```javascript
{
  "Validation Name": "status",
  "Validation Type": "enum",
  "String Data": "{{ $json.status }}",
  "Enum Values": "pending, approved, rejected",
  "Required": true
}
```

### Output Structure

By default, the node augments each item with validation results:

```json
{
  "originalField1": "value1",
  "originalField2": "value2",
    "isValid": true,
    "errors": [
        {
      "field": "fieldName",
            "message": "Error message"
        }
    ]
}
```

**Properties:**
- **isValid**: Boolean indicating whether all validations passed
- **errors**: Array of error objects for failed validations (only present when validation fails)
  - **field**: Name of the field that failed validation
  - **message**: Error message describing the validation failure
  - **resolved**: (Optional) Boolean indicating if error was auto-resolved (e.g., phone realignment)
  - **resolution**: (Optional) Description of how the error was resolved

**With `Output only isValid` enabled:**
```json
{
  "isValid": false,
  "errors": [...]
}
```
(Original item data is excluded)

**With `Remove Unspecified Fields` enabled:**
```json
{
  "email": "user@example.com",
  "quantity": 5,
  "isValid": true
}
```
(Only fields specified in the validator inputs are included, plus `isValid` and `errors`. Other fields from the input are removed.)

For example, if your input item has:
```json
{
  "email": "user@example.com",
  "quantity": 5,
  "extra_field": "some_value",
  "another_field": "another_value"
}
```
And you only validate `email` and `quantity`, the output will only include those validated fields plus `isValid` (and `errors` if any).

### Phone Validation & Rewriting

When `String Format` is set to `Phone Number`, the node uses **google-libphonenumber** for robust international phone validation and formatting.

#### Validation Options

- **Phone Region**: ISO 3166-1 alpha-2 country code (e.g., AU, US, GB, ZZ for unknown/international)
- **Validation Mode**: 
  - **Valid (Strict)**: Full validity check (isValidNumber)
  - **Possible (Lenient)**: Possibility check only (isPossibleNumber)
  - **Valid For Region**: Validity within specified region (isValidNumberForRegion)
  - **Possible For Type**: Possibility check constrained to selected types
- **Expected Type(s)**: Constrain accepted phone number types:
  - FIXED_LINE, MOBILE, FIXED_LINE_OR_MOBILE, TOLL_FREE, PREMIUM_RATE, SHARED_COST, VOIP, PERSONAL_NUMBER, PAGER, UAN, VOICEMAIL, UNKNOWN
- **Treat Fixed-Line-or-Mobile as Mobile**: When enabled (default), treats FIXED_LINE_OR_MOBILE as satisfying MOBILE requirement
- **On Invalid** (field-level): Override global behavior for this specific phone field (options sorted alphabetically):
  - Empty String
  - Leave As Is
  - Null
  - Skip Field
  - Throw Error (fail item)
  - Use Global Setting (default)

#### Phone Rewrite/Formatting

Enable **Enable Phone Rewrite** at the node level, then enable **Enable Phone Rewrite** for individual phone fields.

**Per-Field Rewrite Options:**
- **Output Field Name**: Destination property name (defaults to `<name>Formatted`)
- **Rewrite Format**: 
  - **E.164**: `+61412345678` (recommended for databases/APIs)
  - **INTERNATIONAL**: `+61 412 345 678` (human-readable international)
  - **NATIONAL**: `0412 345 678` (local format)
  - **RFC3966**: `tel:+61-412-345-678` (tel: URI scheme)
  
**Advanced Rewrite Options** (collapsed by default):
- **Fallback Types**: Alternative types to try during auto-realignment
- **Keep Extension**: Preserve phone extensions (default: true)
- **Digit Separator**: Space, Hyphen, or Custom separator for INTERNATIONAL/NATIONAL formats
- **Custom Separator**: Custom separator string when Digit Separator is set to Custom

**Global Rewrite Options:**
- **Pass Through All Incoming Fields**: Keep original item data (default: true)
- **Do Not Output Phone Rewrite Details**: Omit `phoneRewrites` summary array (default: false)
- **Auto realign mismatched types**: Automatically swap values between phone fields when detected type doesn't match expected type (default: true)
- **Allow using same number in multiple fields**: Allow duplicate assignments during realignment (default: true)

#### Phone Rewrite Output

When phone rewrite is enabled, the node adds formatted phone numbers to the item:

```json
{
  "name": "John Smith",
  "mobile": "0412 345 678",
  "mobileFormatted": "+61412345678",
  "phoneRewrites": [
    {
      "name": "mobile",
      "original": "0412 345 678",
      "outputProperty": "mobileFormatted",
      "formatted": "+61412345678",
      "format": "E164",
      "region": "AU",
      "type": "MOBILE",
      "valid": true,
      "possible": true,
      "expectedTypes": ["MOBILE"],
      "expectedTypeMatch": true
    }
  ],
  "isValid": true
}
```

**Auto-Realignment Example:**

If two phone fields have mismatched types (e.g., mobile number in landline field), the node can automatically swap them:

```json
{
  "phoneRewrites": [
    {
      "name": "landline",
      "correctionMade": true,
      "correctionSource": "mobile",
      "formatted": "+61383214567"
    },
    {
      "name": "mobile", 
      "correctionMade": true,
      "correctionSource": "landline",
      "formatted": "+61412345678"
    }
  ]
}
```

## Advanced Features

### Custom Error Messages

Use the **Custom Error Message** field on any validation field to provide context-specific error messages:

- **Plain text** (appends): `"This value is required for processing"` 
  - Output: `"Invalid email address. This value is required for processing"`
- **`!` prefix** (replaces): `"!Email must be from approved domain"`
  - Output: `"Email must be from approved domain"`
- **`^` prefix** (prepends): `"^Critical validation error:"`
  - Output: `"Critical validation error: Invalid email address."`

### Progressive Disclosure UI

The node uses a progressive disclosure pattern to reduce UI clutter:

- **Email, URL, FQDN validation**: Common options visible by default, advanced options behind `⚙️ Advanced Options` toggle
- **Phone rewrite**: Basic rewrite options visible, advanced separator/extension/fallback options collapsed
- **Result**: ~70% fewer visible properties for typical use cases, with full power-user control available when needed

### Nested Field Support

All validation fields support dot notation for nested object paths:

```javascript
{
  "Validation Name": "user.profile.email",
  "String Data": "{{ $json.user.profile.email }}",
  "String Format": "email"
}
```

The validated/rewritten value will be written back to the nested path in the output.

## Development

### Setup

1. Clone the repository:
    ```sh
    git clone https://github.com/yourusername/n8n-nodes-input-validator.git
    cd n8n-nodes-input-validator
    ```

2. Install dependencies:
    ```sh
    npm install
    ```

3. Build the project:
    ```sh
    npm run build
    ```

4. Link to n8n for local development:
    ```sh
    npm link
    cd ~/.n8n/nodes
    npm link n8n-nodes-input-validator
    ```

### Testing

The node includes comprehensive validation logic using:
- **validator.js** for string format validation
- **google-libphonenumber** for international phone number validation and formatting
- TypeScript for type safety

## Attribution

This project is a fork with substantial changes. Credit to the original author **cdmx1** (`https://github.com/cdmx1`) for the initial concept and implementation.

## License

Licensed under the Apache License, Version 2.0. See `LICENSE` for details. If you distribute modified versions, ensure you include appropriate attribution as required by Section 4 of the license.


