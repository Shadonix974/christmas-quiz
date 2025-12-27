'use client'

import { motion } from 'framer-motion'
import { Trophy, Medal, Award } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LeaderboardEntry } from '@/types'

interface LeaderboardProps {
  rankings: LeaderboardEntry[]
  currentPlayerId?: string
  isFinal?: boolean
  // Mode auto
  autoMode?: boolean
  nextQuestionIn?: number
}

export function Leaderboard({
  rankings,
  currentPlayerId,
  isFinal = false,
  autoMode = false,
  nextQuestionIn,
}: LeaderboardProps) {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-8 h-8 text-yellow-500" />
      case 2:
        return <Medal className="w-8 h-8 text-gray-400" />
      case 3:
        return <Award className="w-8 h-8 text-amber-700" />
      default:
        return null
    }
  }

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white'
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-400 text-white'
      case 3:
        return 'bg-gradient-to-r from-amber-600 to-amber-700 text-white'
      default:
        return 'bg-white'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 via-purple-900 to-indigo-900 p-4 flex flex-col items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl font-bold text-white mb-2">
          {isFinal ? 'Classement Final' : 'Classement'}
        </h1>
        {isFinal && rankings[0] && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-2xl text-yellow-400"
          >
            Victoire de {rankings[0].nickname} !
          </motion.p>
        )}
      </motion.div>

      <div className="w-full max-w-lg space-y-3">
        {rankings.slice(0, 10).map((player, index) => {
          const isCurrentPlayer = player.playerId === currentPlayerId

          return (
            <motion.div
              key={player.playerId}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                'flex items-center gap-4 p-4 rounded-xl shadow-lg',
                getRankStyle(player.rank),
                isCurrentPlayer && 'ring-2 ring-white ring-offset-2 ring-offset-purple-900'
              )}
            >
              {/* Rank */}
              <div className="w-12 flex items-center justify-center">
                {getRankIcon(player.rank) || (
                  <span className="text-2xl font-bold text-gray-600">
                    {player.rank}
                  </span>
                )}
              </div>

              {/* Avatar */}
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-inner"
                style={{ backgroundColor: player.avatarColor }}
              >
                {player.nickname.charAt(0).toUpperCase()}
              </div>

              {/* Name */}
              <div className="flex-1">
                <span
                  className={cn(
                    'font-bold text-lg',
                    player.rank <= 3 ? 'text-white' : 'text-gray-800'
                  )}
                >
                  {player.nickname}
                </span>
              </div>

              {/* Score */}
              <div className="text-right">
                <div
                  className={cn(
                    'text-2xl font-bold',
                    player.rank <= 3 ? 'text-white' : 'text-gray-800'
                  )}
                >
                  {player.score}
                </div>
                {player.pointsGained !== undefined && player.pointsGained > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-green-400 font-semibold"
                  >
                    +{player.pointsGained}
                  </motion.div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Countdown pour mode auto */}
      {autoMode && !isFinal && nextQuestionIn !== undefined && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-white/70 text-center"
        >
          Question suivante dans {nextQuestionIn}s
        </motion.div>
      )}
    </div>
  )
}
