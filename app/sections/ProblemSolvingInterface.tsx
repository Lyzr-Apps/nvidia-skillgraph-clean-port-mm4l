'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  HiOutlinePaperAirplane,
  HiOutlineWrenchScrewdriver,
  HiOutlineCheckCircle,
  HiOutlineLink,
  HiOutlineArrowTrendingUp,
  HiOutlineMagnifyingGlass,
  HiOutlineCog6Tooth,
  HiOutlineShieldCheck,
  HiOutlineExclamationTriangle,
} from 'react-icons/hi2'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  sources?: string[]
  timestamp: Date
  diagnosticPhase?: string
  resolutionSteps?: Array<{ step_number: number; instruction: string; explanation: string; source_url: string }>
  skillUpdate?: { domain: string; previous_score: number; new_score: number; reason: string } | null
}

interface ProblemSolvingInterfaceProps {
  messages: ChatMessage[]
  onSendMessage: (message: string) => void
  loading: boolean
  diagnosticPhase: string
  error: string | null
  onMarkResolved: () => void
}

const DOMAIN_LABELS: Record<string, string> = {
  infrastructure: 'Infrastructure', networking: 'Networking', storage: 'Storage',
  orchestration: 'Orchestration', gpu_management: 'GPU Management', security: 'Security',
  mlops: 'MLOps', monitoring: 'Monitoring',
}

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-2">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### ')) return <h4 key={i} className="font-semibold text-[13px] mt-3 mb-1 text-foreground">{line.slice(4)}</h4>
        if (line.startsWith('## ')) return <h3 key={i} className="font-semibold text-sm mt-3 mb-1 text-foreground">{line.slice(3)}</h3>
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 list-disc text-[13px] leading-relaxed">{formatInline(line.slice(2))}</li>
        if (/^\d+\.\s/.test(line)) return <li key={i} className="ml-4 list-decimal text-[13px] leading-relaxed">{formatInline(line.replace(/^\d+\.\s/, ''))}</li>
        if (!line.trim()) return <div key={i} className="h-1.5" />
        return <p key={i} className="text-[13px] leading-relaxed">{formatInline(line)}</p>
      })}
    </div>
  )
}

function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="font-semibold text-foreground">{part}</strong> : part)
}

const PHASE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; gradient: string }> = {
  gathering_info: { label: 'Gathering', icon: HiOutlineMagnifyingGlass, color: 'text-accent', gradient: 'gradient-blue' },
  diagnosing: { label: 'Diagnosing', icon: HiOutlineExclamationTriangle, color: 'text-[hsl(14_51%_60%)]', gradient: 'gradient-orange' },
  resolving: { label: 'Resolving', icon: HiOutlineCog6Tooth, color: 'text-[hsl(193_43%_65%)]', gradient: 'gradient-teal' },
  resolved: { label: 'Resolved', icon: HiOutlineShieldCheck, color: 'text-[hsl(92_28%_60%)]', gradient: 'gradient-green' },
}
const PHASE_ORDER = ['gathering_info', 'diagnosing', 'resolving', 'resolved']

