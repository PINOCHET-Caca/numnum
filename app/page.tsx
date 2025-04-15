"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { InfinityIcon } from "lucide-react"
import Image from "next/image"

export default function Home() {
  const [prenom, setPrenom] = useState("")
  const [dateNaissance, setDateNaissance] = useState("")
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  // S'assurer que le composant est monté côté client
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (prenom && dateNaissance) {
      // Indiquer que l'utilisateur a interagi avec la page
      localStorage.setItem("userInteracted", "true")

      // Rediriger vers la page de résultat immédiatement
      const params = new URLSearchParams()
      params.append("prenom", prenom)
      params.append("date", dateNaissance)

      // Utiliser window.location pour une redirection immédiate
      window.location.href = `/resultat?${params.toString()}`
    }
  }

  // Validation de la date pour limiter l'année à 4 chiffres
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Vérifier si la date est au format YYYY-MM-DD
    if (value) {
      const [year] = value.split("-")
      // Si l'année a plus de 4 chiffres, ne pas mettre à jour l'état
      if (year && year.length > 4) {
        return
      }
    }
    setDateNaissance(value)
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
    <>
      {/* Landing page principale */}
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
              transform: [
                "translate(0px, 0px)",
                "translate(10px, 5px)",
                "translate(-5px, -10px)",
                "translate(0px, 0px)",
              ],
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
              transform: [
                "translate(0px, 0px)",
                "translate(-10px, 5px)",
                "translate(5px, -10px)",
                "translate(0px, 0px)",
              ],
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
              Les nombres qui se répètent sont-ils des messages cachés envoyés par vos anges ?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-lg md:text-xl text-white max-w-3xl mx-auto px-2 md:px-4"
            >
              Découvrez dès maintenant leur signification grâce à votre rapport vidéo personnalisé gratuit.
            </motion.p>
          </div>

          {/* Formulaire */}
          <div className="bg-black/60 backdrop-blur-md p-4 md:p-6 rounded-xl border border-teal-500/30 w-full max-w-md">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="prenom" className="text-white">
                  Prénom
                </Label>
                <Input
                  id="prenom"
                  value={prenom}
                  onChange={(e) => setPrenom(e.target.value)}
                  placeholder="Entrez votre prénom"
                  required
                  className="bg-teal-900/30 border-teal-500/50 text-white"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="date" className="text-white">
                  Date de naissance
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={dateNaissance}
                  onChange={handleDateChange}
                  min="1900-01-01"
                  max="2024-12-31"
                  required
                  className="bg-teal-900/30 border-teal-500/50 text-white"
                />
              </div>

              <Button
                type="submit"
                className="w-full mt-4 bg-gradient-to-r from-teal-500 to-purple-600 hover:from-teal-600 hover:to-purple-700 text-white text-sm md:text-base py-2 h-auto whitespace-normal"
              >
                <span className="block md:hidden">Obtenir mon rapport gratuit</span>
                <span className="hidden md:block">Obtenir votre rapport vidéo personnalisé</span>
              </Button>
            </form>
          </div>
        </motion.div>
      </main>

      {/* Nouvelle section complètement séparée */}
      <section className="w-full bg-[#14163f] py-10 md:py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-xl md:text-2xl leading-relaxed text-white mb-6 md:mb-8">
            Dans ce <span className="text-teal-400 font-semibold">rapport vidéo personnalisé</span>, nous explorerons
            votre Chemin de Vie, votre Nombre d'Expression et votre Nombre de l'Âme d'une manière{" "}
            <span className="text-teal-400 font-semibold">totalement inédite</span> pour révéler...
          </h2>

          {/* Liste de bullet points */}
          <ul className="text-white text-left max-w-3xl mx-auto space-y-4 md:space-y-6 mb-8 md:mb-10 text-sm md:text-base">
            <li className="flex items-start">
              <span className="text-teal-400 mr-2 md:mr-3 mt-1 flex-shrink-0">✧</span>
              <p>
                Vos <span className="underline">désirs profonds</span> que vous ignorez peut-être et comment{" "}
                <span className="underline">enfin les réaliser</span>...
              </p>
            </li>

            <li className="flex items-start">
              <span className="text-teal-400 mr-2 md:mr-3 mt-1 flex-shrink-0">✧</span>
              <p>
                L'endroit où vous <span className="underline">gaspillez votre énergie</span> et la façon de faire un{" "}
                <span className="underline">changement simple et efficace</span> pour mettre fin aux difficultés...
              </p>
            </li>

            <li className="flex items-start">
              <span className="text-teal-400 mr-2 md:mr-3 mt-1 flex-shrink-0">✧</span>
              <p>
                Ce qui vous <span className="underline">motive vraiment</span>, votre attitude face au travail et{" "}
                <span className="underline">l'environnement idéal</span> pour vous épanouir professionnellement...
              </p>
            </li>

            <li className="flex items-start">
              <span className="text-teal-400 mr-2 md:mr-3 mt-1 flex-shrink-0">✧</span>
              <p>
                Vos <span className="underline">talents cachés</span> et vos{" "}
                <span className="underline">forces secrètes</span>, ainsi que la meilleure manière de les utiliser pour
                obtenir ce que vous voulez vraiment...
              </p>
            </li>

            <li className="flex items-start">
              <span className="text-teal-400 mr-2 md:mr-3 mt-1 flex-shrink-0">✧</span>
              <p>
                Des <span className="underline">révélations</span> sur votre personnalité, vos{" "}
                <span className="underline">traits uniques</span> et votre façon de vous connecter aux autres...
              </p>
            </li>

            <li className="flex items-start">
              <span className="text-teal-400 mr-2 md:mr-3 mt-1 flex-shrink-0">✧</span>
              <p>
                Les <span className="underline">défis et les leçons</span> que la vie vous réserve, ainsi que les{" "}
                <span className="underline">opportunités inexplorées</span> qui pourraient transformer votre avenir...
              </p>
            </li>

            <li className="flex items-start">
              <span className="text-teal-400 mr-2 md:mr-3 mt-1 flex-shrink-0">✧</span>
              <p className="text-teal-400 font-medium">Et bien plus encore…</p>
            </li>
          </ul>

          {/* Bouton identique à celui de la landing page */}
          <Button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="bg-gradient-to-r from-teal-500 to-purple-600 hover:from-teal-600 hover:to-purple-700 text-white px-4 md:px-6 py-2 md:py-3 text-sm md:text-base h-auto whitespace-normal max-w-xs md:max-w-md mx-auto"
          >
            <span className="block md:hidden">Obtenir mon rapport gratuit</span>
            <span className="hidden md:block">Obtenir votre rapport vidéo personnalisé</span>
          </Button>
        </div>
      </section>
    </>
  )
}
