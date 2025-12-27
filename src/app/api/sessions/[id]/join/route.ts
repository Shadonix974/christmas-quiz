import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getRandomAvatarColor } from '@/lib/utils'
import { triggerEvent, getSessionChannel } from '@/lib/pusher'
import { PUSHER_EVENTS, GAME_CONSTANTS } from '@/lib/constants'
import type { JoinSessionRequest, JoinSessionResponse, PlayerJoinedEvent } from '@/types'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params
    const body: JoinSessionRequest = await request.json()
    const { nickname } = body

    // Validation
    if (!nickname || nickname.trim().length < 1) {
      return NextResponse.json(
        { error: 'Le pseudo est requis' },
        { status: 400 }
      )
    }

    if (nickname.trim().length > 20) {
      return NextResponse.json(
        { error: 'Le pseudo ne peut pas dépasser 20 caractères' },
        { status: 400 }
      )
    }

    // Récupérer la session
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { players: true },
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Session non trouvée' },
        { status: 404 }
      )
    }

    // Vérifier le statut
    if (session.status !== 'WAITING') {
      return NextResponse.json(
        { error: 'La partie a déjà commencé' },
        { status: 400 }
      )
    }

    // Vérifier si la session a expiré
    if (new Date() > session.expiresAt) {
      return NextResponse.json(
        { error: 'Cette session a expiré' },
        { status: 410 }
      )
    }

    // Vérifier le nombre de joueurs
    if (session.players.length >= GAME_CONSTANTS.MAX_PLAYERS) {
      return NextResponse.json(
        { error: 'La session est pleine' },
        { status: 400 }
      )
    }

    // Vérifier si le pseudo est déjà pris
    const existingPlayer = session.players.find(
      (p: { nickname: string }) => p.nickname.toLowerCase() === nickname.trim().toLowerCase()
    )
    if (existingPlayer) {
      return NextResponse.json(
        { error: 'Ce pseudo est déjà pris' },
        { status: 400 }
      )
    }

    // Créer le joueur
    const player = await prisma.player.create({
      data: {
        sessionId,
        nickname: nickname.trim(),
        avatarColor: getRandomAvatarColor(),
      },
    })

    // Notifier les autres joueurs via Pusher
    const playerCount = session.players.length + 1
    const event: PlayerJoinedEvent = {
      player: {
        id: player.id,
        nickname: player.nickname,
        avatarColor: player.avatarColor,
      },
      playerCount,
    }

    await triggerEvent(getSessionChannel(sessionId), PUSHER_EVENTS.PLAYER_JOINED, event)

    const response: JoinSessionResponse = {
      playerId: player.id,
      sessionId: session.id,
      nickname: player.nickname,
      avatarColor: player.avatarColor,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error joining session:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la connexion à la session' },
      { status: 500 }
    )
  }
}
