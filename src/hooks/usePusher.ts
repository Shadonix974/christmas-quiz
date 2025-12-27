'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { getPusherClient, getSessionChannel } from '@/lib/pusher-client'
import type { Channel } from 'pusher-js'

type EventCallback = (data: unknown) => void

export function usePusher(sessionId: string | null) {
  const channelRef = useRef<Channel | null>(null)
  const callbacksRef = useRef<Map<string, EventCallback>>(new Map())
  const [isConnected, setIsConnected] = useState(false)
  const [channelReady, setChannelReady] = useState(false)

  useEffect(() => {
    if (!sessionId) return

    const pusher = getPusherClient()
    const channelName = getSessionChannel(sessionId)

    // Subscribe to the channel
    channelRef.current = pusher.subscribe(channelName)

    // Track connection state
    const handleConnected = () => setIsConnected(true)
    const handleDisconnected = () => setIsConnected(false)

    pusher.connection.bind('connected', handleConnected)
    pusher.connection.bind('disconnected', handleDisconnected)
    pusher.connection.bind('error', handleDisconnected)

    // Check if already connected
    if (pusher.connection.state === 'connected') {
      setIsConnected(true)
    }

    // Attendre que le canal privé soit réellement souscrit
    channelRef.current.bind('pusher:subscription_succeeded', () => {
      console.log('📡 Pusher channel subscribed:', channelName)
      setChannelReady(true)
      // Bind all registered callbacks when channel is ready
      callbacksRef.current.forEach((callback, event) => {
        console.log('📡 Binding event:', event)
        channelRef.current?.bind(event, callback)
      })
    })

    channelRef.current.bind('pusher:subscription_error', (error: unknown) => {
      console.error('📡 Pusher subscription error:', error)
    })

    return () => {
      // Unbind connection handlers
      pusher.connection.unbind('connected', handleConnected)
      pusher.connection.unbind('disconnected', handleDisconnected)
      pusher.connection.unbind('error', handleDisconnected)

      // Unbind all callbacks before unsubscribing
      callbacksRef.current.forEach((callback, event) => {
        channelRef.current?.unbind(event, callback)
      })
      pusher.unsubscribe(channelName)
      channelRef.current = null
      setIsConnected(false)
      setChannelReady(false)
    }
  }, [sessionId])

  const subscribe = useCallback((event: string, callback: EventCallback) => {
    console.log('📝 Subscribing to event:', event, 'channel ready:', channelReady)
    callbacksRef.current.set(event, callback)

    // If channel already exists and is ready, bind immediately
    if (channelRef.current && channelReady) {
      console.log('📝 Binding immediately:', event)
      channelRef.current.bind(event, callback)
    }

    // Return unsubscribe function
    return () => {
      callbacksRef.current.delete(event)
      if (channelRef.current) {
        channelRef.current.unbind(event, callback)
      }
    }
  }, [channelReady])

  const unsubscribe = useCallback((event: string) => {
    const callback = callbacksRef.current.get(event)
    if (callback && channelRef.current) {
      channelRef.current.unbind(event, callback)
    }
    callbacksRef.current.delete(event)
  }, [])

  return {
    subscribe,
    unsubscribe,
    channel: channelRef.current,
    isConnected,
    channelReady,
  }
}
