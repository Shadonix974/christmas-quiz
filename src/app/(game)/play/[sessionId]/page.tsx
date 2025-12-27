'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { WaitingRoom } from '@/components/game/WaitingRoom'
import { AnswerButtons } from '@/components/game/AnswerButtons'
import { GameOver } from '@/components/game/GameOver'
import { Leaderboard } from '@/components/game/Leaderboard'
import { Button } from '@/components/ui/Button'
import { useGameState } from '@/hooks/useGameState'
import { useTimer } from '@/hooks/useTimer'
import { usePusher } from '@/hooks/usePusher'
import { LogOut, X } from 'lucide-react'
import { motion } from 'framer-motion'
import type { QuestionData, LeaderboardEntry, SubmitAnswerResponse } from '@/types'

interface SessionData {
  id: string
  code: string
  status: string
  totalQuestions: number
  currentQuestion: number
  timePerQuestion: number
  // Mode automatique
  autoMode: boolean
  showLeaderboard: boolean
  revealDuration: number
  leaderboardDuration: number
  players: Array<{
    id: string
    nickname: string
    avatarColor: string
    score: number
    isHost: boolean
  }>
}

export default function PlayPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string

  const [session, setSession] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState<QuestionData | null>(null)
  const [gameStatus, setGameStatus] = useState<'waiting' | 'audio' | 'question' | 'answered' | 'reveal' | 'leaderboard' | 'finished'>('waiting')
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [lastAnswer, setLastAnswer] = useState<SubmitAnswerResponse | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<number | undefined>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showQuitConfirm, setShowQuitConfirm] = useState(false)

  const { state, addPlayer, setAnswer, answeredCount, resetAnsweredCount, getFinalStats, currentStreak, questionTimerStarted } = useGameState({
    sessionId,
    playerId: playerId || undefined,
    isHost: false,
  })

  const { isConnected } = usePusher(sessionId)

  const timer = useTimer({
    initialTime: session?.timePerQuestion || 20,
    onComplete: () => {
      // Time's up
    },
    autoStart: false,
  })

  // Timer pour afficher le compte à rebours pendant le reveal (mode auto)
  const revealTimer = useTimer({
    initialTime: session?.revealDuration || 3,
    onComplete: () => {
      // Géré par le host
    },
    autoStart: false,
  })

  // Timer pour afficher le compte à rebours pendant le leaderboard (mode auto)
  const leaderboardTimer = useTimer({
    initialTime: session?.leaderboardDuration || 5,
    onComplete: () => {
      // Géré par le host
    },
    autoStart: false,
  })

  // Refs pour les fonctions timer (évite les problèmes de dépendances)
  const timerFns = useRef({ reset: timer.reset, start: timer.start, pause: timer.pause })
  const revealTimerFns = useRef({ reset: revealTimer.reset, start: revealTimer.start, pause: revealTimer.pause })
  const leaderboardTimerFns = useRef({ reset: leaderboardTimer.reset, start: leaderboardTimer.start, pause: leaderboardTimer.pause })

  useEffect(() => {
    timerFns.current = { reset: timer.reset, start: timer.start, pause: timer.pause }
    revealTimerFns.current = { reset: revealTimer.reset, start: revealTimer.start, pause: revealTimer.pause }
    leaderboardTimerFns.current = { reset: leaderboardTimer.reset, start: leaderboardTimer.start, pause: leaderboardTimer.pause }
  })

  // Initial load
  useEffect(() => {
    const loadSession = async () => {
      try {
        const storedPlayerId = localStorage.getItem('playerId')
        setPlayerId(storedPlayerId)

        const response = await fetch(`/api/sessions/${sessionId}`)

        if (!response.ok) {
          throw new Error('Session non trouvée')
        }

        const data = await response.json()
        setSession(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
      } finally {
        setLoading(false)
      }
    }

    loadSession()
  }, [sessionId])

  // Listen for player updates
  useEffect(() => {
    if (state.players.length > 0 && session) {
      setSession((prev) => {
        if (!prev) return null

        // Fusionner les joueurs existants avec les nouveaux
        const existingNonHostPlayers = prev.players.filter((p) => !p.isHost)
        const newPlayers = state.players.map((p) => ({
          ...p,
          score: 0,
          isHost: false,
        }))

        // Créer un Map pour fusionner par ID (les nouveaux écrasent les anciens)
        const playerMap = new Map<string, typeof existingNonHostPlayers[0]>()
        existingNonHostPlayers.forEach((p) => playerMap.set(p.id, p))
        newPlayers.forEach((p) => playerMap.set(p.id, p))

        return {
          ...prev,
          players: [
            ...prev.players.filter((p) => p.isHost),
            ...Array.from(playerMap.values()),
          ],
        }
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.players])

  // Handle question timer start signal from host (audio complete)
  useEffect(() => {
    if (questionTimerStarted > 0 && gameStatus === 'audio' && currentQuestion) {
      console.log('🎵 Audio complete signal received, starting question timer')
      setGameStatus('question')
      timerFns.current.reset(currentQuestion.timeLimit)
      timerFns.current.start()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionTimerStarted])

  // Handle Pusher events
  useEffect(() => {
    if (state.status === 'question' && state.currentQuestion) {
      const question = state.currentQuestion as QuestionData
      setCurrentQuestion(question)
      setSelectedAnswer(undefined)
      setLastAnswer(null)
      resetAnsweredCount()

      // Check if question has audio (YouTube)
      if (question.youtubeVideoId) {
        // Go to audio state first
        setGameStatus('audio')
      } else {
        // No audio, go directly to question
        setGameStatus('question')
        timerFns.current.reset(question.timeLimit)
        timerFns.current.start()
      }
    }

    if (state.status === 'answered' && state.lastAnswer) {
      setLastAnswer(state.lastAnswer)
      setGameStatus('answered')
    }

    if (state.status === 'reveal') {
      setGameStatus('reveal')
      timerFns.current.pause()
      // En mode auto, démarrer le timer de reveal pour affichage
      if (session?.autoMode) {
        revealTimerFns.current.reset(session.revealDuration)
        revealTimerFns.current.start()
      }
    }

    if (state.status === 'leaderboard' && state.leaderboard) {
      setLeaderboard(state.leaderboard)
      setGameStatus('leaderboard')
      revealTimerFns.current.pause()
      // En mode auto, démarrer le timer de leaderboard pour affichage
      if (session?.autoMode) {
        leaderboardTimerFns.current.reset(session.leaderboardDuration)
        leaderboardTimerFns.current.start()
      }
    }

    if (state.status === 'finished' && state.leaderboard) {
      setLeaderboard(state.leaderboard)
      setGameStatus('finished')
      leaderboardTimerFns.current.pause()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status, state.currentQuestion, state.lastAnswer, state.leaderboard])

  const handleAnswer = useCallback(async (index: number) => {
    if (!playerId || !currentQuestion || isSubmitting || selectedAnswer !== undefined) return

    setIsSubmitting(true)
    setSelectedAnswer(index)

    try {
      const responseTime = timer.getElapsedMs()

      const response = await fetch(`/api/sessions/${sessionId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId,
          questionId: currentQuestion.id,
          answer: String(index),
          responseTime,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setLastAnswer(data)
        setAnswer(data)
        setGameStatus('answered')
      } else {
        setSelectedAnswer(undefined)
      }
    } catch (err) {
      console.error('Failed to submit answer:', err)
      setSelectedAnswer(undefined)
    } finally {
      setIsSubmitting(false)
    }
  }, [playerId, currentQuestion, sessionId, timer, isSubmitting, selectedAnswer, setAnswer])

  const handleQuit = async () => {
    if (!playerId) return

    try {
      await fetch(`/api/sessions/${sessionId}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId }),
      })
    } catch (err) {
      console.error('Failed to leave session:', err)
    }

    localStorage.removeItem('playerId')
    router.push('/')
  }

  const handleGoHome = () => {
    localStorage.removeItem('playerId')
    router.push('/')
  }

  // Quit confirmation modal
  const QuitConfirmModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-sm mx-4 shadow-2xl">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Quitter la partie ?</h3>
        <p className="text-gray-600 mb-6">
          Vous perdrez votre progression.
        </p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setShowQuitConfirm(false)}
            className="flex-1"
          >
            Annuler
          </Button>
          <Button
            variant="danger"
            onClick={handleQuit}
            className="flex-1"
          >
            Quitter
          </Button>
        </div>
      </div>
    </div>
  )

  // Quit button component
  const QuitButton = () => (
    <button
      onClick={() => setShowQuitConfirm(true)}
      className="fixed top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
      title="Quitter la partie"
    >
      <X className="w-5 h-5 text-white/70" />
    </button>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Chargement...</div>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center flex-col gap-4">
        <div className="text-red-500 text-xl">{error || 'Session non trouvée'}</div>
        <Button onClick={handleGoHome} variant="outline">
          <LogOut className="w-4 h-4 mr-2" />
          Retour à l'accueil
        </Button>
      </div>
    )
  }

  // Waiting room
  if (gameStatus === 'waiting') {
    return (
      <>
        {showQuitConfirm && <QuitConfirmModal />}
        <div className="relative">
          <WaitingRoom
            sessionCode={session.code}
            players={session.players}
            isHost={false}
          />
          <QuitButton />
        </div>
      </>
    )
  }

  // Audio playing - Player side: show vinyl animation while host plays the audio
  if (gameStatus === 'audio' && currentQuestion?.youtubeVideoId) {
    return (
      <>
        {showQuitConfirm && <QuitConfirmModal />}
        <div className="relative min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col items-center justify-center p-4">
          {/* Question counter */}
          <div className="absolute top-4 left-4">
            <span className="text-white text-lg font-semibold">
              {currentQuestion.questionNumber}/{session.totalQuestions}
            </span>
          </div>

          {/* Vinyl animation */}
          <div className="flex flex-col items-center gap-6">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative"
            >
              {/* Animated glow effect */}
              <motion.div
                className="absolute -inset-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 blur-xl"
                animate={{
                  opacity: [0.4, 0.7, 0.4],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />

              {/* Vinyl disc */}
              <motion.div
                className="relative w-32 h-32 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center shadow-2xl border-4 border-gray-700"
                animate={{ rotate: 360 }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              >
                {/* Inner circle */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-white/80" />
                </div>
                {/* Grooves */}
                <div className="absolute inset-6 rounded-full border border-gray-600/30" />
                <div className="absolute inset-10 rounded-full border border-gray-600/30" />
              </motion.div>

              {/* Sound wave bars */}
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-end gap-1">
                {[20, 28, 16, 32, 24, 30, 18, 26, 22].map((maxHeight, i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 bg-gradient-to-t from-purple-500 to-pink-400 rounded-full"
                    animate={{
                      height: ['8px', `${maxHeight}px`, '8px'],
                    }}
                    transition={{
                      duration: 0.35 + (i % 3) * 0.05,
                      repeat: Infinity,
                      delay: i * 0.05,
                      ease: 'easeInOut',
                    }}
                  />
                ))}
              </div>
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center mt-4"
            >
              <h2 className="text-2xl font-bold text-white mb-1">Écoutez bien !</h2>
              <p className="text-white/60 text-sm">La question apparaîtra après l'extrait</p>
            </motion.div>
          </div>
          <QuitButton />
        </div>
      </>
    )
  }

  // Question / Answer
  if (gameStatus === 'question' || gameStatus === 'answered' || gameStatus === 'reveal') {
    const totalPlayers = session.players.filter((p) => !p.isHost).length

    return (
      <>
        {showQuitConfirm && <QuitConfirmModal />}
        <div className="relative">
          <AnswerButtons
            questionNumber={currentQuestion?.questionNumber || 1}
            totalQuestions={session.totalQuestions}
            text={currentQuestion?.text}
            options={currentQuestion?.options || []}
            timeRemaining={timer.timeRemaining}
            timeLimit={currentQuestion?.timeLimit || 20}
            onAnswer={handleAnswer}
            selectedAnswer={selectedAnswer}
            isCorrect={lastAnswer?.isCorrect}
            pointsAwarded={lastAnswer?.pointsAwarded}
            disabled={isSubmitting || selectedAnswer !== undefined}
            isConnected={isConnected}
            answeredCount={answeredCount}
            totalPlayers={totalPlayers}
            responseTimeMs={lastAnswer?.responseTime}
            streak={currentStreak}
            autoMode={session.autoMode}
            isRevealPhase={gameStatus === 'reveal'}
            revealTimeRemaining={revealTimer.timeRemaining}
            showLeaderboardNext={session.showLeaderboard}
            correctIndex={gameStatus === 'reveal' ? state.correctIndex : undefined}
          />
          <QuitButton />
        </div>
      </>
    )
  }

  // Leaderboard (intermediate)
  if (gameStatus === 'leaderboard') {
    return (
      <>
        {showQuitConfirm && <QuitConfirmModal />}
        <div className="relative">
          <Leaderboard
            rankings={leaderboard}
            currentPlayerId={playerId || undefined}
            isFinal={false}
            autoMode={session.autoMode}
            nextQuestionIn={leaderboardTimer.timeRemaining}
          />
          <QuitButton />
        </div>
      </>
    )
  }

  // Game Over (final)
  if (gameStatus === 'finished') {
    const stats = getFinalStats()
    const currentPlayerRanking = leaderboard.find((r) => r.playerId === playerId)

    return (
      <GameOver
        rankings={leaderboard}
        playerId={playerId || undefined}
        playerStats={currentPlayerRanking ? {
          ...stats,
          totalPoints: currentPlayerRanking.score,
          rank: currentPlayerRanking.rank,
        } : undefined}
        onGoHome={handleGoHome}
      />
    )
  }

  return null
}
