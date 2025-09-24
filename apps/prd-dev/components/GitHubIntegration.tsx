'use client'

import { useState } from 'react'
import { Github, GitBranch, Lock, Globe, ExternalLink } from 'lucide-react'

interface GitHubIntegrationProps {
  connected: boolean
  onConnect: () => void
  projectName: string
  prdContent: string
}

export default function GitHubIntegration({ connected, onConnect, projectName, prdContent }: GitHubIntegrationProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [repoUrl, setRepoUrl] = useState('')

  const handleConnect = () => {
    // In production, this would initiate OAuth flow
    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || 'demo'
    const redirectUri = encodeURIComponent(window.location.origin + '/auth/github/callback')
    const scope = 'repo,user'
    
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`
  }

  const handleCreateRepo = async () => {
    setIsCreating(true)
    // Simulated repo creation - in production, would use GitHub API
    setTimeout(() => {
      setRepoUrl(`https://github.com/user/${projectName.toLowerCase().replace(/\s+/g, '-')}`)
      setIsCreating(false)
    }, 2000)
  }

  if (!connected) {
    return (
      <button
        onClick={handleConnect}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors"
      >
        <Github size={18} />
        <span>Connect GitHub</span>
      </button>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg">
        <Github size={18} />
        <span className="text-sm">GitHub Connected</span>
      </div>
      
      {!repoUrl ? (
        <button
          onClick={handleCreateRepo}
          disabled={isCreating}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
        >
          <GitBranch size={18} />
          <span>{isCreating ? 'Creating...' : 'Create Repository'}</span>
        </button>
      ) : (
        <a
          href={repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100"
        >
          <ExternalLink size={18} />
          <span className="text-sm truncate">View Repository</span>
        </a>
      )}
    </div>
  )
}