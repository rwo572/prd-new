'use client'

import { useState, useEffect } from 'react'
import { getParameters } from 'codesandbox/lib/api/define'

interface SimpleCodePreviewProps {
  code: string
  projectName: string
  view?: 'editor' | 'split' | 'preview'
}

export default function SimpleCodePreview({ 
  code, 
  projectName,
  view = 'split'
}: SimpleCodePreviewProps) {
  const [embedUrl, setEmbedUrl] = useState<string>('')

  useEffect(() => {
    if (!code) return

    // Create the files structure
    const files = {
      'package.json': {
        content: JSON.stringify({
          name: projectName.toLowerCase().replace(/\s+/g, '-'),
          version: '1.0.0',
          description: `${projectName} - Generated prototype`,
          main: 'src/index.js',
          dependencies: {
            'react': '^18.0.0',
            'react-dom': '^18.0.0',
            'react-scripts': '5.0.1',
            'lucide-react': '^0.263.1'
          },
          scripts: {
            start: 'react-scripts start',
            build: 'react-scripts build',
            test: 'react-scripts test',
            eject: 'react-scripts eject'
          },
          browserslist: {
            production: ['>0.2%', 'not dead', 'not op_mini all'],
            development: ['last 1 chrome version', 'last 1 firefox version', 'last 1 safari version']
          }
        }, null, 2)
      },
      'public/index.html': {
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="#000000" />
  <meta name="description" content="${projectName} prototype" />
  <title>${projectName}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  <noscript>You need to enable JavaScript to run this app.</noscript>
  <div id="root"></div>
</body>
</html>`
      },
      'src/index.js': {
        content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`
      },
      'src/App.js': {
        content: code
      }
    }

    // Get the parameters
    const parameters = getParameters({ files })
    
    // Build the embed URL with proper query parameters
    const queryParams = new URLSearchParams({
      embed: '1',
      view: view,
      theme: 'light',
      hidenavigation: '1',
      codemirror: '1',
      editorsize: '40',
      runonclick: '0'
    })
    
    // Use a data URL approach to avoid URI length limits
    const url = `https://codesandbox.io/api/v1/sandboxes/define?${queryParams.toString()}&parameters=${parameters}`
    setEmbedUrl(url)
  }, [code, projectName, view])

  if (!code) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500">No prototype code available</p>
        </div>
      </div>
    )
  }

  if (!embedUrl) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Preparing preview...</p>
        </div>
      </div>
    )
  }

  return (
    <iframe
      src={embedUrl}
      style={{
        width: '100%',
        height: '100%',
        border: 0,
        borderRadius: '8px',
        overflow: 'hidden'
      }}
      title="CodeSandbox Preview"
      allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
      sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
    />
  )
}