'use client'

import React from 'react'
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

interface SidebarProps {
  currentView: ViewType
  onNavigate: (view: ViewType) => void
  domains: Record<string, number> | null
  mobileOpen: boolean
  onMobileToggle: () => void
  overallScore: number
}

const NAV_ITEMS: { key: ViewType; label: string; icon: React.ElementType; gradient: string }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: HiOutlineSquares2X2, gradient: 'gradient-blue' },
  { key: 'assessment', label: 'Assessment', icon: HiOutlineClipboardDocumentCheck, gradient: 'gradient-purple' },
  { key: 'learning', label: 'Learning', icon: HiOutlineAcademicCap, gradient: 'gradient-teal' },
  { key: 'problem-solving', label: 'Problem Solver', icon: HiOutlineWrenchScrewdriver, gradient: 'gradient-orange' },
  { key: 'skills-graph', label: 'Skills Graph', icon: HiOutlineChartBar, gradient: 'gradient-green' },
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

export default function Sidebar({ currentView, onNavigate, domains, mobileOpen, onMobileToggle, overallScore }: SidebarProps) {
  const radarData = domains
    ? Object.entries(domains).map(([key, value]) => ({
        domain: DOMAIN_SHORT[key] ?? key,
        score: typeof value === 'number' ? value : 0,
      }))
    : []

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg gradient-blue flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-sm font-mono">NV</span>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground tracking-tight">AI Factory</h1>
            <p className="text-[10px] text-muted-foreground">Learning Companion</p>
          </div>
        </div>
        <button
          onClick={onMobileToggle}
          className="md:hidden absolute top-5 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <HiOutlineXMark className="w-5 h-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1">
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
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all duration-200 group relative overflow-hidden',
                isActive
                  ? 'text-white font-medium shadow-lg'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
              )}
            >
              {isActive && (
                <div className={cn('absolute inset-0 opacity-90', item.gradient)} />
              )}
              <div className={cn(
                'relative z-10 w-7 h-7 rounded-lg flex items-center justify-center transition-colors',
                isActive ? 'bg-white/20' : 'bg-secondary group-hover:bg-muted'
              )}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="relative z-10">{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Mini Radar */}
      <div className="px-4 py-3 mx-3 mb-2 rounded-xl bg-secondary/50">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Skill Radar</p>
          {overallScore > 0 && (
            <span className="text-[11px] font-bold text-accent">{overallScore}%</span>
          )}
        </div>
        {radarData.length > 0 ? (
          <div className="h-[120px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="68%">
                <PolarGrid stroke="hsl(220 16% 28%)" strokeWidth={0.5} />
                <PolarAngleAxis
                  dataKey="domain"
                  tick={{ fill: 'hsl(219 14% 55%)', fontSize: 7 }}
                />
                <Radar
                  dataKey="score"
                  stroke="hsl(193 43% 65%)"
                  fill="hsl(193 43% 65%)"
                  fillOpacity={0.2}
                  strokeWidth={1.5}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[80px] flex items-center justify-center">
            <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
              Complete an assessment<br />to see your skill radar
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-border/50">
        <p className="text-[9px] text-muted-foreground/60 font-mono text-center">
          Powered by Perplexity Sonar Pro
        </p>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={onMobileToggle}
        className="md:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-card/90 backdrop-blur-sm border border-border text-foreground shadow-lg"
      >
        <HiOutlineBars3 className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={onMobileToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed md:sticky top-0 left-0 z-40 h-screen w-[220px] bg-card/95 backdrop-blur-md border-r border-border/60 flex-shrink-0 transition-transform duration-300 ease-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
