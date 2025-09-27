import { InputField } from '../types';
import { FieldError, ValidationHandler } from './types';
import { appendCustomErrorMessage, buildRequiredMessage } from './helpers';

export const handleBooleanValidation: ValidationHandler = (field: InputField): FieldError[] => {
  const { name, required, booleanData } = field;
  const errors: FieldError[] = [];

  if (required && booleanData === undefined) {
    errors.push({ field: name, message: appendCustomErrorMessage(buildRequiredMessage(field), field) });
  }

  return errors;
};


