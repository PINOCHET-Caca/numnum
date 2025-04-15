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
import Image from "next/image"

export default function NombreDeLAme() {
  const [email, setEmail] = useState<string>("")
  const [statut, setStatut] = useState<string>("")
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  // S'assurer que le composant est monté côté client
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Indiquer que l'utilisateur a interagi avec la page
    localStorage.setItem("userInteracted", "true")

    // Récupérer le prénom stocké
    const prenom = localStorage.getItem("userPrenom") || localStorage.getItem("prenom")

    // Stocker les informations si nécessaire
    if (email) {
      localStorage.setItem("userEmail", email)
    }
    if (statut) {
      localStorage.setItem("userStatut", statut)
    }

    // Rediriger vers la page du nombre de l'âme
    const params = new URLSearchParams()
    if (email) params.append("email", email)
    if (statut) params.append("statut", statut)
    if (prenom) params.append("prenom", prenom)

    // Utiliser window.location pour une redirection immédiate
    window.location.href = `/ame-resultat?${params.toString()}`
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
    <main className="relative min-h-screen flex flex-col items-center justify-start overflow-hidden">
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
      <div className="absolute inset-0 bg-black/30 z-0"></div>

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
        className="z-20 flex flex-col items-center w-full max-w-4xl mt-8 md:mt-16 px-4"
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

        <div className="w-full max-w-3xl flex flex-col md:flex-row items-start justify-between gap-6 md:gap-8">
          {/* Formulaire */}
          <div className="w-full md:w-2/3 bg-black/60 backdrop-blur-md p-6 rounded-xl border border-teal-500/30">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-pink-600 flex items-center justify-center text-white font-bold mr-3">
                    1
                  </div>
                  <Label htmlFor="email" className="text-white text-lg">
                    Votre Email (facultatif)
                  </Label>
                </div>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Entrez votre adresse email"
                  className="bg-teal-900/30 border-teal-500/50 text-white"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-pink-600 flex items-center justify-center text-white font-bold mr-3">
                    2
                  </div>
                  <Label htmlFor="statut" className="text-white text-lg">
                    Votre Statut Marital
                  </Label>
                </div>
                <Select value={statut} onValueChange={setStatut} required>
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
                  className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white py-6 h-auto text-lg font-medium"
                >
                  OBTENIR VOTRE LECTURE D'ÂME GRATUITE
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
              <h3 className="text-xl font-bold text-white mb-3">Nombre de l'Âme</h3>
              <p className="text-gray-300 text-sm">
                Découvrez vos motivations cachées, vos désirs les plus profonds et les intentions réelles derrière vos
                choix et décisions. Le Nombre de l'Âme révèle votre essence intérieure.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </main>
  )
}
