import { DataSchema, PropertySchema, ValidationRule } from '../../types/schema'

export class SchemaValidator {
  /**
   * Validate data against schema
   */
  validate(data: any, schema: DataSchema): ValidationResult {
    const errors: ValidationError[] = []
    
    // Check required fields
    schema.required.forEach(field => {
      if (!(field in data) || data[field] === null || data[field] === undefined) {
        errors.push({
          field,
          message: `Field '${field}' is required`,
          type: 'required'
        })
      }
    })
    
    // Validate each property
    Object.entries(schema.properties).forEach(([key, propSchema]) => {
      if (key in data) {
        const value = data[key]
        const propErrors = this.validateProperty(key, value, propSchema)
        errors.push(...propErrors)
      }
    })
    
    // Check for additional properties if not allowed
    if (schema.additionalProperties === false) {
      Object.keys(data).forEach(key => {
        if (!(key in schema.properties)) {
          errors.push({
            field: key,
            message: `Additional property '${key}' is not allowed`,
            type: 'additional'
          })
        }
      })
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Validate a single property
   */
  private validateProperty(
    field: string,
    value: any,
    schema: PropertySchema
  ): ValidationError[] {
    const errors: ValidationError[] = []
    
    // Type validation
    const actualType = this.getType(value)
    if (actualType !== schema.type && value !== null) {
      errors.push({
        field,
        message: `Expected type '${schema.type}' but got '${actualType}'`,
        type: 'type'
      })
      return errors // No point validating further if type is wrong
    }
    
    // String validations
    if (schema.type === 'string' && typeof value === 'string') {
      // Pattern validation
      if (schema.pattern) {
        const regex = new RegExp(schema.pattern)
        if (!regex.test(value)) {
          errors.push({
            field,
            message: `Value does not match pattern: ${schema.pattern}`,
            type: 'pattern'
          })
        }
      }
      
      // Length validation
      if (schema.minLength !== undefined && value.length < schema.minLength) {
        errors.push({
          field,
          message: `Value must be at least ${schema.minLength} characters`,
          type: 'minLength'
        })
      }
      
      if (schema.maxLength !== undefined && value.length > schema.maxLength) {
        errors.push({
          field,
          message: `Value must be at most ${schema.maxLength} characters`,
          type: 'maxLength'
        })
      }
      
      // Format validation
      if (schema.format) {
        if (!this.validateFormat(value, schema.format)) {
          errors.push({
            field,
            message: `Value is not a valid ${schema.format}`,
            type: 'format'
          })
        }
      }
    }
    
    // Number validations
    if (schema.type === 'number' && typeof value === 'number') {
      if (schema.minimum !== undefined && value < schema.minimum) {
        errors.push({
          field,
          message: `Value must be at least ${schema.minimum}`,
          type: 'minimum'
        })
      }
      
      if (schema.maximum !== undefined && value > schema.maximum) {
        errors.push({
          field,
          message: `Value must be at most ${schema.maximum}`,
          type: 'maximum'
        })
      }
    }
    
    // Enum validation
    if (schema.enum && !schema.enum.includes(value)) {
      errors.push({
        field,
        message: `Value must be one of: ${schema.enum.join(', ')}`,
        type: 'enum'
      })
    }
    
    // Array validations
    if (schema.type === 'array' && Array.isArray(value)) {
      if (schema.items) {
        value.forEach((item, index) => {
          const itemErrors = this.validateProperty(
            `${field}[${index}]`,
            item,
            schema.items
          )
          errors.push(...itemErrors)
        })
      }
    }
    
    // Object validations
    if (schema.type === 'object' && typeof value === 'object' && value !== null) {
      if (schema.properties) {
        // Validate nested properties
        Object.entries(schema.properties).forEach(([key, propSchema]) => {
          if (key in value) {
            const nestedErrors = this.validateProperty(
              `${field}.${key}`,
              value[key],
              propSchema
            )
            errors.push(...nestedErrors)
          }
        })
        
        // Check required nested fields
        if (schema.required) {
          schema.required.forEach(reqField => {
            if (!(reqField in value)) {
              errors.push({
                field: `${field}.${reqField}`,
                message: `Field is required`,
                type: 'required'
              })
            }
          })
        }
      }
    }
    
    // Custom validation
    if (schema.validation) {
      const customErrors = this.validateCustomRule(field, value, schema.validation)
      errors.push(...customErrors)
    }
    
    return errors
  }

  /**
   * Get JavaScript type of value
   */
  private getType(value: any): PropertySchema['type'] {
    if (value === null || value === undefined) return 'object'
    if (Array.isArray(value)) return 'array'
    if (typeof value === 'object') return 'object'
    if (typeof value === 'string') return 'string'
    if (typeof value === 'number') return 'number'
    if (typeof value === 'boolean') return 'boolean'
    return 'string'
  }

  /**
   * Validate format strings
   */
  private validateFormat(value: string, format: string): boolean {
    switch (format) {
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      case 'url':
        try {
          new URL(value)
          return true
        } catch {
          return false
        }
      case 'date':
        return !isNaN(Date.parse(value))
      case 'time':
        return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value)
      case 'date-time':
        return !isNaN(Date.parse(value))
      case 'uuid':
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
      default:
        return true
    }
  }

  /**
   * Validate custom rule
   */
  private validateCustomRule(
    field: string,
    value: any,
    rule: ValidationRule
  ): ValidationError[] {
    const errors: ValidationError[] = []
    
    switch (rule.type) {
      case 'custom':
        if (rule.config.validator && !rule.config.validator(value)) {
          errors.push({
            field,
            message: rule.config.message,
            type: 'custom'
          })
        }
        break
      
      case 'pattern':
        if (rule.config.pattern && !rule.config.pattern.test(String(value))) {
          errors.push({
            field,
            message: rule.config.message,
            type: 'pattern'
          })
        }
        break
      
      case 'length':
        const length = String(value).length
        if (rule.config.min !== undefined && length < rule.config.min) {
          errors.push({
            field,
            message: rule.config.message,
            type: 'length'
          })
        }
        if (rule.config.max !== undefined && length > rule.config.max) {
          errors.push({
            field,
            message: rule.config.message,
            type: 'length'
          })
        }
        break
      
      case 'range':
        const num = Number(value)
        if (rule.config.min !== undefined && num < rule.config.min) {
          errors.push({
            field,
            message: rule.config.message,
            type: 'range'
          })
        }
        if (rule.config.max !== undefined && num > rule.config.max) {
          errors.push({
            field,
            message: rule.config.message,
            type: 'range'
          })
        }
        break
    }
    
    return errors
  }
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
}

export interface ValidationError {
  field: string
  message: string
  type: string
}
