'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  HiOutlineSquares2X2,
  HiOutlineClipboardDocumentCheck,
  HiOutlineAcademicCap,
  HiOutlineWrenchScrewdriver,
  HiOutlineChartBar,
  HiOutlineBars3,
  HiOutlineXMark,
} from 'react-icons/hi2'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts'

type ViewType = 'dashboard' | 'assessment' | 'learning' | 'problem-solving' | 'skills-graph'

interface SkillsDomains {
  infrastructure: number
  networking: number
  storage: number
  orchestration: number
  gpu_management: number
  security: number
  mlops: number
  monitoring: number
}

interface SidebarProps {
  currentView: ViewType
  onNavigate: (view: ViewType) => void
  domains: SkillsDomains | null
  mobileOpen: boolean
  onMobileToggle: () => void
}

const NAV_ITEMS: { key: ViewType; label: string; icon: React.ElementType }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: HiOutlineSquares2X2 },
  { key: 'assessment', label: 'Assessment', icon: HiOutlineClipboardDocumentCheck },
  { key: 'learning', label: 'Learning', icon: HiOutlineAcademicCap },
  { key: 'problem-solving', label: 'Problem Solver', icon: HiOutlineWrenchScrewdriver },
  { key: 'skills-graph', label: 'Skills Graph', icon: HiOutlineChartBar },
]

const DOMAIN_SHORT: Record<string, string> = {
  infrastructure: 'Infra',
  networking: 'Net',
  storage: 'Stor',
  orchestration: 'Orch',
  gpu_management: 'GPU',
  security: 'Sec',
  mlops: 'MLOps',
  monitoring: 'Mon',
}

export default function Sidebar({ currentView, onNavigate, domains, mobileOpen, onMobileToggle }: SidebarProps) {
  const radarData = domains
    ? Object.entries(domains).map(([key, value]) => ({
        domain: DOMAIN_SHORT[key] ?? key,
        score: typeof value === 'number' ? value : 0,
      }))
    : []

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-accent flex items-center justify-center">
            <span className="text-accent-foreground font-bold text-xs font-mono">NV</span>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground leading-tight">NVIDIA AI Factory</h1>
            <p className="text-[10px] text-muted-foreground font-mono">Learning Companion</p>
          </div>
        </div>
        <button
          onClick={onMobileToggle}
          className="md:hidden p-1 rounded text-muted-foreground hover:text-foreground"
        >
          <HiOutlineXMark className="w-5 h-5" />
        </button>
      </div>

      <Separator className="bg-border" />

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = currentView === item.key
          return (
            <button
              key={item.key}
              onClick={() => {
                onNavigate(item.key)
                if (mobileOpen) onMobileToggle()
              }}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-2 rounded text-sm transition-colors',
                isActive
                  ? 'bg-accent text-accent-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>

      <Separator className="bg-border" />

      {/* Mini Radar */}
      <div className="px-3 py-3">
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Skill Radar</p>
        {radarData.length > 0 ? (
          <div className="h-[130px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                <PolarGrid stroke="hsl(220 16% 22%)" />
                <PolarAngleAxis
                  dataKey="domain"
                  tick={{ fill: 'hsl(219 14% 65%)', fontSize: 8 }}
                />
                <Radar
                  dataKey="score"
                  stroke="hsl(213 32% 52%)"
                  fill="hsl(213 32% 52%)"
                  fillOpacity={0.25}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[100px] flex items-center justify-center">
            <p className="text-[11px] text-muted-foreground text-center">Complete an assessment to see your skill radar</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2">
        <Badge variant="outline" className="text-[10px] font-mono w-full justify-center">
          v1.0 Adaptive Engine
        </Badge>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={onMobileToggle}
        className="md:hidden fixed top-3 left-3 z-50 p-2 rounded bg-card border border-border text-foreground"
      >
        <HiOutlineBars3 className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={onMobileToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed md:sticky top-0 left-0 z-40 h-screen w-56 bg-card border-r border-border flex-shrink-0 transition-transform duration-200',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
