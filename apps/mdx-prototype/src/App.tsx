import React, { useState } from 'react'
import { SchemaPanel } from './components/SchemaExtraction/SchemaPanel'

// Sample component code for demonstration
const SAMPLE_COMPONENT = `
function UserRegistrationForm() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    age: '',
    subscribe: false
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // API call to register user
    const response = await fetch('/api/users/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData)
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('User registered:', data)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input 
        type="text" 
        name="username" 
        placeholder="Username" 
        required
        minLength={3}
        maxLength={20}
        pattern="[a-zA-Z0-9_]+"
        value={formData.username}
        onChange={(e) => setFormData({...formData, username: e.target.value})}
      />
      
      <input 
        type="email" 
        name="email" 
        placeholder="Email" 
        required
        value={formData.email}
        onChange={(e) => setFormData({...formData, email: e.target.value})}
      />
      
      <input 
        type="password" 
        name="password" 
        placeholder="Password" 
        required
        minLength={8}
        value={formData.password}
        onChange={(e) => setFormData({...formData, password: e.target.value})}
      />
      
      <input 
        type="number" 
        name="age" 
        placeholder="Age" 
        min={18}
        max={120}
        value={formData.age}
        onChange={(e) => setFormData({...formData, age: e.target.value})}
      />
      
      <label>
        <input 
          type="checkbox" 
          name="subscribe" 
          checked={formData.subscribe}
          onChange={(e) => setFormData({...formData, subscribe: e.target.checked})}
        />
        Subscribe to newsletter
      </label>
      
      <button type="submit">Register</button>
    </form>
  )
}
`

const SAMPLE_MDX = `
# User Management System

This PRD describes the user management functionality.

## User Registration Component

Here's the main registration form:

\`\`\`jsx
${SAMPLE_COMPONENT}
\`\`\`

## Product List Component

\`\`\`jsx
function ProductList() {
  const [products, setProducts] = useState([])
  
  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => setProducts(data))
  }, [])
  
  const deleteProduct = async (id) => {
    await fetch(\`/api/products/\${id}\`, {
      method: 'DELETE'
    })
  }
  
  return (
    <div>
      {products.map(product => (
        <div key={product.id}>
          <h3>{product.name}</h3>
          <p>Price: \${product.price}</p>
          <button onClick={() => deleteProduct(product.id)}>Delete</button>
        </div>
      ))}
    </div>
  )
}
\`\`\`
`

function App() {
  const [activeTab, setActiveTab] = useState<'component' | 'mdx'>('component')
  const [componentCode, setComponentCode] = useState(SAMPLE_COMPONENT)
  const [mdxContent, setMdxContent] = useState(SAMPLE_MDX)

  return (
    <div className="app">
      <header className="app-header">
        <h1>MDX PRD Prototype - Schema Extraction Demo</h1>
        <p>Extract data schemas, form fields, and API calls from React components</p>
      </header>

      <div className="app-content">
        <div className="editor-section">
          <div className="editor-tabs">
            <button 
              className={activeTab === 'component' ? 'active' : ''}
              onClick={() => setActiveTab('component')}
            >
              Single Component
            </button>
            <button 
              className={activeTab === 'mdx' ? 'active' : ''}
              onClick={() => setActiveTab('mdx')}
            >
              MDX Document
            </button>
          </div>

          <div className="editor-container">
            {activeTab === 'component' ? (
              <textarea
                className="code-editor"
                value={componentCode}
                onChange={(e) => setComponentCode(e.target.value)}
                placeholder="Paste your React component code here..."
                spellCheck={false}
              />
            ) : (
              <textarea
                className="code-editor"
                value={mdxContent}
                onChange={(e) => setMdxContent(e.target.value)}
                placeholder="Paste your MDX content here..."
                spellCheck={false}
              />
            )}
          </div>
        </div>

        <div className="results-section">
          <h2>Extracted Schema</h2>
          <SchemaPanel 
            componentCode={activeTab === 'component' ? componentCode : undefined}
            mdxContent={activeTab === 'mdx' ? mdxContent : undefined}
          />
        </div>
      </div>

      <footer className="app-footer">
        <p>
          This demo shows the schema extraction capabilities from the MDX PRD Prototype technical specification.
          Try editing the code or switching between single component and MDX modes.
        </p>
      </footer>
    </div>
  )
}

export default App
