import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateSessionCode, getRandomAvatarColor } from '@/lib/utils'
import { GAME_CONSTANTS } from '@/lib/constants'
import type { CreateSessionRequest, CreateSessionResponse } from '@/types'

export async function POST(request: Request) {
  try {
    const body: CreateSessionRequest = await request.json()
    const {
      gameMode,
      totalQuestions,
      timePerQuestion,
      hostNickname,
      autoMode = false,
      showLeaderboard = true,
      revealDuration = GAME_CONSTANTS.REVEAL_DURATION,
      leaderboardDuration = GAME_CONSTANTS.LEADERBOARD_DURATION,
    } = body

    // Validation
    if (!hostNickname || hostNickname.trim().length < 1) {
      return NextResponse.json(
        { error: 'Le pseudo est requis' },
        { status: 400 }
      )
    }

    const questionsCount = Math.min(
      Math.max(totalQuestions || GAME_CONSTANTS.DEFAULT_QUESTIONS_COUNT, GAME_CONSTANTS.MIN_QUESTIONS),
      GAME_CONSTANTS.MAX_QUESTIONS
    )

    const timeLimit = Math.min(
      Math.max(timePerQuestion || GAME_CONSTANTS.DEFAULT_TIME_PER_QUESTION, GAME_CONSTANTS.MIN_TIME_PER_QUESTION),
      GAME_CONSTANTS.MAX_TIME_PER_QUESTION
    )

    // Générer un code unique
    let code = generateSessionCode()
    let attempts = 0
    while (attempts < 10) {
      const existing = await prisma.session.findUnique({ where: { code } })
      if (!existing) break
      code = generateSessionCode()
      attempts++
    }

    // Récupérer les questions depuis QuestionBank
    const quizQuestions = await prisma.questionBank.findMany({
      where: { type: 'QUIZ', isActive: true },
    })

    const blindtestQuestions = gameMode === 'MIXED'
      ? await prisma.questionBank.findMany({
          where: { type: 'BLINDTEST', isActive: true },
        })
      : []

    // Mélanger toutes les questions et sélectionner
    const allQuestions = [...quizQuestions, ...blindtestQuestions]
    const shuffled = allQuestions.sort(() => Math.random() - 0.5)
    const selectedQuestions = shuffled.slice(0, questionsCount)

    // Créer la session avec le host comme premier joueur
    const expiresAt = new Date(Date.now() + GAME_CONSTANTS.SESSION_EXPIRY_HOURS * 60 * 60 * 1000)

    const session = await prisma.session.create({
      data: {
        code,
        hostId: '', // Sera mis à jour après création du player
        gameMode: gameMode || 'QUIZ',
        totalQuestions: questionsCount,
        timePerQuestion: timeLimit,
        autoMode,
        showLeaderboard,
        revealDuration,
        leaderboardDuration,
        expiresAt,
        players: {
          create: {
            nickname: hostNickname.trim(),
            avatarColor: getRandomAvatarColor(),
            isHost: true,
          },
        },
        questions: {
          create: selectedQuestions.map((q, index) => ({
            type: q.type,
            order: index,
            text: q.text,
            options: q.options,
            correctIndex: q.correctIndex,
            timeLimit,
            points: GAME_CONSTANTS.MAX_POINTS_PER_QUESTION,
            youtubeVideoId: q.youtubeVideoId,
            audioStartTime: q.audioStartTime,
            audioEndTime: q.audioEndTime,
            songTitle: q.songTitle,
            songArtist: q.songArtist,
          })),
        },
      },
      include: {
        players: true,
      },
    })

    // Mettre à jour hostId avec l'ID du player host
    const hostPlayer = session.players[0]
    await prisma.session.update({
      where: { id: session.id },
      data: { hostId: hostPlayer.id },
    })

    const response: CreateSessionResponse = {
      id: session.id,
      code: session.code,
      hostId: hostPlayer.id,
      status: session.status,
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Error creating session:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de la session' },
      { status: 500 }
    )
  }
}
