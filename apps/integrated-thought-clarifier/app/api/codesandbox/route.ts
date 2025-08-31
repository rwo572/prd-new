import { NextRequest, NextResponse } from 'next/server'
import { getParameters } from 'codesandbox/lib/api/define'

export async function POST(request: NextRequest) {
  try {
    const { code, projectName } = await request.json()

    if (!code || !projectName) {
      return NextResponse.json(
        { error: 'Code and project name are required' },
        { status: 400 }
      )
    }

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

    return NextResponse.json({ parameters })
  } catch (error: any) {
    console.error('CodeSandbox API Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create CodeSandbox parameters' },
      { status: 500 }
    )
  }
}