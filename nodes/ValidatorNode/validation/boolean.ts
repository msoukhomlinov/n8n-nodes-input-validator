import { InputField } from '../types';
import { FieldError, ValidationHandler } from './types';
import { appendCustomErrorMessage, buildRequiredMessage } from './helpers';

export const handleBooleanValidation: ValidationHandler = (field: InputField): FieldError[] => {
  const { name, required, booleanData } = field;
  const errors: FieldError[] = [];

  // If field is not required and value is undefined/null, skip validation entirely
  if (!required && (booleanData === undefined || booleanData === null)) {
    return errors;
  }

  if (required && (booleanData === undefined || booleanData === null)) {
    errors.push({ field: name, message: appendCustomErrorMessage(buildRequiredMessage(field), field) });
  }

  return errors;
};


