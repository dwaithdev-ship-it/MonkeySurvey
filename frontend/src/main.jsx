import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if ('serviceWorker' in navigator) {
  if (import.meta.env.DEV) {
    // Unregister any existing service worker in development to avoid HMR/Socket issues
    navigator.serviceWorker.getRegistrations().then(registrations => {
      for (let registration of registrations) {
        registration.unregister();
        console.log('🔄 Existing ServiceWorker unregistered for Development');
      }
    });
  } else {
    // Register in production
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then(registration => {
          console.log('✅ ServiceWorker registration successful with scope: ', registration.scope);
        })
        .catch(err => {
          console.error('❌ ServiceWorker registration failed: ', err);
        });
    });
  }
}
