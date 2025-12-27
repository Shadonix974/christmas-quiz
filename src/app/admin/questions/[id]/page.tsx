'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { YouTubePreview } from '@/components/admin/YouTubePreview'

export default function EditQuestionPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [type, setType] = useState<'QUIZ' | 'BLINDTEST'>('QUIZ')
  const [text, setText] = useState('')
  const [options, setOptions] = useState(['', '', '', ''])
  const [correctIndex, setCorrectIndex] = useState(0)
  const [category, setCategory] = useState('')

  // Blindtest fields
  const [youtubeVideoId, setYoutubeVideoId] = useState('')
  const [audioStartTime, setAudioStartTime] = useState('')
  const [audioEndTime, setAudioEndTime] = useState('')
  const [songTitle, setSongTitle] = useState('')
  const [songArtist, setSongArtist] = useState('')

  useEffect(() => {
    fetch(`/api/admin/questions/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error)
        } else {
          setType(data.type)
          setText(data.text)
          setOptions(data.options)
          setCorrectIndex(data.correctIndex)
          setCategory(data.category || '')
          setYoutubeVideoId(data.youtubeVideoId || '')
          setAudioStartTime(data.audioStartTime?.toString() || '')
          setAudioEndTime(data.audioEndTime?.toString() || '')
          setSongTitle(data.songTitle || '')
          setSongArtist(data.songArtist || '')
        }
        setLoading(false)
      })
      .catch(() => {
        setError('Erreur lors du chargement')
        setLoading(false)
      })
  }, [id])

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    const body: Record<string, unknown> = {
      type,
      text,
      options,
      correctIndex,
      category: category || null,
    }

    if (type === 'BLINDTEST') {
      body.youtubeVideoId = youtubeVideoId
      body.audioStartTime = audioStartTime ? parseInt(audioStartTime) : null
      body.audioEndTime = audioEndTime ? parseInt(audioEndTime) : null
      body.songTitle = songTitle || null
      body.songArtist = songArtist || null
    }

    const res = await fetch(`/api/admin/questions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      router.push('/admin/questions')
    } else {
      const data = await res.json()
      setError(data.error || 'Erreur lors de la mise à jour')
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-gray-400 text-center py-8">Chargement...</div>
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-8">Modifier la question</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-gray-300 mb-2">Type</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="QUIZ"
                checked={type === 'QUIZ'}
                onChange={(e) => setType(e.target.value as 'QUIZ')}
                className="text-blue-600"
              />
              <span className="text-white">Quiz</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="BLINDTEST"
                checked={type === 'BLINDTEST'}
                onChange={(e) => setType(e.target.value as 'BLINDTEST')}
                className="text-green-600"
              />
              <span className="text-white">Blindtest</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-gray-300 mb-2">Question</label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
            className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Entrez la question..."
          />
        </div>

        <div>
          <label className="block text-gray-300 mb-2">Options de réponse</label>
          <div className="space-y-3">
            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-3">
                <input
                  type="radio"
                  name="correctIndex"
                  checked={correctIndex === index}
                  onChange={() => setCorrectIndex(index)}
                  className="w-5 h-5 appearance-none border-2 border-gray-400 rounded-full checked:bg-green-500 checked:border-green-500 cursor-pointer flex-shrink-0"
                />
                <input
                  type="text"
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  required
                  className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={`Option ${index + 1}`}
                />
                {correctIndex === index && (
                  <span className="text-green-400 text-sm">Bonne réponse</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-gray-300 mb-2">Catégorie (optionnel)</label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ex: Géographie, Musique, Noël..."
          />
        </div>

        {type === 'BLINDTEST' && (
          <div className="border border-gray-600 rounded-lg p-4 space-y-4">
            <h3 className="text-lg font-semibold text-green-400">Configuration Blindtest</h3>

            <div>
              <label className="block text-gray-300 mb-2">ID Vidéo YouTube *</label>
              <input
                type="text"
                value={youtubeVideoId}
                onChange={(e) => setYoutubeVideoId(e.target.value)}
                required
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Ex: dQw4w9WgXcQ"
              />
              <p className="text-gray-500 text-sm mt-1">
                L&apos;ID se trouve dans l&apos;URL: youtube.com/watch?v=<strong>dQw4w9WgXcQ</strong>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 mb-2">Début (secondes)</label>
                <input
                  type="number"
                  value={audioStartTime}
                  onChange={(e) => setAudioStartTime(e.target.value)}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Ex: 30"
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-2">Fin (secondes)</label>
                <input
                  type="number"
                  value={audioEndTime}
                  onChange={(e) => setAudioEndTime(e.target.value)}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Ex: 45"
                />
              </div>
            </div>

            {/* YouTube Preview */}
            <YouTubePreview
              videoId={youtubeVideoId}
              startTime={audioStartTime ? parseInt(audioStartTime) : undefined}
              endTime={audioEndTime ? parseInt(audioEndTime) : undefined}
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 mb-2">Titre de la chanson</label>
                <input
                  type="text"
                  value={songTitle}
                  onChange={(e) => setSongTitle(e.target.value)}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Ex: Never Gonna Give You Up"
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-2">Artiste</label>
                <input
                  type="text"
                  value={songArtist}
                  onChange={(e) => setSongArtist(e.target.value)}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Ex: Rick Astley"
                />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  )
}
