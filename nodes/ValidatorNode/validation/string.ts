import validator from 'validator';
import { PhoneNumberUtil, PhoneNumberType } from 'google-libphonenumber';
import { normalizePhoneInput } from './helpers';
import { isPhoneTypeAllowed, getPhoneTypeName } from './helpers';
import { InputField } from '../types';
import { FieldError, ValidationHandler } from './types';
import { appendCustomErrorMessage, buildRequiredMessage } from './helpers';

type ValidationResult = boolean | { isValid: boolean; error?: string };
type ValidationFunction = (value: string, field?: InputField) => ValidationResult;

const validationFunctions: Record<string, ValidationFunction> = {
  none: (str: string, field?: InputField) => {
    if (field?.stringMaxLength !== undefined && typeof field.stringMaxLength === 'number' && field.stringMaxLength >= 0) {
      if (str.length > field.stringMaxLength) {
        return {
          isValid: false,
          error: `String length must not exceed ${field.stringMaxLength} characters`,
        };
      }
    }
    return true;
  },
  email: (str: string, field?: InputField) =>
    validator.isEmail(str, {
      allow_display_name: field?.emailAllowDisplayName,
      require_display_name: field?.emailRequireDisplayName,
      allow_utf8_local_part: field?.emailAllowUtf8LocalPart,
      require_tld: field?.emailRequireTld,
      allow_ip_domain: field?.emailAllowIpDomain,
      ignore_max_length: field?.emailIgnoreMaxLength,
      domain_specific_validation: field?.emailDomainSpecificValidation,
    } as any),
  url: (str: string, field?: InputField) =>
    validator.isURL(str, {
      require_protocol: field?.urlRequireProtocol,
      require_tld: field?.urlRequireTld,
      allow_underscores: field?.urlAllowUnderscores,
      allow_trailing_dot: field?.urlAllowTrailingDot,
      allow_fragments: field?.urlAllowFragments,
      allow_query_components: field?.urlAllowQueryComponents,
      disallow_auth: field?.urlDisallowAuth,
      validate_length: field?.urlValidateLength,
    } as any),
  uuid: (str: string, field?: InputField) =>
    validator.isUUID(str, field?.uuidVersion && field.uuidVersion !== 'all' ? field.uuidVersion : undefined),
  alphanumeric: (str: string) => validator.isAlphanumeric(str),
  alpha: (str: string) => validator.isAlpha(str),
  numeric: (str: string) => validator.isNumeric(str),
  integer: (str: string) => validator.isInt(str),
  creditCard: (str: string) => validator.isCreditCard(str),
  mobilePhone: (str: string, field?: InputField) => {
    const phoneUtil = PhoneNumberUtil.getInstance();
    const selectedRegion = field?.phoneRegion === '__custom__' ? field?.phoneRegionCustom : field?.phoneRegion;
    const region = (selectedRegion || 'ZZ').toUpperCase();
    const withRegionText = (base: string) => (region && region !== 'ZZ' ? `${base} for region ${region}` : base);

    const validateWithRegion = (testRegion: string) => {
      try {
        const normalized = normalizePhoneInput(str);
        const number = phoneUtil.parseAndKeepRawInput(normalized || str, testRegion);

        const mode = field?.phoneValidationMode || 'valid';
        let modePasses = false;
        switch (mode) {
          case 'possible':
            modePasses = phoneUtil.isPossibleNumber(number);
            break;
          case 'validForRegion':
            modePasses = phoneUtil.isValidNumberForRegion(number, testRegion);
            break;
          case 'possibleForType': {
            if (!field?.phoneAllowedTypes || field.phoneAllowedTypes.length === 0) {
              modePasses = phoneUtil.isPossibleNumber(number);
              break;
            }
            modePasses = (field.phoneAllowedTypes as string[]).some((allowed) => {
              const enumType = PhoneNumberType[allowed as keyof typeof PhoneNumberType];
              return phoneUtil.isPossibleNumberForType(number, enumType);
            });

            // If possibleForType validation failed, provide specific type mismatch error
            if (!modePasses) {
              const detectedType = phoneUtil.getNumberType(number);
              const detectedLabel = getPhoneTypeName(detectedType);
              const allowedList = (field.phoneAllowedTypes as string[]).join(', ');
              const base = `Allowed types mismatch${testRegion && testRegion !== 'ZZ' ? ` for region ${testRegion}` : ''}: expected one of: ${allowedList}; got ${detectedLabel}`;
              return { isValid: false, error: base };
            }
            break;
          }
          case 'valid':
          default:
            modePasses = phoneUtil.isValidNumber(number);
            break;
        }

        if (!modePasses) {
          // Provide specific error based on validation mode (mode already set above)
          let errorMessage = 'Value must be a valid phone number';
          if (mode === 'possible') {
            errorMessage = withRegionText('Value must be a possible phone number');
          } else if (mode === 'validForRegion') {
            errorMessage = `Value must be a valid phone number for region ${testRegion}`;
          } else if (mode === 'possibleForType') {
            // This case is handled earlier in the possibleForType branch with specific type mismatch error
            errorMessage = withRegionText('Value must be a possible phone number matching the allowed types');
          } else {
            errorMessage = withRegionText('Value must be a valid phone number');
          }
          return { isValid: false, error: errorMessage };
        }

        if (field?.phoneAllowedTypes && field.phoneAllowedTypes.length > 0) {
          const detectedType = phoneUtil.getNumberType(number);
          const satisfies = isPhoneTypeAllowed(
            field.phoneAllowedTypes as string[],
            detectedType,
            field?.phoneTreatFixedLineOrMobileAsMobile !== false,
          );
          if (!satisfies) {
            // Check if fallback types are defined and if detected type matches any fallback type
            const fallbackTypes = (field as any).phoneRewriteFallbackTypes as string[] | undefined;
            if (fallbackTypes && fallbackTypes.length > 0) {
              const satisfiesFallback = isPhoneTypeAllowed(
                fallbackTypes,
                detectedType,
                field?.phoneTreatFixedLineOrMobileAsMobile !== false,
              );
              if (satisfiesFallback) {
                // Type matches fallback - validation passes
                return { isValid: true };
              }
            }

            const allowedList = (field.phoneAllowedTypes as string[]).join(', ');
            const detectedLabel = getPhoneTypeName(detectedType);
            const base = `Allowed types mismatch${testRegion && testRegion !== 'ZZ' ? ` for region ${testRegion}` : ''}: expected one of: ${allowedList}; got ${detectedLabel}`;
            return { isValid: false, error: base };
          }
        }

        return { isValid: true };
      } catch (err) {
        // Provide error message from exception if available
        const errorMessage = err instanceof Error ? err.message : 'Unknown error parsing phone number';
        return { isValid: false, error: withRegionText(`Invalid phone number format: ${errorMessage}`) };
      }
    };

    // Try with the specified region first
    const result = validateWithRegion(region);
    if (result.isValid) return true;
    if (result.error) return { isValid: false, error: result.error }; // Type mismatch error should be returned immediately

    // If region is ZZ and validation failed, try common regions as fallback
    if (region === 'ZZ') {
      const fallbackRegions = ['AU', 'US', 'UK', 'CA', 'NZ', 'DE', 'FR', 'IT', 'ES', 'JP', 'IN', 'BR'];
      for (const fallbackRegion of fallbackRegions) {
        const fallbackResult = validateWithRegion(fallbackRegion);
        if (fallbackResult.isValid) {
          return true; // Valid in at least one common region
        }
        if (fallbackResult.error) {
          return { isValid: false, error: fallbackResult.error }; // Type mismatch error should be returned immediately
        }
      }
    }

    // If we get here, validation failed for all attempted regions
    return { isValid: false, error: withRegionText('Value must be a valid phone number. For national format numbers (e.g., 0421583961), consider setting a specific region (e.g., AU) instead of ZZ.') };
  },
  postalCode: (str: string, field?: InputField) => {
    const selected = field?.postalCodeLocale === '__custom__' ? field?.postalCodeLocaleCustom : field?.postalCodeLocale;
    return (validator as any).isPostalCode(str, (selected as any) || 'any');
  },
  ipAddress: (str: string) => validator.isIP(str),
  ipv4Address: (str: string) => validator.isIP(str, 4),
  ipv6Address: (str: string) => validator.isIP(str, 6),
  macAddress: (str: string) => validator.isMACAddress(str),
  jwt: validator.isJWT,
  base64: (str: string) => validator.isBase64(str),
  hexColor: validator.isHexColor,
  isbn: (str: string, field?: InputField) =>
    validator.isISBN(str, field?.isbnVersion && field.isbnVersion !== 'both' ? (field.isbnVersion as any) : undefined),
  strongPassword: (str: string, field?: InputField) =>
    validator.isStrongPassword(str, {
      minLength: field?.strongPasswordMinLength,
      minLowercase: field?.strongPasswordMinLowercase,
      minUppercase: field?.strongPasswordMinUppercase,
      minNumbers: field?.strongPasswordMinNumbers,
      minSymbols: field?.strongPasswordMinSymbols,
      returnScore: field?.strongPasswordReturnScore,
    } as any),
  json: validator.isJSON,
  mongoId: validator.isMongoId,
  hexadecimal: validator.isHexadecimal,
  fqdn: (str: string, field?: InputField) =>
    validator.isFQDN(str, {
      require_tld: field?.fqdnRequireTld,
      allow_underscores: field?.fqdnAllowUnderscores,
      allow_trailing_dot: field?.fqdnAllowTrailingDot,
      allow_numeric_tld: field?.fqdnAllowNumericTld,
      allow_wildcard: field?.fqdnAllowWildcard,
    } as any),
  port: validator.isPort,
  semver: validator.isSemVer,
  slug: validator.isSlug,
  currency: (str: string, field?: InputField) =>
    validator.isCurrency(str, {
      symbol: field?.currencySymbol,
      require_symbol: field?.currencyRequireSymbol,
      allow_negatives: field?.currencyAllowNegatives,
      allow_space_after_symbol: field?.currencyAllowSpaceAfterSymbol,
      allow_decimal: field?.currencyAllowDecimal,
      require_decimal: field?.currencyRequireDecimal,
    } as any),
  latlong: (str: string, field?: InputField) =>
    (validator as any).isLatLong(str, { checkDMS: field?.latlongCheckDMS }),
  btcAddress: validator.isBtcAddress,
  ethereumAddress: validator.isEthereumAddress,
  bic: validator.isBIC,
  iban: (str: string) => validator.isIBAN(str),
  vat: (str: string, field?: InputField) => {
    const selected = field?.vatCountryCode === '__custom__' ? field?.vatCountryCodeCustom : field?.vatCountryCode;
    return validator.isVAT(str, selected || 'any');
  },
  taxId: (str: string, field?: InputField) => {
    const selected = field?.taxIdLocale === '__custom__' ? field?.taxIdLocaleCustom : field?.taxIdLocale;
    return validator.isTaxID(str, selected || 'en-US');
  },
  mimeType: validator.isMimeType,
  hash: (str: string, field?: InputField) => validator.isHash(str, field?.hashAlgorithm || 'sha256'),
  ipRange: (str: string) => validator.isIPRange(str),
  iso8601: (str: string, field?: InputField) =>
    validator.isISO8601(str, { strict: field?.isoStrict, strictSeparator: field?.isoStrictSeparator } as any),
  mailtoUri: (str: string) => (validator as any).isMailtoURI(str),
  md5: validator.isMD5,
  rfc3339: validator.isRFC3339,
  time: (str: string, field?: InputField) =>
    validator.isTime(str, { hourFormat: field?.timeHourFormat, mode: field?.timeMode } as any),
};

