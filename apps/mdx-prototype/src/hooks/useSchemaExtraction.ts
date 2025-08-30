import { useState, useCallback } from 'react'
import { extractSchemaFromCode, extractSchemaFromMDX } from '../services/schema'
import { SchemaExtractionResult, ComponentInfo } from '../types/schema'

interface UseSchemaExtractionOptions {
  autoExtract?: boolean
  debounceMs?: number
}

export function useSchemaExtraction(options: UseSchemaExtractionOptions = {}) {
  const { autoExtract = true, debounceMs = 1000 } = options
  
  const [isExtracting, setIsExtracting] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [results, setResults] = useState<Record<string, SchemaExtractionResult>>({})
  
  // Extract schema from a single component
  const extractFromComponent = useCallback(async (
    code: string,
    componentName?: string
  ): Promise<SchemaExtractionResult | null> => {
    setIsExtracting(true)
    setError(null)
    
    try {
      const result = await extractSchemaFromCode(code, componentName)
      
      if (componentName) {
        setResults(prev => ({
          ...prev,
          [componentName]: result
        }))
      }
      
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Schema extraction failed')
      setError(error)
      console.error('Schema extraction error:', error)
      return null
    } finally {
      setIsExtracting(false)
    }
  }, [])
  
  // Extract schemas from MDX content
  const extractFromMDX = useCallback(async (
    mdxContent: string
  ): Promise<Record<string, SchemaExtractionResult>> => {
    setIsExtracting(true)
    setError(null)
    
    try {
      const extractedSchemas = await extractSchemaFromMDX(mdxContent)
      setResults(extractedSchemas)
      return extractedSchemas
    } catch (err) {
      const error = err instanceof Error ? err : new Error('MDX schema extraction failed')
      setError(error)
      console.error('MDX schema extraction error:', error)
      return {}
    } finally {
      setIsExtracting(false)
    }
  }, [])
  
  // Get schema for a specific component
  const getSchema = useCallback((componentName: string) => {
    return results[componentName] || null
  }, [results])
  
  // Get TypeScript definitions for all components
  const getTypeScriptDefinitions = useCallback((): string => {
    const definitions: string[] = []
    
    Object.entries(results).forEach(([name, result]) => {
      definitions.push(`// ${name}`)
      definitions.push(result.typescript)
      definitions.push('')
    })
    
    return definitions.join('\n')
  }, [results])
  
  // Get combined JSON schema
  const getCombinedJsonSchema = useCallback(() => {
    const combined = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: {} as Record<string, any>,
      definitions: {} as Record<string, any>
    }
    
    Object.entries(results).forEach(([name, result]) => {
      combined.definitions[name] = result.jsonSchema
    })
    
    return combined
  }, [results])
  
  // Clear all results
  const clear = useCallback(() => {
    setResults({})
    setError(null)
  }, [])
  
  return {
    // State
    isExtracting,
    error,
    results,
    
    // Actions
    extractFromComponent,
    extractFromMDX,
    getSchema,
    getTypeScriptDefinitions,
    getCombinedJsonSchema,
    clear,
    
    // Computed
    componentCount: Object.keys(results).length,
    hasResults: Object.keys(results).length > 0
  }
}

// Hook for real-time schema extraction from editor content
export function useRealtimeSchemaExtraction(
  content: string,
  options: UseSchemaExtractionOptions = {}
) {
  const schemaExtraction = useSchemaExtraction(options)
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)
  
  // Debounced extraction
  const extract = useCallback(() => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    
    const id = setTimeout(() => {
      if (content.includes('```')) {
        schemaExtraction.extractFromMDX(content)
      }
    }, options.debounceMs || 1000)
    
    setTimeoutId(id)
  }, [content, options.debounceMs, schemaExtraction, timeoutId])
  
  // Extract on content change if autoExtract is enabled
  if (options.autoExtract !== false) {
    extract()
  }
  
  return schemaExtraction
}
