import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    console.log("Requête de synthèse vocale reçue")

    // Récupérer le texte à synthétiser depuis les paramètres de requête
    const searchParams = request.nextUrl.searchParams
    const text = searchParams.get("text")
    const timestamp = searchParams.get("t") // Pour éviter la mise en cache

    const segment = searchParams.get("segment") || "0"
    console.log(`Traitement du segment ${segment} avec ${text?.length || 0} caractères`)

    if (!text) {
      console.error("Paramètre text manquant")
      return NextResponse.json({ error: "Le paramètre text est requis" }, { status: 400 })
    }

    // Vérifier si le texte n'est pas trop long
    if (text.length > 5000) {
      console.error(`Texte trop long: ${text.length} caractères`)
      return NextResponse.json({ error: "Le texte est trop long (max 5000 caractères)" }, { status: 400 })
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

    // Construire le SSML
    const ssml = `
      <speak version='1.0' xml:lang='fr-FR'>
        <voice xml:lang='fr-FR' xml:gender='Female' name='fr-FR-VivienneNeural'>
          ${textToSpeech}
        </voice>
      </speak>
    `

    try {
      console.log("Appel de l'API Azure Speech...")

      // Appeler l'API Azure Speech
      const response = await fetch(`https://${speechRegion}.tts.speech.microsoft.com/cognitiveservices/v1`, {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": speechKey,
          "Content-Type": "application/ssml+xml",
          "X-Microsoft-OutputFormat": "audio-16khz-128kbitrate-mono-mp3",
          "User-Agent": "Numerologist",
        },
        body: ssml,
      })

      console.log(`Réponse de l'API Azure: ${response.status} ${response.statusText}`)

      if (!response.ok) {
        console.error(`Erreur API Azure Speech: ${response.status} ${response.statusText}`)
        return NextResponse.json(
          { error: `Erreur du service de synthèse vocale: ${response.status} ${response.statusText}` },
          { status: response.status },
        )
      }

      // Récupérer les données audio
      const audioData = await response.arrayBuffer()
      console.log(`Audio généré avec succès, taille: ${audioData.byteLength} octets`)

      // Retourner l'audio
      return new NextResponse(audioData, {
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Length": audioData.byteLength.toString(),
        },
      })
    } catch (error) {
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
