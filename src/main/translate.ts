import { RecognizedText, TranslatedText } from './types'

// This is a mock translation function.
// Replace this with a call to a real translation API (e.g., DeepL, Google Translate).
export async function translateText(texts: RecognizedText[]): Promise<TranslatedText[]> {
    // Mock delay to simulate API call
    await new Promise((resolve) => setTimeout(resolve, 100))

    return texts.map((item) => ({
        ...item,
        translated: `[JP] ${item.text}`
    }))
}
