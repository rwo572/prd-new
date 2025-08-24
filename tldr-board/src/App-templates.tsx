import { useCallback, useState } from 'react'
import { Tldraw, Editor } from 'tldraw'
import 'tldraw/tldraw.css'

type Stage = '0to1' | '1ton' | 'nx'
type TemplateType = 'opportunity' | 'roadmap' | 'canvas' | 'journey' | 'personas' | 'swot'

function App() {
  const [stage, setStage] = useState<Stage>('0to1')
  const [templateType, setTemplateType] = useState<TemplateType>('opportunity')
  const [editor, setEditor] = useState<Editor | null>(null)

  const handleMount = useCallback((ed: Editor) => {
    setEditor(ed)
  }, [])

  const clearCanvas = useCallback(() => {
    if (!editor) return
    editor.selectAll()
    editor.deleteShapes(editor.getSelectedShapeIds())
  }, [editor])

  const generateRoadmap = useCallback(() => {
    if (!editor) return
    clearCanvas()
    
    const months = ['Month 1-2', 'Month 3-4', 'Month 5-6', 'Month 7-8', 'Month 9-10', 'Month 11-12']
    const themes = {
      '0to1': ['Problem Discovery', 'MVP Development', 'Early Users', 'Product-Market Fit', 'First Revenue', 'Scale Prep'],
      '1ton': ['Growth Foundation', 'Channel Testing', 'Process Building', 'Team Scaling', 'Market Expansion', 'Series A Prep'],
      'nx': ['Platform Features', 'Network Effects', 'Global Expansion', 'Ecosystem', 'Category Leadership', 'IPO Readiness']
    }
    
    const stageThemes = themes[stage]
    const baseY = 100
    const columnWidth = 200
    const rowHeight = 250
    
    // Create timeline header
    months.forEach((month, i) => {
      editor.createShape({
        type: 'note',
        x: 100 + i * columnWidth,
        y: baseY - 50,
        props: {
          text: month,
          size: 'l',
          color: 'black'
        }
      })
    })
    
    // Create swimlanes
    const swimlanes = ['Product', 'Engineering', 'Growth', 'Operations']
    swimlanes.forEach((lane, laneIndex) => {
      // Lane label
      editor.createShape({
        type: 'note',
        x: 20,
        y: baseY + 50 + laneIndex * rowHeight,
        props: {
          text: lane,
          size: 'm',
          color: 'grey'
        }
      })
      
      // Create milestone cards
      months.forEach((_, monthIndex) => {
        if (Math.random() > 0.3) { // Not every intersection has a milestone
          const theme = stageThemes[monthIndex] || 'Milestone'
          editor.createShape({
            type: 'note',
            x: 100 + monthIndex * columnWidth,
            y: baseY + 50 + laneIndex * rowHeight,
            props: {
              text: `${theme}\n${lane}`,
              color: ['blue', 'green', 'yellow', 'orange'][laneIndex],
              size: 'l'
            }
          })
        }
      })
    })
    
    // Add connectors between related items
    const shapes = editor.getCurrentPageShapes()
    const noteShapes = shapes.filter(s => s.type === 'note')
    for (let i = 0; i < noteShapes.length - 1; i++) {
      if (Math.random() > 0.5 && noteShapes[i].y === noteShapes[i + 1].y) {
        // Skip arrow creation for now - would need proper arrow binding
      }
    }
  }, [editor, stage, clearCanvas])

  const generateCanvas = useCallback(() => {
    if (!editor) return
    clearCanvas()
    
    const canvasTypes = {
      'business': {
        title: 'Business Model Canvas',
        sections: [
          { name: 'Key Partners', x: 100, y: 100, color: 'blue' },
          { name: 'Key Activities', x: 350, y: 100, color: 'blue' },
          { name: 'Value Propositions', x: 600, y: 100, color: 'green' },
          { name: 'Customer Relationships', x: 850, y: 100, color: 'yellow' },
          { name: 'Customer Segments', x: 1100, y: 100, color: 'yellow' },
          { name: 'Key Resources', x: 350, y: 350, color: 'blue' },
          { name: 'Channels', x: 850, y: 350, color: 'yellow' },
          { name: 'Cost Structure', x: 225, y: 600, color: 'red' },
          { name: 'Revenue Streams', x: 975, y: 600, color: 'green' }
        ]
      },
      'lean': {
        title: 'Lean Canvas',
        sections: [
          { name: 'Problem', x: 100, y: 100, color: 'red' },
          { name: 'Solution', x: 350, y: 100, color: 'green' },
          { name: 'Key Metrics', x: 600, y: 100, color: 'blue' },
          { name: 'Unique Value Prop', x: 850, y: 100, color: 'violet' },
          { name: 'Unfair Advantage', x: 1100, y: 100, color: 'violet' },
          { name: 'Channels', x: 350, y: 350, color: 'yellow' },
          { name: 'Customer Segments', x: 850, y: 350, color: 'yellow' },
          { name: 'Cost Structure', x: 225, y: 600, color: 'red' },
          { name: 'Revenue Streams', x: 975, y: 600, color: 'green' }
        ]
      }
    }
    
    const canvas = stage === '0to1' ? canvasTypes.lean : canvasTypes.business
    
    // Title
    editor.createShape({
      type: 'note',
      x: 600,
      y: 20,
      props: {
        text: canvas.title,
        size: 'l',
        color: 'black'
      }
    })
    
    // Create sections
    canvas.sections.forEach(section => {
      // Section frame
      editor.createShape({
        type: 'frame',
        x: section.x,
        y: section.y,
        props: {
          w: 200,
          h: 200,
          name: section.name
        }
      })
      
      // Section header
      editor.createShape({
        type: 'note',
        x: section.x + 10,
        y: section.y + 10,
        props: {
          text: section.name,
          color: section.color,
          size: 'm'
        }
      })
    })
  }, [editor, stage, clearCanvas])

  const generateJourney = useCallback(() => {
    if (!editor) return
    clearCanvas()
    
    const stages = {
      '0to1': ['Awareness', 'Discovery', 'Evaluation', 'Trial', 'Purchase', 'Onboarding'],
      '1ton': ['Acquisition', 'Activation', 'Retention', 'Revenue', 'Referral', 'Resurrection'],
      'nx': ['Join', 'Engage', 'Create Value', 'Network Growth', 'Lock-in', 'Advocate']
    }
    
    const journeyStages = stages[stage]
    const baseY = 300
    const stageWidth = 200
    
    // Create journey line as a horizontal frame
    editor.createShape({
      type: 'frame',
      x: 100,
      y: baseY - 5,
      props: {
        w: journeyStages.length * stageWidth,
        h: 10,
        name: 'Journey Timeline'
      }
    })
    
    // Create stages
    journeyStages.forEach((stageName, i) => {
      const x = 100 + i * stageWidth
      
      // Stage marker
      editor.createShape({
        type: 'geo',
        x: x - 25,
        y: baseY - 25,
        props: {
          geo: 'ellipse',
          w: 50,
          h: 50,
          fill: 'solid',
          color: 'blue',
          size: 'm'
        }
      })
      
      // Stage label
      editor.createShape({
        type: 'note',
        x: x - 50,
        y: baseY + 40,
        props: {
          text: stageName,
          size: 'm',
          color: 'black'
        }
      })
      
      // Touchpoints above
      editor.createShape({
        type: 'note',
        x: x - 75,
        y: baseY - 150,
        props: {
          text: `Touchpoints:\n• Website\n• App\n• Support`,
          color: 'yellow',
          size: 's'
        }
      })
      
      // Pain points below
      editor.createShape({
        type: 'note',
        x: x - 75,
        y: baseY + 100,
        props: {
          text: `Pain Points:\n• Confusion\n• Friction\n• Drop-off`,
          color: 'red',
          size: 's'
        }
      })
    })
  }, [editor, stage, clearCanvas])

  const generatePersonas = useCallback(() => {
    if (!editor) return
    clearCanvas()
    
    const personas = {
      '0to1': [
        { name: 'Early Adopter Emma', desc: 'Tech-savvy, loves trying new products', goals: 'Innovation, efficiency', pain: 'Current tools too complex' },
        { name: 'Problem Solver Pete', desc: 'Frustrated with status quo', goals: 'Better solution, save time', pain: 'No good alternatives' },
        { name: 'Innovator Ian', desc: 'Always looking for cutting edge', goals: 'Be first, competitive advantage', pain: 'Missed opportunities' }
      ],
      '1ton': [
        { name: 'Mainstream Mary', desc: 'Wants proven solutions', goals: 'Reliability, support', pain: 'Risk of new tools' },
        { name: 'Business Owner Bob', desc: 'ROI focused', goals: 'Scale business, reduce costs', pain: 'Limited resources' },
        { name: 'Team Lead Tina', desc: 'Managing growing team', goals: 'Team productivity', pain: 'Coordination overhead' }
      ],
      'nx': [
        { name: 'Enterprise Eva', desc: 'Large org decision maker', goals: 'Digital transformation', pain: 'Legacy systems' },
        { name: 'Platform User Paul', desc: 'Power user, creator', goals: 'Build audience, monetize', pain: 'Platform limitations' },
        { name: 'Network Nancy', desc: 'Community builder', goals: 'Connect people, grow network', pain: 'Fragmented tools' }
      ]
    }
    
    const stagePersonas = personas[stage]
    
    stagePersonas.forEach((persona, i) => {
      const x = 150 + (i % 2) * 600
      const y = 100 + Math.floor(i / 2) * 400
      
      // Persona card frame
      editor.createShape({
        type: 'frame',
        x: x,
        y: y,
        props: {
          w: 500,
          h: 350,
          name: persona.name
        }
      })
      
      // Avatar placeholder
      editor.createShape({
        type: 'geo',
        x: x + 20,
        y: y + 20,
        props: {
          geo: 'ellipse',
          w: 100,
          h: 100,
          fill: 'solid',
          color: 'grey',
          size: 'm'
        }
      })
      
      // Name
      editor.createShape({
        type: 'note',
        x: x + 140,
        y: y + 20,
        props: {
          text: persona.name,
          size: 'l',
          color: 'black'
        }
      })
      
      // Description
      editor.createShape({
        type: 'note',
        x: x + 140,
        y: y + 60,
        props: {
          text: persona.desc,
          color: 'blue',
          size: 's'
        }
      })
      
      // Goals
      editor.createShape({
        type: 'note',
        x: x + 20,
        y: y + 150,
        props: {
          text: `Goals:\n${persona.goals}`,
          color: 'green',
          size: 'm'
        }
      })
      
      // Pain Points
      editor.createShape({
        type: 'note',
        x: x + 250,
        y: y + 150,
        props: {
          text: `Pain Points:\n${persona.pain}`,
          color: 'red',
          size: 'm'
        }
      })
    })
  }, [editor, stage, clearCanvas])

  const generateSWOT = useCallback(() => {
    if (!editor) return
    clearCanvas()
    
    const swotData = {
      '0to1': {
        strengths: ['Innovative solution', 'First mover advantage', 'Lean team', 'Customer insight'],
        weaknesses: ['Limited resources', 'No brand recognition', 'Small team', 'Unproven model'],
        opportunities: ['Growing market', 'Tech trends', 'Partnership potential', 'Unmet needs'],
        threats: ['Competition', 'Market uncertainty', 'Funding risk', 'Tech changes']
      },
      '1ton': {
        strengths: ['Product-market fit', 'Growing revenue', 'Customer base', 'Team expertise'],
        weaknesses: ['Scaling challenges', 'Process gaps', 'Tech debt', 'Resource constraints'],
        opportunities: ['Market expansion', 'New segments', 'Product extensions', 'Strategic partnerships'],
        threats: ['New entrants', 'Market saturation', 'Customer churn', 'Economic factors']
      },
      'nx': {
        strengths: ['Market leadership', 'Network effects', 'Brand power', 'Resources'],
        weaknesses: ['Innovation speed', 'Bureaucracy', 'Legacy systems', 'Complexity'],
        opportunities: ['Global markets', 'Platform expansion', 'M&A targets', 'New technologies'],
        threats: ['Disruption', 'Regulation', 'Market shifts', 'Competitive platforms']
      }
    }
    
    const swot = swotData[stage]
    const quadrants = [
      { name: 'Strengths', data: swot.strengths, x: 200, y: 100, color: 'green' },
      { name: 'Weaknesses', data: swot.weaknesses, x: 700, y: 100, color: 'red' },
      { name: 'Opportunities', data: swot.opportunities, x: 200, y: 400, color: 'blue' },
      { name: 'Threats', data: swot.threats, x: 700, y: 400, color: 'orange' }
    ]
    
    // Title
    editor.createShape({
      type: 'note',
      x: 550,
      y: 20,
      props: {
        text: 'SWOT Analysis',
        size: 'l',
        color: 'black'
      }
    })
    
    // Create quadrants
    quadrants.forEach(quadrant => {
      // Quadrant frame
      editor.createShape({
        type: 'frame',
        x: quadrant.x,
        y: quadrant.y,
        props: {
          w: 400,
          h: 250,
          name: quadrant.name
        }
      })
      
      // Quadrant header
      editor.createShape({
        type: 'note',
        x: quadrant.x + 150,
        y: quadrant.y + 20,
        props: {
          text: quadrant.name,
          size: 'l',
          color: 'black'
        }
      })
      
      // Items
      quadrant.data.forEach((item, i) => {
        editor.createShape({
          type: 'note',
          x: quadrant.x + 20 + (i % 2) * 190,
          y: quadrant.y + 60 + Math.floor(i / 2) * 80,
          props: {
            text: item,
            color: quadrant.color,
            size: 's'
          }
        })
      })
    })
  }, [editor, stage, clearCanvas])

  const generateTemplate = useCallback(() => {
    switch (templateType) {
      case 'roadmap':
        generateRoadmap()
        break
      case 'canvas':
        generateCanvas()
        break
      case 'journey':
        generateJourney()
        break
      case 'personas':
        generatePersonas()
        break
      case 'swot':
        generateSWOT()
        break
      case 'opportunity':
      default:
        // Use existing opportunity assessment logic
        break
    }
  }, [templateType, generateRoadmap, generateCanvas, generateJourney, generatePersonas, generateSWOT])

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
          Visual Template Generator
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
            <option value="opportunity">Opportunity Assessment</option>
            <option value="roadmap">Product Roadmap</option>
            <option value="canvas">Business/Lean Canvas</option>
            <option value="journey">Customer Journey Map</option>
            <option value="personas">User Personas</option>
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
            marginBottom: 12
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
            cursor: 'pointer'
          }}
        >
          Clear Canvas
        </button>
        
        <div style={{ 
          marginTop: 12,
          padding: '8px 12px', 
          backgroundColor: '#e3f2fd', 
          borderRadius: 6,
          fontSize: 12,
          color: '#1976d2'
        }}>
          💡 <strong>Tip:</strong> Templates adapt to your startup stage!
        </div>
      </div>
      <Tldraw onMount={handleMount} />
    </div>
  )
}

export default App
