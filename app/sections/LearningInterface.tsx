'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
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
  knowledgeContext?: Array<{
    title: string
    excerpt: string
    url: string
  }>
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

const DOMAIN_OPTIONS = [
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

export default function LearningInterface({
  messages,
  onSendMessage,
  loading,
  currentFocus,
  skillsData,
  error,
  onEndSession,
  onSwitchFocus,
}: LearningInterfaceProps) {
  const [input, setInput] = useState('')
  const [showFocusSelector, setShowFocusSelector] = useState(false)
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

  const focusScore = skillsData?.domains?.[currentFocus] ?? 0

  // Get latest knowledge context from most recent assistant message
  const latestAssistantMsg = [...messages].reverse().find((m) => m.role === 'assistant')
  const knowledgeContext = Array.isArray(latestAssistantMsg?.knowledgeContext)
    ? latestAssistantMsg.knowledgeContext
    : []

  return (
    <div className="flex h-[calc(100vh-88px)] p-2 md:p-4 gap-3">
      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Focus Banner */}
        <div className="mb-2">
          <Card className="bg-card border-border">
            <CardContent className="py-2 px-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-accent/20 flex items-center justify-center flex-shrink-0">
                <HiOutlineAcademicCap className="w-4 h-4 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-medium text-foreground">
                    Focus: {DOMAIN_LABELS[currentFocus] ?? currentFocus}
                  </p>
                  <Badge variant="outline" className="text-[10px]">{focusScore}%</Badge>
                </div>
                <Progress value={focusScore} className="h-1 mt-1" />
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowFocusSelector(!showFocusSelector)}
                  className="text-[10px] h-7 px-2"
                >
                  <HiOutlineArrowPath className="w-3 h-3 mr-1" />
                  Switch
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onEndSession}
                  className="text-[10px] h-7 px-2 text-muted-foreground"
                >
                  End
                </Button>
              </div>
            </CardContent>
          </Card>

          {showFocusSelector && (
            <Card className="bg-card border-border mt-1">
              <CardContent className="py-2 px-3">
                <div className="flex flex-wrap gap-1">
                  {DOMAIN_OPTIONS.map((d) => (
                    <Badge
                      key={d}
                      variant={d === currentFocus ? 'default' : 'outline'}
                      className={cn(
                        'text-[10px] cursor-pointer transition-colors',
                        d === currentFocus ? 'bg-accent text-accent-foreground' : 'hover:bg-secondary'
                      )}
                      onClick={() => {
                        onSwitchFocus(d)
                        setShowFocusSelector(false)
                      }}
                    >
                      {DOMAIN_LABELS[d]} ({skillsData?.domains?.[d] ?? 0}%)
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Messages */}
        <Card className="flex-1 bg-card border-border overflow-hidden flex flex-col">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-3">
                  <HiOutlineBookOpen className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-foreground font-medium">Adaptive Learning Session</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  Ask a question about {DOMAIN_LABELS[currentFocus] ?? currentFocus} or describe what you would like to learn.
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

                {/* Inline Skill Update Notification */}
                {msg.skillUpdate && (
                  <div className="flex justify-start mt-1.5 ml-2">
                    <div className="bg-[hsl(92_28%_60%)]/10 border border-[hsl(92_28%_60%)]/20 rounded px-2 py-1 flex items-center gap-2">
                      <HiOutlineArrowTrendingUp className="w-3 h-3 text-[hsl(92_28%_60%)]" />
                      <span className="text-[10px] text-foreground">
                        <strong>{msg.skillUpdate.domain}</strong>: {msg.skillUpdate.previous_score}% → {msg.skillUpdate.new_score}%
                      </span>
                      <span className="text-[10px] text-muted-foreground">— {msg.skillUpdate.reason}</span>
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
                placeholder="Ask or respond to the learning dialogue..."
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

      {/* Knowledge Context Panel */}
      <div className="hidden lg:block w-64 flex-shrink-0">
        <Card className="bg-card border-border h-full flex flex-col">
          <CardHeader className="pb-2 pt-3 px-3">
            <CardTitle className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider flex items-center gap-1">
              <HiOutlineBookOpen className="w-3 h-3" />
              Knowledge Context
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 flex-1 overflow-y-auto">
            {knowledgeContext.length > 0 ? (
              <div className="space-y-3">
                {knowledgeContext.map((item, i) => (
                  <div key={i} className="space-y-1">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-accent hover:underline flex items-center gap-1"
                    >
                      <HiOutlineLink className="w-3 h-3 flex-shrink-0" />
                      {item.title}
                    </a>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {item.excerpt}
                    </p>
                    {i < knowledgeContext.length - 1 && <Separator className="bg-border" />}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <HiOutlineBookOpen className="w-6 h-6 text-muted mb-2" />
                <p className="text-[11px] text-muted-foreground">
                  Knowledge excerpts from nvidia.com will appear here as you learn
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
