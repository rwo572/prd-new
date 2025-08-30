import * as parser from '@babel/parser'
import traverse from '@babel/traverse'
import * as t from '@babel/types'
import {
  DataSchema,
  PropertySchema,
  ComponentInfo,
  FormField,
  APICall,
  SchemaExtractionResult,
  ValidationRule
} from '../../types/schema'

export class SchemaExtractor {
  /**
   * Main entry point for schema extraction
   */
  extractSchema(component: ComponentInfo): SchemaExtractionResult {
    const ast = this.parseComponent(component.code)
    
    // Extract various aspects
    const formFields = this.findFormFields(ast)
    const apiCalls = this.findAPICalls(ast)
    const propSchema = this.extractPropSchema(component.props)
    
    // Build complete data schema
    const dataSchema = this.buildDataSchema({
      props: propSchema,
      formFields,
      apiCalls
    })
    
    // Extract validation rules
    const validations = this.extractValidations(formFields, ast)
    
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

  /**
   * Parse component code into AST
   */
  private parseComponent(code: string): t.File {
    return parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript']
    })
  }

  /**
   * Find form fields in component
   */
  private findFormFields(ast: t.File): FormField[] {
    const fields: FormField[] = []
    
    traverse(ast, {
      // Look for input elements
      JSXElement(path) {
        const element = path.node
        const tagName = (element.openingElement.name as t.JSXIdentifier).name
        
        if (['input', 'Input', 'TextField', 'FormInput'].includes(tagName)) {
          const field = this.extractFieldFromJSX(element)
          if (field) fields.push(field)
        }
      },
      
      // Look for form libraries (react-hook-form, formik, etc.)
      CallExpression(path) {
        const callee = path.node.callee
        
        // react-hook-form register
        if (t.isIdentifier(callee) && callee.name === 'register') {
          const field = this.extractFieldFromRegister(path.node)
          if (field) fields.push(field)
        }
        
        // useForm hook
        if (t.isIdentifier(callee) && callee.name === 'useForm') {
          const schema = this.extractSchemaFromUseForm(path.node)
          fields.push(...this.schemaToFields(schema))
        }
      }
    })
    
    return fields
  }

  /**
   * Extract field info from JSX element
   */
  private extractFieldFromJSX(element: t.JSXElement): FormField | null {
    const attributes = element.openingElement.attributes
    const field: Partial<FormField> = {}
    
    attributes.forEach(attr => {
      if (t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name)) {
        const name = attr.name.name
        const value = this.getAttributeValue(attr)
        
        switch (name) {
          case 'name':
            field.name = value
            break
          case 'type':
            field.type = value as FormField['type']
            break
          case 'label':
            field.label = value
            break
          case 'placeholder':
            field.placeholder = value
            break
          case 'required':
            if (!field.validation) {
              field.validation = {
                field: field.name || '',
                type: 'required',
                config: { message: 'This field is required' }
              }
            }
            break
          case 'pattern':
            if (!field.validation) {
              field.validation = {
                field: field.name || '',
                type: 'pattern',
                config: {
                  pattern: new RegExp(value),
                  message: 'Invalid format'
                }
              }
            }
            break
        }
      }
    })
    
    return field.name ? field as FormField : null
  }

  /**
   * Extract field from react-hook-form register
   */
  private extractFieldFromRegister(call: t.CallExpression): FormField | null {
    if (call.arguments.length < 1) return null
    
    const nameArg = call.arguments[0]
    if (!t.isStringLiteral(nameArg)) return null
    
    const field: FormField = {
      name: nameArg.value,
      type: 'text' // default
    }
    
    // Check for validation rules in second argument
    if (call.arguments.length > 1 && t.isObjectExpression(call.arguments[1])) {
      const rules = call.arguments[1]
      rules.properties.forEach(prop => {
        if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
          switch (prop.key.name) {
            case 'required':
              field.validation = {
                field: field.name,
                type: 'required',
                config: { message: 'This field is required' }
              }
              break
            case 'pattern':
              if (t.isRegExpLiteral(prop.value)) {
                field.validation = {
                  field: field.name,
                  type: 'pattern',
                  config: {
                    pattern: new RegExp(prop.value.pattern, prop.value.flags),
                    message: 'Invalid format'
                  }
                }
              }
              break
          }
        }
      })
    }
    
    return field
  }

  /**
   * Find API calls in component
   */
  private findAPICalls(ast: t.File): APICall[] {
    const apiCalls: APICall[] = []
    
    traverse(ast, {
      // Look for fetch calls
      CallExpression(path) {
        const callee = path.node.callee
        
        // Native fetch
        if (t.isIdentifier(callee) && callee.name === 'fetch') {
          const apiCall = this.extractFetchCall(path.node)
          if (apiCall) apiCalls.push(apiCall)
        }
        
        // Axios calls
        if (t.isMemberExpression(callee) && 
            t.isIdentifier(callee.object) && 
            callee.object.name === 'axios') {
          const apiCall = this.extractAxiosCall(path.node)
          if (apiCall) apiCalls.push(apiCall)
        }
      },
      
      // Look for async functions that might contain API calls
      FunctionDeclaration(path) {
        if (path.node.async) {
          this.analyzeAsyncFunction(path.node, apiCalls)
        }
      }
    })
    
    return apiCalls
  }

  /**
   * Extract API call from fetch
   */
  private extractFetchCall(call: t.CallExpression): APICall | null {
    if (call.arguments.length < 1) return null
    
    const urlArg = call.arguments[0]
    if (!t.isStringLiteral(urlArg)) return null
    
    const apiCall: APICall = {
      method: 'GET',
      endpoint: urlArg.value
    }
    
    // Check for options object
    if (call.arguments.length > 1 && t.isObjectExpression(call.arguments[1])) {
      const options = call.arguments[1]
      options.properties.forEach(prop => {
        if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
          switch (prop.key.name) {
            case 'method':
              if (t.isStringLiteral(prop.value)) {
                apiCall.method = prop.value.value as APICall['method']
              }
              break
            case 'body':
              apiCall.requestBody = this.extractRequestBody(prop.value)
              break
            case 'headers':
              apiCall.headers = this.extractHeaders(prop.value)
              break
          }
        }
      })
    }
    
    return apiCall
  }

  /**
   * Build complete data schema from various sources
   */
  private buildDataSchema(sources: {
    props?: Record<string, PropertySchema>
    formFields: FormField[]
    apiCalls: APICall[]
  }): DataSchema {
    const schema: DataSchema = {
      type: 'object',
      properties: {},
      required: []
    }
    
    // Add prop-based properties
    if (sources.props) {
      Object.entries(sources.props).forEach(([key, prop]) => {
        schema.properties[key] = prop
        if (prop.validation?.type === 'required') {
          schema.required.push(key)
        }
      })
    }
    
    // Add form fields
    sources.formFields.forEach(field => {
      schema.properties[field.name] = this.fieldToPropertySchema(field)
      if (field.validation?.type === 'required') {
        schema.required.push(field.name)
      }
    })
    
    // Infer from API calls
    sources.apiCalls.forEach(call => {
      if (call.requestBody) {
        const apiSchema = this.inferSchemaFromValue(call.requestBody)
        this.mergeSchemas(schema, apiSchema)
      }
    })
    
    return schema
  }

  /**
   * Convert form field to property schema
   */
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
      case 'select':
        if (field.options) {
          schema.enum = field.options.map(opt => opt.value)
        }
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

  /**
   * Generate TypeScript interface from schema
   */
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

  /**
   * Convert property schema to TypeScript type
   */
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
        if (prop.properties) {
          const props = Object.entries(prop.properties)
            .map(([k, v]) => `${k}: ${this.propertyToTypeScript(v)}`)
            .join('; ')
          return `{ ${props} }`
        }
        return 'Record<string, any>'
      default:
        return 'any'
    }
  }

  /**
   * Convert to JSON Schema format
   */
  private toJsonSchema(schema: DataSchema): object {
    return {
      $schema: 'http://json-schema.org/draft-07/schema#',
      ...schema
    }
  }

  // Helper methods
  private getAttributeValue(attr: t.JSXAttribute): string {
    if (!attr.value) return 'true'
    if (t.isStringLiteral(attr.value)) return attr.value.value
    if (t.isJSXExpressionContainer(attr.value) && t.isStringLiteral(attr.value.expression)) {
      return attr.value.expression.value
    }
    return ''
  }

  private extractRequestBody(node: t.Node): any {
    if (t.isCallExpression(node) && 
        t.isMemberExpression(node.callee) &&
        t.isIdentifier(node.callee.object) &&
        node.callee.object.name === 'JSON' &&
        t.isIdentifier(node.callee.property) &&
        node.callee.property.name === 'stringify') {
      // JSON.stringify(data)
      return {}
    }
    return {}
  }

  private extractHeaders(node: t.Node): Record<string, string> {
    if (t.isObjectExpression(node)) {
      const headers: Record<string, string> = {}
      node.properties.forEach(prop => {
        if (t.isObjectProperty(prop) && 
            t.isIdentifier(prop.key) && 
            t.isStringLiteral(prop.value)) {
          headers[prop.key.name] = prop.value.value
        }
      })
      return headers
    }
    return {}
  }

  private extractAxiosCall(call: t.CallExpression): APICall | null {
    // Implementation for axios calls
    return null
  }

  private analyzeAsyncFunction(func: t.FunctionDeclaration, apiCalls: APICall[]): void {
    // Analyze async function body for API calls
  }

  private extractSchemaFromUseForm(call: t.CallExpression): any {
    // Extract schema from useForm configuration
    return {}
  }

  private schemaToFields(schema: any): FormField[] {
    // Convert schema to form fields
    return []
  }

  private extractPropSchema(props?: Record<string, any>): Record<string, PropertySchema> {
    if (!props) return {}
    
    const schema: Record<string, PropertySchema> = {}
    Object.entries(props).forEach(([key, prop]) => {
      schema[key] = {
        type: this.inferType(prop.type),
        description: prop.description
      }
    })
    return schema
  }

  private inferType(type: any): PropertySchema['type'] {
    if (typeof type === 'string') {
      switch (type.toLowerCase()) {
        case 'string': return 'string'
        case 'number': return 'number'
        case 'boolean': return 'boolean'
        case 'array': return 'array'
        default: return 'object'
      }
    }
    return 'string'
  }

  private extractValidations(fields: FormField[], ast: t.File): ValidationRule[] {
    return fields
      .filter(field => field.validation)
      .map(field => field.validation!)
  }

  private inferSchemaFromValue(value: any): DataSchema {
    const schema: DataSchema = {
      type: 'object',
      properties: {},
      required: []
    }
    
    if (typeof value === 'object' && value !== null) {
      Object.entries(value).forEach(([key, val]) => {
        schema.properties[key] = {
          type: typeof val as PropertySchema['type']
        }
      })
    }
    
    return schema
  }

  private mergeSchemas(target: DataSchema, source: DataSchema): void {
    Object.entries(source.properties).forEach(([key, prop]) => {
      if (!target.properties[key]) {
        target.properties[key] = prop
      }
    })
    
    source.required.forEach(field => {
      if (!target.required.includes(field)) {
        target.required.push(field)
      }
    })
  }
}
