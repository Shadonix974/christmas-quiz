import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { triggerEvent, getSessionChannel } from '@/lib/pusher'
import { PUSHER_EVENTS } from '@/lib/constants'
import type { LeaderboardEntry, GameFinishedEvent } from '@/types'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params
    const body = await request.json()
    const { hostId } = body

    console.log('Stop request:', { sessionId, hostId })

    if (!hostId) {
      return NextResponse.json(
        { error: 'hostId requis' },
        { status: 400 }
      )
    }

    // Récupérer la session
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
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

    console.log('Session found:', { sessionHostId: session.hostId, status: session.status })

    // Vérifier que c'est bien l'hôte
    if (session.hostId !== hostId) {
      return NextResponse.json(
        { error: `Seul l'hôte peut arrêter la partie (expected: ${session.hostId}, got: ${hostId})` },
        { status: 403 }
      )
    }

    // Si la session est déjà terminée, renvoyer le classement final
    if (session.status === 'FINISHED') {
      type PlayerType = { id: string; nickname: string; avatarColor: string; score: number; isHost: boolean }
      const finalRankings = session.players
        .filter((p: PlayerType) => !p.isHost)
        .map((player: PlayerType, index: number) => ({
          playerId: player.id,
          nickname: player.nickname,
          avatarColor: player.avatarColor,
          score: player.score,
          rank: index + 1,
        }))

      return NextResponse.json({
        status: 'FINISHED',
        message: 'La partie était déjà terminée',
        finalRankings,
      })
    }

    // Mettre à jour le statut de la session
    await prisma.session.update({
      where: { id: sessionId },
      data: { status: 'FINISHED' },
    })

    // Préparer le classement final
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
      winner: winner
        ? {
            playerId: winner.playerId,
            nickname: winner.nickname,
            score: winner.score,
          }
        : { playerId: '', nickname: 'Personne', score: 0 },
    }

    // Notifier tous les joueurs via Pusher
    const channel = getSessionChannel(sessionId)
    await triggerEvent(channel, PUSHER_EVENTS.GAME_STOPPED, finishEvent)
    await triggerEvent(channel, PUSHER_EVENTS.GAME_FINISHED, finishEvent)

    return NextResponse.json({
      status: 'FINISHED',
      message: 'Partie arrêtée',
      finalRankings,
    })
  } catch (error) {
    console.error('Error stopping session:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'arrêt de la partie' },
      { status: 500 }
    )
  }
}
