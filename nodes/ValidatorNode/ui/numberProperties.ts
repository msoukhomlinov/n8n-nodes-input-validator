import { INodeProperties } from 'n8n-workflow';

export const numberProperties: INodeProperties[] = [
  {
    displayName: 'Number Data',
    name: 'numberData',
    type: 'number',
    default: 0,
    placeholder: 'Enter number data',
    description: 'Data to be validated as a number',
    displayOptions: {
      show: {
        validationType: ['number'],
      },
    },
  },
  {
    displayName: 'Number Validation Type',
    name: 'numberValidationType',
    type: 'options',
    options: [
      { name: 'None', value: 'none' },
      { name: 'Minimum', value: 'min' },
      { name: 'Maximum', value: 'max' },
      { name: 'Range', value: 'range' },
      { name: 'One Of', value: 'oneOf' },
    ],
    default: 'none',
    description: 'Specify if the number should be validated with minimum, maximum, range, or one of specific values',
    displayOptions: {
      show: {
        validationType: ['number'],
      },
    },
  },
  {
    displayName: 'Min Value',
    name: 'minValue',
    type: 'number',
    default: undefined,
    placeholder: 'Enter minimum value',
    description: 'Minimum value for number validation',
    displayOptions: {
      show: {
        validationType: ['number'],
        numberValidationType: ['min', 'range'],
      },
    },
  },
  {
    displayName: 'Max Value',
    name: 'maxValue',
    type: 'number',
    default: undefined,
    placeholder: 'Enter maximum value',
    description: 'Maximum value for number validation',
    displayOptions: {
      show: {
        validationType: ['number'],
        numberValidationType: ['max', 'range'],
      },
    },
  },
  {
    displayName: 'One Of Values',
    name: 'oneOfValues',
    type: 'string',
    default: '',
    placeholder: 'Enter comma-separated values',
    description: 'Comma-separated list of valid number values',
    displayOptions: {
      show: {
        validationType: ['number'],
        numberValidationType: ['oneOf'],
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
        validationType: ['number'],
      },
    },
  },
];


