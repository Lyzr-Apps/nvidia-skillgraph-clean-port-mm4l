'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  HiOutlinePaperAirplane,
  HiOutlineAcademicCap,
  HiOutlineArrowTrendingUp,
  HiOutlineLink,
  HiOutlineBookOpen,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineArrowPath,
  HiOutlineXMark,
} from 'react-icons/hi2'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  sources?: string[]
  timestamp: Date
  skillUpdate?: {
    domain: string
    previous_score: number
    new_score: number
    reason: string
  } | null
  knowledgeContext?: Array<{ title: string; excerpt: string; url: string }>
}

interface SkillsData {
  overall_readiness: number
  domains: Record<string, number>
  strengths: string[]
  gaps: string[]
  recommended_focus: string[]
}

interface LearningInterfaceProps {
  messages: ChatMessage[]
  onSendMessage: (message: string) => void
  loading: boolean
  currentFocus: string
  skillsData: SkillsData | null
  error: string | null
  onEndSession: () => void
  onSwitchFocus: (focus: string) => void
}

const DOMAIN_OPTIONS = ['infrastructure', 'networking', 'storage', 'orchestration', 'gpu_management', 'security', 'mlops', 'monitoring']
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

export default function LearningInterface({ messages, onSendMessage, loading, currentFocus, skillsData, error, onEndSession, onSwitchFocus }: LearningInterfaceProps) {
  const [input, setInput] = useState('')
  const [showFocusSelector, setShowFocusSelector] = useState(false)
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

  const focusScore = skillsData?.domains?.[currentFocus] ?? 0
  const latestAssistantMsg = [...messages].reverse().find((m) => m.role === 'assistant')
  const knowledgeContext = Array.isArray(latestAssistantMsg?.knowledgeContext) ? latestAssistantMsg.knowledgeContext : []

  return (
    <div className="flex h-[calc(100vh-88px)] p-3 md:p-5 gap-4 animate-fadeIn">
      {/* Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Focus Banner */}
        <div className="mb-3">
          <div className="rounded-2xl border border-border/40 bg-card px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl gradient-teal flex items-center justify-center shadow-md">
                <HiOutlineAcademicCap className="w-4.5 h-4.5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[13px] font-medium text-foreground">
                    {DOMAIN_LABELS[currentFocus] ?? currentFocus}
                  </p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/15 text-accent font-medium">{focusScore}%</span>
                </div>
                <div className="w-full h-1 bg-secondary rounded-full mt-1.5 overflow-hidden">
                  <div className="h-full gradient-teal rounded-full transition-all duration-700 ease-out" style={{ width: `${focusScore}%` }} />
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => setShowFocusSelector(!showFocusSelector)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors" title="Switch focus">
                  <HiOutlineArrowPath className="w-4 h-4" />
                </button>
                <button onClick={onEndSession} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-secondary transition-colors" title="End session">
                  <HiOutlineXMark className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {showFocusSelector && (
            <div className="rounded-2xl border border-border/40 bg-card p-3 mt-2">
              <div className="flex flex-wrap gap-1.5">
                {DOMAIN_OPTIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => { onSwitchFocus(d); setShowFocusSelector(false) }}
                    className={cn(
                      'text-[11px] px-3 py-1.5 rounded-lg transition-all',
                      d === currentFocus
                        ? 'gradient-teal text-white font-medium'
                        : 'bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary'
                    )}
                  >
                    {DOMAIN_LABELS[d]} ({skillsData?.domains?.[d] ?? 0}%)
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 rounded-2xl border border-border/40 bg-card overflow-hidden flex flex-col">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <div className="w-16 h-16 rounded-2xl gradient-teal opacity-80 flex items-center justify-center mb-4 shadow-lg">
                  <HiOutlineBookOpen className="w-7 h-7 text-white" />
                </div>
                <p className="text-base font-semibold text-foreground">Adaptive Learning Session</p>
                <p className="text-[13px] text-muted-foreground mt-2 max-w-md leading-relaxed">
                  Ask a question about {DOMAIN_LABELS[currentFocus] ?? currentFocus} or describe what you want to learn. The AI will guide you through Socratic dialogue.
                </p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i}>
                <div className={cn('flex animate-fadeIn', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                  <div className={cn(
                    'max-w-[80%] rounded-2xl px-4 py-3',
                    msg.role === 'user'
                      ? 'gradient-teal text-white rounded-br-md'
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
                      <span className="text-[10px] text-muted-foreground">-- {msg.skillUpdate.reason}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-secondary/60 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-[hsl(193_43%_65%)]/60 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-[hsl(193_43%_65%)]/60 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                    <span className="w-2 h-2 bg-[hsl(193_43%_65%)]/60 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
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
                placeholder="Ask or respond to the learning dialogue..."
                disabled={loading}
                className="flex-1 bg-secondary/40 border border-border/50 rounded-xl px-4 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-[hsl(193_43%_65%)]/50 focus:border-[hsl(193_43%_65%)]/50 transition-all"
              />
              <Button onClick={handleSend} disabled={loading || !input.trim()} className="rounded-xl gradient-teal text-white border-0 px-4 hover:opacity-90 transition-opacity disabled:opacity-40">
                <HiOutlinePaperAirplane className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Knowledge Panel */}
      <div className="hidden lg:block w-64 flex-shrink-0">
        <div className="rounded-2xl border border-border/40 bg-card h-full flex flex-col">
          <div className="p-4 border-b border-border/30">
            <div className="flex items-center gap-2">
              <HiOutlineBookOpen className="w-4 h-4 text-[hsl(193_43%_65%)]" />
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Knowledge Context</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {knowledgeContext.length > 0 ? (
              <div className="space-y-4">
                {knowledgeContext.map((item, i) => (
                  <div key={i} className="space-y-1.5">
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-[12px] font-medium text-[hsl(193_43%_65%)] hover:underline flex items-start gap-1.5 leading-snug">
                      <HiOutlineLink className="w-3 h-3 flex-shrink-0 mt-0.5" />
                      <span>{item.title}</span>
                    </a>
                    <p className="text-[11px] text-muted-foreground leading-relaxed pl-4">{item.excerpt}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <HiOutlineBookOpen className="w-6 h-6 text-muted/40 mb-2" />
                <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
                  NVIDIA docs excerpts will appear here as you learn
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
