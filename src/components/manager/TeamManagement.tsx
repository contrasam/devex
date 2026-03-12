'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, X, Check, TrendingUp, TrendingDown } from 'lucide-react'
import type { MemberWithHistory } from '@/types'
import Avatar from '@/components/ui/Avatar'

interface TeamManagementProps {
  members: MemberWithHistory[]
  onAdd: (name: string, role: string, basePrice: number) => Promise<void>
  onEdit: (id: string, name: string, role: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

interface MemberFormState {
  name: string
  role: string
  basePrice: string
}

const BLANK: MemberFormState = { name: '', role: '', basePrice: '100' }

export default function TeamManagement({ members, onAdd, onEdit, onDelete }: TeamManagementProps) {
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<MemberFormState>(BLANK)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function startEdit(member: MemberWithHistory) {
    setEditingId(member.id)
    setForm({ name: member.name, role: member.role, basePrice: String(member.base_price) })
    setShowAdd(false)
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(BLANK)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.role.trim()) return
    setLoading(true)
    try {
      await onAdd(form.name.trim(), form.role.trim(), parseFloat(form.basePrice) || 100)
      setForm(BLANK)
      setShowAdd(false)
    } finally {
      setLoading(false)
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingId || !form.name.trim() || !form.role.trim()) return
    setLoading(true)
    try {
      await onEdit(editingId, form.name.trim(), form.role.trim())
      cancelEdit()
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    setLoading(true)
    try {
      await onDelete(id)
      setDeletingId(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold text-sm">Team Roster</h3>
          <p className="text-zinc-500 text-xs mt-0.5">{members.length} members</p>
        </div>
        <button
          onClick={() => { setShowAdd(true); cancelEdit() }}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Member
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="bg-zinc-800/60 border border-zinc-700 rounded-xl p-4 space-y-3">
          <div className="text-zinc-300 text-xs font-semibold mb-1">New Team Member</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-zinc-500 text-xs block mb-1">Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Full name"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="text-zinc-500 text-xs block mb-1">Job Role *</label>
              <input
                type="text"
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                placeholder="e.g. Frontend Engineer"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
          </div>
          <div>
            <label className="text-zinc-500 text-xs block mb-1">Starting Price ($)</label>
            <input
              type="number"
              min="10"
              max="1000"
              step="10"
              value={form.basePrice}
              onChange={(e) => setForm((f) => ({ ...f, basePrice: e.target.value }))}
              className="w-32 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              {loading ? 'Adding...' : 'Add to Team'}
            </button>
            <button
              type="button"
              onClick={() => { setShowAdd(false); setForm(BLANK) }}
              className="flex items-center gap-1 text-zinc-500 hover:text-white text-xs px-2 py-1.5 rounded-lg hover:bg-zinc-700 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Member list */}
      <div className="divide-y divide-zinc-800 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        {members.map((member) => {
          const isUp = member.price_change_24h >= 0
          const isEditing = editingId === member.id

          return (
            <div key={member.id} className="p-4">
              {isEditing ? (
                <form onSubmit={handleEdit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-zinc-500 text-xs block mb-1">Name</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-zinc-500 text-xs block mb-1">Job Role</label>
                      <input
                        type="text"
                        value={form.role}
                        onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                        className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" disabled={loading} className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                      <Check className="w-3 h-3" /> Save
                    </button>
                    <button type="button" onClick={cancelEdit} className="flex items-center gap-1 text-zinc-500 hover:text-white text-xs px-2 py-1.5 rounded-lg hover:bg-zinc-700 transition-colors">
                      <X className="w-3 h-3" /> Cancel
                    </button>
                  </div>
                </form>
              ) : deletingId === member.id ? (
                <div className="flex items-center justify-between">
                  <span className="text-zinc-300 text-sm">Remove <span className="text-white font-semibold">{member.name}</span>?</span>
                  <div className="flex gap-2">
                    <button onClick={() => handleDelete(member.id)} disabled={loading} className="text-red-400 hover:text-red-300 text-xs font-semibold px-3 py-1.5 bg-red-400/10 border border-red-400/20 rounded-lg transition-colors">
                      {loading ? 'Removing...' : 'Confirm Remove'}
                    </button>
                    <button onClick={() => setDeletingId(null)} className="text-zinc-500 hover:text-white text-xs px-2 py-1.5 rounded-lg hover:bg-zinc-700 transition-colors">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Avatar seed={member.avatar_seed} name={member.name} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-medium">{member.name}</span>
                      <span className="text-zinc-500 text-xs">·</span>
                      <span className="text-zinc-400 text-xs">{member.role}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-white text-xs font-mono font-semibold">${member.current_price.toFixed(2)}</span>
                      <span className={`flex items-center gap-0.5 text-xs ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {isUp ? '+' : ''}{member.price_change_pct.toFixed(1)}%
                      </span>
                      <span className="text-zinc-600 text-xs">{member.open_tasks} open · {member.completed_tasks} done</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => startEdit(member)}
                      className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-700 rounded-lg transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingId(member.id)}
                      className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
