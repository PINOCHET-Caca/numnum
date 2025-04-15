"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlayCircle } from "lucide-react"

interface ExpressionFormProps {
  prenom: string
  genreDetecte?: "femme" | "homme"
}

export function ExpressionForm({ prenom, genreDetecte }: ExpressionFormProps) {
  const [genre, setGenre] = useState<string>(genreDetecte || "")
  const [nomComplet, setNomComplet] = useState<string>("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (genre && nomComplet) {
      // Indiquer que l'utilisateur a interagi avec la page
      localStorage.setItem("userInteracted", "true")
      localStorage.setItem("expressionNomComplet", nomComplet)

      // Rediriger vers la page d'expression
      const params = new URLSearchParams()
      params.append("prenom", prenom)
      params.append("nomComplet", nomComplet)
      window.location.href = `/expression?${params.toString()}`
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="w-full max-w-3xl mx-auto"
    >
      <div className="text-center mb-6">
        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-2xl md:text-3xl font-bold text-white mb-3"
        >
          Pour obtenir votre lecture d'Expression personnalisée GRATUITE
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-lg text-white/90"
        >
          Complétez les informations ci-dessous...
        </motion.p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Formulaire */}
        <div className="w-full md:w-2/3 bg-black/60 backdrop-blur-md p-5 rounded-xl border border-teal-500/30">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <div className="flex items-center">
                <div className="w-7 h-7 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold mr-3">
                  1
                </div>
                <Label htmlFor="genre" className="text-white">
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
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center">
                <div className="w-7 h-7 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold mr-3">
                  2
                </div>
                <Label htmlFor="nomComplet" className="text-white">
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

            <div className="pt-3">
              <div className="flex items-center mb-3">
                <div className="w-7 h-7 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold mr-3">
                  3
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-teal-500 to-purple-600 hover:from-teal-600 hover:to-purple-700 text-white py-5 h-auto text-base font-medium"
              >
                CONTINUER AVEC MA LECTURE
              </Button>
            </div>
          </form>
        </div>

        {/* Encadré d'information */}
        <div className="w-full md:w-1/3 bg-black/60 backdrop-blur-md p-5 rounded-xl border border-teal-500/30">
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-teal-600/80 flex items-center justify-center mb-3">
              <PlayCircle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Analyse de votre Nombre d'Expression</h3>
            <p className="text-gray-300 text-sm">
              Découvrez la signification profonde de votre nom et comment il influence votre destinée, vos talents et
              votre potentiel caché.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
