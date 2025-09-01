'use client'

import { useState, useEffect, useRef } from 'react'

interface CodePreviewProps {
  code: string
  projectName: string
  view?: 'editor' | 'split' | 'preview'
}

export default function CodePreview({ 
  code, 
  projectName,
  view = 'editor' // Default to editor view to show code expanded
}: CodePreviewProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [iframeKey, setIframeKey] = useState(0)

  // Set mounted state to avoid hydration issues
  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!code || !isMounted) {
      setIsLoading(false)
      return
    }

    const loadSandbox = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Get parameters from our API
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
          throw new Error('Failed to create sandbox parameters')
        }

        const { parameters } = await response.json()

        // Create and submit form
        if (formRef.current && iframeRef.current) {
          // Update form with parameters
          const input = formRef.current.querySelector('input[name="parameters"]') as HTMLInputElement
          if (input) {
            input.value = parameters
          }

          // Submit the form
          formRef.current.submit()
          
          // Hide loading after a delay
          setTimeout(() => {
            setIsLoading(false)
          }, 2000)
        }
      } catch (err) {
        console.error('Error creating sandbox:', err)
        setError('Failed to load preview. Please try again.')
        setIsLoading(false)
      }
    }

    loadSandbox()
  }, [code, projectName, view, isMounted])

  if (!code) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          <p className="text-gray-500">No prototype code available</p>
          <p className="text-sm text-gray-400 mt-2">Generate a prototype from the PRD tab first</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => setIframeKey(prev => prev + 1)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const queryParams = new URLSearchParams({
    embed: '1',
    view: 'split', // Use split view to show both code and preview
    theme: 'light',
    hidenavigation: '1',
    codemirror: '0', 
    editorsize: '55', // Balanced split
    runonclick: '0',
    fontsize: '13',
    hidedevtools: '1',
    modulesview: '0',
    expanddevtools: '0',
    forcerefresh: '1',
    highlights: '0',
    initialpath: '/',
    module: '/src/App.js',
    autoresize: '1',
    eslint: '0', // Disable eslint warnings
    expandtabs: '0', // Don't expand tabs
    previewwindow: '0', // Hide preview window tabs
    tabs: '0', // Hide tabs
    verticallayout: '0', // Horizontal layout
  })

  const actionUrl = `https://codesandbox.io/api/v1/sandboxes/define?${queryParams.toString()}`

  // Don't render iframe until mounted to avoid hydration issues
  if (!isMounted) {
    return (
      <div className="w-full h-full relative bg-white">
        <div className="absolute inset-0 flex items-center justify-center bg-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto mb-3"></div>
            <p className="text-sm text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative bg-white">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto mb-3"></div>
            <p className="text-sm text-gray-600">Loading sandbox...</p>
          </div>
        </div>
      )}
      
      {/* Hidden form for POST submission */}
      <form
        ref={formRef}
        method="POST"
        action={actionUrl}
        target={`codesandbox-${iframeKey}`}
        style={{ display: 'none' }}
      >
        <input type="hidden" name="parameters" />
      </form>

      {/* Iframe wrapper */}
      <div className="w-full h-full bg-gray-50">
        {/* Iframe to display the sandbox */}
        <iframe
          ref={iframeRef}
          key={iframeKey}
          name={`codesandbox-${iframeKey}`}
          className="w-full h-full border-0 rounded-none bg-gray-50"
          style={{
            opacity: isLoading ? 0 : 1,
            transition: 'opacity 0.3s ease-in-out',
            backgroundColor: '#f9fafb',
            border: 'none',
            outline: 'none'
          }}
          title="Code Editor"
          sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
        />
      </div>
    </div>
  )
}