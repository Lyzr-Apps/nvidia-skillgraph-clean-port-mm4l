'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import {
  HiOutlinePaperAirplane,
  HiOutlineWrenchScrewdriver,
  HiOutlineCheckCircle,
  HiOutlineLink,
  HiOutlineArrowTrendingUp,
  HiOutlineExclamationTriangle,
  HiOutlineMagnifyingGlass,
  HiOutlineCog6Tooth,
  HiOutlineShieldCheck,
} from 'react-icons/hi2'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  sources?: string[]
  timestamp: Date
  diagnosticPhase?: string
  resolutionSteps?: Array<{
    step_number: number
    instruction: string
    explanation: string
    source_url: string
  }>
  skillUpdate?: {
    domain: string
    previous_score: number
    new_score: number
    reason: string
  } | null
}

interface ProblemSolvingInterfaceProps {
  messages: ChatMessage[]
  onSendMessage: (message: string) => void
  loading: boolean
  diagnosticPhase: string
  error: string | null
  onMarkResolved: () => void
}

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-1.5">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### '))
          return <h4 key={i} className="font-semibold text-sm mt-2 mb-1">{line.slice(4)}</h4>
        if (line.startsWith('## '))
          return <h3 key={i} className="font-semibold text-sm mt-2 mb-1">{line.slice(3)}</h3>
        if (line.startsWith('# '))
          return <h2 key={i} className="font-bold text-base mt-3 mb-1">{line.slice(2)}</h2>
        if (line.startsWith('- ') || line.startsWith('* '))
          return <li key={i} className="ml-4 list-disc text-xs">{formatInline(line.slice(2))}</li>
        if (/^\d+\.\s/.test(line))
          return <li key={i} className="ml-4 list-decimal text-xs">{formatInline(line.replace(/^\d+\.\s/, ''))}</li>
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i} className="text-xs">{formatInline(line)}</p>
      })}
    </div>
  )
}

function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part
  )
}

const PHASE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  gathering_info: { label: 'Gathering Info', icon: HiOutlineMagnifyingGlass, color: 'text-accent' },
  diagnosing: { label: 'Diagnosing', icon: HiOutlineExclamationTriangle, color: 'text-[hsl(14_51%_60%)]' },
  resolving: { label: 'Resolving', icon: HiOutlineCog6Tooth, color: 'text-[hsl(193_43%_65%)]' },
  resolved: { label: 'Resolved', icon: HiOutlineShieldCheck, color: 'text-[hsl(92_28%_60%)]' },
}

const PHASE_ORDER = ['gathering_info', 'diagnosing', 'resolving', 'resolved']

