'use client'

import React, { useState, useCallback } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import type { AIAgentResponse } from '@/lib/aiAgent'
import parseLLMJson from '@/lib/jsonParser'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

import Sidebar from './sections/Sidebar'
import Dashboard from './sections/Dashboard'
import AssessmentInterface from './sections/AssessmentInterface'
import LearningInterface from './sections/LearningInterface'
import ProblemSolvingInterface from './sections/ProblemSolvingInterface'
import SkillsGraph from './sections/SkillsGraph'

// --- Agent IDs ---
const SKILLS_ASSESSMENT_AGENT = '69a24546f89af5d059caa2c0'
const ADAPTIVE_LEARNING_AGENT = '69a24547f89af5d059caa2c2'
const PROBLEM_SOLVING_AGENT = '69a24547f89af5d059caa2c4'

// --- Types ---
type ViewType = 'dashboard' | 'assessment' | 'learning' | 'problem-solving' | 'skills-graph'

interface SkillsData {
  overall_readiness: number
  domains: Record<string, number>
  strengths: string[]
  gaps: string[]
  recommended_focus: string[]
}

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
  diagnosticPhase?: string
  resolutionSteps?: Array<{
    step_number: number
    instruction: string
    explanation: string
    source_url: string
  }>
}

interface ActivityEntry {
  id: string
  type: 'assessment' | 'learning' | 'problem-solving'
  summary: string
  skillImpact?: { domain: string; change: number }
  timestamp: Date
}

// --- Helpers ---
const generateSessionId = () => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

function parseAgentResponse(result: AIAgentResponse) {
  if (!result.success) {
    return { error: result.error || 'Agent request failed', data: null }
  }

  let data = result?.response?.result
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data)
    } catch {
      data = parseLLMJson(data)
    }
  }
  if (data?.result && typeof data.result === 'object' && !Array.isArray(data.result)) {
    data = data.result
  }

  return { data, error: null }
}

// --- Sample Data ---
const SAMPLE_SKILLS: SkillsData = {
  overall_readiness: 58,
  domains: {
    infrastructure: 72,
    networking: 45,
    storage: 55,
    orchestration: 68,
    gpu_management: 40,
    security: 62,
    mlops: 50,
    monitoring: 70,
  },
  strengths: [
    'Strong understanding of DGX system architecture',
    'Good grasp of Kubernetes orchestration concepts',
    'Solid monitoring and observability knowledge',
  ],
  gaps: [
    'GPU management and multi-instance GPU partitioning',
    'InfiniBand networking and RDMA configuration',
    'MLOps pipeline design and model registry',
  ],
  recommended_focus: ['gpu_management', 'networking', 'mlops'],
}

const SAMPLE_ACTIVITY: ActivityEntry[] = [
  { id: '1', type: 'assessment', summary: 'Completed infrastructure domain assessment', skillImpact: { domain: 'infrastructure', change: 12 }, timestamp: new Date(Date.now() - 3600000) },
  { id: '2', type: 'learning', summary: 'Studied GPU management concepts via Socratic dialogue', skillImpact: { domain: 'gpu_management', change: 5 }, timestamp: new Date(Date.now() - 7200000) },
  { id: '3', type: 'problem-solving', summary: 'Resolved InfiniBand link flapping issue', skillImpact: { domain: 'networking', change: 8 }, timestamp: new Date(Date.now() - 10800000) },
  { id: '4', type: 'assessment', summary: 'Started security domain evaluation', timestamp: new Date(Date.now() - 14400000) },
  { id: '5', type: 'learning', summary: 'Explored storage architecture with GPUDirect', skillImpact: { domain: 'storage', change: 3 }, timestamp: new Date(Date.now() - 18000000) },
]

