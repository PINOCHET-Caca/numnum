"use client"

import { useEffect, useState, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Volume2, VolumeX, InfinityIcon } from "lucide-react"
import Image from "next/image"
import { prenomsFeminins } from "@/utils/prenoms-feminins"
import { NumerologyTableAme } from "@/components/numerology-table-ame"
import { VowelsAnimation } from "@/components/vowels-animation"

// Vérifier que la phrase clé est correctement incluse dans le texte de narration
// Remplacer la fonction diviserEnSegmentsCourts par cette version améliorée qui préserve les phrases importantes

const diviserEnSegmentsCourts = (texte: string): string[] => {
  // Phrases importantes à préserver intactes
  const phrasesImportantes = [
    "Vous êtes intuitif, puissant et pragmatique.",
    "Votre nombre de l'âme est 7, le nombre de la sagesse intérieure et de la spiritualité.",
  ]

  // Vérifier si une des phrases importantes est présente dans le texte
  for (const phrase of phrasesImportantes) {
    if (texte.includes(phrase)) {
      // Diviser le texte autour de cette phrase importante
      const parties = texte.split(phrase)

      // Traiter les parties avant et après la phrase importante
      const segmentsAvant = diviserPartieEnSegments(parties[0])
      const segmentsApres = parties.length > 1 ? diviserPartieEnSegments(parties[1]) : []

      // Combiner les segments avec la phrase importante préservée
      return [...segmentsAvant, phrase, ...segmentsApres]
    }
  }

  // Si aucune phrase importante n'est trouvée, utiliser la méthode standard
  return diviserPartieEnSegments(texte)
}

// Fonction auxiliaire pour diviser une partie du texte en segments
const diviserPartieEnSegments = (texte: string): string[] => {
  // Longueur maximale pour 2 lignes (environ 100 caractères)
  const longueurMax = 100

  // Tableau pour stocker les segments courts
  const segments: string[] = []

  // Diviser d'abord par les points, points d'exclamation et points d'interrogation
  const phrases = texte.split(/(?<=[.!?])\s+/)

  for (const phrase of phrases) {
    // Si la phrase est déjà assez courte, l'ajouter directement
    if (phrase.length <= longueurMax) {
      segments.push(phrase)
    } else {
      // Sinon, diviser aux virgules
      const partiesVirgule = phrase.split(/(?<=,)\s+/)

      let segmentActuel = ""

      for (const partie of partiesVirgule) {
        if ((segmentActuel + partie).length <= longueurMax) {
          segmentActuel += (segmentActuel ? " " : "") + partie
        } else {
          // Si le segment actuel n'est pas vide, l'ajouter
          if (segmentActuel) {
            segments.push(segmentActuel)
          }

          // Si la partie est encore trop longue, la diviser aux espaces
          if (partie.length > longueurMax) {
            const mots = partie.split(/\s+/)
            segmentActuel = ""

            for (const mot of mots) {
              if ((segmentActuel + mot).length <= longueurMax) {
                segmentActuel += (segmentActuel ? " " : "") + mot
              } else {
                segments.push(segmentActuel)
                segmentActuel = mot
              }
            }
          } else {
            segmentActuel = partie
          }
        }
      }

      // Ajouter le dernier segment s'il n'est pas vide
      if (segmentActuel) {
        segments.push(segmentActuel)
      }
    }
  }

  return segments
}

// Interface pour les informations de synchronisation des sous-titres
interface SousTitreInfo {
  texte: string
  debut: number
  fin: number
}

