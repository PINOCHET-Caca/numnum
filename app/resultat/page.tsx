"use client"

import { useEffect, useState, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight, Volume2, VolumeX, InfinityIcon } from "lucide-react"
import Image from "next/image"
import { prenomsFeminins } from "@/utils/prenoms-feminins"
import { NumerologyTable } from "@/components/numerology-table"
import { ExpressionForm } from "@/components/expression-form"

// Types pour les segments de narration
interface NarrationSegment {
  id: number
  text: string
  duration: number
  image?: string
  imageAlt?: string
  audioUrl?: string // URL préchargée pour l'audio
}

// Enum pour les différentes images à afficher
enum CircleImage {
  None = 0,
  CheminDeVie = 1,
  NombreAnniversaire = 2,
  NombreAme = 3,
  NombreExpression = 4,
  NombrePersonnalite = 5,
}

// Enum pour les différents modes d'affichage
enum DisplayMode {
  Calculation = 0,
  Circle = 1,
  NumerologyTable = 2,
}

// Fonction améliorée pour diviser le texte en sous-titres de façon plus logique
const diviserTexteEnSousTitres = (texte: string): string[] => {
  // Augmenter la taille maximale pour éviter des coupures inutiles
  const caractèresMaxParSousTitre = 120

  // Liste des expressions à ne jamais couper (comme les URLs, domaines, etc.)
  const expressionsÀPréserver = ["lanumerologie.co"]

  // Protéger les expressions à préserver en les remplaçant temporairement
  let texteProtégé = texte
  const remplacements: Record<string, string> = {}

  expressionsÀPréserver.forEach((expr, index) => {
    const placeholder = `__EXPR_${index}__`
    remplacements[placeholder] = expr
    texteProtégé = texteProtégé.replace(new RegExp(expr, "g"), placeholder)
  })

  // Diviser d'abord aux points, points d'exclamation et points d'interrogation
  const séparateursPhrase = [". ", "! ", "? "]
  let phrases: string[] = [texteProtégé]

  séparateursPhrase.forEach((sep) => {
    const nouvellesPhases: string[] = []
    phrases.forEach((phrase) => {
      if (phrase.includes(sep)) {
        const parties = phrase.split(sep)
        for (let i = 0; i < parties.length; i++) {
          if (parties[i].trim()) {
            if (i < parties.length - 1) {
              nouvellesPhases.push(parties[i].trim() + sep.trim() + " ")
            } else if (phrase.endsWith(sep)) {
              nouvellesPhases.push(parties[i].trim() + sep.trim() + " ")
            } else {
              nouvellesPhases.push(parties[i].trim())
            }
          }
        }
      } else {
        nouvellesPhases.push(phrase)
      }
    })
    phrases = nouvellesPhases
  })

  // Diviser les phrases trop longues aux virgules
  const résultat: string[] = []

  phrases.forEach((phrase) => {
    if (phrase.length <= caractèresMaxParSousTitre) {
      résultat.push(phrase)
    } else {
      // Essayer de diviser aux virgules
      if (phrase.includes(", ")) {
        let partieActuelle = ""
        const partiesVirgule = phrase.split(", ")

        partiesVirgule.forEach((partie, index) => {
          const partieAvecVirgule = index < partiesVirgule.length - 1 ? partie + ", " : partie

          if ((partieActuelle + partieAvecVirgule).length <= caractèresMaxParSousTitre) {
            partieActuelle += partieAvecVirgule
          } else {
            if (partieActuelle) résultat.push(partieActuelle)
            partieActuelle = partieAvecVirgule
          }
        })

        if (partieActuelle) résultat.push(partieActuelle)
      } else {
        // Si pas de virgules, diviser aux espaces en respectant les mots
        let début = 0

        while (début < phrase.length) {
          let fin = Math.min(début + caractèresMaxParSousTitre, phrase.length)

          // Ne pas couper au milieu d'un mot
          if (fin < phrase.length && phrase[fin] !== " ") {
            const dernierEspace = phrase.lastIndexOf(" ", fin)
            if (dernierEspace > début) {
              fin = dernierEspace
            }
          }

          résultat.push(phrase.substring(début, fin).trim())
          début = fin
        }
      }
    }
  })

  // Restaurer les expressions protégées
  const sousTitresFinaux = résultat.map((st) => {
    let texteRestauré = st
    Object.entries(remplacements).forEach(([placeholder, original]) => {
      texteRestauré = texteRestauré.replace(new RegExp(placeholder, "g"), original)
    })
    return texteRestauré
  })

  return sousTitresFinaux
}

// Fonction pour calculer le chiffre de vie selon la numérologie
const calculerChiffreVie = (date: string) => {
  if (!date) return null

  const [annee, mois, jour] = date.split("-")

  // Conversion des chaînes en nombres
  const jourNum = Number.parseInt(jour)
  const moisNum = Number.parseInt(mois)
  const anneeNum = Number.parseInt(annee)

  // Réduction du jour
  const jourReduit = jourNum > 9 ? Math.floor(jourNum / 10) + (jourNum % 10) : jourNum

  // Réduction du mois
  const moisReduit = moisNum > 9 ? Math.floor(moisNum / 10) + (jourNum % 10) : moisNum

  // Réduction de l'année (somme des chiffres)
  let sommeAnnee = 0
  for (const chiffre of annee) {
    sommeAnnee += Number.parseInt(chiffre)
  }

  // Somme totale
  const sommeNonReduite = jourReduit + moisReduit + sommeAnnee

  // Réduction finale à un seul chiffre
  let sommeFinale = sommeNonReduite
  while (sommeFinale > 9) {
    let nouvelleValeur = 0
    sommeFinale
      .toString()
      .split("")
      .forEach((chiffre) => {
        nouvelleValeur += Number.parseInt(chiffre)
      })
    sommeFinale = nouvelleValeur
  }

  return {
    jour: jourNum,
    jourReduit,
    mois: moisNum,
    moisReduit,
    annee: anneeNum,
    sommeAnnee,
    sommeNonReduite,
    sommeFinale,
    moisNom: getNomMois(moisNum),
  }
}

