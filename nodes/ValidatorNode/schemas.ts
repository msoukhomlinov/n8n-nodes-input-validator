export const schemas: { [key: string]: object } = {
  string: { type: 'string' },
  number: { type: 'number' },
  boolean: { type: 'boolean' },
  date: { type: 'string', format: 'date' },
  enum: { type: 'string', enum: [] },
  email: { type: 'string', format: 'email' },
  url: { type: 'string', format: 'url' },
  uuid: { type: 'string', format: 'uuid' },
};