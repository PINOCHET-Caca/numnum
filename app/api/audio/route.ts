import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Générer un fichier WAV simple avec un son sinusoïdal
    const sampleRate = 44100
    const duration = 5 // 5 secondes
    const frequency = 220 // 220 Hz (note A3)
    const amplitude = 0.1 // Volume bas

    // Calculer la taille du fichier WAV
    const dataSize = sampleRate * duration * 2 // 2 octets par échantillon
    const fileSize = 44 + dataSize

    // Créer un buffer pour le fichier WAV
    const buffer = new ArrayBuffer(fileSize)
    const view = new DataView(buffer)

    // Écrire l'en-tête WAV
    // "RIFF" chunk descriptor
    writeString(view, 0, "RIFF")
    view.setUint32(4, fileSize - 8, true)
    writeString(view, 8, "WAVE")

    // "fmt " sub-chunk
    writeString(view, 12, "fmt ")
    view.setUint32(16, 16, true) // taille du sous-chunk fmt
    view.setUint16(20, 1, true) // format audio (1 = PCM)
    view.setUint16(22, 1, true) // nombre de canaux (1 = mono)
    view.setUint32(24, sampleRate, true) // taux d'échantillonnage
    view.setUint32(28, sampleRate * 2, true) // débit d'octets (sampleRate * numChannels * bitsPerSample/8)
    view.setUint16(32, 2, true) // bloc d'alignement (numChannels * bitsPerSample/8)
    view.setUint16(34, 16, true) // bits par échantillon

    // "data" sub-chunk
    writeString(view, 36, "data")
    view.setUint32(40, dataSize, true) // taille du sous-chunk data

    // Écrire les données audio (onde sinusoïdale)
    const dataOffset = 44
    for (let i = 0; i < sampleRate * duration; i++) {
      const t = i / sampleRate
      const sample = Math.sin(2 * Math.PI * frequency * t) * amplitude
      const sampleValue = Math.floor(sample * 32767) // Convertir en entier 16 bits
      view.setInt16(dataOffset + i * 2, sampleValue, true)
    }

    // Retourner le fichier WAV
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "audio/wav",
        "Content-Length": fileSize.toString(),
        "Cache-Control": "public, max-age=31536000", // Mettre en cache pendant un an
      },
    })
  } catch (error) {
    console.error("Erreur lors de la génération du fichier audio:", error)
    return NextResponse.json({ error: "Erreur lors de la génération du fichier audio" }, { status: 500 })
  }
}

// Fonction utilitaire pour écrire une chaîne dans un DataView
function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i))
  }
}
