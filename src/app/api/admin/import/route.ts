import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { QuestionType } from '@prisma/client'

interface ImportQuestion {
  type: 'QUIZ' | 'BLINDTEST'
  text: string
  options: string[]
  correctIndex: number
  category?: string
  youtubeVideoId?: string
  audioStartTime?: number
  audioEndTime?: number
  songTitle?: string
  songArtist?: string
}

// POST /api/admin/import - Import JSON de questions
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { questions } = body as { questions: ImportQuestion[] }

    if (!questions || !Array.isArray(questions)) {
      return NextResponse.json(
        { error: 'Format invalide: attendu { questions: [...] }' },
        { status: 400 }
      )
    }

    const results = {
      success: 0,
      errors: [] as { index: number; error: string }[],
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]

      // Validation
      if (!q.type || !['QUIZ', 'BLINDTEST'].includes(q.type)) {
        results.errors.push({ index: i, error: 'Type invalide (QUIZ ou BLINDTEST)' })
        continue
      }

      if (!q.text) {
        results.errors.push({ index: i, error: 'Texte manquant' })
        continue
      }

      if (!q.options || !Array.isArray(q.options) || q.options.length !== 4) {
        results.errors.push({ index: i, error: 'Options doit contenir exactement 4 éléments' })
        continue
      }

      if (q.correctIndex === undefined || q.correctIndex < 0 || q.correctIndex > 3) {
        results.errors.push({ index: i, error: 'correctIndex invalide (0-3)' })
        continue
      }

      if (q.type === 'BLINDTEST' && !q.youtubeVideoId) {
        results.errors.push({ index: i, error: 'youtubeVideoId requis pour BLINDTEST' })
        continue
      }

      try {
        await prisma.questionBank.create({
          data: {
            type: q.type as QuestionType,
            text: q.text,
            options: q.options,
            correctIndex: q.correctIndex,
            category: q.category || null,
            youtubeVideoId: q.type === 'BLINDTEST' ? q.youtubeVideoId : null,
            audioStartTime: q.type === 'BLINDTEST' ? q.audioStartTime : null,
            audioEndTime: q.type === 'BLINDTEST' ? q.audioEndTime : null,
            songTitle: q.type === 'BLINDTEST' ? q.songTitle : null,
            songArtist: q.type === 'BLINDTEST' ? q.songArtist : null,
          },
        })
        results.success++
      } catch (err) {
        results.errors.push({ index: i, error: 'Erreur base de données' })
        console.error('Import error for question', i, err)
      }
    }

    return NextResponse.json({
      message: `${results.success} questions importées avec succès`,
      success: results.success,
      errors: results.errors,
      total: questions.length,
    })
  } catch (error) {
    console.error('Error importing questions:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'import' },
      { status: 500 }
    )
  }
}