export default function ProblemSolvingInterface({
  messages,
  onSendMessage,
  loading,
  diagnosticPhase,
  error,
  onMarkResolved,
}: ProblemSolvingInterfaceProps) {
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  const handleSend = () => {
    const trimmed = input.trim()
    if (!trimmed || loading) return
    onSendMessage(trimmed)
    setInput('')
  }

  // Collect all resolution steps from all messages
  const allSteps: Array<{ step_number: number; instruction: string; explanation: string; source_url: string }> = []
  messages.forEach((msg) => {
    if (Array.isArray(msg.resolutionSteps)) {
      msg.resolutionSteps.forEach((step) => {
        if (!allSteps.some((s) => s.step_number === step.step_number)) {
          allSteps.push(step)
        }
      })
    }
  })
  allSteps.sort((a, b) => a.step_number - b.step_number)

  const currentPhaseIdx = PHASE_ORDER.indexOf(diagnosticPhase)

  return (
    <div className="flex h-[calc(100vh-88px)] p-2 md:p-4 gap-3">
      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Phase Indicator */}
        <div className="mb-2">
          <Card className="bg-card border-border">
            <CardContent className="py-2 px-3">
              <div className="flex items-center gap-1">
                {PHASE_ORDER.map((phase, i) => {
                  const config = PHASE_CONFIG[phase]
                  const Icon = config?.icon ?? HiOutlineMagnifyingGlass
                  const isActive = phase === diagnosticPhase
                  const isPast = i < currentPhaseIdx

                  return (
                    <React.Fragment key={phase}>
                      <div className={cn(
                        'flex items-center gap-1 px-2 py-1 rounded text-[10px] transition-colors',
                        isActive ? 'bg-secondary' : '',
                        isPast ? 'opacity-50' : ''
                      )}>
                        <Icon className={cn('w-3 h-3', isActive ? config?.color ?? 'text-accent' : 'text-muted-foreground')} />
                        <span className={cn(isActive ? 'text-foreground font-medium' : 'text-muted-foreground')}>
                          {config?.label ?? phase}
                        </span>
                        {isPast && <HiOutlineCheckCircle className="w-3 h-3 text-[hsl(92_28%_60%)]" />}
                      </div>
                      {i < PHASE_ORDER.length - 1 && (
                        <div className={cn('w-4 h-px', i < currentPhaseIdx ? 'bg-[hsl(92_28%_60%)]' : 'bg-border')} />
                      )}
                    </React.Fragment>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Messages */}
        <Card className="flex-1 bg-card border-border overflow-hidden flex flex-col">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-3">
                  <HiOutlineWrenchScrewdriver className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-foreground font-medium">Problem Solver</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  Describe your NVIDIA AI Factory deployment issue and we will walk through diagnostics together.
                </p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i}>
                <div className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                  <div className={cn(
                    'max-w-[85%] rounded-lg px-3 py-2',
                    msg.role === 'user'
                      ? 'bg-accent text-accent-foreground'
                      : 'bg-secondary text-foreground'
                  )}>
                    {msg.role === 'assistant' ? renderMarkdown(msg.content) : (
                      <p className="text-xs">{msg.content}</p>
                    )}
                  </div>
                </div>

                {/* Inline Skill Update */}
                {msg.skillUpdate && (
                  <div className="flex justify-start mt-1.5 ml-2">
                    <div className="bg-[hsl(92_28%_60%)]/10 border border-[hsl(92_28%_60%)]/20 rounded px-2 py-1 flex items-center gap-2">
                      <HiOutlineArrowTrendingUp className="w-3 h-3 text-[hsl(92_28%_60%)]" />
                      <span className="text-[10px] text-foreground">
                        <strong>{msg.skillUpdate.domain}</strong>: {msg.skillUpdate.previous_score}% → {msg.skillUpdate.new_score}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-secondary rounded-lg px-3 py-2">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                    <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="px-3 py-2 bg-destructive/10 border-t border-destructive/20">
              <p className="text-[11px] text-destructive">{error}</p>
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-border">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Describe your issue or answer diagnostic questions..."
                disabled={loading}
                className="bg-input border-border text-xs text-foreground placeholder:text-muted-foreground"
              />
              <Button
                size="sm"
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="bg-accent text-accent-foreground hover:bg-accent/80"
              >
                <HiOutlinePaperAirplane className="w-4 h-4" />
              </Button>
            </div>
            {diagnosticPhase === 'resolved' && (
              <Button
                size="sm"
                variant="outline"
                onClick={onMarkResolved}
                className="w-full mt-2 text-xs border-[hsl(92_28%_60%)] text-[hsl(92_28%_60%)] hover:bg-[hsl(92_28%_60%)]/10"
              >
                <HiOutlineCheckCircle className="w-3 h-3 mr-1" />
                Mark Issue as Resolved
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* Resolution Steps Panel */}
      <div className="hidden lg:block w-64 flex-shrink-0">
        <Card className="bg-card border-border h-full flex flex-col">
          <CardHeader className="pb-2 pt-3 px-3">
            <CardTitle className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider flex items-center gap-1">
              <HiOutlineCog6Tooth className="w-3 h-3" />
              Resolution Steps
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 flex-1 overflow-y-auto">
            {allSteps.length > 0 ? (
              <div className="space-y-3">
                {allSteps.map((step, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-accent">{step.step_number}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-foreground">{step.instruction}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{step.explanation}</p>
                        {step.source_url && (
                          <a
                            href={step.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-accent hover:underline flex items-center gap-0.5 mt-0.5"
                          >
                            <HiOutlineLink className="w-3 h-3" />
                            Source
                          </a>
                        )}
                      </div>
                    </div>
                    {i < allSteps.length - 1 && <Separator className="bg-border" />}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <HiOutlineCog6Tooth className="w-6 h-6 text-muted mb-2" />
                <p className="text-[11px] text-muted-foreground">
                  Resolution steps will appear here as the diagnosis progresses
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
