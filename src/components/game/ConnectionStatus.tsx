'use client'

import { useEffect, useState } from 'react'
import { Wifi, WifiOff } from 'lucide-react'

interface ConnectionStatusProps {
  isConnected?: boolean
  showLabel?: boolean
  className?: string
}

export function ConnectionStatus({
  isConnected: externalConnected,
  showLabel = false,
  className = ''
}: ConnectionStatusProps) {
  const [isConnected, setIsConnected] = useState(externalConnected ?? true)

  useEffect(() => {
    if (externalConnected !== undefined) {
      setIsConnected(externalConnected)
    }
  }, [externalConnected])

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <div className="relative">
        <div
          className={`w-2.5 h-2.5 rounded-full ${
            isConnected
              ? 'bg-green-500'
              : 'bg-red-500'
          }`}
        />
        {isConnected && (
          <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-green-500 animate-ping opacity-75" />
        )}
      </div>
      {showLabel && (
        <span className={`text-xs ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
          {isConnected ? 'Connecté' : 'Déconnecté'}
        </span>
      )}
      {!showLabel && (
        isConnected
          ? <Wifi className="w-3 h-3 text-green-400" />
          : <WifiOff className="w-3 h-3 text-red-400" />
      )}
    </div>
  )
}
