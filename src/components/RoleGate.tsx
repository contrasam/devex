'use client'

import { TrendingUp, Shield, Code2 } from 'lucide-react'
import type { AppRole } from '@/types'

interface RoleGateProps {
  onSelect: (role: AppRole) => void
}

export default function RoleGate({ onSelect }: RoleGateProps) {
  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 flex items-center justify-center p-4">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-white text-2xl font-bold">DevEx</h1>
          <p className="text-zinc-500 text-sm mt-1">Gamified Team Productivity</p>
        </div>

        <p className="text-zinc-400 text-sm text-center mb-6">How are you joining today?</p>

        <div className="space-y-3">
          {/* Manager */}
          <button
            onClick={() => onSelect('manager')}
            className="w-full group bg-zinc-900 border border-zinc-700 hover:border-indigo-500 rounded-2xl p-5 text-left transition-all duration-200 hover:bg-zinc-800/60"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-indigo-600/20 border border-indigo-500/30 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-indigo-600/30 transition-colors">
                <Shield className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <div className="text-white font-semibold text-sm">Team Manager</div>
                <div className="text-zinc-500 text-xs mt-1 leading-relaxed">
                  Assign work, manage the team roster, customise work categories, and view the full analytics dashboard.
                </div>
              </div>
            </div>
          </button>

          {/* Developer */}
          <button
            onClick={() => onSelect('developer')}
            className="w-full group bg-zinc-900 border border-zinc-700 hover:border-emerald-500 rounded-2xl p-5 text-left transition-all duration-200 hover:bg-zinc-800/60"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-emerald-600/20 border border-emerald-500/30 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-emerald-600/30 transition-colors">
                <Code2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="text-white font-semibold text-sm">Developer</div>
                <div className="text-zinc-500 text-xs mt-1 leading-relaxed">
                  View the team leaderboard, track your assigned work, and mark tasks as complete.
                </div>
              </div>
            </div>
          </button>
        </div>

        <p className="text-zinc-700 text-xs text-center mt-6">
          You can switch roles any time from the nav bar
        </p>
      </div>
    </div>
  )
}
