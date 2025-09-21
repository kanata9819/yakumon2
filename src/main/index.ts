import { app, shell, BrowserWindow, ipcMain, desktopCapturer, screen } from 'electron'
import { join } from 'path'
import { electronApp, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { AppState } from './state'
import { initializeOCR, recognizeText, terminateOCR } from './ocr'
import { translateText } from './translate'

let overlayWindow: BrowserWindow | null = null
let controlWindow: BrowserWindow | null = null

// ======== Window Creation ========

function createOverlayWindow(): void {
    const primaryDisplay = screen.getPrimaryDisplay()

    overlayWindow = new BrowserWindow({
        width: primaryDisplay.workAreaSize.width,
        height: primaryDisplay.workAreaSize.height,
        x: primaryDisplay.workArea.x,
        y: primaryDisplay.workArea.y,
        show: true,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            sandbox: false
        }
    })

    // Make the window click-through
    overlayWindow.setIgnoreMouseEvents(true)

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        overlayWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    } else {
        overlayWindow.loadFile(join(__dirname, '../renderer/index.html'))
    }
}

function createControlWindow(): void {
    controlWindow = new BrowserWindow({
        width: 400,
        height: 600,
        show: false,
        autoHideMenuBar: true,
        ...(process.platform === 'linux' ? { icon } : {}),
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            // Use a different entry for the control panel in dev
            // This requires a custom vite config, for now we load the same URL
            // and use React Router to show a different component.
            devTools: is.dev
        }
    })

    controlWindow.on('ready-to-show', () => {
        controlWindow?.show()
    })

    controlWindow.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url)
        return { action: 'deny' }
    })

    // We need a separate HTML file or a routing mechanism for the control panel.
    // For now, we'll load the same URL as the overlay.
    // The renderer-side code will need to differentiate.
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        // This assumes you have a second vite entry for 'control.html'
        // For simplicity, we will load the main URL and use routing in React.
        controlWindow.loadURL(process.env['ELECTRON_RENDERER_URL'] + '#/control')
    } else {
        // In production, you'd have a separate control.html file.
        controlWindow.loadFile(join(__dirname, '../renderer/index.html'), { hash: 'control' })
    }
}

// ======== IPC Handlers ========

ipcMain.handle('get-screen-sources', async () => {
    return desktopCapturer.getSources({
        types: ['window', 'screen'],
        thumbnailSize: { width: 300, height: 300 }
    })
})

ipcMain.on('start-capture', (_event, sourceId: string) => {
    console.log(`[Main] Received start-capture for source: ${sourceId}`)
    AppState.isCapturing = true
    // Tell the overlay window to start capturing this source
    overlayWindow?.webContents.send('start-capture', sourceId)
})

ipcMain.on('stop-capture', () => {
    console.log('[Main] Received stop-capture')
    AppState.isCapturing = false
    overlayWindow?.webContents.send('stop-capture')
})

ipcMain.on('captured-image', async (_event, image_data_url: string) => {
    if (!AppState.isCapturing) {
        return
    }

    try {
        const buffer = Buffer.from(image_data_url.replace(/^data:image\/png;base64,/, ''), 'base64')
        const recognized = await recognizeText(buffer)

        if (recognized.length > 0) {
            const translated = await translateText(recognized)
            // Send translated text to the overlay window to be displayed
            overlayWindow?.webContents.send('translated-text', translated)
        } else {
            // Clear previous translations if nothing is detected
            overlayWindow?.webContents.send('translated-text', [])
        }
    } catch (error) {
        console.error('[Main] Error during capture processing:', error)
    }
})

// ======== App Lifecycle ========

app.whenReady().then(async () => {
    electronApp.setAppUserModelId('com.electron.yakumon')

    app.on('browser-window-created', () => {
        // optimizer.watch(window)
    })
    await initializeOCR()
    createOverlayWindow()
    createControlWindow()

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) {
            createOverlayWindow()
            createControlWindow()
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('will-quit', async () => {
    await terminateOCR()
})
