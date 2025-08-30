/**
 * Browser-compatible schema extractor using regex patterns
 * This is a simplified version that doesn't require Babel AST parsing
 */

import {
  DataSchema,
  PropertySchema,
  ComponentInfo,
  FormField,
  APICall,
  SchemaExtractionResult,
  ValidationRule
} from '../../types/schema'
import { 
  COMPONENT_PATTERNS, 
  FORM_LIBRARY_PATTERNS, 
  API_PATTERNS,
  VALIDATION_PATTERNS,
  extractFieldType,
  inferFieldTypeFromName
} from './patterns'

export class BrowserSchemaExtractor {
  extractSchema(component: ComponentInfo): SchemaExtractionResult {
    const code = component.code
    
    // Extract various aspects using regex patterns
    const formFields = this.findFormFields(code)
    const apiCalls = this.findAPICalls(code)
    
    // Build complete data schema
    const dataSchema = this.buildDataSchema({
      formFields,
      apiCalls
    })
    
    // Extract validation rules
    const validations = this.extractValidations(formFields)
    
    // Generate TypeScript interface
    const typescript = this.generateTypeScript(dataSchema)
    
    // Convert to JSON Schema
    const jsonSchema = this.toJsonSchema(dataSchema)
    
    return {
      dataSchema,
      formFields,
      apiCalls,
      validations,
      typescript,
      jsonSchema
    }
  }

