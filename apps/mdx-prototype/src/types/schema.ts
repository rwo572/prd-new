// Type definitions for schema extraction

export interface DataSchema {
  type: 'object'
  properties: Record<string, PropertySchema>
  required: string[]
  additionalProperties?: boolean
}

export interface PropertySchema {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  description?: string
  validation?: ValidationRule
  items?: PropertySchema // for arrays
  properties?: Record<string, PropertySchema> // for nested objects
  required?: string[] // for nested objects
  enum?: any[]
  format?: string // email, date, url, etc.
  pattern?: string
  minimum?: number
  maximum?: number
  minLength?: number
  maxLength?: number
}

export interface ValidationRule {
  field: string
  type: 'required' | 'pattern' | 'length' | 'range' | 'custom'
  config: {
    pattern?: RegExp
    min?: number
    max?: number
    validator?: (value: any) => boolean
    message: string
  }
}

export interface ComponentInfo {
  name: string
  props?: Record<string, PropDefinition>
  ast: any // Component AST from parser
  code: string
}

export interface PropDefinition {
  type: string
  isRequired: boolean
  defaultValue?: any
  description?: string
}

export interface FormField {
  name: string
  type: 'text' | 'email' | 'password' | 'number' | 'date' | 'select' | 'checkbox' | 'radio' | 'textarea'
  label?: string
  placeholder?: string
  validation?: ValidationRule
  options?: { label: string; value: any }[] // for select/radio
}

export interface APICall {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  endpoint: string
  requestBody?: any
  responseType?: any
  headers?: Record<string, string>
}

export interface SchemaExtractionResult {
  dataSchema: DataSchema
  formFields: FormField[]
  apiCalls: APICall[]
  validations: ValidationRule[]
  typescript: string
  jsonSchema: object
}
