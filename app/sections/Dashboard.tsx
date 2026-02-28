'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import {
  HiOutlineClipboardDocumentCheck,
  HiOutlineAcademicCap,
  HiOutlineWrenchScrewdriver,
  HiOutlineArrowTrendingUp,
  HiOutlineArrowTrendingDown,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineSparkles,
} from 'react-icons/hi2'

type ViewType = 'dashboard' | 'assessment' | 'learning' | 'problem-solving' | 'skills-graph'

interface SkillsData {
  overall_readiness: number
  domains: Record<string, number>
  strengths: string[]
  gaps: string[]
  recommended_focus: string[]
}

interface ActivityEntry {
  id: string
  type: 'assessment' | 'learning' | 'problem-solving'
  summary: string
  skillImpact?: { domain: string; change: number }
  timestamp: Date
}

interface DashboardProps {
  skillsData: SkillsData | null
  activityLog: ActivityEntry[]
  onNavigate: (view: ViewType) => void
  assessmentStarted: boolean
  assessmentComplete: boolean
}

function ReadinessRing({ score }: { score: number }) {
  const radius = 60
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score / 100) * circumference
  const color = score >= 80 ? 'hsl(92 28% 60%)' : score >= 60 ? 'hsl(213 32% 60%)' : score >= 30 ? 'hsl(14 51% 60%)' : 'hsl(354 42% 45%)'

  return (
    <div className="relative w-40 h-40 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="hsl(220 16% 22%)" strokeWidth="8" />
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-foreground">{score}%</span>
        <span className="text-[10px] text-muted-foreground font-mono uppercase">Readiness</span>
      </div>
    </div>
  )
}

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  assessment: HiOutlineClipboardDocumentCheck,
  learning: HiOutlineAcademicCap,
  'problem-solving': HiOutlineWrenchScrewdriver,
}

const MILESTONES = [
  { label: 'First Assessment', key: 'first_assessment' },
  { label: 'All Domains Assessed', key: 'all_assessed' },
  { label: 'First Skill Up', key: 'first_skill_up' },
  { label: 'Problem Solved', key: 'first_problem' },
  { label: '80% Ready', key: 'eighty_percent' },
]

