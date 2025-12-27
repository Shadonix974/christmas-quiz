'use client'

import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface TimerProps {
  timeRemaining: number
  totalTime: number
  size?: 'sm' | 'md' | 'lg'
}

export function Timer({ timeRemaining, totalTime, size = 'md' }: TimerProps) {
  const progress = (timeRemaining / totalTime) * 100
  const isLow = timeRemaining <= 5
  const isCritical = timeRemaining <= 3

  const sizes = {
    sm: { container: 'w-16 h-16', text: 'text-xl', stroke: 4 },
    md: { container: 'w-24 h-24', text: 'text-3xl', stroke: 6 },
    lg: { container: 'w-32 h-32', text: 'text-4xl', stroke: 8 },
  }

  const { container, text, stroke } = sizes[size]
  const radius = 45
  const circumference = 2 * Math.PI * radius

  return (
    <div className={cn('relative', container)}>
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-gray-200"
        />
        {/* Progress circle */}
        <motion.circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          className={cn(
            'transition-colors duration-300',
            isCritical
              ? 'text-red-600'
              : isLow
              ? 'text-orange-500'
              : 'text-green-500'
          )}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress / 100)}
          initial={false}
          animate={{
            strokeDashoffset: circumference * (1 - progress / 100),
          }}
          transition={{ duration: 0.5, ease: 'linear' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.span
          className={cn(
            'font-bold',
            text,
            isCritical
              ? 'text-red-600'
              : isLow
              ? 'text-orange-500'
              : 'text-gray-800'
          )}
          animate={isCritical ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.5, repeat: isCritical ? Infinity : 0 }}
        >
          {timeRemaining}
        </motion.span>
      </div>
    </div>
  )
}
