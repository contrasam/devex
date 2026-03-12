export type Priority = 'low' | 'medium' | 'high' | 'critical'
export type TaskStatus = 'open' | 'in_progress' | 'completed' | 'overdue'
export type EventType = 'assigned' | 'completed' | 'overdue' | 'streak' | 'initial'
export type AppRole = 'manager' | 'developer'

// ─── Work Categories ──────────────────────────────────────────────────────────

export interface WorkCategory {
  id: string
  name: string
  emoji: string
  description: string
  base_multiplier: number   // multiplies priority base impact
  color: string             // tailwind color token
  is_active: boolean
  created_at: string
}

export const DEFAULT_CATEGORIES: Omit<WorkCategory, 'id' | 'created_at'>[] = [
  { name: 'Code Review',   emoji: '🔍', description: 'Reviewing PRs, pair programming and code quality',   base_multiplier: 1.3, color: 'indigo',  is_active: true },
  { name: 'Frontend Dev',  emoji: '🖥️', description: 'UI implementation, components, styling',             base_multiplier: 1.0, color: 'blue',    is_active: true },
  { name: 'Backend Dev',   emoji: '⚙️', description: 'APIs, databases, services, business logic',          base_multiplier: 1.2, color: 'violet',  is_active: true },
  { name: 'Design Work',   emoji: '🎨', description: 'UI/UX design, mockups, prototypes, design systems',  base_multiplier: 1.1, color: 'pink',    is_active: true },
  { name: 'Architecture',  emoji: '🏗️', description: 'System design, tech decisions, ADRs',                base_multiplier: 1.5, color: 'amber',   is_active: true },
  { name: 'DevOps',        emoji: '🚀', description: 'CI/CD pipelines, infrastructure, deployments',       base_multiplier: 1.4, color: 'emerald', is_active: true },
  { name: 'Bug Fix',       emoji: '🐛', description: 'Diagnosing and fixing defects',                       base_multiplier: 1.1, color: 'red',     is_active: true },
  { name: 'Documentation', emoji: '📚', description: 'Docs, runbooks, wikis, READMEs',                     base_multiplier: 0.8, color: 'zinc',    is_active: true },
]

export const CATEGORY_COLOR_OPTIONS = [
  'indigo', 'blue', 'violet', 'pink', 'amber', 'emerald', 'red', 'orange', 'teal', 'cyan', 'zinc',
] as const
export type CategoryColor = (typeof CATEGORY_COLOR_OPTIONS)[number]

export const CATEGORY_COLOR_MAP: Record<string, { ring: string; badge: string; text: string; dot: string }> = {
  indigo:  { ring: 'ring-indigo-500/40',  badge: 'bg-indigo-500/10 border-indigo-500/30',   text: 'text-indigo-400',  dot: 'bg-indigo-400'  },
  blue:    { ring: 'ring-blue-500/40',    badge: 'bg-blue-500/10 border-blue-500/30',        text: 'text-blue-400',    dot: 'bg-blue-400'    },
  violet:  { ring: 'ring-violet-500/40',  badge: 'bg-violet-500/10 border-violet-500/30',    text: 'text-violet-400',  dot: 'bg-violet-400'  },
  pink:    { ring: 'ring-pink-500/40',    badge: 'bg-pink-500/10 border-pink-500/30',        text: 'text-pink-400',    dot: 'bg-pink-400'    },
  amber:   { ring: 'ring-amber-500/40',   badge: 'bg-amber-500/10 border-amber-500/30',      text: 'text-amber-400',   dot: 'bg-amber-400'   },
  emerald: { ring: 'ring-emerald-500/40', badge: 'bg-emerald-500/10 border-emerald-500/30',  text: 'text-emerald-400', dot: 'bg-emerald-400' },
  red:     { ring: 'ring-red-500/40',     badge: 'bg-red-500/10 border-red-500/30',          text: 'text-red-400',     dot: 'bg-red-400'     },
  orange:  { ring: 'ring-orange-500/40',  badge: 'bg-orange-500/10 border-orange-500/30',    text: 'text-orange-400',  dot: 'bg-orange-400'  },
  teal:    { ring: 'ring-teal-500/40',    badge: 'bg-teal-500/10 border-teal-500/30',        text: 'text-teal-400',    dot: 'bg-teal-400'    },
  cyan:    { ring: 'ring-cyan-500/40',    badge: 'bg-cyan-500/10 border-cyan-500/30',        text: 'text-cyan-400',    dot: 'bg-cyan-400'    },
  zinc:    { ring: 'ring-zinc-500/40',    badge: 'bg-zinc-500/10 border-zinc-500/30',        text: 'text-zinc-400',    dot: 'bg-zinc-400'    },
}

// ─── Team Members ─────────────────────────────────────────────────────────────

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

export interface MemberWithHistory extends TeamMember {
  price_history: PriceHistory[]
  price_change_24h: number
  price_change_pct: number
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export interface Task {
  id: string
  title: string
  description: string | null
  assigned_to: string | null
  work_category_id: string | null
  priority: Priority
  status: TaskStatus
  price_impact: number
  created_at: string
  completed_at: string | null
  due_date: string | null
  team_member?: TeamMember
  work_category?: WorkCategory
}

// ─── Events ───────────────────────────────────────────────────────────────────

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

// ─── Price Algorithm ──────────────────────────────────────────────────────────

export const PRICE_IMPACT = {
  priority: {
    low: 2.5,
    medium: 5.0,
    high: 10.0,
    critical: 18.0,
  },
  demand_multiplier: (openTasks: number) => {
    if (openTasks >= 5) return 1.8
    if (openTasks >= 3) return 1.4
    if (openTasks >= 1) return 1.2
    return 1.0
  },
  completion_bonus: (streak: number) => {
    const base = 3.0
    const streakBonus = Math.min(streak * 0.5, 5.0)
    return base + streakBonus
  },
  overdue_penalty: -4.0,
} as const

export function calculateImpact(
  priority: Priority,
  categoryMultiplier: number,
  openTasks: number
): number {
  const base = PRICE_IMPACT.priority[priority]
  const demand = PRICE_IMPACT.demand_multiplier(openTasks)
  return parseFloat((base * categoryMultiplier * demand).toFixed(2))
}

// ─── UI Helpers ───────────────────────────────────────────────────────────────

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
