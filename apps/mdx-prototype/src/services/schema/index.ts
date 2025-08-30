// Main schema extraction service API

export { SchemaValidator } from './validator'
export { SchemaInferer } from './inferer'
export * from './patterns'

import { BrowserSchemaExtractor } from './browser-extractor'
import { ComponentInfo, SchemaExtractionResult } from '../../types/schema'

// Use browser-compatible extractor
let extractorInstance: BrowserSchemaExtractor | null = null

/**
 * Extract data schema from a React component
 */
export function extractDataSchema(component: ComponentInfo): SchemaExtractionResult {
  if (!extractorInstance) {
    extractorInstance = new BrowserSchemaExtractor()
  }
  return extractorInstance.extractSchema(component)
}

/**
 * Extract schema from component code string
 */
export async function extractSchemaFromCode(
  code: string,
  componentName?: string
): Promise<SchemaExtractionResult> {
  const component: ComponentInfo = {
    name: componentName || 'Component',
    code,
    ast: null // Will be parsed by extractor
  }
  
  return extractDataSchema(component)
}

/**
 * Extract schema from MDX content
 */
export async function extractSchemaFromMDX(
  mdxContent: string
): Promise<Record<string, SchemaExtractionResult>> {
  const componentRegex = /```(?:jsx?|tsx?)\n([\s\S]*?)```/g
  const results: Record<string, SchemaExtractionResult> = {}
  
  let match
  let index = 0
  
  while ((match = componentRegex.exec(mdxContent)) !== null) {
    const code = match[1]
    const componentName = `Component${index++}`
    
    try {
      results[componentName] = await extractSchemaFromCode(code, componentName)
    } catch (error) {
      console.error(`Failed to extract schema from ${componentName}:`, error)
    }
  }
  
  return results
}
