// scripts/generate-blindtest.js
// ===========================================
// Générateur automatique de Blind Test
// Format EXACT pour l'app Quiz/BlindTest
// ===========================================
//
// Installation:
//   npm install youtube-sr
//
// Usage:
//   node generate-blindtest.js
//   node generate-blindtest.js output.json

const YouTube = require('youtube-sr').default;
const fs = require('fs');

// ===========================================
// CONFIGURATION - AJOUTE TES PISTES ICI !
// ===========================================

const TRACKS_TO_SEARCH = [
  // 🎅 NOËL (question = artiste)
  { search: "Mariah Carey All I Want For Christmas Is You official video", category: "Noël", songTitle: "All I Want For Christmas Is You", songArtist: "Mariah Carey", startTime: 45 },
  { search: "Wham Last Christmas official video", category: "Noël", songTitle: "Last Christmas", songArtist: "Wham!", startTime: 40 },
  { search: "Bobby Helms Jingle Bell Rock", category: "Noël", songTitle: "Jingle Bell Rock", songArtist: "Bobby Helms", startTime: 15 },
  { search: "Tino Rossi Petit Papa Noël", category: "Noël", songTitle: "Petit Papa Noël", songArtist: "Tino Rossi", startTime: 20 },
  { search: "Michael Bublé Santa Claus Is Coming To Town", category: "Noël", songTitle: "Santa Claus Is Coming To Town", songArtist: "Michael Bublé", startTime: 30 },
  { search: "Brenda Lee Rockin Around the Christmas Tree", category: "Noël", songTitle: "Rockin' Around the Christmas Tree", songArtist: "Brenda Lee", startTime: 15 },
  { search: "Bing Crosby White Christmas", category: "Noël", songTitle: "White Christmas", songArtist: "Bing Crosby", startTime: 30 },
  { search: "John Lennon Happy Xmas War Is Over", category: "Noël", songTitle: "Happy Xmas (War Is Over)", songArtist: "John Lennon", startTime: 50 },
  { search: "Dean Martin Let It Snow", category: "Noël", songTitle: "Let It Snow", songArtist: "Dean Martin", startTime: 20 },
  { search: "Dalida Vive le vent", category: "Noël", songTitle: "Vive le vent", songArtist: "Dalida", startTime: 20 },
  
  // 🌍 HITS INTERNATIONAUX (question = artiste)
  { search: "Queen Bohemian Rhapsody official video", category: "Hits Internationaux", songTitle: "Bohemian Rhapsody", songArtist: "Queen", startTime: 50 },
  { search: "Michael Jackson Billie Jean official video", category: "Hits Internationaux", songTitle: "Billie Jean", songArtist: "Michael Jackson", startTime: 30 },
  { search: "Ed Sheeran Shape of You official video", category: "Hits Internationaux", songTitle: "Shape of You", songArtist: "Ed Sheeran", startTime: 45 },
  { search: "Bruno Mars Uptown Funk official video", category: "Hits Internationaux", songTitle: "Uptown Funk", songArtist: "Bruno Mars", startTime: 60 },
  { search: "Adele Rolling in the Deep official video", category: "Hits Internationaux", songTitle: "Rolling in the Deep", songArtist: "Adele", startTime: 60 },
  { search: "The Weeknd Blinding Lights official video", category: "Hits Internationaux", songTitle: "Blinding Lights", songArtist: "The Weeknd", startTime: 45 },
  { search: "Daft Punk Get Lucky official video", category: "Hits Internationaux", songTitle: "Get Lucky", songArtist: "Daft Punk", startTime: 55 },
  { search: "Nirvana Smells Like Teen Spirit official video", category: "Hits Internationaux", songTitle: "Smells Like Teen Spirit", songArtist: "Nirvana", startTime: 25 },
  { search: "a-ha Take On Me official video", category: "Hits Internationaux", songTitle: "Take On Me", songArtist: "a-ha", startTime: 50 },
  { search: "Billie Eilish Bad Guy official video", category: "Hits Internationaux", songTitle: "Bad Guy", songArtist: "Billie Eilish", startTime: 15 },
  { search: "Luis Fonsi Despacito official video", category: "Hits Internationaux", songTitle: "Despacito", songArtist: "Luis Fonsi", startTime: 60 },
  { search: "PSY Gangnam Style official video", category: "Hits Internationaux", songTitle: "Gangnam Style", songArtist: "PSY", startTime: 45 },
  { search: "Pharrell Williams Happy official video", category: "Hits Internationaux", songTitle: "Happy", songArtist: "Pharrell Williams", startTime: 50 },
  { search: "ABBA Dancing Queen official", category: "Hits Internationaux", songTitle: "Dancing Queen", songArtist: "ABBA", startTime: 50 },
  { search: "Bee Gees Stayin Alive official", category: "Hits Internationaux", songTitle: "Stayin' Alive", songArtist: "Bee Gees", startTime: 30 },
  
  // 🇫🇷 VARIÉTÉ FRANÇAISE (question = artiste)
  { search: "Stromae Formidable official video", category: "Variété Française", songTitle: "Formidable", songArtist: "Stromae", startTime: 45 },
  { search: "Stromae Papaoutai official video", category: "Variété Française", songTitle: "Papaoutai", songArtist: "Stromae", startTime: 50 },
  { search: "Stromae Alors on danse official video", category: "Variété Française", songTitle: "Alors on danse", songArtist: "Stromae", startTime: 45 },
  { search: "Zaz Je veux official video", category: "Variété Française", songTitle: "Je veux", songArtist: "Zaz", startTime: 30 },
  { search: "Aya Nakamura Djadja official video", category: "Variété Française", songTitle: "Djadja", songArtist: "Aya Nakamura", startTime: 40 },
  { search: "Maître Gims Bella official video", category: "Variété Française", songTitle: "Bella", songArtist: "Maître Gims", startTime: 50 },
  { search: "Angèle Balance ton quoi official video", category: "Variété Française", songTitle: "Balance ton quoi", songArtist: "Angèle", startTime: 35 },
  { search: "Angèle Tout oublier official video", category: "Variété Française", songTitle: "Tout oublier", songArtist: "Angèle", startTime: 30 },
  { search: "Edith Piaf La Vie en Rose", category: "Variété Française", songTitle: "La Vie en Rose", songArtist: "Édith Piaf", startTime: 20 },
  { search: "Black M Sur ma route official video", category: "Variété Française", songTitle: "Sur ma route", songArtist: "Black M", startTime: 55 },
  { search: "Maître Gims Sapés comme jamais official video", category: "Variété Française", songTitle: "Sapés comme jamais", songArtist: "Maître Gims", startTime: 50 },
  { search: "Indila Dernière Danse official video", category: "Variété Française", songTitle: "Dernière Danse", songArtist: "Indila", startTime: 60 },
  { search: "Céline Dion Pour que tu m'aimes encore", category: "Variété Française", songTitle: "Pour que tu m'aimes encore", songArtist: "Céline Dion", startTime: 60 },
  { search: "Johnny Hallyday Allumer le feu", category: "Variété Française", songTitle: "Allumer le feu", songArtist: "Johnny Hallyday", startTime: 45 },
  
  // 🏰 DISNEY (question = film)
  { search: "Frozen Let It Go Idina Menzel official", category: "Disney", songTitle: "Libérée Délivrée", songArtist: "La Reine des Neiges", startTime: 60 },
  { search: "Lion King Hakuna Matata official", category: "Disney", songTitle: "Hakuna Matata", songArtist: "Le Roi Lion", startTime: 50 },
  { search: "Little Mermaid Under the Sea official", category: "Disney", songTitle: "Sous l'océan", songArtist: "La Petite Sirène", startTime: 30 },
  { search: "Aladdin A Whole New World official", category: "Disney", songTitle: "Ce rêve bleu", songArtist: "Aladdin", startTime: 55 },
  { search: "Encanto We Don't Talk About Bruno official", category: "Disney", songTitle: "We Don't Talk About Bruno", songArtist: "Encanto", startTime: 45 },
  { search: "Moana How Far I'll Go official", category: "Disney", songTitle: "Le bleu lumière", songArtist: "Vaiana", startTime: 60 },
  { search: "Coco Remember Me official", category: "Disney", songTitle: "Remember Me", songArtist: "Coco", startTime: 30 },
  { search: "Lion King Circle of Life official", category: "Disney", songTitle: "L'histoire de la vie", songArtist: "Le Roi Lion", startTime: 45 },
  { search: "Beauty and the Beast Tale as Old as Time", category: "Disney", songTitle: "Histoire éternelle", songArtist: "La Belle et la Bête", startTime: 40 },
  { search: "Toy Story You've Got a Friend in Me", category: "Disney", songTitle: "Je suis ton ami", songArtist: "Toy Story", startTime: 20 },
  
  // 📺 GÉNÉRIQUES TV / SÉRIES (question = série)
  { search: "Friends theme I'll Be There For You Rembrandts", category: "Génériques TV", songTitle: "I'll Be There For You", songArtist: "Friends", startTime: 5 },
  { search: "Game of Thrones main theme opening", category: "Génériques TV", songTitle: "Main Title", songArtist: "Game of Thrones", startTime: 10 },
  { search: "Stranger Things main theme opening", category: "Génériques TV", songTitle: "Stranger Things Theme", songArtist: "Stranger Things", startTime: 5 },
  { search: "La Casa de Papel My Life Is Going On", category: "Génériques TV", songTitle: "My Life Is Going On", songArtist: "La Casa de Papel", startTime: 30 },
  { search: "The Simpsons main theme opening", category: "Génériques TV", songTitle: "The Simpsons Theme", songArtist: "Les Simpsons", startTime: 5 },
  { search: "Dragon Ball Z Cha-La Head Cha-La opening", category: "Génériques TV", songTitle: "Cha-La Head-Cha-La", songArtist: "Dragon Ball Z", startTime: 30 },
  { search: "Breaking Bad theme opening", category: "Génériques TV", songTitle: "Breaking Bad Theme", songArtist: "Breaking Bad", startTime: 0, duration: 10 },
  { search: "The Office theme song opening", category: "Génériques TV", songTitle: "The Office Theme", songArtist: "The Office", startTime: 0, duration: 12 },
  { search: "Peaky Blinders Red Right Hand", category: "Génériques TV", songTitle: "Red Right Hand", songArtist: "Peaky Blinders", startTime: 30 },
  { search: "Squid Game Pink Soldiers theme", category: "Génériques TV", songTitle: "Pink Soldiers", songArtist: "Squid Game", startTime: 10 },
  
  // 🎬 THÈMES DE FILMS (question = film)
  { search: "Pirates of the Caribbean He's a Pirate theme", category: "Musiques de Films", songTitle: "He's a Pirate", songArtist: "Pirates des Caraïbes", startTime: 30 },
  { search: "Harry Potter Hedwig's Theme John Williams", category: "Musiques de Films", songTitle: "Hedwig's Theme", songArtist: "Harry Potter", startTime: 30 },
  { search: "Star Wars main theme John Williams", category: "Musiques de Films", songTitle: "Main Title", songArtist: "Star Wars", startTime: 10 },
  { search: "Jurassic Park main theme John Williams", category: "Musiques de Films", songTitle: "Theme from Jurassic Park", songArtist: "Jurassic Park", startTime: 45 },
  { search: "Lord of the Rings Concerning Hobbits theme", category: "Musiques de Films", songTitle: "Concerning Hobbits", songArtist: "Le Seigneur des Anneaux", startTime: 60 },
  { search: "Inception Time Hans Zimmer", category: "Musiques de Films", songTitle: "Time", songArtist: "Inception", startTime: 30 },
  { search: "Mission Impossible main theme", category: "Musiques de Films", songTitle: "Mission: Impossible Theme", songArtist: "Mission Impossible", startTime: 5 },
  { search: "James Bond 007 main theme", category: "Musiques de Films", songTitle: "James Bond Theme", songArtist: "James Bond", startTime: 10 },
  { search: "Indiana Jones Raiders March theme", category: "Musiques de Films", songTitle: "Raiders March", songArtist: "Indiana Jones", startTime: 10 },
  { search: "Amélie Poulain Comptine d'un autre été Yann Tiersen", category: "Musiques de Films", songTitle: "Comptine d'un autre été", songArtist: "Amélie Poulain", startTime: 20 },
  { search: "Titanic My Heart Will Go On Celine Dion", category: "Musiques de Films", songTitle: "My Heart Will Go On", songArtist: "Titanic", startTime: 75 },
  { search: "Interstellar main theme Hans Zimmer", category: "Musiques de Films", songTitle: "Main Theme", songArtist: "Interstellar", startTime: 60 },
  { search: "Avengers main theme Alan Silvestri", category: "Musiques de Films", songTitle: "The Avengers Theme", songArtist: "Avengers", startTime: 30 },
  { search: "The Dark Knight theme Hans Zimmer", category: "Musiques de Films", songTitle: "Why So Serious?", songArtist: "The Dark Knight", startTime: 60 },
  { search: "Gladiator Now We Are Free Hans Zimmer", category: "Musiques de Films", songTitle: "Now We Are Free", songArtist: "Gladiator", startTime: 90 },
  
  // 🎮 JEUX VIDÉO (question = jeu)
  { search: "Super Mario Bros theme song original", category: "Jeux Vidéo", songTitle: "Super Mario Bros Theme", songArtist: "Super Mario Bros", startTime: 5 },
  { search: "Legend of Zelda main theme original", category: "Jeux Vidéo", songTitle: "Main Theme", songArtist: "The Legend of Zelda", startTime: 10 },
  { search: "Minecraft Sweden C418", category: "Jeux Vidéo", songTitle: "Sweden", songArtist: "Minecraft", startTime: 30 },
  { search: "Undertale Megalovania Toby Fox", category: "Jeux Vidéo", songTitle: "Megalovania", songArtist: "Undertale", startTime: 10 },
  { search: "GTA San Andreas theme opening", category: "Jeux Vidéo", songTitle: "Theme", songArtist: "GTA San Andreas", startTime: 10 },
  { search: "Skyrim Dragonborn theme", category: "Jeux Vidéo", songTitle: "Dragonborn", songArtist: "Skyrim", startTime: 60 },
  { search: "Tetris theme Korobeiniki original", category: "Jeux Vidéo", songTitle: "Korobeiniki", songArtist: "Tetris", startTime: 10 },
  { search: "Sonic Green Hill Zone theme", category: "Jeux Vidéo", songTitle: "Green Hill Zone", songArtist: "Sonic", startTime: 5 },
  { search: "Pokemon Red Blue battle theme", category: "Jeux Vidéo", songTitle: "Battle Theme", songArtist: "Pokémon", startTime: 10 },
  { search: "Final Fantasy Victory Fanfare", category: "Jeux Vidéo", songTitle: "Victory Fanfare", songArtist: "Final Fantasy", startTime: 0, duration: 10 },
  { search: "Wii Sports theme music", category: "Jeux Vidéo", songTitle: "Wii Sports Theme", songArtist: "Wii Sports", startTime: 0 },
  { search: "Among Us theme music", category: "Jeux Vidéo", songTitle: "Among Us Theme", songArtist: "Among Us", startTime: 10 },
];

