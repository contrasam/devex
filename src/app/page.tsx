'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Plus, TrendingUp, Shield, LogOut, Code2 } from 'lucide-react'
import type { MemberWithHistory, TickerEvent, Task, Priority, WorkCategory } from '@/types'
import { PRICE_IMPACT, calculateImpact } from '@/types'
import { MOCK_MEMBERS, MOCK_EVENTS, MOCK_TASKS, MOCK_CATEGORIES } from '@/lib/mock-data'
import { useRole } from '@/hooks/useRole'
import TickerTape from '@/components/TickerTape'
import MemberCard from '@/components/MemberCard'
import AssignTaskModal from '@/components/AssignTaskModal'
import MemberDetailModal from '@/components/MemberDetailModal'
import ActivityFeed from '@/components/ActivityFeed'
import TaskList from '@/components/TaskList'
import MarketHeader from '@/components/MarketHeader'
import RoleGate from '@/components/RoleGate'
import { isConfigured } from '@/lib/supabase'

const IS_MOCK = !isConfigured

export default function Home() {
  const { role, ready, setRole, clearRole, isManager } = useRole()
  const [members, setMembers] = useState<MemberWithHistory[]>(MOCK_MEMBERS)
  const [events, setEvents] = useState<TickerEvent[]>(MOCK_EVENTS)
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS)
  const [categories, setCategories] = useState<WorkCategory[]>(MOCK_CATEGORIES)
  const [dataLoading, setDataLoading] = useState(!IS_MOCK)
  const [showAssign, setShowAssign] = useState(false)
  const [selectedMember, setSelectedMember] = useState<MemberWithHistory | null>(null)
  const [assignDefaultId, setAssignDefaultId] = useState<string | undefined>()

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
      setDataLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    if (IS_MOCK) return
    let cleanup: (() => void) | null = null
    import('@/lib/supabase').then(({ supabase }) => {
      const sub = supabase
        .channel('devex-board')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members' }, () => loadData())
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ticker_events' }, () => loadData())
        .subscribe()
      cleanup = () => { sub.unsubscribe() }
    })
    return () => { cleanup?.() }
  }, [loadData])

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

  // Wait for role hydration
  if (!ready) return null

  // First visit — show role selection
  if (!role) {
    return <RoleGate onSelect={setRole} />
  }

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400 text-sm animate-pulse">Loading market data...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <TickerTape members={members} />

      {/* Nav */}
      <header className="border-b border-zinc-800/60 sticky top-0 bg-zinc-950/90 backdrop-blur-md z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-sm">DevEx</span>
              {/* Role badge */}
              <span className={`text-xs px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                isManager
                  ? 'text-indigo-400 bg-indigo-600/10 border-indigo-600/20'
                  : 'text-emerald-400 bg-emerald-600/10 border-emerald-600/20'
              }`}>
                {isManager ? <Shield className="w-2.5 h-2.5" /> : <Code2 className="w-2.5 h-2.5" />}
                <span className="hidden sm:inline">{isManager ? 'Manager' : 'Developer'}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {IS_MOCK && (
              <span className="text-yellow-500/80 text-xs bg-yellow-500/10 border border-yellow-500/20 px-2 py-1 rounded-full hidden sm:inline">
                Demo
              </span>
            )}

            {/* Manager-only: dashboard link + assign button */}
            {isManager && (
              <>
                <Link
                  href="/manager"
                  className="text-zinc-400 hover:text-white text-xs px-2 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors hidden sm:flex items-center gap-1"
                >
                  <Shield className="w-3.5 h-3.5" />
                  Dashboard
                </Link>
                <button
                  onClick={() => { setAssignDefaultId(undefined); setShowAssign(true) }}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Assign Work</span>
                </button>
              </>
            )}

            {/* Switch / logout role */}
            <button
              onClick={clearRole}
              className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              title="Switch role"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <MarketHeader members={members} totalTasks={tasks.length} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Member grid */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">Team Leaderboard</h2>
              <span className="text-zinc-500 text-xs">{members.length} developers</span>
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

          {/* Side panel */}
          <div className="space-y-4">
            <ActivityFeed events={events} />
            <TaskList tasks={tasks} onComplete={isManager ? handleComplete : undefined} />
          </div>
        </div>
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
          onAssign={isManager ? () => { setSelectedMember(null); setAssignDefaultId(selectedMember.id); setShowAssign(true) } : undefined}
        />
      )}
    </div>
  )
}
