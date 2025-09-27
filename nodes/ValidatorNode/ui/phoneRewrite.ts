import { INodeProperties } from 'n8n-workflow';

// Fixed-collection for rewrite-phone mode
export const phoneRewriteValues: INodeProperties[] = [
  {
    displayName: 'Phone Rewrite Inputs',
    name: 'phoneRewriteInputs',
    type: 'fixedCollection',
    placeholder: 'Add Phone Input',
    default: { phoneRewriteInputs: [{}, {}] },
    typeOptions: {
      multipleValues: true,
    },
    displayOptions: {
      show: {
        '/nodeMode': ['rewrite-phone'],
      },
    },
    options: [
      {
        name: 'phoneRewriteInputs',
        displayName: 'Entries',
        values: [
          {
            displayName: 'Source',
            name: 'source',
            type: 'string',
            default: '',
            typeOptions: { alwaysOpenEditWindow: true },
            description: 'String or expression that resolves to the phone number',
          },
          {
            displayName: 'Expected Types (Optional)',
            name: 'expectedTypes',
            type: 'multiOptions',
            default: [],
            options: [
              { name: 'Fixed Line', value: 'FIXED_LINE' },
              { name: 'Mobile', value: 'MOBILE' },
              { name: 'Fixed Line Or Mobile', value: 'FIXED_LINE_OR_MOBILE' },
              { name: 'Toll Free', value: 'TOLL_FREE' },
              { name: 'Premium Rate', value: 'PREMIUM_RATE' },
              { name: 'Shared Cost', value: 'SHARED_COST' },
              { name: 'VoIP', value: 'VOIP' },
              { name: 'Personal Number', value: 'PERSONAL_NUMBER' },
              { name: 'Pager', value: 'PAGER' },
              { name: 'UAN', value: 'UAN' },
              { name: 'Voicemail', value: 'VOICEMAIL' },
              { name: 'Unknown', value: 'UNKNOWN' },
            ],
          },
          {
            displayName: 'Fallback Types (Optional)',
            name: 'fallbackTypes',
            type: 'multiOptions',
            default: [],
            description: 'If expected types do not match, use values matching these types for this field',
            options: [
              { name: 'Fixed Line', value: 'FIXED_LINE' },
              { name: 'Mobile', value: 'MOBILE' },
              { name: 'Fixed Line Or Mobile', value: 'FIXED_LINE_OR_MOBILE' },
              { name: 'Toll Free', value: 'TOLL_FREE' },
              { name: 'Premium Rate', value: 'PREMIUM_RATE' },
              { name: 'Shared Cost', value: 'SHARED_COST' },
              { name: 'VoIP', value: 'VOIP' },
              { name: 'Personal Number', value: 'PERSONAL_NUMBER' },
              { name: 'Pager', value: 'PAGER' },
              { name: 'UAN', value: 'UAN' },
              { name: 'Voicemail', value: 'VOICEMAIL' },
              { name: 'Unknown', value: 'UNKNOWN' },
            ],
          },
        ],
      },
    ],
  },
  // Mode-level phone options visible in rewrite-phone
  { displayName: 'Phone Region', name: 'phoneRegion', type: 'options', options: [
    { name: 'Unknown/International (ZZ)', value: 'ZZ' },
    { name: 'Australia (AU)', value: 'AU' },
    { name: 'New Zealand (NZ)', value: 'NZ' },
    { name: 'United States (US)', value: 'US' },
    { name: 'United Kingdom (GB)', value: 'GB' },
    { name: 'Canada (CA)', value: 'CA' },
    { name: 'Germany (DE)', value: 'DE' },
    { name: 'France (FR)', value: 'FR' },
    { name: 'India (IN)', value: 'IN' },
    { name: 'Japan (JP)', value: 'JP' },
    { name: 'Singapore (SG)', value: 'SG' },
    { name: 'Custom...', value: '__custom__' },
  ], default: 'ZZ', description: 'ISO 3166-1 alpha-2 region. Used for parsing numbers without country code.', displayOptions: { show: { '/nodeMode': ['rewrite-phone'] } } },
  { displayName: 'Phone Region (Custom)', name: 'phoneRegionCustom', type: 'string', default: '', placeholder: 'e.g., BR', description: 'Provide a custom ISO 3166-1 alpha-2 code', displayOptions: { show: { '/nodeMode': ['rewrite-phone'], phoneRegion: ['__custom__'] } } },
  { displayName: 'Rewrite Format', name: 'phoneRewriteFormat', type: 'options', options: [
    { name: 'E.164 (e.g. +61412345678)', value: 'E164' },
    { name: 'International (e.g. +61 412 345 678)', value: 'INTERNATIONAL' },
    { name: 'National (e.g. 0412 345 678)', value: 'NATIONAL' },
    { name: 'RFC3966 (e.g. tel:+61-412-345-678)', value: 'RFC3966' },
  ], default: 'E164', description: 'Choose the target format for rewriting the number.', displayOptions: { show: { '/nodeMode': ['rewrite-phone'] } } },
  { displayName: 'On Invalid', name: 'phoneRewriteOnInvalid', type: 'options', options: [
    { name: 'Leave As Is', value: 'leave-as-is' },
    { name: 'Empty String', value: 'empty' },
    { name: 'Null', value: 'null' },
    { name: 'Throw Error (fail item)', value: 'error' },
  ], default: 'leave-as-is', description: 'What to do when the number cannot be parsed/validated for formatting.', displayOptions: { show: { '/nodeMode': ['rewrite-phone'] } } },
  { displayName: 'Auto realign mismatched types', name: 'autoRealignMismatchedTypes', type: 'boolean', default: true, description: 'When a number’s detected type doesn’t match the expected types, try swapping values between entries to align them with their correct keys.', displayOptions: { show: { '/nodeMode': ['rewrite-phone'] } } },
  { displayName: 'Allow using same number in multiple fields', name: 'allowDuplicateAssignment', type: 'boolean', default: true, description: 'If multiple entries expect the same type, allow one detected number to be used for more than one output field.', displayOptions: { show: { '/nodeMode': ['rewrite-phone'] } } },
  { displayName: 'Keep Extension', name: 'phoneRewriteKeepExtension', type: 'boolean', default: true, description: 'Preserve extensions when present (RFC3966 appends ;ext=1234).', displayOptions: { show: { '/nodeMode': ['rewrite-phone'] } } },
  { displayName: 'Digit Separator', name: 'phoneRewriteSeparatorMode', type: 'options', options: [
    { name: 'Space', value: 'space' },
    { name: 'Hyphen', value: 'hyphen' },
    { name: 'Custom', value: 'custom' },
  ], default: 'space', description: 'Separator to use between digit groups (applies to INTERNATIONAL/NATIONAL).', displayOptions: { show: { '/nodeMode': ['rewrite-phone'] } } },
  { displayName: 'Custom Separator', name: 'phoneRewriteSeparatorCustom', type: 'string', default: '', placeholder: 'e.g., \u00a0', description: 'Custom separator string when mode is Custom. Leave empty for space.', displayOptions: { show: { '/nodeMode': ['rewrite-phone'], phoneRewriteSeparatorMode: ['custom'] } } },
];