const SAMPLE_ASSESSMENT_MESSAGES: ChatMessage[] = [
  { role: 'assistant', content: "Welcome to the NVIDIA AI Factory Deployment Skills Assessment. I'll evaluate your knowledge across 8 key domains through a series of diagnostic questions.\n\nLet's start with **infrastructure**. Can you describe the main components of an NVIDIA DGX system and how they differ from standard GPU servers?", sources: ['https://docs.nvidia.com/dgx/'], timestamp: new Date(Date.now() - 60000) },
  { role: 'user', content: 'A DGX system includes multiple A100 or H100 GPUs with NVLink interconnects, high-speed networking, and optimized software stack. They differ from standard servers by having purpose-built GPU-to-GPU communication and dedicated storage interfaces.', timestamp: new Date(Date.now() - 50000) },
  { role: 'assistant', content: "Good understanding of the hardware fundamentals. You've identified the key differentiators.\n\nNow let's explore **networking**. How does InfiniBand compare to Ethernet in the context of AI training workloads, and what role does RDMA play?", sources: ['https://docs.nvidia.com/networking/'], timestamp: new Date(Date.now() - 40000) },
]

const SAMPLE_LEARNING_MESSAGES: ChatMessage[] = [
  {
    role: 'assistant',
    content: "Let's dive into **GPU Management**, your highest-priority gap area.\n\nMulti-Instance GPU (MIG) is a key feature for maximizing GPU utilization. Before I explain it, let me ask: **What do you think happens when you have a workload that only needs a fraction of a GPU's compute capacity?**",
    knowledgeContext: [
      { title: 'NVIDIA Multi-Instance GPU', excerpt: 'MIG allows each A100 GPU to be partitioned into up to seven independent GPU instances, each with their own high-bandwidth memory, cache, and compute cores.', url: 'https://docs.nvidia.com/datacenter/tesla/mig-user-guide/' },
    ],
    sources: ['https://docs.nvidia.com/datacenter/tesla/mig-user-guide/'],
    timestamp: new Date(Date.now() - 30000),
  },
  { role: 'user', content: 'I assume the rest of the GPU capacity goes unused, which is wasteful. Is MIG the solution for partitioning?', timestamp: new Date(Date.now() - 20000) },
  {
    role: 'assistant',
    content: "Exactly right! Without MIG, underutilized GPUs waste expensive resources.\n\n**MIG partitions a single GPU into isolated instances**, each with guaranteed resources. Think of it like creating virtual GPUs, but with hardware-level isolation.\n\n**Key question:** Why do you think hardware-level isolation matters more than software-level virtualization for AI workloads?",
    skillUpdate: { domain: 'gpu_management', previous_score: 40, new_score: 45, reason: 'Demonstrated understanding of GPU utilization challenges' },
    knowledgeContext: [
      { title: 'MIG Architecture', excerpt: 'Each MIG instance has dedicated streaming multiprocessors, memory bandwidth, and L2 cache, providing consistent and predictable performance.', url: 'https://docs.nvidia.com/datacenter/tesla/mig-user-guide/' },
    ],
    sources: ['https://docs.nvidia.com/datacenter/tesla/mig-user-guide/'],
    timestamp: new Date(Date.now() - 10000),
  },
]

// --- ErrorBoundary ---
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md rounded-2xl border border-border/40 bg-card">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: '' })}
              className="px-5 py-2.5 gradient-blue text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// --- Main Page ---
