'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import {
  HiOutlineClipboardDocumentCheck,
  HiOutlineAcademicCap,
  HiOutlineWrenchScrewdriver,
  HiOutlineArrowTrendingUp,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineSparkles,
  HiOutlineArrowRight,
  HiOutlineBolt,
  HiOutlineExclamationTriangle,
  HiOutlineChartBar,
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
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score / 100) * circumference
  const gradientId = 'readinessGradient'

  return (
    <div className="relative w-36 h-36">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 130 130">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(193 43% 65%)" />
            <stop offset="50%" stopColor="hsl(213 32% 60%)" />
            <stop offset="100%" stopColor="hsl(311 20% 60%)" />
          </linearGradient>
        </defs>
        <circle cx="65" cy="65" r={radius} fill="none" stroke="hsl(220 16% 20%)" strokeWidth="7" />
        <circle
          cx="65"
          cy="65"
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-foreground">{score}%</span>
        <span className="text-[10px] text-muted-foreground mt-0.5">Readiness</span>
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

const TYPE_COLORS: Record<string, string> = {
  assessment: 'bg-[hsl(311_20%_60%)]',
  learning: 'bg-[hsl(193_43%_65%)]',
  'problem-solving': 'bg-[hsl(14_51%_60%)]',
}

const DOMAIN_LABELS: Record<string, string> = {
  infrastructure: 'Infrastructure',
  networking: 'Networking',
  storage: 'Storage',
  orchestration: 'Orchestration',
  gpu_management: 'GPU Mgmt',
  security: 'Security',
  mlops: 'MLOps',
  monitoring: 'Monitoring',
}

export default function Dashboard({
  skillsData,
  activityLog,
  onNavigate,
  assessmentStarted,
  assessmentComplete,
}: DashboardProps) {
  const overallScore = skillsData?.overall_readiness ?? 0
  const gapsCount = Array.isArray(skillsData?.gaps) ? skillsData.gaps.length : 0

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 animate-fadeIn">
      {/* Hero Section */}
      <div className="rounded-2xl gradient-hero border border-border/40 p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
          <ReadinessRing score={overallScore} />
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              {overallScore === 0
                ? 'Welcome to AI Factory Training'
                : overallScore >= 80
                ? 'Deployment Ready'
                : 'Building Expertise'}
            </h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-lg leading-relaxed">
              {overallScore === 0
                ? 'Start with a skills assessment to discover your strengths, identify gaps, and get a personalized learning path for NVIDIA AI Factory deployment.'
                : `You've mapped your knowledge across ${Object.keys(skillsData?.domains ?? {}).length} competency domains. ${gapsCount > 0 ? `${gapsCount} skill gap${gapsCount > 1 ? 's' : ''} identified for focused training.` : 'Great progress across all domains.'}`}
            </p>
            {skillsData && Array.isArray(skillsData.recommended_focus) && skillsData.recommended_focus.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
                {skillsData.recommended_focus.map((f, i) => (
                  <span key={i} className="text-[11px] px-3 py-1 rounded-full bg-accent/15 text-accent border border-accent/20">
                    {DOMAIN_LABELS[f] ?? f}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Assessment */}
        <button
          onClick={() => onNavigate('assessment')}
          className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card p-5 text-left transition-all duration-300 hover:border-[hsl(311_20%_60%)/0.4] hover:shadow-lg hover:shadow-[hsl(311_20%_60%)/0.05] hover:-translate-y-0.5"
        >
          <div className="absolute top-0 right-0 w-32 h-32 gradient-purple opacity-[0.06] rounded-full -translate-y-8 translate-x-8 group-hover:opacity-[0.12] transition-opacity" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl gradient-purple flex items-center justify-center shadow-md">
                <HiOutlineClipboardDocumentCheck className="w-5 h-5 text-white" />
              </div>
              {assessmentComplete ? (
                <span className="text-[10px] px-2.5 py-1 rounded-full bg-[hsl(92_28%_60%)]/15 text-[hsl(92_28%_60%)] font-medium">
                  Completed
                </span>
              ) : assessmentStarted ? (
                <span className="text-[10px] px-2.5 py-1 rounded-full bg-accent/15 text-accent font-medium animate-pulse">
                  In Progress
                </span>
              ) : null}
            </div>
            <h3 className="text-sm font-semibold text-foreground">Begin Assessment</h3>
            <p className="text-[12px] text-muted-foreground mt-1.5 leading-relaxed">
              Socratic diagnostic to map your deployment knowledge
            </p>
            <div className="flex items-center gap-1.5 mt-4 text-[11px] text-muted-foreground group-hover:text-[hsl(311_20%_60%)] transition-colors">
              <span>{assessmentStarted ? 'Continue' : 'Start assessment'}</span>
              <HiOutlineArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </button>

        {/* Learning */}
        <button
          onClick={() => onNavigate('learning')}
          className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card p-5 text-left transition-all duration-300 hover:border-[hsl(193_43%_65%)/0.4] hover:shadow-lg hover:shadow-[hsl(193_43%_65%)/0.05] hover:-translate-y-0.5"
        >
          <div className="absolute top-0 right-0 w-32 h-32 gradient-teal opacity-[0.06] rounded-full -translate-y-8 translate-x-8 group-hover:opacity-[0.12] transition-opacity" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl gradient-teal flex items-center justify-center shadow-md">
                <HiOutlineAcademicCap className="w-5 h-5 text-white" />
              </div>
              {gapsCount > 0 && (
                <span className="text-[10px] px-2.5 py-1 rounded-full bg-[hsl(14_51%_60%)]/15 text-[hsl(14_51%_60%)] font-medium">
                  {gapsCount} gap{gapsCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <h3 className="text-sm font-semibold text-foreground">Start Learning</h3>
            <p className="text-[12px] text-muted-foreground mt-1.5 leading-relaxed">
              Adaptive Socratic dialogue to fill knowledge gaps
            </p>
            <div className="flex items-center gap-1.5 mt-4 text-[11px] text-muted-foreground group-hover:text-[hsl(193_43%_65%)] transition-colors">
              <span>Begin session</span>
              <HiOutlineArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </button>

        {/* Problem Solver */}
        <button
          onClick={() => onNavigate('problem-solving')}
          className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card p-5 text-left transition-all duration-300 hover:border-[hsl(14_51%_60%)/0.4] hover:shadow-lg hover:shadow-[hsl(14_51%_60%)/0.05] hover:-translate-y-0.5"
        >
          <div className="absolute top-0 right-0 w-32 h-32 gradient-orange opacity-[0.06] rounded-full -translate-y-8 translate-x-8 group-hover:opacity-[0.12] transition-opacity" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl gradient-orange flex items-center justify-center shadow-md">
                <HiOutlineWrenchScrewdriver className="w-5 h-5 text-white" />
              </div>
            </div>
            <h3 className="text-sm font-semibold text-foreground">Get Help</h3>
            <p className="text-[12px] text-muted-foreground mt-1.5 leading-relaxed">
              Guided troubleshooting for real deployment issues
            </p>
            <div className="flex items-center gap-1.5 mt-4 text-[11px] text-muted-foreground group-hover:text-[hsl(14_51%_60%)] transition-colors">
              <span>Troubleshoot</span>
              <HiOutlineArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </button>
      </div>

      {/* Bottom Grid: Skills Snapshot + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Skills Snapshot */}
        <div className="lg:col-span-2 rounded-2xl border border-border/40 bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <HiOutlineBolt className="w-4 h-4 text-accent" />
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">Domain Scores</h3>
          </div>
          {skillsData ? (
            <div className="space-y-2.5">
              {Object.entries(skillsData.domains)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .map(([key, score]) => {
                  const s = typeof score === 'number' ? score : 0
                  const color = s >= 80 ? 'hsl(92 28% 60%)' : s >= 60 ? 'hsl(193 43% 65%)' : s >= 30 ? 'hsl(14 51% 60%)' : 'hsl(354 42% 45%)'
                  return (
                    <div key={key} className="group">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] text-muted-foreground group-hover:text-foreground transition-colors">{DOMAIN_LABELS[key] ?? key}</span>
                        <span className="text-[11px] font-semibold" style={{ color }}>{s}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out"
                          style={{ width: `${s}%`, background: `linear-gradient(90deg, ${color}, ${color}dd)` }}
                        />
                      </div>
                    </div>
                  )
                })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center mb-3">
                <HiOutlineChartBar className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">Complete an assessment to see domain scores</p>
            </div>
          )}
        </div>

        {/* Activity & Strengths */}
        <div className="lg:col-span-3 space-y-4">
          {/* Strengths & Gaps Pills */}
          {skillsData && (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border/40 bg-card p-4">
                <div className="flex items-center gap-1.5 mb-3">
                  <HiOutlineCheckCircle className="w-3.5 h-3.5 text-[hsl(92_28%_60%)]" />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Strengths</span>
                </div>
                <div className="space-y-1.5">
                  {Array.isArray(skillsData.strengths) && skillsData.strengths.length > 0 ? (
                    skillsData.strengths.slice(0, 3).map((s, i) => (
                      <p key={i} className="text-[11px] text-foreground/80 leading-relaxed">{s}</p>
                    ))
                  ) : (
                    <p className="text-[11px] text-muted-foreground">Pending assessment</p>
                  )}
                </div>
              </div>
              <div className="rounded-2xl border border-border/40 bg-card p-4">
                <div className="flex items-center gap-1.5 mb-3">
                  <HiOutlineExclamationTriangle className="w-3.5 h-3.5 text-[hsl(14_51%_60%)]" />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Gaps</span>
                </div>
                <div className="space-y-1.5">
                  {Array.isArray(skillsData.gaps) && skillsData.gaps.length > 0 ? (
                    skillsData.gaps.slice(0, 3).map((g, i) => (
                      <p key={i} className="text-[11px] text-foreground/80 leading-relaxed">{g}</p>
                    ))
                  ) : (
                    <p className="text-[11px] text-muted-foreground">Pending assessment</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Activity Feed */}
          <div className="rounded-2xl border border-border/40 bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <HiOutlineClock className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">Recent Activity</h3>
            </div>
            {activityLog.length > 0 ? (
              <div className="space-y-3">
                {activityLog.slice(0, 6).map((entry) => (
                  <div key={entry.id} className="flex items-start gap-3 group">
                    <div className={cn('w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0', TYPE_COLORS[entry.type] ?? 'bg-muted')} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-foreground/80 group-hover:text-foreground transition-colors truncate">{entry.summary}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[10px] text-muted-foreground/70">{formatTimeAgo(entry.timestamp)}</span>
                        {entry.skillImpact && entry.skillImpact.change > 0 && (
                          <span className="text-[10px] text-[hsl(92_28%_60%)] flex items-center gap-0.5">
                            <HiOutlineArrowTrendingUp className="w-3 h-3" />
                            +{entry.skillImpact.change} {entry.skillImpact.domain}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-[12px] text-muted-foreground">No activity yet. Start your learning journey below.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Milestones */}
      <div className="rounded-2xl border border-border/40 bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <HiOutlineSparkles className="w-4 h-4 text-[hsl(311_20%_60%)]" />
          <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">Milestones</h3>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {[
            { label: 'First Assessment', earned: assessmentStarted },
            { label: 'All Domains Assessed', earned: assessmentComplete },
            { label: 'First Skill Up', earned: activityLog.some((a) => a.skillImpact && a.skillImpact.change > 0) },
            { label: 'Problem Solved', earned: activityLog.some((a) => a.type === 'problem-solving') },
            { label: '80% Ready', earned: overallScore >= 80 },
          ].map((m, i) => (
            <div
              key={i}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl flex-shrink-0 text-[11px] transition-all border',
                m.earned
                  ? 'bg-accent/10 border-accent/30 text-accent font-medium'
                  : 'bg-secondary/30 border-border/30 text-muted-foreground/50'
              )}
            >
              {m.earned && <HiOutlineCheckCircle className="w-3.5 h-3.5" />}
              {m.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
