import { getParameters } from 'codesandbox/lib/api/define'

interface CodeSandboxFiles {
  [key: string]: {
    content: string
    isBinary?: boolean
  }
}

export interface CodeSandboxConfig {
  view?: 'editor' | 'split' | 'preview'
  theme?: 'dark' | 'light'
  codemirror?: boolean
  editorsize?: number
  hidenavigation?: boolean
  runonclick?: boolean
  moduleview?: boolean
}

export function createCodeSandbox(prototypeCode: string, projectName: string = 'React Prototype') {
  // Define the files for the CodeSandbox
  const files: CodeSandboxFiles = {
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
      content: prototypeCode
    },
    '.prettierrc': {
      content: JSON.stringify({
        printWidth: 80,
        tabWidth: 2,
        useTabs: false,
        semi: true,
        singleQuote: true,
        trailingComma: 'es5',
        bracketSpacing: true,
        jsxBracketSameLine: false,
        arrowParens: 'avoid',
        proseWrap: 'preserve'
      }, null, 2)
    }
  }

  // Get the parameters for CodeSandbox
  const parameters = getParameters({ files })
  
  // Create the CodeSandbox URL
  const url = `https://codesandbox.io/api/v1/sandboxes/define?parameters=${parameters}`
  
  return {
    url,
    parameters,
    openInNewTab: () => {
      const form = document.createElement('form')
      form.method = 'POST'
      form.action = 'https://codesandbox.io/api/v1/sandboxes/define'
      form.target = '_blank'
      
      const input = document.createElement('input')
      input.type = 'hidden'
      input.name = 'parameters'
      input.value = parameters
      
      form.appendChild(input)
      document.body.appendChild(form)
      form.submit()
      document.body.removeChild(form)
    }
  }
}

export function openInCodeSandbox(code: string, projectName: string) {
  const sandbox = createCodeSandbox(code, projectName)
  sandbox.openInNewTab()
}

export function getEmbedUrl(code: string, projectName: string, config: CodeSandboxConfig = {}) {
  const sandbox = createCodeSandbox(code, projectName)
  
  // Build query parameters
  const params = new URLSearchParams()
  
  // Add configuration parameters
  if (config.view) params.append('view', config.view)
  if (config.theme) params.append('theme', config.theme)
  if (config.codemirror !== undefined) params.append('codemirror', config.codemirror ? '1' : '0')
  if (config.editorsize !== undefined) params.append('editorsize', config.editorsize.toString())
  if (config.hidenavigation !== undefined) params.append('hidenavigation', config.hidenavigation ? '1' : '0')
  if (config.runonclick !== undefined) params.append('runonclick', config.runonclick ? '1' : '0')
  if (config.moduleview !== undefined) params.append('moduleview', config.moduleview ? '1' : '0')
  
  // Create the embed URL
  const queryString = params.toString()
  const embedUrl = `https://codesandbox.io/api/v1/sandboxes/define?embed=1${queryString ? '&' + queryString : ''}&parameters=${sandbox.parameters}`
  
  return embedUrl
}

export function createEmbedForm(code: string, projectName: string, config: CodeSandboxConfig = {}) {
  const sandbox = createCodeSandbox(code, projectName)
  
  // Build query parameters for the embed
  const params = new URLSearchParams()
  params.append('embed', '1')
  
  // Add configuration parameters
  if (config.view) params.append('view', config.view)
  if (config.theme) params.append('theme', config.theme)
  if (config.codemirror !== undefined) params.append('codemirror', config.codemirror ? '1' : '0')
  if (config.editorsize !== undefined) params.append('editorsize', config.editorsize.toString())
  if (config.hidenavigation !== undefined) params.append('hidenavigation', config.hidenavigation ? '1' : '0')
  if (config.runonclick !== undefined) params.append('runonclick', config.runonclick ? '1' : '0')
  if (config.moduleview !== undefined) params.append('moduleview', config.moduleview ? '1' : '0')
  
  const queryString = params.toString()
  const actionUrl = `https://codesandbox.io/api/v1/sandboxes/define?${queryString}`
  
  return {
    actionUrl,
    parameters: sandbox.parameters
  }
}