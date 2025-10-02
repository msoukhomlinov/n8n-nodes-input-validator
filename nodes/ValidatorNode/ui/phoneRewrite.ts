import { INodeProperties } from 'n8n-workflow';

// Global phone rewrite options for output-items mode
export const phoneRewriteValues: INodeProperties[] = [
  {
    displayName: 'Pass Through All Incoming Fields',
    name: 'phoneRewritePassThrough',
    type: 'boolean',
    default: true,
    description: 'When enabled, keep all original item fields and add formatted outputs',
    displayOptions: {
      show: {
        '/nodeMode': ['output-items'],
        enablePhoneRewrite: [true],
      },
    },
  },
  {
    displayName: 'Do Not Output Phone Rewrite Details',
    name: 'omitPhoneRewriteDetails',
    type: 'boolean',
    default: false,
    description: 'When enabled, the phoneRewrites summary array will be omitted from output',
    displayOptions: {
      show: {
        '/nodeMode': ['output-items'],
        enablePhoneRewrite: [true],
      },
    },
  },
  {
    displayName: 'Auto realign mismatched types',
    name: 'autoRealignMismatchedTypes',
    type: 'boolean',
    default: true,
    description: 'When a number\'s detected type doesn\'t match the expected types, try swapping values between entries to align them with their correct keys',
    displayOptions: {
      show: {
        '/nodeMode': ['output-items'],
        enablePhoneRewrite: [true],
      },
    },
  },
  {
    displayName: 'Allow using same number in multiple fields',
    name: 'allowDuplicateAssignment',
    type: 'boolean',
    default: true,
    description: 'If multiple entries expect the same type, allow one detected number to be used for more than one output field',
    displayOptions: {
      show: {
        '/nodeMode': ['output-items'],
        enablePhoneRewrite: [true],
      },
    },
  },
];
