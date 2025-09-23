import { INodeProperties } from 'n8n-workflow';

export const dateProperties: INodeProperties[] = [
  {
    displayName: 'Date Data',
    name: 'dateData',
    type: 'string',
    default: '',
    placeholder: 'Enter date data',
    description: 'Data to be validated as a date',
    displayOptions: {
      show: {
        validationType: ['date'],
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
        validationType: ['date'],
      },
    },
  },
];


