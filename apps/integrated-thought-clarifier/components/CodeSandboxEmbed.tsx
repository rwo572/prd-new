'use client'

import { useEffect, useRef, useState } from 'react'
import { createEmbedForm } from '@/lib/codesandbox'

interface CodeSandboxEmbedProps {
  code: string
  projectName: string
  view?: 'editor' | 'split' | 'preview'
  theme?: 'dark' | 'light'
  editorsize?: number
}

export default function CodeSandboxEmbed({ 
  code, 
  projectName,
  view = 'split',
  theme = 'light',
  editorsize = 40
}: CodeSandboxEmbedProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sandboxId, setSandboxId] = useState<string>('')

  useEffect(() => {
    if (!code) return

    // Create a unique ID for this sandbox instance
    const uniqueId = `sandbox-${Date.now()}`
    setSandboxId(uniqueId)
    setIsLoading(true)

    // Get the form data
    const { actionUrl, parameters } = createEmbedForm(code, projectName, {
      view,
      theme,
      codemirror: true,
      hidenavigation: true,
      editorsize,
      runonclick: false
    })

    // Wait a bit for iframe to be ready
    setTimeout(() => {
      // Create a temporary form and submit it to the iframe
      const form = document.createElement('form')
      form.method = 'POST'
      form.action = actionUrl
      form.target = uniqueId
      form.style.display = 'none'

      const input = document.createElement('input')
      input.type = 'hidden'
      input.name = 'parameters'
      input.value = parameters

      form.appendChild(input)
      document.body.appendChild(form)
      
      console.log('Submitting form to CodeSandbox:', { actionUrl, uniqueId })
      
      // Submit the form
      form.submit()
      
      // Clean up the form element
      setTimeout(() => {
        if (document.body.contains(form)) {
          document.body.removeChild(form)
        }
      }, 500)
    }, 100)

    return () => {
      // Cleanup if needed
    }
  }, [code, projectName, view, theme, editorsize])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading sandbox...</p>
          </div>
        </div>
      )}
      <iframe
        ref={iframeRef}
        name={sandboxId}
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
        onLoad={() => setIsLoading(false)}
      />
    </div>
  )
}