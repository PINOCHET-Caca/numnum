"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { InfinityIcon, PlayCircle } from "lucide-react"

export default function Inscription() {
  const [genre, setGenre] = useState<string>("")
  const [nomComplet, setNomComplet] = useState<string>("")
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  // S'assurer que le composant est monté côté client
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (genre && nomComplet) {
      // Indiquer que l'utilisateur a interagi avec la page
      localStorage.setItem("userInteracted", "true")

      // Rediriger vers la page de résultat avec les paramètres
      const params = new URLSearchParams()
      params.append("genre", genre)
      params.append("nomComplet", nomComplet)

      // Utiliser window.location pour une redirection immédiate
      window.location.href = `/resultat?${params.toString()}`
    }
  }

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

  if (!mounted) {
    return <div className="min-h-screen bg-black"></div>
  }

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-start overflow-hidden bg-black">
      {/* Overlay pour l'effet spatial */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/30 via-black/70 to-purple-900/30 z-0"></div>

      {/* En-tête avec logo */}
      <div className="w-full bg-gradient-to-r from-indigo-900/80 to-purple-900/80 backdrop-blur-sm py-4 z-20">
        <div className="container mx-auto flex justify-center items-center">
          <InfinityIcon className="h-8 w-8 text-teal-400 mr-2" />
          <h1 className="text-2xl font-bold text-white">Numérologie</h1>
        </div>
      </div>

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
            repeat: 999999,
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
            repeat: 999999,
            repeatType: "loop",
            ease: "linear",
          }}
        >
          {num.value}
        </motion.div>
      ))}

      {/* Contenu principal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="z-20 flex flex-col items-center w-full max-w-4xl mt-12 md:mt-20 px-4"
      >
        {/* Titre et sous-titre */}
        <div className="text-center mb-8 md:mb-12 w-full">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-2xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-3 md:mb-4 px-2 md:px-4"
          >
            Pour obtenir votre lecture d'Expression personnalisée GRATUITE
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg md:text-xl text-white max-w-3xl mx-auto px-2 md:px-4"
          >
            Complétez les informations ci-dessous...
          </motion.p>
        </div>

        <div className="w-full max-w-3xl flex flex-col md:flex-row items-start justify-between gap-6 md:gap-8">
          {/* Formulaire */}
          <div className="w-full md:w-2/3 bg-black/60 backdrop-blur-md p-6 rounded-xl border border-teal-500/30">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-pink-600 flex items-center justify-center text-white font-bold mr-3">
                    1
                  </div>
                  <Label htmlFor="genre" className="text-white text-lg">
                    Votre Genre
                  </Label>
                </div>
                <Select value={genre} onValueChange={setGenre} required>
                  <SelectTrigger className="bg-teal-900/30 border-teal-500/50 text-white">
                    <SelectValue placeholder="Sélectionnez votre genre" />
                  </SelectTrigger>
                  <SelectContent className="bg-indigo-900 border-teal-500/50 text-white">
                    <SelectItem value="femme">Femme</SelectItem>
                    <SelectItem value="homme">Homme</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-pink-600 flex items-center justify-center text-white font-bold mr-3">
                    2
                  </div>
                  <Label htmlFor="nomComplet" className="text-white text-lg">
                    Votre Nom Complet de Naissance
                  </Label>
                </div>
                <Input
                  id="nomComplet"
                  value={nomComplet}
                  onChange={(e) => setNomComplet(e.target.value)}
                  placeholder="Entrez votre nom complet de naissance"
                  required
                  className="bg-teal-900/30 border-teal-500/50 text-white"
                />
              </div>

              <div className="pt-4">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 rounded-full bg-pink-600 flex items-center justify-center text-white font-bold mr-3">
                    3
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white py-6 h-auto text-lg font-medium"
                >
                  CONTINUER AVEC MA LECTURE
                </Button>
              </div>
            </form>
          </div>

          {/* Encadré d'information */}
          <div className="w-full md:w-1/3 bg-black/60 backdrop-blur-md p-6 rounded-xl border border-pink-500/30">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-pink-600/80 flex items-center justify-center mb-4">
                <PlayCircle className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Analyse du Nom d'Expression</h3>
              <p className="text-gray-300 text-sm">
                Découvrez la signification profonde de votre nom et comment il influence votre destinée, vos talents et
                votre potentiel caché.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </main>
  )
}
