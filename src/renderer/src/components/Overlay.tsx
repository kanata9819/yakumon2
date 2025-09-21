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
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '18px',
        border: '1px solid #333',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
        padding: '2px',
        boxSizing: 'border-box',
        pointerEvents: 'none'
    }

    return <div style={style}>{item.translated}</div>
}

export default Overlay
