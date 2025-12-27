'use client'

import { useEffect, useRef, useCallback, useState } from 'react'

interface LocalAudioPlayerProps {
  audioUrl: string
  startTime: number
  endTime: number
  onComplete: () => void
  onReady?: () => void
  onError?: () => void
  onTimeUpdate?: (elapsed: number, duration: number) => void
}

export function LocalAudioPlayer({
  audioUrl,
  startTime,
  endTime,
  onComplete,
  onReady,
  onError,
  onTimeUpdate,
}: LocalAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const hasCompletedRef = useRef(false)
  const [isPlaying, setIsPlaying] = useState(false)

  const duration = endTime - startTime

  // Handle time update to check for segment end
  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current
    if (!audio || hasCompletedRef.current) return

    const currentTime = audio.currentTime
    const elapsed = currentTime - startTime

    // Report time update
    if (onTimeUpdate) {
      onTimeUpdate(Math.max(0, elapsed), duration)
    }

    // Check if we've reached the end of the segment
    if (currentTime >= endTime) {
      hasCompletedRef.current = true
      audio.pause()
      onComplete()
    }
  }, [startTime, endTime, duration, onComplete, onTimeUpdate])

  // Handle audio loaded and ready to play
  const handleCanPlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return

    // Set to start time
    audio.currentTime = startTime

    // Start playing
    audio.play().then(() => {
      setIsPlaying(true)
      onReady?.()
    }).catch((err) => {
      console.error('Failed to play audio:', err)
      onError?.()
    })
  }, [startTime, onReady, onError])

  // Handle audio error
  const handleError = useCallback(() => {
    console.error('Audio error')
    onError?.()
  }, [onError])

  // Handle play state
  const handlePlay = useCallback(() => {
    setIsPlaying(true)
  }, [])

  const handlePause = useCallback(() => {
    setIsPlaying(false)
  }, [])

  // Initialize on mount
  useEffect(() => {
    hasCompletedRef.current = false

    const audio = audioRef.current
    if (!audio) return

    // If audio is already loaded, start it
    if (audio.readyState >= 3) {
      handleCanPlay()
    }

    return () => {
      // Cleanup
      if (audio) {
        audio.pause()
      }
    }
  }, [audioUrl, handleCanPlay])

  return (
    <>
      <audio
        ref={audioRef}
        src={audioUrl}
        onCanPlay={handleCanPlay}
        onTimeUpdate={handleTimeUpdate}
        onError={handleError}
        onPlay={handlePlay}
        onPause={handlePause}
        preload="auto"
      />
      {/* Screen reader announcement */}
      {isPlaying && (
        <div className="sr-only" aria-live="polite">
          Lecture audio en cours
        </div>
      )}
    </>
  )
}
