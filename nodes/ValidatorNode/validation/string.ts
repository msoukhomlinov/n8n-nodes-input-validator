import validator from 'validator';
import { PhoneNumberUtil, PhoneNumberType } from 'google-libphonenumber';
import { normalizePhoneInput } from './helpers';
import { InputField } from '../types';
import { FieldError, ValidationHandler } from './types';
import { appendCustomErrorMessage } from './helpers';

type ValidationFunction = (value: string, field?: InputField) => boolean;

const validationFunctions: Record<string, ValidationFunction> = {
  none: () => true,
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
    try {
      const normalized = normalizePhoneInput(str);
      const number = phoneUtil.parseAndKeepRawInput(normalized || str, region);

      // Choose validation mode
      const mode = field?.phoneValidationMode || 'valid';
      let passes = false;
      switch (mode) {
        case 'possible':
          passes = phoneUtil.isPossibleNumber(number);
          break;
        case 'validForRegion':
          passes = phoneUtil.isValidNumberForRegion(number, region);
          break;
        case 'possibleForType': {
          if (!field?.phoneAllowedTypes || field.phoneAllowedTypes.length === 0) {
            passes = phoneUtil.isPossibleNumber(number);
            break;
          }
          passes = (field.phoneAllowedTypes as string[]).some((allowed) => {
            const enumType = PhoneNumberType[allowed as keyof typeof PhoneNumberType];
            return phoneUtil.isPossibleNumberForType(number, enumType);
          });
          break;
        }
        case 'valid':
        default:
          passes = phoneUtil.isValidNumber(number);
          break;
      }

      if (!passes) return false;

      // Apply allowed types filter if provided (common for 'MOBILE only' etc.)
      if (field?.phoneAllowedTypes && field.phoneAllowedTypes.length > 0) {
        const type = phoneUtil.getNumberType(number);
        const ok = (field.phoneAllowedTypes as string[]).some((allowed) => {
          if (allowed === 'MOBILE' && field?.phoneTreatFixedLineOrMobileAsMobile !== false) {
            return (
              type === PhoneNumberType.MOBILE ||
              type === PhoneNumberType.FIXED_LINE_OR_MOBILE
            );
          }
          return PhoneNumberType[allowed as keyof typeof PhoneNumberType] === type;
        });
        if (!ok) return false;
      }

      return true;
    } catch (_) {
      return false;
    }
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

    const isValid = validatorFn(value, field);
    if (!isValid) {
      const description = formatDescriptions[format] || `valid ${format} format`;
      return {
        isValid: false,
        error: appendCustomErrorMessage(`Value must be ${description}`, field),
      };
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

  if (required && valueToValidate === '') {
    errors.push({ field: name, message: appendCustomErrorMessage('String cannot be empty', field) });
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

  return errors;
};


