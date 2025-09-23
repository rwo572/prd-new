'use client'

import { useState, useEffect, useRef } from 'react'
import { Bot, Sparkles, Shield, Zap, GitBranch, Code2, FileText, ArrowRight, Check } from 'lucide-react'

interface LandingPageProps {
  onGetStarted: () => void
}

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  // Shader-inspired animated background
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    let time = 0
    const animate = () => {
      time += 0.01

      const width = canvas.offsetWidth
      const height = canvas.offsetHeight

      ctx.clearRect(0, 0, width, height)

      // Create complex multi-layered gradient background
      const gradient1 = ctx.createRadialGradient(
        width * (0.3 + Math.sin(time * 0.4) * 0.2),
        height * (0.4 + Math.cos(time * 0.2) * 0.1),
        0,
        width * 0.3,
        height * 0.3,
        Math.max(width, height) * 0.6
      )
      gradient1.addColorStop(0, `rgba(99, 102, 241, ${0.2 + Math.sin(time) * 0.1})`)
      gradient1.addColorStop(0.5, `rgba(168, 85, 247, ${0.15 + Math.cos(time * 1.1) * 0.08})`)
      gradient1.addColorStop(1, `rgba(59, 130, 246, ${0.05 + Math.sin(time * 0.8) * 0.03})`)

      const gradient2 = ctx.createRadialGradient(
        width * (0.7 + Math.cos(time * 0.6) * 0.2),
        height * (0.6 + Math.sin(time * 0.4) * 0.1),
        0,
        width * 0.4,
        height * 0.4,
        Math.max(width, height) * 0.7
      )
      gradient2.addColorStop(0, `rgba(16, 185, 129, ${0.18 + Math.cos(time * 1.2) * 0.1})`)
      gradient2.addColorStop(0.5, `rgba(139, 92, 246, ${0.12 + Math.sin(time * 0.9) * 0.06})`)
      gradient2.addColorStop(1, `rgba(59, 130, 246, ${0.04 + Math.cos(time * 0.7) * 0.02})`)

      // Base gradient
      ctx.fillStyle = gradient1
      ctx.fillRect(0, 0, width, height)

      // Blend the second gradient
      ctx.globalCompositeOperation = 'screen'
      ctx.fillStyle = gradient2
      ctx.fillRect(0, 0, width, height)
      ctx.globalCompositeOperation = 'source-over'

      // Add noise texture
      ctx.fillStyle = `rgba(255, 255, 255, ${0.02 + Math.sin(time * 2) * 0.01})`
      for (let i = 0; i < width * height * 0.0001; i++) {
        const x = Math.random() * width
        const y = Math.random() * height
        ctx.fillRect(x, y, 1, 1)
      }

      // Quantum particle field system
      for (let i = 0; i < 45; i++) {
        const phase = time * 0.5 + i * 0.2
        const baseX = (Math.sin(phase * 0.8) * 0.4 + 0.5) * width
        const baseY = (Math.cos(phase * 0.6) * 0.4 + 0.5) * height

        // Create particle trails
        const trailLength = 5
        for (let t = 0; t < trailLength; t++) {
          const trailPhase = phase - t * 0.1
          const trailX = (Math.sin(trailPhase * 0.8) * 0.4 + 0.5) * width
          const trailY = (Math.cos(trailPhase * 0.6) * 0.4 + 0.5) * height
          const trailOpacity = (0.3 + Math.sin(time * 2 + i) * 0.2) * (1 - t / trailLength)
          const trailSize = (1 + Math.sin(time * 3 + i) * 0.8) * (1 - t / trailLength * 0.5)

          // Mouse interaction
          const dx = mousePosition.x - trailX
          const dy = mousePosition.y - trailY
          const distance = Math.sqrt(dx * dx + dy * dy)
          const influence = Math.max(0, 1 - distance / 120)

          const x = trailX + dx * influence * 0.2
          const y = trailY + dy * influence * 0.2

          // Quantum glow effect
          const colors = [
            `rgba(99, 102, 241, ${trailOpacity})`,
            `rgba(168, 85, 247, ${trailOpacity})`,
            `rgba(16, 185, 129, ${trailOpacity})`
          ]

          ctx.shadowColor = colors[i % 3]
          ctx.shadowBlur = 8 + influence * 12
          ctx.beginPath()
          ctx.arc(x, y, trailSize + influence * 2, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(255, 255, 255, ${trailOpacity + influence * 0.3})`
          ctx.fill()
          ctx.shadowBlur = 0

          // Energy connections between particles
          if (t === 0 && i % 4 === 0) {
            const nextI = (i + 4) % 45
            const nextPhase = time * 0.5 + nextI * 0.2
            const nextX = (Math.sin(nextPhase * 0.8) * 0.4 + 0.5) * width
            const nextY = (Math.cos(nextPhase * 0.6) * 0.4 + 0.5) * height

            const connectionDistance = Math.sqrt((nextX - x) ** 2 + (nextY - y) ** 2)
            if (connectionDistance < 200) {
              ctx.strokeStyle = `rgba(99, 102, 241, ${0.1 + Math.sin(time + i) * 0.05})`
              ctx.lineWidth = 1
              ctx.beginPath()
              ctx.moveTo(x, y)
              ctx.lineTo(nextX, nextY)
              ctx.stroke()
            }
          }
        }
      }

      // Neural synapse effect
      for (let i = 0; i < 12; i++) {
        const synapseX = width * (0.1 + (i % 4) * 0.25)
        const synapseY = height * (0.2 + Math.floor(i / 4) * 0.3)
        const pulse = Math.sin(time * 3 + i) * 0.5 + 0.5

        // Create expanding ring
        ctx.strokeStyle = `rgba(99, 102, 241, ${0.3 * pulse})`
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(synapseX, synapseY, 20 + pulse * 30, 0, Math.PI * 2)
        ctx.stroke()

        // Inner core
        ctx.fillStyle = `rgba(168, 85, 247, ${0.6 + pulse * 0.4})`
        ctx.beginPath()
        ctx.arc(synapseX, synapseY, 3 + pulse * 2, 0, Math.PI * 2)
        ctx.fill()
      }

      // Dynamic flowing energy waves
      ctx.strokeStyle = `rgba(255, 255, 255, 0.15)`
      for (let i = 0; i < 8; i++) {
        ctx.lineWidth = 0.5 + Math.sin(time + i) * 0.5
        ctx.beginPath()
        const amplitude = 40 + Math.sin(time * 0.5 + i) * 20
        const frequency = 0.008 + i * 0.002
        const speed = time * 150 + i * 100

        for (let x = 0; x <= width; x += 2) {
          const y = height * (0.2 + i * 0.1) + Math.sin((x + speed) * frequency) * amplitude
          if (x === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }
        ctx.stroke()
      }

      // Prismatic light beams
      for (let i = 0; i < 3; i++) {
        const beamGradient = ctx.createLinearGradient(
          width * (0.2 + i * 0.3), 0,
          width * (0.2 + i * 0.3), height
        )
        beamGradient.addColorStop(0, `rgba(99, 102, 241, ${0.03 + Math.sin(time + i) * 0.02})`)
        beamGradient.addColorStop(0.5, `rgba(168, 85, 247, ${0.05 + Math.cos(time * 1.1 + i) * 0.03})`)
        beamGradient.addColorStop(1, `rgba(59, 130, 246, ${0.02 + Math.sin(time * 0.9 + i) * 0.01})`)

        ctx.fillStyle = beamGradient
        const beamWidth = 60 + Math.sin(time + i) * 20
        const beamX = width * (0.2 + i * 0.3) - beamWidth / 2
        ctx.fillRect(beamX, 0, beamWidth, height)
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [mousePosition])

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (rect) {
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      })
    }
  }

  const features = [
    {
      icon: Sparkles,
      title: "AI-Native Discovery Engine",
      description: "Specialized questioning for LLM selection, prompt engineering, safety guardrails, and AI-specific requirements"
    },
    {
      icon: Shield,
      title: "AI Privacy & Safety First",
      description: "Built-in compliance for AI regulations, bias detection, and secure handling of AI training data"
    },
    {
      icon: Zap,
      title: "AI-Integrated Prototypes",
      description: "Generate working AI-powered prototypes with streaming responses, error handling, and fallback strategies"
    },
    {
      icon: GitBranch,
      title: "AI Model Versioning",
      description: "Track AI model changes, prompt iterations, and performance metrics through Git-native workflow"
    },
    {
      icon: Code2,
      title: "AI-Ready Production Code",
      description: "Export React components with pre-built AI integrations, API error handling, and streaming UI patterns"
    },
    {
      icon: FileText,
      title: "AI-Specific Quality Linting",
      description: "40+ AI-focused rules covering hallucination prevention, model specifications, data retention, and ethical AI practices"
    }
  ]

  const benefits = [
    "Reduce time from AI idea to prototype by 80%",
    "Ensure AI safety compliance with 40+ specialized rules",
    "Maintain complete AI model and prompt versioning through Git",
    "Built-in templates for LLM apps, AI agents, and RAG systems"
  ]

  return (
    <div className="h-full bg-white overflow-y-auto">
      {/* Hero Section with Advanced Shader Background */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          onMouseMove={handleMouseMove}
        />

        {/* SVG Neural Network Overlay */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" viewBox="0 0 1200 800">
          <defs>
            <linearGradient id="neuralGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.6"/>
              <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.4"/>
              <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.3"/>
            </linearGradient>

            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>

            <pattern id="circuit" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <path d="M10,10 L90,10 L90,50 L50,50 L50,90 L90,90" fill="none" stroke="url(#neuralGradient)" strokeWidth="0.5" opacity="0.3"/>
              <circle cx="10" cy="10" r="2" fill="#3B82F6" opacity="0.5"/>
              <circle cx="90" cy="50" r="1.5" fill="#8B5CF6" opacity="0.4"/>
              <circle cx="50" cy="90" r="1" fill="#06B6D4" opacity="0.3"/>
            </pattern>
          </defs>

          {/* Neural Network Nodes */}
          <g className="animate-pulse">
            {[...Array(12)].map((_, i) => (
              <circle
                key={i}
                cx={100 + (i % 4) * 300}
                cy={150 + Math.floor(i / 4) * 200}
                r={4 + Math.sin(Date.now() * 0.001 + i) * 2}
                fill="url(#neuralGradient)"
                filter="url(#glow)"
                opacity={0.7 + Math.sin(Date.now() * 0.002 + i) * 0.3}
              >
                <animate attributeName="r" values="2;8;2" dur={`${2 + i * 0.2}s`} repeatCount="indefinite"/>
              </circle>
            ))}
          </g>

          {/* Connecting Lines */}
          <g stroke="url(#neuralGradient)" strokeWidth="1" fill="none" opacity="0.4">
            <path d="M100,150 Q300,100 400,150" className="animate-pulse">
              <animate attributeName="stroke-dasharray" values="0,1000;1000,0" dur="3s" repeatCount="indefinite"/>
            </path>
            <path d="M400,150 Q600,200 700,150">
              <animate attributeName="stroke-dasharray" values="0,1000;1000,0" dur="3.5s" repeatCount="indefinite"/>
            </path>
            <path d="M700,150 Q900,100 1000,150">
              <animate attributeName="stroke-dasharray" values="0,1000;1000,0" dur="4s" repeatCount="indefinite"/>
            </path>
            <path d="M100,350 Q300,300 400,350">
              <animate attributeName="stroke-dasharray" values="0,1000;1000,0" dur="2.5s" repeatCount="indefinite"/>
            </path>
            <path d="M400,350 Q600,400 700,350">
              <animate attributeName="stroke-dasharray" values="0,1000;1000,0" dur="3.2s" repeatCount="indefinite"/>
            </path>
            <path d="M700,350 Q900,300 1000,350">
              <animate attributeName="stroke-dasharray" values="0,1000;1000,0" dur="4.2s" repeatCount="indefinite"/>
            </path>
            {/* Vertical connections */}
            <path d="M250,150 Q200,250 250,350">
              <animate attributeName="stroke-dasharray" values="1000,0;0,1000" dur="3.8s" repeatCount="indefinite"/>
            </path>
            <path d="M550,150 Q500,250 550,350">
              <animate attributeName="stroke-dasharray" values="1000,0;0,1000" dur="3.3s" repeatCount="indefinite"/>
            </path>
            <path d="M850,150 Q800,250 850,350">
              <animate attributeName="stroke-dasharray" values="1000,0;0,1000" dur="3.7s" repeatCount="indefinite"/>
            </path>
          </g>

          {/* Circuit Pattern Overlay */}
          <rect width="100%" height="100%" fill="url(#circuit)" opacity="0.1"/>

          {/* Data Flow Particles */}
          <g>
            {[...Array(8)].map((_, i) => (
              <circle key={i} r="2" fill="#3B82F6" opacity="0.8">
                <animateMotion dur={`${3 + i * 0.5}s`} repeatCount="indefinite">
                  <path d={`M${100 + i * 150},150 Q${300 + i * 100},${100 + i * 50} ${500 + i * 100},350`}/>
                </animateMotion>
                <animate attributeName="opacity" values="0;1;0" dur="1s" repeatCount="indefinite"/>
              </circle>
            ))}
          </g>

          {/* Floating Code Symbols */}
          <g fontSize="12" fill="url(#neuralGradient)" opacity="0.3" fontFamily="monospace">
            <text x="150" y="100">{'{ AI }'}</text>
            <text x="350" y="80">{'<PRD/>'}</text>
            <text x="650" y="120">{'()=>'}</text>
            <text x="950" y="90">{'[...]'}</text>
            <text x="200" y="450">{'async'}</text>
            <text x="500" y="480">{'await'}</text>
            <text x="800" y="460">{'gen()'}</text>

            {/* Animate the symbols */}
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0,0;0,-10;0,0"
              dur="3s"
              repeatCount="indefinite"
            />
          </g>
        </svg>

        <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
          <div className="mb-8 flex justify-center">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-gradient-to-br from-indigo-500 to-blue-600 shadow-2xl">
              <Bot className="w-10 h-10 text-white" />
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-slate-800 via-indigo-600 to-blue-600 bg-clip-text text-transparent mb-6">
            prd.dev
          </h1>

          <p className="text-xl md:text-2xl text-slate-600 mb-4 leading-relaxed">
            <span className="font-bold text-indigo-700">For AI-Native Product Builders</span>
            <br />
            Transform your AI product ideas into working prototypes through intelligent PRD creation.
          </p>

          <p className="text-lg text-slate-500 mb-8">
            <span className="font-semibold">Privacy-first. Git-native. AI-optimized.</span>
          </p>

          <div className="flex justify-center">
            <button
              onClick={onGetStarted}
              className="px-10 py-5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-2xl font-semibold text-xl hover:from-indigo-700 hover:to-blue-700 transition-all duration-200 shadow-xl hover:shadow-2xl hover:scale-105 flex items-center gap-3 group"
            >
              Start Building <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-slate-400 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-slate-400 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-slate-800 mb-16">
            From AI Product Idea to Prototype in Minutes
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">1. AI-Native Discovery</h3>
              <p className="text-slate-600">
                Our AI asks specialized questions about LLM selection, safety guardrails, prompt engineering, and AI-specific requirements to clarify your vision.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FileText className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">2. AI-Optimized PRD</h3>
              <p className="text-slate-600">
                Generate PRDs with 40+ AI-specific quality rules covering model specifications, bias mitigation, hallucination prevention, and privacy compliance.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Code2 className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">3. AI-Ready Prototype</h3>
              <p className="text-slate-600">
                Transform your AI product PRD into working prototypes with integrated AI capabilities, streaming responses, and error handling.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-slate-800 mb-16">
            Built for AI Product Teams
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="p-6 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-lg transition-all duration-200">
                <feature.icon className="w-8 h-8 text-indigo-600 mb-4" />
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy Focus */}
      <section className="py-20 px-6 bg-gradient-to-r from-slate-800 to-slate-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <Shield className="w-16 h-16 text-indigo-400 mx-auto mb-8" />
          <h2 className="text-4xl font-bold mb-8">Privacy by Design</h2>
          <p className="text-xl text-slate-300 mb-12 leading-relaxed">
            Your competitive AI ideas deserve protection. We built prd.dev
            with zero data retention - everything stays in your browser and your GitHub repositories.
            Bring your own API keys, own your data.
          </p>

          <div className="grid md:grid-cols-2 gap-8 text-left">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-indigo-400">What we never store:</h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  Your PRD content
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  API keys or credentials
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  Chat conversations
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  Generated prototypes
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-indigo-400">What you control:</h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  Local browser storage
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  Your GitHub repositories
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  Direct AI provider access
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  Complete data portability
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-slate-800 mb-16">
            Why AI Product Teams Choose prd.dev
          </h2>

          <div className="space-y-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-4 p-6 bg-white rounded-xl border border-slate-200">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-lg text-slate-700">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-8">Ready to Transform Your Product Process?</h2>
          <p className="text-xl mb-12 text-indigo-100">
            Join hundreds of AI product teams already shipping faster with specialized PRD tooling.
          </p>

          <button
            onClick={onGetStarted}
            className="px-12 py-4 bg-white text-indigo-600 rounded-xl font-semibold text-lg hover:bg-slate-50 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Start Your First PRD
          </button>
        </div>
      </section>
    </div>
  )
}