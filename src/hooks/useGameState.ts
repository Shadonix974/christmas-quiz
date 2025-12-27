'use client'

import { useState, useCallback, useEffect } from 'react'
import { usePusher } from './usePusher'
import { PUSHER_EVENTS } from '@/lib/constants'
import type {
  GameState,
  GameStatus,
  PlayerJoinedEvent,
  PlayerLeftEvent,
  GameStartedEvent,
  QuestionData,
  QuestionDataHost,
  AnswerReceivedEvent,
  QuestionEndedEvent,
  LeaderboardUpdateEvent,
  GameFinishedEvent,
  SubmitAnswerResponse,
} from '@/types'

interface PlayerStats {
  correctAnswers: number
  totalQuestions: number
  responseTimes: number[]
  bestStreak: number
  currentStreak: number
}

interface UseGameStateOptions {
  sessionId: string
  playerId?: string
  isHost: boolean
}

export function useGameState({ sessionId, playerId, isHost }: UseGameStateOptions) {
  const [state, setState] = useState<GameState>({
    status: 'connecting',
    sessionId,
    playerId,
    isHost,
    players: [],
  })

  const [playerStats, setPlayerStats] = useState<PlayerStats>({
    correctAnswers: 0,
    totalQuestions: 0,
    responseTimes: [],
    bestStreak: 0,
    currentStreak: 0,
  })

  const [answeredCount, setAnsweredCount] = useState(0)
  const [questionTimerStarted, setQuestionTimerStarted] = useState(0) // Increments when host signals audio complete

  const { subscribe } = usePusher(sessionId)

  const updateState = useCallback((updates: Partial<GameState>) => {
    setState((prev) => ({ ...prev, ...updates }))
  }, [])

  const setStatus = useCallback((status: GameStatus) => {
    updateState({ status })
  }, [updateState])

  const addPlayer = useCallback((player: PlayerJoinedEvent['player']) => {
    setState((prev) => ({
      ...prev,
      players: [...prev.players.filter((p) => p.id !== player.id), player],
    }))
  }, [])

  const removePlayer = useCallback((playerId: string) => {
    setState((prev) => ({
      ...prev,
      players: prev.players.filter((p) => p.id !== playerId),
    }))
  }, [])

  const setQuestion = useCallback((question: QuestionData | QuestionDataHost) => {
    updateState({
      currentQuestion: question,
      status: 'question',
      lastAnswer: undefined,
    })
  }, [updateState])

  const setAnswer = useCallback((answer: SubmitAnswerResponse) => {
    updateState({
      lastAnswer: answer,
      status: 'answered',
    })

    // Mettre à jour les stats du joueur
    setPlayerStats((prev) => {
      const newCorrect = answer.isCorrect ? prev.correctAnswers + 1 : prev.correctAnswers
      const newStreak = answer.isCorrect ? prev.currentStreak + 1 : 0
      const newBestStreak = Math.max(prev.bestStreak, newStreak)

      return {
        correctAnswers: newCorrect,
        totalQuestions: prev.totalQuestions + 1,
        responseTimes: answer.responseTime
          ? [...prev.responseTimes, answer.responseTime]
          : prev.responseTimes,
        currentStreak: newStreak,
        bestStreak: newBestStreak,
      }
    })
  }, [updateState])

  const resetAnsweredCount = useCallback(() => {
    setAnsweredCount(0)
  }, [])

  // Subscribe to Pusher events
  useEffect(() => {
    const unsubscribes: (() => void)[] = []

    // Player joined
    unsubscribes.push(
      subscribe(PUSHER_EVENTS.PLAYER_JOINED, (data) => {
        const event = data as PlayerJoinedEvent
        addPlayer(event.player)
      })
    )

    // Player left
    unsubscribes.push(
      subscribe(PUSHER_EVENTS.PLAYER_LEFT, (data) => {
        const event = data as PlayerLeftEvent
        removePlayer(event.playerId)
      })
    )

    // Game started
    unsubscribes.push(
      subscribe(PUSHER_EVENTS.GAME_STARTED, (data) => {
        const event = data as GameStartedEvent
        updateState({ status: 'question' })
        console.log('Game started:', event)
      })
    )

    // New question (for players)
    if (!isHost) {
      unsubscribes.push(
        subscribe(PUSHER_EVENTS.NEW_QUESTION, (data) => {
          console.log('📩 NEW_QUESTION received:', data)
          const question = data as QuestionData
          setQuestion(question)
        })
      )
    }

    // New question for host
    if (isHost) {
      unsubscribes.push(
        subscribe(PUSHER_EVENTS.NEW_QUESTION_HOST, (data) => {
          const question = data as QuestionDataHost
          setQuestion(question)
        })
      )
    }

    // Answer received (pour compteur temps réel)
    unsubscribes.push(
      subscribe(PUSHER_EVENTS.ANSWER_RECEIVED, (data) => {
        const event = data as AnswerReceivedEvent
        setAnsweredCount((prev) => prev + 1)
        console.log('Answer received:', event)
      })
    )

    // Game stopped
    unsubscribes.push(
      subscribe(PUSHER_EVENTS.GAME_STOPPED, (data) => {
        const event = data as GameFinishedEvent
        updateState({
          status: 'finished',
          leaderboard: event.finalRankings,
        })
      })
    )

    // Question ended
    unsubscribes.push(
      subscribe(PUSHER_EVENTS.QUESTION_ENDED, (data) => {
        const event = data as QuestionEndedEvent
        updateState({
          status: 'reveal',
          correctIndex: event.correctIndex,
        })
        console.log('Question ended:', event)
      })
    )

    // Question timer start (host signals audio complete)
    if (!isHost) {
      unsubscribes.push(
        subscribe(PUSHER_EVENTS.QUESTION_TIMER_START, () => {
          console.log('📩 QUESTION_TIMER_START received - audio complete, start timer')
          setQuestionTimerStarted((prev) => prev + 1)
        })
      )
    }

    // Leaderboard update
    unsubscribes.push(
      subscribe(PUSHER_EVENTS.LEADERBOARD_UPDATE, (data) => {
        const event = data as LeaderboardUpdateEvent
        updateState({
          status: 'leaderboard',
          leaderboard: event.rankings,
        })
      })
    )

    // Game finished
    unsubscribes.push(
      subscribe(PUSHER_EVENTS.GAME_FINISHED, (data) => {
        const event = data as GameFinishedEvent
        updateState({
          status: 'finished',
          leaderboard: event.finalRankings,
        })
      })
    )

    // Mark as connected
    setStatus('waiting')

    return () => {
      unsubscribes.forEach((unsub) => unsub())
    }
  }, [subscribe, isHost, addPlayer, removePlayer, updateState, setQuestion, setStatus])

  // Calculer les stats finales pour GameOver
  const getFinalStats = useCallback(() => {
    const avgTime = playerStats.responseTimes.length > 0
      ? playerStats.responseTimes.reduce((a, b) => a + b, 0) / playerStats.responseTimes.length / 1000
      : 0

    return {
      correctAnswers: playerStats.correctAnswers,
      totalQuestions: playerStats.totalQuestions,
      averageResponseTime: avgTime,
      bestStreak: playerStats.bestStreak,
      totalPoints: 0, // Will be set from leaderboard
      rank: 0, // Will be set from leaderboard
    }
  }, [playerStats])

  return {
    state,
    updateState,
    setStatus,
    addPlayer,
    removePlayer,
    setQuestion,
    setAnswer,
    playerStats,
    answeredCount,
    resetAnsweredCount,
    getFinalStats,
    currentStreak: playerStats.currentStreak,
    questionTimerStarted, // Signal from host that audio is complete, start timer
  }
}