// Fonction pour obtenir le nom du mois en français
const getNomMois = (mois: number) => {
  const moisFrancais = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ]
  return moisFrancais[mois - 1]
}

// Fonction pour déterminer si un prénom est masculin ou féminin
const determinerGenre = (prenom: string): "masculin" | "feminin" => {
  // Normaliser le prénom pour la comparaison
  const prenomNormalise = prenom
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

  // Si le prénom est dans la liste des prénoms féminins, retourner 'feminin'
  if (prenomsFeminins.includes(prenomNormalise)) {
    return "feminin"
  }

  // Par défaut, considérer le prénom comme masculin
  return "masculin"
}

// Fonction pour formater la date en français
const formatDate = (date: string) => {
  if (!date) return ""
  const [annee, mois, jour] = date.split("-")
  return `${jour} ${getNomMois(Number.parseInt(mois))} ${annee}`
}

// Fonction pour obtenir la salutation selon l'heure
const getSalutation = () => {
  const heure = new Date().getHours()
  return heure >= 5 && heure < 18 ? "Bonjour" : "Bonsoir"
}

// Fonction pour générer le script de narration
const genererScriptNarration = (prenom: string, dateNaissance: string, chiffreVie: number) => {
  const salutation = getSalutation()
  const dateFormatee = formatDate(dateNaissance)
  const genre = determinerGenre(prenom)
  const estMasculin = genre === "masculin"

  return `${salutation} ${prenom}. Merci d'avoir demandé votre lecture gratuite de numérologie sur lanumerologie.co.

Dans quelques instants, je vais vous offrir une analyse rapide mais profondément révélatrice de votre profil numérologique unique, basée sur votre prénom ${prenom} et votre date de naissance ${dateFormatee}.

Cinq éléments constituent le cœur de votre profil et influencent massivement votre vie.

Il s'agit du Chemin de Vie, du Nombre d'Anniversaire, du Nombre de l'Âme, du Nombre d'Expression et du Nombre de Personnalité.

En comprenant intimement ces nombres, vous découvrirez de nombreuses vérités fascinantes sur vous-même, la façon dont les autres vous perçoivent et les opportunités uniques qui vous attendent.

Le nombre le plus important de votre profil numérologique est votre Chemin de Vie.

Il révèle la direction qui vous apportera le plus d'épanouissement ainsi que les grandes leçons que vous êtes ${estMasculin ? "venu" : "venue"} apprendre.

Il met en lumière les opportunités et défis que vous rencontrerez, ainsi que les traits uniques de votre personnalité qui vous aideront dans votre parcours.

Votre Chemin de Vie est calculé en additionnant simplement les chiffres de votre date de naissance.

Vous êtes ${estMasculin ? "né" : "née"} le ${dateFormatee}, votre nombre de Chemin de Vie ${prenom}, est donc ${chiffreVie}, et cela m'en dit beaucoup sur vous.

Vous êtes ${estMasculin ? "un leader né" : "une leader née"}, une autorité absolue dans votre domaine.

Comme l'indique votre Chemin de Vie, vous êtes ${estMasculin ? "destiné" : "destinée"} à être numéro un.

Vous êtes ${estMasculin ? "ambitieux" : "ambitieuse"}, ${estMasculin ? "confiant" : "confiante"} et ${estMasculin ? "autonome" : "autonome"}.

Vous possédez un talent rare qui vous mettra sous le feu des projecteurs au moins une fois dans votre vie.

Vous excellez dans le lancement de nouveaux projets, mais vous vous lassez vite de la routine et des tâches trop chronophages que vous êtes ${estMasculin ? "confronté" : "confrontée"}.

Votre force intérieure et votre forte identité inspirent naturellement les autres à vous suivre.

Votre nature et votre détermination vous placent toujours en tête et sont la clé de votre réussite.

Il se peut que vous ayez souvent l'impression de rencontrer plus de défis que les autres, mais c'est uniquement parce que vous êtes plus ${estMasculin ? "prêt" : "prête"} et plus ${estMasculin ? "apte" : "apte"} à prendre des risques.

Votre mission est de sortir des sentiers battus et d'inspirer ceux qui vous entourent.

Faites-le ${prenom}, et vous réaliserez pleinement votre potentiel.

Passons maintenant à votre Nombre d'Expression.

C'est un autre élément extrêmement important de votre carte numérologique, car il met en lumière vos talents et aptitudes naturels, dont certains que vous ne soupçonniez même pas.

On l'appelle souvent le Nombre du Destin, car il révèle votre potentiel et ce que vous êtes ${estMasculin ? "censé" : "censée"} accomplir dans cette vie.

Contrairement à votre Chemin de Vie, qui est calculé à partir de votre date de naissance, votre Nombre d'Expression est déterminé en analysant les lettres de votre nom de naissance complet.

Pourquoi votre nom ?

Parce qu'il représente l'héritage de votre histoire personnelle jusqu'au moment de votre naissance.

Chaque lettre et son nombre correspondant s'assemblent comme une mosaïque pour former l'image complète de qui vous êtes et de qui vous êtes ${estMasculin ? "destiné" : "destinée"} à devenir.

Votre nom de naissance est la clé de votre potentiel ${prenom}

Pour obtenir une lecture personnalisée gratuite de votre Nombre d'Expression, basée sur votre nom complet, veuillez l'écrire ci-dessus.

A tout de suite ${prenom}`
}

// Interface pour les sous-titres avec leurs timestamps
interface SousTitreInfo {
  texte: string
  debut: number
  fin: number
}

