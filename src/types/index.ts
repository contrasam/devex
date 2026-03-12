export type Priority = 'low' | 'medium' | 'high' | 'critical'
export type TaskStatus = 'open' | 'in_progress' | 'completed' | 'overdue'
export type EventType = 'assigned' | 'completed' | 'overdue' | 'streak' | 'initial'

export interface TeamMember {
  id: string
  name: string
  role: string
  avatar_seed: string
  current_price: number
  base_price: number
  open_tasks: number
  completed_tasks: number
  streak: number
  created_at: string
  updated_at: string
}

export interface PriceHistory {
  id: string
  member_id: string
  price: number
  event_type: EventType
  recorded_at: string
}

export interface Task {
  id: string
  title: string
  description: string | null
  assigned_to: string | null
  priority: Priority
  status: TaskStatus
  price_impact: number
  created_at: string
  completed_at: string | null
  due_date: string | null
  team_member?: TeamMember
}

export interface TickerEvent {
  id: string
  member_id: string
  task_id: string | null
  event_type: string
  description: string
  price_before: number
  price_after: number
  created_at: string
  team_member?: TeamMember
}

export interface MemberWithHistory extends TeamMember {
  price_history: PriceHistory[]
  price_change_24h: number
  price_change_pct: number
}

// Price impact by priority and demand
export const PRICE_IMPACT = {
  priority: {
    low: 2.5,
    medium: 5.0,
    high: 10.0,
    critical: 18.0,
  },
  demand_multiplier: (openTasks: number) => {
    // More open tasks = higher demand = bigger price bump
    if (openTasks >= 5) return 1.8
    if (openTasks >= 3) return 1.4
    if (openTasks >= 1) return 1.2
    return 1.0
  },
  completion_bonus: (streak: number) => {
    // Completing tasks gives smaller boost; streaks amplify it
    const base = 3.0
    const streakBonus = Math.min(streak * 0.5, 5.0)
    return base + streakBonus
  },
  overdue_penalty: -4.0,
} as const

export const PRIORITY_COLORS: Record<Priority, string> = {
  low: 'text-blue-400',
  medium: 'text-yellow-400',
  high: 'text-orange-400',
  critical: 'text-red-400',
}

export const PRIORITY_BG: Record<Priority, string> = {
  low: 'bg-blue-400/10 border-blue-400/20',
  medium: 'bg-yellow-400/10 border-yellow-400/20',
  high: 'bg-orange-400/10 border-orange-400/20',
  critical: 'bg-red-400/10 border-red-400/20',
}
