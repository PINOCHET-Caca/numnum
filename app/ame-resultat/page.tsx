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

// Fonction pour diviser un texte en segments courts (maximum 2 lignes)
const diviserEnSegmentsCourts = (texte: string): string[] => {
  // Longueur maximale pour 2 lignes (environ 100 caractères)
  const longueurMax = 100

  // Tableau pour stocker les segments courts
  const segments: string[] = []

  // Phrase spécifique à préserver intacte
  const phraseSpecifique = "Vous êtes intuitif, puissant et pragmatique."

  // Diviser d'abord par les points, points d'exclamation et points d'interrogation
  const phrases = texte.split(/(?<=[.!?])\s+/)

  for (const phrase of phrases) {
    // Si c'est la phrase spécifique, l'ajouter telle quelle
    if (phrase.trim() === phraseSpecifique) {
      segments.push(phraseSpecifique)
      continue
    }

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

// Interface pour les points d'ancrage de synchronisation
interface PointAncrage {
  texte: string // Texte du sous-titre
  tempsAudio: number // Temps approximatif dans l'audio (en secondes)
  affichage: boolean // Si ce point a déjà été affiché
  actions?: {
    // Actions à effectuer lors de l'affichage
    showCircle?: boolean
    showTable?: boolean
    showVowelsAnimation?: boolean
    showNumberInCircle?: boolean
    forceTableRender?: boolean
  }
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
  const [currentSousTitreIndex, setCurrentSousTitreIndex] = useState(0) // Nouvel état pour suivre l'index du sous-titre actuel

  // Ajouter un nouvel état pour contrôler l'affichage de l'animation des voyelles
  const [showVowelsAnimation, setShowVowelsAnimation] = useState(false)

  // Références
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const mainAudioRef = useRef<HTMLAudioElement | null>(null)
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioSegmentsRef = useRef<HTMLAudioElement[]>([])
  const currentSegmentIndexRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)
  const segmentStartTimesRef = useRef<Record<number, number>>({}) // Stocker les temps de début de chaque segment
  const pointsAncrageRef = useRef<PointAncrage[]>([])
  const audioStartTimeRef = useRef<number>(0)
  const forceUpdateTimerRef = useRef<NodeJS.Timeout | null>(null)
  const sousTitresRef = useRef<string[]>([]) // Référence pour stocker les sous-titres
  const lastSousTitreUpdateRef = useRef<number>(0) // Pour suivre la dernière mise à jour des sous-titres
  const audioErrorCountRef = useRef<number>(0) // Pour compter les erreurs audio

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

  // Texte de narration complet - UTILISER EXACTEMENT LE TEXTE FOURNI
  const texteNarrationComplet = `${prenom} j'ai réuni toutes les informations nécessaires pour compléter votre lecture de numérologie personnalisée, et comme vous l'aurez deviné : j'ai gardé le meilleur pour la fin.

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

Alors, êtes-vous curieux de savoir ce que révèle votre nombre de l'âme ?

Après avoir analysé les voyelles de votre nom et prénom, j'ai découvert que votre nombre de l'âme est le maître nombre (mettre nombre de l'âme).

Que vous en ayez conscience ou non, vous avez tout ce qu'il faut pour connaître un succès fulgurant, tant sur le plan spirituel que matériel.

Vous êtes intuitif, puissant et pragmatique.

Vous ressentez un appel profond à être un bâtisseur accompli et à créer un héritage qui soutiendra les générations futures.

Vous êtes probablement impliqué dans un travail qui profite à un grand nombre de personnes.

Vous avez des idéaux élevés, mais vous savez aussi garder les pieds sur terre.

Vous détestez les tâches monotones, mais c'est simplement parce que votre âme aspire à créer et à évoluer.

Vous avez tendance à surestimer vos capacités et à accepter des tâches pour lesquelles vous n'êtes pas toujours préparé, dans le but de plaire aux autres.

Cela peut vous laisser un sentiment d'accablement et de frustration.

En tant que maître nombre, vous avez un potentiel supérieur à la moyenne.

Restez discipliné et laissez les autres vous soutenir, et il ne fait aucun doute que vous atteindrez la créativité, l'abondance et l'épanouissement auxquels aspire votre âme.

En ce qui concerne les relations, vous êtes très pragmatique.

Vous valorisez la compagnie et la croissance personnelle.

Vous vous épanouissez avec un partenaire qui vous soutient, et la bonne personne pourra propulser votre succès encore plus loin.

Vous êtes perceptif, romantique et capable d'une connexion profonde.

Mais ce n'est pas tout ce que j'ai découvert sur vous ${prenom}.

Comme un oignon, vous avez de nombreuses couches.

En creusant plus profondément dans votre profil de numérologie, j'ai constaté que vous possédez de nombreux traits uniques et particularités de personnalité.

J'ai le sentiment que vous êtes imprévisible et un peu anticonformiste.

Ce qui plaît généralement aux autres femmes ne vous intéressent pas vraiment.

Vous êtes intransigeant et refusez de vous contenter du minimum.

Parce que vous êtes une belle femme, vous attirez souvent des partenaires qui ne s'intéressent qu'à votre apparence.

Cela peut être frustrant, car vous êtes incroyablement intelligente et avez une âme profonde.

Vous avez tendance à être perfectionniste et compétitive dans le milieu professionnel.

Vous êtes expressive, avez un but clair et n'avez pas peur d'aller chercher ce que vous voulez.

J'ai le sentiment que vous avez occupé ou occupez actuellement un poste traditionnellement réservé aux hommes. 

Je vous vois bien habillée et accomplissant tout ce que vous entreprenez.

Vous avez une confiance que peu de gens possèdent.

Cela ne signifie pas que vous êtes agressive ou autoritaire, mais vous n'avez pas peur de prendre des risques.

Cela fait de vous une personne entreprenante et loin de la définition traditionnelle du rôle domestique.

Même si vous épousiez un millionnaire, vous auriez toujours vos propres projets et objectifs.

Vous avez un esprit curieux et analytique qui a besoin d'être stimulé.

Vous êtes intuitive, perspicace et animée, avec d'excellentes compétences en communication et un sens de la diplomatie.

Bien que vous ayez connu du succès dans votre vie, vous avez peut-être eu des difficultés dans le domaine sentimental.

Cependant, cela tient plus à votre exigence qu'à une quelconque malédiction.

Vous êtes sélective et attendez beaucoup des autres.

Bien que parfois un peu têtue et difficile à satisfaire, vous n'êtes ni arrogante ni vaniteuse.

En raison de votre énergie rare et puissante, un partenaire jaloux, manquant de confiance en lui ou trop contrôlant n'aura que peu de chances de rester à vos côtés.

J'ai le sentiment que vous avez récemment été, ou serez bientôt, impliquée dans une relation à long terme (peut-être deux à trois ans), où l'amour platonique dominera sur la passion.

Cette personne vous aime beaucoup et vous vous sentez en sécurité avec elle, mais ce n'est pas votre grand amour.

La personne qui vous fera perdre la tête est encore à venir.

Elle sera confiante et raisonnable, tout comme vous, et vous aurez beaucoup en commun.

Dès votre rencontre, il y aura une forte alchimie, et votre vie en sera transformée.

Le meilleur reste à venir.

Dans un avenir très proche, un nouveau départ s'annonce.

Vous accomplirez plus dans les prochaines années que vous ne l'avez fait auparavant.

Vous réaliserez tout ce que vous voulez dans la vie de toute façon.

Cela peut être difficile à croire, mais les informations que je vous ai partagées au cours des dernières minutes ne font qu'effleurer la surface de ce que je peux découvrir sur vous.

Après avoir examiné uniquement votre chemin de vie, votre nombre d'expression et votre nombre de l'âme, je peux dire que vous avez une combinaison de nombres vraiment unique.

En fait, il n'y a rien que j'aimerais plus que de passer des heures à explorer chaque aspect de votre thème.

Jusqu'à présent, je vous juste donné un bref aperçu, et bien que j'espère que ces courtes lectures vous donnent un avant-goût de qui vous êtes et de ce dont vous êtes vraiment capable, si vous vous arrêtez ici, vous partirez probablement avec plus de questions que de réponses.

Je ne veux rien de plus que de vous voir réussir, de vous donner la confirmation et la confiance que vous cherchez, de vous diriger sans excuses vers vos désirs les plus profonds et de manifester la vie et l'abondance que vous méritez immédiatement.

Il me reste beaucoup à vous dire, et franchement, la plupart sont bien trop personnels pour être partagés ici

Donc, si vous êtes ouverte à cela, j'aimerais vous envoyer votre rapport complet de décodeur de personnalité.

Votre Décodeur de Personnalité est un rapport complet, précis et entièrement personnalisé des cinq nombres les plus révélateurs de votre profil numérologique.

Vous devez savoir dès maintenant que votre combinaison unique de ces cinq nombres révèle beaucoup sur vous et sur la vie que vous êtes destinée à vivre.

Cela éclaircira où vous en êtes dans votre vie en ce moment et comment vous y êtes arrivée.

Cela vous aidera à comprendre vos relations, vos désirs romantiques, vos attractions inexplicables et vos chagrins passés.

Cela expliquera pourquoi vous avez pris certaines décisions de carrière, subi des problèmes financiers, et où vous êtes censée concentrer votre temps, votre attention et vos ressources pour manifester la richesse et l'abondance plus facilement.

Inspirez votre objectif et guidez-vous fidèlement vers votre plus haut potentiel afin que vous puissiez tirer le meilleur parti de chaque instant dès aujourd'hui.

Donc, si vous êtes prête, cliquez simplement sur le bouton ci-dessous et en quelques secondes, nous commencerons à compiler votre rapport de Décodeur de Personnalité.

Cela inclut non seulement des versions étendues des lectures que je viens de vous donner, mais aussi des interprétations détaillées et approfondies des autres éléments centraux de votre thème.

Ce rapport complet de 36 pages est conçu pour vous montrer, peut-être pour la première fois, comment toutes les diverses parties de votre personnalité se sont réunies pour créer l'être puissant et sans limites que vous êtes.

Il vous donne tout ce dont vous avez besoin pour prendre des décisions autonomes et prendre le contrôle de votre destin sans remplissage ni fioritures.

Cliquez sur le bouton ci-dessous maintenant pour vous rendre sur notre page de commande sûre et sécurisée pour finaliser votre achat.

Dans quelques minutes, vous obtiendrez des lectures personnalisées sur les défis inhérents présents dans votre thème, révélés par le côté sombre de vos nombres. 

Personne n'est parfait, mais ces interprétations puissantes éclaireront vos défauts innés et comment travailler avec eux pour attirer le partenaire de vie et l'abondance que vous désirez.

Vous recevrez des conseils puissants sur la manière de calculer votre code de personnalité sacré afin que vous puissiez comprendre intimement et immédiatement votre propre profil numérologique et effectuer des calculs et des lectures pour vos amis et votre famille. 

Et vous découvrirez les quatre choses que vous devez faire aujourd'hui pour nourrir votre esprit et apporter plus de bonheur et d'abondance dans votre vie.

Vous ne pouvez plus vous permettre d'ignorer les vérités époustouflantes cachées de votre profil numérologique.

Ce rapport est normalement vendu au prix de 29€, mais j'aimerais vous l'offrir aujourd'hui uniquement à un prix très spécial et fortement réduit. 

Ce prix n'est disponible que sur cette page, donc si vous choisissez de refuser votre réduction, il y a de fortes chances que vous ne la revoyiez jamais.

Mais voici le truc, je suis tellement convaincue qu'une fois armé des réponses et des conseils que vous recevrez de votre rapport de Décodeur de Personnalité, cette année sera votre année la plus transformatrice, abondante et épanouissante pour vous. 

Pourtant, même si nous offrons cette réduction unique, vous bénéficiez toujours d'une garantie de remboursement de 365 jours.

Dans le cas improbable où vous ne seriez pas époustouflé par votre Décodeur de Personnalité, envoyez simplement un email à support@lanumerologie.co et nous vous rembourserons rapidement et joyeusement chaque centime. 

Sans tracas, sans questions, et sans obstacles à franchir. 

Cependant, si vous êtes comme la plupart de mes lecteurs, vous ne le ferez tout simplement pas.

Plus de 98% de nos lecteurs adorent leur rapport de Décodeur de Personnalité. 

Vous êtes à un carrefour en ce moment, et vraiment, vous n'avez que deux options très différentes menant à deux vies très différentes. 

La première option est de quitter cette page sans votre rapport de Décodeur de Personnalité. 

Je pense que vous savez déjà où cela vous mènera.

Nulle part, vous resterez là où vous êtes, coincé dans une vie de désespoir silencieux.

C'est pourquoi vous devriez sérieusement envisager la deuxième option, qui est de faire une petite action aujourd'hui qui aura un impact incroyable sur le reste de votre vie. 

Découvrir vos forces, surmonter vos faiblesses et vivre la vie incroyable pour laquelle vous êtes née.

Je vous invite à entreprendre ce voyage avec nous pour découvrir les incroyables révélations de votre profil numérologique, avec votre propre rapport de Décodeur de Personnalité. 

Vous n'avez absolument rien à perdre et tout un univers d'abondance illimitée à gagner.

Si vous choisissez de refuser cette offre, vous risquez de passer à côté d'une occasion précieuse de mieux vous comprendre et d'avancer vers la vie que vous méritez.

Chaque minute qui passe est une minute où vous restez vulnérable à ce qui arrive.

Une minute de plus où votre potentiel d'abondance reste inexploité.

Ne laissez pas cette opportunité unique vous glisser entre les doigts.

Ne vous retrouvez pas dans quelques mois à regarder votre compte en banque, ou vos relations le cœur serré, en pensant :

"Si seulement j'avais agi quand j'en avais l'occasion..."

Cliquez sur le bouton ci-dessous maintenant ${prenom}.

Ce n'est pas un hasard si vous êtes arrivé sur cette page et si vous avez écouté cette vidéo. 

Vous savez au fond de vous que c'est la solution à vos problèmes.

Donc, allez-y, recevez votre Décodeur de Personnalité aujourd'hui tant qu'il n'est pas trop tard en cliquant sur le bouton ci-dessous de cette vidéo.

Le temps presse.

Chaque seconde compte.

Un avenir de prospérité illimitée vous attend de l'autre côté…

Faites le choix d'explorer votre potentiel et de prendre le contrôle de votre destinée dès maintenant ${prenom}.

On se retrouve de l'autre côté.`

  // Diviser le texte en segments courts (2 lignes max)
  const sousTitres = diviserEnSegmentsCourts(texteNarrationComplet)

  // Stocker les sous-titres dans la référence pour y accéder partout
  useEffect(() => {
    sousTitresRef.current = sousTitres
  }, [sousTitres])

  // Initialisation des points d'ancrage pour la synchronisation
  const initialiserPointsAncrage = () => {
    // Définir les points d'ancrage avec des temps approximatifs
    // Ces temps sont des estimations basées sur une vitesse de parole moyenne
    const pointsAncrage: PointAncrage[] = [
      {
        texte: `${prenom} j'ai réuni toutes les informations nécessaires pour compléter votre lecture de numérologie personnalisée`,
        tempsAudio: 0,
        affichage: false,
        actions: { showCircle: true, showTable: false, showVowelsAnimation: false, showNumberInCircle: false },
      },
      {
        texte: "Mais avant de commencer, je dois vous avertir.",
        tempsAudio: 5,
        affichage: false,
      },
      {
        texte:
          "Les informations que je vais partager avec vous sont incroyablement personnelles et pourraient bien vous surprendre.",
        tempsAudio: 8,
        affichage: false,
      },
      {
        texte: "La plupart des lecteurs sont choqués par la précision de ces révélations",
        tempsAudio: 12,
        affichage: false,
      },
      {
        texte: "Si vous choisissez d'écouter, faites-le avec un esprit ouvert",
        tempsAudio: 18,
        affichage: false,
      },
      {
        texte: "Je vais commencer par examiner votre nombre de l'âme.",
        tempsAudio: 24,
        affichage: false,
        actions: { showCircle: false, showTable: true, forceTableRender: true },
      },
      {
        texte: "Le nombre de l'âme, aussi appelée désir du cœur",
        tempsAudio: 28,
        affichage: false,
      },
      {
        texte: "Cependant, pour le nombre de l'âme, seules les voyelles sont prises en compte",
        tempsAudio: 40,
        affichage: false,
      },
      {
        texte: "Les voyelles, en revanche, sont prononcées avec un souffle fluide et ont des sons plus doux.",
        tempsAudio: 55,
        affichage: false,
        actions: { showCircle: false, showTable: false, showVowelsAnimation: true },
      },
      {
        texte: "Elles représentent votre véritable être, souvent caché, et révèlent vos désirs les plus profonds.",
        tempsAudio: 60,
        affichage: false,
      },
      {
        texte: "Après avoir analysé les voyelles de votre nom et prénom",
        tempsAudio: 90,
        affichage: false,
        actions: { showCircle: true, showTable: false, showVowelsAnimation: false, showNumberInCircle: true },
      },
      {
        texte: "Vous êtes intuitif, puissant et pragmatique.",
        tempsAudio: 100,
        affichage: false,
        actions: { showCircle: true, showTable: false, showVowelsAnimation: false, showNumberInCircle: false },
      },
      // Ajouter d'autres points d'ancrage au besoin
    ]

    pointsAncrageRef.current = pointsAncrage
  }

  // Fonction pour avancer automatiquement les sous-titres
  const avancerSousTitresAutomatiquement = () => {
    // Si aucun sous-titre n'est affiché, afficher le premier
    if (!sousTitreActuel && sousTitresRef.current.length > 0) {
      setSousTitreActuel(sousTitresRef.current[0])
      setCurrentSousTitreIndex(0)
      return
    }

    // Si le dernier sous-titre a été affiché il y a plus de 5 secondes, passer au suivant
    const maintenant = Date.now()
    if (maintenant - lastSousTitreUpdateRef.current > 5000) {
      const prochainIndex = currentSousTitreIndex + 1
      if (prochainIndex < sousTitresRef.current.length) {
        setSousTitreActuel(sousTitresRef.current[prochainIndex])
        setCurrentSousTitreIndex(prochainIndex)
        lastSousTitreUpdateRef.current = maintenant

        // Vérifier si ce sous-titre correspond à un point d'ancrage
        const pointAncrage = pointsAncrageRef.current.find((p) => p.texte === sousTitresRef.current[prochainIndex])
        if (pointAncrage && pointAncrage.actions) {
          if (pointAncrage.actions.showCircle !== undefined) setShowCircle(pointAncrage.actions.showCircle)
          if (pointAncrage.actions.showTable !== undefined) setShowTable(pointAncrage.actions.showTable)
          if (pointAncrage.actions.showVowelsAnimation !== undefined)
            setShowVowelsAnimation(pointAncrage.actions.showVowelsAnimation)
          if (pointAncrage.actions.showNumberInCircle !== undefined)
            setShowNumberInCircle(pointAncrage.actions.showNumberInCircle)
          if (pointAncrage.actions.forceTableRender) {
            setTableKey((prev) => prev + 1)
            setTableForceRender((prev) => !prev)
          }
        }
      }
    }
  }

  // Remplacer la fonction updateSousTitre par cette version simplifiée qui force l'avancement
  const updateSousTitre = () => {
    // Afficher immédiatement le premier sous-titre, même si l'audio n'a pas commencé
    if (!sousTitreActuel && sousTitresRef.current.length > 0) {
      console.log("Affichage du premier sous-titre")
      setSousTitreActuel(sousTitresRef.current[0])
      setCurrentSousTitreIndex(0)
      lastSousTitreUpdateRef.current = Date.now()
      return
    }

    // FORCER l'avancement des sous-titres toutes les 3 secondes, peu importe l'état de l'audio
    const maintenant = Date.now()
    if (maintenant - lastSousTitreUpdateRef.current > 3000) {
      // Réduit à 3 secondes pour avancer plus rapidement
      const prochainIndex = currentSousTitreIndex + 1
      if (prochainIndex < sousTitresRef.current.length) {
        console.log(`FORÇAGE avancement au sous-titre ${prochainIndex}`)
        setSousTitreActuel(sousTitresRef.current[prochainIndex])
        setCurrentSousTitreIndex(prochainIndex)
        lastSousTitreUpdateRef.current = maintenant

        // Vérifier si ce sous-titre correspond à un point d'ancrage
        const pointAncrage = pointsAncrageRef.current.find((p) => p.texte === sousTitresRef.current[prochainIndex])
        if (pointAncrage && pointAncrage.actions) {
          if (pointAncrage.actions.showCircle !== undefined) setShowCircle(pointAncrage.actions.showCircle)
          if (pointAncrage.actions.showTable !== undefined) setShowTable(pointAncrage.actions.showTable)
          if (pointAncrage.actions.showVowelsAnimation !== undefined)
            setShowVowelsAnimation(pointAncrage.actions.showVowelsAnimation)
          if (pointAncrage.actions.showNumberInCircle !== undefined)
            setShowNumberInCircle(pointAncrage.actions.showNumberInCircle)
          if (pointAncrage.actions.forceTableRender) {
            setTableKey((prev) => prev + 1)
            setTableForceRender((prev) => !prev)
          }
        }
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

    // Initialiser les points d'ancrage pour la synchronisation
    initialiserPointsAncrage()

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
      if (forceUpdateTimerRef.current) {
        clearTimeout(forceUpdateTimerRef.current)
      }
      if (audio) {
        audio.pause()
        audio.src = ""
      }
    }
  }, [])

  // Effet pour précharger et démarrer l'audio principal immédiatement
  useEffect(() => {
    if (!isLoading && mounted && !audioStarted) {
      // Afficher immédiatement le premier sous-titre
      if (sousTitresRef.current.length > 0) {
        setSousTitreActuel(sousTitresRef.current[0])
        setCurrentSousTitreIndex(0)
        lastSousTitreUpdateRef.current = Date.now()
      }

      setAudioStarted(true)
      console.log("Démarrage de l'audio et des sous-titres...")

      // Enregistrer le temps de début pour la synchronisation
      audioStartTimeRef.current = Date.now()

      // Remplacer la configuration de l'intervalle pour mettre à jour les sous-titres plus fréquemment
      // Dans l'effet useEffect qui commence par if (!isLoading && mounted && !audioStarted)
      // Remplacer ces lignes:
      // Configurer l'intervalle pour mettre à jour les sous-titres - PLUS FRÉQUENT
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current)
      }
      // Mettre à jour les sous-titres plus fréquemment pour une meilleure synchronisation
      updateIntervalRef.current = setInterval(updateSousTitre, 250)

      // Par celles-ci:
      // Configurer l'intervalle pour mettre à jour les sous-titres - BEAUCOUP PLUS FRÉQUENT
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current)
      }
      // Mettre à jour les sous-titres très fréquemment pour garantir l'avancement
      updateIntervalRef.current = setInterval(updateSousTitre, 100)

      // Prendre juste le début du texte pour commencer immédiatement - texte plus court pour un chargement ultra rapide
      const premierSegment = texteNarrationComplet.substring(0, 150) // Réduire encore plus pour un chargement plus rapide
      console.log("Lecture immédiate du premier segment (ultra court)")

      // Créer un nouvel élément audio pour ce segment
      const audio = new Audio()
      audio.src = `/api/speech?text=${encodeURIComponent(premierSegment)}&segment=0&t=${Date.now()}&priority=high`

      // Tenter de précharger l'audio
      audio.preload = "auto"

      // Stocker l'audio dans la référence
      mainAudioRef.current = audio

      // Fonction pour retenter la lecture en cas d'échec
      const retryPlay = (retries = 3) => {
        audio.play().catch((error) => {
          console.error(`Erreur lors de la lecture immédiate (essai ${4 - retries}/3):`, error)
          audioErrorCountRef.current++

          if (retries > 0) {
            setTimeout(() => retryPlay(retries - 1), 500)
          } else {
            console.error("Impossible de démarrer l'audio après plusieurs tentatives")
            // Même en cas d'échec, continuer à avancer les sous-titres
            // Configurer un intervalle pour avancer automatiquement les sous-titres
            if (updateIntervalRef.current) {
              clearInterval(updateIntervalRef.current)
            }
            updateIntervalRef.current = setInterval(avancerSousTitresAutomatiquement, 5000)

            // Passer quand même au préchargement du reste du texte
            prepareNextSegments()
          }
        })
      }

      // Démarrer la lecture immédiatement avec mécanisme de nouvel essai
      retryPlay()

      // Fonction pour préparer les segments suivants
      const prepareNextSegments = () => {
        // Diviser le reste du texte en segments plus petits pour un chargement plus rapide
        const maxChars = 200 // Segments encore plus petits pour un chargement plus rapide
        const segments = []
        let currentSegment = ""

        // Commencer à partir du deuxième segment (après les 150 premiers caractères)
        const resteTexte = texteNarrationComplet.substring(150)

        // Diviser le texte en respectant les phrases
        const phrases = resteTexte.split(/(?<=[.!?])\s+/)
        for (const phrase of phrases) {
          if ((currentSegment + phrase).length <= maxChars) {
            currentSegment += (currentSegment ? " " : "") + phrase
          } else {
            if (currentSegment) {
              segments.push(currentSegment)
            }
            currentSegment = phrase
          }
        }
        if (currentSegment) {
          segments.push(currentSegment)
        }

        console.log(`Reste du texte divisé en ${segments.length} segments plus petits pour chargement rapide`)

        // Précharger les 2 premiers segments en parallèle
        const preloadFirstSegments = Math.min(2, segments.length)
        for (let i = 0; i < preloadFirstSegments; i++) {
          const preloadAudio = new Audio()
          preloadAudio.src = `/api/speech?text=${encodeURIComponent(segments[i])}&segment=${i + 1}&t=${Date.now()}`
          preloadAudio.preload = "auto"
          console.log(`Préchargement du segment ${i + 1}`)
        }

        // Fonction pour jouer les segments audio en séquence
        const playNextSegment = (index) => {
          if (index >= segments.length) {
            console.log("Tous les segments audio ont été lus")
            return
          }

          console.log(`Lecture du segment ${index + 1}/${segments.length}`)

          // Créer un nouvel élément audio pour ce segment
          const nextAudio = new Audio()
          nextAudio.src = `/api/speech?text=${encodeURIComponent(segments[index])}&segment=${index + 1}&t=${Date.now()}`

          // Stocker l'audio dans la référence
          mainAudioRef.current = nextAudio

          // Configurer l'événement de fin pour passer au segment suivant
          nextAudio.onended = () => {
            // Précharger le segment après le prochain pour une lecture continue
            if (index + 2 < segments.length) {
              const preloadNextAudio = new Audio()
              preloadNextAudio.src = `/api/speech?text=${encodeURIComponent(segments[index + 2])}&segment=${index + 3}&t=${Date.now()}`
              preloadNextAudio.preload = "auto"
            }
            // Jouer le segment suivant
            playNextSegment(index + 1)
          }

          // Gérer les erreurs avec retentative
          const retrySegmentPlay = (retries = 2) => {
            nextAudio.play().catch((error) => {
              console.error(`Erreur lors de la lecture du segment ${index + 1}:`, error)
              audioErrorCountRef.current++

              if (retries > 0) {
                setTimeout(() => retrySegmentPlay(retries - 1), 1000)
              } else {
                console.error(`Abandon de la lecture du segment ${index + 1} après échecs`)
                // Même en cas d'échec, continuer à avancer les sous-titres
                if (audioErrorCountRef.current > 3 && updateIntervalRef.current) {
                  // Si trop d'erreurs, passer en mode sous-titres automatiques
                  clearInterval(updateIntervalRef.current)
                  updateIntervalRef.current = setInterval(avancerSousTitresAutomatiquement, 5000)
                }
                playNextSegment(index + 1) // Passer au suivant malgré l'échec
              }
            })
          }

          // Démarrer la lecture avec système de retry
          retrySegmentPlay()
        }

        // Configurer l'événement de fin pour le premier segment
        audio.onended = () => {
          playNextSegment(0)
        }
      }

      // Démarrer le préchargement après un court délai
      setTimeout(prepareNextSegments, 100)

      // Ajouter un système de secours qui force l'avancement des sous-titres
      console.log("Configuration du système de secours pour les sous-titres")
      setTimeout(() => {
        // Après 5 secondes, vérifier si les sous-titres avancent
        if (currentSousTitreIndex < 1) {
          console.log("SYSTÈME DE SECOURS ACTIVÉ: Les sous-titres semblent bloqués")
          // Forcer l'avancement au sous-titre suivant
          if (sousTitresRef.current.length > 1) {
            setSousTitreActuel(sousTitresRef.current[1])
            setCurrentSousTitreIndex(1)
            lastSousTitreUpdateRef.current = Date.now()
          }

          // Mettre en place un intervalle de secours qui avance les sous-titres quoi qu'il arrive
          const backupInterval = setInterval(() => {
            const nextIndex = currentSousTitreIndex + 1
            if (nextIndex < sousTitresRef.current.length) {
              console.log(`SYSTÈME DE SECOURS: Avancement forcé au sous-titre ${nextIndex}`)
              setSousTitreActuel(sousTitresRef.current[nextIndex])
              setCurrentSousTitreIndex(nextIndex)
              lastSousTitreUpdateRef.current = Date.now()
            } else {
              clearInterval(backupInterval)
            }
          }, 3000) // Avancer toutes les 3 secondes quoi qu'il arrive
        }
      }, 5000)
    }
  }, [isLoading, mounted, audioStarted, texteNarrationComplet])

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

        {/* Tableau numérologique - UNIQUEMENT affiché quand showTable est true */}
        {showTable && fullName && (
          <motion.div
            className="w-full max-w-3xl flex flex-col items-center justify-center mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            key={`table-${tableKey}`}
          >
            <NumerologyTableAme
              name={fullName}
              forceRender={tableForceRender}
              onComplete={() => {
                console.log("Animation du tableau terminée")
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
                console.log("Animation du tableau terminée")
              }}
              delay={500}
            />
          </motion.div>
        )}

        {/* Animation des voyelles - UNIQUEMENT affichée quand showVowelsAnimation est true */}
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

        {/* Cercle avec image - UNIQUEMENT affiché quand showCircle est true */}
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
