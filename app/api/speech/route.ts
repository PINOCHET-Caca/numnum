import { type NextRequest, NextResponse } from "next/server"

// Optimiser la route API pour accélérer la réponse et réduire la latence
export async function GET(request: NextRequest) {
  try {
    console.log("Requête de synthèse vocale reçue")

    // Récupérer le texte à synthétiser depuis les paramètres de requête
    const searchParams = request.nextUrl.searchParams
    const text = searchParams.get("text")
    const timestamp = searchParams.get("t") // Pour éviter la mise en cache
    const priority = searchParams.get("priority") // Nouvelle option de priorité
    const segment = searchParams.get("segment") || "0"

    // Réduire la taille max pour des réponses plus rapides
    const MAX_TEXT_LENGTH = priority === "high" ? 200 : 500

    console.log(
      `Traitement du segment ${segment} avec ${text?.length || 0} caractères (priorité: ${priority || "normale"})`,
    )

    if (!text) {
      console.error("Paramètre text manquant")
      return NextResponse.json({ error: "Le paramètre text est requis" }, { status: 400 })
    }

    // Tronquer le texte s'il est trop long pour une réponse plus rapide
    let textToSpeech = text
    if (text.length > MAX_TEXT_LENGTH) {
      console.log(`Texte tronqué de ${text.length} à ${MAX_TEXT_LENGTH} caractères pour performance`)
      textToSpeech = text.substring(0, MAX_TEXT_LENGTH)
      // Essayer de couper à un point ou une virgule pour une phrase plus naturelle
      const lastPeriod = textToSpeech.lastIndexOf(".")
      const lastComma = textToSpeech.lastIndexOf(",")
      const cutPoint = Math.max(lastPeriod, lastComma)
      if (cutPoint > MAX_TEXT_LENGTH * 0.7) {
        // Couper seulement si on est assez avancé dans le texte
        textToSpeech = textToSpeech.substring(0, cutPoint + 1)
      }
    }

    // Récupérer les clés d'API Azure Speech
    const speechKey = process.env.AZURE_SPEECH_KEY
    const speechRegion = process.env.AZURE_SPEECH_REGION

    if (!speechKey || !speechRegion) {
      console.error("Clés API Azure Speech manquantes")
      return NextResponse.json({ error: "Configuration du service de synthèse vocale manquante" }, { status: 500 })
    }

    // Remplacer "lanumerologie.co" par "la numérologie point co" pour la prononciation
    textToSpeech = textToSpeech.replace(/lanumerologie\.co/g, "la numérologie point co")

    // Construire le SSML
    const ssml = `
      <speak version='1.0' xml:lang='fr-FR'>
        <voice xml:lang='fr-FR' xml:gender='Female' name='fr-FR-VivienneNeural'>
          ${textToSpeech}
        </voice>
      </speak>
    `

    try {
      console.log(`Appel de l'API Azure Speech pour le segment ${segment}...`)

      // Timeout réduit pour les requêtes prioritaires
      const timeoutDuration = priority === "high" ? 5000 : 15000

      // Créer un contrôleur d'abandon pour limiter le temps d'attente
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeoutDuration)

      // Appeler l'API Azure Speech avec un timeout
      const response = await fetch(`https://${speechRegion}.tts.speech.microsoft.com/cognitiveservices/v1`, {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": speechKey,
          "Content-Type": "application/ssml+xml",
          "X-Microsoft-OutputFormat": "audio-16khz-32kbitrate-mono-mp3", // Qualité réduite pour une réponse plus rapide
          "User-Agent": "Numerologist",
        },
        body: ssml,
        signal: controller.signal,
      })

      // Nettoyer le timeout
      clearTimeout(timeoutId)

      console.log(`Réponse de l'API Azure: ${response.status} ${response.statusText} pour segment ${segment}`)

      if (!response.ok) {
        console.error(`Erreur API Azure Speech: ${response.status} ${response.statusText}`)
        return NextResponse.json(
          { error: `Erreur du service de synthèse vocale: ${response.status} ${response.statusText}` },
          { status: response.status },
        )
      }

      // Récupérer les données audio
      const audioData = await response.arrayBuffer()
      console.log(`Audio généré avec succès, taille: ${audioData.byteLength} octets pour segment ${segment}`)

      // Retourner l'audio avec des en-têtes de cache optimisés
      return new NextResponse(audioData, {
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Length": audioData.byteLength.toString(),
          "Cache-Control": "public, max-age=31536000", // Mettre en cache pendant un an
          ETag: `"speech-${segment}-${text.length}"`,
        },
      })
    } catch (error) {
      // Vérifier si l'erreur est due à un timeout
      if (error instanceof Error && error.name === "AbortError") {
        console.error(`Timeout lors de l'appel à l'API Azure pour le segment ${segment}`)
        return NextResponse.json({ error: "Délai d'attente dépassé pour la synthèse vocale" }, { status: 504 })
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
