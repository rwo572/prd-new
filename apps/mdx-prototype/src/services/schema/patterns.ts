/**
 * Common patterns for schema extraction and validation
 */

// Common React component patterns
export const COMPONENT_PATTERNS = {
  // Functional component patterns
  FUNCTION_COMPONENT: /^(?:export\s+)?(?:const|function)\s+(\w+)\s*(?::\s*React\.FC)?.*?=>/,
  TYPED_COMPONENT: /^(?:export\s+)?const\s+(\w+)\s*:\s*React\.FC<(.+?)>/,
  
  // Hook patterns
  USE_STATE: /useState(?:<(.+?)>)?\s*\(/,
  USE_EFFECT: /useEffect\s*\(/,
  USE_FORM: /useForm(?:<(.+?)>)?\s*\(/,
  
  // Form patterns
  FORM_ELEMENT: /<(?:form|Form)\s+/,
  INPUT_ELEMENT: /<(?:input|Input|TextField)\s+/,
  SELECT_ELEMENT: /<(?:select|Select)\s+/,
}

// Common form library patterns
export const FORM_LIBRARY_PATTERNS = {
  // React Hook Form
  REACT_HOOK_FORM: {
    REGISTER: /register\s*\(\s*['"`](\w+)['"`]/,
    CONTROLLER: /<Controller\s+name=['"`](\w+)['"`]/,
    USE_FORM: /useForm(?:<(.+?)>)?\s*\(/,
  },
  
  // Formik
  FORMIK: {
    FIELD: /<Field\s+name=['"`](\w+)['"`]/,
    FORMIK_FORM: /<Formik\s+/,
    USE_FORMIK: /useFormik\s*\(/,
  },
  
  // React Final Form
  FINAL_FORM: {
    FIELD: /<Field\s+name=['"`](\w+)['"`]/,
    FORM: /<Form\s+/,
  }
}

// API call patterns
export const API_PATTERNS = {
  // Fetch API
  FETCH: /fetch\s*\(\s*['"`]([^'"`]+)['"`]/,
  FETCH_WITH_OPTIONS: /fetch\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*{/,
  
  // Axios
  AXIOS_GET: /axios\.get\s*\(\s*['"`]([^'"`]+)['"`]/,
  AXIOS_POST: /axios\.post\s*\(\s*['"`]([^'"`]+)['"`]/,
  AXIOS_PUT: /axios\.put\s*\(\s*['"`]([^'"`]+)['"`]/,
  AXIOS_DELETE: /axios\.delete\s*\(\s*['"`]([^'"`]+)['"`]/,
  
  // GraphQL
  GRAPHQL_QUERY: /gql`[\s\S]*?query\s+(\w+)/,
  GRAPHQL_MUTATION: /gql`[\s\S]*?mutation\s+(\w+)/,
  
  // Custom hooks
  USE_QUERY: /useQuery\s*\(/,
  USE_MUTATION: /useMutation\s*\(/,
}

// Validation patterns
export const VALIDATION_PATTERNS = {
  // HTML5 validation attributes
  REQUIRED: /required(?:=['"`](?:true|required)['"`])?/,
  PATTERN: /pattern=['"`]([^'"`]+)['"`]/,
  MIN_LENGTH: /minLength=['"`](\d+)['"`]/,
  MAX_LENGTH: /maxLength=['"`](\d+)['"`]/,
  MIN: /min=['"`]([^'"`]+)['"`]/,
  MAX: /max=['"`]([^'"`]+)['"`]/,
  
  // Yup schema
  YUP_STRING: /yup\.string\(\)/,
  YUP_NUMBER: /yup\.number\(\)/,
  YUP_BOOLEAN: /yup\.boolean\(\)/,
  YUP_OBJECT: /yup\.object\(\)/,
  YUP_ARRAY: /yup\.array\(\)/,
  YUP_REQUIRED: /\.required\(/,
  YUP_EMAIL: /\.email\(/,
  YUP_MIN: /\.min\((\d+)/,
  YUP_MAX: /\.max\((\d+)/,
  
  // Zod schema
  ZOD_STRING: /z\.string\(\)/,
  ZOD_NUMBER: /z\.number\(\)/,
  ZOD_BOOLEAN: /z\.boolean\(\)/,
  ZOD_OBJECT: /z\.object\(/,
  ZOD_ARRAY: /z\.array\(/,
}

// TypeScript type patterns
export const TYPE_PATTERNS = {
  // Interface declaration
  INTERFACE: /interface\s+(\w+)\s*{/,
  TYPE_ALIAS: /type\s+(\w+)\s*=/,
  
  // Prop types
  PROPS_INTERFACE: /interface\s+(\w+Props)\s*{/,
  PROPS_TYPE: /type\s+(\w+Props)\s*=/,
  
  // Common type annotations
  STRING_TYPE: /:\s*string/,
  NUMBER_TYPE: /:\s*number/,
  BOOLEAN_TYPE: /:\s*boolean/,
  ARRAY_TYPE: /:\s*(\w+)\[\]/,
  OPTIONAL_TYPE: /(\w+)\?:/,
}

/**
 * Extract field type from input type attribute
 */
export function extractFieldType(typeAttr: string): string {
  const typeMap: Record<string, string> = {
    'text': 'string',
    'email': 'string',
    'password': 'string',
    'number': 'number',
    'tel': 'string',
    'url': 'string',
    'date': 'string',
    'datetime-local': 'string',
    'time': 'string',
    'checkbox': 'boolean',
    'radio': 'string',
    'file': 'string',
  }
  
  return typeMap[typeAttr] || 'string'
}

/**
 * Extract validation from HTML attributes
 */
export function extractHtmlValidation(attributes: Record<string, any>): any {
  const validation: any = {}
  
  if (attributes.required) {
    validation.required = true
  }
  
  if (attributes.pattern) {
    validation.pattern = attributes.pattern
  }
  
  if (attributes.minLength) {
    validation.minLength = parseInt(attributes.minLength)
  }
  
  if (attributes.maxLength) {
    validation.maxLength = parseInt(attributes.maxLength)
  }
  
  if (attributes.min) {
    validation.min = attributes.type === 'number' ? parseFloat(attributes.min) : attributes.min
  }
  
  if (attributes.max) {
    validation.max = attributes.type === 'number' ? parseFloat(attributes.max) : attributes.max
  }
  
  return validation
}

/**
 * Common field name patterns for type inference
 */
export const FIELD_NAME_PATTERNS = {
  EMAIL: /email|e-mail|emailAddress/i,
  PASSWORD: /password|pass|pwd/i,
  PHONE: /phone|tel|mobile|cell/i,
  URL: /url|website|link|site/i,
  DATE: /date|dob|birthday|created|updated|expires/i,
  NUMBER: /age|amount|count|quantity|price|cost|total|score|rating/i,
  BOOLEAN: /is|has|can|should|enabled|disabled|active|checked/i,
}

/**
 * Infer field type from field name
 */
export function inferFieldTypeFromName(fieldName: string): string {
  if (FIELD_NAME_PATTERNS.EMAIL.test(fieldName)) return 'email'
  if (FIELD_NAME_PATTERNS.PASSWORD.test(fieldName)) return 'password'
  if (FIELD_NAME_PATTERNS.PHONE.test(fieldName)) return 'tel'
  if (FIELD_NAME_PATTERNS.URL.test(fieldName)) return 'url'
  if (FIELD_NAME_PATTERNS.DATE.test(fieldName)) return 'date'
  if (FIELD_NAME_PATTERNS.NUMBER.test(fieldName)) return 'number'
  if (FIELD_NAME_PATTERNS.BOOLEAN.test(fieldName)) return 'checkbox'
  
  return 'text'
}
