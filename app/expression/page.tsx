"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Volume2, VolumeX, InfinityIcon, PlayCircle } from "lucide-react"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Tableau de correspondance entre lettres et chiffres en numérologie
const letterToNumber: Record<string, number> = {
  A: 1,
  B: 2,
  C: 3,
  D: 4,
  E: 5,
  F: 6,
  G: 7,
  H: 8,
  I: 9,
  J: 1,
  K: 2,
  L: 3,
  M: 4,
  N: 5,
  O: 6,
  P: 7,
  Q: 8,
  R: 9,
  S: 1,
  T: 2,
  U: 3,
  V: 4,
  W: 5,
  X: 6,
  Y: 7,
  Z: 8,
}

// Fonction pour calculer le nombre d'expression avec étapes détaillées
const calculerNombreExpression = (
  nomComplet: string,
): {
  lettres: string[]
  chiffres: number[]
  somme: number
  chiffresFinal: number[]
  resultatFinal: number
  etapesEquation: { valeur: string | number; type: "chiffre" | "operateur" | "resultat" }[]
  etapesReduction?: { valeur: string | number; type: "chiffre" | "operateur" | "resultat" }[]
} => {
  // Normaliser le nom (majuscules, sans accents)
  const nomNormalise = nomComplet
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

  // Convertir chaque lettre en chiffre, ignorer les espaces et caractères non alphabétiques
  const lettres: string[] = []
  const chiffres: number[] = []

  for (const char of nomNormalise) {
    if (/[A-Z]/.test(char)) {
      lettres.push(char)
      chiffres.push(letterToNumber[char] || 0)
    } else if (char === " ") {
      // Ajouter un espace visible dans l'affichage
      lettres.push(" ")
      chiffres.push(0) // Valeur 0 pour les espaces
    }
  }

  // Filtrer les chiffres non-nuls pour l'équation (ignorer les espaces)
  const chiffresValides = chiffres.filter((c) => c !== 0)

  // Créer les étapes détaillées de l'équation
  const etapesEquation: { valeur: string | number; type: "chiffre" | "operateur" | "resultat" }[] = []

  // Ajouter chaque chiffre et opérateur
  chiffresValides.forEach((chiffre, index) => {
    // Ajouter le chiffre
    etapesEquation.push({ valeur: chiffre, type: "chiffre" })

    // Ajouter l'opérateur + si ce n'est pas le dernier chiffre
    if (index < chiffresValides.length - 1) {
      etapesEquation.push({ valeur: "+", type: "operateur" })
    }
  })

  // Calculer la somme
  const somme = chiffresValides.reduce((acc, val) => acc + val, 0)

  // Ajouter le signe égal et le résultat
  etapesEquation.push({ valeur: "=", type: "operateur" })
  etapesEquation.push({ valeur: somme, type: "resultat" })

  // Réduire à un chiffre (sauf pour les nombres maîtres 11, 22, 33)
  let resultatFinal = somme
  const chiffresFinal = somme.toString().split("").map(Number)
  let etapesReduction: { valeur: string | number; type: "chiffre" | "operateur" | "resultat" }[] | undefined = undefined

  if (somme > 9 && somme !== 11 && somme !== 22 && somme !== 33) {
    // Créer les étapes détaillées de la réduction
    etapesReduction = []

    // Ajouter chaque chiffre et opérateur pour la réduction
    chiffresFinal.forEach((chiffre, index) => {
      // Ajouter le chiffre
      etapesReduction.push({ valeur: chiffre, type: "chiffre" })

      // Ajouter l'opérateur + si ce n'est pas le dernier chiffre
      if (index < chiffresFinal.length - 1) {
        etapesReduction.push({ valeur: "+", type: "operateur" })
      }
    })

    // Réduction numérique
    resultatFinal = chiffresFinal.reduce((acc, val) => acc + val, 0)

    // Ajouter le signe égal et le résultat final
    etapesReduction.push({ valeur: "=", type: "operateur" })
    etapesReduction.push({ valeur: resultatFinal, type: "resultat" })

    // Si le résultat est encore > 9 et n'est pas un nombre maître, continuer la réduction
    if (resultatFinal > 9 && resultatFinal !== 11 && resultatFinal !== 22 && resultatFinal !== 33) {
      const chiffresFinaux = resultatFinal.toString().split("").map(Number)
      const sommeFinale = chiffresFinaux.reduce((acc, val) => acc + val, 0)

      // Ajouter une seconde réduction si nécessaire
      etapesReduction.push({ valeur: "→", type: "operateur" })
      chiffresFinaux.forEach((chiffre, index) => {
        etapesReduction.push({ valeur: chiffre, type: "chiffre" })
        if (index < chiffresFinaux.length - 1) {
          etapesReduction.push({ valeur: "+", type: "operateur" })
        }
      })
      etapesReduction.push({ valeur: "=", type: "operateur" })
      etapesReduction.push({ valeur: sommeFinale, type: "resultat" })

      resultatFinal = sommeFinale
    }
  }

  return { lettres, chiffres, somme, chiffresFinal, resultatFinal, etapesEquation, etapesReduction }
}

