// Constantes de jeu
export const GAME_CONSTANTS = {
  // Session
  SESSION_EXPIRY_HOURS: 4,
  MIN_PLAYERS: 1,
  MAX_PLAYERS: 10,

  // Questions
  DEFAULT_QUESTIONS_COUNT: 10,
  MIN_QUESTIONS: 5,
  MAX_QUESTIONS: 200,

  // Temps
  DEFAULT_TIME_PER_QUESTION: 20, // secondes
  MIN_TIME_PER_QUESTION: 10,
  MAX_TIME_PER_QUESTION: 60,
  REVEAL_DURATION: 3, // secondes pour montrer la réponse
  LEADERBOARD_DURATION: 5, // secondes pour montrer le classement

  // Points
  MAX_POINTS_PER_QUESTION: 1000,
  MIN_POINTS_PER_QUESTION: 100,
}

// Couleurs des boutons de réponse (style Kahoot)
export const ANSWER_COLORS = {
  0: { bg: '#E21B3C', hover: '#C41230', name: 'Rouge' },
  1: { bg: '#1368CE', hover: '#0D4F9E', name: 'Bleu' },
  2: { bg: '#D89E00', hover: '#B38200', name: 'Jaune' },
  3: { bg: '#26890C', hover: '#1E6B09', name: 'Vert' },
} as const

// Thème couleurs Noël
export const CHRISTMAS_COLORS = {
  red: '#DC2626',
  green: '#16A34A',
  gold: '#F59E0B',
  snow: '#F8FAFC',
  night: '#1E293B',
}

// Événements Pusher
export const PUSHER_EVENTS = {
  PLAYER_JOINED: 'player-joined',
  PLAYER_LEFT: 'player-left',
  GAME_STARTED: 'game-started',
  NEW_QUESTION: 'new-question',
  NEW_QUESTION_HOST: 'new-question-host',
  QUESTION_TIMER_START: 'question-timer-start', // Host signals audio done, start question timer
  ANSWER_RECEIVED: 'answer-received',
  QUESTION_ENDED: 'question-ended',
  LEADERBOARD_UPDATE: 'leaderboard-update',
  GAME_FINISHED: 'game-finished',
  GAME_STOPPED: 'game-stopped',
} as const

// Seuils pour les badges de vitesse (en ms)
export const SPEED_THRESHOLDS = {
  LIGHTNING: 1000, // < 1s = Eclair!
  FAST: 3000,      // < 3s = Rapide!
} as const
