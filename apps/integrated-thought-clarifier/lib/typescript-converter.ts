export function convertTypeScriptToJavaScript(code: string): string {
  // Since we're in the browser, we can't use sucrase
  // Use improved regex-based stripping
  return stripTypeScript(code)
}

function stripTypeScript(code: string): string {
  let modifiedCode = code
    .replace(/^import\s+.*?\s+from\s+['"].*?['"];?\s*$/gm, '')
    .replace(/^export\s+(?:default\s+)?/gm, '')
    
  // Remove TypeScript type/interface/enum declarations more thoroughly
  modifiedCode = modifiedCode
    .replace(/^type\s+\w+\s*=[\s\S]*?(?=\n(?:type|interface|enum|const|let|var|function|class|export|$))/gm, '')
    .replace(/^interface\s+\w+[\s\S]*?\}\s*$/gm, '')
    .replace(/^enum\s+\w+[\s\S]*?\}\s*$/gm, '')
    
  // Remove TypeScript type annotations
  // Handle function parameters with types
  modifiedCode = modifiedCode
    .replace(/(\w+)\s*:\s*(?:string|number|boolean|any|void|never|unknown|object|undefined|null)(?:\[\])?/g, '$1')
    .replace(/(\w+)\s*:\s*[A-Z]\w*(?:<[^>]+>)?(?:\[\])?/g, '$1') // Custom types
    .replace(/(\w+)\s*:\s*\{[^}]*\}/g, '$1') // Object type literals
    .replace(/(\w+)\s*:\s*\[[^\]]*\]/g, '$1') // Tuple types
    
  // Remove function return type annotations
  modifiedCode = modifiedCode
    .replace(/\)\s*:\s*(?:string|number|boolean|any|void|never|unknown|object)(?:\[\])?\s*\{/g, ') {')
    .replace(/\)\s*:\s*(?:string|number|boolean|any|void|never|unknown|object)(?:\[\])?\s*=>/g, ') =>')
    .replace(/\)\s*:\s*[A-Z]\w*(?:<[^>]+>)?(?:\[\])?\s*\{/g, ') {')
    .replace(/\)\s*:\s*[A-Z]\w*(?:<[^>]+>)?(?:\[\])?\s*=>/g, ') =>')
    
  // Remove generic type parameters
  modifiedCode = modifiedCode
    .replace(/(?:useState|useRef|useEffect|useMemo|useCallback)<[^>]+>/g, (match) => {
      return match.split('<')[0]
    })
    .replace(/<[A-Z]\w*(?:,\s*[A-Z]\w*)*>/g, '') // Generic type parameters
    
  // Remove type assertions
  modifiedCode = modifiedCode
    .replace(/\s+as\s+(?:string|number|boolean|any|void|never|unknown|object)(?:\[\])?/g, '')
    .replace(/\s+as\s+[A-Z]\w*(?:<[^>]+>)?(?:\[\])?/g, '')
    
  // Remove type declarations in variable declarations
  modifiedCode = modifiedCode
    .replace(/:\s*(?:string|number|boolean|any|void|never|unknown|object)(?:\[\])?\s*=/g, ' =')
    .replace(/:\s*[A-Z]\w*(?:<[^>]+>)?(?:\[\])?\s*=/g, ' =')
    
  // Clean up any remaining type syntax
  modifiedCode = modifiedCode
    .replace(/\s*\|\s*null/g, '')
    .replace(/\s*\|\s*undefined/g, '')
    .replace(/\?:/g, ':') // Optional properties
    
  return modifiedCode
}