// ===========================================
// CATÉGORIES OÙ ON DEMANDE L'ARTISTE
// ===========================================
const CATEGORIES_ARTISTE = ["Noël", "Hits Internationaux", "Variété Française"];

// ===========================================
// FAUSSES RÉPONSES - ARTISTES (pour chansons)
// ===========================================
const FAKE_ARTISTS = {
  "Noël": [
    "Mariah Carey", "Wham!", "Bobby Helms", "Tino Rossi", "Michael Bublé",
    "Brenda Lee", "Bing Crosby", "John Lennon", "Dean Martin", "Dalida",
    "Frank Sinatra", "Nat King Cole", "Elvis Presley", "Céline Dion"
  ],
  "Hits Internationaux": [
    "Queen", "Michael Jackson", "Ed Sheeran", "Bruno Mars", "Adele",
    "The Weeknd", "Daft Punk", "Nirvana", "a-ha", "Billie Eilish",
    "Luis Fonsi", "PSY", "Pharrell Williams", "ABBA", "Bee Gees",
    "Madonna", "Prince", "Whitney Houston", "Beyoncé", "Rihanna"
  ],
  "Variété Française": [
    "Stromae", "Zaz", "Aya Nakamura", "Maître Gims", "Angèle",
    "Édith Piaf", "Black M", "Indila", "Céline Dion", "Johnny Hallyday",
    "Jean-Jacques Goldman", "Francis Cabrel", "Mylène Farmer", "Renaud",
    "Charles Aznavour", "Serge Gainsbourg", "France Gall", "Dalida"
  ]
};

