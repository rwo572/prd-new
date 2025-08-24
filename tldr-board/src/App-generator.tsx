import { useCallback, useState } from 'react'
import { Tldraw, Editor, createShapeId } from 'tldraw'
import 'tldraw/tldraw.css'

type TemplateType = 'opportunity' | 'roadmap' | 'personas' | 'blank'

function App() {
  const [templateType, setTemplateType] = useState<TemplateType>('blank')
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

  const generateTemplate = useCallback(() => {
    if (!editor) return
    clearCanvas()
    
    // Wait a bit for clear to complete
    setTimeout(() => {
      if (templateType === 'opportunity') {
        // Create opportunity assessment cards
        const opportunities = [
          { text: 'Problem\n\nWhat specific pain point are we solving?', color: 'red' },
          { text: 'Customer\n\nWho has this problem most acutely?', color: 'blue' },
          { text: 'Solution\n\nWhat is our unique approach?', color: 'green' },
          { text: 'Market Size\n\nHow big is the opportunity?', color: 'yellow' },
          { text: 'Competition\n\nWho else is solving this?', color: 'orange' },
          { text: 'Business Model\n\nHow do we make money?', color: 'violet' }
        ]
        
        opportunities.forEach((opp, i) => {
          const id = createShapeId()
          editor.createShape({
            id,
            type: 'note',
            x: 100 + (i % 3) * 300,
            y: 100 + Math.floor(i / 3) * 250,
            props: {
              color: opp.color,
              text: opp.text,
              size: 'l',
              align: 'start',
              verticalAlign: 'start',
              font: 'sans'
            }
          })
        })
      } else if (templateType === 'roadmap') {
        // Create a simple roadmap
        const quarters = ['Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024']
        const tracks = ['Product', 'Engineering', 'Marketing', 'Sales']
        
        // Create quarter headers
        quarters.forEach((quarter, i) => {
          const id = createShapeId()
          editor.createShape({
            id,
            type: 'geo',
            x: 200 + i * 250,
            y: 50,
            props: {
              geo: 'rectangle',
              w: 200,
              h: 60,
              color: 'blue',
              fill: 'solid',
              text: quarter,
              size: 'l',
              align: 'middle',
              verticalAlign: 'middle',
              font: 'sans'
            }
          })
        })
        
        // Create track labels and milestones
        tracks.forEach((track, j) => {
          // Track label
          const labelId = createShapeId()
          editor.createShape({
            id: labelId,
            type: 'geo',
            x: 20,
            y: 150 + j * 120,
            props: {
              geo: 'rectangle',
              w: 150,
              h: 50,
              color: 'grey',
              fill: 'solid',
              text: track,
              size: 'm',
              align: 'middle',
              verticalAlign: 'middle',
              font: 'sans'
            }
          })
          
          // Create milestone placeholders
          quarters.forEach((_, i) => {
            const milestoneId = createShapeId()
            editor.createShape({
              id: milestoneId,
              type: 'note',
              x: 200 + i * 250,
              y: 150 + j * 120,
              props: {
                color: ['yellow', 'green', 'orange', 'violet'][j],
                text: `${track} milestone`,
                size: 'm',
                align: 'start',
                verticalAlign: 'start',
                font: 'sans'
              }
            })
          })
        })
      } else if (templateType === 'personas') {
        // Create user personas
        const personas = [
          {
            name: 'Early Adopter Emma',
            details: 'Age: 28-35\nTech-savvy professional\n\nGoals:\n• Efficiency\n• Innovation\n• First-mover advantage\n\nPain Points:\n• Current tools too slow\n• Missing key features',
            color: 'blue'
          },
          {
            name: 'Enterprise Executive',
            details: 'Age: 40-55\nDecision maker\n\nGoals:\n• ROI\n• Scale\n• Risk mitigation\n\nPain Points:\n• Integration challenges\n• Change management',
            color: 'green'
          },
          {
            name: 'Small Business Owner',
            details: 'Age: 30-45\nResource-constrained\n\nGoals:\n• Affordability\n• Simplicity\n• Growth\n\nPain Points:\n• Limited budget\n• No IT support',
            color: 'yellow'
          }
        ]
        
        personas.forEach((persona, i) => {
          // Create persona card
          const cardId = createShapeId()
          editor.createShape({
            id: cardId,
            type: 'geo',
            x: 100 + i * 400,
            y: 100,
            props: {
              geo: 'rectangle',
              w: 350,
              h: 400,
              color: persona.color,
              fill: 'semi',
              text: `${persona.name}\n\n${persona.details}`,
              size: 'm',
              align: 'start',
              verticalAlign: 'start',
              font: 'sans'
            }
          })
        })
      }
      
      // Zoom to fit content
      editor.zoomToFit()
    }, 100)
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
          Canvas Generator
        </h3>
        
        <div style={{ marginBottom: 12 }}>
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
            <option value="opportunity">Opportunity Assessment</option>
            <option value="roadmap">Product Roadmap</option>
            <option value="personas">User Personas</option>
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
          💡 <strong>Tip:</strong> Edit any element by double-clicking!
        </div>
      </div>
      <Tldraw onMount={handleMount} />
    </div>
  )
}

export default App
