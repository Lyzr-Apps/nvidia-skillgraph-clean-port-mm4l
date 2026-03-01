'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import {
  HiOutlineChartBar,
  HiOutlineArrowTrendingUp,
  HiOutlineArrowTrendingDown,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlineSparkles,
} from 'react-icons/hi2'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

interface SkillsData {
  overall_readiness: number
  domains: Record<string, number>
  strengths: string[]
  gaps: string[]
  recommended_focus: string[]
}

interface SkillsGraphProps {
  skillsData: SkillsData | null
}

const DOMAIN_LABELS: Record<string, string> = {
  infrastructure: 'Infrastructure', networking: 'Networking', storage: 'Storage',
  orchestration: 'Orchestration', gpu_management: 'GPU Management', security: 'Security',
  mlops: 'MLOps', monitoring: 'Monitoring',
}

const DOMAIN_DESCRIPTIONS: Record<string, string> = {
  infrastructure: 'Hardware, compute clusters, DGX systems',
  networking: 'InfiniBand, RDMA, network fabric',
  storage: 'GPUDirect Storage, parallel filesystems',
  orchestration: 'Kubernetes, NVIDIA Operator, Base Command',
  gpu_management: 'Multi-instance GPU, MPS, allocation',
  security: 'Confidential computing, secure boot',
  mlops: 'Model lifecycle, pipelines, registry',
  monitoring: 'DCGM, GPU metrics, observability',
}

const DOMAIN_GRADIENTS: Record<string, string> = {
  infrastructure: 'gradient-blue',
  networking: 'gradient-teal',
  storage: 'gradient-green',
  orchestration: 'gradient-purple',
  gpu_management: 'gradient-orange',
  security: 'gradient-blue',
  mlops: 'gradient-teal',
  monitoring: 'gradient-green',
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'hsl(92 28% 60%)'
  if (score >= 60) return 'hsl(193 43% 65%)'
  if (score >= 30) return 'hsl(14 51% 60%)'
  return 'hsl(354 42% 45%)'
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Expert'
  if (score >= 60) return 'Proficient'
  if (score >= 30) return 'Developing'
  return 'Beginner'
}

function ReadinessRing({ score }: { score: number }) {
  const radius = 64
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <div className="relative w-40 h-40 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 150 150">
        <defs>
          <linearGradient id="skillsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(193 43% 65%)" />
            <stop offset="50%" stopColor="hsl(213 32% 60%)" />
            <stop offset="100%" stopColor="hsl(311 20% 60%)" />
          </linearGradient>
        </defs>
        <circle cx="75" cy="75" r={radius} fill="none" stroke="hsl(220 16% 20%)" strokeWidth="8" />
        <circle
          cx="75" cy="75" r={radius} fill="none"
          stroke="url(#skillsGradient)" strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-foreground">{score}%</span>
        <span className="text-[11px] text-muted-foreground mt-1">{getScoreLabel(score)}</span>
      </div>
    </div>
  )
}

