'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  HiOutlinePaperAirplane,
  HiOutlineCheckCircle,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineLink,
  HiOutlineSparkles,
} from 'react-icons/hi2'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  sources?: string[]
  timestamp: Date
}

interface SkillsData {
  overall_readiness: number
  domains: Record<string, number>
  strengths: string[]
  gaps: string[]
  recommended_focus: string[]
}

interface AssessmentInterfaceProps {
  messages: ChatMessage[]
  onSendMessage: (message: string) => void
  loading: boolean
  assessmentComplete: boolean
  skillsData: SkillsData | null
  error: string | null
}

const DOMAINS = ['infrastructure', 'networking', 'storage', 'orchestration', 'gpu_management', 'security', 'mlops', 'monitoring']
const DOMAIN_LABELS: Record<string, string> = {
  infrastructure: 'Infrastructure', networking: 'Networking', storage: 'Storage',
  orchestration: 'Orchestration', gpu_management: 'GPU Management', security: 'Security',
  mlops: 'MLOps', monitoring: 'Monitoring',
}
const DOMAIN_COLORS: Record<string, string> = {
  infrastructure: 'hsl(213 32% 60%)', networking: 'hsl(193 43% 65%)', storage: 'hsl(92 28% 60%)',
  orchestration: 'hsl(311 20% 60%)', gpu_management: 'hsl(14 51% 60%)', security: 'hsl(213 32% 52%)',
  mlops: 'hsl(193 43% 65%)', monitoring: 'hsl(92 28% 60%)',
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
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="font-semibold text-foreground">{part}</strong> : part
  )
}

function SourcesList({ sources }: { sources: string[] }) {
  const [expanded, setExpanded] = useState(false)
  if (!Array.isArray(sources) || sources.length === 0) return null
  return (
    <div className="mt-2.5 pt-2 border-t border-white/5">
      <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-accent transition-colors">
        <HiOutlineLink className="w-3 h-3" />
        <span>{sources.length} source{sources.length > 1 ? 's' : ''}</span>
        {expanded ? <HiOutlineChevronUp className="w-3 h-3" /> : <HiOutlineChevronDown className="w-3 h-3" />}
      </button>
      {expanded && (
        <div className="mt-1.5 space-y-1">
          {sources.map((src, i) => (
            <a key={i} href={src} target="_blank" rel="noopener noreferrer" className="block text-[10px] text-accent/70 hover:text-accent truncate transition-colors">{src}</a>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AssessmentInterface({ messages, onSendMessage, loading, assessmentComplete, skillsData, error }: AssessmentInterfaceProps) {
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

  const domainStatus = (domain: string): 'assessed' | 'in-progress' | 'pending' => {
    if (skillsData?.domains && typeof skillsData.domains[domain] === 'number' && skillsData.domains[domain] > 0) return 'assessed'
    if (messages.length > 0 && !assessmentComplete) return 'in-progress'
    return 'pending'
  }

  return (
    <div className="flex h-[calc(100vh-88px)] p-3 md:p-5 gap-4 animate-fadeIn">
      {/* Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg gradient-purple flex items-center justify-center">
              <HiOutlineSparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Skills Assessment</h2>
              <p className="text-[10px] text-muted-foreground">Socratic diagnostic evaluation</p>
            </div>
          </div>
          {assessmentComplete && (
            <span className="text-[10px] px-3 py-1 rounded-full bg-[hsl(92_28%_60%)]/15 text-[hsl(92_28%_60%)] font-medium flex items-center gap-1">
              <HiOutlineCheckCircle className="w-3 h-3" /> Complete
            </span>
          )}
        </div>

        <div className="flex-1 rounded-2xl border border-border/40 bg-card overflow-hidden flex flex-col">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <div className="w-16 h-16 rounded-2xl gradient-purple opacity-80 flex items-center justify-center mb-4 shadow-lg">
                  <HiOutlineSparkles className="w-7 h-7 text-white" />
                </div>
                <p className="text-base font-semibold text-foreground">Ready to assess your skills</p>
                <p className="text-[13px] text-muted-foreground mt-2 max-w-md leading-relaxed">
                  Describe your experience with NVIDIA AI Factory deployments, or simply say hello to begin. The assessment covers 8 competency domains.
                </p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={cn('flex animate-fadeIn', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={cn(
                  'max-w-[80%] rounded-2xl px-4 py-3',
                  msg.role === 'user'
                    ? 'gradient-blue text-white rounded-br-md'
                    : 'bg-secondary/60 text-foreground rounded-bl-md'
                )}>
                  {msg.role === 'assistant' ? renderMarkdown(msg.content) : (
                    <p className="text-[13px] leading-relaxed">{msg.content}</p>
                  )}
                  {msg.role === 'assistant' && <SourcesList sources={msg.sources ?? []} />}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-secondary/60 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-accent/60 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-accent/60 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                    <span className="w-2 h-2 bg-accent/60 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
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
                placeholder={assessmentComplete ? 'Assessment complete' : 'Type your response...'}
                disabled={loading}
                className="flex-1 bg-secondary/40 border border-border/50 rounded-xl px-4 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent/50 transition-all"
              />
              <Button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="rounded-xl gradient-blue text-white border-0 px-4 hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                <HiOutlinePaperAirplane className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Side Panel */}
      <div className="hidden lg:block w-60 flex-shrink-0">
        <div className="rounded-2xl border border-border/40 bg-card p-4 h-full">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-4">Assessment Tracker</p>
          <div className="space-y-2">
            {DOMAINS.map((domain) => {
              const status = domainStatus(domain)
              const score = skillsData?.domains?.[domain]
              const color = DOMAIN_COLORS[domain] ?? 'hsl(213 32% 60%)'
              return (
                <div key={domain} className="flex items-center gap-2.5 py-1">
                  <div className={cn(
                    'w-2 h-2 rounded-full flex-shrink-0 transition-all',
                    status === 'assessed' ? '' : status === 'in-progress' ? 'animate-pulse' : 'opacity-30'
                  )} style={{ backgroundColor: status === 'assessed' ? color : status === 'in-progress' ? color : 'hsl(220 16% 30%)' }} />
                  <span className={cn('text-[11px] flex-1', status === 'pending' ? 'text-muted-foreground/50' : 'text-foreground/80')}>{DOMAIN_LABELS[domain]}</span>
                  {typeof score === 'number' && score > 0 && (
                    <span className="text-[10px] font-semibold" style={{ color }}>{score}%</span>
                  )}
                </div>
              )
            })}
          </div>

          {assessmentComplete && skillsData && (
            <div className="mt-6 pt-4 border-t border-border/40">
              <div className="text-center mb-3">
                <p className="text-2xl font-bold text-foreground">{skillsData.overall_readiness ?? 0}%</p>
                <p className="text-[10px] text-muted-foreground">Overall Readiness</p>
              </div>
              {Array.isArray(skillsData.gaps) && skillsData.gaps.length > 0 && (
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Focus Areas</p>
                  <div className="space-y-1">
                    {skillsData.gaps.map((g, i) => (
                      <p key={i} className="text-[10px] text-[hsl(14_51%_60%)] leading-relaxed">{g}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
