import { app } from 'electron'
import { createWorker, Worker, RecognizeResult, Word } from 'tesseract.js'
import { RecognizedText } from './types'

// Define a custom page type because the default Page type from tesseract.js
// seems to be causing type-checking issues in this environment.
interface CustomPage {
    words: Word[]
}

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

    const tesseractWorker = await createWorker(['eng', 'osd'], undefined, {
        // logger: (m) => console.log(m), // Uncomment for detailed OCR logging
        langPath
    })

    worker = tesseractWorker
    // Set OEM after worker is created
    await worker.setParameters({ tessedit_ocr_engine_mode: '0' }) // OEM_TESSERACT_ONLY
    console.log('[OCR] Tesseract worker initialized.')
}

export async function recognizeText(image: Buffer): Promise<RecognizedText[]> {
    if (!worker) {
        throw new Error('OCR worker is not initialized. Call initializeOCR first.')
    }

    const result: RecognizeResult = await worker.recognize(image)

    // Cast through unknown to bypass incorrect type-checking for result.data
    const pageData = result.data as unknown as CustomPage

    // Ensure pageData and pageData.words exist before processing
    if (!pageData || !pageData.words) {
        console.warn('[OCR] No words recognized or unexpected result structure.', result)
        return []
    }

    // Filter out low-confidence words and map to our custom type.
    return pageData.words
        .filter((word: Word) => word.confidence > 70)
        .map((word: Word) => ({
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
