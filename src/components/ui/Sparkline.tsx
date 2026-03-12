'use client'

import { ResponsiveContainer, AreaChart, Area } from 'recharts'
import type { PriceHistory } from '@/types'

interface SparklineProps {
  history: PriceHistory[]
  positive: boolean
  height?: number
}

export default function Sparkline({ history, positive, height = 48 }: SparklineProps) {
  const data = history.map((h) => ({ price: h.price }))

  const color = positive ? '#22c55e' : '#ef4444'
  const gradientId = `grad-${positive ? 'up' : 'down'}-${Math.random().toString(36).slice(2, 6)}`

  if (data.length < 2) {
    return <div style={{ height }} className="flex items-center justify-center text-zinc-600 text-xs">No data</div>
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="price"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#${gradientId})`}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