export default function Dashboard({
  skillsData,
  activityLog,
  onNavigate,
  assessmentStarted,
  assessmentComplete,
}: DashboardProps) {
  const overallScore = skillsData?.overall_readiness ?? 0
  const gapsCount = Array.isArray(skillsData?.gaps) ? skillsData.gaps.length : 0

  const assessmentStatus = assessmentComplete
    ? 'completed'
    : assessmentStarted
    ? 'in-progress'
    : 'not-started'

  const earnedMilestones = new Set<string>()
  if (assessmentStarted) earnedMilestones.add('first_assessment')
  if (assessmentComplete) earnedMilestones.add('all_assessed')
  if (activityLog.some((a) => a.skillImpact && a.skillImpact.change > 0)) earnedMilestones.add('first_skill_up')
  if (activityLog.some((a) => a.type === 'problem-solving')) earnedMilestones.add('first_problem')
  if (overallScore >= 80) earnedMilestones.add('eighty_percent')

  return (
    <div className="space-y-4 p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Dashboard</h2>
          <p className="text-xs text-muted-foreground">Your NVIDIA AI Factory deployment learning progress</p>
        </div>
      </div>

      {/* Readiness Score + Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Readiness Ring */}
        <Card className="bg-card border-border">
          <CardContent className="pt-4 pb-4">
            <ReadinessRing score={overallScore} />
            <p className="text-center text-xs text-muted-foreground mt-2 font-mono">Deployment Readiness</p>
          </CardContent>
        </Card>

        {/* Assessment Card */}
        <Card className="bg-card border-border hover:border-accent/50 transition-colors cursor-pointer" onClick={() => onNavigate('assessment')}>
          <CardContent className="pt-4 pb-4 flex flex-col h-full">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center">
                <HiOutlineClipboardDocumentCheck className="w-4 h-4 text-foreground" />
              </div>
              <Badge
                variant={assessmentStatus === 'completed' ? 'default' : 'outline'}
                className={cn(
                  'text-[10px]',
                  assessmentStatus === 'completed' && 'bg-[hsl(92_28%_60%)] text-[hsl(220_16%_13%)]',
                  assessmentStatus === 'in-progress' && 'border-accent text-accent'
                )}
              >
                {assessmentStatus === 'completed' ? 'Completed' : assessmentStatus === 'in-progress' ? 'In Progress' : 'Not Started'}
              </Badge>
            </div>
            <h3 className="text-sm font-medium text-foreground">Begin Assessment</h3>
            <p className="text-[11px] text-muted-foreground mt-1 flex-1">Evaluate your deployment knowledge across 8 domains</p>
            <Button size="sm" variant="outline" className="mt-3 w-full text-xs">
              {assessmentStarted ? 'Continue' : 'Start'}
            </Button>
          </CardContent>
        </Card>

        {/* Learning Card */}
        <Card className="bg-card border-border hover:border-accent/50 transition-colors cursor-pointer" onClick={() => onNavigate('learning')}>
          <CardContent className="pt-4 pb-4 flex flex-col h-full">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center">
                <HiOutlineAcademicCap className="w-4 h-4 text-foreground" />
              </div>
              {gapsCount > 0 && (
                <Badge variant="outline" className="text-[10px] border-[hsl(14_51%_60%)] text-[hsl(14_51%_60%)]">
                  {gapsCount} gap{gapsCount > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            <h3 className="text-sm font-medium text-foreground">Start Learning</h3>
            <p className="text-[11px] text-muted-foreground mt-1 flex-1">Adaptive Socratic learning to fill knowledge gaps</p>
            <Button size="sm" variant="outline" className="mt-3 w-full text-xs">
              Learn
            </Button>
          </CardContent>
        </Card>

        {/* Problem Solver Card */}
        <Card className="bg-card border-border hover:border-accent/50 transition-colors cursor-pointer" onClick={() => onNavigate('problem-solving')}>
          <CardContent className="pt-4 pb-4 flex flex-col h-full">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center">
                <HiOutlineWrenchScrewdriver className="w-4 h-4 text-foreground" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-foreground">Get Help</h3>
            <p className="text-[11px] text-muted-foreground mt-1 flex-1">Troubleshoot real deployment issues with guided diagnostics</p>
            <Button size="sm" variant="outline" className="mt-3 w-full text-xs">
              Troubleshoot
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Strengths and Gaps */}
      {skillsData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-xs font-mono uppercase text-muted-foreground tracking-wider flex items-center gap-1">
                <HiOutlineCheckCircle className="w-3.5 h-3.5 text-[hsl(92_28%_60%)]" />
                Strengths
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="space-y-1">
                {Array.isArray(skillsData.strengths) && skillsData.strengths.length > 0 ? (
                  skillsData.strengths.map((s, i) => (
                    <p key={i} className="text-xs text-foreground">{s}</p>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">Complete assessment to identify strengths</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-xs font-mono uppercase text-muted-foreground tracking-wider flex items-center gap-1">
                <HiOutlineArrowTrendingUp className="w-3.5 h-3.5 text-[hsl(14_51%_60%)]" />
                Focus Areas
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="space-y-1">
                {Array.isArray(skillsData.recommended_focus) && skillsData.recommended_focus.length > 0 ? (
                  skillsData.recommended_focus.map((f, i) => (
                    <p key={i} className="text-xs text-foreground">{f}</p>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">Complete assessment to see focus areas</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Milestones */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs font-mono uppercase text-muted-foreground tracking-wider flex items-center gap-1">
            <HiOutlineSparkles className="w-3.5 h-3.5 text-accent" />
            Milestones
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {MILESTONES.map((m) => {
              const earned = earnedMilestones.has(m.key)
              return (
                <Badge
                  key={m.key}
                  variant={earned ? 'default' : 'outline'}
                  className={cn(
                    'text-[10px] whitespace-nowrap flex-shrink-0',
                    earned
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground opacity-50'
                  )}
                >
                  {earned && <HiOutlineCheckCircle className="w-3 h-3 mr-1" />}
                  {m.label}
                </Badge>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Activity Feed */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs font-mono uppercase text-muted-foreground tracking-wider flex items-center gap-1">
            <HiOutlineClock className="w-3.5 h-3.5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          {activityLog.length > 0 ? (
            <ScrollArea className="max-h-48">
              <div className="space-y-2">
                {activityLog.slice(0, 10).map((entry) => {
                  const Icon = TYPE_ICONS[entry.type] ?? HiOutlineClock
                  return (
                    <div key={entry.id} className="flex items-start gap-2 text-xs">
                      <Icon className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground truncate">{entry.summary}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-muted-foreground text-[10px]">{formatTimeAgo(entry.timestamp)}</span>
                          {entry.skillImpact && (
                            <span className={cn('text-[10px] flex items-center gap-0.5', entry.skillImpact.change > 0 ? 'text-[hsl(92_28%_60%)]' : 'text-[hsl(354_42%_45%)]')}>
                              {entry.skillImpact.change > 0 ? <HiOutlineArrowTrendingUp className="w-3 h-3" /> : <HiOutlineArrowTrendingDown className="w-3 h-3" />}
                              {entry.skillImpact.domain} {entry.skillImpact.change > 0 ? '+' : ''}{entry.skillImpact.change}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-6">
              <p className="text-xs text-muted-foreground">No activity yet. Start your assessment to begin tracking progress.</p>
              <Button size="sm" variant="outline" className="mt-2 text-xs" onClick={() => onNavigate('assessment')}>
                Begin Assessment
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
