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
        const validValues = oneOfValues.split(',').map(v => parseFloat(v.trim()));
        if (!validValues.includes(valueToValidate)) {
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


