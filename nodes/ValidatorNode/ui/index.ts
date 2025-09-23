import { INodeProperties } from 'n8n-workflow';
import { stringProperties } from './stringProperties';
import { numberProperties } from './numberProperties';
import { booleanProperties } from './booleanProperties';
import { dateProperties } from './dateProperties';
import { enumProperties } from './enumProperties';
import { commonProperties } from './commonProperties';

export const inputFieldValues: INodeProperties[] = [
  {
    displayName: 'Validation Name',
    name: 'name',
    type: 'string',
    default: '',
    placeholder: 'Enter validation name',
    description: 'Name of the validation',
  },
  {
    displayName: 'Validation Type',
    name: 'validationType',
    type: 'options',
    options: [
      { name: 'Boolean', value: 'boolean' },
      { name: 'Date', value: 'date' },
      { name: 'Enum', value: 'enum' },
      { name: 'Number', value: 'number' },
      { name: 'String', value: 'string' },
    ],
    default: 'string',
    description: 'The type of validation to perform',
  },
  // String
  ...stringProperties,
  // Number
  ...numberProperties,
  // Boolean
  ...booleanProperties,
  // Date
  ...dateProperties,
  // Enum
  ...enumProperties,
  // Common
  ...commonProperties,
];


