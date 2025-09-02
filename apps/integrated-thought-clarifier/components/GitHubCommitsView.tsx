'use client'

import { useState } from 'react'
import { 
  Code2, FileText, Clock, Sparkles, TrendingUp, AlertCircle, 
  CheckCircle, Lightbulb, Target, Zap, Users, BarChart3, 
  Shield, Rocket, BookOpen, Brain, Heart, GitBranch,
  MessageSquare, Beaker, Bug, Wrench
} from 'lucide-react'

interface Commit {
  id: string
  sha: string
  message: string
  author: string
  authorAvatar: string
  timestamp: Date
  type: 'code' | 'spec' | 'test' | 'fix' | 'refactor' | 'docs'
  category: 'foundation' | 'feature' | 'improvement' | 'fix' | 'learning' | 'pivot'
  files: string[]
  additions: number
  deletions: number
  milestone?: string
  learning?: string
  impact?: string
  storyContext?: string
  emotion?: 'excited' | 'challenged' | 'proud' | 'thoughtful' | 'determined'
}

// Generate story-driven mock data
const generateStoryData = (): Commit[] => {
  const now = new Date()
  const DAY = 24 * 60 * 60 * 1000
  
  const commits: Commit[] = [
    // Chapter 1: The Beginning
    {
      id: 'commit-1',
      sha: 'a1b2c3d',
      message: 'Initial vision: AI-powered task management',
      author: 'Rachel Wong',
      authorAvatar: 'RW',
      timestamp: new Date(now.getTime() - 30 * DAY),
      type: 'spec',
      category: 'foundation',
      files: ['README.md', 'docs/vision.md'],
      additions: 245,
      deletions: 0,
      milestone: 'Project Genesis',
      storyContext: 'Every great product starts with a vision. We imagined a world where AI could understand not just what tasks need to be done, but why and when.',
      learning: 'Users don\'t just want task lists - they want intelligent prioritization',
      impact: 'Set the foundation for all future development',
      emotion: 'excited'
    },
    {
      id: 'commit-2',
      sha: 'b2c3d4e',
      message: 'Research: Analyzed 50+ existing task managers',
      author: 'Alex Chen',
      authorAvatar: 'AC',
      timestamp: new Date(now.getTime() - 29 * DAY),
      type: 'docs',
      category: 'learning',
      files: ['docs/research/competitor-analysis.md', 'docs/research/user-interviews.md'],
      additions: 523,
      deletions: 0,
      storyContext: 'Before writing a single line of code, we needed to understand what was missing in the market.',
      learning: 'Most task managers treat all tasks equally - but not all tasks are created equal',
      impact: 'Identified key differentiators for our product',
      emotion: 'thoughtful'
    },
    {
      id: 'commit-3',
      sha: 'c3d4e5f',
      message: 'Created initial PRD with core features',
      author: 'Sarah Kim',
      authorAvatar: 'SK',
      timestamp: new Date(now.getTime() - 28 * DAY),
      type: 'spec',
      category: 'foundation',
      files: ['docs/prd.md', 'docs/features.md'],
      additions: 412,
      deletions: 0,
      milestone: 'PRD v1.0',
      storyContext: 'With research complete, we crystallized our vision into concrete requirements.',
      learning: 'Writing detailed specs upfront saves countless hours of rework',
      impact: 'Aligned the team on what we\'re building',
      emotion: 'determined'
    },

    // Chapter 2: Building the Foundation
    {
      id: 'commit-4',
      sha: 'd4e5f6g',
      message: 'Set up project architecture with Next.js and TypeScript',
      author: 'Mike Johnson',
      authorAvatar: 'MJ',
      timestamp: new Date(now.getTime() - 25 * DAY),
      type: 'code',
      category: 'foundation',
      files: ['package.json', 'tsconfig.json', 'src/app/layout.tsx'],
      additions: 186,
      deletions: 0,
      storyContext: 'Time to turn vision into reality. We chose a modern, type-safe stack.',
      learning: 'TypeScript catches bugs before they happen',
      impact: 'Established a scalable foundation',
      emotion: 'excited'
    },
    {
      id: 'commit-5',
      sha: 'e5f6g7h',
      message: 'Implemented basic task CRUD operations',
      author: 'Alex Chen',
      authorAvatar: 'AC',
      timestamp: new Date(now.getTime() - 24 * DAY),
      type: 'code',
      category: 'feature',
      files: ['src/components/TaskList.tsx', 'src/lib/db.ts'],
      additions: 342,
      deletions: 0,
      milestone: 'MVP Features',
      storyContext: 'Start simple. Get the basics right before adding complexity.',
      learning: 'Users expect the basics to just work - flawlessly',
      impact: 'Core functionality operational',
      emotion: 'proud'
    },

    // Chapter 3: The First Challenge
    {
      id: 'commit-6',
      sha: 'f6g7h8i',
      message: 'Bug: Tasks disappearing on refresh',
      author: 'Sarah Kim',
      authorAvatar: 'SK',
      timestamp: new Date(now.getTime() - 20 * DAY),
      type: 'fix',
      category: 'fix',
      files: ['src/hooks/useTasks.ts'],
      additions: 45,
      deletions: 32,
      storyContext: 'Our first major bug. Tasks weren\'t persisting properly.',
      learning: 'State management is harder than it looks',
      impact: 'Fixed critical data loss issue',
      emotion: 'challenged'
    },
    {
      id: 'commit-7',
      sha: 'g7h8i9j',
      message: 'Refactored state management with proper persistence',
      author: 'Mike Johnson',
      authorAvatar: 'MJ',
      timestamp: new Date(now.getTime() - 19 * DAY),
      type: 'refactor',
      category: 'improvement',
      files: ['src/store/taskStore.ts', 'src/hooks/useLocalStorage.ts'],
      additions: 234,
      deletions: 156,
      storyContext: 'Sometimes you need to step back and rebuild properly.',
      learning: 'Invest in proper state management early',
      impact: 'Eliminated an entire class of bugs',
      emotion: 'determined'
    },

    // Chapter 4: The AI Revolution
    {
      id: 'commit-8',
      sha: 'h8i9j0k',
      message: 'Integrated OpenAI for intelligent task prioritization',
      author: 'Rachel Wong',
      authorAvatar: 'RW',
      timestamp: new Date(now.getTime() - 15 * DAY),
      type: 'code',
      category: 'feature',
      files: ['src/lib/ai-service.ts', 'src/api/prioritize/route.ts'],
      additions: 523,
      deletions: 0,
      milestone: 'AI Integration',
      storyContext: 'This was it - the moment we added the "intelligence" to our task manager.',
      learning: 'AI isn\'t magic, but when done right, it feels like it',
      impact: 'Transformed from a task list to an intelligent assistant',
      emotion: 'excited'
    },
    {
      id: 'commit-9',
      sha: 'i9j0k1l',
      message: 'Added context awareness to AI prioritization',
      author: 'Alex Chen',
      authorAvatar: 'AC',
      timestamp: new Date(now.getTime() - 14 * DAY),
      type: 'code',
      category: 'improvement',
      files: ['src/lib/ai-context.ts', 'src/components/ContextPanel.tsx'],
      additions: 289,
      deletions: 45,
      storyContext: 'The AI needed to understand user context - deadlines, energy levels, dependencies.',
      learning: 'Context is everything in prioritization',
      impact: 'AI recommendations became 3x more relevant',
      emotion: 'proud'
    },

    // Chapter 5: User Feedback Loop
    {
      id: 'commit-10',
      sha: 'j0k1l2m',
      message: 'Beta launch: First 10 users onboarded',
      author: 'Sarah Kim',
      authorAvatar: 'SK',
      timestamp: new Date(now.getTime() - 10 * DAY),
      type: 'docs',
      category: 'learning',
      files: ['docs/beta-feedback.md'],
      additions: 167,
      deletions: 0,
      milestone: 'Beta Launch',
      storyContext: 'Real users, real feedback. This is where theory meets reality.',
      learning: 'Users loved AI suggestions but wanted more control',
      impact: 'Validated core concept, identified improvements',
      emotion: 'thoughtful'
    },
    {
      id: 'commit-11',
      sha: 'k1l2m3n',
      message: 'Added manual override for AI suggestions',
      author: 'Mike Johnson',
      authorAvatar: 'MJ',
      timestamp: new Date(now.getTime() - 8 * DAY),
      type: 'code',
      category: 'feature',
      files: ['src/components/PriorityOverride.tsx'],
      additions: 198,
      deletions: 23,
      storyContext: 'Users wanted AI assistance, not AI dominance. We listened.',
      learning: 'The best AI augments human judgment, doesn\'t replace it',
      impact: 'User satisfaction increased 40%',
      emotion: 'proud'
    },

    // Chapter 6: Scaling Up
    {
      id: 'commit-12',
      sha: 'l2m3n4o',
      message: 'Implemented team collaboration features',
      author: 'Rachel Wong',
      authorAvatar: 'RW',
      timestamp: new Date(now.getTime() - 5 * DAY),
      type: 'code',
      category: 'feature',
      files: ['src/components/TeamView.tsx', 'src/lib/collaboration.ts'],
      additions: 456,
      deletions: 0,
      milestone: 'Team Features',
      storyContext: 'Individual productivity was solved. Time to tackle team productivity.',
      learning: 'Team dynamics add exponential complexity',
      impact: 'Opened up enterprise market',
      emotion: 'excited'
    },
    {
      id: 'commit-13',
      sha: 'm3n4o5p',
      message: 'Performance optimization: 10x faster task loading',
      author: 'Alex Chen',
      authorAvatar: 'AC',
      timestamp: new Date(now.getTime() - 3 * DAY),
      type: 'refactor',
      category: 'improvement',
      files: ['src/lib/db-queries.ts', 'src/components/VirtualList.tsx'],
      additions: 234,
      deletions: 189,
      storyContext: 'With teams come thousands of tasks. Performance became critical.',
      learning: 'Virtualization is essential for large datasets',
      impact: 'Can now handle 10,000+ tasks smoothly',
      emotion: 'determined'
    },

    // Chapter 7: The Present
    {
      id: 'commit-14',
      sha: 'n4o5p6q',
      message: 'Launched analytics dashboard for productivity insights',
      author: 'Sarah Kim',
      authorAvatar: 'SK',
      timestamp: new Date(now.getTime() - 1 * DAY),
      type: 'code',
      category: 'feature',
      files: ['src/components/Dashboard.tsx', 'src/lib/analytics.ts'],
      additions: 678,
      deletions: 0,
      milestone: 'Analytics Launch',
      storyContext: 'Users wanted to understand their productivity patterns over time.',
      learning: 'Data visualization transforms numbers into insights',
      impact: 'Users report 25% productivity improvement',
      emotion: 'proud'
    },
    {
      id: 'commit-15',
      sha: 'o5p6q7r',
      message: 'Preparing for public launch',
      author: 'Rachel Wong',
      authorAvatar: 'RW',
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      type: 'docs',
      category: 'pivot',
      files: ['docs/launch-plan.md', 'README.md'],
      additions: 234,
      deletions: 45,
      milestone: 'Public Launch',
      storyContext: 'After months of iteration, we\'re ready to share our vision with the world.',
      learning: 'Perfect is the enemy of good - ship when it\'s valuable',
      impact: 'Opening to 1000+ waitlist users',
      emotion: 'excited'
    }
  ]
  
  return commits
}

