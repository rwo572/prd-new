import { DataSchema, PropertySchema } from '../../types/schema'

/**
 * Infer JSON Schema from JavaScript values and patterns
 */
export class SchemaInferer {
  /**
   * Infer schema from a sample value
   */
  inferFromValue(value: any, options?: InferOptions): PropertySchema {
    if (value === null || value === undefined) {
      return { type: 'string' } // Default for null/undefined
    }
    
    if (Array.isArray(value)) {
      return this.inferArraySchema(value, options)
    }
    
    if (value instanceof Date) {
      return {
        type: 'string',
        format: 'date-time'
      }
    }
    
    if (typeof value === 'object') {
      return this.inferObjectSchema(value, options)
    }
    
    if (typeof value === 'string') {
      return this.inferStringSchema(value, options)
    }
    
    if (typeof value === 'number') {
      return this.inferNumberSchema(value, options)
    }
    
    if (typeof value === 'boolean') {
      return { type: 'boolean' }
    }
    
    return { type: 'string' } // Fallback
  }

  /**
   * Infer schema from multiple sample values
   */
  inferFromSamples(samples: any[]): PropertySchema {
    if (samples.length === 0) {
      return { type: 'string' }
    }
    
    // Collect all unique types
    const types = new Set<string>()
    const schemas: PropertySchema[] = []
    
    samples.forEach(sample => {
      const schema = this.inferFromValue(sample)
      types.add(schema.type)
      schemas.push(schema)
    })
    
    // If all same type, merge schemas
    if (types.size === 1) {
      return this.mergeSchemas(schemas)
    }
    
    // Mixed types - return most permissive
    return { type: 'string' }
  }

  /**
   * Infer array schema
   */
  private inferArraySchema(arr: any[], options?: InferOptions): PropertySchema {
    const schema: PropertySchema = {
      type: 'array'
    }
    
    if (arr.length > 0) {
      // Infer items schema from all elements
      const itemSchemas = arr.map(item => this.inferFromValue(item, options))
      schema.items = this.mergeSchemas(itemSchemas)
    }
    
    return schema
  }

  /**
   * Infer object schema
   */
  private inferObjectSchema(obj: Record<string, any>, options?: InferOptions): PropertySchema {
    const schema: PropertySchema = {
      type: 'object',
      properties: {},
      required: []
    }
    
    Object.entries(obj).forEach(([key, value]) => {
      if (schema.properties) {
        schema.properties[key] = this.inferFromValue(value, options)
        
        // Mark as required if not null/undefined
        if (value !== null && value !== undefined && options?.markRequired) {
          schema.required?.push(key)
        }
      }
    })
    
    return schema
  }

  /**
   * Infer string schema with format detection
   */
  private inferStringSchema(value: string, options?: InferOptions): PropertySchema {
    const schema: PropertySchema = {
      type: 'string'
    }
    
    // Detect formats
    if (this.isEmail(value)) {
      schema.format = 'email'
    } else if (this.isUrl(value)) {
      schema.format = 'url'
    } else if (this.isDate(value)) {
      schema.format = 'date'
    } else if (this.isDateTime(value)) {
      schema.format = 'date-time'
    } else if (this.isUuid(value)) {
      schema.format = 'uuid'
    } else if (this.isPhoneNumber(value)) {
      schema.format = 'phone'
    }
    
    // Detect patterns
    if (options?.detectPatterns) {
      const pattern = this.detectPattern(value)
      if (pattern) {
        schema.pattern = pattern
      }
    }
    
    return schema
  }

  /**
   * Infer number schema
   */
  private inferNumberSchema(value: number, options?: InferOptions): PropertySchema {
    const schema: PropertySchema = {
      type: 'number'
    }
    
    // Check if integer
    if (Number.isInteger(value)) {
      schema.type = 'number'
      // Could add integer format, but keeping as number for flexibility
    }
    
    return schema
  }

