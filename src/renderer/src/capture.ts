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

export async function startRendererCapture(sourceId: string): Promise<void> {
    if (captureState.stream) {
        stopRendererCapture()
    }

    console.log('[Renderer] Starting capture for source:', sourceId)

    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
                // @ts-expect-error: mandatory is a non-standard chrome-specific constraint
                mandatory: {
                    chromeMediaSource: 'desktop',
                    chromeMediaSourceId: sourceId
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