export default function Page() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard')
  const [mobileOpen, setMobileOpen] = useState(false)

  const [skillsData, setSkillsData] = useState<SkillsData | null>(null)

  const [assessmentMessages, setAssessmentMessages] = useState<ChatMessage[]>([])
  const [learningMessages, setLearningMessages] = useState<ChatMessage[]>([])
  const [problemMessages, setProblemMessages] = useState<ChatMessage[]>([])

  const [activityLog, setActivityLog] = useState<ActivityEntry[]>([])

  const [assessmentLoading, setAssessmentLoading] = useState(false)
  const [learningLoading, setLearningLoading] = useState(false)
  const [problemLoading, setProblemLoading] = useState(false)
  const [assessmentError, setAssessmentError] = useState<string | null>(null)
  const [learningError, setLearningError] = useState<string | null>(null)
  const [problemError, setProblemError] = useState<string | null>(null)

  const [assessmentComplete, setAssessmentComplete] = useState(false)
  const [assessmentStarted, setAssessmentStarted] = useState(false)

  const [currentFocus, setCurrentFocus] = useState('infrastructure')
  const [diagnosticPhase, setDiagnosticPhase] = useState('gathering_info')

  const [sessionIds, setSessionIds] = useState<Record<string, string>>({})

  const [showSample, setShowSample] = useState(false)

  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)

  const getSessionId = useCallback(
    (agentKey: string) => {
      if (sessionIds[agentKey]) return sessionIds[agentKey]
      const newId = generateSessionId()
      setSessionIds((prev) => ({ ...prev, [agentKey]: newId }))
      return newId
    },
    [sessionIds]
  )

  const addActivity = useCallback(
    (type: ActivityEntry['type'], summary: string, skillImpact?: ActivityEntry['skillImpact']) => {
      const entry: ActivityEntry = {
        id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        type,
        summary,
        skillImpact,
        timestamp: new Date(),
      }
      setActivityLog((prev) => [entry, ...prev])
    },
    []
  )

  const applySkillUpdate = useCallback(
    (update: { domain: string; previous_score: number; new_score: number; reason: string }) => {
      setSkillsData((prev) => {
        if (!prev) return prev
        const newDomains = { ...prev.domains, [update.domain]: update.new_score }
        const scores = Object.values(newDomains).filter((v) => typeof v === 'number') as number[]
        const overall = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
        return { ...prev, domains: newDomains, overall_readiness: overall }
      })
    },
    []
  )

  // --- Assessment handler ---
  const handleAssessmentMessage = useCallback(
    async (message: string) => {
      setAssessmentStarted(true)
      setAssessmentError(null)
      const userMsg: ChatMessage = { role: 'user', content: message, timestamp: new Date() }
      setAssessmentMessages((prev) => [...prev, userMsg])
      setAssessmentLoading(true)
      setActiveAgentId(SKILLS_ASSESSMENT_AGENT)

      try {
        const sessionId = getSessionId('assessment')
        const result = await callAIAgent(message, SKILLS_ASSESSMENT_AGENT, { session_id: sessionId })
        const { data, error } = parseAgentResponse(result)

        if (error) {
          setAssessmentError(error)
          setAssessmentLoading(false)
          setActiveAgentId(null)
          return
        }

        const responseText = data?.response ?? data?.text ?? data?.message ?? ''
        const isComplete = data?.assessment_complete ?? false
        const newSkillsData = data?.skills_data ?? null
        const sources = Array.isArray(data?.sources) ? data.sources : []

        const assistantMsg: ChatMessage = {
          role: 'assistant',
          content: responseText,
          sources,
          timestamp: new Date(),
        }
        setAssessmentMessages((prev) => [...prev, assistantMsg])

        if (isComplete && newSkillsData) {
          setAssessmentComplete(true)
          const parsedSkills: SkillsData = {
            overall_readiness: typeof newSkillsData.overall_readiness === 'number' ? newSkillsData.overall_readiness : 0,
            domains: newSkillsData.domains ?? {},
            strengths: Array.isArray(newSkillsData.strengths) ? newSkillsData.strengths : [],
            gaps: Array.isArray(newSkillsData.gaps) ? newSkillsData.gaps : [],
            recommended_focus: Array.isArray(newSkillsData.recommended_focus) ? newSkillsData.recommended_focus : [],
          }
          setSkillsData(parsedSkills)
          if (Array.isArray(parsedSkills.recommended_focus) && parsedSkills.recommended_focus.length > 0) {
            setCurrentFocus(parsedSkills.recommended_focus[0])
          }
          addActivity('assessment', 'Skills assessment completed', {
            domain: 'overall',
            change: parsedSkills.overall_readiness,
          })
        } else {
          addActivity('assessment', `Assessment interaction: ${message.substring(0, 50)}...`)
        }
      } catch (err) {
        setAssessmentError(err instanceof Error ? err.message : 'Unexpected error')
      }

      setAssessmentLoading(false)
      setActiveAgentId(null)
    },
    [getSessionId, addActivity]
  )

  // --- Learning handler ---
  const handleLearningMessage = useCallback(
    async (message: string) => {
      setLearningError(null)
      const userMsg: ChatMessage = { role: 'user', content: message, timestamp: new Date() }
      setLearningMessages((prev) => [...prev, userMsg])
      setLearningLoading(true)
      setActiveAgentId(ADAPTIVE_LEARNING_AGENT)

      try {
        const sessionId = getSessionId('learning')
        const skillsContext = skillsData
          ? `Current skills: ${JSON.stringify(skillsData.domains)}. Focus area: ${currentFocus}.`
          : ''
        const fullMessage = skillsContext ? `${skillsContext}\n\nUser: ${message}` : message
        const result = await callAIAgent(fullMessage, ADAPTIVE_LEARNING_AGENT, { session_id: sessionId })
        const { data, error } = parseAgentResponse(result)

        if (error) {
          setLearningError(error)
          setLearningLoading(false)
          setActiveAgentId(null)
          return
        }

        const responseText = data?.response ?? data?.text ?? data?.message ?? ''
        const newFocus = data?.current_focus ?? currentFocus
        const skillUpdate = data?.skill_update ?? null
        const knowledgeCtx = Array.isArray(data?.knowledge_context) ? data.knowledge_context : []
        const sources = Array.isArray(data?.sources) ? data.sources : []

        setCurrentFocus(newFocus)

        const assistantMsg: ChatMessage = {
          role: 'assistant',
          content: responseText,
          sources,
          timestamp: new Date(),
          skillUpdate,
          knowledgeContext: knowledgeCtx,
        }
        setLearningMessages((prev) => [...prev, assistantMsg])

        if (skillUpdate) {
          applySkillUpdate(skillUpdate)
          addActivity('learning', `Skill update: ${skillUpdate.domain}`, {
            domain: skillUpdate.domain,
            change: skillUpdate.new_score - skillUpdate.previous_score,
          })
        } else {
          addActivity('learning', `Learning interaction on ${newFocus}: ${message.substring(0, 40)}...`)
        }
      } catch (err) {
        setLearningError(err instanceof Error ? err.message : 'Unexpected error')
      }

      setLearningLoading(false)
      setActiveAgentId(null)
    },
    [getSessionId, skillsData, currentFocus, applySkillUpdate, addActivity]
  )

  // --- Problem-Solving handler ---
  const handleProblemMessage = useCallback(
    async (message: string) => {
      setProblemError(null)
      const userMsg: ChatMessage = { role: 'user', content: message, timestamp: new Date() }
      setProblemMessages((prev) => [...prev, userMsg])
      setProblemLoading(true)
      setActiveAgentId(PROBLEM_SOLVING_AGENT)

      try {
        const sessionId = getSessionId('problem')
        const result = await callAIAgent(message, PROBLEM_SOLVING_AGENT, { session_id: sessionId })
        const { data, error } = parseAgentResponse(result)

        if (error) {
          setProblemError(error)
          setProblemLoading(false)
          setActiveAgentId(null)
          return
        }

        const responseText = data?.response ?? data?.text ?? data?.message ?? ''
        const phase = data?.diagnostic_phase ?? diagnosticPhase
        const steps = Array.isArray(data?.resolution_steps) ? data.resolution_steps : []
        const skillUpdate = data?.skill_update ?? null
        const sources = Array.isArray(data?.sources) ? data.sources : []

        setDiagnosticPhase(phase)

        const assistantMsg: ChatMessage = {
          role: 'assistant',
          content: responseText,
          sources,
          timestamp: new Date(),
          diagnosticPhase: phase,
          resolutionSteps: steps,
          skillUpdate,
        }
        setProblemMessages((prev) => [...prev, assistantMsg])

        if (skillUpdate) {
          applySkillUpdate(skillUpdate)
          addActivity('problem-solving', `Problem solving: skill update in ${skillUpdate.domain}`, {
            domain: skillUpdate.domain,
            change: skillUpdate.new_score - skillUpdate.previous_score,
          })
        } else {
          addActivity('problem-solving', `Troubleshooting (${phase}): ${message.substring(0, 40)}...`)
        }
      } catch (err) {
        setProblemError(err instanceof Error ? err.message : 'Unexpected error')
      }

      setProblemLoading(false)
      setActiveAgentId(null)
    },
    [getSessionId, diagnosticPhase, applySkillUpdate, addActivity]
  )

  const handleEndLearningSession = useCallback(() => {
    setLearningMessages([])
    setSessionIds((prev) => {
      const next = { ...prev }
      delete next['learning']
      return next
    })
  }, [])

  const handleSwitchFocus = useCallback((focus: string) => {
    setCurrentFocus(focus)
    setLearningMessages([])
    setSessionIds((prev) => {
      const next = { ...prev }
      delete next['learning']
      return next
    })
  }, [])

  const handleMarkResolved = useCallback(() => {
    setDiagnosticPhase('resolved')
    addActivity('problem-solving', 'Issue marked as resolved')
    setProblemMessages([])
    setSessionIds((prev) => {
      const next = { ...prev }
      delete next['problem']
      return next
    })
    setDiagnosticPhase('gathering_info')
  }, [addActivity])

  // Derive display data
  const displaySkills = showSample ? SAMPLE_SKILLS : skillsData
  const displayActivity = showSample ? SAMPLE_ACTIVITY : activityLog
  const displayAssessmentMsgs = showSample ? SAMPLE_ASSESSMENT_MESSAGES : assessmentMessages
  const displayLearningMsgs = showSample ? SAMPLE_LEARNING_MESSAGES : learningMessages
  const displayAssessmentStarted = showSample ? true : assessmentStarted
  const displayAssessmentComplete = showSample ? false : assessmentComplete

  const agents = [
    { id: SKILLS_ASSESSMENT_AGENT, name: 'Assessment', color: 'gradient-purple' },
    { id: ADAPTIVE_LEARNING_AGENT, name: 'Learning', color: 'gradient-teal' },
    { id: PROBLEM_SOLVING_AGENT, name: 'Problem Solver', color: 'gradient-orange' },
  ]

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background text-foreground flex">
        <Sidebar
          currentView={currentView}
          onNavigate={setCurrentView}
          domains={displaySkills?.domains ? displaySkills.domains as any : null}
          mobileOpen={mobileOpen}
          onMobileToggle={() => setMobileOpen((p) => !p)}
          overallScore={displaySkills?.overall_readiness ?? 0}
        />

        <main className="flex-1 min-w-0 flex flex-col">
          {/* Top Bar */}
          <div className="flex items-center justify-between px-5 py-2.5 border-b border-border/40 bg-card/80 backdrop-blur-sm">
            <div className="flex items-center gap-3 ml-10 md:ml-0">
              {agents.map((a) => (
                <div key={a.id} className="flex items-center gap-1.5">
                  <div className={cn(
                    'w-1.5 h-1.5 rounded-full transition-all',
                    activeAgentId === a.id ? `${a.color} animate-pulse shadow-sm` : 'bg-border'
                  )} />
                  <span className={cn(
                    'text-[10px] font-mono transition-colors hidden sm:inline',
                    activeAgentId === a.id ? 'text-foreground' : 'text-muted-foreground/50'
                  )}>
                    {a.name}
                  </span>
                </div>
              ))}
              {activeAgentId && (
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20 font-mono animate-pulse">
                  Processing
                </span>
              )}
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-[10px] text-muted-foreground/60">Preview</span>
              <Switch
                checked={showSample}
                onCheckedChange={setShowSample}
                className="scale-75"
              />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {currentView === 'dashboard' && (
              <Dashboard
                skillsData={displaySkills}
                activityLog={displayActivity}
                onNavigate={setCurrentView}
                assessmentStarted={displayAssessmentStarted}
                assessmentComplete={displayAssessmentComplete}
              />
            )}

            {currentView === 'assessment' && (
              <AssessmentInterface
                messages={displayAssessmentMsgs}
                onSendMessage={handleAssessmentMessage}
                loading={assessmentLoading}
                assessmentComplete={displayAssessmentComplete}
                skillsData={displaySkills}
                error={assessmentError}
              />
            )}

            {currentView === 'learning' && (
              <LearningInterface
                messages={displayLearningMsgs}
                onSendMessage={handleLearningMessage}
                loading={learningLoading}
                currentFocus={currentFocus}
                skillsData={displaySkills}
                error={learningError}
                onEndSession={handleEndLearningSession}
                onSwitchFocus={handleSwitchFocus}
              />
            )}

            {currentView === 'problem-solving' && (
              <ProblemSolvingInterface
                messages={showSample ? [] : problemMessages}
                onSendMessage={handleProblemMessage}
                loading={problemLoading}
                diagnosticPhase={diagnosticPhase}
                error={problemError}
                onMarkResolved={handleMarkResolved}
              />
            )}

            {currentView === 'skills-graph' && (
              <SkillsGraph skillsData={displaySkills} />
            )}
          </div>
        </main>
      </div>
    </ErrorBoundary>
  )
}