// Fonction pour générer le texte de narration
const genererTexteNarration = (prenom: string, resultatFinal: number) => {
  return `Ravi de vous revoir ${prenom} ! 

Je suis heureuse que vous ayez décidé de rester et de découvrir votre lecture personnalisée de votre Nombre d'Expression, basée sur votre prénom et nom de naissance. 

Comme vous allez le voir dans un instant, votre Nombre d'Expression, aussi appelé Nombre du Destin, est l'un des éléments les plus révélateurs de votre profil numérologique.

Contrairement à votre au Chemin de Vie, qui révèle la direction qui vous apportera le plus d'épanouissement et les grandes leçons que vous êtes venu apprendre, votre Nombre d'Expression dresse un portrait précis et puissant de qui vous êtes et de l'impact unique que vous avez sur le monde.
Il dévoile les dons innés avec lesquels vous êtes né et prédit votre potentiel ultime.

Votre Nombre d'Expression est calculé en additionnant tous les chiffres correspondant aux lettres de votre prénom et nom de naissance, selon l'alphabet pythagoricien.

Ce calcul peut être fastidieux à faire manuellement, alors je me suis chargé de le réaliser pour vous.

Votre Nombre d'Expression ${prenom} est ${resultatFinal}.

Après avoir mieux compris votre personnalité, cela ne me surprend pas du tout. Le ${resultatFinal} est un nombre maître, symbole d'inspiration et d'intuition. 

Vous êtes un visionnaire, capable d'anticiper l'issue d'une situation avant même qu'elle ne se produise. 

Cela fait de vous une personne hautement créative, qui pense toujours hors des sentiers battus.

Vous avez sans doute remarqué que l'échec ne frappe à votre porte que lorsque votre créativité est bridée. 

Libre d'esprit par nature, vous suivez souvent votre cœur dans votre prise de décision. 

Votre plus grand atout est votre intuition, que vous utilisez pour inspirer et motiver les autres. 

Cette perspective unique et cette capacité à vous exprimer librement sont les clés de votre succès, alors continuez ainsi.

Votre forte personnalité et votre individualité marquée peuvent parfois être difficiles à comprendre pour les autres. 

Cela peut compliquer certaines relations ou collaborations difficiles, mais vous êtes toujours prêt à apprendre de votre entourage, même de ceux qui vous semblent conformistes. 

Cette ouverture d'esprit vous vaut respect et admiration de la part de vos proches.

Continuez à être le visionnaire inspirant que vous êtes, tout en acceptant que d'autres puissent voir les choses différemment. 

Cette harmonie favorisera la créativité autour de vous et renforcera votre connexion aux autres, votre épanouissement et votre succès dans tous les domaines de votre vie.

Passons maintenant à votre Nombre de l'Âme.

Aussi appelé Nombre Intime, il représente votre essence intérieure. 

Il met en lumière vos motivations cachées, vos désirs les plus profonds, vos préférences et vos aversions. Il révèle les intentions réelles derrière la plupart de vos choix et décisions.

Dans un instant, vous découvrirez votre Nombre de l'Âme ainsi que sa signification. 

Mais pour que cette lecture soit aussi personnalisée et précise que possible par rapport à votre situation actuelle, j'ai besoin de quelques informations supplémentaires.

Veuillez les saisir ci-dessus. Vous verrez également que nous vous demandons votre adresse e-mail. 

Cela nous permettra de vous envoyer votre rapport de votre lecture personnalisée, afin que vous puissiez vous y référer à tout moment. 

En saisissant votre adresse e-mail, vous rejoindrez aussi notre communauté spirituelle, et recevrez des mises à jour, des invitations spéciales et du contenu exclusif rédigé par nos experts.

Cette étape est totalement facultative, mais nous serions ravis de vous compter parmi nous et de vous faire profiter des surprises que nous avons préparées pour vous.

Une fois vos informations vérifiées, cliquez sur "Continuer ma lecture gratuite" pour plonger encore plus profondément dans votre profil numérologique.`
}

// Fonction pour diviser le texte en segments pour la narration
const diviserTexteEnSegments = (texte: string) => {
  // Points de transition pour les animations
  const transitions = {
    debutCalcul: "Contrairement à votre au Chemin de Vie",
    finCalcul: "Après avoir mieux compris votre personnalité",
    nombreAme: "Passons maintenant à votre Nombre de l'Âme",
    formulaireAme: "Veuillez les saisir ci-dessus. Vous verrez également que nous vous demandons votre adresse e-mail.",
  }

  // Diviser le texte en paragraphes
  const paragraphes = texte.split("\n\n")

  // Créer les segments avec les marqueurs de transition
  const segments = paragraphes.map((paragraphe) => {
    const estDebutCalcul = paragraphe.includes(transitions.debutCalcul)
    const estFinCalcul = paragraphe.includes(transitions.finCalcul)
    const estNombreAme = paragraphe.includes(transitions.nombreAme)
    const estFormulaireAme = paragraphe.includes(transitions.formulaireAme)

    return {
      texte: paragraphe,
      debutCalcul: estDebutCalcul,
      finCalcul: estFinCalcul,
      nombreAme: estNombreAme,
      formulaireAme: estFormulaireAme,
    }
  })

  return segments
}

