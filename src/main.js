import { jsx as _jsx } from "react/jsx-runtime";
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/outfit/wght.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import './styles.css';
import { App } from './App';
import { ToastProvider } from './components/Toast';
createRoot(document.getElementById('root')).render(_jsx(StrictMode, { children: _jsx(ToastProvider, { children: _jsx(App, {}) }) }));
// Offline support for the installed app. Skipped in dev so hot reload isn't cached.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(() => { });
    });
}
