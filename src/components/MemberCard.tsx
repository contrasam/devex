'use client'

import { TrendingUp, TrendingDown, Minus, Zap, CheckCircle2, ListTodo } from 'lucide-react'
import type { MemberWithHistory } from '@/types'
import Avatar from './ui/Avatar'
import Sparkline from './ui/Sparkline'

interface MemberCardProps {
  member: MemberWithHistory
  rank: number
  onClick: () => void
}

export default function MemberCard({ member, rank, onClick }: MemberCardProps) {
  const isUp = member.price_change_24h > 0
  const isFlat = member.price_change_24h === 0
  const positive = isUp || isFlat

  const changeColor = isFlat
    ? 'text-zinc-400'
    : isUp
    ? 'text-emerald-400'
    : 'text-red-400'

  const changeBg = isFlat
    ? 'bg-zinc-800'
    : isUp
    ? 'bg-emerald-400/10'
    : 'bg-red-400/10'

  const TrendIcon = isFlat ? Minus : isUp ? TrendingUp : TrendingDown

  const rankColors: Record<number, string> = {
    1: 'text-yellow-400',
    2: 'text-zinc-300',
    3: 'text-amber-600',
  }

  return (
    <button
      onClick={onClick}
      className="group bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-600 hover:bg-zinc-800/50 transition-all duration-200 text-left w-full"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <Avatar seed={member.avatar_seed} name={member.name} size="md" />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-white text-sm leading-tight">{member.name}</span>
              {rank <= 3 && (
                <span className={`text-xs font-bold ${rankColors[rank]}`}>
                  #{rank}
                </span>
              )}
            </div>
            <span className="text-zinc-500 text-xs">{member.role}</span>
          </div>
        </div>

        {/* Streak badge */}
        {member.streak >= 3 && (
          <div className="flex items-center gap-1 bg-orange-500/10 border border-orange-500/20 rounded-full px-2 py-0.5">
            <Zap className="w-3 h-3 text-orange-400" />
            <span className="text-orange-400 text-xs font-semibold">{member.streak}</span>
          </div>
        )}
      </div>

      {/* Sparkline */}
      <div className="mb-3">
        <Sparkline history={member.price_history} positive={positive} height={44} />
      </div>

      {/* Price */}
      <div className="flex items-end justify-between">
        <div>
          <div className="text-white text-xl font-bold font-mono tracking-tight">
            ${member.current_price.toFixed(2)}
          </div>
          <div className={`flex items-center gap-1 text-xs font-medium mt-0.5 ${changeColor}`}>
            <TrendIcon className="w-3.5 h-3.5" />
            <span>
              {isFlat ? '—' : `${isUp ? '+' : ''}${member.price_change_24h.toFixed(2)}`}
              {!isFlat && ` (${isUp ? '+' : ''}${member.price_change_pct.toFixed(1)}%)`}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-3 text-right">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 text-zinc-500">
              <ListTodo className="w-3 h-3" />
            </div>
            <span className="text-white text-sm font-semibold">{member.open_tasks}</span>
            <span className="text-zinc-600 text-xs">open</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 text-zinc-500">
              <CheckCircle2 className="w-3 h-3" />
            </div>
            <span className="text-white text-sm font-semibold">{member.completed_tasks}</span>
            <span className="text-zinc-600 text-xs">done</span>
          </div>
        </div>
      </div>

      {/* Demand indicator bar */}
      <div className="mt-3">
        <div className="flex justify-between text-xs text-zinc-500 mb-1">
          <span>Demand</span>
          <span>{member.open_tasks} tasks in queue</span>
        </div>
        <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              member.open_tasks >= 5
                ? 'bg-red-500'
                : member.open_tasks >= 3
                ? 'bg-orange-500'
                : member.open_tasks >= 1
                ? 'bg-yellow-500'
                : 'bg-zinc-600'
            }`}
            style={{ width: `${Math.min((member.open_tasks / 6) * 100, 100)}%` }}
          />
        </div>
      </div>
    </button>
  )
}
