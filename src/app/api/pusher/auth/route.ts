import { NextResponse } from 'next/server'
import { pusher } from '@/lib/pusher'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const socketId = formData.get('socket_id') as string
    const channel = formData.get('channel_name') as string

    if (!socketId || !channel) {
      return NextResponse.json(
        { error: 'socket_id et channel_name requis' },
        { status: 400 }
      )
    }

    // Pour les canaux privés (private-*), authentification simple
    if (channel.startsWith('private-')) {
      const authResponse = pusher.authorizeChannel(socketId, channel)
      return NextResponse.json(authResponse)
    }

    // Pour les canaux presence (presence-*), on a besoin d'informations utilisateur
    if (channel.startsWith('presence-')) {
      const presenceData = {
        user_id: socketId,
        user_info: {
          name: 'Anonymous',
        },
      }
      const authResponse = pusher.authorizeChannel(socketId, channel, presenceData)
      return NextResponse.json(authResponse)
    }

    // Canaux publics n'ont pas besoin d'auth
    return NextResponse.json({ error: 'Canal non autorisé' }, { status: 403 })
  } catch (error) {
    console.error('Pusher auth error:', error)
    return NextResponse.json(
      { error: 'Erreur d\'authentification Pusher' },
      { status: 403 }
    )
  }
}