export default function ProblemSolvingInterface({ messages, onSendMessage, loading, diagnosticPhase, error, onMarkResolved }: ProblemSolvingInterfaceProps) {
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, loading])

  const handleSend = () => {
    const trimmed = input.trim()
    if (!trimmed || loading) return
    onSendMessage(trimmed)
    setInput('')
  }

  const allSteps: Array<{ step_number: number; instruction: string; explanation: string; source_url: string }> = []
  messages.forEach((msg) => {
    if (Array.isArray(msg.resolutionSteps)) {
      msg.resolutionSteps.forEach((step) => {
        if (!allSteps.some((s) => s.step_number === step.step_number)) allSteps.push(step)
      })
    }
  })
  allSteps.sort((a, b) => a.step_number - b.step_number)

  const currentPhaseIdx = PHASE_ORDER.indexOf(diagnosticPhase)

  return (
    <div className="flex h-[calc(100vh-88px)] p-3 md:p-5 gap-4 animate-fadeIn">
      {/* Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Phase Indicator */}
        <div className="mb-3">
          <div className="rounded-2xl border border-border/40 bg-card px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-orange flex items-center justify-center shadow-md">
                <HiOutlineWrenchScrewdriver className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 flex items-center gap-1 overflow-x-auto">
                {PHASE_ORDER.map((phase, i) => {
                  const config = PHASE_CONFIG[phase]
                  const Icon = config?.icon ?? HiOutlineMagnifyingGlass
                  const isActive = phase === diagnosticPhase
                  const isPast = i < currentPhaseIdx

                  return (
                    <React.Fragment key={phase}>
                      <div className={cn(
                        'flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] transition-all whitespace-nowrap',
                        isActive ? 'bg-secondary font-medium' : '',
                      )}>
                        <Icon className={cn('w-3 h-3', isActive ? (config?.color ?? 'text-accent') : isPast ? 'text-[hsl(92_28%_60%)]' : 'text-muted-foreground/40')} />
                        <span className={cn(isActive ? 'text-foreground' : isPast ? 'text-muted-foreground' : 'text-muted-foreground/40')}>
                          {config?.label ?? phase}
                        </span>
                        {isPast && <HiOutlineCheckCircle className="w-2.5 h-2.5 text-[hsl(92_28%_60%)]" />}
                      </div>
                      {i < PHASE_ORDER.length - 1 && (
                        <div className={cn('w-6 h-px flex-shrink-0', i < currentPhaseIdx ? 'bg-[hsl(92_28%_60%)]' : 'bg-border/40')} />
                      )}
                    </React.Fragment>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 rounded-2xl border border-border/40 bg-card overflow-hidden flex flex-col">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <div className="w-16 h-16 rounded-2xl gradient-orange opacity-80 flex items-center justify-center mb-4 shadow-lg">
                  <HiOutlineWrenchScrewdriver className="w-7 h-7 text-white" />
                </div>
                <p className="text-base font-semibold text-foreground">Problem Solver</p>
                <p className="text-[13px] text-muted-foreground mt-2 max-w-md leading-relaxed">
                  Describe your NVIDIA AI Factory deployment issue. The AI will guide you through diagnostics and resolution using Socratic questioning.
                </p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i}>
                <div className={cn('flex animate-fadeIn', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                  <div className={cn(
                    'max-w-[80%] rounded-2xl px-4 py-3',
                    msg.role === 'user'
                      ? 'gradient-orange text-white rounded-br-md'
                      : 'bg-secondary/60 text-foreground rounded-bl-md'
                  )}>
                    {msg.role === 'assistant' ? renderMarkdown(msg.content) : (
                      <p className="text-[13px] leading-relaxed">{msg.content}</p>
                    )}
                  </div>
                </div>

                {msg.skillUpdate && (
                  <div className="flex justify-start mt-2 ml-1 animate-fadeIn">
                    <div className="bg-[hsl(92_28%_60%)]/10 border border-[hsl(92_28%_60%)]/20 rounded-xl px-3 py-1.5 flex items-center gap-2">
                      <HiOutlineArrowTrendingUp className="w-3.5 h-3.5 text-[hsl(92_28%_60%)]" />
                      <span className="text-[11px] text-foreground">
                        <strong>{DOMAIN_LABELS[msg.skillUpdate.domain] ?? msg.skillUpdate.domain}</strong>: {msg.skillUpdate.previous_score}% → {msg.skillUpdate.new_score}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-secondary/60 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-[hsl(14_51%_60%)]/60 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-[hsl(14_51%_60%)]/60 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                    <span className="w-2 h-2 bg-[hsl(14_51%_60%)]/60 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="px-4 py-2.5 bg-destructive/10 border-t border-destructive/20">
              <p className="text-[12px] text-destructive">{error}</p>
            </div>
          )}

          <div className="p-3 border-t border-border/40">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Describe your issue or answer diagnostic questions..."
                disabled={loading}
                className="flex-1 bg-secondary/40 border border-border/50 rounded-xl px-4 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-[hsl(14_51%_60%)]/50 focus:border-[hsl(14_51%_60%)]/50 transition-all"
              />
              <Button onClick={handleSend} disabled={loading || !input.trim()} className="rounded-xl gradient-orange text-white border-0 px-4 hover:opacity-90 transition-opacity disabled:opacity-40">
                <HiOutlinePaperAirplane className="w-4 h-4" />
              </Button>
            </div>
            {diagnosticPhase === 'resolved' && (
              <button onClick={onMarkResolved} className="w-full mt-2 py-2 rounded-xl border border-[hsl(92_28%_60%)]/30 text-[hsl(92_28%_60%)] text-[12px] font-medium hover:bg-[hsl(92_28%_60%)]/10 transition-colors flex items-center justify-center gap-1.5">
                <HiOutlineCheckCircle className="w-3.5 h-3.5" /> Mark Issue as Resolved
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Resolution Steps */}
      <div className="hidden lg:block w-64 flex-shrink-0">
        <div className="rounded-2xl border border-border/40 bg-card h-full flex flex-col">
          <div className="p-4 border-b border-border/30">
            <div className="flex items-center gap-2">
              <HiOutlineCog6Tooth className="w-4 h-4 text-[hsl(14_51%_60%)]" />
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Resolution Steps</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {allSteps.length > 0 ? (
              <div className="space-y-4">
                {allSteps.map((step, i) => (
                  <div key={i} className="animate-fadeIn">
                    <div className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-lg gradient-orange flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                        <span className="text-[10px] font-bold text-white">{step.step_number}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] font-medium text-foreground leading-snug">{step.instruction}</p>
                        <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{step.explanation}</p>
                        {step.source_url && (
                          <a href={step.source_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-accent/70 hover:text-accent flex items-center gap-1 mt-1 transition-colors">
                            <HiOutlineLink className="w-3 h-3" /> Source
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <HiOutlineCog6Tooth className="w-6 h-6 text-muted/40 mb-2" />
                <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
                  Steps will appear as the diagnosis progresses
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
