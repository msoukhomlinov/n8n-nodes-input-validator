# n8n-nodes-input-validator

The **n8n-nodes-input-validator** validates input data in n8n against configurable criteria. It supports strings, numbers, booleans, dates, enums, and international phone numbers (via google-libphonenumber), with options that balance strictness and flexibility.

## Install

- From n8n (Community Nodes): search for `n8n-nodes-input-validator` and install.
- Or via npm in your community nodes container/directory:
  ```sh
  npm install n8n-nodes-input-validator
  ```

## Features

- **String Validation**: Validate strings against many formats (email, URL, UUID, regex, IP, postal code, JWT, FQDN, ISBN, JSON, hash, colour, currency, semver, slug, port, MAC, MIME type, crypto addresses, VAT, tax ID, time, ISO8601/RFC3339, etc.).
- **Phone Validation**: Validate international phone numbers using google-libphonenumber with region, mode and type filters.
- **Number Validation**: Validate numbers using min, max, range, or one-of list.
- **Boolean Validation**: Validate boolean values.
- **Date Validation**: Validate dates in ISO 8601 format.
- **Enum Validation**: Validate values against a set of predefined options.

### Supported String Formats

Email, URL, UUID, Alphanumeric, Letters only, Numbers only, Integer, Credit card, Phone number (libphonenumber), Postal code, IP (any/IPv4/IPv6), MAC address, JWT, Base64, Hex colour, Hex string, ISBN (10/13), Strong password, JSON, MongoId, FQDN, Port, SemVer, Slug, Currency, Lat/Long, Bitcoin address, Ethereum address, BIC, IBAN, VAT, Tax ID, MIME type, Hash (MD5/SHA*/etc.), IP range (CIDR), ISO 8601 date, Mailto URI, MD5, RFC 3339 date, Time, and Custom regex.

## Usage

### Properties

The node allows you to configure multiple input fields with various validation criteria. Each input field has the following properties:

- **Node Mode**: Choose how the node outputs results:
  - **Output Validation Results**: Outputs a JSON summary per item: `{ isValid, errors?, phoneDetails? }`. Use this to inspect validation without stopping the workflow.
  - **Output Items**: For valid items, passes the original item through unchanged; for invalid items, throws a node error summarising failures.
- **Include Phone Details**: When in "Output Validation Results" mode, include enriched details for phone fields (E.164, national/international formats, type, region).
- **Validation Type**: The type of validation to perform (`string`, `number`, `boolean`, `date`, `enum`).
- **Required**: Whether the input field is required.
- **String Data**: Data to be validated as a string.
- **String Format**: Choose from many formats (see list above) or match a custom regex pattern.
- **Number Data**: Data to be validated as a number.
- **Number Validation Type**: Choose `min`, `max`, `range`, or `oneOf`.
- **Boolean Data**: Data to be validated as a boolean.
- **Date Data**: Data to be validated as a date.
- **Enum Values**: Comma-separated list of valid enum values.
- **Pattern**: Regex pattern for string validation.
- **Min**: Minimum value for number validation.
- **Max**: Maximum value for number validation.
- **One Of Values**: Comma-separated list of allowed numbers for `oneOf`.

### Example Configuration

Here's an example of how to configure the Input Validator:

1. **String Validation**
    - **Validation Type**: `string`
    - **Required**: `true`
    - **String Data**: `example@example.com`
    - **String Format**: `email`

2. **Number Validation**
    - **Validation Type**: `number`
    - **Required**: `true`
    - **Number Data**: `10`
    - **Min**: `2`
    - **Max**: `100`

3. **Boolean Validation**
    - **Validation Type**: `boolean`
    - **Required**: `true`
    - **Boolean Data**: `true`

4. **Date Validation**
    - **Validation Type**: `date`
    - **Required**: `true`
    - **Date Data**: `2024-06-05`

5. **Enum Validation**
    - **Validation Type**: `enum`
    - **Required**: `true`
    - **String Data**: `option1`
    - **Enum Values**: `option1, option2, option3`

### Validation Logic

The validation logic is implemented as follows:

- **String Validation**: Checks if the string matches the specified format (email, URL, UUID, pattern) and if it is not empty when required.
- **Number Validation**: Checks if the number is within the specified range (min and max) and if it is a valid number.
- **Boolean Validation**: Checks if the value is a valid boolean and if it is not empty when required.
- **Date Validation**: Checks if the date is in ISO 8601 format and if it is not empty when required.
- **Enum Validation**: Checks if the value is one of the predefined enum options and if it is not empty when required.

### Error Handling

The node returns a JSON object with the following structure:

```json
{
    "isValid": true,
    "errors": [
        {
            "field": "field_name",
            "message": "Error message"
        }
    ]
}
```

- **isValid**: Indicates whether all validations passed.
- **errors**: An array of error messages for failed validations.

### Phone Validation (google-libphonenumber)

When `String Format` is set to `Phone Number`, the node uses google-libphonenumber to parse and validate:

- Region: ISO 3166-1 alpha-2 (e.g. AU, US, GB). Defaults to `ZZ` for unknown.
- Validation Modes: `Valid (Strict)`, `Possible (Lenient)`, `Valid For Region`, `Possible For Type`.
- Allowed Types: constrain accepted types (e.g. `MOBILE`). Optionally treat `FIXED_LINE_OR_MOBILE` as mobile.

If the node is in "Output Validation Results" mode, enabling `Include Phone Details` will add a `phoneDetails` array with enriched information per phone field:

```json
{
  "isValid": true,
  "errors": [],
  "phoneDetails": [
    {
      "name": "Customer Phone",
      "e164": "+61412345678",
      "national": "0412 345 678",
      "international": "+61 412 345 678",
      "region": "AU",
      "type": "MOBILE",
      "valid": true,
      "possible": true
    }
  ]
}
```

### Phone Rewrite/Format Mode

Set `Node Mode` to `Rewrite/Format Phone Numbers` to standardise phone numbers using google-libphonenumber. For each input configured with `Validation Type: String` and `String Format: Phone Number`, the node will format the provided value and add it onto the item under the configured output property.

- Options (per phone field):
  - `Rewrite Format` (default E.164): E.164, INTERNATIONAL, NATIONAL, RFC3966
  - `On Invalid` (default Leave As Is): leave-as-is, empty, null, error
  - `Keep Extension` (default true): when false, strips extension from the formatted output
  - `Output Property` (default `<name>Formatted`): property name to write result into
  - Respects `Phone Region` and custom region for parsing

- Output:
  - Augments each item with the formatted value at `Output Property`
  - Adds a `phoneRewrites` summary array when in rewrite mode with details (original, formatted, format, region, type, valid, possible, error)

This mode uses the same library and parsing rules as validation and is designed for reliable normalisation for downstream systems.

## Development

### Setup

1. Clone the repository.
2. Install dependencies:
    ```sh
    npm install
    ```
3. Build the project:
    ```sh
    npm run build
    ```

## Attribution

This project is a fork with substantial changes. Credit to the original author **cdmx1** (`https://github.com/cdmx1`) for the initial concept and implementation.

## License

Licensed under the Apache License, Version 2.0. See `LICENSE` for details. If you distribute modified versions, ensure you include appropriate attribution as required by Section 4 of the license.


