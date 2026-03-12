'use client'

import { X, TrendingUp, TrendingDown, Zap, CheckCircle2, ListTodo, Plus } from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { format } from 'date-fns'
import type { MemberWithHistory } from '@/types'
import Avatar from './ui/Avatar'

interface MemberDetailModalProps {
  member: MemberWithHistory
  onClose: () => void
  onAssign?: () => void
}

export default function MemberDetailModal({
  member,
  onClose,
  onAssign,
}: MemberDetailModalProps) {
  const isUp = member.price_change_24h >= 0
  const chartData = member.price_history.map((h) => ({
    time: format(new Date(h.recorded_at), 'MMM d HH:mm'),
    price: h.price,
  }))

  const color = isUp ? '#22c55e' : '#ef4444'
  const roi = (((member.current_price - member.base_price) / member.base_price) * 100).toFixed(1)
  const roiPositive = parseFloat(roi) >= 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <Avatar seed={member.avatar_seed} name={member.name} size="lg" />
            <div>
              <h2 className="text-white font-bold text-lg">{member.name}</h2>
              <span className="text-zinc-500 text-sm">{member.role}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Price info row */}
          <div className="flex items-end gap-4">
            <div>
              <div className="text-white text-3xl font-bold font-mono tracking-tighter">
                ${member.current_price.toFixed(2)}
              </div>
              <div
                className={`flex items-center gap-1 text-sm font-semibold mt-1 ${
                  isUp ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {isUp ? '+' : ''}
                {member.price_change_24h.toFixed(2)} ({isUp ? '+' : ''}
                {member.price_change_pct.toFixed(1)}%) 24h
              </div>
            </div>
            <div className="ml-auto text-right">
              <div className={`text-sm font-bold ${roiPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                {roiPositive ? '+' : ''}{roi}% ROI
              </div>
              <div className="text-zinc-600 text-xs">vs base ${member.base_price.toFixed(2)}</div>
            </div>
          </div>

          {/* Chart */}
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="detail-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="time" hide />
                <YAxis
                  domain={['auto', 'auto']}
                  tick={{ fill: '#52525b', fontSize: 10 }}
                  width={38}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip
                  contentStyle={{
                    background: '#18181b',
                    border: '1px solid #3f3f46',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: '#a1a1aa' }}
                  formatter={(v) => [`$${Number(v).toFixed(2)}`, 'Price']}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={color}
                  strokeWidth={2}
                  fill="url(#detail-grad)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: ListTodo, label: 'Open Tasks', value: member.open_tasks, color: 'text-blue-400' },
              { icon: CheckCircle2, label: 'Completed', value: member.completed_tasks, color: 'text-emerald-400' },
              { icon: Zap, label: 'Streak', value: member.streak, color: 'text-orange-400' },
            ].map(({ icon: Icon, label, value, color: c }) => (
              <div key={label} className="bg-zinc-800/50 rounded-xl p-3 text-center">
                <Icon className={`w-4 h-4 mx-auto mb-1 ${c}`} />
                <div className="text-white font-bold text-lg">{value}</div>
                <div className="text-zinc-500 text-xs">{label}</div>
              </div>
            ))}
          </div>

          {/* Assign button — manager only */}
          {onAssign && (
            <button
              onClick={() => { onClose(); onAssign() }}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              Assign work to {member.name.split(' ')[0]}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
