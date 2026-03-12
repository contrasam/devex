'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { TrendingUp, Users, Tag, LayoutGrid, ArrowLeft, Plus, Shield } from 'lucide-react'
import type { MemberWithHistory, TickerEvent, Task, WorkCategory, Priority } from '@/types'
import { MOCK_MEMBERS, MOCK_EVENTS, MOCK_TASKS, MOCK_CATEGORIES } from '@/lib/mock-data'
import { calculateImpact, PRICE_IMPACT } from '@/types'
import { useRole } from '@/hooks/useRole'
import TeamManagement from '@/components/manager/TeamManagement'
import CategoryManager from '@/components/manager/CategoryManager'
import AssignTaskModal from '@/components/AssignTaskModal'
import TaskList from '@/components/TaskList'
import ActivityFeed from '@/components/ActivityFeed'
import MarketHeader from '@/components/MarketHeader'
import MemberCard from '@/components/MemberCard'
import MemberDetailModal from '@/components/MemberDetailModal'
import { isConfigured } from '@/lib/supabase'

const IS_MOCK = !isConfigured

type Tab = 'overview' | 'team' | 'categories'

export default function ManagerPage() {
  const { role, ready } = useRole()
  const [tab, setTab] = useState<Tab>('overview')
  const [members, setMembers] = useState<MemberWithHistory[]>(MOCK_MEMBERS)
  const [events, setEvents] = useState<TickerEvent[]>(MOCK_EVENTS)
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS)
  const [categories, setCategories] = useState<WorkCategory[]>(MOCK_CATEGORIES)
  const [loading, setLoading] = useState(!IS_MOCK)
  const [showAssign, setShowAssign] = useState(false)
  const [assignDefaultId, setAssignDefaultId] = useState<string | undefined>()
  const [selectedMember, setSelectedMember] = useState<MemberWithHistory | null>(null)

  const loadData = useCallback(async () => {
    if (IS_MOCK) return
    try {
      const { getMembers, getTickerEvents, getTasks, getCategories } = await import('@/lib/supabase')
      const [m, e, t, c] = await Promise.all([getMembers(), getTickerEvents(), getTasks(), getCategories()])
      setMembers(m)
      setEvents(e)
      setTasks(t)
      setCategories(c)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // ─── Assign work ───────────────────────────────────────────────────────────

  async function handleAssign(
    title: string,
    description: string,
    memberId: string,
    priority: Priority,
    categoryId: string,
    categoryMultiplier: number
  ) {
    if (IS_MOCK) {
      const member = members.find((m) => m.id === memberId)!
      const category = categories.find((c) => c.id === categoryId)
      const impact = calculateImpact(priority, categoryMultiplier, member.open_tasks)
      const newPrice = parseFloat((member.current_price + impact).toFixed(2))

      const newTask: Task = {
        id: `mock-${Date.now()}`, title, description: description || null,
        assigned_to: memberId, work_category_id: categoryId, priority, status: 'open',
        price_impact: impact, created_at: new Date().toISOString(), completed_at: null, due_date: null,
        team_member: member, work_category: category,
      }
      setTasks((prev) => [newTask, ...prev])
      setMembers((prev) =>
        prev.map((m) => m.id === memberId
          ? { ...m, current_price: newPrice, open_tasks: m.open_tasks + 1, price_change_24h: m.price_change_24h + impact,
              price_history: [...m.price_history, { id: `h-${Date.now()}`, member_id: memberId, price: newPrice, event_type: 'assigned' as const, recorded_at: new Date().toISOString() }] }
          : m
        ).sort((a, b) => b.current_price - a.current_price)
      )
      setEvents((prev) => [{
        id: `mock-evt-${Date.now()}`, member_id: memberId, task_id: newTask.id, event_type: 'assigned',
        description: `${category?.emoji ?? '📋'} "${title}" assigned — ${priority} · ${category?.name ?? ''}`,
        price_before: member.current_price, price_after: newPrice,
        created_at: new Date().toISOString(), team_member: member,
      }, ...prev])
      return
    }
    const { assignTask } = await import('@/lib/supabase')
    await assignTask(title, description || null, memberId, priority, categoryId, categoryMultiplier)
    await loadData()
  }

  // ─── Complete task ─────────────────────────────────────────────────────────

  async function handleComplete(taskId: string) {
    if (IS_MOCK) {
      const task = tasks.find((t) => t.id === taskId)
      if (!task?.team_member) return
      const member = task.team_member as MemberWithHistory
      const bonus = PRICE_IMPACT.completion_bonus(member.streak ?? 0)
      const newPrice = parseFloat((member.current_price + bonus).toFixed(2))
      setTasks((prev) => prev.filter((t) => t.id !== taskId))
      setMembers((prev) =>
        prev.map((m) => m.id === member.id
          ? { ...m, current_price: newPrice, open_tasks: Math.max(0, m.open_tasks - 1), completed_tasks: m.completed_tasks + 1, streak: m.streak + 1, price_change_24h: m.price_change_24h + bonus }
          : m
        ).sort((a, b) => b.current_price - a.current_price)
      )
      setEvents((prev) => [{
        id: `mock-comp-${Date.now()}`, member_id: member.id, task_id: taskId, event_type: 'completed',
        description: `✅ "${task.title}" completed — streak x${(member.streak ?? 0) + 1}`,
        price_before: member.current_price, price_after: newPrice,
        created_at: new Date().toISOString(), team_member: member,
      }, ...prev])
      return
    }
    const { completeTask } = await import('@/lib/supabase')
    await completeTask(taskId)
    await loadData()
  }

  // ─── Team CRUD ─────────────────────────────────────────────────────────────

  async function handleAddMember(name: string, role: string, basePrice: number) {
    if (IS_MOCK) {
      const newMember: MemberWithHistory = {
        id: `mock-m-${Date.now()}`, name, role, avatar_seed: name.toLowerCase().replace(/\s+/g, '-'),
        current_price: basePrice, base_price: basePrice, open_tasks: 0, completed_tasks: 0, streak: 0,
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        price_history: [{ id: `h-0`, member_id: '', price: basePrice, event_type: 'initial' as const, recorded_at: new Date().toISOString() }],
        price_change_24h: 0, price_change_pct: 0,
      }
      setMembers((prev) => [...prev, newMember].sort((a, b) => b.current_price - a.current_price))
      return
    }
    const { createMember } = await import('@/lib/supabase')
    await createMember({ name, role, base_price: basePrice })
    await loadData()
  }

  async function handleEditMember(id: string, name: string, role: string) {
    if (IS_MOCK) {
      setMembers((prev) => prev.map((m) => m.id === id ? { ...m, name, role } : m))
      return
    }
    const { updateMember } = await import('@/lib/supabase')
    await updateMember(id, { name, role })
    await loadData()
  }

  async function handleDeleteMember(id: string) {
    if (IS_MOCK) {
      setMembers((prev) => prev.filter((m) => m.id !== id))
      return
    }
    const { deleteMember } = await import('@/lib/supabase')
    await deleteMember(id)
    await loadData()
  }

  // ─── Category CRUD ─────────────────────────────────────────────────────────

  async function handleCreateCategory(input: Omit<WorkCategory, 'id' | 'created_at'>) {
    if (IS_MOCK) {
      setCategories((prev) => [...prev, { ...input, id: `mock-cat-${Date.now()}`, created_at: new Date().toISOString() }])
      return
    }
    const { createCategory } = await import('@/lib/supabase')
    await createCategory(input)
    await loadData()
  }

  async function handleUpdateCategory(id: string, input: Partial<Omit<WorkCategory, 'id' | 'created_at'>>) {
    if (IS_MOCK) {
      setCategories((prev) => prev.map((c) => c.id === id ? { ...c, ...input } : c))
      return
    }
    const { updateCategory } = await import('@/lib/supabase')
    await updateCategory(id, input)
    await loadData()
  }

  async function handleDeleteCategory(id: string) {
    if (IS_MOCK) {
      setCategories((prev) => prev.filter((c) => c.id !== id))
      return
    }
    const { deleteCategory } = await import('@/lib/supabase')
    await deleteCategory(id)
    await loadData()
  }

  if (!ready) return null

  if (role !== 'manager') {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="text-center">
          <Shield className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
          <h2 className="text-white font-semibold mb-2">Manager access only</h2>
          <p className="text-zinc-500 text-sm mb-4">Switch to the Manager role to access this page.</p>
          <Link href="/" className="text-indigo-400 hover:text-indigo-300 text-sm underline">
            Go back to the board
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400 text-sm animate-pulse">Loading...</div>
      </div>
    )
  }

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview',    label: 'Overview',    icon: <LayoutGrid className="w-3.5 h-3.5" /> },
    { id: 'team',        label: 'Team',         icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'categories',  label: 'Work Types',   icon: <Tag className="w-3.5 h-3.5" /> },
  ]

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Nav */}
      <header className="border-b border-zinc-800/60 sticky top-0 bg-zinc-950/90 backdrop-blur-md z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-1.5 text-zinc-500 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-xs hidden sm:inline">Board</span>
            </Link>
            <div className="w-px h-4 bg-zinc-800" />
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-indigo-600 rounded-md flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-white font-bold text-sm">DevEx</span>
              <span className="text-xs text-indigo-400 bg-indigo-600/10 border border-indigo-600/20 px-2 py-0.5 rounded-full">Manager</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {IS_MOCK && (
              <span className="text-yellow-500/80 text-xs bg-yellow-500/10 border border-yellow-500/20 px-2 py-1 rounded-full">
                Demo
              </span>
            )}
            <button
              onClick={() => { setAssignDefaultId(undefined); setShowAssign(true) }}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Assign Work</span>
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-1 pb-0">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-indigo-500 text-white'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* ── Overview ───────────────────────────────────────────────────────── */}
        {tab === 'overview' && (
          <>
            <MarketHeader members={members} totalTasks={tasks.length} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-white font-semibold">Leaderboard</h2>
                  <span className="text-zinc-500 text-xs">{members.length} members</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {members.map((member, i) => (
                    <MemberCard
                      key={member.id}
                      member={member}
                      rank={i + 1}
                      onClick={() => setSelectedMember(member)}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <ActivityFeed events={events} />
                <TaskList tasks={tasks} onComplete={handleComplete} />
              </div>
            </div>
          </>
        )}

        {/* ── Team ───────────────────────────────────────────────────────────── */}
        {tab === 'team' && (
          <TeamManagement
            members={members}
            onAdd={handleAddMember}
            onEdit={handleEditMember}
            onDelete={handleDeleteMember}
          />
        )}

        {/* ── Categories ─────────────────────────────────────────────────────── */}
        {tab === 'categories' && (
          <CategoryManager
            categories={categories}
            onCreate={handleCreateCategory}
            onUpdate={handleUpdateCategory}
            onDelete={handleDeleteCategory}
          />
        )}
      </main>

      {showAssign && (
        <AssignTaskModal
          members={members}
          categories={categories}
          defaultMemberId={assignDefaultId}
          onClose={() => setShowAssign(false)}
          onAssign={handleAssign}
        />
      )}
      {selectedMember && (
        <MemberDetailModal
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
          onAssign={() => { setSelectedMember(null); setAssignDefaultId(selectedMember.id); setShowAssign(true) }}
        />
      )}
    </div>
  )
}
