import { INodeProperties } from 'n8n-workflow';

export const commonProperties: INodeProperties[] = [

  {
    displayName: 'Use Custom Error Message',
    name: 'useCustomErrorMessage',
    type: 'boolean',
    default: false,
    description: 'Enable to use a custom error message for this field',
    displayOptions: {
      show: {
        validationType: ['string', 'number', 'boolean', 'date', 'enum'],
      },
    },
  },
  {
    displayName: 'Custom Error Message Text',
    name: 'customErrorMessage',
    type: 'string',
    default: '',
    placeholder: 'Enter custom error message',
    description: 'The custom message to include when validation fails',
    displayOptions: {
      show: {
        validationType: ['string', 'number', 'boolean', 'date', 'enum'],
        useCustomErrorMessage: [true],
      },
    },
  },
  {
    displayName: 'Custom Message Placement',
    name: 'customMessagePlacement',
    type: 'options',
    options: [
      { name: 'Append (default)', value: 'append' },
      { name: 'Prepend', value: 'prepend' },
      { name: 'Replace Standard', value: 'replace' },
    ],
    default: 'append',
    description: 'How to compose the custom message with the standard message',
    displayOptions: {
      show: {
        validationType: ['string', 'number', 'boolean', 'date', 'enum'],
        useCustomErrorMessage: [true],
      },
    },
  },
];


