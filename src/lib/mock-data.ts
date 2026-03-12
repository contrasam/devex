// Mock data for UI preview when Supabase is not configured
import type { MemberWithHistory, TickerEvent, Task } from '@/types'

function generateHistory(
  basePrice: number,
  currentPrice: number,
  points = 20
) {
  const prices = []
  for (let i = 0; i < points; i++) {
    const t = i / (points - 1)
    const noise = (Math.random() - 0.5) * 8
    prices.push({
      id: `ph-${i}`,
      member_id: '',
      price: parseFloat((basePrice + (currentPrice - basePrice) * t + noise).toFixed(2)),
      event_type: 'assigned' as const,
      recorded_at: new Date(Date.now() - (points - i) * 36e5).toISOString(),
    })
  }
  prices[prices.length - 1].price = currentPrice
  return prices
}

export const MOCK_MEMBERS: MemberWithHistory[] = [
  {
    id: '1', name: 'Alex Chen', role: 'Frontend Engineer', avatar_seed: 'alex',
    current_price: 142.50, base_price: 100, open_tasks: 3, completed_tasks: 12, streak: 5,
    created_at: '2024-01-01T00:00:00Z', updated_at: new Date().toISOString(),
    price_history: generateHistory(100, 142.5),
    price_change_24h: 7.3, price_change_pct: 5.4,
  },
  {
    id: '2', name: 'Priya Sharma', role: 'Backend Engineer', avatar_seed: 'priya',
    current_price: 198.75, base_price: 100, open_tasks: 5, completed_tasks: 28, streak: 8,
    created_at: '2024-01-01T00:00:00Z', updated_at: new Date().toISOString(),
    price_history: generateHistory(100, 198.75),
    price_change_24h: 12.5, price_change_pct: 6.7,
  },
  {
    id: '3', name: 'Jordan Lee', role: 'Full Stack Engineer', avatar_seed: 'jordan',
    current_price: 87.30, base_price: 100, open_tasks: 1, completed_tasks: 7, streak: 2,
    created_at: '2024-01-01T00:00:00Z', updated_at: new Date().toISOString(),
    price_history: generateHistory(100, 87.3),
    price_change_24h: -3.2, price_change_pct: -3.5,
  },
  {
    id: '4', name: 'Sam Rivera', role: 'DevOps Engineer', avatar_seed: 'sam',
    current_price: 165.20, base_price: 100, open_tasks: 4, completed_tasks: 19, streak: 6,
    created_at: '2024-01-01T00:00:00Z', updated_at: new Date().toISOString(),
    price_history: generateHistory(100, 165.2),
    price_change_24h: 4.8, price_change_pct: 3.0,
  },
  {
    id: '5', name: 'Casey Morgan', role: 'Product Designer', avatar_seed: 'casey',
    current_price: 110.00, base_price: 100, open_tasks: 2, completed_tasks: 9, streak: 3,
    created_at: '2024-01-01T00:00:00Z', updated_at: new Date().toISOString(),
    price_history: generateHistory(100, 110),
    price_change_24h: 1.5, price_change_pct: 1.4,
  },
]

export const MOCK_EVENTS: TickerEvent[] = [
  { id: 'e1', member_id: '2', task_id: 't1', event_type: 'assigned', description: '📋 "Migrate auth to OAuth2" assigned — critical priority', price_before: 186.25, price_after: 198.75, created_at: new Date(Date.now() - 12e5).toISOString(), team_member: MOCK_MEMBERS[1] },
  { id: 'e2', member_id: '1', task_id: 't2', event_type: 'completed', description: '✅ "Refactor hero component" completed — streak x5', price_before: 139.20, price_after: 142.50, created_at: new Date(Date.now() - 36e5).toISOString(), team_member: MOCK_MEMBERS[0] },
  { id: 'e3', member_id: '4', task_id: 't3', event_type: 'assigned', description: '📋 "Set up CI/CD pipeline" assigned — high priority', price_before: 160.40, price_after: 165.20, created_at: new Date(Date.now() - 54e5).toISOString(), team_member: MOCK_MEMBERS[3] },
  { id: 'e4', member_id: '5', task_id: 't4', event_type: 'assigned', description: '📋 "Design onboarding flow" assigned — medium priority', price_before: 108.50, price_after: 110.00, created_at: new Date(Date.now() - 72e5).toISOString(), team_member: MOCK_MEMBERS[4] },
  { id: 'e5', member_id: '3', task_id: 't5', event_type: 'overdue', description: '⚠️ "Fix login bug" overdue', price_before: 91.50, price_after: 87.30, created_at: new Date(Date.now() - 9e6).toISOString(), team_member: MOCK_MEMBERS[2] },
]

export const MOCK_TASKS: Task[] = [
  { id: 't1', title: 'Migrate auth to OAuth2', description: 'Replace session tokens with OAuth2 + refresh tokens', assigned_to: '2', priority: 'critical', status: 'in_progress', price_impact: 12.5, created_at: new Date(Date.now() - 12e5).toISOString(), completed_at: null, due_date: null, team_member: MOCK_MEMBERS[1] },
  { id: 't2', title: 'Design onboarding flow', description: null, assigned_to: '5', priority: 'medium', status: 'open', price_impact: 1.5, created_at: new Date(Date.now() - 72e5).toISOString(), completed_at: null, due_date: null, team_member: MOCK_MEMBERS[4] },
  { id: 't3', title: 'Set up CI/CD pipeline', description: 'GitHub Actions with Docker build and deploy', assigned_to: '4', priority: 'high', status: 'open', price_impact: 4.8, created_at: new Date(Date.now() - 54e5).toISOString(), completed_at: null, due_date: null, team_member: MOCK_MEMBERS[3] },
]
