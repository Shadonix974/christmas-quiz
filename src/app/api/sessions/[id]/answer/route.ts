import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculatePoints } from '@/lib/utils'
import { triggerEvent, getSessionChannel } from '@/lib/pusher'
import { PUSHER_EVENTS } from '@/lib/constants'
import type { SubmitAnswerRequest, SubmitAnswerResponse, AnswerReceivedEvent } from '@/types'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params
    const body: SubmitAnswerRequest = await request.json()
    const { playerId, questionId, answer, responseTime } = body

    // Validation
    if (!playerId || !questionId || answer === undefined || responseTime === undefined) {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      )
    }

    // Récupérer la question
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: { session: { include: { players: true } } },
    })

    if (!question) {
      return NextResponse.json(
        { error: 'Question non trouvée' },
        { status: 404 }
      )
    }

    // Vérifier que la session est en mode question
    if (question.session.status !== 'QUESTION') {
      return NextResponse.json(
        { error: 'La question n\'est plus active' },
        { status: 400 }
      )
    }

    // Vérifier si le joueur a déjà répondu
    const existingAnswer = await prisma.answer.findUnique({
      where: {
        playerId_questionId: {
          playerId,
          questionId,
        },
      },
    })

    if (existingAnswer) {
      return NextResponse.json(
        { error: 'Vous avez déjà répondu à cette question' },
        { status: 400 }
      )
    }

    // Vérifier si la réponse est correcte (toutes les questions utilisent correctIndex)
    const isCorrect = parseInt(answer) === question.correctIndex

    // Calculer les points
    const timeLimitMs = question.timeLimit * 1000
    const pointsAwarded = isCorrect
      ? calculatePoints(responseTime, timeLimitMs, question.points)
      : 0

    // Créer la réponse
    await prisma.answer.create({
      data: {
        playerId,
        questionId,
        answer,
        isCorrect,
        responseTime,
        pointsAwarded,
      },
    })

    // Mettre à jour le score du joueur
    const player = await prisma.player.update({
      where: { id: playerId },
      data: {
        score: { increment: pointsAwarded },
      },
    })

    // Compter les réponses
    const answersCount = await prisma.answer.count({
      where: { questionId },
    })

    const totalPlayers = question.session.players.filter((p: { isHost: boolean }) => !p.isHost).length

    // Notifier via Pusher
    const event: AnswerReceivedEvent = {
      playerId,
      answeredCount: answersCount,
      totalPlayers,
    }

    await triggerEvent(
      getSessionChannel(sessionId),
      PUSHER_EVENTS.ANSWER_RECEIVED,
      event
    )

    const response: SubmitAnswerResponse = {
      isCorrect,
      pointsAwarded,
      totalScore: player.score,
      responseTime,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error submitting answer:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la soumission de la réponse' },
      { status: 500 }
    )
  }
}
