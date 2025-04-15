"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"

interface NumerologyTableProps {
  name: string
  onComplete?: () => void
  delay?: number
  highlightVowelsOnly?: boolean
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

export function NumerologyTable({ name, onComplete, delay = 0, highlightVowelsOnly = false }: NumerologyTableProps) {
  // États pour les animations
  const [displayedLetters, setDisplayedLetters] = useState<string[]>([])
  const [highlightVowels, setHighlightVowels] = useState(false)
  const [showEquation, setShowEquation] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [animationComplete, setAnimationComplete] = useState(false)

  // Référence pour les timeouts
  const timeoutsRef = useRef<NodeJS.Timeout[]>([])

  // Normaliser le nom (majuscules, sans accents)
  const normalizedName = name
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

  // Extraire uniquement les lettres valides (A-Z)
  const validLetters = normalizedName.split("").filter((letter) => /[A-Z]/.test(letter))

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

  // Effet pour gérer l'animation
  useEffect(() => {
    console.log("Animation effect running with name:", name)

    // Nettoyer les timeouts précédents
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []

    // Réinitialiser les états
    setDisplayedLetters([])
    setHighlightVowels(false)
    setShowEquation(false)
    setShowResult(false)
    setAnimationComplete(false)

    if (validLetters.length > 0) {
      console.log("Starting animation with valid letters:", validLetters)

      // PHASE 1: Afficher toutes les lettres une par une (en violet)
      validLetters.forEach((letter, index) => {
        const timeout = setTimeout(
          () => {
            console.log(`Adding letter ${letter} at index ${index}`)
            setDisplayedLetters((prev) => [...prev, letter])
          },
          delay + 200 * (index + 1),
        )
        timeoutsRef.current.push(timeout)
      })

      // PHASE 2: Mettre en évidence uniquement les voyelles (griser les consonnes)
      const highlightTimeout = setTimeout(
        () => {
          console.log("Highlighting only vowels")
          setHighlightVowels(true)
        },
        delay + 200 * (validLetters.length + 1) + 1000,
      )
      timeoutsRef.current.push(highlightTimeout)

      // PHASE 3: Afficher l'équation avec les voyelles
      const equationTimeout = setTimeout(
        () => {
          console.log("Showing equation")
          setShowEquation(true)
        },
        delay + 200 * (validLetters.length + 1) + 2000,
      )
      timeoutsRef.current.push(equationTimeout)

      // PHASE 4: Afficher le résultat final
      const resultTimeout = setTimeout(
        () => {
          console.log("Showing result")
          setShowResult(true)
        },
        delay + 200 * (validLetters.length + 1) + 3000,
      )
      timeoutsRef.current.push(resultTimeout)

      // PHASE 5: Animation terminée
      const completeTimeout = setTimeout(
        () => {
          console.log("Animation complete")
          setAnimationComplete(true)

          if (onComplete) {
            console.log("Calling onComplete")
            onComplete()
          }
        },
        delay + 200 * (validLetters.length + 1) + 4500,
      )
      timeoutsRef.current.push(completeTimeout)
    }

    return () => {
      console.log("Cleaning up timeouts")
      timeoutsRef.current.forEach(clearTimeout)
    }
  }, [name, validLetters, delay, onComplete])

  // Fonction pour déterminer si une lettre est affichée dans le tableau
  const isLetterDisplayed = (letter: string) => {
    return validLetters.includes(letter) && displayedLetters.includes(letter)
  }

  // Fonction pour déterminer la classe CSS d'une cellule du tableau
  const getCellClass = (letter: string) => {
    if (letter === "") return "bg-black/80 text-white"

    if (isLetterDisplayed(letter)) {
      if (highlightVowels) {
        return isVowel(letter)
          ? "bg-purple-600 text-white" // Voyelles en violet
          : "bg-gray-600/50 text-gray-300" // Consonnes en gris transparent
      }
      return "bg-purple-600 text-white" // Toutes les lettres en violet
    }

    return "bg-black/80 text-white" // Lettres non affichées en noir
  }

  // Fonction pour déterminer la classe CSS d'une lettre dans le nom
  const getNameLetterClass = (letter: string) => {
    if (displayedLetters.includes(letter)) {
      if (highlightVowels) {
        return isVowel(letter)
          ? "bg-purple-600 text-white" // Voyelles en violet
          : "bg-gray-600/50 text-gray-300" // Consonnes en gris transparent
      }
      return "bg-purple-600 text-white" // Toutes les lettres en violet
    }
    return "bg-black/50 text-gray-400" // Lettres non affichées en noir transparent
  }

  return (
    <div className="flex flex-col items-center justify-center">
      {/* Tableau numérologique */}
      <div className="grid grid-cols-9 gap-px bg-white/20 max-w-[500px]">
        {/* Ligne des chiffres */}
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <div key={`num-${num}`} className="bg-black/80 p-3 text-center font-bold text-yellow-400 text-base">
            {num}
          </div>
        ))}

        {/* Lignes des lettres */}
        {rows.map((row, rowIndex) =>
          row.map((letter, colIndex) => (
            <motion.div
              key={`${rowIndex}-${colIndex}`}
              className={`p-3 text-center font-bold ${getCellClass(letter)}`}
              animate={
                isLetterDisplayed(letter) && displayedLetters[displayedLetters.length - 1] === letter
                  ? {
                      scale: [1, 1.2, 1],
                      transition: { duration: 0.3 },
                    }
                  : {}
              }
            >
              {letter}
            </motion.div>
          )),
        )}
      </div>

      {/* Affichage du nom avec les lettres mises en évidence */}
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {normalizedName.split("").map((char, index) => {
          if (char === " " || !/[A-Z]/.test(char)) {
            return <div key={`space-${index}`} className="w-4"></div>
          }

          const isLastDisplayed = displayedLetters.length > 0 && displayedLetters[displayedLetters.length - 1] === char

          return (
            <motion.div
              key={`char-${index}`}
              className={`w-12 h-12 flex items-center justify-center rounded-md ${getNameLetterClass(char)}`}
              animate={
                isLastDisplayed
                  ? {
                      scale: [1, 1.2, 1],
                      transition: { duration: 0.3 },
                    }
                  : {}
              }
            >
              <span className="text-xl font-bold">{char}</span>
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
          <div className="text-2xl font-bold text-white">
            {vowelValues.map((value, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
              >
                {index > 0 && <span className="text-teal-400 mx-2">+</span>}
                <span className="text-white">{value}</span>
              </motion.span>
            ))}
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: vowelValues.length * 0.1, duration: 0.3 }}
            >
              <span className="text-teal-400 mx-2">=</span>
              <span className="text-yellow-300 text-3xl">{sum}</span>
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
            className="text-8xl font-bold text-white bg-gradient-to-r from-purple-500 to-purple-700 px-12 py-8 rounded-lg"
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
