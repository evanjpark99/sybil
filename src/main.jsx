import React from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import './index.css'
import App from './App.jsx'

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
const clerkReady = publishableKey && publishableKey.length > 8
console.log('[Sybil] VITE_CLERK_PUBLISHABLE_KEY:', publishableKey ? publishableKey.slice(0, 20) + '…' : 'MISSING/UNDEFINED')
console.log('[Sybil] clerkReady:', clerkReady)

createRoot(document.getElementById('root')).render(
  clerkReady
    ? React.createElement(ClerkProvider, { publishableKey }, React.createElement(App))
    : React.createElement(App)
)
