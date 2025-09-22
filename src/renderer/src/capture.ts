// This object will hold the media stream and video element
const captureState: {
    stream: MediaStream | null
    video: HTMLVideoElement | null
    canvas: HTMLCanvasElement | null
    ctx: CanvasRenderingContext2D | null
} = {
    stream: null,
    video: null,
    canvas: null,
    ctx: null
}

export async function startRendererCapture(): Promise<void> {
    // Stop any existing stream before starting a new one
    if (captureState.stream) {
        stopRendererCapture()
    }

    let selectedSourceId: string | undefined

    try {
        // Get available screen sources from the main process
        const sources = await window.api.getScreenSources()

        if (sources.length === 0) {
            console.error('[Renderer] No screen sources found.')
            throw new Error('No screen sources available for capture.')
        }

        // Prioritize "Entire Screen" or fall back to the first source
        const entireScreenSource = sources.find((source) => source.name === 'Entire Screen')
        if (entireScreenSource) {
            selectedSourceId = entireScreenSource.id
        } else {
            selectedSourceId = sources[0].id
        }

        if (!selectedSourceId) {
            console.error('[Renderer] Selected source ID is undefined.')
            throw new Error('Selected screen source ID is invalid.')
        }

        console.log('[Renderer] Starting capture for source:', selectedSourceId)

        const stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
                // @ts-expect-error: mandatory is a non-standard chrome-specific constraint
                mandatory: {
                    chromeMediaSource: 'desktop',
                    chromeMediaSourceId: selectedSourceId
                }
            }
        })

        captureState.stream = stream

        const video = document.createElement('video')
        captureState.video = video
        video.srcObject = stream
        video.onloadedmetadata = () => {
            video.play()
            // Setup canvas after video is ready
            const canvas = document.createElement('canvas')
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            captureState.canvas = canvas
            captureState.ctx = canvas.getContext('2d')
            console.log(
                `[Renderer] Capture stream started (${video.videoWidth}x${video.videoHeight}).`
            )
        }
    } catch (e) {
        console.error('[Renderer] Error starting capture:', e)
        // Ensure stream is stopped if an error occurs during setup
        stopRendererCapture()
        throw e // Re-throw to propagate the error
    }
}

export function stopRendererCapture(): void {
    if (captureState.stream) {
        captureState.stream.getTracks().forEach((track) => track.stop())
        captureState.stream = null
        captureState.video = null
        captureState.canvas = null
        captureState.ctx = null
        console.log('[Renderer] Capture stream stopped.')
    }
}

export function captureFrame(): string | null {
    const { video, canvas, ctx } = captureState
    if (!video || !canvas || !ctx || video.videoWidth === 0) {
        return null
    }

    // Ensure canvas size matches video size, in case it changes
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
    }

    // Draw the video frame to the canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Return the frame as a data URL
    return canvas.toDataURL('image/png')
}
