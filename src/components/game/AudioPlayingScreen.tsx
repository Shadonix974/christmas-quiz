'use client'

import { motion } from 'framer-motion'
import { Volume2, Play } from 'lucide-react'
import { YouTubeAudioPlayer } from './YouTubeAudioPlayer'
import { useState, useCallback, useEffect, useRef } from 'react'

interface AudioPlayingScreenProps {
  questionNumber: number
  totalQuestions: number
  youtubeVideoId: string
  audioStartTime?: number
  audioEndTime?: number
  onComplete: () => void
  isHost?: boolean
}

export function AudioPlayingScreen({
  questionNumber,
  totalQuestions,
  youtubeVideoId,
  audioStartTime = 0,
  audioEndTime,
  onComplete,
  isHost = false,
}: AudioPlayingScreenProps) {
  const [isPlaying, setIsPlaying] = useState(true) // Try autoplay first
  const [currentTime, setCurrentTime] = useState(0)
  const [isReady, setIsReady] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [needsInteraction, setNeedsInteraction] = useState(false)
  const autoplayTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const duration = audioEndTime ? audioEndTime - audioStartTime : 30

  // Check if autoplay failed after timeout
  useEffect(() => {
    if (isPlaying && !isReady && !hasError) {
      autoplayTimeoutRef.current = setTimeout(() => {
        // If still not ready after 3 seconds, autoplay probably failed
        if (!isReady) {
          setNeedsInteraction(true)
          setIsPlaying(false)
        }
      }, 3000)
    }

    return () => {
      if (autoplayTimeoutRef.current) {
        clearTimeout(autoplayTimeoutRef.current)
      }
    }
  }, [isPlaying, isReady, hasError])

  const handleStartPlaying = useCallback(() => {
    setNeedsInteraction(false)
    setIsPlaying(true)
  }, [])

  const handleTimeUpdate = useCallback((elapsed: number) => {
    setCurrentTime(elapsed)
  }, [])

  const handleReady = useCallback(() => {
    setIsReady(true)
    setNeedsInteraction(false)
    // Clear the timeout since autoplay worked
    if (autoplayTimeoutRef.current) {
      clearTimeout(autoplayTimeoutRef.current)
    }
  }, [])

  const handleError = useCallback(() => {
    setHasError(true)
    // On error, show play button instead of auto-skipping
    setNeedsInteraction(true)
    setIsPlaying(false)
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col items-center justify-center p-4">
      {/* Question counter */}
      <div className="absolute top-4 left-4">
        <span className="text-white text-lg font-semibold">
          {questionNumber}/{totalQuestions}
        </span>
      </div>

      {/* Main content */}
      <div className="flex flex-col items-center gap-6 max-w-md w-full">
        {!isPlaying || needsInteraction ? (
          /* Play button - shown when autoplay fails or needs user interaction */
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center gap-6"
          >
            <motion.button
              onClick={handleStartPlaying}
              className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-2xl hover:scale-105 transition-transform"
              animate={{
                boxShadow: [
                  '0 0 20px rgba(168, 85, 247, 0.4)',
                  '0 0 40px rgba(168, 85, 247, 0.6)',
                  '0 0 20px rgba(168, 85, 247, 0.4)',
                ],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <Play className="w-16 h-16 text-white ml-2" />
            </motion.button>

            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">
                {needsInteraction
                  ? 'Cliquez pour lancer l\'audio'
                  : isHost ? 'Lancer l\'extrait' : 'Prêt à écouter ?'}
              </h2>
              <p className="text-white/60 text-sm">
                {needsInteraction
                  ? 'La lecture automatique a été bloquée par le navigateur'
                  : 'Cliquez pour jouer l\'extrait musical'}
              </p>
            </div>
          </motion.div>
        ) : (
          /* Audio visualization */
          <>
            {/* Hidden YouTube Player */}
            <YouTubeAudioPlayer
              videoId={youtubeVideoId}
              startTime={audioStartTime}
              endTime={audioEndTime}
              onComplete={onComplete}
              onReady={handleReady}
              onError={handleError}
              onTimeUpdate={handleTimeUpdate}
            />

            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative"
            >
              {hasError ? (
                <div className="w-32 h-32 rounded-full bg-gray-800 flex flex-col items-center justify-center">
                  <Volume2 className="w-12 h-12 text-white/50" />
                </div>
              ) : (
                <>
                  {/* Animated glow effect */}
                  {isReady && (
                    <motion.div
                      className="absolute -inset-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 blur-xl"
                      animate={{
                        opacity: [0.4, 0.7, 0.4],
                        scale: [1, 1.1, 1],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    />
                  )}

                  {/* Vinyl disc */}
                  <motion.div
                    className="relative w-32 h-32 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center shadow-2xl border-4 border-gray-700"
                    animate={isReady ? { rotate: 360 } : {}}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  >
                    {/* Inner circle */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-white/80" />
                    </div>
                    {/* Grooves */}
                    <div className="absolute inset-6 rounded-full border border-gray-600/30" />
                    <div className="absolute inset-10 rounded-full border border-gray-600/30" />
                  </motion.div>

                  {/* Sound wave bars */}
                  {isReady && (
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-end gap-1">
                      {[20, 28, 16, 32, 24, 30, 18, 26, 22].map((maxHeight, i) => (
                        <motion.div
                          key={i}
                          className="w-1.5 bg-gradient-to-t from-purple-500 to-pink-400 rounded-full"
                          animate={{
                            height: ['8px', `${maxHeight}px`, '8px'],
                          }}
                          transition={{
                            duration: 0.35 + (i % 3) * 0.05,
                            repeat: Infinity,
                            delay: i * 0.05,
                            ease: 'easeInOut',
                          }}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center mt-4"
            >
              {hasError ? (
                <p className="text-white/60">Passage à la question...</p>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-white mb-1">
                    {isHost ? 'Extrait en cours...' : 'Écoutez bien !'}
                  </h2>
                  <p className="text-white/60 text-sm">
                    La question apparaîtra après l'extrait
                  </p>
                </>
              )}
            </motion.div>

            {/* Progress bar */}
            {!hasError && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="w-full max-w-xs"
              >
                <div className="flex justify-between text-white/60 text-sm mb-2">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                    style={{ width: `${progress}%` }}
                    transition={{ duration: 0.1 }}
                  />
                </div>
              </motion.div>
            )}

            {/* Loading indicator */}
            {!isReady && !hasError && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-white/40 text-sm"
              >
                Chargement de la vidéo...
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
