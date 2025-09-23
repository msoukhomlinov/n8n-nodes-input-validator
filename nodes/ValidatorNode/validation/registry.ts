import { ValidationHandler } from './types';

const registry: Record<string, ValidationHandler> = {};

export function registerValidationHandler(type: string, handler: ValidationHandler): void {
  registry[type] = handler;
}

export function getValidationHandler(type: string): ValidationHandler | undefined {
  return registry[type];
}

export function listValidationTypes(): string[] {
  return Object.keys(registry);
}