const formatDescriptions: Record<string, string> = {
  email: 'a valid email address',
  url: 'a valid URL',
  uuid: 'a valid UUID',
  alphanumeric: 'letters and numbers only',
  alpha: 'letters only',
  numeric: 'a valid number',
  integer: 'a whole number',
  creditCard: 'a valid credit card number',
  mobilePhone: 'a valid mobile phone number',
  postalCode: 'a valid postal code',
  ipAddress: 'a valid IP address (IPv4 or IPv6)',
  ipv4Address: 'a valid IPv4 address',
  ipv6Address: 'a valid IPv6 address',
  macAddress: 'a valid MAC address',
  jwt: 'a valid JSON Web Token',
  base64: 'a valid base64 encoded string',
  hexColor: 'a valid hexadecimal color code',
  isbn: 'a valid ISBN',
  strongPassword: 'a strong password',
  json: 'valid JSON',
  mongoId: 'a valid MongoDB ObjectId',
  hexadecimal: 'a valid hexadecimal string',
  fqdn: 'a valid fully qualified domain name',
  port: 'a valid port number (1-65535)',
  semver: 'a valid semantic version (e.g., 1.2.3)',
  slug: 'a valid URL slug (kebab-case)',
  currency: 'a valid currency amount',
  latlong: 'valid latitude/longitude coordinates',
  btcAddress: 'a valid Bitcoin address',
  ethereumAddress: 'a valid Ethereum address',
  bic: 'a valid BIC/SWIFT code',
  iban: 'a valid International Bank Account Number',
  vat: 'a valid VAT number',
  taxId: 'a valid tax identification number',
  mimeType: 'a valid MIME type (e.g., text/html)',
  hash: 'a valid hash',
  ipRange: 'a valid IP address range (CIDR notation)',
  iso8601: 'a valid ISO 8601 date',
  mailtoUri: 'a valid mailto URI',
  md5: 'a valid MD5 hash',
  rfc3339: 'a valid RFC 3339 date',
  time: 'a valid time format',
  regex: 'text matching the specified pattern',
};

