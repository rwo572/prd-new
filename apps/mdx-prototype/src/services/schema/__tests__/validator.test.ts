import { describe, it, expect, beforeEach } from 'vitest'
import { SchemaValidator } from '../validator'
import { DataSchema } from '../../../types/schema'

describe('SchemaValidator', () => {
  let validator: SchemaValidator

  beforeEach(() => {
    validator = new SchemaValidator()
  })

  describe('Basic Validation', () => {
    it('should validate required fields', () => {
      const schema: DataSchema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          email: { type: 'string' }
        },
        required: ['name', 'email']
      }

      const validData = { name: 'John', email: 'john@example.com' }
      const invalidData = { name: 'John' }

      expect(validator.validate(validData, schema).valid).toBe(true)
      
      const result = validator.validate(invalidData, schema)
      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toMatchObject({
        field: 'email',
        type: 'required'
      })
    })

    it('should validate type constraints', () => {
      const schema: DataSchema = {
        type: 'object',
        properties: {
          age: { type: 'number' },
          active: { type: 'boolean' }
        },
        required: []
      }

      const validData = { age: 25, active: true }
      const invalidData = { age: '25', active: 'yes' }

      expect(validator.validate(validData, schema).valid).toBe(true)
      
      const result = validator.validate(invalidData, schema)
      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(2)
    })
  })

  describe('String Validation', () => {
    it('should validate string patterns', () => {
      const schema: DataSchema = {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$'
          }
        },
        required: []
      }

      expect(validator.validate({ email: 'test@example.com' }, schema).valid).toBe(true)
      expect(validator.validate({ email: 'invalid-email' }, schema).valid).toBe(false)
    })

    it('should validate string length', () => {
      const schema: DataSchema = {
        type: 'object',
        properties: {
          username: {
            type: 'string',
            minLength: 3,
            maxLength: 20
          }
        },
        required: []
      }

      expect(validator.validate({ username: 'john' }, schema).valid).toBe(true)
      expect(validator.validate({ username: 'jo' }, schema).valid).toBe(false)
      expect(validator.validate({ username: 'a'.repeat(21) }, schema).valid).toBe(false)
    })

    it('should validate string formats', () => {
      const schema: DataSchema = {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          website: { type: 'string', format: 'url' },
          birthdate: { type: 'string', format: 'date' }
        },
        required: []
      }

      const validData = {
        email: 'test@example.com',
        website: 'https://example.com',
        birthdate: '2000-01-01'
      }

      const invalidData = {
        email: 'not-an-email',
        website: 'not a url',
        birthdate: 'invalid-date'
      }

      expect(validator.validate(validData, schema).valid).toBe(true)
      
      const result = validator.validate(invalidData, schema)
      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(3)
    })
  })

  describe('Number Validation', () => {
    it('should validate number ranges', () => {
      const schema: DataSchema = {
        type: 'object',
        properties: {
          age: {
            type: 'number',
            minimum: 18,
            maximum: 100
          }
        },
        required: []
      }

      expect(validator.validate({ age: 25 }, schema).valid).toBe(true)
      expect(validator.validate({ age: 17 }, schema).valid).toBe(false)
      expect(validator.validate({ age: 101 }, schema).valid).toBe(false)
    })
  })

  describe('Enum Validation', () => {
    it('should validate enum values', () => {
      const schema: DataSchema = {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['active', 'inactive', 'pending']
          }
        },
        required: []
      }

      expect(validator.validate({ status: 'active' }, schema).valid).toBe(true)
      expect(validator.validate({ status: 'unknown' }, schema).valid).toBe(false)
    })
  })

  describe('Array Validation', () => {
    it('should validate array items', () => {
      const schema: DataSchema = {
        type: 'object',
        properties: {
          tags: {
            type: 'array',
            items: {
              type: 'string',
              minLength: 2
            }
          }
        },
        required: []
      }

      expect(validator.validate({ tags: ['tag1', 'tag2'] }, schema).valid).toBe(true)
      expect(validator.validate({ tags: ['t'] }, schema).valid).toBe(false)
    })
  })

  describe('Nested Object Validation', () => {
    it('should validate nested objects', () => {
      const schema: DataSchema = {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              age: { type: 'number' }
            },
            required: ['name']
          }
        },
        required: ['user']
      }

      const validData = {
        user: { name: 'John', age: 25 }
      }

      const invalidData1 = {
        user: { age: 25 }
      }

      const invalidData2 = {}

      expect(validator.validate(validData, schema).valid).toBe(true)
      expect(validator.validate(invalidData1, schema).valid).toBe(false)
      expect(validator.validate(invalidData2, schema).valid).toBe(false)
    })
  })

  describe('Custom Validation Rules', () => {
    it('should apply custom validation rules', () => {
      const schema: DataSchema = {
        type: 'object',
        properties: {
          password: {
            type: 'string',
            validation: {
              field: 'password',
              type: 'custom',
              config: {
                validator: (value: string) => value.length >= 8 && /[A-Z]/.test(value),
                message: 'Password must be at least 8 characters with one uppercase letter'
              }
            }
          }
        },
        required: []
      }

      expect(validator.validate({ password: 'StrongPass123' }, schema).valid).toBe(true)
      expect(validator.validate({ password: 'weak' }, schema).valid).toBe(false)
    })
  })

  describe('Additional Properties', () => {
    it('should reject additional properties when configured', () => {
      const schema: DataSchema = {
        type: 'object',
        properties: {
          name: { type: 'string' }
        },
        required: [],
        additionalProperties: false
      }

      const result = validator.validate({ name: 'John', extra: 'field' }, schema)
      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toMatchObject({
        field: 'extra',
        type: 'additional'
      })
    })
  })
})
