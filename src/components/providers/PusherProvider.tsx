'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import PusherClient from 'pusher-js'

interface PusherContextType {
  pusher: PusherClient | null
  isConnected: boolean
}

const PusherContext = createContext<PusherContextType>({
  pusher: null,
  isConnected: false,
})

export function usePusherContext() {
  return useContext(PusherContext)
}

interface PusherProviderProps {
  children: ReactNode
}

export function PusherProvider({ children }: PusherProviderProps) {
  const [pusher, setPusher] = useState<PusherClient | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER

    if (!pusherKey || !pusherCluster) {
      console.warn('Pusher credentials not configured')
      return
    }

    const client = new PusherClient(pusherKey, {
      cluster: pusherCluster,
      authEndpoint: '/api/pusher/auth',
    })

    client.connection.bind('connected', () => {
      setIsConnected(true)
    })

    client.connection.bind('disconnected', () => {
      setIsConnected(false)
    })

    client.connection.bind('error', (err: unknown) => {
      console.error('Pusher connection error:', err)
      setIsConnected(false)
    })

    setPusher(client)

    return () => {
      client.disconnect()
    }
  }, [])

  return (
    <PusherContext.Provider value={{ pusher, isConnected }}>
      {children}
    </PusherContext.Provider>
  )
}
