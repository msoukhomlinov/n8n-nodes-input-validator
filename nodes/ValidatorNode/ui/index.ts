import { INodeProperties } from 'n8n-workflow';
import { stringProperties } from './stringProperties';
import { numberProperties } from './numberProperties';
import { booleanProperties } from './booleanProperties';
import { dateProperties } from './dateProperties';
import { enumProperties } from './enumProperties';
import { commonProperties } from './commonProperties';
export { phoneRewriteValues } from './phoneRewrite';

export const inputFieldValues: INodeProperties[] = [
  {
    displayName: 'Input Field Configuration',
    name: 'inputFieldHeader',
    type: 'notice',
    default: 'Configure validation settings for this field below',
  },
  {
    displayName: 'Validation Name',
    name: 'name',
    type: 'string',
    default: '',
    placeholder: 'e.g., emailAddress, companyID, mobilePhone',
    description: 'Unique name identifying this validation field (e.g., \'emailAddress\', \'companyID\')',
    hint: 'This name is used to identify this input block and appears in error messages',
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


