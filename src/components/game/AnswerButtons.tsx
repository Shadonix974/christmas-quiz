'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Timer } from './Timer'
import { ConnectionStatus } from './ConnectionStatus'
import { ANSWER_COLORS, SPEED_THRESHOLDS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { Check, X, Zap, Flame } from 'lucide-react'

interface AnswerButtonsProps {
  questionNumber: number
  totalQuestions: number
  text?: string
  options: string[]
  timeRemaining: number
  timeLimit: number
  onAnswer: (index: number) => void
  selectedAnswer?: number
  isCorrect?: boolean
  pointsAwarded?: number
  disabled?: boolean
  isConnected?: boolean
  answeredCount?: number
  totalPlayers?: number
  responseTimeMs?: number
  streak?: number
  // Mode auto
  autoMode?: boolean
  isRevealPhase?: boolean
  revealTimeRemaining?: number
  showLeaderboardNext?: boolean
  // Index de la bonne réponse (pour la phase reveal)
  correctIndex?: number
}

export function AnswerButtons({
  questionNumber,
  totalQuestions,
  text,
  options,
  timeRemaining,
  timeLimit,
  onAnswer,
  selectedAnswer,
  isCorrect,
  pointsAwarded,
  disabled = false,
  isConnected = true,
  answeredCount = 0,
  totalPlayers = 0,
  responseTimeMs,
  streak = 0,
  autoMode = false,
  isRevealPhase = false,
  revealTimeRemaining = 0,
  showLeaderboardNext = true,
  correctIndex,
}: AnswerButtonsProps) {
  const hasAnswered = selectedAnswer !== undefined

  // Déterminer le badge de vitesse
  const getSpeedBadge = () => {
    if (!responseTimeMs || !isCorrect) return null
    if (responseTimeMs <= SPEED_THRESHOLDS.LIGHTNING) {
      return { label: 'Éclair !', icon: Zap, color: 'text-yellow-300', bg: 'bg-yellow-500/20' }
    }
    if (responseTimeMs <= SPEED_THRESHOLDS.FAST) {
      return { label: 'Rapide !', icon: Flame, color: 'text-orange-300', bg: 'bg-orange-500/20' }
    }
    return null
  }

  const speedBadge = getSpeedBadge()

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-4 flex flex-col">
      {/* Header - 3 colonnes pour centrer le timer */}
      <div className="flex items-center mb-4">
        {/* Gauche: numéro de question */}
        <div className="flex items-center gap-3 flex-1">
          <span className="text-white text-lg font-semibold">
            {questionNumber}/{totalQuestions}
          </span>
          <ConnectionStatus isConnected={isConnected} />
        </div>
        {/* Centre: timer */}
        <div className="flex-1 flex justify-center">
          <Timer timeRemaining={timeRemaining} totalTime={timeLimit} size="sm" />
        </div>
        {/* Droite: espace pour le bouton X (géré par le parent) */}
        <div className="flex-1" />
      </div>

      {/* Compteur de réponses */}
      {!hasAnswered && totalPlayers > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center mb-3"
        >
          <span className="text-white/70 text-sm">
            {answeredCount}/{totalPlayers} ont répondu
          </span>
          <div className="w-full bg-white/10 rounded-full h-1.5 mt-1">
            <motion.div
              className="bg-green-500 h-1.5 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(answeredCount / totalPlayers) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </motion.div>
      )}

      {/* Question text */}
      {text && (
        <div className="bg-white/10 backdrop-blur rounded-2xl p-6 mb-6 max-w-2xl mx-auto">
          <p className="text-white text-center font-semibold text-xl md:text-2xl">{text}</p>
        </div>
      )}

      {/* Message d'attente (affiché après avoir répondu, avant reveal) */}
      {hasAnswered && !isRevealPhase && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center mb-4"
        >
          <span className="text-white/70">En attente de la révélation...</span>
        </motion.div>
      )}

      {/* États 1 & 2: Boutons (même éléments, apparence différente selon l'état) */}
      {!isRevealPhase && (
        <div className="flex-1 flex items-center justify-center">
          <div className="grid grid-cols-2 gap-3 w-full max-w-2xl">
            {options.map((option, index) => {
              const color = ANSWER_COLORS[index as keyof typeof ANSWER_COLORS]
              const isSelected = selectedAnswer === index

              return (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => !hasAnswered && onAnswer(index)}
                  disabled={disabled || hasAnswered}
                  className={cn(
                    'rounded-xl text-white font-bold text-base p-4 min-h-[80px]',
                    'flex items-center justify-center text-center',
                    'shadow-lg relative',
                    !hasAnswered && 'transition-transform active:scale-95 hover:shadow-xl',
                    !hasAnswered && 'disabled:opacity-50 disabled:cursor-not-allowed',
                    hasAnswered && !isSelected && 'opacity-50',
                    hasAnswered && isSelected && 'ring-4 ring-white'
                  )}
                  style={{ backgroundColor: color.bg }}
                  whileTap={!hasAnswered ? { scale: 0.95 } : undefined}
                >
                  {option}
                  {hasAnswered && isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center"
                    >
                      <Check className="w-5 h-5 text-gray-800" />
                    </motion.div>
                  )}
                </motion.button>
              )
            })}
          </div>
        </div>
      )}

      {/* État 3: Phase reveal - afficher bonne/mauvaise réponse */}
      {isRevealPhase && correctIndex !== undefined && (
        <div className="flex-1 flex flex-col">
          {/* Feedback header */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center mb-4"
          >
            {/* Streak badge */}
            <AnimatePresence>
              {isCorrect && streak >= 2 && (
                <motion.div
                  initial={{ opacity: 0, y: -20, scale: 0.5 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="mb-3 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full inline-flex"
                >
                  <span className="text-white font-bold flex items-center gap-2">
                    <Flame className="w-5 h-5" />
                    {streak} d'affilée !
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Speed badge */}
            <AnimatePresence>
              {speedBadge && (
                <motion.div
                  initial={{ opacity: 0, scale: 0, rotate: -10 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  className={cn(
                    'mb-3 px-4 py-2 rounded-full inline-flex items-center gap-2',
                    speedBadge.bg
                  )}
                >
                  <speedBadge.icon className={cn('w-5 h-5', speedBadge.color)} />
                  <span className={cn('font-bold', speedBadge.color)}>
                    {speedBadge.label}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Result message */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="flex flex-col items-center"
            >
              <div
                className={cn(
                  'w-16 h-16 rounded-full flex items-center justify-center mb-2',
                  selectedAnswer === correctIndex ? 'bg-green-500' : 'bg-red-500'
                )}
              >
                {selectedAnswer === correctIndex ? (
                  <Check className="w-8 h-8 text-white" />
                ) : (
                  <X className="w-8 h-8 text-white" />
                )}
              </div>
              <h2 className="text-2xl font-bold text-white">
                {selectedAnswer === correctIndex ? 'Correct !' : 'Mauvaise réponse'}
              </h2>
              {selectedAnswer === correctIndex && pointsAwarded !== undefined && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-2xl font-bold text-yellow-400"
                >
                  +{pointsAwarded} pts
                </motion.span>
              )}
            </motion.div>
          </motion.div>

          {/* Boutons avec highlighting correct/incorrect */}
          <div className="flex-1 flex items-center justify-center">
            <div className="grid grid-cols-2 gap-3 w-full max-w-2xl">
              {options.map((option, index) => {
                const color = ANSWER_COLORS[index as keyof typeof ANSWER_COLORS]
                const isCorrectAnswer = index === correctIndex
                const isPlayerWrongAnswer = selectedAnswer === index && index !== correctIndex

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      'rounded-xl text-white font-bold text-base p-4 min-h-[80px]',
                      'flex items-center justify-center text-center',
                      'shadow-lg relative',
                      isCorrectAnswer && 'ring-4 ring-green-400',
                      isPlayerWrongAnswer && 'ring-4 ring-red-400',
                      !isCorrectAnswer && !isPlayerWrongAnswer && 'opacity-50'
                    )}
                    style={{ backgroundColor: color.bg }}
                  >
                    {option}
                    {isCorrectAnswer && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center"
                      >
                        <Check className="w-5 h-5 text-white" />
                      </motion.div>
                    )}
                    {isPlayerWrongAnswer && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center"
                      >
                        <X className="w-5 h-5 text-white" />
                      </motion.div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* Countdown pour mode auto */}
          {autoMode && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-4 text-center text-white/70 text-sm"
            >
              {showLeaderboardNext ? 'Classement' : 'Question suivante'} dans {revealTimeRemaining}s
            </motion.div>
          )}
        </div>
      )}
    </div>
  )
}