// Fonction pour diviser un texte en sous-titres courts (2 lignes max)
const diviserTexteSousTitresCourts = (texte: string): string[] => {
  // Définir une longueur maximale approximative pour 2 lignes
  const longueurMaxSousTitre = 120

  // Si le texte est déjà assez court, le retourner tel quel
  if (texte.length <= longueurMaxSousTitre) {
    return [texte]
  }

  // Tableau pour stocker les sous-titres
  const sousTitres: string[] = []

  // Diviser aux points, points d'exclamation et points d'interrogation d'abord
  const phrases = texte.split(/(?<=[.!?])\s+/)

  let sousTitreActuel = ""

  for (const phrase of phrases) {
    // Si la phrase est déjà trop longue, la diviser aux virgules
    if (phrase.length > longueurMaxSousTitre) {
      // Si le sous-titre actuel n'est pas vide, l'ajouter
      if (sousTitreActuel) {
        sousTitres.push(sousTitreActuel)
        sousTitreActuel = ""
      }

      // Diviser aux virgules
      const sousPhrases = phrase.split(/(?<=,)\s+/)

      for (const sousPhrase of sousPhrases) {
        if ((sousTitreActuel + sousPhrase).length <= longueurMaxSousTitre) {
          sousTitreActuel += (sousTitreActuel ? " " : "") + sousPhrase
        } else {
          // Si le sous-titre actuel n'est pas vide, l'ajouter
          if (sousTitreActuel) {
            sousTitres.push(sousTitreActuel)
          }

          // Si la sous-phrase est encore trop longue, diviser aux espaces
          if (sousPhrase.length > longueurMaxSousTitre) {
            const mots = sousPhrase.split(/\s+/)
            sousTitreActuel = ""

            for (const mot of mots) {
              if ((sousTitreActuel + mot).length <= longueurMaxSousTitre) {
                sousTitreActuel += (sousTitreActuel ? " " : "") + mot
              } else {
                sousTitres.push(sousTitreActuel)
                sousTitreActuel = mot
              }
            }
          } else {
            sousTitreActuel = sousPhrase
          }
        }
      }
    } else if ((sousTitreActuel + phrase).length <= longueurMaxSousTitre) {
      // Si l'ajout de la phrase ne dépasse pas la longueur max
      sousTitreActuel += (sousTitreActuel ? " " : "") + phrase
    } else {
      // Si l'ajout de la phrase dépasse la longueur max
      sousTitres.push(sousTitreActuel)
      sousTitreActuel = phrase
    }
  }

  // Ajouter le dernier sous-titre s'il n'est pas vide
  if (sousTitreActuel) {
    sousTitres.push(sousTitreActuel)
  }

  return sousTitres
}

// Interface pour les informations de synchronisation des sous-titres
interface SousTitreInfo {
  texte: string
  debut: number // Temps de début en secondes
  fin: number // Temps de fin en secondes
}

