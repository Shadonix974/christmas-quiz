'use client'

import { useRef, useCallback, useEffect } from 'react'
import YouTube, { YouTubeEvent, YouTubePlayer } from 'react-youtube'

interface YouTubeAudioPlayerProps {
  videoId: string
  startTime?: number
  endTime?: number
  onComplete: () => void
  onReady?: () => void
  onError?: () => void
  onTimeUpdate?: (elapsed: number, duration: number) => void
}

export function YouTubeAudioPlayer({
  videoId,
  startTime = 0,
  endTime,
  onComplete,
  onReady,
  onError,
  onTimeUpdate,
}: YouTubeAudioPlayerProps) {
  const playerRef = useRef<YouTubePlayer | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const duration = endTime ? endTime - startTime : 30

  // Use refs to always have access to the latest values in the interval
  const endTimeRef = useRef(endTime)
  const startTimeRef = useRef(startTime)

  useEffect(() => {
    endTimeRef.current = endTime
    startTimeRef.current = startTime
  }, [endTime, startTime])

  // Cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
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

      // If not at the right position, seek
      if (start > 0 && currentTime < start - 1) {
        event.target.seekTo(start, true)
        return
      }

      // Notify ready only when actually playing at the right position
      onReady?.()

      // Start interval only when video is playing
      if (!intervalRef.current) {
        intervalRef.current = setInterval(() => {
          if (playerRef.current) {
            const time = playerRef.current.getCurrentTime()
            const playerState = playerRef.current.getPlayerState()
            const currentStart = startTimeRef.current ?? 0
            const end = endTimeRef.current
            const currentElapsed = Math.max(0, time - currentStart)
            onTimeUpdate?.(currentElapsed, duration)

            // Only check when playing (state 1)
            if (playerState === 1 && end !== undefined && time >= end) {
              playerRef.current.stopVideo()
              if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
              }
              onComplete()
            }
          }
        }, 100)
      }
    }
  }, [duration, onComplete, onReady, onTimeUpdate])

  const handleEnd = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    onComplete()
  }, [onComplete])

  const handleError = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    onError?.()
  }, [onError])

  const opts = {
    height: '200',
    width: '356',
    playerVars: {
      autoplay: 1 as const,
      controls: 0 as const,
      modestbranding: 1 as const,
      rel: 0 as const,
      playsinline: 1 as const,
    },
  }

  return (
    <div className="absolute opacity-0 pointer-events-none" aria-hidden="true">
      <YouTube
        videoId={videoId}
        opts={opts}
        onReady={handleReady}
        onStateChange={handleStateChange}
        onEnd={handleEnd}
        onError={handleError}
      />
    </div>
  )
}
