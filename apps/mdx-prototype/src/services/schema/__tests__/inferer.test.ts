import { describe, it, expect, beforeEach } from 'vitest'
import { SchemaInferer } from '../inferer'

describe('SchemaInferer', () => {
  let inferer: SchemaInferer

  beforeEach(() => {
    inferer = new SchemaInferer()
  })

  describe('Type Inference', () => {
    it('should infer basic types', () => {
      expect(inferer.inferFromValue('hello').type).toBe('string')
      expect(inferer.inferFromValue(123).type).toBe('number')
      expect(inferer.inferFromValue(true).type).toBe('boolean')
      expect(inferer.inferFromValue([]).type).toBe('array')
      expect(inferer.inferFromValue({}).type).toBe('object')
      expect(inferer.inferFromValue(null).type).toBe('string') // default
    })

    it('should infer string formats', () => {
      expect(inferer.inferFromValue('test@example.com')).toMatchObject({
        type: 'string',
        format: 'email'
      })
      
      expect(inferer.inferFromValue('https://example.com')).toMatchObject({
        type: 'string',
        format: 'url'
      })
      
      expect(inferer.inferFromValue('2023-12-25')).toMatchObject({
        type: 'string',
        format: 'date'
      })
      
      expect(inferer.inferFromValue('2023-12-25T10:30:00Z')).toMatchObject({
        type: 'string',
        format: 'date-time'
      })
      
      expect(inferer.inferFromValue('550e8400-e29b-41d4-a716-446655440000')).toMatchObject({
        type: 'string',
        format: 'uuid'
      })
    })

    it('should detect patterns', () => {
      const options = { detectPatterns: true }
      
      const idSchema = inferer.inferFromValue('ABC-123', options)
      expect(idSchema.pattern).toBeDefined()
      
      const zipSchema = inferer.inferFromValue('12345', options)
      expect(zipSchema.pattern).toBeDefined()
    })
  })

  describe('Array Inference', () => {
    it('should infer array item types', () => {
      const schema = inferer.inferFromValue(['a', 'b', 'c'])
      expect(schema).toMatchObject({
        type: 'array',
        items: { type: 'string' }
      })
    })

    it('should handle mixed array types', () => {
      const schema = inferer.inferFromValue([1, 'two', 3])
      expect(schema.type).toBe('array')
      // Mixed types should default to most permissive
    })

    it('should handle empty arrays', () => {
      const schema = inferer.inferFromValue([])
      expect(schema).toMatchObject({
        type: 'array'
      })
      expect(schema.items).toBeUndefined()
    })
  })

  describe('Object Inference', () => {
    it('should infer object properties', () => {
      const schema = inferer.inferFromValue({
        name: 'John',
        age: 30,
        active: true
      })

      expect(schema).toMatchObject({
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
          active: { type: 'boolean' }
        }
      })
    })

    it('should mark required fields when configured', () => {
      const schema = inferer.inferFromValue({
        name: 'John',
        optional: null
      }, { markRequired: true })

      expect(schema.required).toContain('name')
      expect(schema.required).not.toContain('optional')
    })

    it('should handle nested objects', () => {
      const schema = inferer.inferFromValue({
        user: {
          name: 'John',
          profile: {
            age: 30
          }
        }
      })

      expect(schema.properties?.user).toMatchObject({
        type: 'object',
        properties: {
          name: { type: 'string' },
          profile: {
            type: 'object',
            properties: {
              age: { type: 'number' }
            }
          }
        }
      })
    })
  })

  describe('Sample-based Inference', () => {
    it('should infer from multiple samples', () => {
      const samples = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 },
        { name: 'Bob', age: 35 }
      ]

      const schema = inferer.inferFromSamples(samples)
      expect(schema).toMatchObject({
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' }
        }
      })
    })

    it('should handle optional fields in samples', () => {
      const samples = [
        { name: 'John', email: 'john@example.com' },
        { name: 'Jane' }, // email missing
        { name: 'Bob', email: 'bob@example.com' }
      ]

      const dataSchema = inferer.createDataSchema(samples)
      expect(dataSchema.required).toContain('name')
      expect(dataSchema.required).not.toContain('email')
    })

    it('should merge schemas from samples', () => {
      const samples = [
        { field1: 'value1' },
        { field2: 123 },
        { field1: 'value2', field3: true }
      ]

      const dataSchema = inferer.createDataSchema(samples)
      expect(dataSchema.properties).toHaveProperty('field1')
      expect(dataSchema.properties).toHaveProperty('field2')
      expect(dataSchema.properties).toHaveProperty('field3')
    })
  })

  describe('Special Cases', () => {
    it('should handle Date objects', () => {
      const schema = inferer.inferFromValue(new Date())
      expect(schema).toMatchObject({
        type: 'string',
        format: 'date-time'
      })
    })

    it('should handle phone numbers', () => {
      const phoneNumbers = [
        '+1-555-123-4567',
        '(555) 123-4567',
        '555 123 4567'
      ]

      phoneNumbers.forEach(phone => {
        const schema = inferer.inferFromValue(phone)
        expect(schema.format).toBe('phone')
      })
    })

    it('should handle null and undefined gracefully', () => {
      expect(inferer.inferFromValue(null).type).toBe('string')
      expect(inferer.inferFromValue(undefined).type).toBe('string')
      
      const schema = inferer.inferFromValue({ value: null })
      expect(schema.properties?.value).toBeDefined()
    })
  })

  describe('Complex Scenarios', () => {
    it('should infer schema from API response sample', () => {
      const apiResponse = {
        data: [
          {
            id: 'abc123',
            name: 'Product 1',
            price: 99.99,
            inStock: true,
            categories: ['electronics', 'gadgets'],
            metadata: {
              createdAt: '2023-12-25T10:00:00Z',
              updatedAt: '2023-12-26T15:30:00Z'
            }
          }
        ],
        total: 1,
        page: 1,
        pageSize: 10
      }

      const schema = inferer.inferFromValue(apiResponse)
      
      expect(schema.type).toBe('object')
      expect(schema.properties?.data).toMatchObject({
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            price: { type: 'number' },
            inStock: { type: 'boolean' },
            categories: {
              type: 'array',
              items: { type: 'string' }
            },
            metadata: {
              type: 'object',
              properties: {
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' }
              }
            }
          }
        }
      })
      expect(schema.properties?.total).toMatchObject({ type: 'number' })
      expect(schema.properties?.page).toMatchObject({ type: 'number' })
      expect(schema.properties?.pageSize).toMatchObject({ type: 'number' })
    })
  })
})
