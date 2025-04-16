import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    console.log("Requête de synthèse vocale reçue")

    // Récupérer le texte à synthétiser depuis les paramètres de requête
    const searchParams = request.nextUrl.searchParams
    const text = searchParams.get("text")
    const timestamp = searchParams.get("t") // Pour éviter la mise en cache
    const priority = searchParams.get("priority") // Pour les requêtes prioritaires
    const immediate = searchParams.get("immediate") // Pour les requêtes immédiates
    const speed = searchParams.get("speed") // Pour ajuster la vitesse

    // Priorité élevée pour les requêtes marquées comme immédiates ou prioritaires
    const isPriority = priority === "high" || priority === "highest" || immediate === "true"
    const isHighestPriority = priority === "highest"

    console.log(
      `Priorité: ${isPriority ? (isHighestPriority ? "maximale" : "élevée") : "normale"}, timestamp: ${timestamp}`,
    )

    if (!text) {
      console.error("Paramètre text manquant")
      return NextResponse.json({ error: "Le paramètre text est requis" }, { status: 400 })
    }

    // Récupérer les clés d'API Azure Speech
    const speechKey = process.env.AZURE_SPEECH_KEY
    const speechRegion = process.env.AZURE_SPEECH_REGION

    if (!speechKey || !speechRegion) {
      console.error("Clés API Azure Speech manquantes")
      return NextResponse.json({ error: "Configuration du service de synthèse vocale manquante" }, { status: 500 })
    }

    console.log(`Clés API Azure Speech trouvées, région: ${speechRegion}`)

    // Préparer le texte pour la synthèse vocale (remplacer certains textes pour une meilleure prononciation)
    let textToSpeech = text

    // Remplacer "lanumerologie.co" par "la numérologie point co" pour la prononciation
    textToSpeech = textToSpeech.replace(/lanumerologie\.co/g, "la numérologie point co")

    // Déterminer la vitesse de parole en fonction des paramètres
    let rate = "0%"
    if (speed === "fast") {
      rate = "+10%" // Plus rapide pour les requêtes immédiates
    } else if (isPriority) {
      rate = "+8%" // Légèrement plus rapide pour les requêtes prioritaires
    }

    // Construire le SSML avec une vitesse ajustée et une priorité élevée
    const ssml = `
      <speak version='1.0' xml:lang='fr-FR'>
        <voice xml:lang='fr-FR' xml:gender='Female' name='fr-FR-VivienneNeural'>
          <prosody rate="${rate}">
            ${textToSpeech}
          </prosody>
        </voice>
      </speak>
    `

    try {
      console.log("Appel de l'API Azure Speech...")

      // Utiliser AbortController pour définir un timeout plus court pour les requêtes prioritaires
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), isHighestPriority ? 60000 : isPriority ? 90000 : 120000)

      // Appeler l'API Azure Speech avec une priorité plus élevée pour les requêtes immédiates
      const response = await fetch(`https://${speechRegion}.tts.speech.microsoft.com/cognitiveservices/v1`, {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": speechKey,
          "Content-Type": "application/ssml+xml",
          "X-Microsoft-OutputFormat": "audio-16khz-128kbitrate-mono-mp3",
          "User-Agent": "Numerologist",
          "X-Priority": isHighestPriority ? "highest" : isPriority ? "high" : "normal",
        },
        body: ssml,
        signal: controller.signal,
        // Priorité élevée pour les requêtes immédiates
        priority: isHighestPriority ? "high" : isPriority ? "high" : "auto",
      })

      // Nettoyer le timeout
      clearTimeout(timeoutId)

      console.log(`Réponse de l'API Azure: ${response.status} ${response.statusText}`)

      if (!response.ok) {
        console.error(`Erreur API Azure Speech: ${response.status} ${response.statusText}`)

        // Essayer de lire le corps de l'erreur pour plus de détails
        try {
          const errorBody = await response.text()
          console.error("Détails de l'erreur Azure:", errorBody)
        } catch (e) {
          console.error("Impossible de lire les détails de l'erreur")
        }

        return NextResponse.json(
          { error: `Erreur du service de synthèse vocale: ${response.status} ${response.statusText}` },
          { status: response.status },
        )
      }

      // Récupérer les données audio
      const audioData = await response.arrayBuffer()
      console.log(`Audio généré avec succès, taille: ${audioData.byteLength} octets`)

      // Retourner l'audio avec des en-têtes optimisés pour le streaming et le chargement rapide
      return new NextResponse(audioData, {
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Length": audioData.byteLength.toString(),
          "Cache-Control": "no-cache, no-store, must-revalidate", // Désactiver la mise en cache
          Pragma: "no-cache",
          Expires: "0",
          "Access-Control-Allow-Origin": "*", // Permettre CORS
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "X-Audio-Ready": "true", // En-tête personnalisé pour signaler que l'audio est prêt
          "X-Request-ID": `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`, // ID unique pour éviter la mise en cache
          "Transfer-Encoding": "chunked", // Permettre le streaming
          "X-Content-Type-Options": "nosniff",
          "X-Accel-Buffering": "no", // Désactiver la mise en mémoire tampon pour Nginx
        },
      })
    } catch (error) {
      // Vérifier si c'est une erreur d'abandon
      if (error instanceof Error && error.name === "AbortError") {
        console.error("La requête a été abandonnée en raison du timeout")
        return NextResponse.json({ error: "La requête a pris trop de temps et a été abandonnée" }, { status: 408 })
      }

      console.error("Erreur lors de l'appel à l'API Azure:", error)
      return NextResponse.json(
        {
          error: `Erreur lors de l'appel à l'API Azure: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Erreur lors de la synthèse vocale:", error)
    return NextResponse.json(
      { error: `Erreur interne: ${error instanceof Error ? error.message : "Erreur inconnue"}` },
      { status: 500 },
    )
  }
}

// Ajouter cette fonction pour gérer les requêtes OPTIONS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  })
}
