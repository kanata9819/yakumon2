import { app } from 'electron'
import { createWorker, Worker } from 'tesseract.js'
import { RecognizedText } from './types'

let worker: Worker | null = null

export async function initializeOCR(): Promise<void> {
    if (worker) {
        return
    }

    // For packaged apps, we need to tell Tesseract where to find the language data file.
    // We assume `eng.traineddata` is copied to the resources directory by electron-builder.
    const langPath = app.isPackaged ? process.resourcesPath : undefined

    console.log(`[OCR] Initializing Tesseract worker...`)
    if (langPath) {
        console.log(`[OCR] Using language data from: ${langPath}`)
    } else {
        console.log(`[OCR] In dev mode, language data will be downloaded to cache.`)
    }

    // Create a worker with English language and the specified langPath.
    const tesseractWorker = await createWorker('eng', undefined, {
        // logger: (m) => console.log(m), // Uncomment for detailed OCR logging
        langPath
    })

    worker = tesseractWorker
    console.log('[OCR] Tesseract worker initialized.')
}

export async function recognizeText(image: Buffer): Promise<RecognizedText[]> {
    if (!worker) {
        throw new Error('OCR worker is not initialized. Call initializeOCR first.')
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = (await worker.recognize(image)) as any

    // Filter out low-confidence words and map to our custom type.
    return result.data.words
        .filter((word) => word.confidence > 70)
        .map((word) => ({
            text: word.text,
            bbox: {
                x0: word.bbox.x0,
                y0: word.bbox.y0,
                x1: word.bbox.x1,
                y1: word.bbox.y1
            }
        }))
}

export async function terminateOCR(): Promise<void> {
    if (worker) {
        await worker.terminate()
        worker = null
        console.log('[OCR] Tesseract worker terminated.')
    }
}
