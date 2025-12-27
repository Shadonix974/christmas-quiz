# 🎄 Christmas Party Quiz & Blind Test App

## Spécifications Techniques pour Claude Code

> **Objectif** : Application multijoueur temps réel style Kahoot pour soirée de Noël
> **Délai** : 24 heures
> **Stack** : Next.js 15 + Prisma + PostgreSQL + Pusher

---

## 📋 Table des Matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Architecture Technique](#2-architecture-technique)
3. [Structure du Projet](#3-structure-du-projet)
4. [Schéma Prisma](#4-schéma-prisma)
5. [Flux Applicatif](#5-flux-applicatif)
6. [API Routes](#6-api-routes)
7. [Pusher Events](#7-pusher-events)
8. [Composants UI](#8-composants-ui)
9. [Plan d'Implémentation](#9-plan-dimplémentation)
10. [Déploiement](#10-déploiement)

---

## 1. Vue d'ensemble

### 1.1 Concept

Application de jeu multijoueur combinant **Quiz** et **Blind Test** musical pour soirées entre amis.

### 1.2 Fonctionnalités Clés

| Fonctionnalité | Description |
|----------------|-------------|
| **Session par code** | L'hôte crée une partie → génère un code 6 caractères (ex: `NOEL24`) |
| **Rejoindre** | Joueurs entrent le code + pseudo sur leur téléphone |
| **Quiz** | Questions à choix multiples, points selon rapidité |
| **Blind Test** | Extrait audio, deviner titre/artiste |
| **Leaderboard** | Classement temps réel après chaque question |
| **Responsive** | Écran hôte (TV/PC) + écrans joueurs (mobile) |

### 1.3 User Stories

```
En tant qu'HÔTE :
- Je crée une session et obtiens un code
- Je configure le nombre de questions et le mode (quiz/blindtest/mixte)
- Je lance la partie quand tout le monde a rejoint
- Je vois les questions sur grand écran
- Je contrôle le passage à la question suivante

En tant que JOUEUR :
- Je rejoins avec le code + mon pseudo
- Je vois la question sur mon téléphone
- Je réponds le plus vite possible
- Je vois mon score et le classement après chaque question
```

---

## 2. Architecture Technique

### 2.1 Stack Complète

```
┌─────────────────────────────────────────────────────────┐
│                      FRONTEND                           │
│  Next.js 15 (App Router) + React 19 + Tailwind CSS     │
│  TypeScript + Framer Motion (animations)               │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    API LAYER                            │
│  Next.js Route Handlers (app/api/*)                    │
│  Server Actions pour mutations                         │
└─────────────────────────────────────────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
┌─────────────────────┐     ┌─────────────────────────────┐
│     DATABASE        │     │       REALTIME              │
│  PostgreSQL         │     │  Pusher Channels            │
│  + Prisma ORM       │     │  (WebSocket)                │
└─────────────────────┘     └─────────────────────────────┘
```

### 2.2 Dépendances

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@prisma/client": "^5.0.0",
    "pusher": "^5.2.0",
    "pusher-js": "^8.4.0",
    "nanoid": "^5.0.0",
    "framer-motion": "^11.0.0",
    "lucide-react": "^0.400.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "prisma": "^5.0.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.0.0",
    "postcss": "^8.0.0"
  }
}
```

---

## 3. Structure du Projet

```
src/
├── app/
│   ├── layout.tsx                 # Layout racine + providers
│   ├── page.tsx                   # Page d'accueil (créer/rejoindre)
│   ├── globals.css                # Styles globaux + animations
│   │
│   ├── (game)/                    # Route group pour le jeu
│   │   ├── host/
│   │   │   └── [sessionId]/
│   │   │       └── page.tsx       # Dashboard hôte
│   │   └── play/
│   │       └── [sessionId]/
│   │           └── page.tsx       # Interface joueur
│   │
│   └── api/
│       ├── sessions/
│       │   ├── route.ts           # POST: créer session
│       │   └── [sessionId]/
│       │       ├── route.ts       # GET: infos session
│       │       ├── join/
│       │       │   └── route.ts   # POST: rejoindre
│       │       ├── start/
│       │       │   └── route.ts   # POST: démarrer
│       │       ├── next/
│       │       │   └── route.ts   # POST: question suivante
│       │       └── answer/
│       │           └── route.ts   # POST: soumettre réponse
│       └── pusher/
│           └── auth/
│               └── route.ts       # Auth Pusher (presence channels)
│
├── components/
│   ├── ui/                        # Composants UI réutilisables
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Badge.tsx
│   │   └── Progress.tsx
│   │
│   ├── game/                      # Composants spécifiques au jeu
│   │   ├── JoinForm.tsx           # Formulaire rejoindre
│   │   ├── CreateForm.tsx         # Formulaire créer session
│   │   ├── WaitingRoom.tsx        # Salle d'attente
│   │   ├── QuestionDisplay.tsx    # Affichage question (hôte)
│   │   ├── AnswerButtons.tsx      # Boutons réponse (joueur)
│   │   ├── BlindTestPlayer.tsx    # Lecteur audio blind test
│   │   ├── Leaderboard.tsx        # Classement
│   │   ├── Timer.tsx              # Compte à rebours
│   │   ├── ScoreAnimation.tsx     # Animation points
│   │   └── Confetti.tsx           # Effet confetti fin de partie
│   │
│   └── providers/
│       └── PusherProvider.tsx     # Context Pusher
│
├── lib/
│   ├── prisma.ts                  # Client Prisma singleton
│   ├── pusher.ts                  # Config Pusher server
│   ├── pusher-client.ts           # Config Pusher client
│   ├── utils.ts                   # Helpers (cn, generateCode, etc.)
│   └── constants.ts               # Constantes (temps, points, etc.)
│
├── hooks/
│   ├── usePusher.ts               # Hook Pusher subscription
│   ├── useGameState.ts            # Hook état du jeu
│   ├── useTimer.ts                # Hook timer countdown
│   └── useAudio.ts                # Hook lecture audio
│
├── types/
│   └── index.ts                   # Types TypeScript
│
└── data/
    ├── quiz-questions.json        # Questions quiz prédéfinies
    └── blindtest-tracks.json      # Pistes blind test
```

---

## 4. Schéma Prisma

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============ ENUMS ============

enum SessionStatus {
  WAITING      // En attente de joueurs
  PLAYING      // Partie en cours
  QUESTION     // Question affichée
  REVEAL       // Révélation réponse
  LEADERBOARD  // Affichage classement
  FINISHED     // Partie terminée
}

enum GameMode {
  QUIZ         // Quiz uniquement
  BLINDTEST    // Blind test uniquement
  MIXED        // Alternance des deux
}

enum QuestionType {
  QUIZ         // Question à choix multiples
  BLINDTEST    // Reconnaissance audio
}

// ============ MODELS ============

model Session {
  id              String         @id @default(cuid())
  code            String         @unique // Code 6 caractères (ex: NOEL24)
  hostId          String         // ID unique de l'hôte
  status          SessionStatus  @default(WAITING)
  gameMode        GameMode       @default(MIXED)
  
  currentQuestion Int            @default(0)  // Index question actuelle
  totalQuestions  Int            @default(10) // Nombre total de questions
  timePerQuestion Int            @default(20) // Secondes par question
  
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  expiresAt       DateTime       // Session expire après 4h
  
  players         Player[]
  questions       Question[]
  
  @@index([code])
  @@index([status])
}

model Player {
  id          String    @id @default(cuid())
  sessionId   String
  session     Session   @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  
  nickname    String
  avatarColor String    // Couleur avatar générée
  score       Int       @default(0)
  isHost      Boolean   @default(false)
  isConnected Boolean   @default(true)
  
  createdAt   DateTime  @default(now())
  
  answers     Answer[]
  
  @@unique([sessionId, nickname]) // Pas de doublon de pseudo par session
  @@index([sessionId])
}

model Question {
  id          String       @id @default(cuid())
  sessionId   String
  session     Session      @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  
  type        QuestionType
  order       Int          // Ordre dans la partie
  
  // Pour QUIZ
  text        String?      // Texte de la question
  options     String[]     // Options de réponse (JSON array)
  correctIndex Int?        // Index de la bonne réponse (0-3)
  
  // Pour BLINDTEST
  audioUrl    String?      // URL du fichier audio
  songTitle   String?      // Titre de la chanson
  songArtist  String?      // Artiste
  
  timeLimit   Int          @default(20) // Temps pour cette question
  points      Int          @default(1000) // Points max
  
  answers     Answer[]
  
  @@index([sessionId, order])
}

model Answer {
  id            String   @id @default(cuid())
  playerId      String
  player        Player   @relation(fields: [playerId], references: [id], onDelete: Cascade)
  questionId    String
  question      Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
  
  answer        String   // Réponse donnée (index pour quiz, texte pour blindtest)
  isCorrect     Boolean
  responseTime  Int      // Temps de réponse en millisecondes
  pointsAwarded Int      @default(0)
  
  createdAt     DateTime @default(now())
  
  @@unique([playerId, questionId]) // Une réponse par joueur par question
  @@index([questionId])
}
```

---

## 5. Flux Applicatif

### 5.1 Création de Session (Hôte)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Accueil   │────▶│   Config    │────▶│   Waiting   │
│   (home)    │     │   partie    │     │    Room     │
└─────────────┘     └─────────────┘     └─────────────┘
                           │                   │
                           ▼                   ▼
                    POST /api/sessions   Pusher: subscribe
                    Retourne: code       Channel: presence-session-{id}
```

### 5.2 Rejoindre une Session (Joueur)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Accueil   │────▶│ Enter Code  │────▶│   Waiting   │
│   (home)    │     │  + Pseudo   │     │    Room     │
└─────────────┘     └─────────────┘     └─────────────┘
                           │                   │
                           ▼                   ▼
                    POST /api/sessions   Pusher: subscribe
                    /{id}/join           + player-joined event
```

### 5.3 Déroulement d'une Question

```
┌──────────────────────────────────────────────────────────────┐
│                        HÔTE (TV/PC)                          │
├──────────────────────────────────────────────────────────────┤
│  1. Affiche question + options                               │
│  2. Lance timer (20s)                                        │
│  3. Affiche progression réponses                             │
│  4. Révèle bonne réponse + stats                             │
│  5. Affiche leaderboard                                      │
│  6. Bouton "Question suivante"                               │
└──────────────────────────────────────────────────────────────┘
                              │
                    Pusher Events (bidirectionnel)
                              │
┌──────────────────────────────────────────────────────────────┐
│                      JOUEURS (Mobile)                        │
├──────────────────────────────────────────────────────────────┤
│  1. Reçoit question (sans réponse correcte)                  │
│  2. Affiche 4 boutons colorés                                │
│  3. Clique = envoie réponse + timestamp                      │
│  4. Affiche si correct + points gagnés                       │
│  5. Voit sa position dans le classement                      │
└──────────────────────────────────────────────────────────────┘
```

### 5.4 State Machine de la Session

```
                    ┌─────────────┐
         ┌─────────▶│   WAITING   │◀─────────┐
         │          └──────┬──────┘          │
         │                 │ start()         │
         │                 ▼                 │
         │          ┌─────────────┐          │
         │    ┌────▶│   QUESTION  │          │
         │    │     └──────┬──────┘          │
         │    │            │ timeout/        │
         │    │            │ allAnswered     │
         │    │            ▼                 │
         │    │     ┌─────────────┐          │
         │    │     │   REVEAL    │          │
         │    │     └──────┬──────┘          │
         │    │            │ next()          │
         │    │            ▼                 │
         │    │     ┌─────────────┐          │
         │    │     │ LEADERBOARD │          │
         │    │     └──────┬──────┘          │
         │    │            │                 │
         │    │    hasMore?├────── no ──────▶│
         │    │            │                 │
         │    └──── yes ◀──┘                 │
         │                                   │
         │          ┌─────────────┐          │
         └──────────│  FINISHED   │◀─────────┘
                    └─────────────┘
```

---

## 6. API Routes

### 6.1 Sessions

#### `POST /api/sessions` - Créer une session
```typescript
// Request
{
  "gameMode": "MIXED",      // QUIZ | BLINDTEST | MIXED
  "totalQuestions": 10,
  "timePerQuestion": 20,
  "hostNickname": "Shad"
}

// Response 201
{
  "id": "clx123...",
  "code": "NOEL24",
  "hostId": "player_abc...",
  "status": "WAITING"
}
```

#### `POST /api/sessions/[sessionId]/join` - Rejoindre
```typescript
// Request
{
  "nickname": "Marie"
}

// Response 200
{
  "playerId": "clx456...",
  "sessionId": "clx123...",
  "nickname": "Marie",
  "avatarColor": "#FF6B6B"
}

// Errors
// 404 - Session not found
// 400 - Nickname taken
// 400 - Game already started
```

#### `POST /api/sessions/[sessionId]/start` - Démarrer
```typescript
// Request (host only)
{
  "hostId": "player_abc..."
}

// Response 200
{
  "status": "QUESTION",
  "currentQuestion": 0,
  "question": { ... }
}
```

#### `POST /api/sessions/[sessionId]/answer` - Répondre
```typescript
// Request
{
  "playerId": "clx456...",
  "questionId": "clx789...",
  "answer": "2",           // Index ou texte
  "responseTime": 3450     // ms depuis affichage
}

// Response 200
{
  "isCorrect": true,
  "pointsAwarded": 850,
  "totalScore": 2340
}
```

#### `POST /api/sessions/[sessionId]/next` - Question suivante
```typescript
// Request (host only)
{
  "hostId": "player_abc..."
}

// Response 200
{
  "status": "QUESTION",     // ou "FINISHED"
  "currentQuestion": 3,
  "question": { ... }       // null si finished
}
```

---

## 7. Pusher Events

### 7.1 Configuration Channels

```typescript
// Channels utilisés
`presence-session-${sessionId}`  // Channel principal avec presence
```

### 7.2 Events Serveur → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `player-joined` | `{ player }` | Nouveau joueur rejoint |
| `player-left` | `{ playerId }` | Joueur déconnecté |
| `game-started` | `{ status, question }` | Partie lancée |
| `new-question` | `{ question, questionNumber }` | Nouvelle question |
| `answer-received` | `{ playerId, answeredCount }` | Quelqu'un a répondu |
| `question-ended` | `{ correctAnswer, stats }` | Fin du temps |
| `leaderboard-update` | `{ rankings }` | Classement mis à jour |
| `game-finished` | `{ finalRankings, winner }` | Partie terminée |

### 7.3 Payload Exemples

```typescript
// player-joined
{
  "event": "player-joined",
  "data": {
    "player": {
      "id": "clx456...",
      "nickname": "Marie",
      "avatarColor": "#FF6B6B"
    },
    "playerCount": 5
  }
}

// new-question (vers joueurs - sans correctIndex)
{
  "event": "new-question",
  "data": {
    "questionNumber": 3,
    "totalQuestions": 10,
    "type": "QUIZ",
    "text": "Quelle est la capitale de l'Australie ?",
    "options": ["Sydney", "Melbourne", "Canberra", "Perth"],
    "timeLimit": 20,
    "maxPoints": 1000
  }
}

// new-question (vers hôte - avec correctIndex)
{
  "event": "new-question-host",
  "data": {
    // ... same as above +
    "correctIndex": 2
  }
}

// leaderboard-update
{
  "event": "leaderboard-update",
  "data": {
    "rankings": [
      { "playerId": "...", "nickname": "Shad", "score": 2850, "rank": 1 },
      { "playerId": "...", "nickname": "Marie", "score": 2340, "rank": 2 },
      // ...
    ]
  }
}
```

---

## 8. Composants UI

### 8.1 Design System

```typescript
// Palette Noël
const colors = {
  christmas: {
    red: '#DC2626',      // Rouge Noël
    green: '#16A34A',    // Vert sapin
    gold: '#F59E0B',     // Or
    snow: '#F8FAFC',     // Blanc neige
    night: '#1E293B',    // Bleu nuit
  },
  // Couleurs des boutons réponse (style Kahoot)
  answers: {
    a: '#E21B3C',  // Rouge
    b: '#1368CE',  // Bleu
    c: '#D89E00',  // Jaune
    d: '#26890C',  // Vert
  }
}
```

### 8.2 Composants Clés

#### WaitingRoom
```tsx
// Affiche:
// - Code de la session en GROS
// - QR Code pour rejoindre rapidement
// - Liste des joueurs connectés (avec avatars)
// - Bouton "Lancer la partie" (hôte only)
// - Compteur de joueurs
```

#### QuestionDisplay (Écran Hôte)
```tsx
// Affiche:
// - Numéro question / total
// - Timer circulaire animé
// - Texte de la question
// - 4 options avec couleurs
// - Compteur de réponses reçues
// - Après timeout: révèle la bonne réponse avec animation
```

#### AnswerButtons (Écran Joueur)
```tsx
// Affiche:
// - Timer en haut
// - 4 gros boutons tactiles colorés
// - Après réponse: feedback immédiat (✓ ou ✗)
// - Points gagnés avec animation
```

#### BlindTestPlayer
```tsx
// Affiche:
// - Visualisation audio animée
// - Bouton play (hôte)
// - Champ de saisie pour deviner (joueur)
// - Timer
```

#### Leaderboard
```tsx
// Affiche:
// - Top 5 avec podium animé
// - Scores avec barres de progression
// - Animation montée/descente des positions
// - Points gagnés à la dernière question
```

---

## 9. Plan d'Implémentation

### Phase 1: Setup (1-2h)
```bash
# Commandes à exécuter
npx create-next-app@latest christmas-party --typescript --tailwind --app --src-dir
cd christmas-party
npm install @prisma/client pusher pusher-js nanoid framer-motion lucide-react clsx tailwind-merge
npm install -D prisma

# Setup Prisma
npx prisma init
# Configurer DATABASE_URL dans .env
# Copier le schema.prisma
npx prisma db push
npx prisma generate
```

**Fichiers à créer:**
1. `src/lib/prisma.ts` - Singleton Prisma
2. `src/lib/pusher.ts` - Config serveur Pusher
3. `src/lib/pusher-client.ts` - Config client Pusher
4. `src/lib/utils.ts` - Helpers
5. `src/lib/constants.ts` - Constantes
6. `src/types/index.ts` - Types TypeScript
7. `.env.local` - Variables d'environnement

### Phase 2: API Routes (2-3h)
**Ordre de création:**
1. `POST /api/sessions` - Créer session
2. `POST /api/sessions/[sessionId]/join` - Rejoindre
3. `GET /api/sessions/[sessionId]` - Info session
4. `POST /api/sessions/[sessionId]/start` - Démarrer
5. `POST /api/sessions/[sessionId]/answer` - Répondre
6. `POST /api/sessions/[sessionId]/next` - Question suivante
7. `POST /api/pusher/auth` - Auth presence channel

### Phase 3: UI Components (3-4h)
**Ordre de création:**
1. Composants UI de base (`Button`, `Card`, `Input`)
2. `PusherProvider` - Context
3. Page d'accueil avec formulaires
4. `WaitingRoom` - Salle d'attente
5. `QuestionDisplay` - Écran hôte
6. `AnswerButtons` - Écran joueur
7. `Timer` - Compte à rebours
8. `Leaderboard` - Classement

### Phase 4: Game Logic (3-4h)
**Implémenter:**
1. Hook `useGameState` - État global du jeu
2. Hook `usePusher` - Subscription aux events
3. Hook `useTimer` - Gestion countdown
4. Logique de calcul des points
5. Gestion des transitions d'état
6. Animations de feedback

### Phase 5: Blind Test (2-3h)
**Ajouter:**
1. `BlindTestPlayer` - Lecteur audio
2. Hook `useAudio` - Contrôle lecture
3. Logique de comparaison fuzzy pour réponses
4. Questions blind test prédéfinies

### Phase 6: Polish (2-3h)
**Finaliser:**
1. Animations avec Framer Motion
2. Effets sonores
3. Confetti fin de partie
4. Responsive design
5. Gestion erreurs et edge cases
6. Tests manuels

### Phase 7: Déploiement (1h)
**Actions:**
1. Créer compte Pusher (gratuit)
2. Créer base PostgreSQL (Neon/Supabase)
3. Déployer sur Vercel
4. Configurer variables d'environnement
5. Tester en conditions réelles

---

## 10. Déploiement

### 10.1 Variables d'Environnement

```env
# .env.local

# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"

# Pusher
PUSHER_APP_ID="your_app_id"
PUSHER_KEY="your_key"
PUSHER_SECRET="your_secret"
PUSHER_CLUSTER="eu"  # ou mt1, us2, etc.

# Public (accessible côté client)
NEXT_PUBLIC_PUSHER_KEY="your_key"
NEXT_PUBLIC_PUSHER_CLUSTER="eu"
```

### 10.2 Services Gratuits Recommandés

| Service | Usage | Gratuit |
|---------|-------|---------|
| **Vercel** | Hosting Next.js | ✅ Illimité |
| **Neon** | PostgreSQL | ✅ 0.5GB |
| **Supabase** | PostgreSQL alt. | ✅ 500MB |
| **Pusher** | Realtime | ✅ 200k msg/jour |

### 10.3 Commandes Déploiement

```bash
# Vercel
npm install -g vercel
vercel

# Ou via GitHub integration
# Push sur GitHub → Auto-deploy Vercel
```

---

## 📝 Notes pour Claude Code

### Priorités
1. **MVP fonctionnel d'abord** - Quiz basique qui marche
2. **Temps réel ensuite** - Pusher integration
3. **Blind test après** - Si le temps le permet
4. **Polish en dernier** - Animations, effets

### Patterns à suivre
- Server Components par défaut
- `"use client"` uniquement si nécessaire (interactions, hooks)
- Server Actions pour les mutations simples
- Route Handlers pour logique complexe + Pusher triggers

### Points d'attention
- Générer le code de session côté serveur (sécurité)
- Valider les inputs (zod recommandé si temps)
- Gérer la reconnexion Pusher
- Nettoyer les sessions expirées (cron ou on-demand)

### Questions à clarifier avec l'utilisateur
- [ ] Thème spécifique pour les questions de quiz ?
- [ ] Pistes audio pour le blind test disponibles ?
- [ ] Nombre max de joueurs par session ?
- [ ] Authentification nécessaire ou anonyme ?

---

## 🎯 Checklist Finale

- [ ] Session créable avec code unique
- [ ] Joueurs peuvent rejoindre avec code + pseudo
- [ ] Waiting room avec liste des joueurs
- [ ] Questions affichées en temps réel
- [ ] Réponses enregistrées avec calcul de points
- [ ] Leaderboard après chaque question
- [ ] Écran de fin avec classement final
- [ ] Responsive (TV + mobile)
- [ ] Déployé et accessible

---

*Document généré pour Claude Code - Projet Christmas Party App*
*Dernière mise à jour: Décembre 2024*
