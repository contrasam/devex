'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, X, Check, ToggleLeft, ToggleRight } from 'lucide-react'
import type { WorkCategory } from '@/types'
import { CATEGORY_COLOR_MAP, CATEGORY_COLOR_OPTIONS } from '@/types'

interface CategoryManagerProps {
  categories: WorkCategory[]
  onCreate: (input: Omit<WorkCategory, 'id' | 'created_at'>) => Promise<void>
  onUpdate: (id: string, input: Partial<Omit<WorkCategory, 'id' | 'created_at'>>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

type FormState = {
  name: string
  emoji: string
  description: string
  base_multiplier: string
  color: string
}

const BLANK: FormState = { name: '', emoji: '📋', description: '', base_multiplier: '1.0', color: 'indigo' }

const EMOJI_SUGGESTIONS = ['📋', '🔍', '🖥️', '⚙️', '🎨', '🏗️', '🚀', '🐛', '📚', '🔐', '📊', '💡', '🧪', '🔧', '⚡']

export default function CategoryManager({ categories, onCreate, onUpdate, onDelete }: CategoryManagerProps) {
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(BLANK)
  const [loading, setLoading] = useState(false)

  function f(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function startEdit(cat: WorkCategory) {
    setEditingId(cat.id)
    setForm({
      name: cat.name,
      emoji: cat.emoji,
      description: cat.description,
      base_multiplier: String(cat.base_multiplier),
      color: cat.color,
    })
    setShowAdd(false)
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(BLANK)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setLoading(true)
    try {
      await onCreate({
        name: form.name.trim(),
        emoji: form.emoji,
        description: form.description.trim(),
        base_multiplier: parseFloat(form.base_multiplier) || 1.0,
        color: form.color,
        is_active: true,
      })
      setForm(BLANK)
      setShowAdd(false)
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!editingId || !form.name.trim()) return
    setLoading(true)
    try {
      await onUpdate(editingId, {
        name: form.name.trim(),
        emoji: form.emoji,
        description: form.description.trim(),
        base_multiplier: parseFloat(form.base_multiplier) || 1.0,
        color: form.color,
      })
      cancelEdit()
    } finally {
      setLoading(false)
    }
  }

  async function handleToggle(cat: WorkCategory) {
    setLoading(true)
    try {
      await onUpdate(cat.id, { is_active: !cat.is_active })
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

  function CategoryForm({ onSubmit, submitLabel }: { onSubmit: (e: React.FormEvent) => void; submitLabel: string }) {
    return (
      <form onSubmit={onSubmit} className="bg-zinc-800/60 border border-zinc-700 rounded-xl p-4 space-y-4">
        {/* Emoji picker + Name */}
        <div className="flex gap-3">
          <div>
            <label className="text-zinc-500 text-xs block mb-1">Icon</label>
            <div className="relative">
              <select
                value={form.emoji}
                onChange={(e) => f('emoji', e.target.value)}
                className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-2 text-lg focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer w-14 text-center"
              >
                {EMOJI_SUGGESTIONS.map((em) => (
                  <option key={em} value={em}>{em}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex-1">
            <label className="text-zinc-500 text-xs block mb-1">Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => f('name', e.target.value)}
              placeholder="e.g. Security Review"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
              required
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-zinc-500 text-xs block mb-1">Description</label>
          <input
            type="text"
            value={form.description}
            onChange={(e) => f('description', e.target.value)}
            placeholder="What kind of work does this cover?"
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Multiplier + Color */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-zinc-500 text-xs block mb-1">
              Price Multiplier
              <span className="text-zinc-600 ml-1">( × base )</span>
            </label>
            <input
              type="number"
              min="0.1"
              max="5.0"
              step="0.1"
              value={form.base_multiplier}
              onChange={(e) => f('base_multiplier', e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
            <p className="text-zinc-700 text-xs mt-1">
              1.0 = neutral · &gt;1 = more impact · &lt;1 = less
            </p>
          </div>
          <div>
            <label className="text-zinc-500 text-xs block mb-1">Colour</label>
            <select
              value={form.color}
              onChange={(e) => f('color', e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 capitalize"
            >
              {CATEGORY_COLOR_OPTIONS.map((c) => (
                <option key={c} value={c} className="capitalize">{c}</option>
              ))}
            </select>
            {/* Preview */}
            <div className={`mt-1.5 inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border ${CATEGORY_COLOR_MAP[form.color]?.badge} ${CATEGORY_COLOR_MAP[form.color]?.text}`}>
              <span>{form.emoji}</span>
              <span>{form.name || 'Preview'}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={loading || !form.name.trim()}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            {loading ? 'Saving...' : submitLabel}
          </button>
          <button
            type="button"
            onClick={() => { setShowAdd(false); cancelEdit() }}
            className="flex items-center gap-1 text-zinc-500 hover:text-white text-xs px-2 py-1.5 rounded-lg hover:bg-zinc-700 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Cancel
          </button>
        </div>
      </form>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold text-sm">Work Categories</h3>
          <p className="text-zinc-500 text-xs mt-0.5">
            Customise work types and their price impact multipliers
          </p>
        </div>
        <button
          onClick={() => { setShowAdd(true); cancelEdit() }}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          New Category
        </button>
      </div>

      {/* Add form */}
      {showAdd && <CategoryForm onSubmit={handleCreate} submitLabel="Create Category" />}

      {/* Category list */}
      <div className="divide-y divide-zinc-800 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        {categories.map((cat) => {
          const colors = CATEGORY_COLOR_MAP[cat.color] ?? CATEGORY_COLOR_MAP.zinc
          const isEditing = editingId === cat.id

          return (
            <div key={cat.id} className={`p-4 transition-opacity ${!cat.is_active ? 'opacity-40' : ''}`}>
              {isEditing ? (
                <CategoryForm onSubmit={handleUpdate} submitLabel="Save Changes" />
              ) : deletingId === cat.id ? (
                <div className="flex items-center justify-between">
                  <span className="text-zinc-300 text-sm">Delete <span className="text-white font-semibold">{cat.emoji} {cat.name}</span>?</span>
                  <div className="flex gap-2">
                    <button onClick={() => handleDelete(cat.id)} disabled={loading} className="text-red-400 text-xs font-semibold px-3 py-1.5 bg-red-400/10 border border-red-400/20 rounded-lg">
                      {loading ? 'Deleting...' : 'Delete'}
                    </button>
                    <button onClick={() => setDeletingId(null)} className="text-zinc-500 hover:text-white text-xs px-2 py-1.5 rounded-lg hover:bg-zinc-700 transition-colors">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base border ${colors.badge} shrink-0`}>
                    {cat.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${colors.text}`}>{cat.name}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full border font-mono ${colors.badge} ${colors.text}`}>
                        ×{cat.base_multiplier.toFixed(1)}
                      </span>
                    </div>
                    {cat.description && (
                      <p className="text-zinc-500 text-xs mt-0.5 truncate">{cat.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggle(cat)}
                      className="p-1.5 text-zinc-500 hover:text-white rounded-lg hover:bg-zinc-700 transition-colors"
                      title={cat.is_active ? 'Disable category' : 'Enable category'}
                    >
                      {cat.is_active
                        ? <ToggleRight className="w-4 h-4 text-emerald-400" />
                        : <ToggleLeft className="w-4 h-4" />
                      }
                    </button>
                    <button onClick={() => startEdit(cat)} className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-700 rounded-lg transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeletingId(cat.id)} className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
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