function validateStringFormat(
  format: string,
  value: string,
  _customErrorMessage?: string,
  regexPattern?: string,
  field?: InputField,
): { isValid: boolean; error?: string } {
  try {
    // No special-case branch for mobilePhone here; the validator itself returns structured results

    if (format === 'regex') {
      if (!regexPattern) {
        return {
          isValid: false,
          error: appendCustomErrorMessage('Regex pattern is required for regex validation', field),
        };
      }
      const isValid = validator.matches(value, regexPattern);
      if (!isValid) {
        const description = formatDescriptions[format] || `valid ${format} format`;
        return {
          isValid: false,
          error: appendCustomErrorMessage(`Value must be ${description}`, field),
        };
      }
      return { isValid: true };
    }

    const validatorFn = validationFunctions[format];
    if (!validatorFn) {
      return {
        isValid: false,
        error: appendCustomErrorMessage(`Unknown validation format: ${format}`, field),
      };
    }

    const result = validatorFn(value, field);
    if (typeof result === 'object') {
      if (!result.isValid) {
        const fallback = formatDescriptions[format]
          ? `Value must be ${formatDescriptions[format]}`
          : `Value must be valid ${format} format`;
        return { isValid: false, error: appendCustomErrorMessage(result.error || fallback, field) };
      }
      return { isValid: true };
    }
    if (!result) {
      const description = formatDescriptions[format] || `valid ${format} format`;
      return { isValid: false, error: appendCustomErrorMessage(`Value must be ${description}`, field) };
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: appendCustomErrorMessage(
        `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        field,
      ),
    };
  }
}

export const handleStringValidation: ValidationHandler = (field: InputField): FieldError[] => {
  const { name, required, stringData, stringFormat, regexPattern } = field;

  const valueToValidate = stringData || '';
  const errors: FieldError[] = [];

  // If field is not required and value is empty/null, skip validation entirely
  if (!required && (stringData === null || stringData === undefined || stringData === '')) {
    return errors;
  }

  if (required && valueToValidate === '') {
    errors.push({ field: name, message: appendCustomErrorMessage(buildRequiredMessage(field), field) });
    return errors;
  }

  if (valueToValidate !== '' && stringFormat && stringFormat !== 'none') {
    const formatValidation = validateStringFormat(
      stringFormat,
      valueToValidate,
      undefined,
      regexPattern,
      field,
    );
    if (!formatValidation.isValid) {
      errors.push({ field: name, message: formatValidation.error || 'Validation failed' });
    }
  }

  // Check max length for 'none' format
  if (valueToValidate !== '' && stringFormat === 'none' && field?.stringMaxLength !== undefined) {
    const maxLengthValidation = validateStringFormat('none', valueToValidate, undefined, undefined, field);
    if (!maxLengthValidation.isValid) {
      errors.push({ field: name, message: maxLengthValidation.error || 'Validation failed' });
    }
  }

  return errors;
};


