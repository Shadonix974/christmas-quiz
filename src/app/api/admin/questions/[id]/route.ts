import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/admin/questions/[id] - Récupérer une question
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const question = await prisma.questionBank.findUnique({
      where: { id },
    })

    if (!question) {
      return NextResponse.json(
        { error: 'Question non trouvée' },
        { status: 404 }
      )
    }

    return NextResponse.json(question)
  } catch (error) {
    console.error('Error fetching question:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la question' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/questions/[id] - Modifier une question
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
      isActive,
    } = body

    // Vérifier que la question existe
    const existing = await prisma.questionBank.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Question non trouvée' },
        { status: 404 }
      )
    }

    // Validation
    if (options && (!Array.isArray(options) || options.length !== 4)) {
      return NextResponse.json(
        { error: 'Options doit contenir exactement 4 éléments' },
        { status: 400 }
      )
    }

    if (correctIndex !== undefined && (correctIndex < 0 || correctIndex > 3)) {
      return NextResponse.json(
        { error: 'correctIndex doit être entre 0 et 3' },
        { status: 400 }
      )
    }

    const finalType = type || existing.type

    const question = await prisma.questionBank.update({
      where: { id },
      data: {
        type: finalType,
        text: text ?? existing.text,
        options: options ?? existing.options,
        correctIndex: correctIndex ?? existing.correctIndex,
        category: category !== undefined ? category : existing.category,
        youtubeVideoId: finalType === 'BLINDTEST' ? (youtubeVideoId ?? existing.youtubeVideoId) : null,
        audioStartTime: finalType === 'BLINDTEST' ? (audioStartTime ?? existing.audioStartTime) : null,
        audioEndTime: finalType === 'BLINDTEST' ? (audioEndTime ?? existing.audioEndTime) : null,
        songTitle: finalType === 'BLINDTEST' ? (songTitle ?? existing.songTitle) : null,
        songArtist: finalType === 'BLINDTEST' ? (songArtist ?? existing.songArtist) : null,
        isActive: isActive !== undefined ? isActive : existing.isActive,
      },
    })

    return NextResponse.json(question)
  } catch (error) {
    console.error('Error updating question:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la question' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/questions/[id] - Supprimer une question
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Vérifier que la question existe
    const existing = await prisma.questionBank.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Question non trouvée' },
        { status: 404 }
      )
    }

    await prisma.questionBank.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting question:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la question' },
      { status: 500 }
    )
  }
}