export default function ExpressionPage() {
  // Récupération des paramètres
  const searchParams = useSearchParams()
  const prenom = searchParams.get("prenom") || ""

  // Sauvegarder le prénom pour les autres pages
  useEffect(() => {
    if (prenom) {
      localStorage.setItem("userPrenom", prenom)
      localStorage.setItem("prenom", prenom)
    }
  }, [prenom])

  const nomComplet = searchParams.get("nomComplet") || ""

  // Combiner prénom et nom complet pour le calcul
  const nomCompletEntier = `${prenom} ${nomComplet}`.trim()
  const { lettres, chiffres, somme, chiffresFinal, resultatFinal, etapesEquation, etapesReduction } =
    calculerNombreExpression(nomCompletEntier)

  // Générer le texte de narration
  const texteNarration = genererTexteNarration(prenom, resultatFinal)
  const segmentsNarration = diviserTexteEnSegments(texteNarration)

  // États
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isMuted, setIsMuted] = useState(false)
  const [backgroundAudio, setBackgroundAudio] = useState<HTMLAudioElement | null>(null)
  const [showCircle, setShowCircle] = useState(true)
  const [showTable, setShowTable] = useState(false)
  const [etapeAnimation, setEtapeAnimation] = useState(0)
  const [showFinalResult, setShowFinalResult] = useState(false)
  const [currentSegment, setCurrentSegment] = useState(0)
  const [narrationStarted, setNarrationStarted] = useState(false)
  const [sousTitres, setSousTitres] = useState<string[]>([])
  const [currentSousTitreIndex, setCurrentSousTitreIndex] = useState(0)
  const [animationComplete, setAnimationComplete] = useState(false)
  const [waitingForAnimationToComplete, setWaitingForAnimationToComplete] = useState(false)
  // États pour contrôler l'affichage des images
  const [showNumberInCircle, setShowNumberInCircle] = useState(false)
  const [showNombreAmeImage, setShowNombreAmeImage] = useState(false)
  const [showAmeForm, setShowAmeForm] = useState(false)
  const [emailAme, setEmailAme] = useState("")
  const [statutMarital, setStatutMarital] = useState("")

  // Références
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const sousTitresInfoRef = useRef<SousTitreInfo[]>([])
  const sousTitreIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)

  // Générer les lettres flottantes (toutes les lettres de l'alphabet)
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

  const [leftLetters] = useState(() =>
    Array.from({ length: 25 }, () => {
      const randomIndex = Math.floor(Math.random() * alphabet.length)
      const letter = alphabet[randomIndex]
      return {
        value: letter,
        size: Math.random() * 0.7 + 0.3,
        top: Math.random() * 90 + 5,
        left: Math.random() * 25 + 2,
        duration: Math.random() * 15 + 10,
        delay: Math.random() * 5,
      }
    }),
  )

  const [rightLetters] = useState(() =>
    Array.from({ length: 25 }, () => {
      const randomIndex = Math.floor(Math.random() * alphabet.length)
      const letter = alphabet[randomIndex]
      return {
        value: letter,
        size: Math.random() * 0.7 + 0.3,
        top: Math.random() * 90 + 5,
        right: Math.random() * 25 + 2,
        duration: Math.random() * 15 + 10,
        delay: Math.random() * 5,
      }
    }),
  )

  // Générer les chiffres flottants
  const [leftNumbers] = useState(() =>
    Array.from({ length: 15 }, () => ({
      value: Math.floor(Math.random() * 9) + 1,
      size: Math.random() * 0.7 + 0.3,
      top: Math.random() * 90 + 5,
      left: Math.random() * 15 + 2,
      duration: Math.random() * 15 + 10,
      delay: Math.random() * 5,
    })),
  )

  const [rightNumbers] = useState(() =>
    Array.from({ length: 15 }, () => ({
      value: Math.floor(Math.random() * 9) + 1,
      size: Math.random() * 0.7 + 0.3,
      top: Math.random() * 90 + 5,
      right: Math.random() * 15 + 2,
      duration: Math.random() * 15 + 10,
      delay: Math.random() * 5,
    })),
  )

  // Initialisation
  useEffect(() => {
    setMounted(true)

    // Animation de chargement très courte
    setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    // Initialiser l'audio de fond
    const audio = new Audio("https://sonback.blob.core.windows.net/son12/background-sound-low-gain (mp3cut.net).mp3")
    audio.loop = true
    audio.volume = 0.8
    setBackgroundAudio(audio)

    // Vérifier si l'utilisateur a déjà interagi avec le site
    const hasInteracted = localStorage.getItem("userInteracted") === "true"
    if (hasInteracted) {
      // Essayer de jouer l'audio après un court délai
      setTimeout(() => {
        audio.play().catch((err) => {
          console.error("Erreur lors de la lecture de l'audio de fond:", err)
        })
      }, 500)
    }

    // Nettoyage lors du démontage du composant
    return () => {
      if (audio) {
        audio.pause()
        audio.src = ""
      }
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
      if (sousTitreIntervalRef.current) {
        clearInterval(sousTitreIntervalRef.current)
      }
    }
  }, [])

  // Fonction pour mettre à jour le sous-titre en fonction du temps actuel de l'audio
  const updateSousTitre = () => {
    if (!currentAudioRef.current || sousTitresInfoRef.current.length === 0) return

    const currentTime = currentAudioRef.current.currentTime

    // Trouver le sous-titre correspondant au temps actuel
    for (let i = 0; i < sousTitresInfoRef.current.length; i++) {
      const sousTitreInfo = sousTitresInfoRef.current[i]
      if (currentTime >= sousTitreInfo.debut && currentTime < sousTitreInfo.fin) {
        if (i !== currentSousTitreIndex) {
          setCurrentSousTitreIndex(i)
          setSousTitres([sousTitreInfo.texte])
        }
        return
      }
    }
  }

  // Fonction pour préparer les informations de synchronisation des sous-titres
  const prepareSousTitresInfo = (texte: string, dureeAudio: number): SousTitreInfo[] => {
    const sousTitres = diviserTexteSousTitresCourts(texte)
    const sousTitresInfo: SousTitreInfo[] = []

    // Calculer la durée approximative de chaque sous-titre en fonction de sa longueur
    const totalChars = texte.length
    const durationPerChar = dureeAudio / totalChars

    let charCount = 0
    for (let i = 0; i < sousTitres.length; i++) {
      const debut = charCount * durationPerChar
      charCount += sousTitres[i].length
      const fin = i === sousTitres.length - 1 ? dureeAudio : charCount * durationPerChar

      sousTitresInfo.push({
        texte: sousTitres[i],
        debut,
        fin,
      })
    }

    return sousTitresInfo
  }

  const handleAmeSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Stocker les informations si nécessaire
    if (emailAme) {
      localStorage.setItem("userEmail", emailAme)
    }
    if (statutMarital) {
      localStorage.setItem("userStatut", statutMarital)
    }

    // Rediriger vers la page du nombre de l'âme
    const params = new URLSearchParams()
    if (emailAme) params.append("email", emailAme)
    if (statutMarital) params.append("statut", statutMarital)

    // Utiliser window.location pour une redirection immédiate
    window.location.href = `/ame-resultat?${params.toString()}`
  }

  // Remplacer la fonction startNarration par cette version améliorée qui synchronise les sous-titres
  const startNarration = async () => {
    if (narrationStarted) return

    setNarrationStarted(true)

    try {
      // Baisser le volume de la musique de fond pendant la narration
      if (backgroundAudio) {
        backgroundAudio.volume = 0.4
      }

      console.log("Démarrage de la narration avec", segmentsNarration.length, "segments")

      // Précharger tous les segments audio à l'avance
      const audioSegments = await Promise.all(
        segmentsNarration.map(async (segment, index) => {
          try {
            const audio = new Audio()
            audio.src = `/api/speech?text=${encodeURIComponent(segment.texte)}&t=${Date.now()}&segment=${index}`
            audio.volume = 0.8

            // Précharger l'audio
            audio.load()

            // Attendre que les métadonnées soient chargées pour obtenir la durée
            await new Promise<void>((resolve) => {
              const checkLoaded = () => {
                if (!isNaN(audio.duration)) {
                  resolve()
                } else {
                  setTimeout(checkLoaded, 100)
                }
              }

              audio.addEventListener("loadedmetadata", () => {
                resolve()
              })

              // Vérifier aussi périodiquement
              checkLoaded()
            })

            return {
              audio,
              segment,
              duration: audio.duration || segment.texte.length * 0.05, // Fallback si la durée n'est pas disponible
            }
          } catch (error) {
            console.error(`Erreur lors du préchargement du segment ${index}:`, error)
            return null
          }
        }),
      )

      // Filtrer les segments nuls (en cas d'erreur)
      const validAudioSegments = audioSegments.filter((segment) => segment !== null)

      // Jouer les segments en séquence avec un minimum de pause
      let index = 0

      const playSegment = async () => {
        if (index < validAudioSegments.length) {
          const currentSegment = validAudioSegments[index]
          if (!currentSegment) {
            index++
            playSegment()
            return
          }

          const { audio, segment, duration } = currentSegment

          // Nettoyer l'intervalle précédent s'il existe
          if (sousTitreIntervalRef.current) {
            clearInterval(sousTitreIntervalRef.current)
          }

          // Préparer les informations de synchronisation des sous-titres
          const sousTitresInfo = prepareSousTitresInfo(segment.texte, duration)
          sousTitresInfoRef.current = sousTitresInfo

          // Réinitialiser l'index du sous-titre actuel
          setCurrentSousTitreIndex(0)

          // Afficher le premier sous-titre
          if (sousTitresInfo.length > 0) {
            setSousTitres([sousTitresInfo[0].texte])
          }

          // Stocker l'audio actuel pour la synchronisation
          currentAudioRef.current = audio

          // Gérer les transitions d'affichage
          if (segment.debutCalcul) {
            setShowCircle(false)
            setShowTable(true)
            setEtapeAnimation(0)
            setShowFinalResult(false)
            setAnimationComplete(false)
          } else if (segment.finCalcul) {
            // Si l'animation est déjà terminée, passer au cercle
            if (animationComplete) {
              setShowTable(false)
              setShowCircle(true)
            } else {
              // Sinon, attendre que l'animation se termine
              setWaitingForAnimationToComplete(true)
            }
          } else if (segment.nombreAme) {
            // Quand on passe au Nombre de l'Âme, afficher l'image correspondante
            setShowNumberInCircle(false)
            setShowNombreAmeImage(true)
          } else if (segment.formulaireAme) {
            // Quand on arrive à la phrase clé, afficher le formulaire du Nombre de l'Âme
            setShowCircle(false)
            setShowTable(false)
            setShowAmeForm(true)
          }

          try {
            // Précharger le segment suivant pendant la lecture du segment actuel
            if (index < validAudioSegments.length - 1) {
              const nextSegment = validAudioSegments[index + 1]
              if (nextSegment) {
                nextSegment.audio.load()
              }
            }

            // Configurer l'intervalle pour mettre à jour les sous-titres
            sousTitreIntervalRef.current = setInterval(updateSousTitre, 50)

            // Configurer l'événement de fin
            audio.onended = () => {
              // Nettoyer l'intervalle
              if (sousTitreIntervalRef.current) {
                clearInterval(sousTitreIntervalRef.current)
              }

              // Passer au segment suivant
              index++
              setTimeout(playSegment, 50)
            }

            // Jouer l'audio actuel
            await audio.play().catch((error) => {
              console.error(`Erreur lors de la lecture audio:`, error)
              // En cas d'erreur, continuer avec le segment suivant
              if (sousTitreIntervalRef.current) {
                clearInterval(sousTitreIntervalRef.current)
              }
              index++
              playSegment()
            })

            // Ajouter un écouteur pour les mises à jour de temps
            audio.addEventListener("timeupdate", updateSousTitre)
          } catch (error) {
            console.error(`Erreur lors de la lecture du segment ${index}:`, error)
            // En cas d'erreur, passer au segment suivant
            if (sousTitreIntervalRef.current) {
              clearInterval(sousTitreIntervalRef.current)
            }
            index++
            setTimeout(playSegment, 100)
          }
        }
      }

      // Démarrer la lecture
      playSegment()
    } catch (error) {
      console.error("Erreur lors du démarrage de la narration:", error)
    }
  }

  // Animation du tableau
  useEffect(() => {
    if (!showTable) return

    // Calculer le nombre total d'étapes nécessaires
    // Lettres + équation complète + réduction si nécessaire
    const totalEtapesEquation = calculerNombreExpression(nomCompletEntier).etapesEquation.length
    const totalEtapesReduction = calculerNombreExpression(nomCompletEntier).etapesReduction?.length || 0

    // Nombre total d'étapes: lettres + équation + réduction + résultat final
    const maxEtapes = lettres.length + totalEtapesEquation + totalEtapesReduction + 1

    const timer = setTimeout(() => {
      if (etapeAnimation < maxEtapes) {
        setEtapeAnimation(etapeAnimation + 1)
      } else {
        // Animation terminée, afficher le résultat final
        setShowFinalResult(true)
        setAnimationComplete(true)

        // Si on attendait que l'animation se termine, passer au cercle
        if (waitingForAnimationToComplete) {
          setTimeout(() => {
            setShowTable(false)
            setShowCircle(true)

            // Après 5 secondes, afficher le chiffre dans le cercle
            setTimeout(() => {
              setShowNumberInCircle(true)
            }, 5000)

            setWaitingForAnimationToComplete(false)
          }, 5000) // Attendre 5 secondes pour montrer le résultat final avant de passer au cercle
        }
      }
    }, 400) // Accéléré à 400ms (au lieu de 800ms)

    return () => clearTimeout(timer)
  }, [etapeAnimation, showTable, lettres.length, nomCompletEntier, waitingForAnimationToComplete, animationComplete])

  // Démarrer la narration après le chargement
  useEffect(() => {
    if (!isLoading && mounted && !narrationStarted) {
      // Démarrer la narration après un court délai
      const timer = setTimeout(() => {
        startNarration()
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [isLoading, mounted, narrationStarted])

  // Gestion du son de fond
  const toggleMute = () => {
    if (backgroundAudio) {
      if (isMuted) {
        backgroundAudio.volume = 0.8
      } else {
        backgroundAudio.volume = 0
      }
      setIsMuted(!isMuted)
    }
  }

  // Animation de chargement/branding
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <div className="relative">
          {/* Logo animé */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, type: "spring" }}
            className="mb-8 flex items-center justify-center"
          >
            <InfinityIcon className="h-20 w-20 text-teal-400" />
            <motion.h1
              className="text-5xl font-bold text-white ml-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              Numérologie
            </motion.h1>
          </motion.div>

          {/* Cercle lumineux qui pulse */}
          <motion.div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(147, 51, 234, 0.5) 0%, rgba(147, 51, 234, 0) 70%)",
              zIndex: -1,
            }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />

          {/* Texte de chargement */}
          <motion.div
            className="mt-8 text-white text-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Préparation de votre analyse d'Expression...
          </motion.div>

          {/* Points de chargement animés */}
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

  if (!mounted) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">Chargement...</div>
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

      {/* Lettres flottantes à gauche */}
      {leftLetters.map((letter, idx) => (
        <motion.div
          key={`left-${idx}`}
          className="absolute text-white font-bold z-10"
          style={{
            top: `${letter.top}%`,
            left: `${letter.left}%`,
            fontSize: `${Math.floor(letter.size * 40)}px`,
            opacity: 0.7,
            textShadow: "0 0 5px rgba(255,255,255,0.7)",
            willChange: "transform",
          }}
          initial={{ opacity: 0 }}
          animate={{
            transform: ["translate(0px, 0px)", "translate(10px, 5px)", "translate(-5px, -10px)", "translate(0px, 0px)"],
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{
            duration: letter.duration,
            delay: letter.delay,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "loop",
            ease: "linear",
          }}
        >
          {letter.value}
        </motion.div>
      ))}

      {/* Lettres flottantes à droite */}
      {rightLetters.map((letter, idx) => (
        <motion.div
          key={`right-${idx}`}
          className="absolute text-white font-bold z-10"
          style={{
            top: `${letter.top}%`,
            right: `${letter.right}%`,
            fontSize: `${Math.floor(letter.size * 40)}px`,
            opacity: 0.7,
            textShadow: "0 0 5px rgba(255,255,255,0.7)",
            willChange: "transform",
          }}
          initial={{ opacity: 0 }}
          animate={{
            transform: ["translate(0px, 0px)", "translate(-10px, 5px)", "translate(5px, -10px)", "translate(0px, 0px)"],
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{
            duration: letter.duration,
            delay: letter.delay,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "loop",
            ease: "linear",
          }}
        >
          {letter.value}
        </motion.div>
      ))}

      {/* Contenu principal */}
      <div className="relative z-20 container mx-auto px-4 py-12 flex flex-col items-center min-h-screen">
        <header className="mb-8 flex items-center justify-between w-full max-w-3xl">
          <div className="flex items-center">
            <InfinityIcon className="h-8 w-8 text-teal-400 mr-2" />
            <h1 className="text-3xl font-bold text-white">Numérologie</h1>
          </div>
          <div className="flex gap-2">
            {/* Bouton pour couper/activer le son */}
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
        </header>

        {/* Titre personnalisé - caché quand le formulaire de l'âme est affiché */}
        {!showAmeForm && (
          <motion.h2
            className="text-3xl md:text-4xl font-bold text-white text-center mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            Analyse du Nombre d'Expression pour {prenom} {nomComplet && prenom !== nomComplet ? nomComplet : ""}
          </motion.h2>
        )}

        {/* Sous-titres de narration */}
        {sousTitres.length > 0 && !showAmeForm && (
          <motion.div
            className="fixed bottom-8 left-0 right-0 z-50 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div
              className="bg-black/80 text-white p-5 mx-auto max-w-4xl rounded-lg text-[26px] leading-relaxed"
              style={{
                textShadow: "0 1px 2px rgba(0,0,0,0.8)",
                boxShadow: "0 0 20px rgba(0,0,0,0.5)",
              }}
            >
              {sousTitres[0]}
            </div>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {/* Formulaire du Nombre de l'Âme */}
          {showAmeForm && (
            <motion.div
              className="w-full max-w-4xl"
              key="ame-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.8 }}
            >
              {/* Titre et sous-titre */}
              <div className="text-center mb-6 md:mb-10 w-full">
                <motion.h2
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="text-2xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-3 md:mb-4 px-2 md:px-4"
                >
                  Révélez votre Nombre de l'Âme et découvrez vos désirs profonds cachés
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="text-lg md:text-xl text-white max-w-3xl mx-auto px-2 md:px-4"
                >
                  Découvrez dès maintenant votre rapport personnalisé gratuit.
                </motion.p>
              </div>

              <div className="w-full max-w-3xl flex flex-col md:flex-row items-start justify-between gap-6 md:gap-8 mx-auto">
                {/* Formulaire */}
                <div className="w-full md:w-2/3 bg-black/60 backdrop-blur-md p-6 rounded-xl border border-teal-500/30">
                  <form onSubmit={handleAmeSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold mr-3">
                          1
                        </div>
                        <Label htmlFor="email" className="text-white text-lg">
                          Votre Email (facultatif)
                        </Label>
                      </div>
                      <Input
                        id="email"
                        type="email"
                        value={emailAme}
                        onChange={(e) => setEmailAme(e.target.value)}
                        placeholder="Entrez votre adresse email"
                        className="bg-teal-900/30 border-teal-500/50 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold mr-3">
                          2
                        </div>
                        <Label htmlFor="statut" className="text-white text-lg">
                          Votre Statut Marital
                        </Label>
                      </div>
                      <Select value={statutMarital} onValueChange={setStatutMarital} required>
                        <SelectTrigger className="bg-teal-900/30 border-teal-500/50 text-white">
                          <SelectValue placeholder="Sélectionnez votre statut" />
                        </SelectTrigger>
                        <SelectContent className="bg-indigo-900 border-teal-500/50 text-white">
                          <SelectItem value="celibataire">Célibataire</SelectItem>
                          <SelectItem value="en_couple">En couple</SelectItem>
                          <SelectItem value="marie">Marié(e)</SelectItem>
                          <SelectItem value="divorce">Divorcé(e)</SelectItem>
                          <SelectItem value="veuf">Veuf/Veuve</SelectItem>
                          <SelectItem value="autre">Autre</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="pt-4">
                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white py-6 h-auto text-lg font-medium"
                      >
                        OBTENIR VOTRE LECTURE D'ÂME GRATUITE
                      </Button>
                    </div>
                  </form>
                </div>

                {/* Encadré d'information */}
                <div className="w-full md:w-1/3 bg-black/60 backdrop-blur-md p-6 rounded-xl border border-teal-500/30">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-teal-600/80 flex items-center justify-center mb-4">
                      <PlayCircle className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">Nombre de l'Âme</h3>
                    <p className="text-gray-300 text-sm">
                      Découvrez vos motivations cachées, vos désirs les plus profonds et les intentions réelles derrière
                      vos choix et décisions. Le Nombre de l'Âme révèle votre essence intérieure.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Cercle avec l'image du nombre d'expression */}
          {showCircle && !showAmeForm && (
            <motion.div
              className="relative w-full max-w-3xl h-[500px] flex items-center justify-center"
              key="anneau"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.8, type: "spring" }}
            >
              {/* Bordure polygonale tournante */}
              <motion.div
                className="absolute w-[450px] h-[450px]"
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
                  const x = Math.cos(angle) * 225
                  const y = Math.sin(angle) * 225

                  return (
                    <motion.div
                      key={`polygon-${idx}`}
                      className="absolute"
                      style={{
                        width: "20px",
                        height: "20px",
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
              <div className="absolute w-[450px] h-[450px] rounded-full">
                {/* Contour lumineux blanc */}
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    border: "3px solid rgba(255, 255, 255, 0.95)",
                    boxShadow: "0 0 15px rgba(255, 255, 255, 0.8), inset 0 0 10px rgba(255, 255, 255, 0.5)",
                  }}
                ></div>

                {/* Image du nombre d'expression, nombre de l'âme ou chiffre */}
                <div className="absolute inset-[3px] rounded-full overflow-hidden">
                  {showNombreAmeImage ? (
                    <Image
                      src="/images/nombre-ame-main.jpeg"
                      alt="Nombre de l'Âme"
                      fill
                      className="object-cover"
                      priority
                    />
                  ) : showNumberInCircle ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <motion.div
                        className="text-[180px] font-bold text-white relative"
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
                        {resultatFinal}
                      </motion.div>
                    </div>
                  ) : (
                    <Image
                      src="/images/nombre-expression-cosmic.png"
                      alt="Nombre d'Expression"
                      fill
                      className="object-cover"
                      priority
                    />
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Tableau numérologique animé */}
          {showTable && !showAmeForm && (
            <motion.div
              className="w-full max-w-3xl flex flex-col items-center justify-center"
              key="tableau"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
            >
              {/* Tableau des lettres et chiffres */}
              <div className="flex flex-col items-center space-y-8 mb-8">
                {/* Conversion des lettres en chiffres - Animation progressive */}
                <div className="flex flex-wrap justify-center gap-1">
                  {lettres.map((lettre, index) =>
                    lettre === " " ? (
                      // Espace entre prénom et nom
                      <div key={`espace-${index}`} className="w-4"></div>
                    ) : (
                      <motion.div
                        key={`lettre-${index}`}
                        className="flex flex-col items-center"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{
                          opacity: index < etapeAnimation ? 1 : 0,
                          scale: index < etapeAnimation ? 1 : 0.8,
                        }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                      >
                        {/* Chiffre au-dessus */}
                        <motion.div
                          className="w-10 h-10 bg-white text-black flex items-center justify-center font-bold text-lg"
                          initial={{ y: -20, opacity: 0 }}
                          animate={{
                            y: index < etapeAnimation ? 0 : -20,
                            opacity: index < etapeAnimation ? 1 : 0,
                          }}
                          transition={{ duration: 0.3, delay: index * 0.1 + 0.1 }}
                        >
                          {chiffres[index]}
                        </motion.div>

                        {/* Lettre */}
                        <motion.div
                          className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 text-white flex items-center justify-center font-bold text-lg"
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{
                            scale: index < etapeAnimation ? 1 : 0.8,
                            opacity: index < etapeAnimation ? 1 : 0,
                          }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                          {lettre}
                        </motion.div>
                      </motion.div>
                    ),
                  )}
                </div>

                {/* Animation de l'addition des chiffres - étape par étape */}
                {etapeAnimation > lettres.length && (
                  <motion.div
                    className="flex flex-col items-center justify-center gap-3"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    {/* Affichage de l'équation avec animation séquentielle */}
                    <motion.div
                      className="text-2xl text-white flex flex-wrap justify-center items-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      {calculerNombreExpression(nomCompletEntier).etapesEquation.map((etape, idx) => {
                        // Déterminer si cette étape doit être visible
                        const etapeIndex = lettres.length + 1 + idx
                        const isVisible = etapeAnimation >= etapeIndex

                        return (
                          <motion.span
                            key={idx}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{
                              opacity: isVisible ? 1 : 0,
                              y: isVisible ? 0 : -10,
                            }}
                            transition={{
                              delay: isVisible ? 0.1 : 0,
                              duration: 0.3,
                            }}
                            className={`mx-1 ${
                              etape.type === "resultat"
                                ? "font-bold text-yellow-300 text-3xl"
                                : etape.type === "operateur"
                                  ? "text-teal-400"
                                  : "text-white"
                            }`}
                          >
                            {etape.valeur}
                          </motion.span>
                        )
                      })}
                    </motion.div>
                  </motion.div>
                )}

                {/* Réduction numérique étape par étape si nécessaire */}
                {etapeAnimation > lettres.length + calculerNombreExpression(nomCompletEntier).etapesEquation.length &&
                  calculerNombreExpression(nomCompletEntier).etapesReduction && (
                    <motion.div
                      className="flex flex-col items-center justify-center gap-3 mt-4"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.5 }}
                    >
                      <motion.div
                        className="text-2xl text-white flex justify-center items-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                      >
                        {calculerNombreExpression(nomCompletEntier).etapesReduction!.map((etape, idx) => {
                          // Déterminer si cette étape doit être visible
                          const baseIndex =
                            lettres.length + calculerNombreExpression(nomCompletEntier).etapesEquation.length
                          const etapeIndex = baseIndex + 1 + idx
                          const isVisible = etapeAnimation >= etapeIndex

                          return (
                            <motion.span
                              key={idx}
                              initial={{ opacity: 0, y: -10 }}
                              animate={{
                                opacity: isVisible ? 1 : 0,
                                y: isVisible ? 0 : -10,
                              }}
                              transition={{
                                delay: isVisible ? 0.1 : 0,
                                duration: 0.3,
                              }}
                              className={`mx-1 ${
                                etape.type === "resultat"
                                  ? "font-bold text-yellow-300 text-3xl"
                                  : etape.type === "operateur"
                                    ? "text-teal-400"
                                    : "text-white"
                              }`}
                            >
                              {etape.valeur}
                            </motion.span>
                          )
                        })}
                      </motion.div>
                    </motion.div>
                  )}
              </div>

              {/* Résultat final */}
              {showFinalResult && (
                <motion.div
                  className="mt-8"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: 0.8,
                    type: "spring",
                    stiffness: 120,
                    damping: 8,
                  }}
                >
                  <motion.div
                    className="relative"
                    animate={{
                      boxShadow: [
                        "0 0 20px rgba(20, 184, 166, 0.3)",
                        "0 0 40px rgba(20, 184, 166, 0.6)",
                        "0 0 20px rgba(20, 184, 166, 0.3)",
                      ],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Number.POSITIVE_INFINITY,
                      repeatType: "reverse",
                    }}
                  >
                    <div
                      className="text-8xl font-bold text-white bg-gradient-to-r from-teal-500 to-teal-600 px-12 py-8 rounded-lg"
                      style={{
                        textShadow: "0 0 20px rgba(255, 255, 255, 0.7), 0 0 40px rgba(255, 255, 255, 0.4)",
                      }}
                    >
                      {resultatFinal}
                    </div>
                    <motion.div
                      className="absolute -inset-2 rounded-xl"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0.4, 0.8, 0.4] }}
                      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                      style={{
                        background: "linear-gradient(45deg, rgba(20, 184, 166, 0.3), rgba(13, 148, 136, 0.3))",
                        filter: "blur(10px)",
                        zIndex: -1,
                      }}
                    />
                  </motion.div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}
