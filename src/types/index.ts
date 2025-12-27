import type { Session, Player, Question, Answer } from '@prisma/client'

export type { Session, Player, Question, Answer }

// Type pour l'import de questions via l'admin
export interface CustomQuestion {
  text: string
  options: string[]
  correctIndex: number
  category?: string
  // YouTube audio (blindtest)
  youtubeVideoId?: string   // YouTube video ID (ex: "dQw4w9WgXcQ")
  audioStartTime?: number   // Start time in seconds
  audioEndTime?: number     // End time in seconds
  // Metadata
  songTitle?: string
  songArtist?: string
}

// Types pour les requêtes API
export interface CreateSessionRequest {
  gameMode: 'QUIZ' | 'BLINDTEST' | 'MIXED'
  totalQuestions: number
  timePerQuestion: number
  hostNickname: string
  // Mode automatique
  autoMode?: boolean
  showLeaderboard?: boolean
  revealDuration?: number
  leaderboardDuration?: number
}

export interface CreateSessionResponse {
  id: string
  code: string
  hostId: string
  status: string
}

export interface JoinSessionRequest {
  nickname: string
}

export interface JoinSessionResponse {
  playerId: string
  sessionId: string
  nickname: string
  avatarColor: string
}

export interface SubmitAnswerRequest {
  playerId: string
  questionId: string
  answer: string
  responseTime: number
}

export interface SubmitAnswerResponse {
  isCorrect: boolean
  pointsAwarded: number
  totalScore: number
  responseTime?: number
}

// Types pour les événements Pusher
export interface PlayerJoinedEvent {
  player: {
    id: string
    nickname: string
    avatarColor: string
  }
  playerCount: number
}

export interface PlayerLeftEvent {
  playerId: string
  playerCount: number
}

export interface GameStartedEvent {
  status: string
  currentQuestion: number
  totalQuestions: number
}

export interface QuestionData {
  id: string
  questionNumber: number
  totalQuestions: number
  type: 'QUIZ' | 'BLINDTEST'
  text?: string
  options?: string[]
  timeLimit: number
  maxPoints: number
  // YouTube audio (blindtest)
  youtubeVideoId?: string
  audioStartTime?: number
  audioEndTime?: number
}

export interface QuestionDataHost extends QuestionData {
  correctIndex?: number
  songTitle?: string
  songArtist?: string
}

export interface AnswerReceivedEvent {
  playerId: string
  answeredCount: number
  totalPlayers: number
}

export interface QuestionEndedEvent {
  correctIndex?: number
  correctAnswer?: string
  stats: {
    totalAnswers: number
    correctAnswers: number
    answerDistribution: number[]
  }
}

export interface LeaderboardEntry {
  playerId: string
  nickname: string
  avatarColor: string
  score: number
  rank: number
  pointsGained?: number
}

export interface LeaderboardUpdateEvent {
  rankings: LeaderboardEntry[]
}

export interface GameFinishedEvent {
  finalRankings: LeaderboardEntry[]
  winner: {
    playerId: string
    nickname: string
    score: number
  }
}

// Types pour l'état du jeu côté client
export type GameStatus =
  | 'connecting'
  | 'waiting'
  | 'audio'      // Playing Deezer audio preview
  | 'question'
  | 'answered'
  | 'reveal'
  | 'leaderboard'
  | 'finished'

export interface GameState {
  status: GameStatus
  sessionId: string
  playerId?: string
  isHost: boolean
  players: PlayerJoinedEvent['player'][]
  currentQuestion?: QuestionData | QuestionDataHost
  lastAnswer?: SubmitAnswerResponse
  leaderboard?: LeaderboardEntry[]
  timeRemaining?: number
  correctIndex?: number
}
