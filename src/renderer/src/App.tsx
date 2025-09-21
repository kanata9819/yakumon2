import React, { useEffect, useState, useRef } from 'react'
import { TranslatedText } from './types'
import { startRendererCapture, stopRendererCapture, captureFrame } from './capture'
import Overlay from './components/Overlay'

const CAPTURE_INTERVAL_MS = 500 // Capture twice per second

const App: React.FC = () => {
    const [translatedTexts, setTranslatedTexts] = useState<TranslatedText[]>([])
    const captureInterval = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        // Listen for translated text from the main process
        const cleanupTranslatedText = window.api.onTranslatedText((texts) => {
            setTranslatedTexts(texts)
        })

        const handleStartCapture = (_event, sourceId: string): void => {
            console.log('[Renderer] Received start-capture command')
            startRendererCapture(sourceId).then((): void => {
                if (captureInterval.current) clearInterval(captureInterval.current)
                captureInterval.current = setInterval(() => {
                    const frame = captureFrame()
                    if (frame) {
                        window.api.sendCapturedImage(frame)
                    }
                }, CAPTURE_INTERVAL_MS)
            })
        }

        const handleStopCapture = (): void => {
            console.log('[Renderer] Received stop-capture command')
            if (captureInterval.current) clearInterval(captureInterval.current)
            captureInterval.current = null
            stopRendererCapture()
            setTranslatedTexts([]) // Clear overlays
        }

        // Listen for start/stop commands from the main process
        window.electron.ipcRenderer.on('start-capture', handleStartCapture)
        window.electron.ipcRenderer.on('stop-capture', handleStopCapture)

        return () => {
            cleanupTranslatedText()
            window.electron.ipcRenderer.removeListener('start-capture', handleStartCapture)
            window.electron.ipcRenderer.removeListener('stop-capture', handleStopCapture)
            if (captureInterval.current) clearInterval(captureInterval.current)
            stopRendererCapture()
        }
    }, [])

    return (
        <div
            className="App"
            style={{ width: '100vw', height: '100vh', position: 'relative', pointerEvents: 'none' }}
        >
            {translatedTexts.map((item, index) => (
                <Overlay key={`${item.bbox.x0}-${item.bbox.y0}-${index}`} item={item} />
            ))}
        </div>
    )
}

export default App
