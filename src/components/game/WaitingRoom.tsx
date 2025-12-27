'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Users, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface Player {
  id: string
  nickname: string
  avatarColor: string
}

interface WaitingRoomProps {
  sessionCode: string
  players: Player[]
  isHost: boolean
  onStart?: () => void
  isStarting?: boolean
}

export function WaitingRoom({
  sessionCode,
  players,
  isHost,
  onStart,
  isStarting = false,
}: WaitingRoomProps) {
  const [copied, setCopied] = useState(false)

  const copyCode = async () => {
    await navigator.clipboard.writeText(sessionCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-900 via-red-800 to-green-900 p-4 flex flex-col items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card variant="elevated" className="mb-6">
          <CardHeader className="text-center">
            <CardTitle>Code de la partie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-3">
              <div className="text-5xl font-bold tracking-widest text-red-600">
                {sessionCode}
              </div>
              <button
                onClick={copyCode}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Copier le code"
              >
                {copied ? (
                  <Check className="w-6 h-6 text-green-600" />
                ) : (
                  <Copy className="w-6 h-6 text-gray-500" />
                )}
              </button>
            </div>
            <p className="text-center text-gray-500 mt-2">
              Partagez ce code avec vos amis !
            </p>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-6 h-6" />
                Joueurs
              </CardTitle>
              <span className="text-lg font-semibold text-gray-600">
                {players.length}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
              <AnimatePresence>
                {players.map((player, index) => (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-xl',
                      'bg-gray-50'
                    )}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg"
                      style={{ backgroundColor: player.avatarColor }}
                    >
                      {player.nickname.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-gray-800">
                      {player.nickname}
                    </span>
                    {index === 0 && (
                      <span className="ml-auto text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                        Hote
                      </span>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {players.length === 0 && (
                <p className="text-center text-gray-500 py-4">
                  En attente de joueurs...
                </p>
              )}
            </div>

            {isHost && (
              <Button
                onClick={onStart}
                disabled={players.length < 1 || isStarting}
                isLoading={isStarting}
                className="w-full"
                size="lg"
              >
                Lancer la partie
              </Button>
            )}

            {!isHost && (
              <div className="text-center text-gray-600 py-2">
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-pulse w-2 h-2 bg-green-500 rounded-full" />
                  En attente du lancement...
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
