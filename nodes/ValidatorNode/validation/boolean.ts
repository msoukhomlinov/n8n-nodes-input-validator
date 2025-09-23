import { InputField } from '../types';
import { FieldError, ValidationHandler } from './types';
import { appendCustomErrorMessage } from './helpers';

export const handleBooleanValidation: ValidationHandler = (field: InputField): FieldError[] => {
  const { name, required, booleanData } = field;
  const errors: FieldError[] = [];

  if (required && booleanData === undefined) {
    errors.push({ field: name, message: appendCustomErrorMessage('Value must be a boolean', field) });
  }

  return errors;
};


