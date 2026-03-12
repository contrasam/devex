'use client'

import { TrendingUp, TrendingDown, Users, ListChecks, Activity } from 'lucide-react'
import type { MemberWithHistory } from '@/types'

interface MarketHeaderProps {
  members: MemberWithHistory[]
  totalTasks: number
}

export default function MarketHeader({ members, totalTasks }: MarketHeaderProps) {
  const topGainer = members.reduce((a, b) =>
    a.price_change_pct > b.price_change_pct ? a : b
  )
  const topLoser = members.reduce((a, b) =>
    a.price_change_pct < b.price_change_pct ? a : b
  )
  const avgPrice = members.reduce((s, m) => s + m.current_price, 0) / members.length
  const marketUp = members.filter((m) => m.price_change_24h > 0).length
  const marketDown = members.filter((m) => m.price_change_24h < 0).length

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {/* Market index */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-4 h-4 text-indigo-400" />
          <span className="text-zinc-500 text-xs">DevEx Index</span>
        </div>
        <div className="text-white font-bold text-xl font-mono">
          ${avgPrice.toFixed(2)}
        </div>
        <div className="text-zinc-500 text-xs mt-1">
          {marketUp}↑ {marketDown}↓ today
        </div>
      </div>

      {/* Top gainer */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span className="text-zinc-500 text-xs">Top Gainer</span>
        </div>
        <div className="text-white font-semibold text-sm truncate">{topGainer.name.split(' ')[0]}</div>
        <div className="text-emerald-400 text-sm font-bold font-mono">
          +{topGainer.price_change_pct.toFixed(1)}%
        </div>
      </div>

      {/* Top loser */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <TrendingDown className="w-4 h-4 text-red-400" />
          <span className="text-zinc-500 text-xs">Most Volatile</span>
        </div>
        <div className="text-white font-semibold text-sm truncate">{topLoser.name.split(' ')[0]}</div>
        <div className="text-red-400 text-sm font-bold font-mono">
          {topLoser.price_change_pct.toFixed(1)}%
        </div>
      </div>

      {/* Team stats */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-4 h-4 text-blue-400" />
          <span className="text-zinc-500 text-xs">Team</span>
        </div>
        <div className="text-white font-bold text-xl">{members.length}</div>
        <div className="flex items-center gap-1 text-zinc-500 text-xs mt-1">
          <ListChecks className="w-3 h-3" />
          {totalTasks} tasks tracked
        </div>
      </div>
    </div>
  )
}