// Classe pour gérer la file d'attente audio avec une synchronisation précise
class AudioQueue {
  private queue: HTMLAudioElement[] = []
  private isPlaying = false
  private currentAudio: HTMLAudioElement | null = null
  private onTextChange: (text: string) => void
  private onComplete: () => void
  private textMap: Map<HTMLAudioElement, string> = new Map()
  private sousTitresMap: Map<HTMLAudioElement, SousTitreInfo[]> = new Map()
  private onSousTitreChange: (sousTitre: string) => void
  private updateInterval: NodeJS.Timeout | null = null
  private currentSousTitreIndex = -1
  private allSousTitres: string[] = []
  private allSousTitresInfo: SousTitreInfo[] = []
  private currentSegmentIndex = 0
  private totalSegments = 0

  constructor(
    onTextChange: (text: string) => void,
    onComplete: () => void,
    onSousTitreChange: (sousTitre: string) => void,
  ) {
    this.onTextChange = onTextChange
    this.onComplete = onComplete
    this.onSousTitreChange = onSousTitreChange
  }

  // Prétraiter tous les segments pour créer une liste complète de sous-titres
  preProcessSegments(segments: NarrationSegment[]): void {
    this.totalSegments = segments.length
    this.allSousTitres = []
    this.allSousTitresInfo = []

    let offsetTime = 0

    segments.forEach((segment, segmentIndex) => {
      const sousTitres = diviserTexteEnSousTitres(segment.text)

      // Estimer la durée de chaque sous-titre en fonction de sa longueur
      const totalChars = segment.text.length
      const estimatedDuration = segment.duration || totalChars * 0.05 // 50ms par caractère
      const durationPerChar = estimatedDuration / totalChars

      let charPosition = 0

      sousTitres.forEach((sousTitre, index) => {
        this.allSousTitres.push(sousTitre)

        // Calculer les timestamps relatifs au segment
        const debut = offsetTime + charPosition * durationPerChar
        charPosition += sousTitre.length
        const fin =
          index === sousTitres.length - 1 ? offsetTime + estimatedDuration : offsetTime + charPosition * durationPerChar

        this.allSousTitresInfo.push({
          texte: sousTitre,
          debut,
          fin,
        })
      })

      // Mettre à jour l'offset pour le prochain segment
      offsetTime += estimatedDuration
    })

    console.log(`Prétraitement terminé: ${this.allSousTitres.length} sous-titres générés`)
  }

  // Ajouter un segment audio à la file d'attente
  add(audio: HTMLAudioElement, text: string): void {
    this.textMap.set(audio, text)

    // Diviser le texte en sous-titres avec notre fonction améliorée
    const sousTitres = diviserTexteEnSousTitres(text)

    // Créer les informations de sous-titres pour ce segment
    const sousTitresInfo: SousTitreInfo[] = []

    // Attendre que les métadonnées audio soient chargées
    const processAudio = () => {
      if (!isNaN(audio.duration) && audio.duration > 0) {
        // Calculer la durée approximative de chaque sous-titre
        // en fonction de sa longueur relative au texte total
        const totalChars = text.length

        let charPosition = 0
        sousTitres.forEach((sousTitre, index) => {
          // Calculer la position de début et de fin en fonction du nombre de caractères
          const debutRatio = charPosition / totalChars
          charPosition += sousTitre.length
          const finRatio = charPosition / totalChars

          const debut = debutRatio * audio.duration
          const fin = index === sousTitres.length - 1 ? audio.duration : finRatio * audio.duration

          sousTitresInfo.push({
            texte: sousTitre,
            debut,
            fin,
          })
        })

        this.sousTitresMap.set(audio, sousTitresInfo)

        // Si c'est le premier audio et qu'aucun sous-titre n'est affiché, afficher le premier
        if (this.queue.length === 0 && !this.isPlaying && this.currentSousTitreIndex === -1 && sousTitres.length > 0) {
          this.currentSousTitreIndex = 0
          this.onSousTitreChange(sousTitres[0])
        }
      }
    }

    if (!isNaN(audio.duration) && audio.duration > 0) {
      processAudio()
    } else {
      audio.addEventListener("loadedmetadata", processAudio)
    }

    this.queue.push(audio)

    // Si rien n'est en cours de lecture, démarrer la lecture
    if (!this.isPlaying) {
      this.playNext()
    }
  }

  // Dans la classe AudioQueue, améliorons la méthode startSubtitleTracking
  private startSubtitleTracking(audio: HTMLAudioElement): void {
    // Arrêter tout intervalle précédent
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }

    const sousTitresInfo = this.sousTitresMap.get(audio)
    if (!sousTitresInfo || sousTitresInfo.length === 0) return

    // Afficher immédiatement le premier sous-titre
    this.currentSousTitreIndex = 0
    this.onSousTitreChange(sousTitresInfo[0].texte)

