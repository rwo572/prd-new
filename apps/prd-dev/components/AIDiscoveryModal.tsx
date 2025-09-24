'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageSquare, X, Minimize2, Maximize2, Send, Loader2, Bot, User } from 'lucide-react'
import { Message } from '@/types'

interface AIDiscoveryModalProps {
  isOpen: boolean
  onClose: () => void
  messages: Message[]
  onSendMessage: (message: string) => void
  isGenerating: boolean
}

export default function AIDiscoveryModal({ 
  isOpen, 
  onClose, 
  messages, 
  onSendMessage, 
  isGenerating 
}: AIDiscoveryModalProps) {
  const [isMinimized, setIsMinimized] = useState(false)
  const [input, setInput] = useState('')
  const [position, setPosition] = useState({ x: 20, y: 20 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.modal-header')) {
      setIsDragging(true)
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      })
    }
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragStart])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isGenerating) {
      onSendMessage(input.trim())
      setInput('')
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }

  if (!isOpen) return null

  return (
    <div
      ref={modalRef}
      className={`fixed z-50 bg-white rounded-xl shadow-2xl border border-gray-200 transition-all duration-200 ${
        isMinimized ? 'w-80' : 'w-96'
      }`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        maxHeight: isMinimized ? '48px' : '600px',
        height: isMinimized ? '48px' : '500px'
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div className="modal-header flex items-center justify-between px-4 py-3 border-b border-gray-200 cursor-move bg-gradient-to-r from-purple-50 to-indigo-50 rounded-t-xl">
        <div className="flex items-center gap-2">
          <MessageSquare size={18} className="text-purple-600" />
          <span className="font-semibold text-gray-900 text-sm">AI Discovery</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-white/50 rounded transition-colors"
          >
            {isMinimized ? <Maximize2 size={16} className="text-gray-600" /> : <Minimize2 size={16} className="text-gray-600" />}
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/50 rounded transition-colors"
          >
            <X size={16} className="text-gray-600" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ height: 'calc(100% - 120px)' }}>
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <Bot className="w-12 h-12 mx-auto mb-3 text-purple-500" />
                <p className="text-gray-600 text-sm mb-2">Hi! I'm here to help you create your PRD.</p>
                <p className="text-gray-500 text-xs">Tell me about your product idea...</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <Bot size={14} className="text-purple-600" />
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                      message.role === 'user'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                  {message.role === 'user' && (
                    <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <User size={14} className="text-gray-600" />
                    </div>
                  )}
                </div>
              ))
            )}
            {isGenerating && (
              <div className="flex gap-2 justify-start">
                <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center">
                  <Bot size={14} className="text-purple-600" />
                </div>
                <div className="bg-gray-100 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="animate-spin" size={14} />
                    <span className="text-sm text-gray-500">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="border-t border-gray-200 p-3">
            <div className="flex gap-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value)
                  adjustTextareaHeight()
                }}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your product idea..."
                className="flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                rows={1}
              />
              <button
                type="submit"
                disabled={!input.trim() || isGenerating}
                className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isGenerating ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  )
}