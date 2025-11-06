import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
  IDataObject,
} from 'n8n-workflow';
import './validation'; // ensure handlers are registered
import { validateInputFields } from './validateInput';
import { InputField } from './types';
import { inputFieldValues, phoneRewriteValues } from './ui';
import { removeFieldAtPath } from './validation/helpers';

export class ValidatorNode implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Input Validator',
    name: 'inputValidator',
    group: ['transform'],
    version: 1,
    description: 'Validate strings, numbers, booleans, dates, enums, and phone numbers',
    defaults: {
      name: 'Input Validator',
    },
    icon: 'file:validation.svg',
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Node Mode',
        name: 'nodeMode',
        type: 'options',
        options: [
          {
            name: 'Output Items',
            value: 'output-items',
            description: 'Node will output items from input with isValid property included',
          },
        ],
        default: 'output-items',
      },
      {
        displayName: 'Inputs',
        name: 'inputs',
        type: 'fixedCollection',
        default: {},
        placeholder: 'Add Input',
        typeOptions: {
          multipleValues: true,
        },
        displayOptions: {
          show: {
            nodeMode: ['output-items'],
          },
        },
        options: [
          {
            name: 'inputFields',
            displayName: 'Input Fields',
            values: inputFieldValues,
          },
        ],
      },
      // New global toggle (placed at end per repo guidance) to control output payload in Output Items mode
      {
        displayName: 'Output only isValid',
        name: 'outputOnlyIsValid',
        type: 'boolean',
        default: false,
        description: 'When enabled, only output isValid and errors without outputting item data',
        displayOptions: {
          show: {
            nodeMode: ['output-items'],
          },
        },
      },
      {
        displayName: 'Enable Phone Rewrite',
        name: 'enablePhoneRewrite',
        type: 'boolean',
        default: false,
        description: 'When enabled, format phone numbers using google-libphonenumber with optional type realignment',
        displayOptions: {
          show: {
            nodeMode: ['output-items'],
          },
        },
      },
      {
        displayName: 'Omit Empty Fields',
        name: 'omitEmptyFields',
        type: 'boolean',
        default: false,
        description: 'When enabled, remove fields with null, undefined, or empty string values from the output',
        displayOptions: {
          show: {
            nodeMode: ['output-items'],
          },
        },
      },
      // On Invalid behavior for Output Items mode
      {
        displayName: 'On Invalid',
        name: 'onInvalid',
        type: 'options',
        options: [
          {
            name: 'Continue',
            value: 'continue',
            description: 'Pass through original data with validation errors included',
          },
          {
            name: 'Set Invalid Fields to Empty',
            value: 'set-empty',
            description: 'Set fields that fail validation to empty values (empty string, 0, false, etc.)',
          },
          {
            name: 'Set Invalid Fields to Null',
            value: 'set-null',
            description: 'Set fields that fail validation to null',
          },
          {
            name: 'Skip Field',
            value: 'skip-field',
            description: 'Remove the field that failed validation but continue to output the item',
          },
          {
            name: 'Skip Item',
            value: 'skip',
            description: 'Exclude the item from output when validation fails',
          },
          {
            name: 'Throw Error',
            value: 'error',
            description: 'Fail the entire item when any validation fails',
          },
        ],
        default: 'skip-field',
        description: 'What to do when validation fails for any field',
        displayOptions: {
          show: {
            nodeMode: ['output-items'],
          },
        },
      },
      // Phone rewrite inputs and related options (appended at end for stability)
      ...phoneRewriteValues,
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();

    const nodeMode = this.getNodeParameter('nodeMode', 0) as string;
    if (nodeMode !== 'output-items') {
      throw new NodeOperationError(this.getNode(), `Invalid node mode: ${nodeMode}. Supported mode is 'output-items'.`);
    }

    const outputOnlyIsValid = this.getNodeParameter('outputOnlyIsValid', 0, false) as boolean;

    const runPhoneRewrite = async (
      item: INodeExecutionData,
      itemIndex: number,
      inputFields: InputField[],
    ): Promise<{
      allValid: boolean;
      errors: Array<{ input?: string; error: string }>;
      rewrites: Array<Record<string, unknown>>;
      omitRewriteDetails: boolean;
    }> => {
      const passThrough = this.getNodeParameter('phoneRewritePassThrough', itemIndex, true) as boolean;
      const omitRewriteDetails = this.getNodeParameter('omitPhoneRewriteDetails', itemIndex, false) as boolean;
      const autoRealign = this.getNodeParameter('autoRealignMismatchedTypes', itemIndex, true) as boolean;
      const allowDuplicateAssignment = this.getNodeParameter('allowDuplicateAssignment', itemIndex, true) as boolean;

      const { rewritePhone, isPhoneTypeAllowed } = await import('./validation/helpers');

      const acceptsExpected = (expected: string[] | undefined, actual: string | undefined): boolean => {
        if (!expected || expected.length === 0 || !actual) return false;
        return isPhoneTypeAllowed(expected, (actual as unknown) as number, true) || expected.includes(actual);
      };

      const rewrites: Array<Record<string, unknown>> = [];
      const written: Record<string, unknown> = {};
      const preWrite: Array<{
        index: number;
        outputProp: string;
        originalValue: string;
        result: {
          formatted?: string;
          format: 'E164' | 'INTERNATIONAL' | 'NATIONAL' | 'RFC3966';
          region?: string;
          type?: string;
          valid: boolean;
          possible: boolean;
          error?: string;
        };
        expectedTypes?: string[];
        fallbackTypes?: string[];
        expectedTypeMatch?: boolean;
        field: InputField;
      }> = [];
      const errors: Array<{ input?: string; error: string }> = [];
      let allValid = true;

      const setNestedValue = (obj: Record<string, unknown>, path: string, value: unknown): void => {
        const keys = path.split('.');
        let current = obj;
        for (let i = 0; i < keys.length - 1; i++) {
          const key = keys[i];
          if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
            current[key] = {};
          }
          current = current[key] as Record<string, unknown>;
        }
        current[keys[keys.length - 1]] = value;
      };

      const phoneValidationFields = inputFields.filter(field =>
        field.validationType === 'string' &&
        field.stringFormat === 'mobilePhone' &&
        (field as unknown as { phoneEnableRewrite?: boolean }).phoneEnableRewrite === true
      );

      if (phoneValidationFields.length > 0) {
        for (let f = 0; f < phoneValidationFields.length; f++) {
          const field = phoneValidationFields[f];

          // Check if field is empty/null
          const isEmpty = field.stringData === null || field.stringData === undefined || field.stringData === '';
          const isEmptyAndOptional = !field.required && isEmpty;
          const isEmptyAndRequired = field.required && isEmpty;

          // For empty optional fields, create a placeholder result so they can be realignment targets
          let result: any;
          let originalValue: string;
          if (isEmptyAndOptional) {
            // Preserve original value (including null) for optional empty fields
            originalValue = field.stringData ?? '';
            result = {
              // Normalize null/undefined to empty string for output consistency
              formatted: field.stringData ?? '',
              format: (field.phoneRewriteFormat || 'E164') as 'E164' | 'INTERNATIONAL' | 'NATIONAL' | 'RFC3966',
              valid: false,
              possible: false,
              error: undefined, // No error for empty optional fields
              type: undefined,
            };
          } else if (isEmptyAndRequired) {
            // For empty required fields, create error result with proper message
            originalValue = field.stringData ?? '';
            const { buildRequiredMessage } = await import('./validation/helpers');
            result = {
              formatted: undefined,
              format: (field.phoneRewriteFormat || 'E164') as 'E164' | 'INTERNATIONAL' | 'NATIONAL' | 'RFC3966',
              valid: false,
              possible: false,
              error: buildRequiredMessage(field),
              type: undefined,
            };
          } else {
            originalValue = field.stringData ?? '';
            result = rewritePhone(originalValue, field);

            const fieldOnInvalid = field.phoneOnInvalid || 'use-global';
            if (result.error && fieldOnInvalid === 'error') {
              throw new NodeOperationError(this.getNode(), `Phone rewrite failed for '${field.name}': ${result.error}`);
            }
          }

          let outputProp = field.phoneRewriteOutputProperty?.trim();
          if (!outputProp) {
            outputProp = `${field.name}Formatted`;
          }

          preWrite.push({
            index: f,
            outputProp,
            originalValue,
            result,
            expectedTypes: (field.phoneAllowedTypes ?? []) as string[] | undefined,
            fallbackTypes: (field as unknown as { phoneRewriteFallbackTypes?: string[] }).phoneRewriteFallbackTypes,
            field,
          });

          const summary: Record<string, unknown> = {
            name: field.name,  // Use input field name for realignment tracking
            original: originalValue,
            outputProperty: outputProp,
            formatted: result.formatted,
            format: result.format,
            region: result.region,
            type: result.type,
            valid: result.valid,
            possible: result.possible,
            error: result.error,
          } as Record<string, unknown>;

          if (Array.isArray(field.phoneAllowedTypes) && field.phoneAllowedTypes.length) {
            summary.expectedTypes = field.phoneAllowedTypes;
            summary.expectedTypeMatch = acceptsExpected(field.phoneAllowedTypes as string[], result.type as string | undefined);
          }

          const fallbackTypes = (field as unknown as { phoneRewriteFallbackTypes?: string[] }).phoneRewriteFallbackTypes;
          if (Array.isArray(fallbackTypes) && fallbackTypes.length) {
            summary.fallbackTypes = fallbackTypes;
          }

          rewrites.push(summary);

          // Only count as invalid if it's NOT an empty optional field
          if (!isEmptyAndOptional && (!result.valid || result.error)) {
            allValid = false;
            if (result.error) {
              errors.push({ input: outputProp, error: result.error });
            }
          }
        }

        if (autoRealign) {
          const sourceUsed: Record<string, boolean> = {};
          for (let i = 0; i < preWrite.length; i++) {
            const target = preWrite[i];
            const targetSummary = rewrites[i];
            const expected = target.expectedTypes;
            const fallback = target.fallbackTypes;
            if (!targetSummary || !expected || expected.length === 0) continue;
            const alreadyAligned = targetSummary.expectedTypeMatch === true;
            if (alreadyAligned && allowDuplicateAssignment) continue;
            if (targetSummary.expectedTypeMatch === false || (!allowDuplicateAssignment && !(target.outputProp in written))) {
              for (let s = 0; s < preWrite.length; s++) {
                const source = preWrite[s];
                if (s === i) continue;
                const sourceType = source.result.type as string | undefined;
                if (!sourceType) continue;
                const sourceValue = source.result.formatted ?? source.originalValue;
                if (!allowDuplicateAssignment && sourceUsed[source.outputProp]) continue;
                const matchesExpected = acceptsExpected(expected, sourceType);
                const matchesFallback = Array.isArray(fallback) && fallback.length > 0 && acceptsExpected(fallback, sourceType);
                if (matchesExpected || matchesFallback) {
                  if (allowDuplicateAssignment || !(target.outputProp in written)) {
                    written[target.outputProp] = sourceValue;
                    targetSummary.correctionMade = true;
                    targetSummary.correctionSource = source.outputProp;
                    if (!matchesExpected && matchesFallback) {
                      targetSummary.fallbackUsed = true;
                    }
                    sourceUsed[source.outputProp] = true;
                  }
                  break;
                }
              }
            }
          }

          // Recalculate validity after realignment: entries with successful corrections should be valid
          allValid = true;
          errors.length = 0;
          for (let i = 0; i < rewrites.length; i++) {
            const summary = rewrites[i];
            const wasRealigned = summary.correctionMade === true;
            if (wasRealigned) {
              // Successfully realigned - this is now valid
              continue;
            }
            // Check if this was an empty optional field (should not count as invalid)
            const originalField = preWrite[i]?.field;
            const wasEmptyAndOptional = originalField && !originalField.required &&
              (originalField.stringData === null || originalField.stringData === undefined || originalField.stringData === '');
            if (wasEmptyAndOptional) {
              // Empty optional fields should not mark validation as failed
              continue;
            }
            // Not realigned - check original validity
            if (!summary.valid || summary.error) {
              allValid = false;
              if (summary.error) {
                errors.push({ input: summary.outputProperty as string, error: summary.error as string });
              }
            }
          }
        }

        for (let k = 0; k < preWrite.length; k++) {
          const staged = preWrite[k];
          if (staged.outputProp in written) continue;
          const res = staged.result;
          let valueToWrite: unknown = res.formatted;
          const mismatched = rewrites[k]?.expectedTypeMatch === false;
          const notRealigned = !(preWrite[k].outputProp in written);
          const fieldOnInvalid = staged.field.phoneOnInvalid || 'use-global';
          if ((res.error || (mismatched && notRealigned)) && fieldOnInvalid !== undefined && fieldOnInvalid !== 'use-global') {
            switch (fieldOnInvalid) {
              case 'empty':
                valueToWrite = '';
                break;
              case 'null':
                valueToWrite = null;
                break;
              case 'skip-field':
                // Skip writing this output property - don't add it to written
                continue;
              case 'leave-as-is':
              default:
                valueToWrite = staged.originalValue;
                break;
            }
          }
          // Only write if not skip-field (skip-field would have continued above)
          written[staged.outputProp] = valueToWrite as unknown;
        }

        const targetObj = passThrough ? JSON.parse(JSON.stringify(item.json)) : {};
        for (const [key, value] of Object.entries(written)) {
          if (key.includes('.')) {
            setNestedValue(targetObj as Record<string, unknown>, key, value);
          } else {
            (targetObj as Record<string, unknown>)[key] = value;
          }
        }
        item.json = targetObj as IDataObject;
      } else {
        for (let f = 0; f < inputFields.length; f++) {
          const field = inputFields[f];
          if (field.validationType === 'string' && field.stringFormat === 'mobilePhone' && field.stringData) {
            const { rewritePhone: rewritePhoneLegacy } = await import('./validation/helpers');
            const result = rewritePhoneLegacy(field.stringData, field);
            const outputProp = (field.phoneRewriteOutputProperty && field.phoneRewriteOutputProperty.trim())
              ? field.phoneRewriteOutputProperty.trim()
              : `${field.name}Formatted`;

            const fieldOnInvalid = field.phoneOnInvalid || 'use-global';
            if (result.error && fieldOnInvalid === 'error') {
              throw new NodeOperationError(this.getNode(), `Phone rewrite failed for '${field.name}': ${result.error}`);
            }

            let valueToWrite: unknown = result.formatted;
            if (!result.formatted && result.error && fieldOnInvalid !== 'use-global') {
              switch (fieldOnInvalid) {
                case 'empty':
                  valueToWrite = '';
                  break;
                case 'null':
                  valueToWrite = null;
                  break;
                case 'skip-field':
                  // Skip writing this output property
                  continue;
                case 'leave-as-is':
                default:
                  valueToWrite = field.stringData;
                  break;
              }
            }

            (item.json as Record<string, unknown>)[outputProp] = valueToWrite as unknown;

            rewrites.push({
              name: field.name,
              original: field.stringData,
              outputProperty: outputProp,
              formatted: result.formatted,
              format: result.format,
              region: result.region,
              type: result.type,
              valid: result.valid,
              possible: result.possible,
              error: result.error,
            } as Record<string, unknown>);

            if (!result.valid || result.error) {
              allValid = false;
              if (result.error) errors.push({ input: field.name, error: result.error });
            }
          }
        }
      }

      return {
        allValid,
        errors,
        rewrites,
        omitRewriteDetails,
      };
    };

    const returnData: INodeExecutionData[] = [];
    for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
      const item: INodeExecutionData = items[itemIndex];
      const inputFields = this.getNodeParameter(
        'inputs.inputFields',
        itemIndex,
        [],
      ) as InputField[];

      const { errors: validationErrors } = validateInputFields(inputFields);

      const setNestedValue = (obj: Record<string, unknown>, path: string, value: unknown): void => {
        const parts = path.split('.');
        let current: any = obj;

        for (let i = 0; i < parts.length - 1; i++) {
          const part = parts[i];
          if (!(part in current) || typeof current[part] !== 'object' || current[part] === null) {
            current[part] = {};
          }
          current = current[part];
        }

        const lastPart = parts[parts.length - 1];
        current[lastPart] = value;
      };

      // Handle field-level phone validation errors with field-specific onInvalid settings
      const phoneErrorsWithFieldHandling: string[] = [];
      const remainingValidationErrors = validationErrors.filter(error => {
        const field = inputFields.find(f => f.name === error.field);
        if (field && field.validationType === 'string' && field.stringFormat === 'mobilePhone') {
          const fieldOnInvalid = field.phoneOnInvalid || 'use-global';
          if (fieldOnInvalid !== 'use-global') {
            // Handle this phone field error with field-level setting
            phoneErrorsWithFieldHandling.push(error.field);
            switch (fieldOnInvalid) {
              case 'error':
                throw new NodeOperationError(this.getNode(), `Phone validation failed for '${field.name}': ${error.message}`);
              case 'leave-as-is':
                if (field.name.includes('.')) {
                  setNestedValue(item.json as Record<string, unknown>, field.name, field.stringData);
                } else {
                  (item.json as Record<string, unknown>)[field.name] = field.stringData;
                }
                break;
              case 'empty':
                if (field.name.includes('.')) {
                  setNestedValue(item.json as Record<string, unknown>, field.name, '');
                } else {
                  (item.json as Record<string, unknown>)[field.name] = '';
                }
                break;
              case 'null':
                if (field.name.includes('.')) {
                  setNestedValue(item.json as Record<string, unknown>, field.name, null);
                } else {
                  (item.json as Record<string, unknown>)[field.name] = null;
                }
                break;
              case 'skip-field': {
                removeFieldAtPath(item.json as Record<string, unknown>, field.name);
                break;
              }
            }
            return false; // Remove from validationErrors list as we've handled it
          }
        }
        return true; // Keep in validationErrors for global handling
      });

      const onInvalid = this.getNodeParameter('onInvalid', itemIndex, 'continue') as string;

      // Write ALL field values first (including those that failed validation)
      // This ensures original data structure is preserved (e.g., null values pass through)
      // The onInvalid logic below will then overwrite error fields as needed
      for (const field of inputFields) {
        // Skip fields that were already handled by field-level phone error handling
        if (phoneErrorsWithFieldHandling.includes(field.name)) {
          continue;
        }

        let valueToWrite;
        switch (field.validationType) {
          case 'string':
            valueToWrite = field.stringData;
            break;
          case 'number':
            valueToWrite = field.numberData;
            break;
          case 'boolean':
            valueToWrite = field.booleanData;
            break;
          case 'date':
            valueToWrite = field.dateData;
            break;
          case 'enum':
            valueToWrite = field.stringData;
            break;
        }

        if (field.name.includes('.')) {
          setNestedValue(item.json as Record<string, unknown>, field.name, valueToWrite);
        } else {
          (item.json as Record<string, unknown>)[field.name] = valueToWrite;
        }
      }

      if (remainingValidationErrors.length > 0 && onInvalid !== 'continue') {
        switch (onInvalid) {
          case 'error':
            throw new NodeOperationError(this.getNode(), `Validation failed for item ${itemIndex}: ${remainingValidationErrors.map(e => e.message).join('; ')}`);
          case 'skip':
            continue;
          case 'set-null':
            for (const error of remainingValidationErrors) {
              if (error.field.includes('.')) {
                setNestedValue(item.json as Record<string, unknown>, error.field, null);
              } else {
                (item.json as Record<string, unknown>)[error.field] = null;
              }
            }
            break;
          case 'set-empty':
            for (const error of remainingValidationErrors) {
              const field = inputFields.find(f => f.name === error.field);
              if (field) {
                let emptyValue;
                switch (field.validationType) {
                  case 'string':
                    emptyValue = '';
                    break;
                  case 'number':
                    emptyValue = 0;
                    break;
                  case 'boolean':
                    emptyValue = false;
                    break;
                  case 'date':
                    emptyValue = '';
                    break;
                  case 'enum':
                    emptyValue = '';
                    break;
                  default:
                    emptyValue = null;
                }
                if (error.field.includes('.')) {
                  setNestedValue(item.json as Record<string, unknown>, error.field, emptyValue);
                } else {
                  (item.json as Record<string, unknown>)[error.field] = emptyValue;
                }
              }
            }
            break;
          case 'skip-field': {
            for (const error of remainingValidationErrors) {
              removeFieldAtPath(item.json as Record<string, unknown>, error.field);
            }
            break;
          }
        }
      }

      const enablePhoneRewrite = this.getNodeParameter('enablePhoneRewrite', itemIndex, false) as boolean;
      let phoneRewriteResult:
        | {
            allValid: boolean;
            errors: Array<{ input?: string; error: string }>;
            rewrites: Array<Record<string, unknown>>;
            omitRewriteDetails: boolean;
          }
        | undefined;

      if (enablePhoneRewrite) {
        phoneRewriteResult = await runPhoneRewrite(item, itemIndex, inputFields);

        if (!phoneRewriteResult.omitRewriteDetails) {
          (item.json as Record<string, unknown>).phoneRewrites = phoneRewriteResult.rewrites.length
            ? phoneRewriteResult.rewrites
            : undefined;
        } else if ((item.json as Record<string, unknown>).hasOwnProperty('phoneRewrites')) {
          (item.json as Record<string, unknown>).phoneRewrites = undefined;
        }
      } else if ((item.json as Record<string, unknown>).hasOwnProperty('phoneRewrites')) {
        (item.json as Record<string, unknown>).phoneRewrites = undefined;
      }

      // Build a map of fields that were successfully realigned so we can annotate their errors
      const realignmentInfo = new Map<string, { correctedFrom: string; correctedTo: string }>();
      if (phoneRewriteResult && phoneRewriteResult.rewrites.length > 0) {
        for (const rewrite of phoneRewriteResult.rewrites) {
          if (rewrite.correctionMade === true) {
            realignmentInfo.set(rewrite.name as string, {
              correctedFrom: rewrite.correctionSource as string,
              correctedTo: rewrite.outputProperty as string,
            });
          }
        }
      }

      // Transform validation errors to show resolution for successfully realigned fields
      const transformedValidationErrors = validationErrors.map(error => {
        const field = inputFields.find(f => f.name === error.field);
        const realignment = realignmentInfo.get(error.field);

        // If this phone field was successfully realigned, annotate the error to show it was resolved
        if (field && field.validationType === 'string' && field.stringFormat === 'mobilePhone' && realignment) {
          return {
            field: error.field,
            message: error.message,
            resolved: true,
            resolution: `Auto-realigned from '${realignment.correctedFrom}' to '${realignment.correctedTo}'`,
          };
        }

        return { field: error.field, message: error.message };
      });

      // Count only unresolved errors for validity determination
      const unresolvedValidationErrors = transformedValidationErrors.filter(e => !e.resolved);
      const hasUnresolvedValidationErrors = unresolvedValidationErrors.length > 0;
      const combinedIsValid = !hasUnresolvedValidationErrors && (phoneRewriteResult ? phoneRewriteResult.allValid : true);
      const combinedErrors: Array<Record<string, unknown>> = [];

      // Include all validation errors with their resolution status
      if (transformedValidationErrors.length > 0) {
        combinedErrors.push(...transformedValidationErrors);
      }

      // Include phone rewrite errors (only unresolved ones)
      if (phoneRewriteResult && !phoneRewriteResult.allValid && phoneRewriteResult.errors.length) {
        combinedErrors.push(...phoneRewriteResult.errors.map(error => ({ input: error.input, error: error.error })));
      }

      if (outputOnlyIsValid) {
        const minimal: IDataObject = { isValid: combinedIsValid } as IDataObject;
        if (combinedErrors.length) minimal.errors = combinedErrors;
        item.json = minimal;
      } else {
        (item.json as Record<string, unknown>).isValid = combinedIsValid;
        if (combinedErrors.length) {
          (item.json as Record<string, unknown>).errors = combinedErrors;
        } else if ((item.json as Record<string, unknown>).hasOwnProperty('errors')) {
          (item.json as Record<string, unknown>).errors = undefined;
        }
      }

      // Omit empty fields if requested
      const omitEmptyFields = this.getNodeParameter('omitEmptyFields', itemIndex, false) as boolean;
      if (omitEmptyFields && !outputOnlyIsValid) {
        const cleanItem = (obj: Record<string, unknown>): Record<string, unknown> => {
          const result: Record<string, unknown> = {};
          for (const [key, value] of Object.entries(obj)) {
            // Keep special fields like isValid, errors, phoneRewrites
            if (key === 'isValid' || key === 'errors' || key === 'phoneRewrites') {
              result[key] = value;
              continue;
            }
            // Skip null, undefined, and empty string
            if (value === null || value === undefined || value === '') {
              continue;
            }
            // Recursively clean nested objects (but not arrays)
            if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
              const cleaned = cleanItem(value as Record<string, unknown>);
              // Only include if the cleaned object has properties
              if (Object.keys(cleaned).length > 0) {
                result[key] = cleaned;
              }
            } else {
              result[key] = value;
            }
          }
          return result;
        };
        item.json = cleanItem(item.json as Record<string, unknown>) as IDataObject;
      }

      returnData.push(item);
    }

    return [returnData];
  }
}
