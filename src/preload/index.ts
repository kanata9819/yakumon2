import { contextBridge, ipcRenderer, IpcRendererEvent, DesktopCapturerSource } from 'electron'

// Define TranslatedText type here as preload script cannot directly import from renderer
export type TranslatedText = {
    text: string
    bbox: {
        x0: number
        y0: number
        x1: number
        y1: number
    }
} & { translated: string }

// Map to store listeners and their corresponding wrapper functions for ipcRenderer.on
const listenersMap = new Map<
    string,
    Map<(...args: unknown[]) => void, (event: IpcRendererEvent, ...args: unknown[]) => void>
>()

// Custom APIs for renderer
const api = {
    getScreenSources: (): Promise<DesktopCapturerSource[]> =>
        ipcRenderer.invoke('get-screen-sources'),
    startCapture: (sourceId: string): void => ipcRenderer.send('start-capture', sourceId),
    stopCapture: (): void => ipcRenderer.send('stop-capture'),
    sendCapturedImage: (imageDataUrl: string): void =>
        ipcRenderer.send('captured-image', imageDataUrl),
    onTranslatedText: (callback: (texts: TranslatedText[]) => void): (() => void) => {
        const handler = (_event: IpcRendererEvent, texts: TranslatedText[]): void => callback(texts)
        ipcRenderer.on('translated-text', handler)
        return () => ipcRenderer.removeListener('translated-text', handler)
    }
}

// Use `contextBridge` to expose Electron APIs to
// renderer only if the context is not sandboxed.
// Otherwise use `window.electron`, `window.api` with `exposeInMainWorld`.
if (process.contextIsolated) {
    try {
        contextBridge.exposeInMainWorld('api', api)
        contextBridge.exposeInMainWorld('electron', {
            ipcRenderer: {
                on: (channel: string, listener: (...args: unknown[]) => void): void => {
                    const wrapper = (_event: IpcRendererEvent, ...args: unknown[]): void =>
                        listener(...args)
                    if (!listenersMap.has(channel)) {
                        listenersMap.set(channel, new Map())
                    }
                    listenersMap.get(channel)?.set(listener, wrapper)
                    ipcRenderer.on(channel, wrapper)
                },
                removeListener: (channel: string, listener: (...args: unknown[]) => void): void => {
                    const channelListeners = listenersMap.get(channel)
                    if (channelListeners) {
                        const wrapper = channelListeners.get(listener)
                        if (wrapper) {
                            ipcRenderer.removeListener(channel, wrapper)
                            channelListeners.delete(listener)
                        }
                    }
                },
                send: (channel: string, ...args: unknown[]): void =>
                    ipcRenderer.send(channel, ...args),
                invoke: (channel: string, ...args: unknown[]): Promise<unknown> =>
                    ipcRenderer.invoke(channel, ...args)
            }
        })
    } catch (error) {
        console.error(error)
    }
} else {
    // @ts-ignore (define in dts)
    window.api = api
    // @ts-ignore (define in dts)
    window.electron = {
        ipcRenderer: {
            on: (channel: string, listener: (...args: unknown[]) => void): void => {
                const wrapper = (_event: IpcRendererEvent, ...args: unknown[]): void =>
                    listener(...args)
                if (!listenersMap.has(channel)) {
                    listenersMap.set(channel, new Map())
                }
                listenersMap.get(channel)?.set(listener, wrapper)
                ipcRenderer.on(channel, wrapper)
            },
            removeListener: (channel: string, listener: (...args: unknown[]) => void): void => {
                const channelListeners = listenersMap.get(channel)
                if (channelListeners) {
                    const wrapper = channelListeners.get(listener)
                    if (wrapper) {
                        ipcRenderer.removeListener(channel, wrapper)
                        channelListeners.delete(listener)
                    }
                }
            },
            send: (channel: string, ...args: unknown[]): void => ipcRenderer.send(channel, ...args),
            invoke: (channel: string, ...args: unknown[]): Promise<unknown> =>
                ipcRenderer.invoke(channel, ...args)
        }
    }
}
