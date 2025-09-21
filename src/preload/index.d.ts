import { ElectronAPI } from '@electron-toolkit/preload'
import { DesktopCapturerSource } from 'electron'
import { TranslatedText } from '../main/types'

declare global {
    interface Window {
        electron: ElectronAPI
        api: {
            getScreenSources: () => Promise<DesktopCapturerSource[]>
            onTranslatedText: (callback: (texts: TranslatedText[]) => void) => () => void
            startCapture: (sourceId: string) => void
            stopCapture: () => void
            sendCapturedImage: (image: string) => void
        }
    }
}
