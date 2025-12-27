import { PrismaClient, QuestionType } from '@prisma/client'

const prisma = new PrismaClient()

// Questions quiz existantes
const quizQuestions = [
  { text: "Quelle est la capitale de l'Australie ?", options: ["Sydney", "Melbourne", "Canberra", "Perth"], correctIndex: 2, category: "Géographie" },
  { text: "En quelle année l'homme a-t-il marché sur la Lune pour la première fois ?", options: ["1965", "1969", "1971", "1973"], correctIndex: 1, category: "Histoire" },
  { text: "Quel est le plus grand océan du monde ?", options: ["Atlantique", "Indien", "Arctique", "Pacifique"], correctIndex: 3, category: "Géographie" },
  { text: "Qui a peint la Joconde ?", options: ["Michel-Ange", "Raphaël", "Léonard de Vinci", "Botticelli"], correctIndex: 2, category: "Art" },
  { text: "Combien de joueurs composent une équipe de football sur le terrain ?", options: ["9", "10", "11", "12"], correctIndex: 2, category: "Sport" },
  { text: "Quel est l'élément chimique représenté par le symbole 'O' ?", options: ["Or", "Osmium", "Oxygène", "Oganesson"], correctIndex: 2, category: "Science" },
  { text: "Dans quel film trouve-t-on le personnage de Dark Vador ?", options: ["Star Trek", "Star Wars", "Stargate", "Battlestar Galactica"], correctIndex: 1, category: "Cinéma" },
  { text: "Quelle est la monnaie du Japon ?", options: ["Yuan", "Won", "Yen", "Ringgit"], correctIndex: 2, category: "Géographie" },
  { text: "Combien y a-t-il de continents sur Terre ?", options: ["5", "6", "7", "8"], correctIndex: 2, category: "Géographie" },
  { text: "Quel est le plus long fleuve du monde ?", options: ["Amazone", "Nil", "Yangtsé", "Mississippi"], correctIndex: 1, category: "Géographie" },
  { text: "En quelle année a débuté la Première Guerre mondiale ?", options: ["1912", "1914", "1916", "1918"], correctIndex: 1, category: "Histoire" },
  { text: "Quel groupe a chanté 'Bohemian Rhapsody' ?", options: ["The Beatles", "Led Zeppelin", "Queen", "Pink Floyd"], correctIndex: 2, category: "Musique" },
  { text: "Combien de côtés a un hexagone ?", options: ["5", "6", "7", "8"], correctIndex: 1, category: "Science" },
  { text: "Quel animal est le symbole de la marque Lacoste ?", options: ["Requin", "Crocodile", "Serpent", "Lézard"], correctIndex: 1, category: "Culture générale" },
  { text: "Dans quel pays se trouve la tour de Pise ?", options: ["Espagne", "France", "Italie", "Portugal"], correctIndex: 2, category: "Géographie" },
  { text: "Quel est le plus grand pays du monde en superficie ?", options: ["Canada", "États-Unis", "Chine", "Russie"], correctIndex: 3, category: "Géographie" },
  { text: "Combien de dents a un adulte (dentition complète) ?", options: ["28", "30", "32", "34"], correctIndex: 2, category: "Science" },
  { text: "Qui a écrit 'Les Misérables' ?", options: ["Émile Zola", "Victor Hugo", "Gustave Flaubert", "Honoré de Balzac"], correctIndex: 1, category: "Littérature" },
  { text: "Quel sport pratique Roger Federer ?", options: ["Golf", "Tennis", "Badminton", "Squash"], correctIndex: 1, category: "Sport" },
  { text: "Quelle planète est surnommée la 'planète rouge' ?", options: ["Vénus", "Mars", "Jupiter", "Saturne"], correctIndex: 1, category: "Science" },
  { text: "En quelle année le mur de Berlin est-il tombé ?", options: ["1987", "1989", "1991", "1993"], correctIndex: 1, category: "Histoire" },
  { text: "Quel est le nom du célèbre détective créé par Arthur Conan Doyle ?", options: ["Hercule Poirot", "Sherlock Holmes", "Miss Marple", "Philip Marlowe"], correctIndex: 1, category: "Littérature" },
  { text: "Combien de temps dure un match de football réglementaire ?", options: ["80 minutes", "90 minutes", "100 minutes", "120 minutes"], correctIndex: 1, category: "Sport" },
  { text: "Quel est le symbole chimique de l'or ?", options: ["Or", "Au", "Ag", "Fe"], correctIndex: 1, category: "Science" },
  { text: "Dans quel pays se situe le Machu Picchu ?", options: ["Mexique", "Colombie", "Pérou", "Chili"], correctIndex: 2, category: "Géographie" },
  { text: "Qui a réalisé le film 'Titanic' (1997) ?", options: ["Steven Spielberg", "James Cameron", "Ridley Scott", "Christopher Nolan"], correctIndex: 1, category: "Cinéma" },
  { text: "Combien y a-t-il de couleurs dans un arc-en-ciel ?", options: ["5", "6", "7", "8"], correctIndex: 2, category: "Science" },
  { text: "Quel pays a remporté la Coupe du Monde de football en 2018 ?", options: ["Allemagne", "Brésil", "France", "Argentine"], correctIndex: 2, category: "Sport" },
  { text: "Quelle est la capitale du Canada ?", options: ["Toronto", "Vancouver", "Montréal", "Ottawa"], correctIndex: 3, category: "Géographie" },
  { text: "Quel artiste a chanté 'Thriller' ?", options: ["Prince", "Michael Jackson", "Stevie Wonder", "Lionel Richie"], correctIndex: 1, category: "Musique" },
  { text: "Combien de pattes a une araignée ?", options: ["6", "8", "10", "12"], correctIndex: 1, category: "Science" },
  { text: "Dans quelle ville se trouve le Colisée ?", options: ["Athènes", "Rome", "Naples", "Florence"], correctIndex: 1, category: "Géographie" },
  { text: "Quel est le prénom du père Noël en anglais ?", options: ["Nicholas", "Christopher", "Santa", "Rudolf"], correctIndex: 2, category: "Noël" },
  { text: "Combien de rennes tirent le traîneau du Père Noël (sans Rudolph) ?", options: ["6", "7", "8", "9"], correctIndex: 2, category: "Noël" },
  { text: "Dans quel pays est née la tradition du sapin de Noël ?", options: ["France", "Angleterre", "Allemagne", "Suède"], correctIndex: 2, category: "Noël" },
  { text: "Quel est le nom du bonhomme de neige dans 'La Reine des Neiges' ?", options: ["Oscar", "Oliver", "Olaf", "Otto"], correctIndex: 2, category: "Cinéma" },
  { text: "Quel superhéros est aussi connu sous le nom de Bruce Wayne ?", options: ["Superman", "Spider-Man", "Batman", "Iron Man"], correctIndex: 2, category: "Cinéma" },
  { text: "Quelle est la langue la plus parlée dans le monde ?", options: ["Anglais", "Espagnol", "Mandarin", "Hindi"], correctIndex: 2, category: "Culture générale" },
  { text: "Combien de touches possède un piano standard ?", options: ["76", "82", "88", "92"], correctIndex: 2, category: "Musique" },
  { text: "Quel animal peut dormir debout ?", options: ["Vache", "Cheval", "Mouton", "Cochon"], correctIndex: 1, category: "Science" },
]

