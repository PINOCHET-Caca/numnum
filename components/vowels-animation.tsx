"use client"

import { useState } from "react"
import { motion } from "framer-motion"

interface VowelsAnimationProps {
  name: string
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

export function VowelsAnimation({ name }: VowelsAnimationProps) {
  const [visible, setVisible] = useState(true) // Commencer visible immédiatement

  // Normaliser le nom (majuscules, sans accents)
  const normalizedName = name
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

  // Extraire uniquement les lettres valides (A-Z) et les espaces
  const validChars = normalizedName.split("").filter((char) => /[A-Z\s]/.test(char))

  return (
    <div className="flex flex-col items-center justify-center w-full">
      {/* Animation des lettres avec leurs valeurs numériques */}
      <div className="flex flex-wrap justify-center gap-1 mb-8">
        {validChars.map((char, index) => {
          // Si c'est un espace, afficher un espace plus large
          if (char === " ") {
            return <div key={`space-${index}`} className="w-4 sm:w-6"></div>
          }

          const isVowelChar = isVowel(char)
          const numberValue = letterToNumber[char] || 0

          return (
            <div key={`char-${index}`} className="flex flex-col items-center">
              {/* Afficher le nombre uniquement pour les voyelles */}
              {isVowelChar && (
                <motion.div
                  className="w-8 h-8 sm:w-10 sm:h-10 bg-white text-black flex items-center justify-center font-bold text-lg mb-1"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : -10 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  {numberValue}
                </motion.div>
              )}

              {/* Afficher la lettre avec une couleur différente pour les voyelles */}
              <motion.div
                className={`w-8 h-8 sm:w-10 sm:h-10 ${
                  isVowelChar
                    ? "bg-gradient-to-br from-pink-500 to-purple-600 text-white"
                    : "bg-gray-700/50 text-gray-400"
                } flex items-center justify-center font-bold text-lg`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: visible ? 1 : 0, scale: visible ? 1 : 0.8 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                {char}
              </motion.div>
            </div>
          )
        })}
      </div>

      {/* Affichage de l'équation avec uniquement les voyelles */}
      <motion.div
        className="mt-4 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
      >
        <div className="text-xl sm:text-2xl font-bold text-white">
          {validChars
            .filter((char) => isVowel(char))
            .map((vowel, index) => {
              const value = letterToNumber[vowel] || 0
              return (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.2, duration: 0.5 }}
                >
                  {index > 0 && <span className="text-teal-400 mx-1 sm:mx-2">+</span>}
                  <span className="text-white">{value}</span>
                </motion.span>
              )
            })}
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5, duration: 0.5 }}>
            <span className="text-teal-400 mx-1 sm:mx-2">=</span>
            <span className="text-yellow-300 text-2xl sm:text-3xl">
              {validChars.filter((char) => isVowel(char)).reduce((sum, vowel) => sum + (letterToNumber[vowel] || 0), 0)}
            </span>
          </motion.span>
        </div>
      </motion.div>

      {/* Résultat final */}
      <motion.div
        className="mt-8"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: visible ? 1 : 0, scale: visible ? 1 : 0.5 }}
        transition={{
          duration: 0.8,
          delay: validChars.length * 0.1 + 2,
          type: "spring",
          stiffness: 120,
          damping: 8,
        }}
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
          {validChars.filter((char) => isVowel(char)).reduce((sum, vowel) => sum + (letterToNumber[vowel] || 0), 0)}
        </motion.div>
      </motion.div>
    </div>
  )
}
