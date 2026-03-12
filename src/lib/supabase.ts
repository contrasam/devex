import { createClient } from '@supabase/supabase-js'
import type { TeamMember, Task, PriceHistory, TickerEvent, MemberWithHistory, Priority, PRICE_IMPACT } from '@/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ─── Members ──────────────────────────────────────────────────────────────────

export async function getMembers(): Promise<MemberWithHistory[]> {
  const { data: members, error } = await supabase
    .from('team_members')
    .select('*')
    .order('current_price', { ascending: false })

  if (error) throw error

  const membersWithHistory = await Promise.all(
    (members ?? []).map(async (member: TeamMember) => {
      const history = await getMemberPriceHistory(member.id, 20)
      const yesterday = history.find((h) => {
        const hoursAgo = (Date.now() - new Date(h.recorded_at).getTime()) / 36e5
        return hoursAgo >= 20 && hoursAgo <= 28
      })
      const priceYesterday = yesterday?.price ?? member.base_price
      const change = member.current_price - priceYesterday
      const changePct = (change / priceYesterday) * 100

      return {
        ...member,
        price_history: history,
        price_change_24h: change,
        price_change_pct: changePct,
      }
    })
  )

  return membersWithHistory
}

export async function getMemberPriceHistory(
  memberId: string,
  limit = 30
): Promise<PriceHistory[]> {
  const { data, error } = await supabase
    .from('price_history')
    .select('*')
    .eq('member_id', memberId)
    .order('recorded_at', { ascending: true })
    .limit(limit)

  if (error) throw error
  return data ?? []
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export async function getTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*, team_member:team_members(*)')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function assignTask(
  title: string,
  description: string | null,
  memberId: string,
  priority: Priority
): Promise<{ task: Task; member: TeamMember }> {
  // Fetch current member state
  const { data: member, error: memberError } = await supabase
    .from('team_members')
    .select('*')
    .eq('id', memberId)
    .single()

  if (memberError || !member) throw new Error('Member not found')

  // Calculate price impact (demand & supply model)
  const { PRICE_IMPACT: IMPACT } = await import('@/types')
  const baseImpact = IMPACT.priority[priority]
  const demandMult = IMPACT.demand_multiplier(member.open_tasks)
  const priceImpact = parseFloat((baseImpact * demandMult).toFixed(2))
  const newPrice = parseFloat((member.current_price + priceImpact).toFixed(2))

  // Insert task
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .insert({
      title,
      description,
      assigned_to: memberId,
      priority,
      status: 'open',
      price_impact: priceImpact,
    })
    .select()
    .single()

  if (taskError || !task) throw taskError

  // Update member price and open_tasks
  const { data: updatedMember, error: updateError } = await supabase
    .from('team_members')
    .update({
      current_price: newPrice,
      open_tasks: member.open_tasks + 1,
    })
    .eq('id', memberId)
    .select()
    .single()

  if (updateError || !updatedMember) throw updateError

  // Record price history
  await supabase.from('price_history').insert({
    member_id: memberId,
    price: newPrice,
    event_type: 'assigned',
  })

  // Record ticker event
  await supabase.from('ticker_events').insert({
    member_id: memberId,
    task_id: task.id,
    event_type: 'assigned',
    description: `📋 "${title}" assigned — ${priority} priority`,
    price_before: member.current_price,
    price_after: newPrice,
  })

  return { task, member: updatedMember }
}

export async function completeTask(taskId: string): Promise<void> {
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select('*, team_member:team_members(*)')
    .eq('id', taskId)
    .single()

  if (taskError || !task || !task.assigned_to) throw new Error('Task not found')

  const member = task.team_member as TeamMember
  const { PRICE_IMPACT: IMPACT } = await import('@/types')
  const bonus = IMPACT.completion_bonus(member.streak)
  const newPrice = parseFloat((member.current_price + bonus).toFixed(2))
  const newStreak = member.streak + 1

  await supabase
    .from('tasks')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', taskId)

  await supabase
    .from('team_members')
    .update({
      current_price: newPrice,
      open_tasks: Math.max(0, member.open_tasks - 1),
      completed_tasks: member.completed_tasks + 1,
      streak: newStreak,
    })
    .eq('id', member.id)

  await supabase.from('price_history').insert({
    member_id: member.id,
    price: newPrice,
    event_type: 'completed',
  })

  await supabase.from('ticker_events').insert({
    member_id: member.id,
    task_id: taskId,
    event_type: 'completed',
    description: `✅ "${task.title}" completed — streak x${newStreak}`,
    price_before: member.current_price,
    price_after: newPrice,
  })
}

// ─── Ticker Events ────────────────────────────────────────────────────────────

export async function getTickerEvents(limit = 50): Promise<TickerEvent[]> {
  const { data, error } = await supabase
    .from('ticker_events')
    .select('*, team_member:team_members(name, role, avatar_seed)')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data ?? []
}
