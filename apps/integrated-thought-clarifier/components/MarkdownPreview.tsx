'use client'

import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'

interface MarkdownPreviewProps {
  content: string
  className?: string
}

export default function MarkdownPreview({ content, className }: MarkdownPreviewProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-400">Loading preview...</div>
      </div>
    )
  }

  return (
    <div className={cn("h-full overflow-y-auto bg-white", className)}>
      <div className="px-3 py-2 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Rich Text Preview</span>
        </div>
      </div>
      <div className="prose prose-sm max-w-none p-6">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => (
              <h1 className="text-2xl font-bold mt-6 mb-4 text-gray-900">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-xl font-semibold mt-5 mb-3 text-gray-800">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-lg font-semibold mt-4 mb-2 text-gray-700">{children}</h3>
            ),
            h4: ({ children }) => (
              <h4 className="text-base font-semibold mt-3 mb-2 text-gray-700">{children}</h4>
            ),
            p: ({ children }) => (
              <p className="mb-4 text-gray-600 leading-relaxed">{children}</p>
            ),
            ul: ({ children }) => (
              <ul className="mb-4 ml-6 list-disc space-y-2">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="mb-4 ml-6 list-decimal space-y-2">{children}</ol>
            ),
            li: ({ children }) => (
              <li className="text-gray-600">{children}</li>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-purple-500 pl-4 my-4 italic text-gray-600">
                {children}
              </blockquote>
            ),
            code: ({ inline, children }) => {
              if (inline) {
                return (
                  <code className="px-1.5 py-0.5 bg-gray-100 text-purple-600 rounded text-sm font-mono">
                    {children}
                  </code>
                )
              }
              return (
                <code className="block p-4 bg-gray-50 rounded-lg text-sm font-mono overflow-x-auto">
                  {children}
                </code>
              )
            },
            pre: ({ children }) => (
              <pre className="mb-4">{children}</pre>
            ),
            table: ({ children }) => (
              <div className="overflow-x-auto mb-4">
                <table className="min-w-full divide-y divide-gray-200">{children}</table>
              </div>
            ),
            thead: ({ children }) => (
              <thead className="bg-gray-50">{children}</thead>
            ),
            tbody: ({ children }) => (
              <tbody className="divide-y divide-gray-200">{children}</tbody>
            ),
            th: ({ children }) => (
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="px-4 py-2 text-sm text-gray-600">{children}</td>
            ),
            hr: () => (
              <hr className="my-6 border-gray-200" />
            ),
            a: ({ href, children }) => (
              <a href={href} className="text-purple-600 hover:text-purple-700 underline">
                {children}
              </a>
            ),
            strong: ({ children }) => (
              <strong className="font-semibold text-gray-900">{children}</strong>
            ),
            em: ({ children }) => (
              <em className="italic">{children}</em>
            )
          }}
        >
          {content || '*No content to preview*'}
        </ReactMarkdown>
      </div>
    </div>
  )
}