'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import {
  HiOutlinePaperAirplane,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineEllipsisHorizontal,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineLink,
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

const DOMAINS = [
  'infrastructure',
  'networking',
  'storage',
  'orchestration',
  'gpu_management',
  'security',
  'mlops',
  'monitoring',
]

const DOMAIN_LABELS: Record<string, string> = {
  infrastructure: 'Infrastructure',
  networking: 'Networking',
  storage: 'Storage',
  orchestration: 'Orchestration',
  gpu_management: 'GPU Management',
  security: 'Security',
  mlops: 'MLOps',
  monitoring: 'Monitoring',
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

function SourcesList({ sources }: { sources: string[] }) {
  const [expanded, setExpanded] = useState(false)
  if (!Array.isArray(sources) || sources.length === 0) return null

  return (
    <div className="mt-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
      >
        <HiOutlineLink className="w-3 h-3" />
        {sources.length} source{sources.length > 1 ? 's' : ''}
        {expanded ? <HiOutlineChevronUp className="w-3 h-3" /> : <HiOutlineChevronDown className="w-3 h-3" />}
      </button>
      {expanded && (
        <div className="mt-1 space-y-0.5">
          {sources.map((src, i) => (
            <a
              key={i}
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-[10px] text-accent hover:underline truncate"
            >
              {src}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AssessmentInterface({
  messages,
  onSendMessage,
  loading,
  assessmentComplete,
  skillsData,
  error,
}: AssessmentInterfaceProps) {
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

  const domainStatus = (domain: string): 'assessed' | 'in-progress' | 'pending' => {
    if (skillsData?.domains && typeof skillsData.domains[domain] === 'number' && skillsData.domains[domain] > 0) {
      return 'assessed'
    }
    if (messages.length > 0 && !assessmentComplete) return 'in-progress'
    return 'pending'
  }

  return (
    <div className="flex h-[calc(100vh-88px)] p-2 md:p-4 gap-3">
      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Skills Assessment</h2>
            <p className="text-[10px] text-muted-foreground">Socratic diagnostic conversation to evaluate your knowledge</p>
          </div>
          {assessmentComplete && (
            <Badge className="bg-[hsl(92_28%_60%)] text-[hsl(220_16%_13%)] text-[10px]">
              <HiOutlineCheckCircle className="w-3 h-3 mr-1" />
              Complete
            </Badge>
          )}
        </div>

        {/* Messages */}
        <Card className="flex-1 bg-card border-border overflow-hidden flex flex-col">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-3">
                  <HiOutlineEllipsisHorizontal className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-foreground font-medium">Ready to assess your skills</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  Type a greeting or describe your experience with NVIDIA AI Factory deployments to begin the assessment.
                </p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  'flex',
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[85%] rounded-lg px-3 py-2',
                    msg.role === 'user'
                      ? 'bg-accent text-accent-foreground'
                      : 'bg-secondary text-foreground'
                  )}
                >
                  {msg.role === 'assistant' ? renderMarkdown(msg.content) : (
                    <p className="text-xs">{msg.content}</p>
                  )}
                  {msg.role === 'assistant' && <SourcesList sources={msg.sources ?? []} />}
                </div>
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
                placeholder={assessmentComplete ? 'Assessment complete. View your results.' : 'Type your response...'}
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
          </div>
        </Card>
      </div>

      {/* Side Panel - Assessment Tracker */}
      <div className="hidden lg:block w-56 flex-shrink-0">
        <Card className="bg-card border-border h-full">
          <CardHeader className="pb-2 pt-3 px-3">
            <CardTitle className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider">
              Assessment Tracker
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="space-y-1.5">
              {DOMAINS.map((domain) => {
                const status = domainStatus(domain)
                const score = skillsData?.domains?.[domain]
                return (
                  <div key={domain} className="flex items-center gap-2">
                    <div className={cn(
                      'w-2 h-2 rounded-full flex-shrink-0',
                      status === 'assessed' ? 'bg-[hsl(92_28%_60%)]' : status === 'in-progress' ? 'bg-accent' : 'bg-muted'
                    )} />
                    <span className="text-[11px] text-foreground flex-1">{DOMAIN_LABELS[domain]}</span>
                    {typeof score === 'number' && score > 0 && (
                      <span className="text-[10px] font-mono text-muted-foreground">{score}%</span>
                    )}
                  </div>
                )
              })}
            </div>

            {assessmentComplete && skillsData && (
              <>
                <Separator className="my-3 bg-border" />
                <div className="space-y-2">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">{skillsData.overall_readiness ?? 0}%</p>
                    <p className="text-[10px] text-muted-foreground font-mono">Overall Readiness</p>
                  </div>
                  {Array.isArray(skillsData.gaps) && skillsData.gaps.length > 0 && (
                    <div>
                      <p className="text-[10px] text-muted-foreground font-mono uppercase mb-1">Gaps Found</p>
                      {skillsData.gaps.map((g, i) => (
                        <Badge key={i} variant="outline" className="text-[10px] mr-1 mb-1 border-[hsl(14_51%_60%)] text-[hsl(14_51%_60%)]">
                          {g}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
