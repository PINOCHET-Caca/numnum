"use client"

import { useEffect, useState, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Volume2, VolumeX, InfinityIcon } from "lucide-react"
import Image from "next/image"
import { prenomsFeminins } from "@/utils/prenoms-feminins"
import { NumerologyTableAme } from "@/components/numerology-table-ame"

// Fonction pour diviser un texte en segments courts (2 lignes max) pour les sous-titres
const diviserEnSegmentsCourts = (texte: string): string[] => {
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
  // Pas d'état de chargement audio séparé
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

Alors, êtes-vous curieux de savoir ce que révèle votre nombre de l'âme ?`

  // Diviser le texte en segments courts (2 lignes max)
  const sousTitres = diviserEnSegmentsCourts(texteNarrationComplet)

  // Fonction pour préparer les informations de synchronisation des sous-titres
  const prepareSousTitresInfo = (dureeAudio: number): SousTitreInfo[] => {
    const sousTitresInfo: SousTitreInfo[] = []

    // Calculer la durée approximative de chaque sous-titre en fonction de sa longueur
    const totalChars = texteNarrationComplet.length
    const durationPerChar = dureeAudio / totalChars

    // Phrase clé qui marque le point où la synchronisation devient problématique
    const phraseCleSynchronisation = "et je pense que vous le serez aussi"
    const positionPhraseCleSynchronisation = texteNarrationComplet.indexOf(phraseCleSynchronisation)

    // Phrase après laquelle la synchronisation est bonne
    const phraseFinProbleme = "en lumière sur votre personnalité, vos motivations cachées et votre véritable but"
    const positionPhraseFinProbleme = texteNarrationComplet.indexOf(phraseFinProbleme) + phraseFinProbleme.length

    let charCount = 0
    for (let i = 0; i < sousTitres.length; i++) {
      // Trouver la position de ce sous-titre dans le texte complet
      const position = texteNarrationComplet.indexOf(sousTitres[i], charCount)
      if (position !== -1) {
        charCount = position
      }

      // Déterminer si ce sous-titre est avant, pendant ou après la section problématique
      const isBeforeProblemStart = charCount < positionPhraseCleSynchronisation
      const isInProblemSection = charCount >= positionPhraseCleSynchronisation && charCount < positionPhraseFinProbleme
      const isAfterProblemEnd = charCount >= positionPhraseFinProbleme

      // Calculer un décalage adapté à la position dans le texte
      let decalage = 0

      if (i === 0) {
        // Premier sous-titre (avec le prénom) - pas de décalage
        decalage = 0
      } else if (isBeforeProblemStart) {
        // Avant le début du problème - décalage minimal
        decalage = 0
      } else if (isInProblemSection) {
        // Dans la section problématique - décalage négatif plus important
        // Décalage fixe plus important pour toute la section problématique
        decalage = -1.2
      } else if (isAfterProblemEnd) {
        // Après la fin du problème - décalage léger
        decalage = -0.5
      }

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

    // Ajouter une anticipation plus importante pour la vérification
    const lookAheadTime = currentTime + 0.2 // Anticipation de 200ms

    // Trouver le sous-titre correspondant au temps actuel ou imminent
    for (let i = 0; i < sousTitresInfoRef.current.length; i++) {
      const sousTitreInfo = sousTitresInfoRef.current[i]
      if (
        (lookAheadTime >= sousTitreInfo.debut && lookAheadTime < sousTitreInfo.fin) ||
        (currentTime >= sousTitreInfo.debut && currentTime < sousTitreInfo.fin)
      ) {
        setSousTitreActuel(sousTitreInfo.texte)

        // Afficher le tableau quand on commence à parler du nombre de l'âme
        if (sousTitreInfo.texte.includes("Je vais commencer par examiner votre nombre de l'âme")) {
          setShowCircle(false)
          setShowTable(true)
          // Forcer le rendu du tableau avec une nouvelle clé et état forceRender
          setTableKey((prev) => prev + 1)
          setTableForceRender((prev) => !prev)
        }

        return
      }
    }
  }

  // Fonction pour charger et démarrer l'audio principal
  const loadAndPlayMainAudio = async () => {
    try {
      // Créer un nouvel élément audio
      const audio = new Audio()

      // Définir la priorité de chargement élevée
      audio.preload = "auto"

      // Définir la source avec le texte complet
      audio.src = `/api/speech?text=${encodeURIComponent(texteNarrationComplet)}&t=${Date.now()}&priority=high`

      // Stocker l'élément audio dans la référence
      mainAudioRef.current = audio

      // Commencer à jouer dès que possible, sans attendre le chargement complet
      const playPromise = audio.play().catch((e) => {
        console.error("Erreur lors de la lecture initiale:", e)
        // Réessayer après un court délai
        setTimeout(() => {
          audio.play().catch((err) => console.error("Erreur lors de la seconde tentative:", err))
        }, 300)
      })

      // Attendre que les métadonnées soient chargées en parallèle
      await new Promise<void>((resolve) => {
        audio.addEventListener("loadedmetadata", () => {
          console.log("Audio principal chargé, durée:", audio.duration)
          setAudioLoaded(true)
          resolve()
        })

        audio.addEventListener("error", (e) => {
          console.error("Erreur lors du chargement de l'audio principal:", e)
          resolve() // Résoudre quand même pour continuer
        })

        // Définir un timeout pour résoudre même si les métadonnées ne se chargent pas
        setTimeout(resolve, 3000)
      })

      // Préparer les informations de synchronisation des sous-titres
      if (!isNaN(audio.duration) && audio.duration > 0) {
        sousTitresInfoRef.current = prepareSousTitresInfo(audio.duration)
        console.log("Informations de sous-titres préparées:", sousTitresInfoRef.current)
      }

      // Configurer l'intervalle pour mettre à jour les sous-titres avec une fréquence élevée
      updateIntervalRef.current = setInterval(updateSousTitre, 5)

      // Configurer l'événement de fin
      audio.onended = () => {
        console.log("Audio principal terminé")
        if (updateIntervalRef.current) {
          clearInterval(updateIntervalRef.current)
        }
      }
    } catch (error) {
      console.error("Erreur lors du chargement ou de la lecture de l'audio principal:", error)
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
      // Essayer de jouer l'audio après un court délai
      setTimeout(() => {
        audio.play().catch((err) => {
          console.error("Erreur lors de la lecture de l'audio de fond:", err)
        })
      }, 100)
    }

    // Réduire le temps de chargement et démarrer l'audio immédiatement
    setTimeout(() => {
      setIsLoading(false)

      // Charger et démarrer l'audio principal immédiatement
      if (!audioStarted) {
        setAudioStarted(true)
        loadAndPlayMainAudio()
      }
    }, 500) // Réduit à 500ms au lieu de 1500ms

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

  // Gestion du son de fond
  const toggleMute = () => {
    if (backgroundAudio) {
      if (isMuted) {
        backgroundAudio.volume = 0.4
      } else {
        backgroundAudio.volume = 0
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
                console.log("Animation du tableau terminée, passage au cercle avec nombre")
                // Afficher le cercle avec le nombre après l'animation du tableau
                setShowNumberInCircle(true)
                setShowTable(false)
                setShowCircle(true)
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
                console.log("Animation du tableau terminée, passage au cercle avec nombre")
                setShowNumberInCircle(true)
                setShowTable(false)
                setShowCircle(true)
              }}
              delay={500}
            />
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
