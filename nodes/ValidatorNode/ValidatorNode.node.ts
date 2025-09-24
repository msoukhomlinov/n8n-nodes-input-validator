import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
} from 'n8n-workflow';
import './validation'; // ensure handlers are registered
import { validateInputFields } from './validateInput';
import { InputField } from './types';
import { inputFieldValues } from './ui';
import { getPhoneInfo } from './validation/helpers';

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
            name: 'Output Validation Results',
            value: 'output-validation',
            description: 'Node will output validation results',
          },
          {
            name: 'Output Items',
            value: 'output-items',
            description: 'Node will output items from input and error on validation failure',
          },
          {
            name: 'Rewrite/Format Phone Numbers',
            value: 'rewrite-phone',
            description: 'Format configured phone inputs using google-libphonenumber',
          },
        ],
        default: 'output-validation',
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
        options: [
          {
            name: 'inputFields',
            displayName: 'Input Fields',
            values: inputFieldValues,
          },
        ],
      },
      {
        displayName: 'Include Phone Details',
        name: 'includePhoneDetails',
        type: 'boolean',
        default: false,
        description: 'When enabled, output includes details for phone fields (type, E.164, formats)',
        displayOptions: {
          show: {
            nodeMode: ['output-validation'],
          },
        },
      },
      {
        displayName: 'Phone Details Notice',
        name: 'phoneDetailsNotice',
        type: 'notice',
        default: '',
        description:
          'Phone details are computed using google-libphonenumber and include E.164, national, international formats and detected type/region. This can add minimal processing overhead.',
        displayOptions: {
          show: {
            nodeMode: ['output-validation'],
            includePhoneDetails: [true],
          },
        },
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();

    const outputMode = this.getNodeParameter('nodeMode', 0);
    const includePhoneDetails = this.getNodeParameter('includePhoneDetails', 0, false) as boolean;

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
        const rewrites: Array<Record<string, unknown>> = [];
        for (let f = 0; f < inputFields.length; f++) {
          const field = inputFields[f];
          if (field.validationType === 'string' && field.stringFormat === 'mobilePhone' && field.stringData) {
            // Lazy import to avoid circular
            const { rewritePhone } = await import('./validation/helpers');
            const result = rewritePhone(field.stringData, field);
            const outputProp = (field.phoneRewriteOutputProperty && field.phoneRewriteOutputProperty.trim())
              ? field.phoneRewriteOutputProperty.trim()
              : `${field.name}Formatted`;

            if (result.error && field.phoneRewriteOnInvalid === 'error') {
              throw new NodeOperationError(this.getNode(), `Phone rewrite failed for '${field.name}': ${result.error}`);
            }

            // Determine value to write based on onInvalid policy
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

            // Write onto item.json as augmentation
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
          }
        }

        // Attach summary of rewrites; keep original item content
        (item.json as Record<string, unknown>).phoneRewrites = rewrites.length ? rewrites : undefined;
        returnData.push(item);
        continue;
      }

      const { isValid, errors } = validateInputFields(inputFields);
      // Build phone details for any phone fields when in validation output mode
      const phoneDetails: Array<Record<string, unknown>> = [];
      if (outputMode === 'output-validation' && includePhoneDetails) {
        for (let f = 0; f < inputFields.length; f++) {
          const field = inputFields[f];
          if (field.validationType === 'string' && field.stringFormat === 'mobilePhone' && field.stringData) {
            const info = getPhoneInfo(field.stringData, field);
            if (info) phoneDetails.push(info as unknown as Record<string, unknown>);
          }
        }
      }

      if (outputMode === 'output-items') {
        if (isValid) {
          // If item is valid leave it as is
          returnData.push(item);
        } else {
          // output error
          let errorOutput = '';
          const ensureSentence = (text: string) => /[.!?]\s*$/.test(text) ? text.trim() : `${text.trim()}.`;
          for (let i = 0; i < errors.length; i++){
            if (errorOutput) {
              errorOutput += ' ';
            }
            errorOutput += ensureSentence(`${errors[i].field}: ${errors[i].message}`);
          }
          throw new NodeOperationError(this.getNode(), `Item failed validation. ${errorOutput}`);
        }
      } else {
        item.json = {
          isValid,
          errors: errors.length ? errors : undefined,
          phoneDetails: phoneDetails.length ? phoneDetails : undefined,
        };
        returnData.push(item);
      }
    }

    return this.prepareOutputData(returnData);
  }
}
