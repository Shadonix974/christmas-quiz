'use client'

import { motion } from 'framer-motion'
import { Timer } from './Timer'
import { ANSWER_COLORS } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface QuestionDisplayProps {
  questionNumber: number
  totalQuestions: number
  text: string
  options: string[]
  correctIndex?: number
  timeRemaining: number
  timeLimit: number
  answeredCount?: number
  totalPlayers?: number
  showAnswer?: boolean
  answerDistribution?: number[]
}

export function QuestionDisplay({
  questionNumber,
  totalQuestions,
  text,
  options,
  correctIndex,
  timeRemaining,
  timeLimit,
  answeredCount = 0,
  totalPlayers = 0,
  showAnswer = false,
  answerDistribution = [],
}: QuestionDisplayProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 via-purple-900 to-indigo-900 p-4 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-white">
          <span className="text-xl font-bold">
            Question {questionNumber}/{totalQuestions}
          </span>
        </div>
        <Timer timeRemaining={timeRemaining} totalTime={timeLimit} size="md" />
        <div className="text-white text-right">
          <span className="text-lg">
            {answeredCount}/{totalPlayers} reponses
          </span>
        </div>
      </div>

      {/* Question */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 flex flex-col items-center justify-center mb-8"
      >
        <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-4xl w-full">
          <h2 className="text-2xl md:text-4xl font-bold text-center text-gray-800">
            {text}
          </h2>
        </div>
      </motion.div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-4 max-w-4xl mx-auto w-full">
        {options.map((option, index) => {
          const color = ANSWER_COLORS[index as keyof typeof ANSWER_COLORS]
          const isCorrect = showAnswer && index === correctIndex
          const isWrong = showAnswer && index !== correctIndex
          const count = answerDistribution[index] || 0

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                'relative p-6 rounded-xl text-white font-bold text-xl md:text-2xl',
                'flex items-center justify-center text-center min-h-[100px]',
                'transition-all duration-300',
                isCorrect && 'ring-4 ring-white ring-offset-2',
                isWrong && 'opacity-50'
              )}
              style={{ backgroundColor: color.bg }}
            >
              {option}
              {showAnswer && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg"
                >
                  <span className="text-gray-800 font-bold">{count}</span>
                </motion.div>
              )}
              {isCorrect && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -bottom-2 right-1/2 translate-x-1/2 bg-green-500 text-white px-4 py-1 rounded-full text-sm shadow-lg"
                >
                  Bonne reponse !
                </motion.div>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