interface GitHubCommitsViewProps {
  projectName: string
}

export default function GitHubCommitsView({ projectName }: GitHubCommitsViewProps) {
  const [commits] = useState<Commit[]>(generateStoryData())
  const [selectedCommit, setSelectedCommit] = useState<Commit | null>(null)
  const [showOnlyMilestones, setShowOnlyMilestones] = useState(false)

  const formatTimestamp = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)
    
    if (hours < 1) return 'just now'
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`
    if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''} ago`
    return date.toLocaleDateString()
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'foundation': return <Target className="w-4 h-4" />
      case 'feature': return <Sparkles className="w-4 h-4" />
      case 'improvement': return <TrendingUp className="w-4 h-4" />
      case 'fix': return <Bug className="w-4 h-4" />
      case 'learning': return <Brain className="w-4 h-4" />
      case 'pivot': return <Rocket className="w-4 h-4" />
      default: return <Code2 className="w-4 h-4" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'foundation': return 'bg-indigo-100 text-indigo-700 border-indigo-200'
      case 'feature': return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'improvement': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'fix': return 'bg-red-100 text-red-700 border-red-200'
      case 'learning': return 'bg-amber-100 text-amber-700 border-amber-200'
      case 'pivot': return 'bg-green-100 text-green-700 border-green-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getEmotionEmoji = (emotion?: string) => {
    switch (emotion) {
      case 'excited': return '🚀'
      case 'challenged': return '💪'
      case 'proud': return '🎉'
      case 'thoughtful': return '🤔'
      case 'determined': return '💯'
      default: return '✨'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'code': return <Code2 className="w-3 h-3" />
      case 'spec': return <FileText className="w-3 h-3" />
      case 'test': return <Beaker className="w-3 h-3" />
      case 'fix': return <Bug className="w-3 h-3" />
      case 'refactor': return <Wrench className="w-3 h-3" />
      case 'docs': return <BookOpen className="w-3 h-3" />
      default: return <GitBranch className="w-3 h-3" />
    }
  }

  const filteredCommits = showOnlyMilestones ? commits.filter(c => c.milestone) : commits

  return (
    <div className="h-full flex bg-gray-50">
      {/* Story Feed */}
      <div className={`${selectedCommit ? 'w-3/5' : 'w-full'} overflow-y-auto`}>
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Product Evolution Story</h2>
                <p className="text-sm text-gray-600 mt-1">Follow the journey from idea to reality</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowOnlyMilestones(!showOnlyMilestones)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    showOnlyMilestones 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {showOnlyMilestones ? 'Showing Milestones' : 'Show All'}
                </button>
                <span className="text-sm text-gray-500">
                  {filteredCommits.length} moments in {projectName}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-12 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-200 via-purple-100 to-transparent"></div>

          {/* Commits */}
          <div className="space-y-0">
            {filteredCommits.map((commit, index) => (
              <div key={commit.id} className="relative">
                {/* Milestone Banner */}
                {commit.milestone && (
                  <div className="px-6 py-3 bg-gradient-to-r from-purple-50 to-indigo-50 border-y border-purple-100">
                    <div className="flex items-center gap-2 ml-12">
                      <Rocket className="w-4 h-4 text-purple-600" />
                      <span className="font-semibold text-purple-900">{commit.milestone}</span>
                    </div>
                  </div>
                )}

                {/* Commit Card */}
                <div
                  className={`group px-6 py-4 hover:bg-white transition-all cursor-pointer ${
                    selectedCommit?.id === commit.id ? 'bg-purple-50 border-l-4 border-purple-500' : ''
                  }`}
                  onClick={() => setSelectedCommit(commit)}
                >
                  <div className="flex gap-4">
                    {/* Timeline Node */}
                    <div className="relative flex-shrink-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                        commit.milestone 
                          ? 'bg-gradient-to-br from-purple-500 to-indigo-500 text-white shadow-lg ring-4 ring-purple-100' 
                          : 'bg-white border-2 border-gray-300'
                      }`}>
                        {commit.milestone ? getEmotionEmoji(commit.emotion) : getCategoryIcon(commit.category)}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Story Context */}
                      {commit.storyContext && (
                        <p className="text-sm text-gray-600 italic mb-2">
                          {commit.storyContext}
                        </p>
                      )}

                      {/* Commit Message */}
                      <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-purple-700 transition-colors">
                        {commit.message}
                      </h3>

                      {/* Metadata Row */}
                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white text-[10px] font-bold">
                            {commit.authorAvatar}
                          </div>
                          <span className="text-gray-600">{commit.author}</span>
                        </div>
                        <span className="text-gray-400">•</span>
                        <div className="flex items-center gap-1 text-gray-500">
                          <Clock className="w-3 h-3" />
                          {formatTimestamp(commit.timestamp)}
                        </div>
                        <span className="text-gray-400">•</span>
                        <div className={`px-2 py-0.5 rounded-full border flex items-center gap-1 ${getCategoryColor(commit.category)}`}>
                          {getCategoryIcon(commit.category)}
                          <span className="text-xs font-medium capitalize">{commit.category}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-400">
                          {getTypeIcon(commit.type)}
                          <span className="text-xs">{commit.type}</span>
                        </div>
                      </div>

                      {/* Learning/Impact Pills */}
                      <div className="mt-3 space-y-2">
                        {commit.learning && (
                          <div className="flex items-start gap-2">
                            <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-amber-700 bg-amber-50 px-2 py-1 rounded">
                              <span className="font-medium">Learning:</span> {commit.learning}
                            </p>
                          </div>
                        )}
                        {commit.impact && (
                          <div className="flex items-start gap-2">
                            <Zap className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-blue-700 bg-blue-50 px-2 py-1 rounded">
                              <span className="font-medium">Impact:</span> {commit.impact}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-3 mt-3 text-xs">
                        <span className="text-green-600 font-medium">+{commit.additions}</span>
                        <span className="text-red-600 font-medium">-{commit.deletions}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-500">{commit.files.length} files</span>
                        <span className="text-gray-400">•</span>
                        <span className="font-mono text-gray-400">{commit.sha}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* End of Timeline */}
          <div className="px-6 py-8 text-center">
            <div className="inline-flex items-center gap-2 text-gray-400">
              <Heart className="w-4 h-4" />
              <span className="text-sm">The journey continues...</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Panel */}
      {selectedCommit && (
        <div className="w-2/5 bg-white border-l border-gray-200 overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{selectedCommit.message}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white text-xs font-bold">
                    {selectedCommit.authorAvatar}
                  </div>
                  <span className="text-sm text-gray-600">{selectedCommit.author}</span>
                  <span className="text-sm text-gray-400">•</span>
                  <span className="text-sm text-gray-500">{formatTimestamp(selectedCommit.timestamp)}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedCommit(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Story Context */}
            {selectedCommit.storyContext && (
              <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-100">
                <div className="flex items-start gap-2">
                  <BookOpen className="w-4 h-4 text-purple-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-purple-900 mb-1">The Story</h4>
                    <p className="text-sm text-purple-700">{selectedCommit.storyContext}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Learning & Impact */}
            {(selectedCommit.learning || selectedCommit.impact) && (
              <div className="mb-6 space-y-3">
                {selectedCommit.learning && (
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="w-4 h-4 text-amber-600 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-semibold text-amber-900 mb-1">What We Learned</h4>
                        <p className="text-sm text-amber-700">{selectedCommit.learning}</p>
                      </div>
                    </div>
                  </div>
                )}
                {selectedCommit.impact && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex items-start gap-2">
                      <Zap className="w-4 h-4 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-semibold text-blue-900 mb-1">The Impact</h4>
                        <p className="text-sm text-blue-700">{selectedCommit.impact}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Files Changed */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Changes Made</h4>
              <div className="space-y-2">
                {selectedCommit.files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-mono text-gray-700">{file}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-green-600">+{Math.floor(selectedCommit.additions / selectedCommit.files.length)}</span>
                      <span className="text-red-600">-{Math.floor(selectedCommit.deletions / selectedCommit.files.length)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Commit Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Lines Added</div>
                <div className="text-2xl font-bold text-green-600">+{selectedCommit.additions}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Lines Removed</div>
                <div className="text-2xl font-bold text-red-600">-{selectedCommit.deletions}</div>
              </div>
            </div>

            {/* Milestone Badge */}
            {selectedCommit.milestone && (
              <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2">
                  <Rocket className="w-5 h-5 text-purple-600" />
                  <div>
                    <div className="text-xs text-purple-600 font-medium">MILESTONE ACHIEVED</div>
                    <div className="text-lg font-bold text-purple-900">{selectedCommit.milestone}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}