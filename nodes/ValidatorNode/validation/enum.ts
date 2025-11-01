import validator from 'validator';
import { InputField } from '../types';
import { FieldError, ValidationHandler } from './types';
import { appendCustomErrorMessage, buildRequiredMessage } from './helpers';

export const handleEnumValidation: ValidationHandler = (field: InputField): FieldError[] => {
  const { name, required, stringData, enumValues } = field;
  const errors: FieldError[] = [];

  const valueToValidate = stringData || '';
  const enumValuesArray = (enumValues || '').split(',').map(v => v.trim()).filter(v => v !== '');

  // If field is not required and value is empty/null, skip validation entirely
  if (!required && (stringData === null || stringData === undefined || stringData === '')) {
    return errors;
  }

  // Validate enumValues is configured
  if (!enumValues || enumValues.trim() === '' || enumValuesArray.length === 0) {
    errors.push({ field: name, message: appendCustomErrorMessage('Enum validation requires at least one valid enum value', field) });
    return errors;
  }

  if (required && valueToValidate === '') {
    errors.push({ field: name, message: appendCustomErrorMessage(buildRequiredMessage(field), field) });
    return errors;
  }

  if (valueToValidate !== '' && !validator.isIn(valueToValidate, enumValuesArray)) {
    errors.push({ field: name, message: appendCustomErrorMessage(`Value must be one of: ${enumValuesArray.join(', ')}`, field) });
  }

  return errors;
};


