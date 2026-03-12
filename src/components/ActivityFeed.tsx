'use client'

import { formatDistanceToNow } from 'date-fns'
import { TrendingUp, TrendingDown } from 'lucide-react'
import type { TickerEvent } from '@/types'
import Avatar from './ui/Avatar'

interface ActivityFeedProps {
  events: TickerEvent[]
}

export default function ActivityFeed({ events }: ActivityFeedProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800">
        <h3 className="text-white font-semibold text-sm">Live Activity</h3>
        <p className="text-zinc-500 text-xs mt-0.5">Real-time market events</p>
      </div>

      <div className="divide-y divide-zinc-800/60 max-h-96 overflow-y-auto">
        {events.length === 0 && (
          <div className="px-4 py-8 text-center text-zinc-600 text-sm">
            No activity yet
          </div>
        )}
        {events.map((event) => {
          const diff = event.price_after - event.price_before
          const isUp = diff >= 0
          return (
            <div key={event.id} className="flex items-start gap-3 px-4 py-3 hover:bg-zinc-800/30 transition-colors">
              {event.team_member && (
                <Avatar
                  seed={event.team_member.avatar_seed}
                  name={event.team_member.name}
                  size="sm"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-zinc-300 text-xs leading-snug">{event.description}</p>
                <p className="text-zinc-600 text-xs mt-0.5">
                  {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                </p>
              </div>
              <div
                className={`flex items-center gap-1 text-xs font-bold font-mono shrink-0 ${
                  isUp ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {isUp ? '+' : ''}${diff.toFixed(2)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
