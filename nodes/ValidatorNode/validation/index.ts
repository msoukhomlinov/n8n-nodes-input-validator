import { registerValidationHandler } from './registry';
import { handleStringValidation } from './string';
import { handleNumberValidation } from './number';
import { handleBooleanValidation } from './boolean';
import { handleDateValidation } from './date';
import { handleEnumValidation } from './enum';

// Register default handlers
registerValidationHandler('string', handleStringValidation);
registerValidationHandler('number', handleNumberValidation);
registerValidationHandler('boolean', handleBooleanValidation);
registerValidationHandler('date', handleDateValidation);
registerValidationHandler('enum', handleEnumValidation);

export * from './registry';
export * from './types';