export default function AmeResultat() {
  const searchParams = useSearchParams()
  const prenom =
    searchParams.get("prenom") || localStorage.getItem("userPrenom") || localStorage.getItem("prenom") || "utilisateur"

  // État pour stocker et gérer le nom complet
  const [fullName, setFullName] = useState("")

  // Récupérer le nom complet depuis le localStorage lors du montage
  useEffect(() => {
    const storedFullName = localStorage.getItem("expressionNomComplet") || ""
    console.log("Nom complet récupéré:", storedFullName)

    // Construire le nom complet pour l'affichage (prénom + espace + nom)
    // S'assurer qu'il y a un espace entre le prénom et le nom
    let fullNameWithPrenom = ""

    if (storedFullName) {
      // Si le prénom est déjà inclus dans le nom complet stocké, utiliser directement le nom complet
      if (storedFullName.toLowerCase().includes(prenom.toLowerCase())) {
        fullNameWithPrenom = storedFullName
      } else {
        // Sinon, ajouter le prénom avec un espace
        fullNameWithPrenom = `${prenom} ${storedFullName}`
      }
    } else {
      fullNameWithPrenom = prenom
    }

    console.log("Nom complet avec prénom:", fullNameWithPrenom)
    setFullName(fullNameWithPrenom)
  }, [prenom])

  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [showCircle, setShowCircle] = useState(true)
  const [showNumberInCircle, setShowNumberInCircle] = useState(false)
  const [showTable, setShowTable] = useState(false)
  const [sousTitreActuel, setSousTitreActuel] = useState<string>("")
  const [isMuted, setIsMuted] = useState(false)
  const [backgroundAudio, setBackgroundAudio] = useState<HTMLAudioElement | null>(null)
  const [audioStarted, setAudioStarted] = useState(false)
  const [tableKey, setTableKey] = useState(0) // Clé pour forcer le rendu du tableau
  const [tableForceRender, setTableForceRender] = useState(false) // État pour forcer le rendu du tableau
  const [audioLoaded, setAudioLoaded] = useState(false)

  // Ajouter un nouvel état pour contrôler l'affichage de l'animation des voyelles
  const [showVowelsAnimation, setShowVowelsAnimation] = useState(false)

  // Références
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const mainAudioRef = useRef<HTMLAudioElement | null>(null)
  const sousTitresInfoRef = useRef<SousTitreInfo[]>([])
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Fonction pour déterminer si un prénom est masculin ou féminin
  const determinerGenre = (prenom: string): "masculin" | "feminin" => {
    const prenomNormalise = prenom
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")

    if (prenomsFeminins.includes(prenomNormalise)) {
      return "feminin"
    }
    return "masculin"
  }

  // Déterminer le genre de l'utilisateur
  const genreUtilisateur = determinerGenre(prenom)

  // Texte de narration complet
  const texteNarrationComplet = `${prenom}, j'ai réuni toutes les informations nécessaires pour compléter votre lecture de numérologie personnalisée, et comme vous l'aurez deviné : j'ai gardé le meilleur pour la fin.

Mais avant de commencer, je dois vous avertir.

Les informations que je vais partager avec vous sont incroyablement personnelles et pourraient bien vous surprendre.

La plupart des lecteurs sont choqués par la précision de ces révélations, et je pense que vous le serez aussi lorsque vous découvrirez les vérités intrigantes que j'ai mises en lumière sur votre personnalité, vos motivations cachées et votre véritable but.

Si vous choisissez d'écouter, faites-le avec un esprit ouvert, car ces révélations vous apporteront des réponses inestimables.

Je vais commencer par examiner votre nombre de l'âme.

Le nombre de l'âme, aussi appelée désir du cœur, révèle ce dont votre âme a besoin pour grandir et évoluer dans la vie et les relations.

Comme votre nombre d'expression, il est déterminé en attribuant des valeurs numériques aux lettres de votre nom de naissance complet selon l'alphabet pythagoricien.

Cependant, pour le nombre de l'âme, seules les voyelles sont prises en compte, et voici pourquoi.

Les consonnes sont prononcées avec des sons nets et distincts, ayant un début et une fin clairs. 

Elles représentent votre personnalité publique et les traits que vous partagez ouvertement avec le monde.

Les voyelles, en revanche, sont prononcées avec un souffle fluide et ont des sons plus doux.

Elles représentent votre véritable être, souvent caché, et révèlent vos désirs les plus profonds.

Vous ne saviez probablement même pas que vous les aviez.

Le célèbre médecin, traducteur et astrologue de la Renaissance, Marc Clio Pacino, a consacré une grande partie de sa vie à étudier les incroyables façons dont la vie d'une personne s'améliore lorsqu'elle suit les élans de son âme.

Les bienfaits qu'il a observés étaient indéniables.

Vous êtes intuitif, puissant et pragmatique.

Votre nombre de l'âme est 7, le nombre de la sagesse intérieure et de la spiritualité.

Ce nombre indique que vous avez une profonde vie intérieure et une forte intuition que vous utilisez pour naviguer dans le monde.

Vous êtes naturellement analytique et réfléchi, préférant comprendre les mécanismes cachés derrière les apparences.

Votre esprit est vif et perspicace, capable de percer à jour les illusions et de voir la vérité derrière les façades.

Cette capacité vous donne un avantage unique dans la vie, car vous pouvez anticiper les événements et comprendre les motivations des autres avant même qu'ils ne les expriment.

Cependant, cette profondeur peut parfois vous isoler, car peu de personnes partagent votre niveau de perception et d'introspection.

Vous avez besoin de temps seul pour recharger vos batteries et explorer vos pensées.

Ne considérez pas cela comme une faiblesse, mais plutôt comme une force qui vous permet de maintenir votre équilibre intérieur.

Votre âme aspire à la connaissance, à la vérité et à la compréhension profonde de l'univers et de votre place en son sein.

Vous êtes attiré par les mystères de la vie et les questions existentielles.

Cette quête de sens est au cœur de votre être et guide vos choix, même si vous n'en êtes pas toujours conscient.

Pour vous épanouir pleinement, il est essentiel que vous honoriez ce besoin d'exploration spirituelle et intellectuelle.

Lorsque vous suivez cette voie, vous découvrez une paix intérieure et une clarté qui illuminent tous les aspects de votre vie.`

  // Diviser le texte en segments courts (2 lignes max)
  const sousTitres = diviserEnSegmentsCourts(texteNarrationComplet)

  // Fonction pour préparer les informations de synchronisation des sous-titres
  const prepareSousTitresInfo = (dureeAudio: number): SousTitreInfo[] => {
    const sousTitresInfo: SousTitreInfo[] = []

    // Calculer la durée approximative de chaque sous-titre en fonction de sa longueur
    const totalChars = texteNarrationComplet.length
    const durationPerChar = dureeAudio / totalChars

    // Phrase clé après laquelle les sous-titres commencent à être en retard
    const phraseCleSynchronisation = "Vous êtes intuitif, puissant et pragmatique"
    const positionPhraseCleSynchronisation = texteNarrationComplet.indexOf(phraseCleSynchronisation)

    let charCount = 0
    for (let i = 0; i < sousTitres.length; i++) {
      // Trouver la position de ce sous-titre dans le texte complet
      const position = texteNarrationComplet.indexOf(sousTitres[i], charCount)
      if (position !== -1) {
        charCount = position
      }

      // Déterminer si ce sous-titre est après la phrase clé
      const isAfterProblemStart = charCount >= positionPhraseCleSynchronisation

      // Calculer un décalage adapté à la position dans le texte
      // Décalage plus important pour les sous-titres après la phrase clé
      const decalage = isAfterProblemStart ? -5.0 : 0

      // Calculer le début et la fin avec le décalage approprié
      const debut = Math.max(0, charCount * durationPerChar + decalage)
      charCount += sousTitres[i].length
      const fin = Math.min(dureeAudio, charCount * durationPerChar + decalage)

      sousTitresInfo.push({
        texte: sousTitres[i],
        debut,
        fin,
      })
    }

    return sousTitresInfo
  }

  // Fonction pour mettre à jour le sous-titre en fonction du temps actuel
  const updateSousTitre = () => {
    if (!mainAudioRef.current || sousTitresInfoRef.current.length === 0) return

    const currentTime = mainAudioRef.current.currentTime

    // Phrase spécifique à afficher à un moment précis
    const phraseSpecifique = "Vous êtes intuitif, puissant et pragmatique."

    // Vérifier si nous sommes dans la plage de temps où cette phrase devrait apparaître
    // Approximativement à 70% de la durée totale de l'audio
    if (mainAudioRef.current.duration > 0) {
      const tempsApproxPhraseSpecifique = mainAudioRef.current.duration * 0.7
      if (Math.abs(currentTime - tempsApproxPhraseSpecifique) < 5) {
        // Fenêtre de 5 secondes
        setSousTitreActuel(phraseSpecifique)

        // Afficher le cercle avec l'image du nombre de l'âme
        setShowVowelsAnimation(false)
        setShowCircle(true)
        setShowNumberInCircle(false)

        return
      }
    }

    // Ajouter une anticipation plus importante pour la vérification
    const lookAheadTime = currentTime + 1.2 // Anticipation de 1.2 secondes

    // Trouver le sous-titre correspondant au temps actuel ou imminent
    for (let i = 0; i < sousTitresInfoRef.current.length; i++) {
      const sousTitreInfo = sousTitresInfoRef.current[i]
      if (
        (lookAheadTime >= sousTitreInfo.debut && lookAheadTime < sousTitreInfo.fin) ||
        (currentTime >= sousTitreInfo.debut && currentTime < sousTitreInfo.fin)
      ) {
        // Ne pas écraser la phrase spécifique si elle est déjà affichée
        if (sousTitreActuel !== phraseSpecifique) {
          setSousTitreActuel(sousTitreInfo.texte)
        }

        // Afficher le tableau quand on commence à parler du nombre de l'âme
        if (sousTitreInfo.texte.includes("Je vais commencer par examiner votre nombre de l'âme")) {
          setShowCircle(false)
          setShowTable(true)
          // Forcer le rendu du tableau avec une nouvelle clé et état forceRender
          setTableKey((prev) => prev + 1)
          setTableForceRender((prev) => !prev)
        }

        // Afficher la nouvelle animation des voyelles quand on atteint la phrase spécifique
        if (sousTitreInfo.texte.includes("Les voyelles, en revanche, sont prononcées avec un souffle fluide")) {
          setShowTable(false)
          setShowCircle(false) // Cacher complètement le cercle
          setShowVowelsAnimation(true)
        }

        // Afficher le nombre 7 dans le cercle quand on mentionne le nombre de l'âme
        if (sousTitreInfo.texte.includes("Votre nombre de l'âme est 7")) {
          setShowNumberInCircle(true)
        }

        return
      }
    }
  }

  // Initialisation
  useEffect(() => {
    setMounted(true)

    // Initialiser l'audio de fond
    const audio = new Audio("https://sonback.blob.core.windows.net/son12/background-sound-low-gain (mp3cut.net).mp3")
    audio.loop = true
    audio.volume = 0.4
    setBackgroundAudio(audio)

    // Vérifier si l'utilisateur a déjà interagi avec le site
    const hasInteracted = localStorage.getItem("userInteracted") === "true"
    if (hasInteracted) {
      // Essayer de jouer l'audio immédiatement
      audio.play().catch((err) => {
        console.error("Erreur lors de la lecture de l'audio de fond:", err)
      })
    }

    // Animation de chargement très courte
    setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    // Nettoyage
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
      if (mainAudioRef.current) {
        mainAudioRef.current.pause()
        mainAudioRef.current = null
      }
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current)
      }
      if (audio) {
        audio.pause()
        audio.src = ""
      }
    }
  }, [])

  // Effet pour démarrer l'audio principal
  useEffect(() => {
    if (!isLoading && mounted && !audioStarted) {
      setAudioStarted(true)

      // Créer un nouvel élément audio
      const audio = new Audio()
      audio.src = `/api/speech?text=${encodeURIComponent(texteNarrationComplet)}`
      audio.volume = 0.8

      // Stocker l'élément audio dans la référence
      mainAudioRef.current = audio

      // Configurer l'événement de chargement
      audio.onloadedmetadata = () => {
        // Préparer les informations de synchronisation des sous-titres
        if (!isNaN(audio.duration) && audio.duration > 0) {
          sousTitresInfoRef.current = prepareSousTitresInfo(audio.duration)
        }
      }

      // Configurer l'intervalle pour mettre à jour les sous-titres
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current)
      }
      updateIntervalRef.current = setInterval(updateSousTitre, 50) // Mise à jour plus fréquente (50ms au lieu de 100ms)

      // Ajouter un écouteur pour les mises à jour de temps
      audio.addEventListener("timeupdate", updateSousTitre)

      // Configurer l'événement de fin
      audio.onended = () => {
        console.log("Audio principal terminé")
        if (updateIntervalRef.current) {
          clearInterval(updateIntervalRef.current)
        }
      }

      // Démarrer la lecture
      audio.play().catch((error) => {
        console.error("Erreur lors de la lecture audio:", error)
      })
    }
  }, [isLoading, mounted, audioStarted, texteNarrationComplet])

  // Effet pour forcer l'affichage de la phrase spécifique après un délai
  useEffect(() => {
    if (audioStarted && mainAudioRef.current) {
      // Forcer l'affichage de la phrase spécifique après 20 secondes
      const forceTimer = setTimeout(() => {
        // Vérifier si l'audio est toujours en cours de lecture
        if (mainAudioRef.current && !mainAudioRef.current.paused) {
          console.log("Forçage de l'affichage de la phrase spécifique")
          setSousTitreActuel("Vous êtes intuitif, puissant et pragmatique.")
          setShowVowelsAnimation(false)
          setShowCircle(true)
          setShowNumberInCircle(false)
        }
      }, 20000) // 20 secondes après le début de l'audio

      return () => clearTimeout(forceTimer)
    }
  }, [audioStarted])

  // Gestion du son de fond
  const toggleMute = () => {
    if (backgroundAudio) {
      if (isMuted) {
        backgroundAudio.volume = 0.4
        if (mainAudioRef.current) {
          mainAudioRef.current.volume = 0.8
        }
      } else {
        backgroundAudio.volume = 0
        if (mainAudioRef.current) {
          mainAudioRef.current.volume = 0
        }
      }
      setIsMuted(!isMuted)
    }
  }

  // Animation de chargement
  if (isLoading || !mounted) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <div className="relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, type: "spring" }}
            className="mb-8 flex items-center justify-center"
          >
            <InfinityIcon className="h-16 w-16 sm:h-20 sm:w-20 text-teal-400" />
            <motion.h1
              className="text-3xl sm:text-5xl font-bold text-white ml-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              Numérologie
            </motion.h1>
          </motion.div>

          <motion.div
            className="mt-8 text-white text-lg sm:text-xl text-center px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Préparation de votre analyse du Nombre de l'Âme...
          </motion.div>

          <div className="flex justify-center mt-4">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-3 h-3 mx-1 rounded-full bg-teal-400"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1,
                  repeat: Number.POSITIVE_INFINITY,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      {/* Image de fond */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/space-bg-mixed.jpg"
          alt="Fond spatial"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
      </div>

      {/* Overlay pour assurer la lisibilité */}
      <div className="absolute inset-0 bg-black/50 z-0"></div>

      {/* En-tête avec logo */}
      <div className="w-full bg-gradient-to-r from-indigo-900/80 to-purple-900/80 backdrop-blur-sm py-4 z-20">
        <div className="container mx-auto flex justify-center items-center">
          <InfinityIcon className="h-6 w-6 sm:h-8 sm:w-8 text-teal-400 mr-2" />
          <h1 className="text-xl sm:text-2xl font-bold text-white">Numérologie</h1>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="relative z-20 container mx-auto px-4 py-8 flex flex-col items-center">
        {/* Titre personnalisé */}
        <motion.h2
          className="text-2xl md:text-4xl font-bold text-white text-center mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          Analyse du Nombre de l'Âme pour {prenom}
        </motion.h2>

        {/* Bouton pour couper/activer le son */}
        <div className="mb-6">
          <Button
            variant="outline"
            size="sm"
            className="border-teal-500 text-teal-300"
            onClick={toggleMute}
            type="button"
          >
            {isMuted ? <VolumeX className="h-4 w-4 mr-2" /> : <Volume2 className="h-4 w-4 mr-2" />}
            {isMuted ? "Activer le son" : "Couper le son"}
          </Button>
        </div>

        {/* Tableau numérologique */}
        {showTable && fullName && (
          <motion.div
            className="w-full max-w-3xl flex flex-col items-center justify-center mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            key={`table-${tableKey}`} // Forcer le rendu avec une clé unique
          >
            <NumerologyTableAme
              name={fullName}
              forceRender={tableForceRender}
              onComplete={() => {
                console.log("Animation du tableau terminée, attente de la phrase clé")
                // Ne rien faire ici, attendre la phrase clé pour passer à l'animation des voyelles
              }}
              delay={500}
            />
          </motion.div>
        )}

        {/* Tableau numérologique avec caca issou si aucun nom complet n'est trouvé */}
        {showTable && !fullName && (
          <motion.div
            className="w-full max-w-3xl flex flex-col items-center justify-center mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            key={`table-${tableKey}`}
          >
            <NumerologyTableAme
              name="CACA ISSOU"
              forceRender={tableForceRender}
              onComplete={() => {
                console.log("Animation du tableau terminée, attente de la phrase clé")
                // Ne rien faire ici, attendre la phrase clé pour passer à l'animation des voyelles
              }}
              delay={500}
            />
          </motion.div>
        )}

        {/* Animation des voyelles */}
        {showVowelsAnimation && fullName && (
          <motion.div
            className="w-full max-w-3xl flex flex-col items-center justify-center mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <VowelsAnimation name={fullName} />
          </motion.div>
        )}

        {/* Cercle avec image */}
        {showCircle && (
          <motion.div
            className="relative w-full max-w-3xl h-[350px] sm:h-[500px] flex items-center justify-center mb-10"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, type: "spring" }}
          >
            {/* Bordure polygonale tournante */}
            <motion.div
              className="absolute w-[280px] h-[280px] sm:w-[450px] sm:h-[450px]"
              animate={{ rotate: 360 }}
              transition={{
                duration: 60,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
              }}
            >
              {/* Créer une bordure avec des triangles pointant vers l'extérieur */}
              {Array.from({ length: 24 }).map((_, idx) => {
                const angle = (idx * 15 * Math.PI) / 180
                const radius = window.innerWidth < 640 ? 140 : 225
                const x = Math.cos(angle) * radius
                const y = Math.sin(angle) * radius

                return (
                  <motion.div
                    key={`polygon-${idx}`}
                    className="absolute"
                    style={{
                      width: window.innerWidth < 640 ? "15px" : "20px",
                      height: window.innerWidth < 640 ? "15px" : "20px",
                      top: "50%",
                      left: "50%",
                      transform: `translate(${x}px, ${y}px) translate(-50%, -50%) rotate(${idx * 15 + 90}deg)`,
                      background: "rgba(255, 255, 255, 0.95)",
                      clipPath: "polygon(0 0, 100% 50%, 0 100%)",
                      boxShadow: "0 0 5px rgba(255, 255, 255, 0.7)",
                    }}
                  />
                )
              })}
            </motion.div>

            {/* Cercle principal avec contour lumineux */}
            <div className="absolute w-[280px] h-[280px] sm:w-[450px] sm:h-[450px] rounded-full">
              {/* Contour lumineux blanc */}
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  border: "3px solid rgba(255, 255, 255, 0.95)",
                  boxShadow: "0 0 15px rgba(255, 255, 255, 0.8), inset 0 0 10px rgba(255, 255, 255, 0.5)",
                }}
              ></div>

              {/* Image ou nombre */}
              <div className="absolute inset-[3px] rounded-full overflow-hidden">
                {showNumberInCircle ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <motion.div
                      className="text-[120px] sm:text-[180px] font-bold text-white relative"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 200,
                        damping: 10,
                        duration: 1,
                      }}
                      style={{
                        textShadow:
                          "0 0 30px rgba(255, 255, 255, 0.9), 0 0 60px rgba(255, 255, 255, 0.7), 0 0 90px rgba(255, 255, 255, 0.5)",
                      }}
                    >
                      {/* Effet de halo lumineux autour du chiffre */}
                      <div
                        className="absolute inset-0 rounded-full"
                        style={{
                          background:
                            "radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, rgba(20, 184, 166, 0.4) 40%, transparent 70%)",
                          filter: "blur(20px)",
                          transform: "scale(1.2)",
                          zIndex: -1,
                        }}
                      />
                      7
                    </motion.div>
                  </div>
                ) : (
                  <Image
                    src="/images/nombre-ame-main.jpeg"
                    alt="Nombre de l'Âme"
                    fill
                    className="object-cover"
                    priority
                  />
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Sous-titre actuel (pour le texte de la narration) */}
        {sousTitreActuel && (
          <motion.div
            className="fixed bottom-8 left-0 right-0 z-50 text-center px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div
              className="bg-black/80 text-white p-4 sm:p-5 mx-auto max-w-4xl rounded-lg text-lg sm:text-[26px] leading-relaxed"
              style={{
                textShadow: "0 1px 2px rgba(0,0,0,0.8)",
                boxShadow: "0 0 20px rgba(0,0,0,0.5)",
              }}
            >
              {sousTitreActuel}
            </div>
          </motion.div>
        )}
      </div>
    </main>
  )
}
