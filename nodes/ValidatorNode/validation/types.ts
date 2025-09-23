import { InputField } from '../types';

export type FieldError = { field: string; message: string };

export type ValidationHandler = (field: InputField) => FieldError[];


