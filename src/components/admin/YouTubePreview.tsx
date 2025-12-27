'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import YouTube, { YouTubeEvent, YouTubePlayer } from 'react-youtube'
import { Play, Square, AlertCircle } from 'lucide-react'

interface YouTubePreviewProps {
  videoId: string
  startTime?: number
  endTime?: number
}

export function YouTubePreview({ videoId, startTime = 0, endTime }: YouTubePreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const playerRef = useRef<YouTubePlayer | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Use refs to always have access to the latest values in the interval
  const endTimeRef = useRef(endTime)
  const startTimeRef = useRef(startTime)

  useEffect(() => {
    endTimeRef.current = endTime
    startTimeRef.current = startTime
  }, [endTime, startTime])

  const duration = endTime && endTime > startTime ? endTime - startTime : 0
  const hasValidConfig = videoId && duration > 0

  // Validation warnings
  const warnings: string[] = []
  if (endTime !== undefined && startTime !== undefined && endTime <= startTime) {
    warnings.push('La fin doit être supérieure au début')
  }
  if (duration > 30) {
    warnings.push('Segment trop long (max 30 secondes recommandé)')
  }
  if (videoId && !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    warnings.push('Format ID YouTube invalide (11 caractères)')
  }

  // Cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const stopPlayback = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.stopVideo()
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setIsPlaying(false)
    setElapsed(0)
  }, [])

  const handleReady = useCallback((event: YouTubeEvent) => {
    // Always update the player ref (React Strict Mode can cause double mount)
    playerRef.current = event.target
    event.target.setVolume(100)
  }, [])

  const handleStateChange = useCallback((event: YouTubeEvent) => {
    const state = event.data
    const start = startTimeRef.current ?? 0

    // Always keep playerRef in sync with current player instance
    playerRef.current = event.target

    // State 1 = playing
    if (state === 1) {
      const currentTime = event.target.getCurrentTime()

      // Si on n'est pas à la bonne position, seek
      if (start > 0 && currentTime < start - 1) {
        event.target.seekTo(start, true)
        return
      }

      // Démarrer l'intervalle de vérification seulement quand la vidéo joue
      if (!intervalRef.current) {
        intervalRef.current = setInterval(() => {
          if (playerRef.current) {
            const time = playerRef.current.getCurrentTime()
            const playerState = playerRef.current.getPlayerState()
            const currentStart = startTimeRef.current ?? 0
            const currentEnd = endTimeRef.current
            const currentElapsed = Math.max(0, time - currentStart)

            setElapsed(currentElapsed)

            // Seulement vérifier quand on joue (state 1)
            if (playerState === 1 && currentEnd !== undefined && time >= currentEnd) {
              stopPlayback()
            }
          }
        }, 100)
      }
    }
  }, [stopPlayback])

  const handleEnd = useCallback(() => {
    stopPlayback()
  }, [stopPlayback])

  const handleError = useCallback(() => {
    stopPlayback()
  }, [stopPlayback])

  const startPreview = () => {
    setIsPlaying(true)
    setElapsed(0)
  }

  const opts = {
    height: '200',
    width: '356',
    playerVars: {
      autoplay: 1 as const,
      start: startTime,
      controls: 0 as const,
      modestbranding: 1 as const,
      rel: 0 as const,
      playsinline: 1 as const,
    },
  }

  const progressPercent = duration > 0 ? Math.min((elapsed / duration) * 100, 100) : 0

  const formatTime = (seconds: number) => {
    const s = Math.floor(seconds)
    return `${s}s`
  }

  return (
    <div className="mt-4 p-4 bg-gray-800 rounded-lg border border-gray-600">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-400">Aperçu du segment</span>
        {duration > 0 && (
          <span className="text-sm text-green-400">{duration} secondes</span>
        )}
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="mb-3 space-y-1">
          {warnings.map((warning, i) => (
            <div key={i} className="flex items-center gap-2 text-yellow-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{warning}</span>
            </div>
          ))}
        </div>
      )}

      {!isPlaying ? (
        <button
          type="button"
          onClick={startPreview}
          disabled={!hasValidConfig}
          className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          <Play className="w-5 h-5" />
          <span>Prévisualiser le segment</span>
        </button>
      ) : (
        <div className="space-y-3">
          {/* YouTube Player */}
          <div className="flex justify-center rounded-lg overflow-hidden bg-black">
            <YouTube
              videoId={videoId}
              opts={opts}
              onReady={handleReady}
              onStateChange={handleStateChange}
              onEnd={handleEnd}
              onError={handleError}
            />
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-100"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">
                {formatTime(elapsed)} / {formatTime(duration)}
              </span>
              <button
                type="button"
                onClick={stopPlayback}
                className="flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
              >
                <Square className="w-4 h-4" />
                <span>Stop</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {!hasValidConfig && !isPlaying && (
        <p className="mt-2 text-xs text-gray-500">
          Remplissez l&apos;ID YouTube et les temps de début/fin pour prévisualiser
        </p>
      )}
    </div>
  )
}
