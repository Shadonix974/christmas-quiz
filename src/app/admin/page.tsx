'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Stats {
  quiz: number
  blindtest: number
  total: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/questions?limit=1')
      .then((res) => res.json())
      .then((data) => {
        setStats(data.stats)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Dashboard Admin</h1>

      {loading ? (
        <div className="text-gray-400">Chargement...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-gray-400 text-sm mb-1">Total Questions</div>
            <div className="text-4xl font-bold text-white">{stats?.total || 0}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-gray-400 text-sm mb-1">Questions Quiz</div>
            <div className="text-4xl font-bold text-blue-400">{stats?.quiz || 0}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-gray-400 text-sm mb-1">Questions Blindtest</div>
            <div className="text-4xl font-bold text-green-400">{stats?.blindtest || 0}</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/admin/questions/new"
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-6 transition-colors"
        >
          <h3 className="text-xl font-semibold mb-2">Ajouter une question</h3>
          <p className="text-blue-200">Créer une nouvelle question QUIZ ou BLINDTEST</p>
        </Link>

        <Link
          href="/admin/import"
          className="bg-green-600 hover:bg-green-700 text-white rounded-lg p-6 transition-colors"
        >
          <h3 className="text-xl font-semibold mb-2">Import JSON</h3>
          <p className="text-green-200">Importer plusieurs questions depuis un fichier JSON</p>
        </Link>

        <Link
          href="/admin/questions"
          className="bg-gray-700 hover:bg-gray-600 text-white rounded-lg p-6 transition-colors"
        >
          <h3 className="text-xl font-semibold mb-2">Gérer les questions</h3>
          <p className="text-gray-300">Voir, modifier ou supprimer les questions existantes</p>
        </Link>

        <Link
          href="/"
          className="bg-gray-700 hover:bg-gray-600 text-white rounded-lg p-6 transition-colors"
        >
          <h3 className="text-xl font-semibold mb-2">Retour au jeu</h3>
          <p className="text-gray-300">Retourner à la page d&apos;accueil du jeu</p>
        </Link>
      </div>
    </div>
  )
}
