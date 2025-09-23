import { INodeProperties } from 'n8n-workflow';

export const enumProperties: INodeProperties[] = [
  {
    displayName: 'Enum Values',
    name: 'enumValues',
    type: 'string',
    default: '',
    placeholder: 'Enter comma-separated enum values',
    description: 'Comma-separated list of valid enum values',
    displayOptions: {
      show: {
        validationType: ['enum'],
      },
    },
  },
  {
    displayName: 'Required',
    name: 'required',
    type: 'boolean',
    default: false,
    description: 'Whether the input field is required',
    displayOptions: {
      show: {
        validationType: ['enum'],
      },
    },
  },
];


