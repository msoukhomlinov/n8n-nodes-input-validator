import validator from 'validator';
import { InputField } from '../types';
import { FieldError, ValidationHandler } from './types';
import { appendCustomErrorMessage } from './helpers';

export const handleEnumValidation: ValidationHandler = (field: InputField): FieldError[] => {
  const { name, required, stringData, enumValues } = field;
  const errors: FieldError[] = [];

  const valueToValidate = stringData || '';
  const enumValuesArray = (enumValues || '').split(',').map(v => v.trim());

  if (required && valueToValidate === '') {
    errors.push({ field: name, message: appendCustomErrorMessage('Value cannot be empty', field) });
    return errors;
  }

  if (valueToValidate !== '' && !validator.isIn(valueToValidate, enumValuesArray)) {
    errors.push({ field: name, message: appendCustomErrorMessage(`Value must be one of: ${enumValuesArray.join(', ')}`, field) });
  }

  return errors;
};


