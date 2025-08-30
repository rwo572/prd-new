import { describe, it, expect, beforeEach } from 'vitest'
import { SchemaExtractor } from '../extractor'
import { ComponentInfo } from '../../../types/schema'

describe('SchemaExtractor', () => {
  let extractor: SchemaExtractor

  beforeEach(() => {
    extractor = new SchemaExtractor()
  })

  describe('Form Field Extraction', () => {
    it('should extract basic input fields', () => {
      const component: ComponentInfo = {
        name: 'LoginForm',
        code: `
          function LoginForm() {
            return (
              <form>
                <input type="email" name="email" placeholder="Email" required />
                <input type="password" name="password" placeholder="Password" required />
                <button type="submit">Login</button>
              </form>
            )
          }
        `,
        ast: null
      }

      const result = extractor.extractSchema(component)

      expect(result.formFields).toHaveLength(2)
      expect(result.formFields[0]).toMatchObject({
        name: 'email',
        type: 'email',
        placeholder: 'Email'
      })
      expect(result.formFields[1]).toMatchObject({
        name: 'password',
        type: 'password',
        placeholder: 'Password'
      })
    })

    it('should extract React Hook Form fields', () => {
      const component: ComponentInfo = {
        name: 'RegisterForm',
        code: `
          function RegisterForm() {
            const { register, handleSubmit } = useForm()
            
            return (
              <form onSubmit={handleSubmit(onSubmit)}>
                <input {...register('username', { required: true })} />
                <input {...register('email', { 
                  required: 'Email is required',
                  pattern: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}$/i
                })} />
                <button type="submit">Register</button>
              </form>
            )
          }
        `,
        ast: null
      }

      const result = extractor.extractSchema(component)

      expect(result.formFields).toHaveLength(2)
      expect(result.formFields[0].name).toBe('username')
      expect(result.formFields[1].name).toBe('email')
      expect(result.formFields[1].validation?.type).toBe('pattern')
    })

    it('should extract custom component fields', () => {
      const component: ComponentInfo = {
        name: 'ProfileForm',
        code: `
          function ProfileForm() {
            return (
              <Form>
                <TextField name="firstName" label="First Name" required />
                <TextField name="lastName" label="Last Name" required />
                <Input name="age" type="number" min={18} max={100} />
              </Form>
            )
          }
        `,
        ast: null
      }

      const result = extractor.extractSchema(component)

      expect(result.formFields).toHaveLength(3)
      expect(result.formFields[2]).toMatchObject({
        name: 'age',
        type: 'number'
      })
    })
  })

  describe('API Call Extraction', () => {
    it('should extract fetch API calls', () => {
      const component: ComponentInfo = {
        name: 'UserList',
        code: `
          function UserList() {
            useEffect(() => {
              fetch('/api/users')
                .then(res => res.json())
                .then(data => setUsers(data))
            }, [])
            
            const createUser = async (user) => {
              const response = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(user)
              })
            }
            
            return <div>...</div>
          }
        `,
        ast: null
      }

      const result = extractor.extractSchema(component)

      expect(result.apiCalls).toHaveLength(2)
      expect(result.apiCalls[0]).toMatchObject({
        method: 'GET',
        endpoint: '/api/users'
      })
      expect(result.apiCalls[1]).toMatchObject({
        method: 'POST',
        endpoint: '/api/users',
        headers: { 'Content-Type': 'application/json' }
      })
    })

    it('should extract axios API calls', () => {
      const component: ComponentInfo = {
        name: 'ProductManager',
        code: `
          function ProductManager() {
            const loadProducts = async () => {
              const { data } = await axios.get('/api/products')
              setProducts(data)
            }
            
            const updateProduct = async (id, product) => {
              await axios.put(\`/api/products/\${id}\`, product)
            }
            
            const deleteProduct = async (id) => {
              await axios.delete(\`/api/products/\${id}\`)
            }
            
            return <div>...</div>
          }
        `,
        ast: null
      }

      const result = extractor.extractSchema(component)

      expect(result.apiCalls.length).toBeGreaterThanOrEqual(1)
      // Note: Dynamic URLs might not be fully extracted
    })
  })

  describe('Data Schema Generation', () => {
    it('should generate schema from form fields', () => {
      const component: ComponentInfo = {
        name: 'ContactForm',
        code: `
          function ContactForm() {
            return (
              <form>
                <input name="name" type="text" required />
                <input name="email" type="email" required />
                <textarea name="message" required />
                <input name="subscribe" type="checkbox" />
              </form>
            )
          }
        `,
        ast: null
      }

      const result = extractor.extractSchema(component)

      expect(result.dataSchema.properties).toHaveProperty('name')
      expect(result.dataSchema.properties).toHaveProperty('email')
      expect(result.dataSchema.properties).toHaveProperty('message')
      expect(result.dataSchema.properties).toHaveProperty('subscribe')
      
      expect(result.dataSchema.properties.email).toMatchObject({
        type: 'string',
        format: 'email'
      })
      expect(result.dataSchema.properties.subscribe).toMatchObject({
        type: 'boolean'
      })
      
      expect(result.dataSchema.required).toContain('name')
      expect(result.dataSchema.required).toContain('email')
      expect(result.dataSchema.required).toContain('message')
    })

    it('should generate TypeScript interface', () => {
      const component: ComponentInfo = {
        name: 'UserForm',
        code: `
          function UserForm() {
            return (
              <form>
                <input name="username" type="text" required />
                <input name="age" type="number" />
                <input name="isActive" type="checkbox" />
              </form>
            )
          }
        `,
        ast: null
      }

      const result = extractor.extractSchema(component)

      expect(result.typescript).toContain('export interface GeneratedSchema')
      expect(result.typescript).toContain('username: string')
      expect(result.typescript).toContain('age?: number')
      expect(result.typescript).toContain('isActive?: boolean')
    })

    it('should generate JSON Schema', () => {
      const component: ComponentInfo = {
        name: 'SimpleForm',
        code: `
          function SimpleForm() {
            return (
              <form>
                <input name="title" type="text" required />
              </form>
            )
          }
        `,
        ast: null
      }

      const result = extractor.extractSchema(component)

      expect(result.jsonSchema).toHaveProperty('$schema')
      expect(result.jsonSchema).toMatchObject({
        type: 'object',
        properties: {
          title: { type: 'string' }
        },
        required: ['title']
      })
    })
  })

  describe('Validation Rule Extraction', () => {
    it('should extract HTML5 validation attributes', () => {
      const component: ComponentInfo = {
        name: 'ValidationForm',
        code: `
          function ValidationForm() {
            return (
              <form>
                <input 
                  name="username" 
                  required 
                  minLength={3} 
                  maxLength={20} 
                  pattern="[a-zA-Z0-9]+"
                />
                <input 
                  name="age" 
                  type="number" 
                  min={18} 
                  max={99}
                />
              </form>
            )
          }
        `,
        ast: null
      }

      const result = extractor.extractSchema(component)

      expect(result.validations).toHaveLength(2)
      
      const usernameValidation = result.validations.find(v => v.field === 'username')
      expect(usernameValidation).toBeDefined()
      
      const ageValidation = result.validations.find(v => v.field === 'age')
      expect(ageValidation).toBeDefined()
    })
  })

  describe('Complex Component Handling', () => {
    it('should handle components with mixed patterns', () => {
      const component: ComponentInfo = {
        name: 'ComplexForm',
        code: `
          function ComplexForm() {
            const { register, handleSubmit, watch } = useForm()
            const [data, setData] = useState(null)
            
            useEffect(() => {
              fetch('/api/options')
                .then(res => res.json())
                .then(setData)
            }, [])
            
            const onSubmit = async (formData) => {
              await fetch('/api/submit', {
                method: 'POST',
                body: JSON.stringify(formData)
              })
            }
            
            return (
              <form onSubmit={handleSubmit(onSubmit)}>
                <input {...register('field1', { required: true })} />
                <select {...register('field2')}>
                  {data?.options.map(opt => (
                    <option key={opt.id} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <Input name="field3" type="email" required />
              </form>
            )
          }
        `,
        ast: null
      }

      const result = extractor.extractSchema(component)

      expect(result.formFields.length).toBeGreaterThanOrEqual(3)
      expect(result.apiCalls.length).toBeGreaterThanOrEqual(2)
      expect(result.dataSchema.properties).toHaveProperty('field1')
      expect(result.dataSchema.properties).toHaveProperty('field2')
      expect(result.dataSchema.properties).toHaveProperty('field3')
    })
  })
})
