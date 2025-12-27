'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { WaitingRoom } from '@/components/game/WaitingRoom'
import { QuestionDisplay } from '@/components/game/QuestionDisplay'
import { Leaderboard } from '@/components/game/Leaderboard'
import { GameOver } from '@/components/game/GameOver'
import { AudioPlayingScreen } from '@/components/game/AudioPlayingScreen'
import { Button } from '@/components/ui/Button'
import { useGameState } from '@/hooks/useGameState'
import { useTimer } from '@/hooks/useTimer'
import { StopCircle } from 'lucide-react'
import type { QuestionDataHost, LeaderboardEntry } from '@/types'

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

export default function HostPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string

  const [session, setSession] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [hostId, setHostId] = useState<string | null>(null)
  const [isStarting, setIsStarting] = useState(false)
  const [isStopping, setIsStopping] = useState(false)
  const [showStopConfirm, setShowStopConfirm] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState<QuestionDataHost | null>(null)
  const [gameStatus, setGameStatus] = useState<'waiting' | 'audio' | 'question' | 'reveal' | 'leaderboard' | 'finished'>('waiting')
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [showAnswer, setShowAnswer] = useState(false)
  const [answerDistribution, setAnswerDistribution] = useState<number[]>([])

  const { state, addPlayer, removePlayer, answeredCount, resetAnsweredCount } = useGameState({
    sessionId,
    playerId: hostId || undefined,
    isHost: true,
  })

  const timer = useTimer({
    initialTime: session?.timePerQuestion || 20,
    onComplete: () => {
      handleReveal()
    },
    autoStart: false,
  })

  // Timer pour l'affichage de la réponse (mode auto)
  const revealTimer = useTimer({
    initialTime: session?.revealDuration || 3,
    onComplete: () => {
      if (session?.autoMode) {
        if (session?.showLeaderboard) {
          handleShowLeaderboard()
        } else {
          handleNextQuestion()
        }
      }
    },
    autoStart: false,
  })

  // Timer pour l'affichage du classement (mode auto)
  const leaderboardTimer = useTimer({
    initialTime: session?.leaderboardDuration || 5,
    onComplete: () => {
      if (session?.autoMode) {
        handleNextQuestion()
      }
    },
    autoStart: false,
  })

  // Fetch session data
  const fetchSession = useCallback(async () => {
    try {
      const response = await fetch(`/api/sessions/${session?.code || ''}`)
      if (response.ok) {
        const data = await response.json()
        setSession((prev) => ({ ...prev, ...data }))
      }
    } catch {
      console.error('Failed to fetch session')
    }
  }, [session?.code])

  // Initial load
  useEffect(() => {
    const loadSession = async () => {
      try {
        // Get hostId from localStorage
        const storedHostId = localStorage.getItem('playerId')
        setHostId(storedHostId)

        // Find session by ID (we need to get it via the code first)
        // For now, we'll use a direct approach
        const response = await fetch(`/api/sessions/${sessionId}`, {
          method: 'GET',
        })

        if (!response.ok) {
          // Try to get by code instead
          throw new Error('Session non trouvee')
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

  // Handle Pusher events
  useEffect(() => {
    if (state.status === 'question' && state.currentQuestion) {
      const question = state.currentQuestion as QuestionDataHost
      setCurrentQuestion(question)
      setShowAnswer(false)
      resetAnsweredCount()
      setAnswerDistribution([0, 0, 0, 0])

      // Vérifier si la question a de l'audio YouTube
      if (question.youtubeVideoId) {
        // Aller en mode audio d'abord
        setGameStatus('audio')
      } else {
        // Pas d'audio, aller directement à la question
        setGameStatus('question')
        timer.reset(question.timeLimit)
        timer.start()
      }
    }

    if (state.status === 'leaderboard' && state.leaderboard) {
      setLeaderboard(state.leaderboard)
      setGameStatus('leaderboard')
    }

    if (state.status === 'finished') {
      if (state.leaderboard) {
        setLeaderboard(state.leaderboard)
      }
      setGameStatus('finished')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status, state.currentQuestion, state.leaderboard])

  // Handle audio complete - start the question timer and notify players
  const handleAudioComplete = useCallback(async () => {
    if (currentQuestion && hostId) {
      setGameStatus('question')
      timer.reset(currentQuestion.timeLimit)

      // D'abord notifier les joueurs pour synchroniser les timers
      try {
        await fetch(`/api/sessions/${sessionId}/start-timer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hostId }),
        })
      } catch (err) {
        console.error('Failed to notify players of timer start:', err)
      }

      // Puis démarrer le timer du host (après que les joueurs aient reçu le signal)
      timer.start()
    }
  }, [currentQuestion, hostId, sessionId, timer])

  const handleStart = async () => {
    if (!hostId) return
    setIsStarting(true)

    try {
      const response = await fetch(`/api/sessions/${sessionId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du demarrage')
      }

      setCurrentQuestion(data.question)

      // Check if question has audio (YouTube)
      if (data.question.youtubeVideoId) {
        setGameStatus('audio')
      } else {
        setGameStatus('question')
        timer.reset(data.question.timeLimit)
        timer.start()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setIsStarting(false)
    }
  }

  const handleReveal = async () => {
    if (!hostId) return
    timer.pause()

    try {
      const response = await fetch(`/api/sessions/${sessionId}/next`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostId, action: 'reveal' }),
      })

      const data = await response.json()

      if (response.ok) {
        setShowAnswer(true)
        setAnswerDistribution(data.reveal?.stats?.answerDistribution || [0, 0, 0, 0])
        setGameStatus('reveal')

        // En mode auto, démarrer le timer pour passer au classement ou à la question suivante
        if (session?.autoMode) {
          revealTimer.reset(session.revealDuration)
          revealTimer.start()
        }
      }
    } catch (err) {
      console.error('Failed to reveal:', err)
    }
  }

  const handleShowLeaderboard = async () => {
    if (!hostId) return

    // Stopper le timer de reveal si en cours
    revealTimer.pause()

    try {
      const response = await fetch(`/api/sessions/${sessionId}/next`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostId, action: 'leaderboard' }),
      })

      const data = await response.json()

      if (response.ok) {
        setLeaderboard(data.leaderboard || [])
        setGameStatus('leaderboard')

        // En mode auto, démarrer le timer pour passer à la question suivante
        if (session?.autoMode) {
          leaderboardTimer.reset(session.leaderboardDuration)
          leaderboardTimer.start()
        }
      }
    } catch (err) {
      console.error('Failed to show leaderboard:', err)
    }
  }

  const handleNextQuestion = async () => {
    if (!hostId) return

    // Stopper les timers de transition si en cours
    revealTimer.pause()
    leaderboardTimer.pause()

    try {
      const response = await fetch(`/api/sessions/${sessionId}/next`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostId }),
      })

      const data = await response.json()

      if (response.ok) {
        if (data.status === 'FINISHED') {
          setLeaderboard(data.finalRankings || [])
          setGameStatus('finished')
        } else if (data.question) {
          setCurrentQuestion(data.question)
          setShowAnswer(false)
          resetAnsweredCount()
          setAnswerDistribution([0, 0, 0, 0])

          // Check if question has audio (YouTube)
          if (data.question.youtubeVideoId) {
            setGameStatus('audio')
          } else {
            setGameStatus('question')
            timer.reset(data.question.timeLimit)
            timer.start()
          }
        }
      }
    } catch (err) {
      console.error('Failed to go to next question:', err)
    }
  }

  const handleStopGame = async () => {
    if (!hostId) {
      console.error('No hostId available')
      setError('Erreur: ID hôte non trouvé')
      return
    }
    setIsStopping(true)

    try {
      console.log('Stopping game with hostId:', hostId)
      const response = await fetch(`/api/sessions/${sessionId}/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostId }),
      })

      const data = await response.json()
      console.log('Stop response:', data)

      if (response.ok || data.status === 'FINISHED') {
        setLeaderboard(data.finalRankings || [])
        setGameStatus('finished')
        setShowStopConfirm(false)
      } else {
        console.error('Stop failed:', data.error)
        setError(data.error || 'Erreur lors de l\'arrêt')
      }
    } catch (err) {
      console.error('Failed to stop game:', err)
      setError('Erreur réseau')
    } finally {
      setIsStopping(false)
    }
  }

  // Stop confirmation modal
  const StopConfirmModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-sm mx-4 shadow-2xl">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Arreter la partie ?</h3>
        <p className="text-gray-600 mb-6">
          Cette action terminera la partie pour tous les joueurs.
        </p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setShowStopConfirm(false)}
            className="flex-1"
          >
            Annuler
          </Button>
          <Button
            variant="danger"
            onClick={handleStopGame}
            isLoading={isStopping}
            className="flex-1"
          >
            Arreter
          </Button>
        </div>
      </div>
    </div>
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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-red-500 text-xl">{error || 'Session non trouvee'}</div>
      </div>
    )
  }

  // Waiting room
  if (gameStatus === 'waiting') {
    return (
      <>
        {showStopConfirm && <StopConfirmModal />}
        <div className="relative">
          <WaitingRoom
            sessionCode={session.code}
            players={session.players}
            isHost={true}
            onStart={handleStart}
            isStarting={isStarting}
          />
          {/* Bouton stop en haut à droite */}
          <button
            onClick={() => setShowStopConfirm(true)}
            className="fixed top-4 right-4 p-3 bg-red-500/20 hover:bg-red-500/40 rounded-full transition-colors"
            title="Arreter la partie"
          >
            <StopCircle className="w-6 h-6 text-red-400" />
          </button>
        </div>
      </>
    )
  }

  // Audio playing
  if (gameStatus === 'audio' && currentQuestion?.youtubeVideoId) {
    return (
      <>
        {showStopConfirm && <StopConfirmModal />}
        <div className="relative">
          <AudioPlayingScreen
            questionNumber={currentQuestion.questionNumber}
            totalQuestions={session.totalQuestions}
            youtubeVideoId={currentQuestion.youtubeVideoId}
            audioStartTime={currentQuestion.audioStartTime}
            audioEndTime={currentQuestion.audioEndTime}
            onComplete={handleAudioComplete}
            isHost={true}
          />
          {/* Bouton stop en haut à droite */}
          <button
            onClick={() => setShowStopConfirm(true)}
            className="fixed top-4 right-4 p-3 bg-red-500/20 hover:bg-red-500/40 rounded-full transition-colors z-10"
            title="Arreter la partie"
          >
            <StopCircle className="w-6 h-6 text-red-400" />
          </button>
        </div>
      </>
    )
  }

  // Question display
  if (gameStatus === 'question' || gameStatus === 'reveal') {
    return (
      <>
        {showStopConfirm && <StopConfirmModal />}
        <div className="relative">
          <QuestionDisplay
            questionNumber={currentQuestion?.questionNumber || 1}
            totalQuestions={session.totalQuestions}
            text={currentQuestion?.text || ''}
            options={currentQuestion?.options || []}
            correctIndex={showAnswer ? currentQuestion?.correctIndex : undefined}
            timeRemaining={timer.timeRemaining}
            timeLimit={currentQuestion?.timeLimit || 20}
            answeredCount={answeredCount}
            totalPlayers={session.players.filter((p) => !p.isHost).length}
            showAnswer={showAnswer}
            answerDistribution={answerDistribution}
          />

          {/* Bouton stop en haut à droite */}
          <button
            onClick={() => setShowStopConfirm(true)}
            className="fixed top-4 right-4 p-3 bg-red-500/20 hover:bg-red-500/40 rounded-full transition-colors z-10"
            title="Arreter la partie"
          >
            <StopCircle className="w-6 h-6 text-red-400" />
          </button>

          {/* Control buttons */}
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
            {/* Timer en mode auto pendant reveal */}
            {session.autoMode && gameStatus === 'reveal' && (
              <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm">
                {session.showLeaderboard ? 'Classement' : 'Question suivante'} dans {revealTimer.timeRemaining}s
              </div>
            )}

            <div className="flex gap-4">
              {/* Mode manuel : tous les boutons */}
              {!session.autoMode && gameStatus === 'question' && !showAnswer && (
                <Button onClick={handleReveal} variant="secondary" size="lg">
                  Reveler la reponse
                </Button>
              )}
              {!session.autoMode && gameStatus === 'reveal' && (
                <Button onClick={handleShowLeaderboard} variant="primary" size="lg">
                  Voir le classement
                </Button>
              )}

              {/* Mode auto : bouton Passer pour accélérer */}
              {session.autoMode && gameStatus === 'question' && !showAnswer && (
                <Button onClick={handleReveal} variant="secondary" size="lg">
                  Passer
                </Button>
              )}
              {session.autoMode && gameStatus === 'reveal' && (
                <Button
                  onClick={() => {
                    if (session.showLeaderboard) {
                      handleShowLeaderboard()
                    } else {
                      handleNextQuestion()
                    }
                  }}
                  variant="secondary"
                  size="lg"
                >
                  Passer
                </Button>
              )}
            </div>
          </div>
        </div>
      </>
    )
  }

  // Leaderboard
  if (gameStatus === 'leaderboard') {
    return (
      <>
        {showStopConfirm && <StopConfirmModal />}
        <div className="relative">
          <Leaderboard rankings={leaderboard} isFinal={false} />
          {/* Bouton stop en haut à droite */}
          <button
            onClick={() => setShowStopConfirm(true)}
            className="fixed top-4 right-4 p-3 bg-red-500/20 hover:bg-red-500/40 rounded-full transition-colors z-10"
            title="Arrêter la partie"
          >
            <StopCircle className="w-6 h-6 text-red-400" />
          </button>
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
            {/* Timer en mode auto */}
            {session.autoMode && (
              <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm">
                Question suivante dans {leaderboardTimer.timeRemaining}s
              </div>
            )}

            {/* Mode manuel : bouton question suivante */}
            {!session.autoMode && (
              <Button onClick={handleNextQuestion} variant="primary" size="lg">
                Question suivante
              </Button>
            )}

            {/* Mode auto : bouton Passer */}
            {session.autoMode && (
              <Button onClick={handleNextQuestion} variant="secondary" size="lg">
                Passer
              </Button>
            )}
          </div>
        </div>
      </>
    )
  }

  // Final leaderboard
  if (gameStatus === 'finished') {
    return (
      <GameOver
        rankings={leaderboard}
        onGoHome={() => {
          localStorage.removeItem('playerId')
          localStorage.removeItem('isHost')
          router.push('/')
        }}
      />
    )
  }

  return null
}
