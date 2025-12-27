'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface UseTimerOptions {
  initialTime: number
  onComplete?: () => void
  autoStart?: boolean
}

export function useTimer({
  initialTime,
  onComplete,
  autoStart = false,
}: UseTimerOptions) {
  const [timeRemaining, setTimeRemaining] = useState(initialTime)
  const [isRunning, setIsRunning] = useState(autoStart)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const onCompleteRef = useRef(onComplete)
  const isRunningRef = useRef(isRunning)

  // Mettre à jour les refs quand les valeurs changent
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    isRunningRef.current = isRunning
  }, [isRunning])

  const start = useCallback(() => {
    // Utiliser la ref pour avoir la valeur actuelle, pas la closure
    if (!isRunningRef.current) {
      startTimeRef.current = Date.now()
      isRunningRef.current = true
      setIsRunning(true)
    }
  }, [])

  const pause = useCallback(() => {
    isRunningRef.current = false
    setIsRunning(false)
  }, [])

  const reset = useCallback((newTime?: number) => {
    isRunningRef.current = false
    setIsRunning(false)
    setTimeRemaining(newTime ?? initialTime)
    startTimeRef.current = null
  }, [initialTime])

  const getElapsedMs = useCallback(() => {
    if (!startTimeRef.current) return 0
    return Date.now() - startTimeRef.current
  }, [])

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsRunning(false)
            onCompleteRef.current?.()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning])

  // Reset when initialTime changes
  useEffect(() => {
    setTimeRemaining(initialTime)
    if (autoStart) {
      startTimeRef.current = Date.now()
      setIsRunning(true)
    }
  }, [initialTime, autoStart])

  const progress = (timeRemaining / initialTime) * 100

  return {
    timeRemaining,
    isRunning,
    progress,
    start,
    pause,
    reset,
    getElapsedMs,
  }
}