// Questions blindtest demo
const blindtestQuestions = [
  {
    text: "Quel est le titre de cette chanson ?",
    options: ["Take On Me", "Livin' on a Prayer", "Never Gonna Give You Up", "Sweet Dreams"],
    correctIndex: 2,
    category: "Blindtest",
    youtubeVideoId: "dQw4w9WgXcQ",
    audioStartTime: 43,
    audioEndTime: 58,
    songTitle: "Never Gonna Give You Up",
    songArtist: "Rick Astley",
  },
  {
    text: "Quel est le titre de cette chanson ?",
    options: ["Billie Jean", "Beat It", "Thriller", "Smooth Criminal"],
    correctIndex: 2,
    category: "Blindtest",
    youtubeVideoId: "sOnqjkJTMaA",
    audioStartTime: 45,
    audioEndTime: 60,
    songTitle: "Thriller",
    songArtist: "Michael Jackson",
  },
  {
    text: "Quel est le titre de cette chanson ?",
    options: ["I Will Survive", "Dancing Queen", "Stayin' Alive", "YMCA"],
    correctIndex: 2,
    category: "Blindtest",
    youtubeVideoId: "I_izvAbhExY",
    audioStartTime: 30,
    audioEndTime: 45,
    songTitle: "Stayin' Alive",
    songArtist: "Bee Gees",
  },
  {
    text: "Quel est le titre de cette chanson ?",
    options: ["Don't Stop Believin'", "Livin' on a Prayer", "Eye of the Tiger", "We Will Rock You"],
    correctIndex: 1,
    category: "Blindtest",
    youtubeVideoId: "lDK9QqIzhwk",
    audioStartTime: 60,
    audioEndTime: 75,
    songTitle: "Livin' on a Prayer",
    songArtist: "Bon Jovi",
  },
  {
    text: "Quel est le titre de cette chanson ?",
    options: ["All I Want for Christmas Is You", "Last Christmas", "Jingle Bell Rock", "Santa Claus Is Coming to Town"],
    correctIndex: 0,
    category: "Noël",
    youtubeVideoId: "yXQViqx6GMY",
    audioStartTime: 15,
    audioEndTime: 30,
    songTitle: "All I Want for Christmas Is You",
    songArtist: "Mariah Carey",
  },
]

async function main() {
  console.log('Seeding database...')

  // Supprimer les questions existantes
  await prisma.questionBank.deleteMany()

  // Ajouter les questions quiz
  for (const q of quizQuestions) {
    await prisma.questionBank.create({
      data: {
        type: QuestionType.QUIZ,
        text: q.text,
        options: q.options,
        correctIndex: q.correctIndex,
        category: q.category,
      },
    })
  }
  console.log(`✓ ${quizQuestions.length} questions QUIZ ajoutées`)

  // Ajouter les questions blindtest
  for (const q of blindtestQuestions) {
    await prisma.questionBank.create({
      data: {
        type: QuestionType.BLINDTEST,
        text: q.text,
        options: q.options,
        correctIndex: q.correctIndex,
        category: q.category,
        youtubeVideoId: q.youtubeVideoId,
        audioStartTime: q.audioStartTime,
        audioEndTime: q.audioEndTime,
        songTitle: q.songTitle,
        songArtist: q.songArtist,
      },
    })
  }
  console.log(`✓ ${blindtestQuestions.length} questions BLINDTEST ajoutées`)

  console.log('Seed terminé!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