    // Vérifier plus fréquemment pour une meilleure précision
    this.updateInterval = setInterval(() => {
      if (!audio || audio.paused || audio.ended) {
        if (this.updateInterval) {
          clearInterval(this.updateInterval)
          this.updateInterval = null
        }
        return
      }

      const currentTime = audio.currentTime

      // Trouver le sous-titre correspondant au temps actuel
      let newIndex = -1
      for (let i = 0; i < sousTitresInfo.length; i++) {
        if (currentTime >= sousTitresInfo[i].debut && currentTime < sousTitresInfo[i].fin) {
          newIndex = i
          break
        }
      }

      // Si aucun sous-titre ne correspond exactement, prendre le dernier avant le temps actuel
      if (newIndex === -1) {
        for (let i = sousTitresInfo.length - 1; i >= 0; i--) {
          if (currentTime >= sousTitresInfo[i].debut) {
            newIndex = i
            break
          }
        }
      }

      // Si l'index a changé, mettre à jour le sous-titre
      if (newIndex !== -1 && newIndex !== this.currentSousTitreIndex) {
        this.currentSousTitreIndex = newIndex
        this.onSousTitreChange(sousTitresInfo[newIndex].texte)
      }
    }, 30) // Vérifier toutes les 30ms pour une meilleure précision
  }

  // Jouer le prochain segment audio
  private playNext(): void {
    if (this.queue.length === 0) {
      this.isPlaying = false
      this.onComplete()
      return
    }

    this.isPlaying = true
    this.currentAudio = this.queue.shift() || null
    this.currentSegmentIndex++

    if (this.currentAudio) {
      try {
        // Récupérer le texte complet
        const text = this.textMap.get(this.currentAudio) || ""
        this.onTextChange(text)

        // Démarrer le suivi des sous-titres
        this.startSubtitleTracking(this.currentAudio)

        // Configurer l'événement de fin
        this.currentAudio.onended = () => {
          if (this.updateInterval) {
            clearInterval(this.updateInterval)
            this.updateInterval = null
          }

          // Jouer le segment suivant après un court délai
          setTimeout(() => this.playNext(), 50)
        }

        // Configurer la gestion des erreurs
        this.currentAudio.onerror = (e) => {
          console.error("Erreur lors de la lecture audio:", e)

          if (this.updateInterval) {
            clearInterval(this.updateInterval)
            this.updateInterval = null
          }

          // En cas d'erreur, passer au suivant
          setTimeout(() => this.playNext(), 500)
        }

        // Démarrer la lecture
        this.currentAudio.volume = 0.8
        this.currentAudio.play().catch((err) => {
          console.error("Erreur lors de la lecture audio:", err)

          if (this.updateInterval) {
            clearInterval(this.updateInterval)
            this.updateInterval = null
          }

          // En cas d'erreur, passer au suivant
          setTimeout(() => this.playNext(), 500)
        })
      } catch (error) {
        console.error("Erreur critique dans playNext:", error)
        // En cas d'erreur critique, passer au suivant
        setTimeout(() => this.playNext(), 500)
      }
    }
  }

  // Nettoyer la file d'attente
  clear(): void {
    if (this.currentAudio) {
      this.currentAudio.pause()
      this.currentAudio.onended = null
    }

    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }

    this.queue = []
    this.isPlaying = false
    this.currentAudio = null
    this.textMap.clear()
    this.sousTitresMap.clear()
    this.currentSousTitreIndex = -1
    this.allSousTitres = []
    this.allSousTitresInfo = []
    this.currentSegmentIndex = 0
  }
}