// ===========================================
// FAUSSES RÉPONSES - ŒUVRES (pour films/séries/jeux)
// ===========================================
const FAKE_WORKS = {
  "Disney": [
    "La Reine des Neiges", "Le Roi Lion", "La Petite Sirène", "Aladdin",
    "Encanto", "Vaiana", "Coco", "La Belle et la Bête", "Toy Story",
    "Raiponce", "Mulan", "Pocahontas", "Hercule", "Cendrillon",
    "Le Livre de la Jungle", "Tarzan", "Lilo et Stitch", "Cars"
  ],
  "Génériques TV": [
    "Friends", "Game of Thrones", "Stranger Things", "La Casa de Papel",
    "Les Simpsons", "Dragon Ball Z", "Breaking Bad", "The Office",
    "Peaky Blinders", "Squid Game", "Naruto", "One Piece",
    "The Walking Dead", "How I Met Your Mother", "The Big Bang Theory"
  ],
  "Musiques de Films": [
    "Pirates des Caraïbes", "Harry Potter", "Star Wars", "Jurassic Park",
    "Le Seigneur des Anneaux", "Inception", "Mission Impossible", "James Bond",
    "Indiana Jones", "Amélie Poulain", "Titanic", "Interstellar",
    "Avengers", "The Dark Knight", "Gladiator", "Matrix", "Avatar"
  ],
  "Jeux Vidéo": [
    "Super Mario Bros", "The Legend of Zelda", "Minecraft", "Undertale",
    "GTA San Andreas", "Skyrim", "Tetris", "Sonic", "Pokémon",
    "Final Fantasy", "Wii Sports", "Among Us", "Fortnite", "Call of Duty",
    "Assassin's Creed", "FIFA", "God of War", "The Last of Us"
  ]
};

