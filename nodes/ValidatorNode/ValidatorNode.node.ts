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
import { InputField, PhoneRewriteInput } from './types';
import { inputFieldValues, phoneRewriteValues } from './ui';

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
          {
            name: 'ReWrite/Format phone numbers',
            value: 'rewrite-phone',
            description: 'Format configured phone inputs using google-libphonenumber',
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
      // On Invalid behavior for Output Items mode
      {
        displayName: 'On Invalid',
        name: 'onInvalid',
        type: 'options',
        options: [
          {
            name: 'Continue (default)',
            value: 'continue',
            description: 'Pass through original data with validation errors included',
          },
          {
            name: 'Throw Error',
            value: 'error',
            description: 'Fail the entire item when any validation fails',
          },
          {
            name: 'Skip Item',
            value: 'skip',
            description: 'Exclude the item from output when validation fails',
          },
          {
            name: 'Set Invalid Fields to Null',
            value: 'set-null',
            description: 'Set fields that fail validation to null',
          },
          {
            name: 'Set Invalid Fields to Empty',
            value: 'set-empty',
            description: 'Set fields that fail validation to empty values (empty string, 0, false, etc.)',
          },
        ],
        default: 'continue',
        description: 'What to do when validation fails for any field',
        displayOptions: {
          show: {
            nodeMode: ['output-items'],
          },
        },
      },
      // Pass-through toggle for rewrite-phone mode
      {
        displayName: 'Pass Through All Incoming Fields',
        name: 'rewritePhonePassThrough',
        type: 'boolean',
        default: true,
        description: 'When enabled, keep all original item fields and add formatted outputs',
        displayOptions: {
          show: {
            nodeMode: ['rewrite-phone'],
          },
        },
      },
      // When enabled, do not include phoneRewrites summary details in the output
      {
        displayName: 'Do Not Output Phone Rewrite Details',
        name: 'omitPhoneRewriteDetails',
        type: 'boolean',
        default: false,
        description: 'When enabled, the phoneRewrites summary array will be omitted from output',
        displayOptions: {
          show: {
            nodeMode: ['rewrite-phone'],
          },
        },
      },
      // Phone rewrite inputs and related options (appended at end for stability)
      ...phoneRewriteValues,
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();

    const outputMode = this.getNodeParameter('nodeMode', 0);
    const outputOnlyIsValid = this.getNodeParameter('outputOnlyIsValid', 0, false) as boolean;

    const returnData: INodeExecutionData[] = [];
    for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
      const item: INodeExecutionData = items[itemIndex];
      const inputFields = this.getNodeParameter(
        'inputs.inputFields',
        itemIndex,
        [],
      ) as InputField[];

      // Special handling for rewrite-phone mode: transform/augment item with formatted results
      if (outputMode === 'rewrite-phone') {
        // Try new mapping-based inputs first
        const mappings = this.getNodeParameter('phoneRewriteInputs.phoneRewriteInputs', itemIndex, []) as PhoneRewriteInput[];
        const mappingsRaw = this.getNodeParameter('phoneRewriteInputs.phoneRewriteInputs', itemIndex, [], { rawExpressions: true }) as Array<Record<string, unknown>>;
        const passThrough = this.getNodeParameter('rewritePhonePassThrough', itemIndex, true) as boolean;
        const omitRewriteDetails = this.getNodeParameter('omitPhoneRewriteDetails', itemIndex, false) as boolean;

        // Mode-level phone options reused in helper through a pseudo-field
        const phoneRegion = this.getNodeParameter('phoneRegion', itemIndex, 'ZZ') as string;
        const phoneRegionCustom = this.getNodeParameter('phoneRegionCustom', itemIndex, '') as string;
        const phoneRewriteFormat = this.getNodeParameter('phoneRewriteFormat', itemIndex, 'E164') as 'E164' | 'INTERNATIONAL' | 'NATIONAL' | 'RFC3966';
        const phoneRewriteOnInvalid = this.getNodeParameter('phoneRewriteOnInvalid', itemIndex, 'leave-as-is') as 'leave-as-is' | 'empty' | 'null' | 'error';
        const autoRealign = this.getNodeParameter('autoRealignMismatchedTypes', itemIndex, true) as boolean;
        const allowDuplicateAssignment = this.getNodeParameter('allowDuplicateAssignment', itemIndex, true) as boolean;
        const phoneRewriteKeepExtension = this.getNodeParameter('phoneRewriteKeepExtension', itemIndex, true) as boolean;
        const phoneRewriteSeparatorMode = this.getNodeParameter('phoneRewriteSeparatorMode', itemIndex, 'space') as 'space' | 'hyphen' | 'custom';
        const phoneRewriteSeparatorCustom = this.getNodeParameter('phoneRewriteSeparatorCustom', itemIndex, '') as string;

        const { rewritePhone, isPhoneTypeAllowed } = await import('./validation/helpers');

        // Helper using central compatibility logic
        const acceptsExpected = (expected: string[] | undefined, actual: string | undefined): boolean => {
          if (!expected || expected.length === 0 || !actual) return false;
          // Map actual label to enum-like acceptance using helper
          // We simulate by passing detected label through isPhoneTypeAllowed with expected list
          return isPhoneTypeAllowed(expected, (actual as unknown) as number, true) || expected.includes(actual);
        };

        const rewrites: Array<Record<string, unknown>> = [];
        const written: Record<string, unknown> = {};
        // Keep pre-write cache so we can perform swap correction before mutating item.json
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
        }> = [];
        const errors: Array<{ input?: string; error: string }> = [];
        let allValid = true;

        // Helper to set nested values using dot notation
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

        if (Array.isArray(mappings) && mappings.length > 0) {
          for (let m = 0; m < mappings.length; m++) {
            const mapping = mappings[m] || {} as PhoneRewriteInput;
            const sourceExpr = mapping.source || '';
            // Raw expression (if available) to derive original key
            const rawSource = Array.isArray(mappingsRaw) && mappingsRaw[m] ? (mappingsRaw[m]['source'] as string) : undefined;
            const originalValue = this.evaluateExpression(sourceExpr, itemIndex) as string;

            const pseudoField: InputField = {
              name: `phone${m + 1}`,
              validationType: 'string',
              required: false,
              stringFormat: 'mobilePhone',
              phoneRegion: phoneRegion,
              phoneRegionCustom: phoneRegionCustom,
              phoneRewriteFormat,
              phoneRewriteOnInvalid,
              phoneRewriteKeepExtension,
              phoneRewriteSeparatorMode,
              phoneRewriteSeparatorCustom,
            } as unknown as InputField;

            const result = rewritePhone(originalValue as string, pseudoField);

            // Output property: use explicit outputFieldName, or extract full path from source
            let outputProp = `phone${m + 1}`;
            const explicitOutputName = mapping.outputFieldName?.trim();
            if (explicitOutputName) {
              // Use explicit output field name (supports dot notation)
              outputProp = explicitOutputName;
            } else {
              // Auto-detect from source, preserving full path with dot notation
              const extractPath = (expr: string): string | undefined => {
                if (!expr) return undefined;
                // Normalise wrappers like {{ }} or ={{ }}
                let t = expr.trim();
                t = t.replace(/^=\s*/, '');
                t = t.replace(/^\{\{\s*/, '').replace(/\s*\}\}$/, '');
                // Support $json.prop or $json["prop"] or $json['prop']
                const bracketMatch = t.match(/\$json\s*\[\s*['\"]([^'\"]+)['\"]\s*\]\s*$/);
                if (bracketMatch && bracketMatch[1]) return bracketMatch[1];
                const dotMatch = t.match(/\$json\s*\.\s*([a-zA-Z0-9_\.]+)\s*$/);
                if (dotMatch && dotMatch[1]) return dotMatch[1]; // Return full path, not just last segment
                return undefined;
              };
              const fromRaw = typeof rawSource === 'string' ? extractPath(rawSource) : undefined;
              const fromExpr = typeof sourceExpr === 'string' ? extractPath(sourceExpr) : undefined;
              if (fromRaw && /^[a-zA-Z0-9_\.]+$/.test(fromRaw)) {
                outputProp = fromRaw;
              } else if (fromExpr && /^[a-zA-Z0-9_\.]+$/.test(fromExpr)) {
                outputProp = fromExpr;
              }
            }

            if (result.error && phoneRewriteOnInvalid === 'error') {
              throw new NodeOperationError(this.getNode(), `Phone rewrite failed for '${outputProp}': ${result.error}`);
            }

            // Stage for potential swap; we will finalise 'written' after swap-pass
            preWrite.push({
              index: m,
              outputProp,
              originalValue: originalValue as string,
              result,
              expectedTypes: (mapping as any).expectedTypes as string[] | undefined,
              fallbackTypes: (mapping as any).fallbackTypes as string[] | undefined,
            });

            const summary: Record<string, unknown> = {
              name: outputProp,
            } as Record<string, unknown>;
            summary.name = outputProp;
            summary.original = originalValue;
            summary.outputProperty = outputProp;
            summary.formatted = result.formatted;
            summary.format = result.format;
            summary.region = result.region;
            summary.type = result.type;
            summary.valid = result.valid;
            summary.possible = result.possible;
            summary.error = result.error;
            if (Array.isArray((mapping as any).expectedTypes) && (mapping as any).expectedTypes.length) {
              const expected = (mapping as any).expectedTypes as string[];
              summary.expectedTypes = expected;
              const actualType = result.type as string | undefined;
              summary.expectedTypeMatch = acceptsExpected(expected, actualType);
            }
            if (Array.isArray((mapping as any).fallbackTypes) && (mapping as any).fallbackTypes.length) {
              summary.fallbackTypes = (mapping as any).fallbackTypes as string[];
            }
            rewrites.push(summary);

            if (!result.valid || result.error) {
              allValid = false;
              if (result.error) {
                errors.push({ input: outputProp, error: result.error });
              }
            }
          }

          // Auto realignment: try to fill mismatched outputs from any source entry whose detected type
          // satisfies the expected types (using relaxed compatibility rules above). This also supports
          // one-sided realignment where only one entry is mismatched.
          if (autoRealign) {
            const sourceUsed: Record<string, boolean> = {};
            for (let i = 0; i < preWrite.length; i++) {
              const target = preWrite[i];
              const targetSummary = rewrites[i];
              const expected = target.expectedTypes;
              const fallback = target.fallbackTypes;
              if (!targetSummary || !expected || expected.length === 0) continue;
              const alreadyAligned = targetSummary.expectedTypeMatch === true;
              if (alreadyAligned && allowDuplicateAssignment) continue; // no need to realign when duplicates allowed
              // If not aligned (or duplicates disallowed and slot empty), find best source candidate
              if (targetSummary.expectedTypeMatch === false || (!allowDuplicateAssignment && !(target.outputProp in written))) {
                for (let s = 0; s < preWrite.length; s++) {
                  const source = preWrite[s];
                  const sourceType = source.result.type as string | undefined;
                  if (!sourceType) continue;
                  const sourceValue = source.result.formatted ?? source.originalValue;
                  // skip if duplicates not allowed and this source already assigned elsewhere
                  if (!allowDuplicateAssignment && sourceUsed[source.outputProp]) continue;
                  if (acceptsExpected(expected, sourceType) || (Array.isArray(fallback) && fallback.length > 0 && acceptsExpected(fallback, sourceType))) {
                    if (allowDuplicateAssignment || !(target.outputProp in written)) {
                      written[target.outputProp] = sourceValue;
                      targetSummary.correctionMade = true;
                      targetSummary.correctionSource = source.outputProp;
                      if (!acceptsExpected(expected, sourceType) && Array.isArray(fallback) && acceptsExpected(fallback, sourceType)) {
                        targetSummary.fallbackUsed = true;
                      }
                      sourceUsed[source.outputProp] = true;
                    }
                    break; // assigned a suitable source
                  }
                }
              }
            }
          }

          // For any entries not set via swap, apply default write policy now
          for (let k = 0; k < preWrite.length; k++) {
            const staged = preWrite[k];
            if (staged.outputProp in written) continue; // already set via swap
            const res = staged.result;
            // On Invalid also applies when expected type does not match and we did not realign this entry
            let valueToWrite: unknown = res.formatted;
            const mismatched = rewrites[k]?.expectedTypeMatch === false;
            const notRealigned = !(preWrite[k].outputProp in written);
            if ((res.error || (mismatched && notRealigned)) && phoneRewriteOnInvalid !== undefined) {
              switch (phoneRewriteOnInvalid) {
                case 'empty':
                  valueToWrite = '';
                  break;
                case 'null':
                  valueToWrite = null;
                  break;
                case 'leave-as-is':
                default:
                  valueToWrite = staged.originalValue;
                  break;
              }
            }
            written[staged.outputProp] = valueToWrite as unknown;
          }

          // Write outputs according to pass-through
          const targetObj = passThrough ? (item.json as Record<string, unknown>) : {};
          for (const [key, value] of Object.entries(written)) {
            if (key.includes('.')) {
              // Use dot notation helper for nested paths
              setNestedValue(targetObj, key, value);
            } else {
              // Direct assignment for simple keys
              targetObj[key] = value;
            }
          }
          if (!passThrough) {
            item.json = targetObj as unknown as IDataObject;
          }
        } else {
          // Fallback to legacy behavior using InputField entries if no mappings configured
          for (let f = 0; f < inputFields.length; f++) {
            const field = inputFields[f];
            if (field.validationType === 'string' && field.stringFormat === 'mobilePhone' && field.stringData) {
              const { rewritePhone } = await import('./validation/helpers');
              const result = rewritePhone(field.stringData, field);
              const outputProp = (field.phoneRewriteOutputProperty && field.phoneRewriteOutputProperty.trim())
                ? field.phoneRewriteOutputProperty.trim()
                : `${field.name}Formatted`;

              if (result.error && field.phoneRewriteOnInvalid === 'error') {
                throw new NodeOperationError(this.getNode(), `Phone rewrite failed for '${field.name}': ${result.error}`);
              }

              let valueToWrite: unknown = result.formatted;
              if (!result.formatted && result.error) {
                switch (field.phoneRewriteOnInvalid) {
                  case 'empty':
                    valueToWrite = '';
                    break;
                  case 'null':
                    valueToWrite = null;
                    break;
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

        // Attach summary and top-level validity/errors
        if (!omitRewriteDetails) {
          (item.json as Record<string, unknown>).phoneRewrites = rewrites.length ? rewrites : undefined;
        } else {
          // Ensure any previous value is not leaked
          if ((item.json as Record<string, unknown>).hasOwnProperty('phoneRewrites')) {
            (item.json as Record<string, unknown>).phoneRewrites = undefined;
          }
        }
        (item.json as Record<string, unknown>).isValid = allValid;
        (item.json as Record<string, unknown>).errors = errors.length ? errors : undefined;
        returnData.push(item);
        continue;
      }

      const { isValid, errors } = validateInputFields(inputFields);

      // Helper function to set nested property values
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

      // Write validated values back to the item
      // This ensures expressions that transform/map data are reflected in the output
      const errorFields = new Set(errors.map(e => e.field));
      for (const field of inputFields) {
        // Only write back if this field passed validation
        if (!errorFields.has(field.name)) {
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
              valueToWrite = field.stringData; // enum uses stringData
              break;
          }

          // Handle nested field names (e.g., "supplied_details.phone")
          if (field.name.includes('.')) {
            setNestedValue(item.json as Record<string, unknown>, field.name, valueToWrite);
          } else {
            (item.json as Record<string, unknown>)[field.name] = valueToWrite;
          }
        }
      }

      // Get the onInvalid behavior option
      const onInvalid = this.getNodeParameter('onInvalid', itemIndex, 'continue') as string;

      if (outputMode === 'output-items') {
        // Handle onInvalid behavior when validation fails
        if (!isValid && onInvalid !== 'continue') {
          switch (onInvalid) {
            case 'error':
              throw new NodeOperationError(this.getNode(), `Validation failed for item ${itemIndex}: ${errors.map(e => e.message).join('; ')}`);
            case 'skip':
              // Skip this item - don't add to returnData
              continue;
            case 'set-null':
              // Set invalid fields to null
              for (const error of errors) {
                (item.json as Record<string, unknown>)[error.field] = null;
              }
              break;
            case 'set-empty':
              // Set invalid fields to appropriate empty values
              for (const error of errors) {
                const field = inputFields.find(f => f.name === error.field);
                if (field) {
                  switch (field.validationType) {
                    case 'string':
                      (item.json as Record<string, unknown>)[error.field] = '';
                      break;
                    case 'number':
                      (item.json as Record<string, unknown>)[error.field] = 0;
                      break;
                    case 'boolean':
                      (item.json as Record<string, unknown>)[error.field] = false;
                      break;
                    case 'date':
                      (item.json as Record<string, unknown>)[error.field] = '';
                      break;
                    case 'enum':
                      (item.json as Record<string, unknown>)[error.field] = '';
                      break;
                    default:
                      (item.json as Record<string, unknown>)[error.field] = null;
                  }
                }
              }
              break;
          }
        }

        if (outputOnlyIsValid) {
          // Replace output with only isValid (+ errors when invalid)
          const minimal: IDataObject = { isValid } as IDataObject;
          if (!isValid && errors.length) minimal.errors = errors;
          item.json = minimal;
        } else {
          // Pass-through original item, just annotate
          (item.json as Record<string, unknown>).isValid = isValid;
          if (!isValid) {
            (item.json as Record<string, unknown>).errors = errors.length ? errors : undefined;
          }
        }
        returnData.push(item);
      } else {
        // Invalid node mode
        throw new NodeOperationError(this.getNode(), `Invalid node mode: ${outputMode}. Supported modes are 'output-items' and 'rewrite-phone'.`);
      }
    }

    return this.prepareOutputData(returnData);
  }
}
