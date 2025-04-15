"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"

interface NumerologyTableAmeProps {
  name: string
  onComplete?: () => void
  delay?: number
  forceRender?: boolean
}

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

// Fonction pour vérifier si une lettre est une voyelle
const isVowel = (letter: string): boolean => {
  return ["A", "E", "I", "O", "U", "Y"].includes(letter.toUpperCase())
}

export function NumerologyTableAme({ name, onComplete, delay = 0, forceRender = false }: NumerologyTableAmeProps) {
  // États pour les animations
  const [activeLetterIndex, setActiveLetterIndex] = useState(-1)
  const [displayedLetterIndices, setDisplayedLetterIndices] = useState<number[]>([])
  const [highlightVowels, setHighlightVowels] = useState(false)
  const [showEquation, setShowEquation] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [animationStarted, setAnimationStarted] = useState(false)
  const [animationComplete, setAnimationComplete] = useState(false)

  // Référence pour les timeouts
  const timeoutsRef = useRef<NodeJS.Timeout[]>([])

  // Normaliser le nom (majuscules, sans accents)
  const normalizedName = name
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

  // Extraire uniquement les lettres valides (A-Z) et les espaces
  const validChars = normalizedName.split("").filter((char) => /[A-Z\s]/.test(char))

  // Extraire uniquement les lettres valides (A-Z) sans les espaces pour l'animation
  const validLetters = validChars.filter((char) => /[A-Z]/.test(char))

  console.log("Valid letters in normalizedName:", validLetters)
  console.log("Valid chars including spaces:", validChars)

  // Générer la grille de lettres
  const rows = [
    ["A", "B", "C", "D", "E", "F", "G", "H", "I"],
    ["J", "K", "L", "M", "N", "O", "P", "Q", "R"],
    ["S", "T", "U", "V", "W", "X", "Y", "Z", ""],
  ]

  // Calculer les valeurs pour l'équation
  const vowels = validLetters.filter((letter) => isVowel(letter))
  const vowelValues = vowels.map((letter) => letterToNumber[letter] || 0)
  const sum = vowelValues.reduce((acc, val) => acc + val, 0)

  // Démarrer l'animation
  const startAnimation = () => {
    if (animationStarted || validLetters.length === 0) return

    setAnimationStarted(true)
    console.log("Starting animation with letters:", validLetters)

    // Nettoyer les timeouts précédents
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []

    // PHASE 1: Mettre en évidence les lettres dans le tableau une par une
    validLetters.forEach((letter, index) => {
      // Mettre en évidence la lettre dans le tableau
      const highlightTimeout = setTimeout(
        () => {
          console.log(`Highlighting letter ${letter} at index ${index}`)
          setActiveLetterIndex(index)
        },
        delay + 1500 * index, // Ralenti à 1.5 secondes par lettre
      )
      timeoutsRef.current.push(highlightTimeout)

      // Afficher la lettre en bas du tableau après un court délai
      const displayTimeout = setTimeout(
        () => {
          console.log(`Displaying letter ${letter} at index ${index}`)
          setDisplayedLetterIndices((prev) => [...prev, index])
        },
        delay + 1500 * index + 500, // Afficher 0.5 seconde après la mise en évidence
      )
      timeoutsRef.current.push(displayTimeout)
    })

    // PHASE 2: Mettre en évidence uniquement les voyelles (griser les consonnes)
    const highlightVowelsTimeout = setTimeout(
      () => {
        console.log("Highlighting only vowels")
        setHighlightVowels(true)
      },
      delay + 1500 * validLetters.length + 1500, // Attendre 1.5 seconde après la dernière lettre
    )
    timeoutsRef.current.push(highlightVowelsTimeout)

    // PHASE 3: Afficher l'équation avec les voyelles
    const equationTimeout = setTimeout(
      () => {
        console.log("Showing equation")
        setShowEquation(true)
      },
      delay + 1500 * validLetters.length + 3000, // Attendre 3 secondes après la dernière lettre
    )
    timeoutsRef.current.push(equationTimeout)

    // PHASE 4: Afficher le résultat final
    const resultTimeout = setTimeout(
      () => {
        console.log("Showing result")
        setShowResult(true)
      },
      delay + 1500 * validLetters.length + 4500, // Attendre 4.5 secondes après la dernière lettre
    )
    timeoutsRef.current.push(resultTimeout)

    // PHASE 5: Animation terminée
    const completeTimeout = setTimeout(
      () => {
        console.log("Animation complete")
        setAnimationComplete(true)

        if (onComplete) {
          console.log("Calling onComplete with delay")
          // Ajouter un délai avant d'appeler onComplete
          setTimeout(() => {
            onComplete()
          }, 2000) // Attendre 2 secondes avant de passer à l'étape suivante
        }
      },
      delay + 1500 * validLetters.length + 7000, // Attendre 7 secondes après la dernière lettre
    )
    timeoutsRef.current.push(completeTimeout)
  }

  // Effet pour démarrer l'animation au premier rendu ou lorsque forceRender change
  useEffect(() => {
    console.log("Component mounted or forceRender changed:", forceRender)

    // Réinitialiser les états
    setActiveLetterIndex(-1)
    setDisplayedLetterIndices([])
    setHighlightVowels(false)
    setShowEquation(false)
    setShowResult(false)
    setAnimationComplete(false)
    setAnimationStarted(false)

    // Démarrer l'animation après un court délai
    const startTimer = setTimeout(() => {
      startAnimation()
    }, 800)

    return () => {
      clearTimeout(startTimer)
      timeoutsRef.current.forEach(clearTimeout)
    }
  }, [name, forceRender])

  // Si pas de lettres valides, appeler onComplete directement
  useEffect(() => {
    if (validLetters.length === 0 && onComplete && !animationComplete) {
      console.warn("No valid letters found in name:", name)
      const fallbackTimeout = setTimeout(() => {
        console.log("No valid letters, calling onComplete directly")
        setAnimationComplete(true)
        onComplete()
      }, 1000)
      return () => clearTimeout(fallbackTimeout)
    }
  }, [validLetters, onComplete, animationComplete, name])

  // Fonction pour déterminer si une cellule doit être mise en évidence
  const isCellHighlighted = (letter: string) => {
    if (activeLetterIndex < 0 || activeLetterIndex >= validLetters.length) return false
    // Vérifier uniquement si la lettre actuelle correspond à la lettre active
    return letter === validLetters[activeLetterIndex]
  }

  // Fonction pour déterminer si une cellule a déjà été mise en évidence
  const isCellPreviouslyHighlighted = (letter: string) => {
    if (activeLetterIndex < 0) return false

    // Vérifier si la lettre apparaît dans les lettres précédemment activées
    // mais uniquement aux positions précédentes, pas toutes les occurrences
    for (let i = 0; i < activeLetterIndex; i++) {
      if (validLetters[i] === letter) {
        return true
      }
    }
    return false
  }

  // Fonction pour déterminer la classe CSS d'une cellule du tableau
  const getCellClass = (letter: string) => {
    if (letter === "") return "bg-black/80 text-white"

    if (isCellHighlighted(letter)) {
      return "bg-purple-600 text-white" // Lettre active en violet
    }

    if (isCellPreviouslyHighlighted(letter)) {
      if (highlightVowels) {
        return isVowel(letter)
          ? "bg-purple-600 text-white" // Voyelles en violet
          : "bg-gray-600/50 text-gray-300" // Consonnes en gris transparent
      }
      return "bg-purple-600/80 text-white" // Lettre précédemment active en violet transparent
    }

    return "bg-black/80 text-white" // Lettres non mises en évidence en noir
  }

  // Fonction pour vérifier si une lettre spécifique à une position spécifique est affichée
  const isLetterDisplayed = (index: number) => {
    return displayedLetterIndices.includes(index)
  }

  // Fonction pour vérifier si une lettre est la dernière affichée
  const isLatestDisplayed = (index: number) => {
    if (displayedLetterIndices.length === 0) return false
    return index === displayedLetterIndices[displayedLetterIndices.length - 1]
  }

  return (
    <div className="flex flex-col items-center justify-center">
      {/* Tableau numérologique */}
      <div className="grid grid-cols-9 gap-px bg-white/20 max-w-[500px] w-full">
        {/* Ligne des chiffres */}
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <div
            key={`num-${num}`}
            className="bg-black/80 p-2 sm:p-3 text-center font-bold text-yellow-400 text-sm sm:text-base"
          >
            {num}
          </div>
        ))}

        {/* Lignes des lettres */}
        {rows.map((row, rowIndex) =>
          row.map((letter, colIndex) => (
            <motion.div
              key={`${rowIndex}-${colIndex}`}
              className={`p-2 sm:p-3 text-center font-bold text-sm sm:text-base ${getCellClass(letter)}`}
              animate={
                isCellHighlighted(letter)
                  ? {
                      scale: [1, 1.2, 1],
                      transition: { duration: 0.5 },
                    }
                  : {}
              }
            >
              {letter}
            </motion.div>
          )),
        )}
      </div>

      {/* Affichage des lettres sélectionnées en bas */}
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {validChars.map((char, index) => {
          // Si c'est un espace, afficher un espace plus large
          if (char === " ") {
            return <div key={`space-${index}`} className="w-4 sm:w-6"></div>
          }

          // Trouver l'index de cette lettre dans validLetters (sans les espaces)
          // Calculer l'index réel dans validLetters en comptant les lettres précédentes (sans les espaces)
          const letterIndex = validChars.slice(0, index).filter((c) => /[A-Z]/.test(c)).length

          // Vérifier si cette lettre est affichée et si c'est la dernière affichée
          const isDisplayed = isLetterDisplayed(letterIndex)
          const isLatest = isLatestDisplayed(letterIndex)

          return (
            <motion.div
              key={`letter-${index}`}
              className={`w-8 h-8 sm:w-12 sm:h-12 flex items-center justify-center rounded-md ${
                isDisplayed
                  ? highlightVowels && !isVowel(char)
                    ? "bg-gray-600/50 text-gray-300"
                    : "bg-purple-600 text-white"
                  : "bg-black/50 text-gray-400"
              }`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={
                isDisplayed
                  ? {
                      opacity: 1,
                      scale: isLatest ? [1, 1.2, 1] : 1,
                      transition: { duration: 0.5 },
                    }
                  : { opacity: 0, scale: 0.8 }
              }
            >
              <span className="text-base sm:text-xl font-bold">{char}</span>
            </motion.div>
          )
        })}
      </div>

      {/* Affichage de l'équation avec uniquement les voyelles */}
      {showEquation && (
        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-xl sm:text-2xl font-bold text-white">
            {vowelValues.map((value, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.2, duration: 0.5 }}
              >
                {index > 0 && <span className="text-teal-400 mx-1 sm:mx-2">+</span>}
                <span className="text-white">{value}</span>
              </motion.span>
            ))}
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: vowelValues.length * 0.2, duration: 0.5 }}
            >
              <span className="text-teal-400 mx-1 sm:mx-2">=</span>
              <span className="text-yellow-300 text-2xl sm:text-3xl">{sum}</span>
            </motion.span>
          </div>
        </motion.div>
      )}

      {/* Affichage du résultat final */}
      {showResult && (
        <motion.div
          className="mt-8"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, type: "spring", stiffness: 120, damping: 8 }}
        >
          <motion.div
            className="text-6xl sm:text-8xl font-bold text-white bg-gradient-to-r from-purple-500 to-purple-700 px-8 py-6 rounded-lg"
            animate={{
              boxShadow: [
                "0 0 20px rgba(147, 51, 234, 0.3)",
                "0 0 40px rgba(147, 51, 234, 0.6)",
                "0 0 20px rgba(147, 51, 234, 0.3)",
              ],
            }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" }}
            style={{ textShadow: "0 0 20px rgba(255, 255, 255, 0.7), 0 0 40px rgba(255, 255, 255, 0.4)" }}
          >
            {sum}
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
