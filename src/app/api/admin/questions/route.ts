import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { QuestionType } from '@prisma/client'

// GET /api/admin/questions - Liste des questions avec filtres
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as QuestionType | null
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: Record<string, unknown> = {}

    if (type) {
      where.type = type
    }

    if (search) {
      where.text = { contains: search, mode: 'insensitive' }
    }

    const [questions, total] = await Promise.all([
      prisma.questionBank.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.questionBank.count({ where }),
    ])

    // Stats globales
    const [quizCount, blindtestCount] = await Promise.all([
      prisma.questionBank.count({ where: { type: 'QUIZ' } }),
      prisma.questionBank.count({ where: { type: 'BLINDTEST' } }),
    ])

    return NextResponse.json({
      questions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        quiz: quizCount,
        blindtest: blindtestCount,
        total: quizCount + blindtestCount,
      },
    })
  } catch (error) {
    console.error('Error fetching questions:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des questions' },
      { status: 500 }
    )
  }
}

// POST /api/admin/questions - Créer une question
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      type,
      text,
      options,
      correctIndex,
      category,
      youtubeVideoId,
      audioStartTime,
      audioEndTime,
      songTitle,
      songArtist,
    } = body

    // Validation
    if (!type || !text || !options || correctIndex === undefined) {
      return NextResponse.json(
        { error: 'Champs requis: type, text, options, correctIndex' },
        { status: 400 }
      )
    }

    if (!Array.isArray(options) || options.length !== 4) {
      return NextResponse.json(
        { error: 'Options doit contenir exactement 4 éléments' },
        { status: 400 }
      )
    }

    if (correctIndex < 0 || correctIndex > 3) {
      return NextResponse.json(
        { error: 'correctIndex doit être entre 0 et 3' },
        { status: 400 }
      )
    }

    if (type === 'BLINDTEST' && !youtubeVideoId) {
      return NextResponse.json(
        { error: 'youtubeVideoId requis pour les questions BLINDTEST' },
        { status: 400 }
      )
    }

    const question = await prisma.questionBank.create({
      data: {
        type,
        text,
        options,
        correctIndex,
        category,
        youtubeVideoId: type === 'BLINDTEST' ? youtubeVideoId : null,
        audioStartTime: type === 'BLINDTEST' ? audioStartTime : null,
        audioEndTime: type === 'BLINDTEST' ? audioEndTime : null,
        songTitle: type === 'BLINDTEST' ? songTitle : null,
        songArtist: type === 'BLINDTEST' ? songArtist : null,
      },
    })

    return NextResponse.json(question, { status: 201 })
  } catch (error) {
    console.error('Error creating question:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de la question' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/questions - Suppression en masse
export async function DELETE(request: Request) {
  try {
    const { ids } = await request.json()

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Liste d\'IDs requise' },
        { status: 400 }
      )
    }

    const result = await prisma.questionBank.deleteMany({
      where: { id: { in: ids } },
    })

    return NextResponse.json({ deleted: result.count })
  } catch (error) {
    console.error('Error deleting questions:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression' },
      { status: 500 }
    )
  }
}