  /**
   * Merge multiple schemas into one
   */
  private mergeSchemas(schemas: PropertySchema[]): PropertySchema {
    if (schemas.length === 0) {
      return { type: 'string' }
    }
    
    if (schemas.length === 1) {
      return schemas[0]
    }
    
    // Start with first schema as base
    const merged = { ...schemas[0] }
    
    // Merge properties for objects
    if (merged.type === 'object' && merged.properties) {
      schemas.slice(1).forEach(schema => {
        if (schema.type === 'object' && schema.properties) {
          Object.entries(schema.properties).forEach(([key, prop]) => {
            if (merged.properties![key]) {
              // Property exists in both - merge them
              merged.properties![key] = this.mergeSchemas([
                merged.properties![key],
                prop
              ])
            } else {
              // New property
              merged.properties![key] = prop
            }
          })
          
          // Merge required arrays
          if (schema.required && merged.required) {
            const requiredSet = new Set([...merged.required, ...schema.required])
            merged.required = Array.from(requiredSet)
          }
        }
      })
    }
    
    // For arrays, merge item schemas
    if (merged.type === 'array' && merged.items) {
      const itemSchemas = schemas
        .filter(s => s.type === 'array' && s.items)
        .map(s => s.items!)
      
      if (itemSchemas.length > 0) {
        merged.items = this.mergeSchemas(itemSchemas)
      }
    }
    
    return merged
  }

  /**
   * Create a data schema from samples
   */
  createDataSchema(samples: Record<string, any>[]): DataSchema {
    if (samples.length === 0) {
      return {
        type: 'object',
        properties: {},
        required: []
      }
    }
    
    // Merge all samples to get complete property list
    const merged: Record<string, any[]> = {}
    const requiredFields = new Set<string>()
    
    samples.forEach(sample => {
      Object.entries(sample).forEach(([key, value]) => {
        if (!merged[key]) {
          merged[key] = []
        }
        merged[key].push(value)
        
        // If present in all samples and not null, mark as required
        if (value !== null && value !== undefined) {
          requiredFields.add(key)
        }
      })
    })
    
    // Check which fields are actually required (present in all samples)
    const totalSamples = samples.length
    const actuallyRequired = Array.from(requiredFields).filter(field => {
      const presentCount = merged[field].filter(v => v !== null && v !== undefined).length
      return presentCount === totalSamples
    })
    
    // Build schema
    const schema: DataSchema = {
      type: 'object',
      properties: {},
      required: actuallyRequired
    }
    
    Object.entries(merged).forEach(([key, values]) => {
      schema.properties[key] = this.inferFromSamples(values)
    })
    
    return schema
  }

  // Format detection helpers
  private isEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  }

  private isUrl(value: string): boolean {
    try {
      new URL(value)
      return true
    } catch {
      return false
    }
  }

  private isDate(value: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(value) && !isNaN(Date.parse(value))
  }

  private isDateTime(value: string): boolean {
    return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value) && !isNaN(Date.parse(value))
  }

  private isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
  }

  private isPhoneNumber(value: string): boolean {
    // Simple phone number check - could be enhanced
    return /^[\d\s\-\+\(\)]+$/.test(value) && value.replace(/\D/g, '').length >= 10
  }

  /**
   * Detect common patterns in strings
   */
  private detectPattern(value: string): string | undefined {
    // Check for common patterns
    const patterns = [
      { regex: /^[A-Z0-9]{2,}-\d+$/, pattern: '^[A-Z0-9]{2,}-\\d+$' }, // ID pattern
      { regex: /^[a-z0-9]{8,}$/, pattern: '^[a-z0-9]{8,}$' }, // Lowercase ID
      { regex: /^[A-Z]{3}$/, pattern: '^[A-Z]{3}$' }, // Currency code
      { regex: /^\d{5}(-\d{4})?$/, pattern: '^\\d{5}(-\\d{4})?$' }, // ZIP code
    ]
    
    for (const { regex, pattern } of patterns) {
      if (regex.test(value)) {
        return pattern
      }
    }
    
    return undefined
  }
}

export interface InferOptions {
  markRequired?: boolean
  detectPatterns?: boolean
  sampleSize?: number
}
