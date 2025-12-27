import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { triggerEvent, getSessionChannel } from '@/lib/pusher'
import { PUSHER_EVENTS } from '@/lib/constants'
import type {
  QuestionData,
  QuestionDataHost,
  QuestionEndedEvent,
  LeaderboardUpdateEvent,
  LeaderboardEntry,
  GameFinishedEvent,
} from '@/types'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params
    const body = await request.json()
    const { hostId, action } = body

    // Récupérer la session
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          include: { answers: true },
        },
        players: {
          orderBy: { score: 'desc' },
        },
      },
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Session non trouvée' },
        { status: 404 }
      )
    }

    // Vérifier que c'est bien l'hôte
    if (session.hostId !== hostId) {
      return NextResponse.json(
        { error: 'Seul l\'hôte peut contrôler la partie' },
        { status: 403 }
      )
    }

    const channel = getSessionChannel(sessionId)
    const currentQuestionIndex = session.currentQuestion
    const currentQuestion = session.questions[currentQuestionIndex]

    // Si on demande la révélation de la réponse
    if (action === 'reveal' || session.status === 'QUESTION') {
      // Calculer les stats de la question
      type AnswerType = { isCorrect: boolean; answer: string }
      const answers: AnswerType[] = currentQuestion?.answers || []
      const correctAnswers = answers.filter((a: AnswerType) => a.isCorrect).length
      const answerDistribution = [0, 0, 0, 0]
      answers.forEach((a: AnswerType) => {
        const idx = parseInt(a.answer)
        if (!isNaN(idx) && idx >= 0 && idx < 4) {
          answerDistribution[idx]++
        }
      })

      const revealEvent: QuestionEndedEvent = {
        correctIndex: currentQuestion?.correctIndex || 0,
        correctAnswer: currentQuestion?.options?.[currentQuestion.correctIndex || 0],
        stats: {
          totalAnswers: answers.length,
          correctAnswers,
          answerDistribution,
        },
      }

      await prisma.session.update({
        where: { id: sessionId },
        data: { status: 'REVEAL' },
      })

      await triggerEvent(channel, PUSHER_EVENTS.QUESTION_ENDED, revealEvent)

      return NextResponse.json({
        status: 'REVEAL',
        currentQuestion: currentQuestionIndex,
        reveal: revealEvent,
      })
    }

    // Si on demande le leaderboard
    if (action === 'leaderboard' || session.status === 'REVEAL') {
      // Préparer le classement
      type PlayerType = { id: string; nickname: string; avatarColor: string; score: number; isHost: boolean }
      type AnswerWithPoints = { playerId: string; pointsAwarded: number }
      const rankings: LeaderboardEntry[] = session.players
        .filter((p: PlayerType) => !p.isHost)
        .map((player: PlayerType, index: number) => {
          const lastAnswer = currentQuestion?.answers.find((a: AnswerWithPoints) => a.playerId === player.id)
          return {
            playerId: player.id,
            nickname: player.nickname,
            avatarColor: player.avatarColor,
            score: player.score,
            rank: index + 1,
            pointsGained: lastAnswer?.pointsAwarded || 0,
          }
        })

      const leaderboardEvent: LeaderboardUpdateEvent = { rankings }

      await prisma.session.update({
        where: { id: sessionId },
        data: { status: 'LEADERBOARD' },
      })

      await triggerEvent(channel, PUSHER_EVENTS.LEADERBOARD_UPDATE, leaderboardEvent)

      return NextResponse.json({
        status: 'LEADERBOARD',
        currentQuestion: currentQuestionIndex,
        leaderboard: rankings,
      })
    }

    // Passer à la question suivante
    const nextQuestionIndex = currentQuestionIndex + 1

    // Vérifier s'il reste des questions
    if (nextQuestionIndex >= session.totalQuestions) {
      // Fin de la partie
      type PlayerType = { id: string; nickname: string; avatarColor: string; score: number; isHost: boolean }
      const finalRankings: LeaderboardEntry[] = session.players
        .filter((p: PlayerType) => !p.isHost)
        .map((player: PlayerType, index: number) => ({
          playerId: player.id,
          nickname: player.nickname,
          avatarColor: player.avatarColor,
          score: player.score,
          rank: index + 1,
        }))

      const winner = finalRankings[0]

      const finishEvent: GameFinishedEvent = {
        finalRankings,
        winner: winner ? {
          playerId: winner.playerId,
          nickname: winner.nickname,
          score: winner.score,
        } : { playerId: '', nickname: 'Personne', score: 0 },
      }

      await prisma.session.update({
        where: { id: sessionId },
        data: { status: 'FINISHED' },
      })

      await triggerEvent(channel, PUSHER_EVENTS.GAME_FINISHED, finishEvent)

      return NextResponse.json({
        status: 'FINISHED',
        finalRankings,
        winner: finishEvent.winner,
      })
    }

    // Charger la prochaine question
    const nextQuestion = session.questions[nextQuestionIndex]

    await prisma.session.update({
      where: { id: sessionId },
      data: {
        status: 'QUESTION',
        currentQuestion: nextQuestionIndex,
      },
    })

    // Préparer les données de la question
    const questionForPlayers: QuestionData = {
      id: nextQuestion.id,
      questionNumber: nextQuestionIndex + 1,
      totalQuestions: session.totalQuestions,
      type: nextQuestion.type,
      text: nextQuestion.text || undefined,
      options: nextQuestion.options,
      timeLimit: nextQuestion.timeLimit,
      maxPoints: nextQuestion.points,
      // YouTube audio
      youtubeVideoId: nextQuestion.youtubeVideoId || undefined,
      audioStartTime: nextQuestion.audioStartTime || undefined,
      audioEndTime: nextQuestion.audioEndTime || undefined,
    }

    const questionForHost: QuestionDataHost = {
      ...questionForPlayers,
      correctIndex: nextQuestion.correctIndex ?? undefined,
      songTitle: nextQuestion.songTitle || undefined,
      songArtist: nextQuestion.songArtist || undefined,
    }

    await Promise.all([
      triggerEvent(channel, PUSHER_EVENTS.NEW_QUESTION, questionForPlayers),
      triggerEvent(channel, PUSHER_EVENTS.NEW_QUESTION_HOST, questionForHost),
    ])

    return NextResponse.json({
      status: 'QUESTION',
      currentQuestion: nextQuestionIndex,
      question: questionForHost,
    })
  } catch (error) {
    console.error('Error advancing to next question:', error)
    return NextResponse.json(
      { error: 'Erreur lors du passage à la question suivante' },
      { status: 500 }
    )
  }
}