  private findFormFields(code: string): FormField[] {
    const fields: FormField[] = []
    
    // Find HTML input elements
    const inputRegex = /<input\s+([^>]+)>/g
    let match
    
    while ((match = inputRegex.exec(code)) !== null) {
      const attributes = this.parseAttributes(match[1])
      const field = this.attributesToField(attributes)
      if (field) fields.push(field)
    }
    
    // Find React Hook Form registrations
    const registerRegex = /register\s*\(\s*['"`](\w+)['"`](?:\s*,\s*({[^}]+}))?\s*\)/g
    
    while ((match = registerRegex.exec(code)) !== null) {
      const fieldName = match[1]
      const rulesStr = match[2]
      
      const field: FormField = {
        name: fieldName,
        type: inferFieldTypeFromName(fieldName) as FormField['type']
      }
      
      if (rulesStr) {
        // Parse validation rules
        if (rulesStr.includes('required')) {
          field.validation = {
            field: fieldName,
            type: 'required',
            config: { message: 'This field is required' }
          }
        }
      }
      
      fields.push(field)
    }
    
    // Find custom form components
    const customInputRegex = /<(?:Input|TextField|FormInput)\s+([^>]+)>/g
    
    while ((match = customInputRegex.exec(code)) !== null) {
      const attributes = this.parseAttributes(match[1])
      const field = this.attributesToField(attributes)
      if (field) fields.push(field)
    }
    
    // Deduplicate fields by name
    const uniqueFields = new Map<string, FormField>()
    fields.forEach(field => {
      if (!uniqueFields.has(field.name) || field.validation) {
        uniqueFields.set(field.name, field)
      }
    })
    
    return Array.from(uniqueFields.values())
  }

  private parseAttributes(attrString: string): Record<string, any> {
    const attrs: Record<string, any> = {}
    
    // Match attribute patterns
    const attrRegex = /(\w+)(?:=(?:{([^}]+)}|"([^"]*)"|'([^']*)'))?/g
    let match
    
    while ((match = attrRegex.exec(attrString)) !== null) {
      const key = match[1]
      const value = match[2] || match[3] || match[4] || true
      attrs[key] = value
    }
    
    return attrs
  }

  private attributesToField(attrs: Record<string, any>): FormField | null {
    if (!attrs.name || typeof attrs.name !== 'string') return null
    
    const field: FormField = {
      name: attrs.name,
      type: (attrs.type || 'text') as FormField['type']
    }
    
    if (attrs.placeholder) field.placeholder = attrs.placeholder
    if (attrs.label) field.label = attrs.label
    
    // Extract validation
    if (attrs.required) {
      field.validation = {
        field: field.name,
        type: 'required',
        config: { message: 'This field is required' }
      }
    } else if (attrs.pattern) {
      field.validation = {
        field: field.name,
        type: 'pattern',
        config: {
          pattern: new RegExp(attrs.pattern),
          message: 'Invalid format'
        }
      }
    } else if (attrs.minLength || attrs.maxLength) {
      field.validation = {
        field: field.name,
        type: 'length',
        config: {
          min: attrs.minLength ? parseInt(attrs.minLength) : undefined,
          max: attrs.maxLength ? parseInt(attrs.maxLength) : undefined,
          message: 'Invalid length'
        }
      }
    }
    
    return field
  }

  private findAPICalls(code: string): APICall[] {
    const apiCalls: APICall[] = []
    
    // Find fetch calls
    const fetchRegex = /fetch\s*\(\s*['"`]([^'"`]+)['"`](?:\s*,\s*({[\s\S]*?}))?\s*\)/g
    let match
    
    while ((match = fetchRegex.exec(code)) !== null) {
      const endpoint = match[1]
      const optionsStr = match[2]
      
      const apiCall: APICall = {
        method: 'GET',
        endpoint
      }
      
      if (optionsStr) {
        // Extract method
        const methodMatch = optionsStr.match(/method\s*:\s*['"`](\w+)['"`]/)
        if (methodMatch) {
          apiCall.method = methodMatch[1].toUpperCase() as APICall['method']
        }
        
        // Extract headers
        const headersMatch = optionsStr.match(/headers\s*:\s*{([^}]+)}/)
        if (headersMatch) {
          apiCall.headers = this.parseHeaders(headersMatch[1])
        }
      }
      
      apiCalls.push(apiCall)
    }
    
    // Find axios calls
    const axiosPatterns = [
      { regex: /axios\.get\s*\(\s*['"`]([^'"`]+)['"`]/, method: 'GET' },
      { regex: /axios\.post\s*\(\s*['"`]([^'"`]+)['"`]/, method: 'POST' },
      { regex: /axios\.put\s*\(\s*['"`]([^'"`]+)['"`]/, method: 'PUT' },
      { regex: /axios\.delete\s*\(\s*['"`]([^'"`]+)['"`]/, method: 'DELETE' }
    ]
    
    axiosPatterns.forEach(({ regex, method }) => {
      const matches = code.matchAll(new RegExp(regex, 'g'))
      for (const match of matches) {
        apiCalls.push({
          method: method as APICall['method'],
          endpoint: match[1]
        })
      }
    })
    
    return apiCalls
  }

  private parseHeaders(headersStr: string): Record<string, string> {
    const headers: Record<string, string> = {}
    const headerRegex = /['"`]([^'"`]+)['"`]\s*:\s*['"`]([^'"`]+)['"`]/g
    let match
    
    while ((match = headerRegex.exec(headersStr)) !== null) {
      headers[match[1]] = match[2]
    }
    
    return headers
  }

  private buildDataSchema(sources: {
    formFields: FormField[]
    apiCalls: APICall[]
  }): DataSchema {
    const schema: DataSchema = {
      type: 'object',
      properties: {},
      required: []
    }
    
    // Add form fields
    sources.formFields.forEach(field => {
      schema.properties[field.name] = this.fieldToPropertySchema(field)
      if (field.validation?.type === 'required') {
        schema.required.push(field.name)
      }
    })
    
    return schema
  }

  private fieldToPropertySchema(field: FormField): PropertySchema {
    const schema: PropertySchema = {
      type: 'string' // default
    }
    
    switch (field.type) {
      case 'number':
        schema.type = 'number'
        break
      case 'email':
        schema.type = 'string'
        schema.format = 'email'
        break
      case 'date':
        schema.type = 'string'
        schema.format = 'date'
        break
      case 'checkbox':
        schema.type = 'boolean'
        break
    }
    
    if (field.validation) {
      if (field.validation.type === 'pattern' && field.validation.config.pattern) {
        schema.pattern = field.validation.config.pattern.source
      }
      if (field.validation.type === 'length') {
        schema.minLength = field.validation.config.min
        schema.maxLength = field.validation.config.max
      }
    }
    
    return schema
  }

  private extractValidations(fields: FormField[]): ValidationRule[] {
    return fields
      .filter(field => field.validation)
      .map(field => field.validation!)
  }

  private generateTypeScript(schema: DataSchema): string {
    const lines: string[] = ['export interface GeneratedSchema {']
    
    Object.entries(schema.properties).forEach(([key, prop]) => {
      const required = schema.required.includes(key)
      const type = this.propertyToTypeScript(prop)
      lines.push(`  ${key}${required ? '' : '?'}: ${type}`)
    })
    
    lines.push('}')
    return lines.join('\n')
  }

  private propertyToTypeScript(prop: PropertySchema): string {
    switch (prop.type) {
      case 'string':
        return prop.enum ? prop.enum.map(v => `'${v}'`).join(' | ') : 'string'
      case 'number':
        return 'number'
      case 'boolean':
        return 'boolean'
      case 'array':
        return prop.items ? `${this.propertyToTypeScript(prop.items)}[]` : 'any[]'
      case 'object':
        return 'Record<string, any>'
      default:
        return 'any'
    }
  }

  private toJsonSchema(schema: DataSchema): object {
    return {
      $schema: 'http://json-schema.org/draft-07/schema#',
      ...schema
    }
  }
}
