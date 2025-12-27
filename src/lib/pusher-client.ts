'use client'

import PusherClient from 'pusher-js'

let pusherInstance: PusherClient | null = null

export function getPusherClient(): PusherClient {
  if (typeof window === 'undefined') {
    throw new Error('Pusher client can only be used in the browser')
  }

  if (!pusherInstance) {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER

    if (!key || !cluster) {
      console.error('Pusher credentials missing:', { key: !!key, cluster: !!cluster })
      throw new Error('Pusher credentials not configured')
    }

    pusherInstance = new PusherClient(key, {
      cluster,
      authEndpoint: '/api/pusher/auth',
      forceTLS: true,
    })

    // Log connection state changes for debugging
    pusherInstance.connection.bind('state_change', (states: { current: string; previous: string }) => {
      console.log('Pusher connection state:', states.previous, '->', states.current)
    })

    pusherInstance.connection.bind('error', (err: unknown) => {
      console.error('Pusher connection error:', err)
    })
  }

  return pusherInstance
}

export function disconnectPusher() {
  if (pusherInstance) {
    pusherInstance.disconnect()
    pusherInstance = null
  }
}

export function getSessionChannel(sessionId: string) {
  // Utiliser un canal privé au lieu de presence pour simplifier
  return `private-session-${sessionId}`
}
