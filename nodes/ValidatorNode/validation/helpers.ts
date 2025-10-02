// Shared helper utilities for validation modules

import { InputField } from '../types';

export function appendCustomErrorMessage(baseMessage: string, field?: InputField): string {
  const custom = (field?.customErrorMessage || '').trim();
  if (!custom) {
    return baseMessage;
  }

  // Always use sentence logic (no pipe separators)
  const ensureSentence = (text: string) => /[.!?]\s*$/.test(text) ? text.trim() : `${text.trim()}.`;

  // Parse prefix indicators:
  // ! = replace standard message
  // ^ = prepend to standard message
  // (no prefix) = append to standard message
  if (custom.startsWith('!')) {
    // Replace: return only custom message (remove the ! prefix)
    const customText = custom.substring(1).trim();
    return customText;
  } else if (custom.startsWith('^')) {
    // Prepend: custom message first, then standard message
    const customText = custom.substring(1).trim();
    return `${ensureSentence(customText)} ${baseMessage.trim()}`;
  } else {
    // Append (default): standard message first, then custom message
    return `${ensureSentence(baseMessage)} ${custom.trim()}`;
  }
}

// Phone utilities
export function normalizePhoneInput(raw: string): string {
  if (!raw) return '';
  // First strip RFC3966 parameters like ;ext=123 or any other ;param
  let trimmed = raw.trim();
  const semicolonIndex = trimmed.indexOf(';');
  if (semicolonIndex !== -1) {
    trimmed = trimmed.slice(0, semicolonIndex);
  }
  // Remove common extension patterns at the end (ext, ext., extension, x, #)
  trimmed = trimmed.replace(/(?:ext\.?|extension|x|#)\s*[:.=\-]?\s*\d+$/i, '');
  // Remove whitespace and common separators, keep leading '+' and digits
  // Replace various unicode spaces with regular spaces then remove spaces, dashes, parentheses, dots
  const collapsed = trimmed
    .replace(/\s+/g, ' ')
    .replace(/[().\-\s]/g, '');
  // Ensure only leading '+' allowed; remove any other non-digits
  const hasPlus = collapsed.startsWith('+');
  const digits = collapsed.replace(/[^0-9+]/g, '');
  if (hasPlus) {
    // Keep single leading + and digits after
    return `+${digits.replace(/[^0-9]/g, '')}`;
  }
  return digits.replace(/[^0-9]/g, '');
}

export type PhoneInfo = {
  name: string;
  e164?: string;
  region?: string;
  type?: string;
  national?: string;
  international?: string;
  valid: boolean;
  possible: boolean;
  error?: string;
};

// Builds phone details using google-libphonenumber
import { PhoneNumberUtil, PhoneNumberType, PhoneNumberFormat } from 'google-libphonenumber';

export function getPhoneTypeName(typeEnum: number): string {
  switch (typeEnum) {
    case PhoneNumberType.FIXED_LINE:
      return 'FIXED_LINE';
    case PhoneNumberType.MOBILE:
      return 'MOBILE';
    case PhoneNumberType.FIXED_LINE_OR_MOBILE:
      return 'FIXED_LINE_OR_MOBILE';
    case PhoneNumberType.TOLL_FREE:
      return 'TOLL_FREE';
    case PhoneNumberType.PREMIUM_RATE:
      return 'PREMIUM_RATE';
    case PhoneNumberType.SHARED_COST:
      return 'SHARED_COST';
    case PhoneNumberType.VOIP:
      return 'VOIP';
    case PhoneNumberType.PERSONAL_NUMBER:
      return 'PERSONAL_NUMBER';
    case PhoneNumberType.PAGER:
      return 'PAGER';
    case PhoneNumberType.UAN:
      return 'UAN';
    case PhoneNumberType.VOICEMAIL:
      return 'VOICEMAIL';
    case PhoneNumberType.UNKNOWN:
    default:
      return 'UNKNOWN';
  }
}

// Centralised compatibility: expands allowed types to accept common equivalents
// - If allowed includes FIXED_LINE_OR_MOBILE, also accept MOBILE and FIXED_LINE
// - If allowed includes MOBILE or FIXED_LINE, also accept FIXED_LINE_OR_MOBILE (both directions)
// - "treatFixedLineOrMobileAsMobile" is kept for future toggles but behaviour remains bi-directional
export function isPhoneTypeAllowed(
  allowedTypes: string[],
  detectedType: number | string,
  _treatFixedLineOrMobileAsMobile: boolean = true,
): boolean {
  if (!allowedTypes || allowedTypes.length === 0) return true;

  const allowed = new Set<string>(allowedTypes);

  if (allowed.has('FIXED_LINE_OR_MOBILE')) {
    allowed.add('MOBILE');
    allowed.add('FIXED_LINE');
  }

  if (allowed.has('MOBILE') || allowed.has('FIXED_LINE')) {
    allowed.add('FIXED_LINE_OR_MOBILE');
  }

  const detectedLabel = typeof detectedType === 'string' ? detectedType : getPhoneTypeName(detectedType);
  return allowed.has(detectedLabel);
}

export function getPhoneInfo(value: string, field: InputField): PhoneInfo | undefined {
  try {
    const util = PhoneNumberUtil.getInstance();
    const selectedRegion =
      field.phoneRegion === '__custom__' ? (field.phoneRegionCustom || 'ZZ') : (field.phoneRegion || 'ZZ');
    const region = selectedRegion.toUpperCase();
    const normalized = normalizePhoneInput(value);
    const number = util.parseAndKeepRawInput(normalized || value, region);
    const valid = util.isValidNumber(number);
    const possible = util.isPossibleNumber(number);
    const typeEnum = util.getNumberType(number);
    const type = getPhoneTypeName(typeEnum);
    const detectedRegion = (util.getRegionCodeForNumber(number) || region || 'ZZ').toUpperCase();
    return {
      name: field.name,
      e164: valid ? util.format(number, PhoneNumberFormat.E164) : undefined,
      national: util.format(number, PhoneNumberFormat.NATIONAL),
      international: util.format(number, PhoneNumberFormat.INTERNATIONAL),
      region: detectedRegion,
      type,
      valid,
      possible,
    };
  } catch (err) {
    return {
      name: field.name,
      valid: false,
      possible: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}


// Enhanced required message builder
export function buildRequiredMessage(field: InputField): string {
  const { validationType, stringFormat, numberValidationType, minValue, maxValue, oneOfValues, enumValues, phoneRegion, phoneRegionCustom } = field;

  switch (validationType) {
    case 'string': {
      if (!stringFormat || stringFormat === 'none') {
        return 'Required string value';
      }

      // Handle special cases with additional context
      if (stringFormat === 'mobilePhone') {
        const selectedRegion = phoneRegion === '__custom__' ? phoneRegionCustom : phoneRegion;
        const region = (selectedRegion || 'ZZ').toUpperCase();
        return region && region !== 'ZZ'
          ? `Required mobile phone number for region ${region}`
          : 'Required mobile phone number';
      }

      if (stringFormat === 'regex') {
        return 'Required text matching the specified pattern';
      }

      // Use format descriptions for other types
      const formatDescriptions: Record<string, string> = {
        email: 'Required email address',
        url: 'Required URL',
        uuid: 'Required UUID',
        alphanumeric: 'Required alphanumeric text',
        alpha: 'Required alphabetic text',
        numeric: 'Required numeric string',
        integer: 'Required integer string',
        creditCard: 'Required credit card number',
        postalCode: 'Required postal code',
        ipAddress: 'Required IP address',
        ipv4Address: 'Required IPv4 address',
        ipv6Address: 'Required IPv6 address',
        macAddress: 'Required MAC address',
        jwt: 'Required JSON Web Token',
        base64: 'Required base64 encoded string',
        hexColor: 'Required hexadecimal color code',
        isbn: 'Required ISBN',
        strongPassword: 'Required strong password',
        json: 'Required JSON',
        mongoId: 'Required MongoDB ObjectId',
        hexadecimal: 'Required hexadecimal string',
        fqdn: 'Required fully qualified domain name',
        port: 'Required port number',
        semver: 'Required semantic version',
        slug: 'Required URL slug',
        currency: 'Required currency amount',
        latlong: 'Required latitude/longitude coordinates',
        btcAddress: 'Required Bitcoin address',
        ethereumAddress: 'Required Ethereum address',
        bic: 'Required BIC/SWIFT code',
        iban: 'Required International Bank Account Number',
        vat: 'Required VAT number',
        taxId: 'Required tax identification number',
        mimeType: 'Required MIME type',
        hash: 'Required hash',
        ipRange: 'Required IP address range',
        iso8601: 'Required ISO 8601 date',
        mailtoUri: 'Required mailto URI',
        md5: 'Required MD5 hash',
        rfc3339: 'Required RFC 3339 date',
        time: 'Required time'
      };

      return formatDescriptions[stringFormat] || `Required ${stringFormat} format`;
    }

    case 'number': {
      let base = 'Required number';

      if (numberValidationType) {
        switch (numberValidationType) {
          case 'min':
            if (minValue !== undefined) {
              base += ` (minimum: ${minValue})`;
            }
            break;
          case 'max':
            if (maxValue !== undefined) {
              base += ` (maximum: ${maxValue})`;
            }
            break;
          case 'range':
            if (minValue !== undefined && maxValue !== undefined) {
              base += ` (between ${minValue} and ${maxValue})`;
            }
            break;
          case 'oneOf':
            if (oneOfValues) {
              const validValues = oneOfValues.split(',').map(v => v.trim());
              base += ` (must be one of: ${validValues.join(', ')})`;
            }
            break;
        }
      }

      return base;
    }

    case 'boolean':
      return 'Required boolean value';

    case 'date':
      return 'Required date (ISO 8601 format)';

    case 'enum': {
      if (enumValues) {
        const enumValuesArray = enumValues.split(',').map(v => v.trim());
        return `Required value (must be one of: ${enumValuesArray.join(', ')})`;
      }
      return 'Required enum value';
    }

    default:
      return 'Required value';
  }
}

export function rewritePhone(
  value: string,
  field: InputField,
): {
  formatted?: string;
  format: 'E164' | 'INTERNATIONAL' | 'NATIONAL' | 'RFC3966';
  region?: string;
  type?: string;
  valid: boolean;
  possible: boolean;
  error?: string;
} {
  try {
    const util = PhoneNumberUtil.getInstance();
    const selectedRegion =
      field.phoneRegion === '__custom__' ? (field.phoneRegionCustom || 'ZZ') : (field.phoneRegion || 'ZZ');
    const region = selectedRegion.toUpperCase();

    // Parse raw to preserve extensions when present
    const number = util.parseAndKeepRawInput(value || '', region);

    const valid = util.isValidNumber(number);
    const possible = util.isPossibleNumber(number);
    const typeEnum = util.getNumberType(number);
    const type = getPhoneTypeName(typeEnum);
    const detectedRegion = (util.getRegionCodeForNumber(number) || region || 'ZZ').toUpperCase();

    const desiredFormat = (field.phoneRewriteFormat || 'E164') as 'E164' | 'INTERNATIONAL' | 'NATIONAL' | 'RFC3966';
    const enumFormat =
      desiredFormat === 'E164'
        ? PhoneNumberFormat.E164
        : desiredFormat === 'INTERNATIONAL'
        ? PhoneNumberFormat.INTERNATIONAL
        : desiredFormat === 'NATIONAL'
        ? PhoneNumberFormat.NATIONAL
        : PhoneNumberFormat.RFC3966;

    let formatted = util.format(number, enumFormat);

    // Optionally drop extension text from formatted output
    if (field.phoneRewriteKeepExtension === false) {
      if (desiredFormat === 'RFC3966') {
        formatted = formatted.replace(/;ext=\d+$/i, '');
      } else {
        // libphonenumber uses variations like ", ext. 1234" or " ext. 1234"
        formatted = formatted.replace(/\s*(,?\s*ext\.?\s*\d+)$|\s*(x\s*\d+)$/i, '');
      }
      formatted = formatted.trim();
    }

    // Apply custom separator for INTERNATIONAL/NATIONAL
    if (desiredFormat === 'INTERNATIONAL' || desiredFormat === 'NATIONAL') {
      const mode = field.phoneRewriteSeparatorMode || 'space';
      let sep = ' ';
      if (mode === 'hyphen') sep = '-';
      if (mode === 'custom') sep = (field.phoneRewriteSeparatorCustom ?? '').length ? (field.phoneRewriteSeparatorCustom as string) : ' ';
      // Replace groups of spaces or hyphens between digits with chosen separator, preserving leading + and country code spacing for INTERNATIONAL
      // First normalise to single spaces between groups
      const normalised = formatted.replace(/(\d)[\s\-]+(?=\d)/g, '$1 ');
      if (sep !== ' ') {
        formatted = normalised.replace(/(\d)\s+(?=\d)/g, `$1${sep}`);
      } else {
        formatted = normalised;
      }
    }

    return {
      formatted,
      format: desiredFormat,
      region: detectedRegion,
      type,
      valid,
      possible,
    };
  } catch (err) {
    return {
      format: (field.phoneRewriteFormat || 'E164') as 'E164' | 'INTERNATIONAL' | 'NATIONAL' | 'RFC3966',
      valid: false,
      possible: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}


