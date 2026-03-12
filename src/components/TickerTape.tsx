'use client'

import { useEffect, useRef } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import type { MemberWithHistory } from '@/types'
import Avatar from './ui/Avatar'

interface TickerTapeProps {
  members: MemberWithHistory[]
}

export default function TickerTape({ members }: TickerTapeProps) {
  const trackRef = useRef<HTMLDivElement>(null)

  // Duplicate items for seamless infinite scroll via CSS animation
  const items = [...members, ...members, ...members]

  return (
    <div className="w-full overflow-hidden bg-zinc-950 border-b border-zinc-800/50 py-2 relative">
      {/* Left fade */}
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-zinc-950 to-transparent z-10 pointer-events-none" />
      {/* Right fade */}
      <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-zinc-950 to-transparent z-10 pointer-events-none" />

      <div
        ref={trackRef}
        className="flex gap-6 animate-ticker whitespace-nowrap"
        style={{ width: 'max-content' }}
      >
        {items.map((member, i) => {
          const isUp = member.price_change_24h >= 0
          return (
            <div
              key={`${member.id}-${i}`}
              className="flex items-center gap-2 px-3 py-0.5 rounded-md bg-zinc-900/40 border border-zinc-800/60"
            >
              <Avatar seed={member.avatar_seed} name={member.name} size="sm" />
              <span className="text-zinc-300 text-xs font-medium">
                {member.name.split(' ')[0].toUpperCase()}
              </span>
              <span className="text-white text-xs font-mono font-bold">
                ${member.current_price.toFixed(2)}
              </span>
              <span
                className={`flex items-center gap-0.5 text-xs font-semibold ${
                  isUp ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {isUp ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {isUp ? '+' : ''}
                {member.price_change_pct.toFixed(1)}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
