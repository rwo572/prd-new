import { useCallback, useState } from 'react'
import { Tldraw, Editor } from 'tldraw'
import 'tldraw/tldraw.css'

type Stage = '0to1' | '1ton' | 'nx'

const templates = {
  '0to1': [
    'Problem: What specific pain point?',
    'Customer: Who has this problem?',
    'Solution: MVP approach?',
    'Validation: How to test?',
    'Metrics: What indicates PMF?'
  ],
  '1ton': [
    'Channels: Where to find customers?',
    'CAC: Customer acquisition cost?',
    'LTV: Lifetime value?',
    'Operations: How to scale?',
    'Team: Who to hire?'
  ],
  'nx': [
    'Network Effects: How do users create value?',
    'Platform: What enables ecosystem?',
    'Moats: Defensibility?',
    'Markets: Geographic expansion?',
    'Exit: IPO or acquisition?'
  ]
}

function App() {
  const [stage, setStage] = useState<Stage>('0to1')
  const [editor, setEditor] = useState<Editor | null>(null)

  const handleMount = useCallback((ed: Editor) => {
    setEditor(ed)
    
    // Create initial template
    const items = templates[stage]
    items.forEach((content, i) => {
      ed.createShape({
        type: 'note',
        x: 100 + (i % 3) * 250,
        y: 100 + Math.floor(i / 3) * 200,
        props: {
          text: content,
          color: ['yellow', 'blue', 'green', 'orange', 'violet'][i],
          size: 'm'
        }
      })
    })
  }, [stage])

  const clearAndReload = useCallback(() => {
    if (!editor) return
    
    // Clear all shapes
    editor.selectAll()
    editor.deleteShapes(editor.getSelectedShapeIds())
    
    // Load new template
    const items = templates[stage]
    items.forEach((content, i) => {
      editor.createShape({
        type: 'note',
        x: 100 + (i % 3) * 250,
        y: 100 + Math.floor(i / 3) * 200,
        props: {
          text: content,
          color: ['yellow', 'blue', 'green', 'orange', 'violet'][i],
          size: 'm'
        }
      })
    })
  }, [editor, stage])

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
        minWidth: 280
      }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: 16, fontWeight: 600, color: '#333' }}>
          Opportunity Templates
        </h3>
        
        <select 
          value={stage} 
          onChange={(e) => {
            setStage(e.target.value as Stage)
            setTimeout(clearAndReload, 100) // Give state time to update
          }}
          style={{ 
            width: '100%', 
            padding: '8px 12px', 
            borderRadius: 6, 
            border: '1px solid #ddd', 
            fontSize: 14,
            backgroundColor: '#f8f9fa',
            cursor: 'pointer',
            marginBottom: 12
          }}
        >
          <option value="0to1">0 → 1 (Find Product-Market Fit)</option>
          <option value="1ton">1 → n (Scale What Works)</option>
          <option value="nx">n^x (Exponential Growth)</option>
        </select>
        
        <button
          onClick={clearAndReload}
          style={{
            width: '100%',
            padding: '8px',
            backgroundColor: '#f5f5f5',
            color: '#666',
            border: '1px solid #ddd',
            borderRadius: 6,
            fontSize: 13,
            cursor: 'pointer'
          }}
        >
          Reload Template
        </button>
      </div>
      <Tldraw onMount={handleMount} />
    </div>
  )
}

export default App
