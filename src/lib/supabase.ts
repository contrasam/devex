import { createClient } from '@supabase/supabase-js'
import type { TeamMember, Task, PriceHistory, TickerEvent, MemberWithHistory, Priority, WorkCategory } from '@/types'
import { calculateImpact, PRICE_IMPACT } from '@/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Derived here — where the env vars are actually read — so pages don't have to
// re-check process.env, which Turbopack may not inline reliably at runtime.
export const isConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = isConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : (null as unknown as ReturnType<typeof createClient>)

// ─── Work Categories ──────────────────────────────────────────────────────────

export async function getCategories(): Promise<WorkCategory[]> {
  const { data, error } = await supabase
    .from('work_categories')
    .select('*')
    .order('name')
  if (error) throw error
  return data ?? []
}

export async function createCategory(
  input: Omit<WorkCategory, 'id' | 'created_at'>
): Promise<WorkCategory> {
  const { data, error } = await supabase
    .from('work_categories')
    .insert(input)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateCategory(
  id: string,
  input: Partial<Omit<WorkCategory, 'id' | 'created_at'>>
): Promise<void> {
  const { error } = await supabase.from('work_categories').update(input).eq('id', id)
  if (error) throw error
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('work_categories').delete().eq('id', id)
  if (error) throw error
}

// ─── Members ──────────────────────────────────────────────────────────────────

export async function getMembers(): Promise<MemberWithHistory[]> {
  const { data: members, error } = await supabase
    .from('team_members')
    .select('*')
    .order('current_price', { ascending: false })
  if (error) throw error

  return Promise.all(
    (members ?? []).map(async (member: TeamMember) => {
      const history = await getMemberPriceHistory(member.id, 20)
      const yesterday = history.find((h) => {
        const hoursAgo = (Date.now() - new Date(h.recorded_at).getTime()) / 36e5
        return hoursAgo >= 20 && hoursAgo <= 28
      })
      const priceYesterday = yesterday?.price ?? member.base_price
      const change = member.current_price - priceYesterday
      return {
        ...member,
        price_history: history,
        price_change_24h: change,
        price_change_pct: (change / priceYesterday) * 100,
      }
    })
  )
}

export async function getMemberPriceHistory(memberId: string, limit = 30): Promise<PriceHistory[]> {
  const { data, error } = await supabase
    .from('price_history')
    .select('*')
    .eq('member_id', memberId)
    .order('recorded_at', { ascending: true })
    .limit(limit)
  if (error) throw error
  return data ?? []
}

export async function createMember(
  input: Pick<TeamMember, 'name' | 'role'> & { base_price?: number }
): Promise<TeamMember> {
  const { data, error } = await supabase
    .from('team_members')
    .insert({
      name: input.name,
      role: input.role,
      avatar_seed: input.name.toLowerCase().replace(/\s+/g, '-'),
      base_price: input.base_price ?? 100,
      current_price: input.base_price ?? 100,
    })
    .select()
    .single()
  if (error) throw error
  await supabase.from('price_history').insert({ member_id: data.id, price: data.current_price, event_type: 'initial' })
  return data
}

export async function updateMember(
  id: string,
  input: Partial<Pick<TeamMember, 'name' | 'role'>>
): Promise<void> {
  const { error } = await supabase.from('team_members').update(input).eq('id', id)
  if (error) throw error
}

export async function deleteMember(id: string): Promise<void> {
  const { error } = await supabase.from('team_members').delete().eq('id', id)
  if (error) throw error
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export async function getTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*, team_member:team_members(*), work_category:work_categories(*)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function assignTask(
  title: string,
  description: string | null,
  memberId: string,
  priority: Priority,
  categoryId: string,
  categoryMultiplier: number
): Promise<void> {
  const { data: member, error: memberError } = await supabase
    .from('team_members')
    .select('*')
    .eq('id', memberId)
    .single()
  if (memberError || !member) throw new Error('Member not found')

  const priceImpact = calculateImpact(priority, categoryMultiplier, member.open_tasks)
  const newPrice = parseFloat((member.current_price + priceImpact).toFixed(2))

  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .insert({ title, description, assigned_to: memberId, work_category_id: categoryId, priority, status: 'open', price_impact: priceImpact })
    .select()
    .single()
  if (taskError || !task) throw taskError

  await supabase.from('team_members').update({ current_price: newPrice, open_tasks: member.open_tasks + 1 }).eq('id', memberId)
  await supabase.from('price_history').insert({ member_id: memberId, price: newPrice, event_type: 'assigned' })
  await supabase.from('ticker_events').insert({
    member_id: memberId, task_id: task.id, event_type: 'assigned',
    description: `📋 "${title}" assigned — ${priority} priority`,
    price_before: member.current_price, price_after: newPrice,
  })
}

export async function completeTask(taskId: string): Promise<void> {
  const { data: task, error } = await supabase
    .from('tasks')
    .select('*, team_member:team_members(*)')
    .eq('id', taskId)
    .single()
  if (error || !task?.assigned_to) throw new Error('Task not found')

  const member = task.team_member as TeamMember
  const bonus = PRICE_IMPACT.completion_bonus(member.streak)
  const newPrice = parseFloat((member.current_price + bonus).toFixed(2))

  await supabase.from('tasks').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', taskId)
  await supabase.from('team_members').update({
    current_price: newPrice,
    open_tasks: Math.max(0, member.open_tasks - 1),
    completed_tasks: member.completed_tasks + 1,
    streak: member.streak + 1,
  }).eq('id', member.id)
  await supabase.from('price_history').insert({ member_id: member.id, price: newPrice, event_type: 'completed' })
  await supabase.from('ticker_events').insert({
    member_id: member.id, task_id: taskId, event_type: 'completed',
    description: `✅ "${task.title}" completed — streak x${member.streak + 1}`,
    price_before: member.current_price, price_after: newPrice,
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
