'use client'

import { useState } from 'react'
import { X, Zap, ChevronDown } from 'lucide-react'
import type { MemberWithHistory, Priority } from '@/types'
import { PRIORITY_BG, PRIORITY_COLORS, PRICE_IMPACT } from '@/types'
import Avatar from './ui/Avatar'

interface AssignTaskModalProps {
  members: MemberWithHistory[]
  defaultMemberId?: string
  onClose: () => void
  onAssign: (title: string, description: string, memberId: string, priority: Priority) => Promise<void>
}

const PRIORITIES: { value: Priority; label: string; emoji: string }[] = [
  { value: 'low', label: 'Low', emoji: '🟦' },
  { value: 'medium', label: 'Medium', emoji: '🟨' },
  { value: 'high', label: 'High', emoji: '🟧' },
  { value: 'critical', label: 'Critical', emoji: '🔴' },
]

export default function AssignTaskModal({
  members,
  defaultMemberId,
  onClose,
  onAssign,
}: AssignTaskModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [memberId, setMemberId] = useState(defaultMemberId ?? members[0]?.id ?? '')
  const [priority, setPriority] = useState<Priority>('medium')
  const [loading, setLoading] = useState(false)

  const selectedMember = members.find((m) => m.id === memberId)

  // Price impact preview
  const baseImpact = PRICE_IMPACT.priority[priority]
  const demandMult = selectedMember
    ? PRICE_IMPACT.demand_multiplier(selectedMember.open_tasks)
    : 1
  const estimatedImpact = parseFloat((baseImpact * demandMult).toFixed(2))
  const newPrice = selectedMember
    ? parseFloat((selectedMember.current_price + estimatedImpact).toFixed(2))
    : 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !memberId) return
    setLoading(true)
    try {
      await onAssign(title.trim(), description.trim(), memberId, priority)
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <div>
            <h2 className="text-white font-semibold text-base">Assign a Task</h2>
            <p className="text-zinc-500 text-xs mt-0.5">
              Demand drives value — assign wisely
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Title */}
          <div>
            <label className="text-zinc-400 text-xs font-medium block mb-1.5">
              Task Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Fix auth token refresh bug"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-zinc-400 text-xs font-medium block mb-1.5">
              Description
              <span className="text-zinc-600 ml-1">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Any context for the assignee..."
              rows={2}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="text-zinc-400 text-xs font-medium block mb-1.5">
              Priority
            </label>
            <div className="grid grid-cols-4 gap-2">
              {PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriority(p.value)}
                  className={`border rounded-lg py-2 text-center transition-all ${
                    priority === p.value
                      ? `${PRIORITY_BG[p.value]} ${PRIORITY_COLORS[p.value]} border-current`
                      : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-zinc-600'
                  }`}
                >
                  <div className="text-base">{p.emoji}</div>
                  <div className="text-xs font-medium mt-0.5">{p.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Assignee */}
          <div>
            <label className="text-zinc-400 text-xs font-medium block mb-1.5">
              Assign to
            </label>
            <div className="relative">
              <select
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors appearance-none pr-8"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} — {m.open_tasks} open tasks
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
            </div>
          </div>

          {/* Price impact preview */}
          {selectedMember && (
            <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-3.5 h-3.5 text-yellow-400" />
                <span className="text-zinc-400 text-xs font-medium">
                  Price Impact Preview
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Avatar
                  seed={selectedMember.avatar_seed}
                  name={selectedMember.name}
                  size="sm"
                />
                <div className="flex-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-zinc-400 text-xs">Current</span>
                    <span className="text-white text-xs font-mono">
                      ${selectedMember.current_price.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-zinc-400 text-xs">After assign</span>
                    <span className="text-emerald-400 text-sm font-bold font-mono">
                      ${newPrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-zinc-500 text-xs">
                      {demandMult > 1 && (
                        <span className="text-orange-400">
                          {selectedMember.open_tasks} tasks = {demandMult}x demand
                        </span>
                      )}
                    </span>
                    <span className="text-emerald-400 text-xs">
                      +${estimatedImpact.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!title.trim() || loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
          >
            {loading ? 'Assigning...' : 'Assign Task'}
          </button>
        </form>
      </div>
    </div>
  )
}
