import Pusher from 'pusher'

export const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
})

export async function triggerEvent(
  channel: string,
  event: string,
  data: unknown
) {
  return pusher.trigger(channel, event, data)
}

export function getSessionChannel(sessionId: string) {
  // Utiliser un canal privé au lieu de presence pour simplifier
  return `private-session-${sessionId}`
}
