import { INodeProperties } from 'n8n-workflow';

export const commonProperties: INodeProperties[] = [

  {
    displayName: 'Custom Error Message',
    name: 'customErrorMessage',
    type: 'string',
    default: '',
    placeholder: 'e.g., Please check this field',
    description: 'Optional custom error message. Prefix with "!" to replace standard message, "^" to prepend. Plain text appends to standard message.',
    hint: 'Leave empty for standard message only. Plain text = append, !text = replace, ^text = prepend',
    displayOptions: {
      show: {
        validationType: ['string', 'number', 'boolean', 'date', 'enum'],
      },
    },
  },
];


