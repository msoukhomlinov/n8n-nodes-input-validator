export interface InputField {
    name: string; // New property for naming the validation
    validationType: 'string' | 'number' | 'boolean' | 'date' | 'enum';
    required: boolean;
    stringData?: string;
    numberData?: number;
    booleanData?: boolean;
    dateData?: string;
    enumValues?: string;
    stringFormat?:
        | 'none'           // No specific format validation
        | 'email'          // Email addresses
        | 'url'            // URLs and URIs
        | 'uuid'           // UUIDs (all versions)
        | 'alphanumeric'   // Letters and numbers only
        | 'alpha'          // Letters only
        | 'numeric'        // Numbers only (including decimals)
        | 'integer'        // Whole numbers only
        | 'creditCard'     // Credit card numbers
        | 'mobilePhone'    // Mobile phone numbers (international)
        | 'postalCode'     // Postal/ZIP codes (international)
        | 'ipAddress'      // IP addresses (v4 and v6)
        | 'ipv4Address'    // IPv4 addresses only
        | 'ipv6Address'    // IPv6 addresses only
        | 'macAddress'     // MAC addresses
        | 'jwt'            // JSON Web Tokens
        | 'base64'         // Base64 encoded strings
        | 'hexColor'       // Hexadecimal color codes
        | 'isbn'           // ISBN book identifiers
        | 'strongPassword' // Strong password validation
        | 'json'           // Valid JSON strings
        | 'mongoId'        // MongoDB ObjectId
        | 'hexadecimal'    // Hexadecimal strings
        // High-Impact Technical
        | 'fqdn'           // Fully Qualified Domain Names
        | 'port'           // Network port numbers (1-65535)
        | 'semver'         // Semantic versioning (1.2.3)
        | 'slug'           // URL slugs (kebab-case)
        | 'currency'       // Currency amounts with formatting
        | 'latlong'        // Latitude/longitude coordinates
        | 'btcAddress'     // Bitcoin addresses
        | 'ethereumAddress' // Ethereum addresses
        // Business & Financial
        | 'bic'            // Bank Identifier Codes (SWIFT)
        | 'iban'           // International Bank Account Numbers
        | 'vat'            // VAT numbers (European tax IDs)
        | 'taxId'          // Tax identification numbers
        | 'mimeType'       // MIME types (text/html, image/png)
        // Additional Specialized
        | 'hash'           // Various hash formats
        | 'ipRange'        // IP address ranges (CIDR notation)
        | 'iso8601'        // ISO 8601 date format
        | 'mailtoUri'      // Mailto URI format
        | 'md5'            // MD5 hash format specifically
        | 'rfc3339'        // RFC3339 date format
        | 'time'           // Time formats
        | 'regex';         // Custom regex pattern matching
    numberValidationType?: 'none' | 'min' | 'max' | 'range' | 'oneOf';
    minValue?: number;
    maxValue?: number;
    oneOfValues?: string;
    regexPattern?: string;
    customErrorMessage?: string;
    // Custom error composition controls
    useCustomErrorMessage?: boolean;
    customMessagePlacement?: 'append' | 'prepend' | 'replace';
    customMessageAsSentence?: boolean; // when true, join as new sentence instead of pipe

    // String validator option fields (subset of validator.js options for usability)
    // Email options
    emailAllowDisplayName?: boolean;
    emailRequireDisplayName?: boolean;
    emailAllowUtf8LocalPart?: boolean;
    emailRequireTld?: boolean;
    emailAllowIpDomain?: boolean;
    emailIgnoreMaxLength?: boolean;
    emailDomainSpecificValidation?: boolean;

    // URL options
    urlRequireProtocol?: boolean;
    urlRequireTld?: boolean;
    urlAllowUnderscores?: boolean;
    urlAllowTrailingDot?: boolean;
    urlAllowFragments?: boolean;
    urlAllowQueryComponents?: boolean;
    urlDisallowAuth?: boolean;
    urlValidateLength?: boolean;

    // FQDN options
    fqdnRequireTld?: boolean;
    fqdnAllowUnderscores?: boolean;
    fqdnAllowTrailingDot?: boolean;
    fqdnAllowNumericTld?: boolean;
    fqdnAllowWildcard?: boolean;

    // UUID and ISBN specific versions
    uuidVersion?: '3' | '4' | '5' | 'all';
    isbnVersion?: '10' | '13' | 'both';

    // Locale-based validators
    postalCodeLocale?: string;  // 'any' or specific country code per validator.js

    // Hash algorithm selector
    hashAlgorithm?:
      | 'md4'
      | 'md5'
      | 'sha1'
      | 'sha256'
      | 'sha384'
      | 'sha512'
      | 'ripemd128'
      | 'ripemd160'
      | 'tiger128'
      | 'tiger160'
      | 'tiger192'
      | 'crc32'
      | 'crc32b';

    // ISO8601 options
    isoStrict?: boolean;
    isoStrictSeparator?: boolean;

    // Time options
    timeHourFormat?: 'hour24' | 'hour12';
    timeMode?: 'default' | 'withSeconds';

    // Currency options (subset)
    currencySymbol?: string;
    currencyRequireSymbol?: boolean;
    currencyAllowNegatives?: boolean;
    currencyAllowSpaceAfterSymbol?: boolean;
    currencyAllowDecimal?: boolean;
    currencyRequireDecimal?: boolean;

    // Lat/Long options
    latlongCheckDMS?: boolean;

    // Strong password options (subset)
    strongPasswordMinLength?: number;
    strongPasswordMinLowercase?: number;
    strongPasswordMinUppercase?: number;
    strongPasswordMinNumbers?: number;
    strongPasswordMinSymbols?: number;
    strongPasswordReturnScore?: boolean;

    // VAT and TaxID locales
    vatCountryCode?: string; // 'any' or ISO codes
    taxIdLocale?: string; // defaults 'en-US'

    // Phone number validation (google-libphonenumber)
    /**
     * Default region to use when parsing numbers without a leading + country code.
     * Use ISO 3166-1 alpha-2 (e.g., 'AU', 'US'). Use 'ZZ' for unknown region (international only).
     */
    phoneRegion?: string;
    /**
     * Validation mode to apply when validating phone numbers.
     * - valid: strict validity (isValidNumber)
     * - possible: lenient possibility check (isPossibleNumber)
     * - validForRegion: strict validity within the specified region (isValidNumberForRegion)
     * - possibleForType: possibility check constrained to the selected types (isPossibleNumberForType)
     */
    phoneValidationMode?: 'valid' | 'possible' | 'validForRegion' | 'possibleForType';
    /**
     * Allowed number types. If provided, the parsed number's type must be one of these.
     * Values mirror google-libphonenumber's PhoneNumberType enum.
     */
    phoneAllowedTypes?: Array<
      | 'FIXED_LINE'
      | 'MOBILE'
      | 'FIXED_LINE_OR_MOBILE'
      | 'TOLL_FREE'
      | 'PREMIUM_RATE'
      | 'SHARED_COST'
      | 'VOIP'
      | 'PERSONAL_NUMBER'
      | 'PAGER'
      | 'UAN'
      | 'VOICEMAIL'
      | 'UNKNOWN'
    >;
    /**
     * When true, treat FIXED_LINE_OR_MOBILE as satisfying MOBILE when MOBILE is allowed.
     * Enabled by default to behave intuitively for common mobile-only validations.
     */
    phoneTreatFixedLineOrMobileAsMobile?: boolean;

    // Phone rewrite/format options (used when node mode is rewrite-phone)
    /**
     * Desired output format when rewriting phone numbers.
     * Mirrors google-libphonenumber PhoneNumberFormat enum.
     */
    phoneRewriteFormat?: 'E164' | 'INTERNATIONAL' | 'NATIONAL' | 'RFC3966';
    /**
     * Behaviour when the number cannot be parsed/validated for formatting.
     * - leave-as-is: keep original input
     * - empty: set to empty string
     * - null: set to null
     * - error: throw and fail the item
     */
    phoneRewriteOnInvalid?: 'leave-as-is' | 'empty' | 'null' | 'error';
    /**
     * Try to preserve and include extensions when formatting (where applicable, e.g. RFC3966).
     */
    phoneRewriteKeepExtension?: boolean;
    /**
     * Property name to write the formatted output to. Defaults to `<name>Formatted`.
     */
    phoneRewriteOutputProperty?: string;
    /**
     * Control the digit group separator for INTERNATIONAL/NATIONAL formats.
     */
    phoneRewriteSeparatorMode?: 'space' | 'hyphen' | 'custom';
    /**
     * Custom separator string when mode is 'custom'. Defaults to space when empty.
     */
    phoneRewriteSeparatorCustom?: string;

    // Custom fallback values for picklists
    phoneRegionCustom?: string;
    postalCodeLocaleCustom?: string;
    vatCountryCodeCustom?: string;
    taxIdLocaleCustom?: string;
}
