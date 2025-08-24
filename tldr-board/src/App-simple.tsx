import { useCallback, useState } from 'react'
import { Tldraw, Editor } from 'tldraw'
import 'tldraw/tldraw.css'

type Stage = '0to1' | '1ton' | 'nx'
type TemplateType = 'blank' | 'roadmap' | 'swot'

function App() {
  const [stage, setStage] = useState<Stage>('0to1')
  const [templateType, setTemplateType] = useState<TemplateType>('blank')
  const [editor, setEditor] = useState<Editor | null>(null)

  const handleMount = useCallback((ed: Editor) => {
    setEditor(ed)
  }, [])

  const handleExport = useCallback(() => {
    if (!editor) return
    const snapshot = editor.store.getSnapshot()
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(snapshot, null, 2))
    const dl = document.createElement('a')
    dl.setAttribute('href', dataStr)
    dl.setAttribute('download', `tldr-${stage}-${new Date().toISOString().slice(0,10)}.json`)
    dl.click()
  }, [editor, stage])

  const handleImport = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!editor) return
    const file = event.target.files?.[0]
    if (!file) return
    const text = await file.text()
    try {
      const snapshot = JSON.parse(text)
      editor.store.loadSnapshot(snapshot)
    } catch (e) {
      console.error('Invalid JSON', e)
    }
  }, [editor])

  const clearCanvas = useCallback(() => {
    if (!editor) return
    editor.selectAll()
    editor.deleteShapes(editor.getSelectedShapeIds())
  }, [editor])

  const generateTemplate = useCallback(() => {
    if (!editor) return
    clearCanvas()
    
    if (templateType === 'roadmap') {
      // Simple roadmap with quarters
      const quarters = ['Q1', 'Q2', 'Q3', 'Q4']
      const tracks = ['Product', 'Engineering', 'Marketing']
      
      quarters.forEach((quarter, i) => {
        editor.createShape({
          type: 'note',
          x: 100 + i * 250,
          y: 50,
          props: {
            color: 'blue',
            size: 'l',
            text: quarter
          }
        })
      })
      
      tracks.forEach((track, j) => {
        editor.createShape({
          type: 'note',
          x: 20,
          y: 150 + j * 150,
          props: {
            text: track,
            color: 'grey',
            size: 'm'
          }
        })
        
        // Add milestone placeholders
        quarters.forEach((_, i) => {
          editor.createShape({
            type: 'note',
            x: 100 + i * 250,
            y: 150 + j * 150,
            props: {
              text: 'Milestone',
              color: ['yellow', 'green', 'orange'][j],
              size: 'm'
            }
          })
        })
      })
    } else if (templateType === 'swot') {
      // Simple SWOT analysis
      const sections = [
        { label: 'Strengths', x: 100, y: 100, color: 'green' },
        { label: 'Weaknesses', x: 400, y: 100, color: 'red' },
        { label: 'Opportunities', x: 100, y: 300, color: 'blue' },
        { label: 'Threats', x: 400, y: 300, color: 'orange' }
      ]
      
      sections.forEach(section => {
        // Section header
        editor.createShape({
          type: 'note',
          x: section.x,
          y: section.y,
          props: {
            text: section.label,
            color: section.color,
            size: 'l'
          }
        })
        
        // Add placeholder items
        for (let i = 0; i < 2; i++) {
          editor.createShape({
            type: 'note',
            x: section.x + (i * 120),
            y: section.y + 60,
            props: {
              text: 'Item',
              color: section.color,
              size: 's'
            }
          })
        }
      })
    }
  }, [editor, templateType, clearCanvas])

  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <div style={{ 
        position: 'fixed', 
        bottom: 20, 
        right: 20,
        zIndex: 9999, 
        backgroundColor: 'white', 
        padding: '16px', 
        borderRadius: 12, 
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        minWidth: 320,
        maxWidth: 360
      }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: 16, fontWeight: 600, color: '#333' }}>
          Template Generator
        </h3>
        
        <div style={{ marginBottom: 8 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>
            Template Type:
          </label>
          <select 
            value={templateType} 
            onChange={(e) => setTemplateType(e.target.value as TemplateType)}
            style={{ 
              width: '100%', 
              padding: '8px 12px', 
              borderRadius: 6, 
              border: '1px solid #ddd', 
              fontSize: 14,
              backgroundColor: '#f8f9fa',
              cursor: 'pointer'
            }}
          >
            <option value="blank">Blank Canvas</option>
            <option value="roadmap">Product Roadmap</option>
            <option value="swot">SWOT Analysis</option>
          </select>
        </div>
        
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>
            Startup Stage:
          </label>
          <select 
            value={stage} 
            onChange={(e) => setStage(e.target.value as Stage)}
            style={{ 
              width: '100%', 
              padding: '8px 12px', 
              borderRadius: 6, 
              border: '1px solid #ddd', 
              fontSize: 14,
              backgroundColor: '#f8f9fa',
              cursor: 'pointer'
            }}
          >
            <option value="0to1">0 → 1 (Find Product-Market Fit)</option>
            <option value="1ton">1 → n (Scale What Works)</option>
            <option value="nx">n^x (Exponential Growth)</option>
          </select>
        </div>
        
        <button
          onClick={generateTemplate}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            marginBottom: 8
          }}
        >
          Generate Template
        </button>
        
        <button
          onClick={clearCanvas}
          style={{
            width: '100%',
            padding: '8px',
            backgroundColor: '#f5f5f5',
            color: '#666',
            border: '1px solid #ddd',
            borderRadius: 6,
            fontSize: 13,
            cursor: 'pointer',
            marginBottom: 12
          }}
        >
          Clear Canvas
        </button>
        
        <div style={{ 
          padding: '8px 12px', 
          backgroundColor: '#e3f2fd', 
          borderRadius: 6,
          fontSize: 12,
          color: '#1976d2'
        }}>
          💡 <strong>Tip:</strong> Use sticky notes to build on templates!
        </div>
      </div>
      <Tldraw onMount={handleMount} />
    </div>
  )
}

export default App