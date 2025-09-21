import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'

import './assets/base.css'
import './assets/main.css'

import App from './App'
import ControlPanel from './components/ControlPanel'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <HashRouter>
            <Routes>
                <Route path="/control" element={<ControlPanel />} />
                <Route path="/" element={<App />} />
            </Routes>
        </HashRouter>
    </React.StrictMode>
)
