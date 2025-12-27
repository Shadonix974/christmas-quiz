'use client'

import { motion } from 'framer-motion'
import { Trophy, Clock, Flame, Target, Home, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { LeaderboardEntry } from '@/types'

interface PlayerStats {
  correctAnswers: number
  totalQuestions: number
  averageResponseTime: number
  bestStreak: number
  totalPoints: number
  rank: number
}

interface GameOverProps {
  rankings: LeaderboardEntry[]
  playerStats?: PlayerStats
  playerId?: string
  onPlayAgain?: () => void
  onGoHome?: () => void
}

export function GameOver({
  rankings,
  playerStats,
  playerId,
  onPlayAgain,
  onGoHome,
}: GameOverProps) {
  const top3 = rankings.slice(0, 3)
  const currentPlayer = rankings.find((r) => r.playerId === playerId)
  const isWinner = currentPlayer?.rank === 1

  // Couleurs pour le podium
  const podiumColors = [
    'from-yellow-400 to-yellow-600', // 1er - Or
    'from-gray-300 to-gray-500',     // 2e - Argent
    'from-amber-600 to-amber-800',   // 3e - Bronze
  ]

  const podiumHeights = ['h-32', 'h-24', 'h-20']
  const podiumOrder = [1, 0, 2] // Affichage: 2e, 1er, 3e

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900 p-4 flex flex-col">
      {/* Titre */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl font-bold text-white mb-2">
          {isWinner ? 'Victoire !' : 'Partie terminée !'}
        </h1>
        {isWinner && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/20 rounded-full"
          >
            <Trophy className="w-6 h-6 text-yellow-400" />
            <span className="text-yellow-300 font-bold">Champion !</span>
          </motion.div>
        )}
      </motion.div>

      {/* Podium */}
      <div className="flex items-end justify-center gap-2 mb-8 h-48">
        {podiumOrder.map((orderIndex, displayIndex) => {
          const player = top3[orderIndex]
          if (!player) return <div key={displayIndex} className="w-24" />

          return (
            <motion.div
              key={player.playerId}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + displayIndex * 0.15 }}
              className="flex flex-col items-center"
            >
              {/* Avatar */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5 + displayIndex * 0.1, type: 'spring' }}
                className="mb-2"
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg border-2 border-white/30"
                  style={{ backgroundColor: player.avatarColor }}
                >
                  {player.nickname.charAt(0).toUpperCase()}
                </div>
              </motion.div>

              {/* Nom */}
              <span className="text-white text-sm font-medium mb-1 truncate max-w-[80px]">
                {player.nickname}
              </span>

              {/* Score */}
              <span className="text-yellow-400 text-sm font-bold mb-2">
                {player.score} pts
              </span>

              {/* Podium block */}
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                transition={{ delay: 0.3 + displayIndex * 0.1, duration: 0.5 }}
                className={`w-20 ${podiumHeights[orderIndex]} bg-gradient-to-t ${podiumColors[orderIndex]} rounded-t-lg flex items-start justify-center pt-2`}
              >
                <span className="text-2xl font-bold text-white/90">
                  {orderIndex + 1}
                </span>
              </motion.div>
            </motion.div>
          )
        })}
      </div>

      {/* Stats personnelles */}
      {playerStats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white/10 backdrop-blur rounded-2xl p-4 mb-6"
        >
          <h2 className="text-white font-bold text-lg mb-4 text-center">
            Vos statistiques
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {/* Bonnes réponses */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <Target className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-white/60 text-xs">Bonnes réponses</p>
                <p className="text-white font-bold">
                  {playerStats.correctAnswers}/{playerStats.totalQuestions}
                </p>
              </div>
            </div>

            {/* Temps moyen */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-white/60 text-xs">Temps moyen</p>
                <p className="text-white font-bold">
                  {playerStats.averageResponseTime.toFixed(1)}s
                </p>
              </div>
            </div>

            {/* Meilleur streak */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                <Flame className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-white/60 text-xs">Meilleure série</p>
                <p className="text-white font-bold">
                  {playerStats.bestStreak} d'affilée
                </p>
              </div>
            </div>

            {/* Position finale */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-white/60 text-xs">Position finale</p>
                <p className="text-white font-bold">
                  {playerStats.rank}e / {rankings.length}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Position du joueur (si pas dans le top 3) */}
      {currentPlayer && currentPlayer.rank > 3 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="bg-white/5 rounded-xl p-3 mb-6 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <span className="text-white/60 text-lg font-bold">
              #{currentPlayer.rank}
            </span>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: currentPlayer.avatarColor }}
            >
              {currentPlayer.nickname.charAt(0).toUpperCase()}
            </div>
            <span className="text-white font-medium">{currentPlayer.nickname}</span>
          </div>
          <span className="text-yellow-400 font-bold">{currentPlayer.score} pts</span>
        </motion.div>
      )}

      {/* Boutons d'action */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="flex flex-col gap-3 mt-auto"
      >
        {onPlayAgain && (
          <Button
            onClick={onPlayAgain}
            variant="primary"
            size="lg"
            className="w-full"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Rejouer
          </Button>
        )}
        {onGoHome && (
          <Button
            onClick={onGoHome}
            variant="outline"
            size="lg"
            className="w-full"
          >
            <Home className="w-5 h-5 mr-2" />
            Accueil
          </Button>
        )}
      </motion.div>
    </div>
  )
}
