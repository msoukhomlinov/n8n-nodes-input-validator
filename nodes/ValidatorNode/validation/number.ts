import { InputField } from '../types';
import { FieldError, ValidationHandler } from './types';
import { appendCustomErrorMessage, buildRequiredMessage } from './helpers';

export const handleNumberValidation: ValidationHandler = (field: InputField): FieldError[] => {
  const {
    name,
    required,
    numberData,
    numberValidationType,
    minValue,
    maxValue,
    oneOfValues,
  } = field;

  const errors: FieldError[] = [];
  const valueToValidate = numberData;

  // If field is not required and value is null/undefined, skip validation entirely
  if (!required && (valueToValidate === null || valueToValidate === undefined)) {
    return errors;
  }

  if (required && (valueToValidate === undefined || valueToValidate === null)) {
    errors.push({ field: name, message: appendCustomErrorMessage(buildRequiredMessage(field), field) });
    return errors;
  }

  if (valueToValidate !== undefined && Number.isNaN(valueToValidate)) {
    errors.push({ field: name, message: appendCustomErrorMessage('Value must be a valid number', field) });
    return errors;
  }

  if (typeof valueToValidate === 'number') {
    switch (numberValidationType) {
    case 'min':
      if (minValue !== undefined && valueToValidate < minValue) {
        errors.push({
          field: name,
          message: appendCustomErrorMessage(`Value must be greater than or equal to ${minValue}`, field),
        });
      }
      break;
    case 'max':
      if (maxValue !== undefined && valueToValidate > maxValue) {
        errors.push({
          field: name,
          message: appendCustomErrorMessage(`Value must be less than or equal to ${maxValue}`, field),
        });
      }
      break;
    case 'range':
      if ((
        (minValue !== undefined && valueToValidate < minValue) ||
        (maxValue !== undefined && valueToValidate > maxValue)
      )) {
        errors.push({
          field: name,
          message: appendCustomErrorMessage(`Value must be between ${minValue} and ${maxValue}`, field),
        });
      }
      break;
    case 'oneOf':
      if (oneOfValues) {
        // Parse and filter out invalid number strings (NaN values)
        const parsedValues = oneOfValues.split(',').map(v => {
          const trimmed = v.trim();
          const parsed = parseFloat(trimmed);
          return { original: trimmed, parsed };
        });
        const validValues = parsedValues.filter(p => !Number.isNaN(p.parsed)).map(p => p.parsed);
        const invalidEntries = parsedValues.filter(p => Number.isNaN(p.parsed)).map(p => p.original);
        
        // Warn if oneOfValues contains invalid entries
        if (invalidEntries.length > 0 && validValues.length === 0) {
          errors.push({
            field: name,
            message: appendCustomErrorMessage(`Invalid oneOf configuration: no valid numbers found. Invalid entries: ${invalidEntries.join(', ')}`, field),
          });
          break;
        }
        
        if (validValues.length > 0 && !validValues.includes(valueToValidate)) {
          // Only include valid numeric values in error message
          errors.push({
            field: name,
            message: appendCustomErrorMessage(`Value must be one of: ${validValues.join(', ')}`, field),
          });
        }
      }
      break;
    }
  }

  return errors;
};


