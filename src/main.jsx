import React from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import './index.css'
import App from './App.jsx'

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
const clerkReady = publishableKey && publishableKey.length > 8

createRoot(document.getElementById('root')).render(
  clerkReady
    ? React.createElement(ClerkProvider, { publishableKey }, React.createElement(App))
    : React.createElement(App)
)
