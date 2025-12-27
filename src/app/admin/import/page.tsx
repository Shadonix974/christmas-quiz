'use client'

import { useState } from 'react'

interface ImportResult {
  message: string
  success: number
  errors: { index: number; error: string }[]
  total: number
}

export default function ImportPage() {
  const [jsonContent, setJsonContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState('')

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      setJsonContent(event.target?.result as string)
    }
    reader.readAsText(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setResult(null)
    setLoading(true)

    try {
      const questions = JSON.parse(jsonContent)
      const body = Array.isArray(questions) ? { questions } : questions

      const res = await fetch('/api/admin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (res.ok) {
        setResult(data)
        if (data.success === data.total) {
          setJsonContent('')
        }
      } else {
        setError(data.error || 'Erreur lors de l\'import')
      }
    } catch {
      setError('JSON invalide')
    }

    setLoading(false)
  }

  const exampleJson = `[
  {
    "type": "QUIZ",
    "text": "Quelle est la capitale de la France ?",
    "options": ["Lyon", "Paris", "Marseille", "Toulouse"],
    "correctIndex": 1,
    "category": "Géographie"
  },
  {
    "type": "BLINDTEST",
    "text": "Quel est le titre de cette chanson ?",
    "options": ["Option A", "Option B", "Bonne réponse", "Option D"],
    "correctIndex": 2,
    "youtubeVideoId": "dQw4w9WgXcQ",
    "audioStartTime": 30,
    "audioEndTime": 45,
    "songTitle": "Never Gonna Give You Up",
    "songArtist": "Rick Astley"
  }
]`

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-8">Import JSON</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-300 mb-2">Fichier JSON</label>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-2">Ou collez le JSON directement</label>
              <textarea
                value={jsonContent}
                onChange={(e) => setJsonContent(e.target.value)}
                rows={15}
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder="Collez votre JSON ici..."
              />
            </div>

            {error && (
              <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {result && (
              <div className={`px-4 py-3 rounded-lg ${
                result.errors.length === 0
                  ? 'bg-green-900/50 border border-green-500 text-green-300'
                  : 'bg-yellow-900/50 border border-yellow-500 text-yellow-300'
              }`}>
                <p className="font-semibold">{result.message}</p>
                {result.errors.length > 0 && (
                  <div className="mt-2 text-sm">
                    <p>Erreurs:</p>
                    <ul className="list-disc list-inside">
                      {result.errors.map((err, i) => (
                        <li key={i}>Question {err.index + 1}: {err.error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !jsonContent}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Import en cours...' : 'Importer les questions'}
            </button>
          </form>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Format attendu</h2>
          <div className="bg-gray-800 rounded-lg p-4">
            <pre className="text-sm text-gray-300 overflow-x-auto whitespace-pre-wrap">
              {exampleJson}
            </pre>
          </div>

          <div className="mt-6 space-y-4 text-gray-400 text-sm">
            <h3 className="text-white font-semibold">Champs requis</h3>
            <ul className="list-disc list-inside space-y-1">
              <li><code className="text-blue-400">type</code>: &quot;QUIZ&quot; ou &quot;BLINDTEST&quot;</li>
              <li><code className="text-blue-400">text</code>: Texte de la question</li>
              <li><code className="text-blue-400">options</code>: Tableau de 4 options</li>
              <li><code className="text-blue-400">correctIndex</code>: Index de la bonne réponse (0-3)</li>
            </ul>

            <h3 className="text-white font-semibold mt-4">Champs optionnels</h3>
            <ul className="list-disc list-inside space-y-1">
              <li><code className="text-blue-400">category</code>: Catégorie de la question</li>
            </ul>

            <h3 className="text-white font-semibold mt-4">Champs Blindtest (requis si type = BLINDTEST)</h3>
            <ul className="list-disc list-inside space-y-1">
              <li><code className="text-green-400">youtubeVideoId</code>: ID de la vidéo YouTube</li>
              <li><code className="text-green-400">audioStartTime</code>: Début en secondes</li>
              <li><code className="text-green-400">audioEndTime</code>: Fin en secondes</li>
              <li><code className="text-green-400">songTitle</code>: Titre de la chanson</li>
              <li><code className="text-green-400">songArtist</code>: Artiste</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
