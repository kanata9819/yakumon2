import React, { useEffect, useState } from 'react'
import { DesktopCapturerSource } from 'electron'

const ControlPanel: React.FC = () => {
    const [sources, setSources] = useState<DesktopCapturerSource[]>([])
    const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null)
    const [isCapturing, setIsCapturing] = useState(false)

    useEffect(() => {
        console.log('[ControlPanel] useEffect hook executed.') // Debug log
        window.api
            .getScreenSources()
            .then((sources) => {
                console.log(
                    '[ControlPanel] Received screen sources:',
                    sources.map((s) => s.name)
                ) // Debug log
                setSources(sources)
                if (sources.length > 0 && sources[0].id) {
                    setSelectedSourceId(sources[0].id)
                } else {
                    setSelectedSourceId(null)
                }
            })
            .catch((error) => {
                console.error('[ControlPanel] Error fetching screen sources:', error) // Error log
                setSelectedSourceId(null)
            })
    }, [])

    const handleStart = (): void => {
        console.log('ControlPanel: handleStart called. selectedSourceId:', selectedSourceId) // New debug log
        if (selectedSourceId && selectedSourceId.trim() !== '') {
            // More robust check
            console.log('ControlPanel: Starting capture for', selectedSourceId)
            window.api.startCapture(selectedSourceId)
            setIsCapturing(true)
        } else {
            console.warn(
                'ControlPanel: Cannot start capture, selectedSourceId is null, undefined, or empty.'
            ) // New warning
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
                disabled={!selectedSourceId || isCapturing}
            >
                {/* Add an empty option for when no source is selected or available */}
                <option value="" disabled>
                    {sources.length > 0 ? 'Select a source' : 'No sources available'}
                </option>
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
