'use client'

import { CheckCircle2, Clock3 } from 'lucide-react'
import type { Task } from '@/types'
import { PRIORITY_COLORS, PRIORITY_BG, CATEGORY_COLOR_MAP } from '@/types'
import Avatar from './ui/Avatar'
import { formatDistanceToNow } from 'date-fns'

interface TaskListProps {
  tasks: Task[]
  onComplete?: (taskId: string) => Promise<void>
}

export default function TaskList({ tasks, onComplete }: TaskListProps) {
  const open = tasks.filter((t) => t.status === 'open' || t.status === 'in_progress')

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold text-sm">Open Tasks</h3>
          <p className="text-zinc-500 text-xs mt-0.5">{open.length} in queue</p>
        </div>
      </div>

      <div className="divide-y divide-zinc-800/60 max-h-96 overflow-y-auto">
        {open.length === 0 && (
          <div className="px-4 py-8 text-center text-zinc-600 text-sm">
            No open tasks
          </div>
        )}
        {open.map((task) => (
          <div key={task.id} className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/30 transition-colors group">
            {onComplete ? (
              <button
                onClick={() => onComplete(task.id)}
                className="text-zinc-600 hover:text-emerald-400 transition-colors shrink-0"
                title="Mark as completed"
              >
                <CheckCircle2 className="w-4 h-4" />
              </button>
            ) : (
              <CheckCircle2 className="w-4 h-4 text-zinc-700 shrink-0" />
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-white text-xs font-medium truncate">{task.title}</span>
                <span className={`shrink-0 text-xs px-1.5 py-0.5 rounded border ${PRIORITY_BG[task.priority]} ${PRIORITY_COLORS[task.priority]}`}>
                  {task.priority}
                </span>
                {task.work_category && (
                  <span className={`shrink-0 text-xs px-1.5 py-0.5 rounded border ${CATEGORY_COLOR_MAP[task.work_category.color]?.badge ?? ''} ${CATEGORY_COLOR_MAP[task.work_category.color]?.text ?? ''}`}>
                    {task.work_category.emoji} {task.work_category.name}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <Clock3 className="w-3 h-3 text-zinc-600" />
                <span className="text-zinc-600 text-xs">
                  {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>

            {task.team_member && (
              <Avatar
                seed={task.team_member.avatar_seed}
                name={task.team_member.name}
                size="sm"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
