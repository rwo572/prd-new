import { useCallback, useState } from 'react'
import { Tldraw, Editor } from 'tldraw'
import 'tldraw/tldraw.css'

function App() {
  const [editor, setEditor] = useState<Editor | null>(null)

  const handleMount = useCallback((ed: Editor) => {
    setEditor(ed)
  }, [])

  const clearCanvas = useCallback(() => {
    if (!editor) return
    const allShapes = editor.getCurrentPageShapes()
    const shapeIds = allShapes.map(shape => shape.id)
    if (shapeIds.length > 0) {
      editor.deleteShapes(shapeIds)
    }
  }, [editor])

  const addTextAtPosition = useCallback((text: string, x: number, y: number) => {
    if (!editor) return
    
    // Create a text shape using the text tool
    editor.setCurrentTool('text')
    editor.pointerDown(x, y)
    editor.pointerUp(x, y)
    
    // Get the last created shape (should be our text)
    setTimeout(() => {
      const shapes = editor.getCurrentPageShapes()
      const textShape = shapes[shapes.length - 1]
      if (textShape && textShape.type === 'text') {
        // Update the text content
        editor.updateShape({
          id: textShape.id,
          type: 'text',
          props: {
            text: text,
            w: 300,
            autoSize: true
          }
        })
      }
      // Return to select tool
      editor.setCurrentTool('select')
    }, 100)
  }, [editor])

  const generateOpportunityCanvas = useCallback(() => {
    if (!editor) return
    clearCanvas()
    
    // Wait for clear
    setTimeout(() => {
      // Switch to note tool for sticky notes
      editor.setCurrentTool('note')
      
      // Create sticky notes by simulating clicks
      const positions = [
        { x: 100, y: 100 },
        { x: 450, y: 100 },
        { x: 800, y: 100 },
        { x: 100, y: 350 },
        { x: 450, y: 350 },
        { x: 800, y: 350 }
      ]
      
      positions.forEach((pos, index) => {
        setTimeout(() => {
          editor.pointerDown(pos.x, pos.y)
          editor.pointerUp(pos.x, pos.y)
        }, index * 200)
      })
      
      // Return to select tool after creating notes
      setTimeout(() => {
        editor.setCurrentTool('select')
        editor.zoomToFit()
      }, positions.length * 200 + 100)
    }, 100)
  }, [editor, clearCanvas])

  const generateRoadmapCanvas = useCallback(() => {
    if (!editor) return
    clearCanvas()
    
    setTimeout(() => {
      // Create frames for structure
      editor.setCurrentTool('frame')
      
      // Create quarter frames
      const quarters = ['Q1', 'Q2', 'Q3', 'Q4']
      quarters.forEach((_, i) => {
        setTimeout(() => {
          const x = 200 + i * 250
          editor.pointerDown(x, 50)
          editor.pointerUp(x + 200, 110)
        }, i * 200)
      })
      
      // Switch to note tool for content
      setTimeout(() => {
        editor.setCurrentTool('note')
        
        // Add notes in grid
        for (let row = 0; row < 3; row++) {
          for (let col = 0; col < 4; col++) {
            setTimeout(() => {
              const x = 225 + col * 250
              const y = 150 + row * 120
              editor.pointerDown(x, y)
              editor.pointerUp(x, y)
            }, (row * 4 + col) * 150)
          }
        }
        
        // Return to select and fit
        setTimeout(() => {
          editor.setCurrentTool('select')
          editor.zoomToFit()
        }, 12 * 150 + 200)
      }, quarters.length * 200 + 100)
    }, 100)
  }, [editor, clearCanvas])

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
          Canvas Templates
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            onClick={generateOpportunityCanvas}
            style={{
              padding: '10px',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Generate Opportunity Canvas
          </button>
          
          <button
            onClick={generateRoadmapCanvas}
            style={{
              padding: '10px',
              backgroundColor: '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Generate Roadmap Canvas
          </button>
          
          <button
            onClick={clearCanvas}
            style={{
              padding: '8px',
              backgroundColor: '#f5f5f5',
              color: '#666',
              border: '1px solid #ddd',
              borderRadius: 6,
              fontSize: 13,
              cursor: 'pointer'
            }}
          >
            Clear Canvas
          </button>
        </div>
        
        <div style={{ 
          marginTop: 12,
          padding: '8px 12px', 
          backgroundColor: '#e3f2fd', 
          borderRadius: 6,
          fontSize: 12,
          color: '#1976d2'
        }}>
          💡 <strong>Tips:</strong>
          <br />• Double-click notes to edit text
          <br />• Use toolbar for more shapes
          <br />• Drag to connect elements
        </div>
      </div>
      <Tldraw onMount={handleMount} />
    </div>
  )
}

export default App
