import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const session = await prisma.session.findUnique({
      where: { id },
      include: {
        players: {
          select: {
            id: true,
            nickname: true,
            avatarColor: true,
            score: true,
            isHost: true,
            isConnected: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Session non trouvée' },
        { status: 404 }
      )
    }

    // Vérifier si la session a expiré
    if (new Date() > session.expiresAt) {
      return NextResponse.json(
        { error: 'Cette session a expiré' },
        { status: 410 }
      )
    }

    return NextResponse.json({
      id: session.id,
      code: session.code,
      status: session.status,
      gameMode: session.gameMode,
      totalQuestions: session.totalQuestions,
      currentQuestion: session.currentQuestion,
      timePerQuestion: session.timePerQuestion,
      // Mode automatique
      autoMode: session.autoMode,
      showLeaderboard: session.showLeaderboard,
      revealDuration: session.revealDuration,
      leaderboardDuration: session.leaderboardDuration,
      // Joueurs
      players: session.players,
      playerCount: session.players.length,
    })
  } catch (error) {
    console.error('Error fetching session:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la session' },
      { status: 500 }
    )
  }
}
