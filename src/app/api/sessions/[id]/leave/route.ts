import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { triggerEvent, getSessionChannel } from '@/lib/pusher'
import { PUSHER_EVENTS } from '@/lib/constants'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params
    const body = await request.json()
    const { playerId } = body

    if (!playerId) {
      return NextResponse.json(
        { error: 'playerId requis' },
        { status: 400 }
      )
    }

    // Vérifier que le joueur existe
    const player = await prisma.player.findUnique({
      where: { id: playerId },
    })

    if (!player) {
      return NextResponse.json(
        { error: 'Joueur non trouvé' },
        { status: 404 }
      )
    }

    // Supprimer le joueur de la session
    await prisma.player.delete({
      where: { id: playerId },
    })

    // Notifier les autres joueurs via Pusher
    const channel = getSessionChannel(sessionId)
    await triggerEvent(channel, PUSHER_EVENTS.PLAYER_LEFT, {
      playerId,
      nickname: player.nickname,
    })

    return NextResponse.json({
      success: true,
      message: 'Joueur retiré de la session',
    })
  } catch (error) {
    console.error('Error leaving session:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la sortie de la session' },
      { status: 500 }
    )
  }
}
