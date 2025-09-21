import React, { useEffect, useState } from 'react'
import { DesktopCapturerSource } from 'electron'

const ControlPanel: React.FC = () => {
    const [sources, setSources] = useState<DesktopCapturerSource[]>([])
    const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null)
    const [isCapturing, setIsCapturing] = useState(false)

    useEffect(() => {
        window.api.getScreenSources().then((sources) => {
            setSources(sources)
            if (sources.length > 0) {
                setSelectedSourceId(sources[0].id)
            }
        })
    }, [])

    const handleStart = (): void => {
        if (selectedSourceId) {
            console.log('ControlPanel: Starting capture for', selectedSourceId)
            window.api.startCapture(selectedSourceId)
            setIsCapturing(true)
        }
    }

    const handleStop = (): void => {
        console.log('ControlPanel: Stopping capture')
        window.api.stopCapture()
        setIsCapturing(false)
    }

    return (
        <div
            style={{ padding: '20px', color: 'white', backgroundColor: '#242424', height: '100vh' }}
        >
            <h1>Yakumon - Translator</h1>
            <p>1. Select a window/screen to translate.</p>
            <select
                value={selectedSourceId || ''}
                onChange={(e): void => setSelectedSourceId(e.target.value)}
                style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
                disabled={isCapturing}
            >
                {sources.map((source) => (
                    <option key={source.id} value={source.id}>
                        {source.name}
                    </option>
                ))}
            </select>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '10px',
                    marginBottom: '20px',
                    maxHeight: '400px',
                    overflowY: 'auto'
                }}
            >
                {sources.map((source) => (
                    <div
                        key={source.id}
                        onClick={(): void => {
                            if (!isCapturing) {
                                setSelectedSourceId(source.id)
                            }
                        }}
                        style={{
                            border: `2px solid ${selectedSourceId === source.id ? '#007bff' : '#555'}`,
                            padding: '5px',
                            cursor: 'pointer',
                            backgroundColor: '#333'
                        }}
                    >
                        <p
                            style={{
                                margin: 0,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}
                        >
                            {source.name}
                        </p>
                        <img src={source.thumbnail.toDataURL()} style={{ width: '100%' }} />
                    </div>
                ))}
            </div>

            <p>2. Start the translation overlay.</p>
            <div style={{ display: 'flex', gap: '10px' }}>
                <button
                    onClick={handleStart}
                    disabled={!selectedSourceId || isCapturing}
                    style={{ flex: 1, padding: '10px' }}
                >
                    Start
                </button>
                <button
                    onClick={handleStop}
                    disabled={!isCapturing}
                    style={{ flex: 1, padding: '10px' }}
                >
                    Stop
                </button>
            </div>
            {isCapturing && (
                <p style={{ color: '#28a745', marginTop: '10px' }}>Translation is active...</p>
            )}
        </div>
    )
}

export default ControlPanel
