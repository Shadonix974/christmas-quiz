'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Gamepad2, Users, TreePine, ChevronDown, ChevronUp, Music } from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select')

  // Create session state
  const [hostNickname, setHostNickname] = useState('')
  const [totalQuestions, setTotalQuestions] = useState(10)
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  // Include blindtest toggle
  const [includeBlindtest, setIncludeBlindtest] = useState(false)

  // Auto mode settings
  const [autoMode, setAutoMode] = useState(false)
  const [timePerQuestion, setTimePerQuestion] = useState(20)
  const [revealDuration, setRevealDuration] = useState(3)
  const [showLeaderboard, setShowLeaderboard] = useState(true)
  const [leaderboardDuration, setLeaderboardDuration] = useState(5)
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Join session state
  const [joinCode, setJoinCode] = useState('')
  const [joinNickname, setJoinNickname] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [joinError, setJoinError] = useState('')

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError('')
    setIsCreating(true)

    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameMode: includeBlindtest ? 'MIXED' : 'QUIZ',
          totalQuestions,
          timePerQuestion,
          hostNickname: hostNickname.trim(),
          autoMode,
          showLeaderboard,
          revealDuration,
          leaderboardDuration,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la creation')
      }

      // Store host info in localStorage
      localStorage.setItem('playerId', data.hostId)
      localStorage.setItem('isHost', 'true')

      // Redirect to host page
      router.push(`/host/${data.id}`)
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : 'Erreur inconnue')
    } finally {
      setIsCreating(false)
    }
  }

  const handleJoinSession = async (e: React.FormEvent) => {
    e.preventDefault()
    setJoinError('')
    setIsJoining(true)

    try {
      // First, get session info by code
      const sessionResponse = await fetch(`/api/sessions/by-code/${joinCode.toUpperCase()}`)
      const sessionData = await sessionResponse.json()

      if (!sessionResponse.ok) {
        throw new Error(sessionData.error || 'Session non trouvee')
      }

      // Then join the session
      const joinResponse = await fetch(`/api/sessions/${sessionData.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: joinNickname.trim(),
        }),
      })

      const joinData = await joinResponse.json()

      if (!joinResponse.ok) {
        throw new Error(joinData.error || 'Erreur lors de la connexion')
      }

      // Store player info in localStorage
      localStorage.setItem('playerId', joinData.playerId)
      localStorage.setItem('isHost', 'false')

      // Redirect to play page
      router.push(`/play/${sessionData.id}`)
    } catch (error) {
      setJoinError(error instanceof Error ? error.message : 'Erreur inconnue')
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-900 via-red-800 to-green-900 flex flex-col items-center justify-center p-4">
      {/* Decorations */}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="flex items-center justify-center gap-4 mb-4">
          <TreePine className="w-12 h-12 text-green-400" />
          <h1 className="text-4xl md:text-6xl font-bold text-white">
            Christmas Quiz
          </h1>
          <TreePine className="w-12 h-12 text-green-400" />
        </div>
        <p className="text-xl text-red-200">
          Le quiz de Noel entre amis !
        </p>
      </motion.div>

      {/* Mode selection */}
      {mode === 'select' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md space-y-4"
        >
          <Card variant="elevated" className="hover:shadow-2xl transition-shadow">
            <button
              onClick={() => setMode('create')}
              className="w-full p-6 text-left flex items-center gap-4"
            >
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <Gamepad2 className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Creer une partie</h2>
                <p className="text-gray-600">Heberge une session pour tes amis</p>
              </div>
            </button>
          </Card>

          <Card variant="elevated" className="hover:shadow-2xl transition-shadow">
            <button
              onClick={() => setMode('join')}
              className="w-full p-6 text-left flex items-center gap-4"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Rejoindre une partie</h2>
                <p className="text-gray-600">Entre le code de la session</p>
              </div>
            </button>
          </Card>
        </motion.div>
      )}

      {/* Create session form */}
      {mode === 'create' && (
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Creer une partie</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateSession} className="space-y-4">
                <Input
                  label="Ton pseudo"
                  value={hostNickname}
                  onChange={(e) => setHostNickname(e.target.value)}
                  placeholder="Ex: Jean"
                  required
                  maxLength={20}
                />

                {/* Include Blindtest toggle */}
                <div>
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <Music className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Inclure le blindtest</span>
                        <p className="text-xs text-gray-500">Melange quiz et reconnaissance musicale</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIncludeBlindtest(!includeBlindtest)}
                      className={`relative w-14 h-7 rounded-full transition-colors ${
                        includeBlindtest ? 'bg-purple-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform shadow ${
                          includeBlindtest ? 'left-8' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de questions
                  </label>
                  <select
                    value={totalQuestions}
                    onChange={(e) => setTotalQuestions(Number(e.target.value))}
                    className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value={5}>5 questions</option>
                    <option value={10}>10 questions</option>
                    <option value={15}>15 questions</option>
                    <option value={20}>20 questions</option>
                    <option value={50}>50 questions</option>
                    <option value={100}>100 questions</option>
                    <option value={200}>200 questions</option>
                  </select>
                </div>

                {/* Mode de jeu */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mode de jeu
                  </label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setAutoMode(false)}
                      className={`flex-1 py-3 px-4 rounded-xl border-2 font-medium transition-all ${
                        !autoMode
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-gray-300 text-gray-600 hover:border-gray-400'
                      }`}
                    >
                      Manuel
                    </button>
                    <button
                      type="button"
                      onClick={() => setAutoMode(true)}
                      className={`flex-1 py-3 px-4 rounded-xl border-2 font-medium transition-all ${
                        autoMode
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-gray-300 text-gray-600 hover:border-gray-400'
                      }`}
                    >
                      Automatique
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {autoMode
                      ? 'Les questions s\'enchainent automatiquement'
                      : 'Vous controlez le rythme du jeu'}
                  </p>
                </div>

                {/* Options avancées (visible si auto mode) */}
                {autoMode && (
                  <div className="border-t pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="flex items-center justify-between w-full text-sm font-medium text-gray-700"
                    >
                      <span>Options de timing</span>
                      {showAdvanced ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>

                    {showAdvanced && (
                      <div className="mt-3 space-y-3">
                        {/* Temps par question */}
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Temps par question
                          </label>
                          <select
                            value={timePerQuestion}
                            onChange={(e) => setTimePerQuestion(Number(e.target.value))}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                          >
                            <option value={10}>10 secondes</option>
                            <option value={15}>15 secondes</option>
                            <option value={20}>20 secondes</option>
                            <option value={30}>30 secondes</option>
                          </select>
                        </div>

                        {/* Temps affichage réponse */}
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Temps affichage reponse
                          </label>
                          <select
                            value={revealDuration}
                            onChange={(e) => setRevealDuration(Number(e.target.value))}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                          >
                            <option value={2}>2 secondes</option>
                            <option value={3}>3 secondes</option>
                            <option value={5}>5 secondes</option>
                          </select>
                        </div>

                        {/* Afficher classement */}
                        <div className="flex items-center justify-between">
                          <label className="text-xs text-gray-600">
                            Afficher classement entre questions
                          </label>
                          <button
                            type="button"
                            onClick={() => setShowLeaderboard(!showLeaderboard)}
                            className={`relative w-12 h-6 rounded-full transition-colors ${
                              showLeaderboard ? 'bg-red-500' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                                showLeaderboard ? 'left-7' : 'left-1'
                              }`}
                            />
                          </button>
                        </div>

                        {/* Temps classement */}
                        {showLeaderboard && (
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">
                              Temps affichage classement
                            </label>
                            <select
                              value={leaderboardDuration}
                              onChange={(e) => setLeaderboardDuration(Number(e.target.value))}
                              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                            >
                              <option value={3}>3 secondes</option>
                              <option value={5}>5 secondes</option>
                              <option value={8}>8 secondes</option>
                            </select>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {createError && (
                  <p className="text-red-600 text-sm">{createError}</p>
                )}

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setMode('select')}
                    className="flex-1"
                  >
                    Retour
                  </Button>
                  <Button
                    type="submit"
                    isLoading={isCreating}
                    className="flex-1"
                  >
                    Creer
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Join session form */}
      {mode === 'join' && (
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Rejoindre une partie</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleJoinSession} className="space-y-4">
                <Input
                  label="Code de la partie"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Ex: NOEL24"
                  required
                  maxLength={6}
                  className="text-center text-2xl tracking-widest uppercase"
                />

                <Input
                  label="Ton pseudo"
                  value={joinNickname}
                  onChange={(e) => setJoinNickname(e.target.value)}
                  placeholder="Ex: Marie"
                  required
                  maxLength={20}
                />

                {joinError && (
                  <p className="text-red-600 text-sm">{joinError}</p>
                )}

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setMode('select')}
                    className="flex-1"
                  >
                    Retour
                  </Button>
                  <Button
                    type="submit"
                    variant="secondary"
                    isLoading={isJoining}
                    className="flex-1"
                  >
                    Rejoindre
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
