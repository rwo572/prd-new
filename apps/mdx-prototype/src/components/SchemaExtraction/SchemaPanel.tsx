import React, { useState } from 'react'
import { useSchemaExtraction } from '../../hooks/useSchemaExtraction'
import { SchemaExtractionResult } from '../../types/schema'
import './SchemaPanel.css'

interface SchemaPanelProps {
  mdxContent?: string
  componentCode?: string
  onSchemaExtracted?: (result: SchemaExtractionResult) => void
}

export const SchemaPanel: React.FC<SchemaPanelProps> = ({
  mdxContent,
  componentCode,
  onSchemaExtracted
}) => {
  const [activeTab, setActiveTab] = useState<'schema' | 'typescript' | 'validation'>('schema')
  const [selectedComponent, setSelectedComponent] = useState<string>('')
  
  const {
    isExtracting,
    error,
    results,
    extractFromComponent,
    extractFromMDX,
    getTypeScriptDefinitions,
    getCombinedJsonSchema
  } = useSchemaExtraction()

  // Extract schema when content changes
  React.useEffect(() => {
    if (mdxContent) {
      extractFromMDX(mdxContent)
    } else if (componentCode) {
      extractFromComponent(componentCode, 'Component')
    }
  }, [mdxContent, componentCode, extractFromMDX, extractFromComponent])

  // Get current schema
  const currentSchema = selectedComponent ? results[selectedComponent] : null

  // Component list
  const componentNames = Object.keys(results)

  return (
    <div className="schema-panel">
      <div className="schema-header">
        <h3>Schema Extraction</h3>
        {isExtracting && <span className="loading">Extracting...</span>}
        {error && <span className="error">{error.message}</span>}
      </div>

      {componentNames.length > 0 && (
        <div className="component-selector">
          <label>Component:</label>
          <select 
            value={selectedComponent} 
            onChange={(e) => setSelectedComponent(e.target.value)}
          >
            <option value="">Select a component</option>
            {componentNames.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="schema-tabs">
        <button 
          className={activeTab === 'schema' ? 'active' : ''}
          onClick={() => setActiveTab('schema')}
        >
          JSON Schema
        </button>
        <button 
          className={activeTab === 'typescript' ? 'active' : ''}
          onClick={() => setActiveTab('typescript')}
        >
          TypeScript
        </button>
        <button 
          className={activeTab === 'validation' ? 'active' : ''}
          onClick={() => setActiveTab('validation')}
        >
          Validation
        </button>
      </div>

      <div className="schema-content">
        {activeTab === 'schema' && currentSchema && (
          <div className="schema-view">
            <h4>Data Schema</h4>
            <pre className="code-block">
              {JSON.stringify(currentSchema.dataSchema, null, 2)}
            </pre>
            
            {currentSchema.formFields.length > 0 && (
              <>
                <h4>Form Fields</h4>
                <ul className="field-list">
                  {currentSchema.formFields.map((field, idx) => (
                    <li key={idx}>
                      <strong>{field.name}</strong> ({field.type})
                      {field.validation && (
                        <span className="validation-info">
                          {' - '}{field.validation.type}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}

            {currentSchema.apiCalls.length > 0 && (
              <>
                <h4>API Calls</h4>
                <ul className="api-list">
                  {currentSchema.apiCalls.map((api, idx) => (
                    <li key={idx}>
                      <code>{api.method} {api.endpoint}</code>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}

        {activeTab === 'typescript' && (
          <div className="typescript-view">
            <h4>TypeScript Definitions</h4>
            <pre className="code-block language-typescript">
              {selectedComponent && currentSchema
                ? currentSchema.typescript
                : getTypeScriptDefinitions()
              }
            </pre>
            <button 
              className="copy-button"
              onClick={() => {
                const text = selectedComponent && currentSchema
                  ? currentSchema.typescript
                  : getTypeScriptDefinitions()
                navigator.clipboard.writeText(text)
              }}
            >
              Copy to Clipboard
            </button>
          </div>
        )}

        {activeTab === 'validation' && currentSchema && (
          <div className="validation-view">
            <h4>Validation Rules</h4>
            {currentSchema.validations.length > 0 ? (
              <ul className="validation-list">
                {currentSchema.validations.map((rule, idx) => (
                  <li key={idx}>
                    <strong>{rule.field}</strong>
                    <div className="rule-details">
                      Type: {rule.type}
                      {rule.config.message && (
                        <div>Message: {rule.config.message}</div>
                      )}
                      {rule.config.pattern && (
                        <div>Pattern: <code>{rule.config.pattern.toString()}</code></div>
                      )}
                      {rule.config.min !== undefined && (
                        <div>Min: {rule.config.min}</div>
                      )}
                      {rule.config.max !== undefined && (
                        <div>Max: {rule.config.max}</div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No validation rules found</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
