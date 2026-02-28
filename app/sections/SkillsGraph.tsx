'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import {
  HiOutlineChartBar,
  HiOutlineArrowTrendingUp,
  HiOutlineArrowTrendingDown,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
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
  infrastructure: 'Infrastructure',
  networking: 'Networking',
  storage: 'Storage',
  orchestration: 'Orchestration',
  gpu_management: 'GPU Management',
  security: 'Security',
  mlops: 'MLOps',
  monitoring: 'Monitoring',
}

const DOMAIN_DESCRIPTIONS: Record<string, string> = {
  infrastructure: 'Hardware, compute clusters, and DGX systems',
  networking: 'InfiniBand, RDMA, and network fabric',
  storage: 'GPUDirect Storage, parallel filesystems',
  orchestration: 'Kubernetes, NVIDIA Operator, Base Command',
  gpu_management: 'Multi-instance GPU, MPS, resource allocation',
  security: 'Confidential computing, secure boot, access control',
  mlops: 'Model lifecycle, training pipelines, registry',
  monitoring: 'DCGM, GPU metrics, observability stack',
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'hsl(92 28% 60%)'
  if (score >= 60) return 'hsl(213 32% 60%)'
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
  const radius = 70
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score / 100) * circumference
  const color = getScoreColor(score)

  return (
    <div className="relative w-44 h-44 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r={radius} fill="none" stroke="hsl(220 16% 22%)" strokeWidth="10" />
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-foreground">{score}%</span>
        <span className="text-xs text-muted-foreground font-mono uppercase mt-0.5">{getScoreLabel(score)}</span>
      </div>
    </div>
  )
}

export default function SkillsGraph({ skillsData }: SkillsGraphProps) {
  if (!skillsData) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-32px)] p-4">
        <Card className="bg-card border-border max-w-md w-full">
          <CardContent className="py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
              <HiOutlineChartBar className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-medium text-foreground mb-1">No Skills Data Yet</h3>
            <p className="text-xs text-muted-foreground">
              Complete a skills assessment to see your detailed proficiency graph across all NVIDIA AI Factory deployment domains.
            </p>
          </CardContent>
        </Card>
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
    <div className="space-y-4 p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-foreground">Skills Graph</h2>
        <p className="text-xs text-muted-foreground">Detailed view of your deployment competency across all domains</p>
      </div>

      {/* Top Row: Readiness + Radar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Readiness Hero */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs font-mono uppercase text-muted-foreground tracking-wider">
              Deployment Readiness
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4 px-4">
            <ReadinessRing score={skillsData.overall_readiness ?? 0} />
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">{Array.isArray(skillsData.strengths) ? skillsData.strengths.length : 0}</p>
                <p className="text-[10px] text-muted-foreground font-mono">Strengths</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">{Array.isArray(skillsData.gaps) ? skillsData.gaps.length : 0}</p>
                <p className="text-[10px] text-muted-foreground font-mono">Gaps</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Radar Chart */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs font-mono uppercase text-muted-foreground tracking-wider">
              Component Mastery Radar
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4 px-4">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="65%">
                  <PolarGrid stroke="hsl(220 16% 22%)" />
                  <PolarAngleAxis
                    dataKey="domain"
                    tick={{ fill: 'hsl(219 14% 65%)', fontSize: 10 }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    tick={{ fill: 'hsl(219 14% 65%)', fontSize: 8 }}
                    axisLine={false}
                  />
                  <Radar
                    dataKey="score"
                    stroke="hsl(213 32% 60%)"
                    fill="hsl(213 32% 60%)"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(220 16% 16%)',
                      border: '1px solid hsl(220 16% 22%)',
                      borderRadius: '0.375rem',
                      fontSize: '11px',
                      color: 'hsl(219 28% 88%)',
                    }}
                    formatter={(value: number) => [`${value}%`, 'Score']}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Domain Cards */}
      <div>
        <h3 className="text-xs font-mono uppercase text-muted-foreground tracking-wider mb-2">Domain Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {sortedDomains.map(({ key, score }) => {
            const color = getScoreColor(score)
            const label = DOMAIN_LABELS[key] ?? key
            const desc = DOMAIN_DESCRIPTIONS[key] ?? ''
            return (
              <Card key={key} className="bg-card border-border">
                <CardContent className="pt-3 pb-3 px-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-foreground">{label}</span>
                    <Badge
                      variant="outline"
                      className="text-[10px]"
                      style={{ borderColor: color, color }}
                    >
                      {getScoreLabel(score)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="flex-1">
                      <div className="w-full bg-muted rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${score}%`, backgroundColor: color }}
                        />
                      </div>
                    </div>
                    <span className="text-xs font-mono text-foreground font-bold" style={{ color }}>{score}%</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{desc}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Strengths and Gaps Detail */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs font-mono uppercase text-muted-foreground tracking-wider flex items-center gap-1">
              <HiOutlineCheckCircle className="w-3.5 h-3.5 text-[hsl(92_28%_60%)]" />
              Identified Strengths
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            {Array.isArray(skillsData.strengths) && skillsData.strengths.length > 0 ? (
              <ul className="space-y-1.5">
                {skillsData.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-foreground">
                    <HiOutlineArrowTrendingUp className="w-3.5 h-3.5 text-[hsl(92_28%_60%)] mt-0.5 flex-shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">No strengths identified yet</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs font-mono uppercase text-muted-foreground tracking-wider flex items-center gap-1">
              <HiOutlineExclamationTriangle className="w-3.5 h-3.5 text-[hsl(14_51%_60%)]" />
              Knowledge Gaps
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            {Array.isArray(skillsData.gaps) && skillsData.gaps.length > 0 ? (
              <ul className="space-y-1.5">
                {skillsData.gaps.map((g, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-foreground">
                    <HiOutlineArrowTrendingDown className="w-3.5 h-3.5 text-[hsl(14_51%_60%)] mt-0.5 flex-shrink-0" />
                    {g}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">No gaps identified yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recommended Focus */}
      {Array.isArray(skillsData.recommended_focus) && skillsData.recommended_focus.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs font-mono uppercase text-muted-foreground tracking-wider">
              Recommended Focus Areas
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="flex flex-wrap gap-2">
              {skillsData.recommended_focus.map((f, i) => (
                <Badge key={i} variant="outline" className="text-xs border-accent text-accent">
                  {f}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Agent Info */}
      <Card className="bg-card border-border">
        <CardContent className="py-2 px-4">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span className="font-mono">Powered by NVIDIA AI Factory Learning Agents</span>
            <div className="flex items-center gap-3">
              <span>Skills Assessment</span>
              <span>Adaptive Learning</span>
              <span>Problem Solver</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
