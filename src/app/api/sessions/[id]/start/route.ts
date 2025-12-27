import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { triggerEvent, getSessionChannel } from '@/lib/pusher'
import { PUSHER_EVENTS } from '@/lib/constants'
import type { GameStartedEvent, QuestionData, QuestionDataHost } from '@/types'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params
    const body = await request.json()
    const { hostId } = body

    // Récupérer la session avec les questions
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
        players: true,
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
        { error: 'Seul l\'hôte peut démarrer la partie' },
        { status: 403 }
      )
    }

    // Vérifier le statut
    if (session.status !== 'WAITING') {
      return NextResponse.json(
        { error: 'La partie a déjà commencé' },
        { status: 400 }
      )
    }

    // Mettre à jour le statut de la session
    await prisma.session.update({
      where: { id: sessionId },
      data: {
        status: 'QUESTION',
        currentQuestion: 0,
      },
    })

    const firstQuestion = session.questions[0]
    if (!firstQuestion) {
      return NextResponse.json(
        { error: 'Aucune question disponible' },
        { status: 400 }
      )
    }

    // Préparer les données de la question pour les joueurs (sans la réponse correcte)
    const questionForPlayers: QuestionData = {
      id: firstQuestion.id,
      questionNumber: 1,
      totalQuestions: session.totalQuestions,
      type: firstQuestion.type,
      text: firstQuestion.text || undefined,
      options: firstQuestion.options,
      timeLimit: firstQuestion.timeLimit,
      maxPoints: firstQuestion.points,
      // YouTube audio
      youtubeVideoId: firstQuestion.youtubeVideoId || undefined,
      audioStartTime: firstQuestion.audioStartTime || undefined,
      audioEndTime: firstQuestion.audioEndTime || undefined,
    }

    // Préparer les données pour l'hôte (avec la réponse correcte)
    const questionForHost: QuestionDataHost = {
      ...questionForPlayers,
      correctIndex: firstQuestion.correctIndex ?? undefined,
      songTitle: firstQuestion.songTitle || undefined,
      songArtist: firstQuestion.songArtist || undefined,
    }

    // Envoyer l'événement de démarrage
    const startEvent: GameStartedEvent = {
      status: 'QUESTION',
      currentQuestion: 0,
      totalQuestions: session.totalQuestions,
    }

    const channel = getSessionChannel(sessionId)

    // Envoyer les événements
    await Promise.all([
      triggerEvent(channel, PUSHER_EVENTS.GAME_STARTED, startEvent),
      triggerEvent(channel, PUSHER_EVENTS.NEW_QUESTION, questionForPlayers),
      triggerEvent(channel, PUSHER_EVENTS.NEW_QUESTION_HOST, questionForHost),
    ])

    return NextResponse.json({
      status: 'QUESTION',
      currentQuestion: 0,
      question: questionForHost,
    })
  } catch (error) {
    console.error('Error starting session:', error)
    return NextResponse.json(
      { error: 'Erreur lors du démarrage de la partie' },
      { status: 500 }
    )
  }
}
