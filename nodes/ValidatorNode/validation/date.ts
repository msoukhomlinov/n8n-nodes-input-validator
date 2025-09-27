import validator from 'validator';
import { InputField } from '../types';
import { FieldError, ValidationHandler } from './types';
import { appendCustomErrorMessage, buildRequiredMessage } from './helpers';

export const handleDateValidation: ValidationHandler = (field: InputField): FieldError[] => {
  const { name, required, dateData } = field;
  const errors: FieldError[] = [];

  const valueToValidate = dateData || '';

  if (required && valueToValidate === '') {
    errors.push({ field: name, message: appendCustomErrorMessage(buildRequiredMessage(field), field) });
    return errors;
  }

  if (valueToValidate !== '' && !validator.isISO8601(valueToValidate)) {
    errors.push({ field: name, message: appendCustomErrorMessage('Invalid date format (must be ISO 8601)', field) });
  }

  return errors;
};


