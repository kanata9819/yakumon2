import { contextBridge, ipcRenderer, DesktopCapturerSource } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { TranslatedText } from '../main/types'

const api = {
    getScreenSources: (): Promise<DesktopCapturerSource[]> =>
        ipcRenderer.invoke('get-screen-sources'),

    onTranslatedText: (callback: (texts: TranslatedText[]) => void) => {
        const handler = (_event, texts): void => callback(texts)
        ipcRenderer.on('translated-text', handler)
        return () => {
            ipcRenderer.removeListener('translated-text', handler)
        }
    },

    startCapture: (sourceId: string) => {
        ipcRenderer.send('start-capture', sourceId)
    },

    stopCapture: () => {
        ipcRenderer.send('stop-capture')
    },

    sendCapturedImage: (image: string) => {
        ipcRenderer.send('captured-image', image)
    }
}

if (process.contextIsolated) {
    try {
        contextBridge.exposeInMainWorld('electron', electronAPI)
        contextBridge.exposeInMainWorld('api', api)
    } catch (error) {
        console.error(error)
    }
} else {
    // @ts-ignore: Unsafe assignment to window on purpose for non-context-isolated environments.
    window.electron = electronAPI
    // @ts-ignore: Unsafe assignment to window on purpose for non-context-isolated environments.
    window.api = api
}
