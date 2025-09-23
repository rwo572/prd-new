'use client'

import { useState } from 'react'
import { Key, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'
import { ApiKeys } from '@/types'

interface ApiKeyManagerProps {
  apiKeys: ApiKeys
  onUpdateKeys: (keys: ApiKeys) => void
}

export default function ApiKeyManager({ apiKeys, onUpdateKeys }: ApiKeyManagerProps) {
  const [showKeys, setShowKeys] = useState({ openai: false, anthropic: false })
  const [tempKeys, setTempKeys] = useState(apiKeys)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    onUpdateKeys(tempKeys)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const validateKey = (key: string, provider: 'openai' | 'anthropic') => {
    if (!key) return null
    if (provider === 'openai') {
      return key.startsWith('sk-') ? 'valid' : 'invalid'
    }
    if (provider === 'anthropic') {
      return key.startsWith('sk-ant-') ? 'valid' : 'invalid'
    }
    return null
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-blue-600 mt-0.5" size={20} />
          <div>
            <h3 className="font-semibold text-blue-900">Privacy First</h3>
            <p className="text-sm text-blue-700 mt-1">
              Your API keys are stored locally in your browser and never sent to our servers.
              All AI processing happens directly between your browser and the AI provider.
            </p>
          </div>
        </div>
      </div>

      {!apiKeys.openai && !apiKeys.anthropic && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-amber-600 mt-0.5" size={20} />
            <div>
              <h3 className="font-semibold text-amber-900">Demo Mode Active</h3>
              <p className="text-sm text-amber-700 mt-1">
                You're currently in demo mode with simulated AI responses. Add an API key below
                to unlock full AI capabilities with GPT-4 or Claude.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            OpenAI API Key
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Key className="text-gray-400" size={18} />
            </div>
            <input
              type={showKeys.openai ? 'text' : 'password'}
              value={tempKeys.openai}
              onChange={(e) => setTempKeys({ ...tempKeys, openai: e.target.value })}
              placeholder="sk-..."
              className="w-full pl-10 pr-24 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-2">
              {validateKey(tempKeys.openai, 'openai') === 'valid' && (
                <CheckCircle className="text-green-500" size={18} />
              )}
              {validateKey(tempKeys.openai, 'openai') === 'invalid' && (
                <AlertCircle className="text-red-500" size={18} />
              )}
              <button
                type="button"
                onClick={() => setShowKeys({ ...showKeys, openai: !showKeys.openai })}
                className="text-gray-400 hover:text-gray-600"
              >
                {showKeys.openai ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Get your API key from{' '}
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:underline"
            >
              OpenAI Platform
            </a>
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Anthropic API Key
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Key className="text-gray-400" size={18} />
            </div>
            <input
              type={showKeys.anthropic ? 'text' : 'password'}
              value={tempKeys.anthropic}
              onChange={(e) => setTempKeys({ ...tempKeys, anthropic: e.target.value })}
              placeholder="sk-ant-..."
              className="w-full pl-10 pr-24 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-2">
              {validateKey(tempKeys.anthropic, 'anthropic') === 'valid' && (
                <CheckCircle className="text-green-500" size={18} />
              )}
              {validateKey(tempKeys.anthropic, 'anthropic') === 'invalid' && (
                <AlertCircle className="text-red-500" size={18} />
              )}
              <button
                type="button"
                onClick={() => setShowKeys({ ...showKeys, anthropic: !showKeys.anthropic })}
                className="text-gray-400 hover:text-gray-600"
              >
                {showKeys.anthropic ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Get your API key from{' '}
            <a
              href="https://console.anthropic.com/settings/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:underline"
            >
              Anthropic Console
            </a>
          </p>
        </div>

      </div>

      <div className="pt-4">
        <button
          onClick={handleSave}
          className="w-full px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center justify-center gap-2"
        >
          {saved ? (
            <>
              <CheckCircle size={20} />
              <span>Saved Successfully</span>
            </>
          ) : (
            <span>Save API Keys</span>
          )}
        </button>
      </div>
    </div>
  )
}