// ===========================================
// FONCTIONS UTILITAIRES
// ===========================================

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function generateOptions(correctAnswer, category, isArtistQuestion) {
  let pool;
  
  if (isArtistQuestion) {
    pool = FAKE_ARTISTS[category] || FAKE_ARTISTS["Hits Internationaux"];
  } else {
    pool = FAKE_WORKS[category] || FAKE_WORKS["Musiques de Films"];
  }
  
  const filtered = pool.filter(x => x.toLowerCase() !== correctAnswer.toLowerCase());
  const fakes = shuffle(filtered).slice(0, 3);
  return shuffle([correctAnswer, ...fakes]);
}

function getQuestionText(category) {
  if (CATEGORIES_ARTISTE.includes(category)) {
    return "Qui chante cette chanson ?";
  }
  
  switch (category) {
    case "Disney":
      return "De quel film Disney provient cette chanson ?";
    case "Génériques TV":
      return "De quelle série provient ce générique ?";
    case "Musiques de Films":
      return "De quel film provient cette musique ?";
    case "Jeux Vidéo":
      return "De quel jeu vidéo provient cette musique ?";
    default:
      return "Quel est le titre de cette chanson ?";
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ===========================================
// RECHERCHE YOUTUBE
// ===========================================

async function searchYouTube(query) {
  try {
    const results = await YouTube.search(query, { limit: 1, type: 'video' });
    
    if (results.length > 0) {
      const video = results[0];
      return {
        id: video.id || '',
        title: video.title || ''
      };
    }
    return null;
  } catch (error) {
    console.error(`Erreur recherche pour "${query}":`, error.message);
    return null;
  }
}

// ===========================================
// GÉNÉRATION DU BLIND TEST
// ===========================================

async function generateBlindTest(tracks) {
  const questions = [];
  
  console.log(`\n🎵 Génération du Blind Test (${tracks.length} pistes)\n`);
  console.log('='.repeat(50));
  
  for (let i = 0; i < tracks.length; i++) {
    const track = tracks[i];
    process.stdout.write(`\n[${i + 1}/${tracks.length}] 🔍 ${track.songTitle}...`);
    
    // Rechercher sur YouTube
    const searchResult = await searchYouTube(track.search);
    
    if (!searchResult || !searchResult.id) {
      console.log(` ❌ Non trouvé`);
      continue;
    }
    
    console.log(` ✅ ${searchResult.id}`);
    
    // Déterminer si c'est une question sur l'artiste ou l'œuvre
    const isArtistQuestion = CATEGORIES_ARTISTE.includes(track.category);
    
    // La bonne réponse : artiste pour les chansons, songArtist (qui contient le nom du film/jeu) pour les autres
    const correctAnswer = track.songArtist;
    
    // Générer les options QCM
    const options = generateOptions(correctAnswer, track.category, isArtistQuestion);
    const correctIndex = options.findIndex(o => o === correctAnswer);
    
    // Texte de la question adapté
    const questionText = getQuestionText(track.category);
    
    const startTime = track.startTime || 30;
    const duration = track.duration || 15;
    
    // ✅ FORMAT EXACT DEMANDÉ
    const question = {
      type: "BLINDTEST",
      text: questionText,
      options: options,
      correctIndex: correctIndex >= 0 ? correctIndex : 0,
      youtubeVideoId: searchResult.id,
      audioStartTime: startTime,
      audioEndTime: startTime + duration,
      songTitle: track.songTitle,
      songArtist: track.songArtist,
      category: track.category
    };
    
    questions.push(question);
    
    // Pause pour éviter le rate limiting
    await sleep(300);
  }
  
  return questions;
}

// ===========================================
// MAIN
// ===========================================

async function main() {
  console.log('🎄 Générateur Automatique de Blind Test');
  console.log('========================================\n');
  
  const outputPath = process.argv[2] || 'blindtest-generated.json';
  
  // Générer le blind test
  const questions = await generateBlindTest(TRACKS_TO_SEARCH);
  
  // Sauvegarder
  fs.writeFileSync(outputPath, JSON.stringify(questions, null, 2));
  
  // Rapport
  console.log('\n\n' + '='.repeat(50));
  console.log('📊 RAPPORT FINAL');
  console.log('='.repeat(50));
  console.log(`\n✅ ${questions.length} questions générées`);
  console.log(`❌ ${TRACKS_TO_SEARCH.length - questions.length} échecs`);
  
  // Stats par catégorie
  const byCategory = {};
  questions.forEach(q => {
    byCategory[q.category] = (byCategory[q.category] || 0) + 1;
  });
  
  console.log('\n📋 Par catégorie:');
  Object.entries(byCategory).forEach(([cat, count]) => {
    console.log(`   ${cat}: ${count}`);
  });
  
  console.log(`\n📁 Fichier sauvegardé: ${outputPath}`);
  
  // Aperçu
  console.log('\n📋 Aperçu:');
  
  // Montrer un exemple de chaque type
  const exempleArtiste = questions.find(q => CATEGORIES_ARTISTE.includes(q.category));
  const exempleFilm = questions.find(q => q.category === "Musiques de Films");
  const exempleJeu = questions.find(q => q.category === "Jeux Vidéo");
  
  [exempleArtiste, exempleFilm, exempleJeu].filter(Boolean).forEach((q, i) => {
    console.log(`\n${i + 1}. [${q.category}] ${q.text}`);
    console.log(`   Options: ${q.options.join(' | ')}`);
    console.log(`   ✅ Réponse: ${q.options[q.correctIndex]}`);
    console.log(`   🎵 ${q.songTitle} - ${q.songArtist}`);
  });
}

main().catch(console.error);
