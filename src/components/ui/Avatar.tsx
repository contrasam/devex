'use client'

interface AvatarProps {
  seed: string
  name: string
  size?: 'sm' | 'md' | 'lg'
}

const COLORS = [
  ['#6366f1', '#818cf8'], // indigo
  ['#8b5cf6', '#a78bfa'], // violet
  ['#ec4899', '#f472b6'], // pink
  ['#14b8a6', '#2dd4bf'], // teal
  ['#f59e0b', '#fbbf24'], // amber
  ['#10b981', '#34d399'], // emerald
  ['#3b82f6', '#60a5fa'], // blue
  ['#ef4444', '#f87171'], // red
]

function getColorPair(seed: string): [string, string] {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  }
  return COLORS[Math.abs(hash) % COLORS.length] as [string, string]
}

const SIZE_CLASSES = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-12 h-12 text-base',
}

export default function Avatar({ seed, name, size = 'md' }: AvatarProps) {
  const [from, to] = getColorPair(seed)
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div
      className={`${SIZE_CLASSES[size]} rounded-full flex items-center justify-center font-bold text-white shrink-0`}
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
      title={name}
    >
      {initials}
    </div>
  )
}
