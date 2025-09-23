import { InputField } from './types';
import { getValidationHandler } from './validation';
import { FieldError } from './validation/types';

export function validateInputFields(inputFields: InputField[]): { isValid: boolean; errors: Array<{ field: string; message: string }> } {
  let allErrors: FieldError[] = [];

  for (let i = 0; i < inputFields.length; i++) {
    const field = inputFields[i];
    const handler = getValidationHandler(field.validationType);

    if (!handler) {
      allErrors.push({ field: field.name, message: `Unsupported validation type: ${field.validationType}` });
      continue;
    }

    const fieldErrors = handler(field);
    if (fieldErrors.length) {
      allErrors = allErrors.concat(fieldErrors);
    }
  }

  return { isValid: allErrors.length === 0, errors: allErrors };
}