export default function SkillsGraph({ skillsData }: SkillsGraphProps) {
  if (!skillsData) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)] p-6 animate-fadeIn">
        <div className="rounded-2xl border border-border/40 bg-card max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-5">
            <HiOutlineChartBar className="w-7 h-7 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold text-foreground mb-2">No Skills Data Yet</h3>
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            Complete a skills assessment to see your detailed proficiency graph across all NVIDIA AI Factory deployment domains.
          </p>
        </div>
      </div>
    )
  }

  const domains = skillsData.domains ?? {}
  const radarData = Object.entries(DOMAIN_LABELS).map(([key, label]) => ({
    domain: label,
    score: typeof domains[key] === 'number' ? domains[key] : 0,
    fullMark: 100,
  }))

  const sortedDomains = Object.entries(domains)
    .map(([key, score]) => ({ key, score: typeof score === 'number' ? score : 0 }))
    .sort((a, b) => b.score - a.score)

  return (
    <div className="space-y-5 p-4 md:p-8 max-w-6xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg gradient-green flex items-center justify-center shadow-md">
          <HiOutlineChartBar className="w-4.5 h-4.5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground tracking-tight">Skills Graph</h2>
          <p className="text-[12px] text-muted-foreground">Deployment competency across all domains</p>
        </div>
      </div>

      {/* Top Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Readiness */}
        <div className="rounded-2xl border border-border/40 bg-card p-6 gradient-hero">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-4">Deployment Readiness</p>
          <ReadinessRing score={skillsData.overall_readiness ?? 0} />
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="text-center p-2 rounded-xl bg-secondary/30">
              <p className="text-xl font-bold text-foreground">{Array.isArray(skillsData.strengths) ? skillsData.strengths.length : 0}</p>
              <p className="text-[10px] text-muted-foreground">Strengths</p>
            </div>
            <div className="text-center p-2 rounded-xl bg-secondary/30">
              <p className="text-xl font-bold text-foreground">{Array.isArray(skillsData.gaps) ? skillsData.gaps.length : 0}</p>
              <p className="text-[10px] text-muted-foreground">Gaps</p>
            </div>
          </div>
        </div>

        {/* Radar */}
        <div className="rounded-2xl border border-border/40 bg-card p-6">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-3">Component Mastery Radar</p>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="62%">
                <defs>
                  <linearGradient id="radarGradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="hsl(193 43% 65%)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(213 32% 60%)" stopOpacity={0.15} />
                  </linearGradient>
                </defs>
                <PolarGrid stroke="hsl(220 16% 22%)" strokeWidth={0.5} />
                <PolarAngleAxis dataKey="domain" tick={{ fill: 'hsl(219 14% 65%)', fontSize: 10 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: 'hsl(219 14% 55%)', fontSize: 8 }} axisLine={false} />
                <Radar dataKey="score" stroke="hsl(193 43% 65%)" fill="url(#radarGradient)" strokeWidth={2} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(220 16% 16%)',
                    border: '1px solid hsl(220 16% 22%)',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                    color: 'hsl(219 28% 88%)',
                    padding: '8px 12px',
                  }}
                  formatter={(value: number) => [`${value}%`, 'Score']}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Domain Cards */}
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-3">Domain Breakdown</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {sortedDomains.map(({ key, score }) => {
            const color = getScoreColor(score)
            const label = DOMAIN_LABELS[key] ?? key
            const desc = DOMAIN_DESCRIPTIONS[key] ?? ''
            const gradient = DOMAIN_GRADIENTS[key] ?? 'gradient-blue'
            return (
              <div key={key} className="rounded-2xl border border-border/40 bg-card p-4 group hover:border-border/60 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={cn('w-2 h-2 rounded-full', gradient)} />
                    <span className="text-[12px] font-medium text-foreground">{label}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ color, backgroundColor: `${color}15`, border: `1px solid ${color}30` }}>
                    {getScoreLabel(score)}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${score}%`, backgroundColor: color }} />
                  </div>
                  <span className="text-[12px] font-bold" style={{ color }}>{score}%</span>
                </div>
                <p className="text-[10px] text-muted-foreground/70 leading-relaxed">{desc}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Strengths & Gaps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border/40 bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <HiOutlineCheckCircle className="w-4 h-4 text-[hsl(92_28%_60%)]" />
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Identified Strengths</p>
          </div>
          {Array.isArray(skillsData.strengths) && skillsData.strengths.length > 0 ? (
            <ul className="space-y-2.5">
              {skillsData.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2.5 text-[13px] text-foreground/80 leading-relaxed">
                  <HiOutlineArrowTrendingUp className="w-4 h-4 text-[hsl(92_28%_60%)] mt-0.5 flex-shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[12px] text-muted-foreground">No strengths identified yet</p>
          )}
        </div>

        <div className="rounded-2xl border border-border/40 bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <HiOutlineExclamationTriangle className="w-4 h-4 text-[hsl(14_51%_60%)]" />
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Knowledge Gaps</p>
          </div>
          {Array.isArray(skillsData.gaps) && skillsData.gaps.length > 0 ? (
            <ul className="space-y-2.5">
              {skillsData.gaps.map((g, i) => (
                <li key={i} className="flex items-start gap-2.5 text-[13px] text-foreground/80 leading-relaxed">
                  <HiOutlineArrowTrendingDown className="w-4 h-4 text-[hsl(14_51%_60%)] mt-0.5 flex-shrink-0" />
                  {g}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[12px] text-muted-foreground">No gaps identified yet</p>
          )}
        </div>
      </div>

      {/* Recommended Focus */}
      {Array.isArray(skillsData.recommended_focus) && skillsData.recommended_focus.length > 0 && (
        <div className="rounded-2xl border border-border/40 bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <HiOutlineSparkles className="w-4 h-4 text-[hsl(311_20%_60%)]" />
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Recommended Focus Areas</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {skillsData.recommended_focus.map((f, i) => (
              <span key={i} className="text-[11px] px-3 py-1.5 rounded-xl bg-accent/10 text-accent border border-accent/20 font-medium">
                {DOMAIN_LABELS[f] ?? f}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
