// Shared helper utilities for validation modules

import { InputField } from '../types';

export function appendCustomErrorMessage(baseMessage: string, field?: InputField): string {
  const useCustom = field?.useCustomErrorMessage === true;
  const custom = (field?.customErrorMessage || '').trim();
  if (!useCustom || !custom) {
    return baseMessage;
  }

  const placement = field?.customMessagePlacement || 'append';
  const asSentence = field?.customMessageAsSentence === true;

  if (placement === 'replace') {
    return custom;
  }

  const separator = asSentence ? ' SENTENCE_SEP ' : ' | ';
  let composed: string;
  if (placement === 'prepend') {
    composed = `${custom}${separator}${baseMessage}`;
  } else {
    composed = `${baseMessage}${separator}${custom}`;
  }

  if (asSentence) {
    const ensureSentence = (text: string) => /[.!?]\s*$/.test(text) ? text.trim() : `${text.trim()}.`;
    const [first, second] = composed.split(' SENTENCE_SEP ');
    return `${ensureSentence(first)} ${second.trim()}`;
  }

  return composed;
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

function getPhoneTypeName(typeEnum: number): string {
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


