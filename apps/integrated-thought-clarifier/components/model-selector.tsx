'use client'

import { useState, useEffect } from 'react'
import { AI_MODELS, getModelById } from '@/lib/model-config'
import { ApiKeys, ModelConfig } from '@/types'
import { ChevronDownIcon, BoltIcon, CpuChipIcon, CheckIcon } from '@heroicons/react/24/outline'

interface ModelSelectorProps {
  apiKeys: ApiKeys
  onModelChange: (modelId: string) => void
}

export default function ModelSelector({ apiKeys, onModelChange }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedModel, setSelectedModel] = useState<ModelConfig | null>(null)

  useEffect(() => {
    // Set default model based on active provider
    if (!apiKeys.selectedModel) {
      const defaultModel = AI_MODELS.find(m => 
        m.provider === apiKeys.activeProvider && m.id === 'claude-3-5-sonnet-20241022'
      ) || AI_MODELS.find(m => m.provider === apiKeys.activeProvider)
      
      if (defaultModel) {
        setSelectedModel(defaultModel)
        onModelChange(defaultModel.id)
      }
    } else {
      setSelectedModel(getModelById(apiKeys.selectedModel) || null)
    }
  }, [apiKeys.activeProvider, apiKeys.selectedModel, onModelChange])

  const availableModels = AI_MODELS.filter(model => {
    if (model.provider === 'openai') return !!apiKeys.openai
    if (model.provider === 'anthropic') return !!apiKeys.anthropic
    return false
  })

  const handleModelSelect = (model: ModelConfig) => {
    setSelectedModel(model)
    onModelChange(model.id)
    setIsOpen(false)
  }

  const getProviderIcon = (provider: string) => {
    return provider === 'openai' ? '🟢' : '🔷'
  }

  return (
    <div className="relative">
      {/* Model Selector Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm"
      >
        <CpuChipIcon className="w-4 h-4 text-gray-600" />
        {selectedModel ? (
          <>
            <span className="text-sm">{getProviderIcon(selectedModel.provider)}</span>
            <span className="text-sm font-medium text-gray-800">{selectedModel.name}</span>
          </>
        ) : (
          <span className="text-sm text-gray-600">Select Model</span>
        )}
        <ChevronDownIcon className="w-4 h-4 text-gray-500" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full mt-2 w-[480px] bg-white border border-gray-200 rounded-xl shadow-xl z-50">
          {/* All Models */}
          <div className="max-h-[500px] overflow-y-auto rounded-xl">
            {/* OpenAI Models */}
            {availableModels.some(m => m.provider === 'openai') && (
              <>
                <div className="px-4 py-2.5 bg-gradient-to-r from-green-50 to-emerald-50 sticky top-0 z-10 rounded-t-xl">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <h3 className="text-sm font-semibold text-gray-700">
                      OpenAI Models
                    </h3>
                  </div>
                </div>
                <div className="px-2 py-2 bg-gray-50/50">
                  {availableModels
                    .filter(m => m.provider === 'openai')
                    .map(model => (
                      <ModelOption
                        key={model.id}
                        model={model}
                        isSelected={selectedModel?.id === model.id}
                        onSelect={() => handleModelSelect(model)}
                      />
                    ))}
                </div>
              </>
            )}

            {/* Anthropic Models */}
            {availableModels.some(m => m.provider === 'anthropic') && (
              <>
                <div className="px-4 py-2.5 bg-gradient-to-r from-orange-50 to-amber-50 sticky top-0 z-10">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <h3 className="text-sm font-semibold text-gray-700">
                      Anthropic Models
                    </h3>
                  </div>
                </div>
                <div className="px-2 py-2 bg-gray-50/50">
                  {availableModels
                    .filter(m => m.provider === 'anthropic')
                    .map(model => (
                      <ModelOption
                        key={model.id}
                        model={model}
                        isSelected={selectedModel?.id === model.id}
                        onSelect={() => handleModelSelect(model)}
                      />
                    ))}
                </div>
              </>
            )}
          </div>

          {/* Model Info */}
          {selectedModel && (
            <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200 rounded-b-xl">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <span className="text-xs text-gray-500 uppercase tracking-wider">Context</span>
                  <p className="text-sm font-bold text-gray-900 mt-1">
                    {selectedModel.contextWindow >= 1000 
                      ? `${(selectedModel.contextWindow/1000).toFixed(0)}k` 
                      : selectedModel.contextWindow.toLocaleString()}
                  </p>
                </div>
                <div className="text-center border-x border-gray-200">
                  <span className="text-xs text-gray-500 uppercase tracking-wider">Output</span>
                  <p className="text-sm font-bold text-gray-900 mt-1">
                    {selectedModel.outputTokens >= 1000 
                      ? `${(selectedModel.outputTokens/1000).toFixed(0)}k` 
                      : selectedModel.outputTokens.toLocaleString()}
                  </p>
                </div>
                <div className="text-center">
                  <span className="text-xs text-gray-500 uppercase tracking-wider">Cost</span>
                  <p className="text-sm font-bold text-gray-900 mt-1">
                    ${selectedModel.costPer1kTokens.input.toFixed(3)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ModelOption({ 
  model, 
  isSelected, 
  onSelect 
}: { 
  model: ModelConfig
  isSelected: boolean
  onSelect: () => void 
}) {
  const isLatest = model.id.includes('gpt-5') || model.id.includes('opus-4-1') || model.id.includes('claude-4')
  const isFast = model.id.includes('mini') || model.id.includes('haiku')
  
  return (
    <button
      onClick={onSelect}
      className={`w-full mx-2 my-1 px-4 py-3 text-left rounded-lg transition-all ${
        isSelected 
          ? 'bg-blue-50 border-2 border-blue-300 shadow-sm' 
          : 'bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base font-semibold text-gray-900">
              {model.name}
            </span>
            {isLatest && (
              <span className="px-2 py-0.5 text-xs bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-full font-medium">
                Latest
              </span>
            )}
            {isFast && (
              <BoltIcon className="w-4 h-4 text-yellow-500" title="Fast" />
            )}
          </div>
          <div className="flex items-start gap-3 mt-1">
            <span className="text-sm text-gray-600">
              {model.bestFor[0]}
            </span>
            <span className="text-xs text-gray-500">
              {model.contextWindow >= 100000 ? `${(model.contextWindow/1000).toFixed(0)}k context` : ''}
            </span>
          </div>
        </div>
        {isSelected && (
          <CheckIcon className="w-5 h-5 text-blue-500" />
        )}
      </div>
    </button>
  )
}