export default function Resultat() {
  const searchParams = useSearchParams()
  const prenom = searchParams.get("prenom") || ""
  const dateStr = searchParams.get("date") || ""

  // État pour le calcul numérologique
  const [calcul, setCalcul] = useState<any>(null)
  const [etapeAnimation, setEtapeAnimation] = useState(0)
  const [animationComplete, setAnimationComplete] = useState(false)
  const [displayMode, setDisplayMode] = useState<DisplayMode>(DisplayMode.Calculation)
  const [isLoading, setIsLoading] = useState(true)
  const [shouldRestartAnimation, setShouldRestartAnimation] = useState(false)
  const [showChiffreInCircle, setShowChiffreInCircle] = useState(false)

  // État pour la narration
  const [mounted, setMounted] = useState(false)
  const [narrationSegments, setNarrationSegments] = useState<NarrationSegment[]>([])
  const [isNarrationComplete, setIsNarrationComplete] = useState(false)
  const [currentNarrationText, setCurrentNarrationText] = useState("")
  const [sousTitres, setSousTitres] = useState<string[]>([])
  const [sousTitreActuel, setSousTitreActuel] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [narrationStarted, setNarrationStarted] = useState(false)
  const [audioPreloaded, setAudioPreloaded] = useState(false)
  const [scriptNarration, setScriptNarration] = useState("")

  // État pour suivre quelle image afficher dans le cercle
  const [currentCircleImage, setCurrentCircleImage] = useState<CircleImage>(CircleImage.None)
  const [shouldShowRing, setShouldShowRing] = useState(false)

  // État spécifique pour l'image du Nombre d'Anniversaire
  const [showAnniversaireImage, setShowAnniversaireImage] = useState(false)

  // Ajouter cet état avec les autres états pour les images
  const [showExpressionImage, setShowExpressionImage] = useState(false)

  // État pour l'audio
  const [isMuted, setIsMuted] = useState(false)
  const [backgroundAudio, setBackgroundAudio] = useState<HTMLAudioElement | null>(null)

  // Références
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const sousTitreTimerRef = useRef<NodeJS.Timeout | null>(null)
  const audioQueueRef = useRef<AudioQueue | null>(null)
  const preloadedAudiosRef = useRef<Map<number, HTMLAudioElement>>(new Map())
  const imagesPreloaded = useRef<boolean>(false)
  const anniversaireImageRef = useRef<HTMLImageElement | null>(null)
  const narrationSegmentsRef = useRef<NarrationSegment[]>([])

  // Nouvel état pour afficher le formulaire
  const [showExpressionForm, setShowExpressionForm] = useState(false)

  // Préchargement des images
  const preloadImages = () => {
    if (imagesPreloaded.current) return

    try {
      // Précharger l'image du Nombre d'Anniversaire séparément
      const anniversaireImage = new Image()
      anniversaireImage.src = "/images/nombre-anniversaire-main-new.jpeg"
      anniversaireImage.onload = () => {
        console.log("Image du Nombre d'Anniversaire préchargée avec succès")
        anniversaireImageRef.current = anniversaireImage
      }
      anniversaireImage.onerror = (e) => {
        console.error("Erreur lors du préchargement de l'image du Nombre d'Anniversaire:", e)
      }

      // Précharger l'image du Nombre d'Expression séparément
      const expressionImage = new Image()
      expressionImage.src = "/images/nombre-expression-cosmic.png"
      expressionImage.onload = () => {
        console.log("Image du Nombre d'Expression préchargée avec succès")
      }
      expressionImage.onerror = (e) => {
        console.error("Erreur lors du préchargement de l'image du Nombre d'Expression:", e)
      }

      // Précharger les autres images
      const imageUrls = [
        "/images/chemin-de-vie.jpeg",
        "/images/nombre-ame.jpeg",
        "/images/nombre-expression.jpeg",
        "/images/nombre-personnalite.jpeg",
      ]

      imageUrls.forEach((url) => {
        const img = new Image()
        img.src = url
      })

      imagesPreloaded.current = true
    } catch (error) {
      console.error("Erreur lors du préchargement des images:", error)
    }
  }

  // Initialiser la file d'attente audio
  useEffect(() => {
    audioQueueRef.current = new AudioQueue(
      (text) => {
        setCurrentNarrationText(text)

        // Vérifier si le texte actuel contient la phrase clé pour déclencher la transition vers le cercle
        if (text.includes("Cinq éléments constituent le cœur de votre profil")) {
          setShouldShowRing(true)
          preloadImages()
        }

        // Nouvelle logique: Revenir à l'animation des calculs pendant la partie spécifiée
        if (text.includes("En comprenant intimement ces nombres")) {
          setDisplayMode(DisplayMode.Calculation)
          // Réinitialiser l'animation pour qu'elle recommence
          setEtapeAnimation(0)
          setAnimationComplete(false)
          setShouldRestartAnimation(true)
          setShowChiffreInCircle(false)
        }

        // Réafficher le cercle après cette partie
        if (text.includes("Vous êtes né") || text.includes("Vous êtes née")) {
          setDisplayMode(DisplayMode.Circle)
          setShouldRestartAnimation(false)
        }

        // Afficher le chiffre dans le cercle quand on mentionne "est donc X"
        if (text.includes("est donc") && calcul) {
          setDisplayMode(DisplayMode.Circle)
          setShowChiffreInCircle(true)
          setShouldRestartAnimation(false)
        }

        // Afficher le tableau numérologique après "Pourquoi votre nom ?"
        if (text.includes("Pourquoi votre nom ?")) {
          setDisplayMode(DisplayMode.NumerologyTable)
        }

        // Afficher le formulaire d'inscription au lieu du tableau numérologique
        if (text.includes("Pour obtenir une lecture personnalisée gratuite de votre Nombre d'Expression")) {
          setDisplayMode(DisplayMode.NumerologyTable)
          setShowExpressionForm(true)
        }

        // Détection des phrases pour afficher les bonnes images
        if (text.includes("Il s'agit du Chemin de Vie")) {
          setCurrentCircleImage(CircleImage.CheminDeVie)
          setShowAnniversaireImage(false)
          setShowChiffreInCircle(false)
        } else if (text.includes("Passons maintenant à votre Nombre d'Anniversaire")) {
          // Forcer l'affichage de l'image du Nombre d'Anniversaire
          setCurrentCircleImage(CircleImage.NombreAnniversaire)
          setShowAnniversaireImage(true)
          setShowChiffreInCircle(false)
          console.log("Affichage de l'image du Nombre d'Anniversaire")
        } else if (text.includes("Nombre d'Anniversaire")) {
          // Forcer l'affichage de l'image du Nombre d'Anniversaire
          setCurrentCircleImage(CircleImage.NombreAnniversaire)
          setShowAnniversaireImage(true)
          setShowChiffreInCircle(false)
          console.log("Affichage de l'image du Nombre d'Anniversaire")
        } else if (
          text.includes("Passons maintenant à votre Nombre d'Expression") ||
          text.includes("Nombre d'Expression")
        ) {
          setCurrentCircleImage(CircleImage.NombreExpression)
          setShowAnniversaireImage(false)
          setShowChiffreInCircle(false)
          setShowExpressionImage(true)
        } else if (text.includes("Nombre de l'Âme")) {
          setCurrentCircleImage(CircleImage.NombreAme)
          setShowAnniversaireImage(false)
          setShowChiffreInCircle(false)
          setShowExpressionImage(false)
        } else if (text.includes("Nombre de Personnalité")) {
          setCurrentCircleImage(CircleImage.NombrePersonnalite)
          setShowAnniversaireImage(false)
          setShowChiffreInCircle(false)
          setShowExpressionImage(false)
        }
      },
      () => {
        setIsNarrationComplete(true)
        // Remettre le volume normal pour la musique de fond
        if (backgroundAudio) {
          backgroundAudio.volume = 0.8
        }
      },
      (sousTitre) => {
        // Mettre à jour le sous-titre actuel
        setSousTitres([sousTitre])
        setSousTitreActuel(0)
      },
    )

    // Prétraiter les segments si disponibles
    if (narrationSegments.length > 0 && audioQueueRef.current) {
      audioQueueRef.current.preProcessSegments(narrationSegments)
    }

    return () => {
      if (audioQueueRef.current) {
        audioQueueRef.current.clear()
      }
    }
  }, [backgroundAudio, calcul, narrationSegments])

  // Générer le script de narration complet
  useEffect(() => {
    if (calcul) {
      const script = genererScriptNarration(prenom, dateStr, calcul.sommeFinale)
      setScriptNarration(script)

      // Diviser le script en segments pour la narration
      const segments: NarrationSegment[] = []
      const phrases = script.split("\n\n")

      phrases.forEach((phrase, index) => {
        if (phrase.trim()) {
          segments.push({
            id: index + 1,
            text: phrase.trim(),
            duration: 5 + phrase.length / 20, // Durée approximative basée sur la longueur du texte
            image: index % 3 === 0 ? "/images/space-bg-mixed.jpg" : undefined,
            imageAlt: "Illustration numérologique",
          })
        }
      })

      setNarrationSegments(segments)
      narrationSegmentsRef.current = segments
    }
  }, [calcul, prenom, dateStr])

  // Précharger tous les segments audio
  useEffect(() => {
    if (narrationSegments.length > 0 && !audioPreloaded) {
      const preloadAudio = async () => {
        try {
          console.log("Début du préchargement des segments audio...")

          // Précharger tous les segments en parallèle
          const preloadPromises = narrationSegments.map(async (segment) => {
            try {
              const audio = new Audio()

              // Ajouter un timestamp unique pour éviter la mise en cache
              audio.src = `/api/speech?text=${encodeURIComponent(segment.text)}&t=${Date.now()}&cache=no-store`
              audio.volume = 0.8
              audio.preload = "auto"

              // Forcer le chargement
              audio.load()

              // Stocker l'élément audio préchargé
              preloadedAudiosRef.current.set(segment.id, audio)

              // Attendre que l'audio soit suffisamment chargé
              return new Promise<void>((resolve) => {
                const onCanPlay = () => {
                  console.log(`Segment ${segment.id} préchargé avec succès`)
                  audio.removeEventListener("canplaythrough", onCanPlay)
                  resolve()
                }

                audio.addEventListener("canplaythrough", onCanPlay)

                audio.onerror = (e) => {
                  console.error(`Erreur lors du préchargement du segment ${segment.id}:`, e)
                  audio.removeEventListener("canplaythrough", onCanPlay)
                  resolve() // Continuer même en cas d'erreur
                }

                // Timeout de sécurité pour éviter de bloquer indéfiniment
                setTimeout(() => {
                  audio.removeEventListener("canplaythrough", onCanPlay)
                  console.log(`Timeout pour le segment ${segment.id}, continuons quand même`)
                  resolve()
                }, 5000) // 5 secondes de timeout
              })
            } catch (error) {
              console.error(`Erreur lors du préchargement du segment ${segment.id}:`, error)
              return Promise.resolve() // Continuer même en cas d'erreur
            }
          })

          // Attendre que tous les préchargements soient terminés
          await Promise.all(preloadPromises)
          console.log("Tous les segments audio ont été préchargés")

          setAudioPreloaded(true)

          // Démarrer la narration une fois tous les segments préchargés
          if (!narrationStarted) {
            setNarrationStarted(true)
            startNarration()
          }
        } catch (error) {
          console.error("Erreur lors du préchargement des segments audio:", error)
          // En cas d'erreur, démarrer quand même la narration
          if (!narrationStarted) {
            setNarrationStarted(true)
            startNarration()
          }
        }
      }

      preloadAudio()
    }
  }, [narrationSegments, audioPreloaded, narrationStarted])

  // Initialisation
  useEffect(() => {
    setMounted(true)

    // Calculer immédiatement
    if (dateStr) {
      const resultat = calculerChiffreVie(dateStr)
      setCalcul(resultat)
    }

    // Animation de chargement très courte
    setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    // Initialiser l'audio de fond avec l'URL exacte fournie
    const audio = new Audio("https://sonback.blob.core.windows.net/son12/background-sound-low-gain (mp3cut.net).mp3")
    audio.loop = true
    audio.volume = 0.8 // Augmenté à 80%
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

    // Précharger les images dès le début
    preloadImages()

    // Nettoyage lors du démontage du composant
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
      if (sousTitreTimerRef.current) {
        clearInterval(sousTitreTimerRef.current)
      }
      if (audio) {
        audio.pause()
        audio.src = ""
      }

      // Nettoyer les audios préchargés
      preloadedAudiosRef.current.forEach((audio) => {
        audio.pause()
        audio.src = ""
      })
      preloadedAudiosRef.current.clear()
    }
  }, [dateStr])

  // Animation du calcul
  useEffect(() => {
    if (!calcul || isLoading) return

    // Si l'animation est terminée et qu'on ne doit pas la redémarrer, ne rien faire
    if (animationComplete && !shouldRestartAnimation) return

    const timer = setTimeout(() => {
      if (etapeAnimation < 13) {
        setEtapeAnimation(etapeAnimation + 1)
      } else {
        // Animation terminée
        setAnimationComplete(true)
      }
    }, 1000)

    timerRef.current = timer

    return () => clearTimeout(timer)
  }, [etapeAnimation, calcul, isLoading, animationComplete, shouldRestartAnimation])

  // Effet pour montrer le cercle cosmique quand shouldShowRing devient true
  useEffect(() => {
    if (shouldShowRing && animationComplete && !shouldRestartAnimation) {
      setDisplayMode(DisplayMode.Circle)
    }
  }, [shouldShowRing, animationComplete, shouldRestartAnimation])

  const startNarration = async () => {
    try {
      setErrorMessage(null)

      // Baisser le volume de la musique de fond pendant la narration
      if (backgroundAudio) {
        backgroundAudio.volume = 0.4
      }

      console.log("Démarrage de la narration avec", narrationSegments.length, "segments")

      // Prétraiter tous les segments pour une meilleure synchronisation
      if (audioQueueRef.current) {
        audioQueueRef.current.preProcessSegments(narrationSegments)
      }

      // Afficher immédiatement le premier sous-titre
      if (narrationSegments.length > 0) {
        const premierSegment = narrationSegments[0]
        const premierSousTitres = diviserTexteEnSousTitres(premierSegment.text)

        if (premierSousTitres.length > 0) {
          console.log(`Affichage initial du premier sous-titre: "${premierSousTitres[0]}"`)
          setSousTitres([premierSousTitres[0]])
        }
      }

      // Ajouter tous les segments à la file d'attente
      if (audioQueueRef.current) {
        for (const segment of narrationSegments) {
          // Essayer d'utiliser l'audio préchargé
          const audio = preloadedAudiosRef.current.get(segment.id)

          if (audio && audio.readyState >= 2) {
            console.log(`Utilisation de l'audio préchargé pour le segment ${segment.id}`)
            audioQueueRef.current.add(audio, segment.text)
          } else {
            // Fallback: créer un nouvel audio
            console.log(`Création d'un nouvel audio pour le segment ${segment.id}`)
            const newAudio = new Audio()
            newAudio.src = `/api/speech?text=${encodeURIComponent(segment.text)}&t=${Date.now()}`
            newAudio.volume = 0.8
            audioQueueRef.current.add(newAudio, segment.text)
          }
        }
      }
    } catch (error) {
      console.error("Erreur lors du démarrage de la narration:", error)
      setErrorMessage(`Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`)
    }
  }

  // Gestion du son de fond
  const toggleMute = () => {
    if (backgroundAudio) {
      if (isMuted) {
        backgroundAudio.volume = isNarrationComplete ? 0.8 : 0.4
      } else {
        backgroundAudio.volume = 0
      }
      setIsMuted(!isMuted)
    }
  }

  // Générer les chiffres flottants
  const [leftNumbers] = useState(() =>
    Array.from({ length: 25 }, () => ({
      value: Math.floor(Math.random() * 9) + 1,
      size: Math.random() * 0.7 + 0.3,
      top: Math.random() * 90 + 5,
      left: Math.random() * 25 + 2,
      duration: Math.random() * 15 + 10,
      delay: Math.random() * 5,
    })),
  )

  const [rightNumbers] = useState(() =>
    Array.from({ length: 25 }, () => ({
      value: Math.floor(Math.random() * 9) + 1,
      size: Math.random() * 0.7 + 0.3,
      top: Math.random() * 90 + 5,
      right: Math.random() * 25 + 2,
      duration: Math.random() * 15 + 10,
      delay: Math.random() * 5,
    })),
  )

  // Animations
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: { duration: 0.4, ease: "easeIn" },
    },
  }

  const fadeInRight = {
    hidden: { opacity: 0, x: -30 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  }

  const fadeIn = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.4, ease: "easeInOut" },
    },
  }

  const scaleIn = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.7,
        type: "spring",
        stiffness: 200,
        damping: 10,
      },
    },
  }

  const resultAnimation = {
    hidden: { opacity: 0, scale: 0.5 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.8,
        type: "spring",
        stiffness: 120,
        damping: 8,
      },
    },
  }

  // Fonction pour obtenir l'image à afficher dans le cercle
  const getCircleImage = () => {
    // Si nous devons afficher l'image du Nombre d'Expression, priorité à cette image
    if (showExpressionImage) {
      return "/images/nombre-expression-cosmic.png"
    }

    // Si nous devons afficher l'image du Nombre d'Anniversaire, la priorité est donnée à cette image
    if (showAnniversaireImage) {
      return "/images/nombre-anniversaire-main-new.jpeg"
    }

    // Sinon, utiliser la logique normale
    switch (currentCircleImage) {
      case CircleImage.CheminDeVie:
        return "/images/chemin-de-vie.jpeg"
      case CircleImage.NombreAnniversaire:
        // Même si currentCircleImage est NombreAnniversaire, on vérifie showAnniversaireImage
        return "/images/nombre-anniversaire-main-new.jpeg"
      case CircleImage.NombreAme:
        return "/images/nombre-ame.jpeg"
      case CircleImage.NombreExpression:
        return "/images/nombre-expression-cosmic.png" // Utiliser la nouvelle image
      case CircleImage.NombrePersonnalite:
        return "/images/nombre-personnalite.jpeg"
      default:
        return null
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
            Préparation de votre analyse numérologique...
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

  if (!mounted || !calcul || !narrationSegments.length) {
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

      {/* Chiffres flottants à gauche */}
      {leftNumbers.map((num, idx) => (
        <motion.div
          key={`left-${idx}`}
          className="absolute text-white font-bold z-10"
          style={{
            top: `${num.top}%`,
            left: `${num.left}%`,
            fontSize: `${Math.floor(num.size * 40)}px`,
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
            duration: num.duration,
            delay: num.delay,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "loop",
            ease: "linear",
          }}
        >
          {num.value}
        </motion.div>
      ))}

      {/* Chiffres flottants à droite */}
      {rightNumbers.map((num, idx) => (
        <motion.div
          key={`right-${idx}`}
          className="absolute text-white font-bold z-10"
          style={{
            top: `${num.top}%`,
            right: `${num.right}%`,
            fontSize: `${Math.floor(num.size * 40)}px`,
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
            duration: num.duration,
            delay: num.delay,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "loop",
            ease: "linear",
          }}
        >
          {num.value}
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

        {/* Sous-titres de narration */}
        {sousTitres.length > 0 && (
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

        {/* Affichage conditionnel: calcul, cercle ou tableau numérologique */}
        <AnimatePresence mode="wait">
          {displayMode === DisplayMode.Calculation ? (
            /* Animation du calcul */
            <motion.div
              className="grid grid-cols-1 gap-8 w-full max-w-3xl"
              key="calcul"
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.5 }}
            >
              {/* Ligne 1: Mois */}
              <div className="flex items-center justify-center gap-4">
                {/* Étape 1: Nom du mois */}
                <AnimatePresence>
                  {etapeAnimation >= 0 && (
                    <motion.div
                      className="bg-pink-600/80 text-yellow-300 px-6 py-3 rounded-lg text-center min-w-[120px] text-xl font-bold"
                      variants={fadeInRight}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                    >
                      {calcul.moisNom}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Flèche 1 */}
                <AnimatePresence>
                  {etapeAnimation >= 1 && (
                    <motion.div variants={fadeIn} initial="hidden" animate="visible" exit="exit">
                      <ArrowRight className="text-white" />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Étape 2: Valeur du mois */}
                <AnimatePresence>
                  {etapeAnimation >= 2 && (
                    <motion.div
                      className="bg-pink-600/80 text-yellow-300 px-6 py-3 rounded-lg text-center min-w-[60px] text-xl font-bold"
                      variants={fadeInRight}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                    >
                      {calcul.moisReduit}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Ligne 2: Jour - n'apparaît qu'après la ligne du mois complète */}
              {etapeAnimation >= 4 && (
                <div className="flex items-center justify-center gap-4">
                  {/* Étape 1: Jour */}
                  <AnimatePresence>
                    {etapeAnimation >= 4 && (
                      <motion.div
                        className="bg-pink-600/80 text-yellow-300 px-6 py-3 rounded-lg text-center min-w-[60px] text-xl font-bold"
                        variants={fadeInRight}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                      >
                        {calcul.jour}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Flèche 1 */}
                  <AnimatePresence>
                    {etapeAnimation >= 5 && (
                      <motion.div variants={fadeIn} initial="hidden" animate="visible" exit="exit">
                        <ArrowRight className="text-white" />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Étape 2: Valeur du jour */}
                  <AnimatePresence>
                    {etapeAnimation >= 6 && (
                      <motion.div
                        className="bg-pink-600/80 text-yellow-300 px-6 py-3 rounded-lg text-center min-w-[60px] text-xl font-bold"
                        variants={fadeInRight}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                      >
                        {calcul.jourReduit}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Ligne 3: Année - n'apparaît qu'après la ligne du jour complète */}
              {etapeAnimation >= 8 && (
                <div className="flex items-center justify-center gap-4">
                  {/* Étape 1: Année */}
                  <AnimatePresence>
                    {etapeAnimation >= 8 && (
                      <motion.div
                        className="bg-pink-600/80 text-yellow-300 px-6 py-3 rounded-lg text-center min-w-[100px] text-xl font-bold"
                        variants={fadeInRight}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                      >
                        {calcul.annee}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Flèche 1 */}
                  <AnimatePresence>
                    {etapeAnimation >= 9 && (
                      <motion.div variants={fadeIn} initial="hidden" animate="visible" exit="exit">
                        <ArrowRight className="text-white" />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Étape 2: Valeur de l'année */}
                  <AnimatePresence>
                    {etapeAnimation >= 10 && (
                      <motion.div
                        className="bg-pink-600/80 text-yellow-300 px-6 py-3 rounded-lg text-center min-w-[60px] text-xl font-bold"
                        variants={fadeInRight}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                      >
                        {calcul.sommeAnnee}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Signe égal et résultat final - n'apparaît qu'après la ligne de l'année complète */}
              {etapeAnimation >= 12 && (
                <div className="flex items-center justify-center gap-4 mt-4">
                  <AnimatePresence>
                    {etapeAnimation >= 12 && (
                      <motion.div
                        variants={scaleIn}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="text-yellow-300 text-3xl font-bold"
                      >
                        =
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Résultat final (chemin de vie) */}
              <AnimatePresence>
                {etapeAnimation >= 13 && (
                  <motion.div
                    className="flex justify-center mt-2"
                    variants={resultAnimation}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <motion.div
                      className="bg-yellow-400 text-white font-bold text-6xl px-8 py-6 rounded-lg text-center min-w-[100px]"
                      whileHover={{ scale: 1.05, transition: { duration: 0.3 } }}
                      animate={{
                        boxShadow: [
                          "0 0 10px rgba(255,215,0,0.5)",
                          "0 0 20px rgba(255,215,0,0.8)",
                          "0 0 10px rgba(255,215,0,0.5)",
                        ],
                      }}
                      transition={{
                        boxShadow: {
                          duration: 2,
                          repeat: Number.POSITIVE_INFINITY,
                          repeatType: "reverse",
                        },
                      }}
                    >
                      {calcul.sommeFinale}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : displayMode === DisplayMode.Circle ? (
            /* Cercle cosmique avec contour lumineux et animation tournante */
            <motion.div
              className="relative w-full max-w-3xl h-[500px] flex items-center justify-center"
              key="anneau"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
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

                {/* Image cosmique à l'intérieur du cercle - transparente quand aucune image n'est affichée */}
                <div className="absolute inset-[3px] rounded-full overflow-hidden">
                  {/* Affichage conditionnel du chiffre ou de l'image */}
                  {showChiffreInCircle ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <motion.div
                        className="text-[180px] font-bold text-white"
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
                            "0 0 30px rgba(255, 105, 180, 0.9), 0 0 60px rgba(255, 105, 180, 0.7), 0 0 90px rgba(255, 105, 180, 0.5)",
                          filter: "brightness(1.2) contrast(1.1)",
                        }}
                      >
                        {calcul.sommeFinale}
                      </motion.div>
                    </div>
                  ) : showExpressionImage ? (
                    <Image
                      src="/images/nombre-expression-cosmic.png"
                      alt="Nombre d'Expression"
                      fill
                      className="object-cover"
                      priority
                    />
                  ) : showAnniversaireImage ? (
                    <Image
                      src="/images/nombre-anniversaire-main-new.jpeg"
                      alt="Nombre d'Anniversaire"
                      fill
                      className="object-cover"
                      priority
                    />
                  ) : (
                    getCircleImage() && (
                      <Image
                        src={getCircleImage() || "/placeholder.svg"}
                        alt="Image numérologique"
                        fill
                        className="object-cover"
                      />
                    )
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            /* Tableau numérologique */
            <motion.div
              className="w-full max-w-3xl flex items-center justify-center"
              key="numerologyTable"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, type: "spring" }}
            >
              {showExpressionForm ? (
                <ExpressionForm
                  prenom={prenom}
                  genreDetecte={determinerGenre(prenom) === "feminin" ? "femme" : "homme"}
                />
              ) : (
                <NumerologyTable name={prenom} />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Message d'erreur */}
        {errorMessage && (
          <div className="mt-4 p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-200">{errorMessage}</div>
        )}
      </div>
    </main>
  )
}
