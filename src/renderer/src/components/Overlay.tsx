import React from 'react'
import { TranslatedText } from '../types'

interface OverlayProps {
    item: TranslatedText
}

const Overlay: React.FC<OverlayProps> = ({ item }) => {
    const style: React.CSSProperties = {
        position: 'absolute',
        left: `${item.bbox.x0}px`,
        top: `${item.bbox.y0}px`,
        width: `${item.bbox.x1 - item.bbox.x0}px`,
        height: `${item.bbox.y1 - item.bbox.y0}px`,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        display: 'flex',
        flexDirection: 'column', // Arrange children vertically
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '16px', // Adjusted font size
        border: '1px solid #333',
        overflow: 'hidden',
        padding: '4px',
        boxSizing: 'border-box',
        pointerEvents: 'none',
        textAlign: 'center'
    }

    const textStyle: React.CSSProperties = {
        width: '100%',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
    }

    return (
        <div style={style}>
            <div style={{ ...textStyle, opacity: 0.7, fontSize: '12px' }}>{item.text}</div>
            <div style={textStyle}>{item.translated}</div>
        </div>
    )
}

export default Overlay
