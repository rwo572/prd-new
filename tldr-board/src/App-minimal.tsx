import { Tldraw } from 'tldraw'
import 'tldraw/tldraw.css'

function App() {
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
          tldraw Canvas
        </h3>
        
        <div style={{ 
          padding: '8px 12px', 
          backgroundColor: '#e3f2fd', 
          borderRadius: 6,
          fontSize: 12,
          color: '#1976d2'
        }}>
          💡 <strong>Tip:</strong> Use the toolbar to create notes, shapes, and drawings!
        </div>
      </div>
      <Tldraw />
    </div>
  )
}

export default App
