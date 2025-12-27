import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { customAlphabet } from 'nanoid'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Génère un code de session de 6 caractères (lettres majuscules + chiffres)
const generateCodeAlphabet = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 6)

export function generateSessionCode(): string {
  return generateCodeAlphabet()
}

// Génère une couleur aléatoire pour l'avatar
const avatarColors = [
  '#E21B3C', // Rouge
  '#1368CE', // Bleu
  '#D89E00', // Jaune
  '#26890C', // Vert
  '#9C27B0', // Violet
  '#FF6F00', // Orange
  '#00BCD4', // Cyan
  '#E91E63', // Rose
]

export function getRandomAvatarColor(): string {
  return avatarColors[Math.floor(Math.random() * avatarColors.length)]
}

// Calcule les points en fonction du temps de réponse
export function calculatePoints(
  responseTimeMs: number,
  timeLimitMs: number,
  maxPoints: number = 1000
): number {
  if (responseTimeMs >= timeLimitMs) return 0
  const timeRatio = responseTimeMs / timeLimitMs
  const points = Math.round(maxPoints * (1 - timeRatio * 0.5))
  return Math.max(100, Math.min(maxPoints, points))
}

// Formate les secondes en mm:ss
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
