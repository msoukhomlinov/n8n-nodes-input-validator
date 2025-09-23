import { INodeProperties } from 'n8n-workflow';

export const booleanProperties: INodeProperties[] = [
  {
    displayName: 'Boolean Data',
    name: 'booleanData',
    type: 'boolean',
    default: false,
    description: 'Whether Data to be validated as a boolean',
    displayOptions: {
      show: {
        validationType: ['boolean'],
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
        validationType: ['boolean'],
      },
    },
  },
];


