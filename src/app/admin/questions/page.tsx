'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Question {
  id: string
  type: 'QUIZ' | 'BLINDTEST'
  text: string
  options: string[]
  correctIndex: number
  category: string | null
  isActive: boolean
  createdAt: string
  songTitle: string | null
  songArtist: string | null
}

interface QuestionsResponse {
  questions: Question[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  stats: {
    quiz: number
    blindtest: number
    total: number
  }
}

export default function QuestionsPage() {
  const [data, setData] = useState<QuestionsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)

  const fetchQuestions = async () => {
    setLoading(true)
    setSelectedIds(new Set())
    const params = new URLSearchParams()
    if (typeFilter) params.set('type', typeFilter)
    if (search) params.set('search', search)
    params.set('page', page.toString())
    params.set('limit', '20')

    const res = await fetch(`/api/admin/questions?${params}`)
    const json = await res.json()
    setData(json)
    setLoading(false)
  }

  useEffect(() => {
    fetchQuestions()
  }, [typeFilter, page])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchQuestions()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette question ?')) return

    setDeleting(id)
    await fetch(`/api/admin/questions/${id}`, { method: 'DELETE' })
    fetchQuestions()
    setDeleting(null)
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return
    if (!confirm(`Supprimer ${selectedIds.size} question(s) ?`)) return

    setBulkDeleting(true)
    await fetch('/api/admin/questions', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: Array.from(selectedIds) }),
    })
    setSelectedIds(new Set())
    fetchQuestions()
    setBulkDeleting(false)
  }

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedIds(newSet)
  }

  const toggleSelectAll = () => {
    if (!data) return
    if (selectedIds.size === data.questions.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(data.questions.map((q) => q.id)))
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Questions</h1>
        <Link
          href="/admin/questions/new"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          + Nouvelle question
        </Link>
      </div>

      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => { setTypeFilter(''); setPage(1) }}
              className={`px-4 py-2 rounded-lg transition-colors ${
                !typeFilter ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Toutes ({data?.stats.total || 0})
            </button>
            <button
              onClick={() => { setTypeFilter('QUIZ'); setPage(1) }}
              className={`px-4 py-2 rounded-lg transition-colors ${
                typeFilter === 'QUIZ' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Quiz ({data?.stats.quiz || 0})
            </button>
            <button
              onClick={() => { setTypeFilter('BLINDTEST'); setPage(1) }}
              className={`px-4 py-2 rounded-lg transition-colors ${
                typeFilter === 'BLINDTEST' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Blindtest ({data?.stats.blindtest || 0})
            </button>
          </div>

          <form onSubmit={handleSearch} className="flex gap-2 flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Rechercher
            </button>
          </form>
        </div>

        {selectedIds.size > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <button
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {bulkDeleting ? 'Suppression...' : `Supprimer la sélection (${selectedIds.size})`}
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-gray-400 text-center py-8">Chargement...</div>
      ) : (
        <>
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="text-left text-gray-300 px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={data ? selectedIds.size === data.questions.length && data.questions.length > 0 : false}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-gray-500 bg-gray-600 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="text-left text-gray-300 px-4 py-3 w-24">Type</th>
                  <th className="text-left text-gray-300 px-4 py-3">Question / Titre</th>
                  <th className="text-left text-gray-300 px-4 py-3">Artiste</th>
                  <th className="text-left text-gray-300 px-4 py-3">Bonne réponse</th>
                  <th className="text-left text-gray-300 px-4 py-3">Catégorie</th>
                  <th className="text-left text-gray-300 px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {data?.questions.map((q) => (
                  <tr key={q.id} className={`hover:bg-gray-750 ${selectedIds.has(q.id) ? 'bg-gray-750' : ''}`}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(q.id)}
                        onChange={() => toggleSelect(q.id)}
                        className="w-4 h-4 rounded border-gray-500 bg-gray-600 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          q.type === 'QUIZ'
                            ? 'bg-blue-900 text-blue-300'
                            : 'bg-green-900 text-green-300'
                        }`}
                      >
                        {q.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white max-w-xs truncate" title={q.type === 'BLINDTEST' && q.songTitle ? q.songTitle : q.text}>
                      {q.type === 'BLINDTEST' && q.songTitle ? q.songTitle : q.text}
                    </td>
                    <td className="px-4 py-3 text-gray-400 max-w-[150px] truncate" title={q.songArtist || ''}>
                      {q.type === 'BLINDTEST' ? (q.songArtist || '-') : '-'}
                    </td>
                    <td className="px-4 py-3 text-green-400 max-w-[150px] truncate" title={q.options[q.correctIndex]}>
                      {q.options[q.correctIndex]}
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {q.category || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/questions/${q.id}`}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          Modifier
                        </Link>
                        <button
                          onClick={() => handleDelete(q.id)}
                          disabled={deleting === q.id}
                          className="text-red-400 hover:text-red-300 disabled:opacity-50"
                        >
                          {deleting === q.id ? '...' : 'Supprimer'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data && data.pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg disabled:opacity-50"
              >
                Précédent
              </button>
              <span className="px-4 py-2 text-gray-400">
                Page {page} / {data.pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                disabled={page === data.pagination.totalPages}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg disabled:opacity-50"
              >
                Suivant
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
