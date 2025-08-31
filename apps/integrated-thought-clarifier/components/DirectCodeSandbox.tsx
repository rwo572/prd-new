'use client'

import { useState, useEffect } from 'react'

interface DirectCodeSandboxProps {
  code: string
  projectName: string
}

export default function DirectCodeSandbox({ code, projectName }: DirectCodeSandboxProps) {
  const [sandboxUrl, setSandboxUrl] = useState<string>('')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!code) return

    const createSandbox = async () => {
      setIsCreating(true)
      setError(null)
      
      try {
        // Call our API to get sandbox parameters
        const response = await fetch('/api/codesandbox', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            projectName
          })
        })

        if (!response.ok) {
          throw new Error('Failed to create sandbox')
        }

        const { parameters } = await response.json()
        
        // Create sandbox via CodeSandbox API
        const sandboxResponse = await fetch('https://codesandbox.io/api/v1/sandboxes/define?json=1', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            parameters
          })
        })

        if (!sandboxResponse.ok) {
          throw new Error('Failed to create sandbox on CodeSandbox')
        }

        const sandboxData = await sandboxResponse.json()
        
        // Set the embed URL using the sandbox ID
        const embedUrl = `https://codesandbox.io/embed/${sandboxData.sandbox_id}?fontsize=14&hidenavigation=1&theme=light&view=editor&editorsize=100`
        setSandboxUrl(embedUrl)
      } catch (err) {
        console.error('Error creating sandbox:', err)
        // Fallback to a simple code display
        setError('Unable to load CodeSandbox preview. The code is displayed below.')
      } finally {
        setIsCreating(false)
      }
    }

    createSandbox()
  }, [code, projectName])

  if (!code) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500">No prototype code available</p>
        </div>
      </div>
    )
  }

  if (isCreating) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Creating sandbox...</p>
        </div>
      </div>
    )
  }

  if (error) {
    // Fallback: show code in a simple pre tag
    return (
      <div className="h-full flex flex-col">
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2">
          <p className="text-sm text-yellow-800">{error}</p>
        </div>
        <div className="flex-1 overflow-auto p-4 bg-gray-900">
          <pre className="text-gray-100 text-sm font-mono">
            <code>{code}</code>
          </pre>
        </div>
      </div>
    )
  }

  if (sandboxUrl) {
    return (
      <iframe
        src={sandboxUrl}
        style={{
          width: '100%',
          height: '100%',
          border: 0,
          borderRadius: '8px',
          overflow: 'hidden'
        }}
        title="CodeSandbox"
        allow="accelerometer; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb"
        sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
      />
    )
  }

  return null
}