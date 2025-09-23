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

      // Create dynamic gradient background with color shifting
      const gradient = ctx.createRadialGradient(
        width * (0.5 + Math.sin(time * 0.5) * 0.3),
        height * (0.5 + Math.cos(time * 0.3) * 0.2),
        0,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.8
      )
      gradient.addColorStop(0, `rgba(99, 102, 241, ${0.15 + Math.sin(time) * 0.1})`)
      gradient.addColorStop(0.3, `rgba(168, 85, 247, ${0.12 + Math.cos(time * 1.3) * 0.08})`)
      gradient.addColorStop(0.6, `rgba(59, 130, 246, ${0.08 + Math.sin(time * 0.7) * 0.05})`)
      gradient.addColorStop(1, `rgba(16, 185, 129, ${0.05 + Math.cos(time * 0.9) * 0.03})`)

      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, width, height)

      // Enhanced animated particles with trails
      for (let i = 0; i < 35; i++) {
        const baseX = (Math.sin(time * 0.8 + i * 0.3) * 0.5 + 0.5) * width
        const baseY = (Math.cos(time * 0.6 + i * 0.7) * 0.5 + 0.5) * height
        const size = 1.5 + Math.sin(time * 3 + i) * 1.5
        const opacity = 0.4 + Math.sin(time * 2 + i) * 0.3

        // Mouse interaction with stronger influence
        const dx = mousePosition.x - baseX
        const dy = mousePosition.y - baseY
        const distance = Math.sqrt(dx * dx + dy * dy)
        const influence = Math.max(0, 1 - distance / 150)

        const x = baseX + dx * influence * 0.3
        const y = baseY + dy * influence * 0.3

        // Draw particle with glow effect
        ctx.shadowColor = `rgba(99, 102, 241, ${opacity * 0.8})`
        ctx.shadowBlur = 10 + influence * 15
        ctx.beginPath()
        ctx.arc(x, y, size + influence * 3, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity + influence * 0.4})`
        ctx.fill()
        ctx.shadowBlur = 0

        // Add smaller accent particles
        if (i % 3 === 0) {
          ctx.beginPath()
          ctx.arc(x + Math.sin(time * 4 + i) * 8, y + Math.cos(time * 4 + i) * 8, 0.5, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(168, 85, 247, ${opacity * 0.6})`
          ctx.fill()
        }
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
      {/* Hero Section with Shader Background */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          onMouseMove={handleMouseMove}
        />

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