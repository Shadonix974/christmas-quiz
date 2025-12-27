import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { triggerEvent, getSessionChannel } from '@/lib/pusher'
import { PUSHER_EVENTS } from '@/lib/constants'

// Called by host when audio excerpt finishes playing
// Signals all players to start the question timer
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params
    const body = await request.json()
    const { hostId } = body

    // Verify session exists
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Session non trouvée' },
        { status: 404 }
      )
    }

    // Verify it's the host
    if (session.hostId !== hostId) {
      return NextResponse.json(
        { error: 'Seul l\'hôte peut contrôler la partie' },
        { status: 403 }
      )
    }

    // Trigger event to all clients to start question timer
    const channel = getSessionChannel(sessionId)
    await triggerEvent(channel, PUSHER_EVENTS.QUESTION_TIMER_START, {
      questionIndex: session.currentQuestion,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error starting question timer:', error)
    return NextResponse.json(
      { error: 'Erreur lors du démarrage du timer' },
      { status: 500 }
    )
  }
}
