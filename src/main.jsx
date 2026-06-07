import React, { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import './index.css'
import App from './App.jsx'

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
const clerkReady = publishableKey && publishableKey.length > 8

// ── Sybil design tokens (mirrors index.css custom properties) ──────────────
const TOKENS = {
  light: {
    bg:         '#F4F1EA',                   // --t-cream
    input:      '#FAF7F0',                   // --t-vellum
    text:       '#0E0C0A',                   // --t-ink
    textSub:    '#5C5851',                   // --t-inkFaint
    textMuted:  '#8A857B',                   // --t-inkGhost
    primary:    '#0E0C0A',                   // dark button on light bg
    primaryFg:  '#FAF7F0',                   // text on dark button
    border:     'rgba(14,12,10,0.22)',       // --t-borderMid
    borderSoft: 'rgba(14,12,10,0.10)',       // --t-border
    gold:       '#B8651E',                   // --t-gold
    danger:     '#C8553D',                   // --t-accent
    neutral:    '#7A7468',                   // --t-stone
    panelBg:    '#EAE4D6',                   // --t-parchment
  },
  dark: {
    bg:         '#1E1C26',                   // --t-cream dark
    input:      '#13111A',                   // --t-paper dark (sunken inputs)
    text:       '#ECE6DA',                   // --t-ink dark
    textSub:    '#9C9388',                   // --t-inkFaint dark
    textMuted:  '#6E685E',                   // --t-inkGhost dark
    primary:    '#ECE6DA',                   // light button on dark bg
    primaryFg:  '#13111A',                   // text on light button
    border:     'rgba(236,230,218,0.24)',    // --t-borderMid dark
    borderSoft: 'rgba(236,230,218,0.10)',    // --t-border dark
    gold:       '#D9A85C',                   // --t-gold dark
    danger:     '#E0815F',                   // --t-accent dark
    neutral:    '#9A9286',                   // --t-stone dark
    panelBg:    '#272430',                   // --t-parchment dark
  },
}

const FD = "'Cormorant Garamond','Cormorant',Georgia,serif"
const FM = "'Courier Prime','Courier New',monospace"
const FB = "'Jost','DM Sans',system-ui,sans-serif"

function makeAppearance(isDark) {
  const t = isDark ? TOKENS.dark : TOKENS.light
  return {
    variables: {
      colorBackground:              t.bg,
      colorInputBackground:         t.input,
      colorInputText:               t.text,
      colorText:                    t.text,
      colorTextSecondary:           t.textSub,
      colorTextOnPrimaryBackground: t.primaryFg,
      colorPrimary:                 t.primary,
      colorNeutral:                 t.neutral,
      colorDanger:                  t.danger,
      fontFamily:                   FB,
      borderRadius:                 '0px',
      spacingUnit:                  '1rem',
    },
    elements: {
      // ── Modal shell ───────────────────────────────────────────────────────
      modalContent: {
        padding: '0',
      },
      card: {
        background:   t.bg,
        border:       `1px solid ${t.borderSoft}`,
        boxShadow:    'none',
        borderRadius: '0px',
        padding:      '2.8rem 3rem',
        gap:          '1.4rem',
      },

      // ── Header ────────────────────────────────────────────────────────────
      header: {
        gap: '0.5rem',
      },
      headerTitle: {
        fontFamily:    FD,
        fontWeight:    300,
        fontSize:      '2rem',
        letterSpacing: '-0.02em',
        lineHeight:    1.05,
        color:         t.text,
      },
      headerSubtitle: {
        fontFamily:    FB,
        fontSize:      '0.82rem',
        color:         t.textSub,
        letterSpacing: '0.01em',
      },

      // ── Form fields ───────────────────────────────────────────────────────
      formFieldLabel: {
        fontFamily:    FM,
        fontSize:      '0.58rem',
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color:         t.textMuted,
        fontWeight:    400,
        marginBottom:  '0.4rem',
      },
      formFieldInput: {
        borderRadius: '0px',
        borderColor:  t.border,
        background:   t.input,
        color:        t.text,
        fontSize:     '0.9rem',
        fontFamily:   FB,
        boxShadow:    'none',
        padding:      '0.65rem 0.85rem',
      },
      formFieldInputShowPasswordButton: {
        color: t.textMuted,
      },
      formFieldSuccessText: {
        fontFamily: FB,
        fontSize:   '0.78rem',
      },
      formFieldErrorText: {
        fontFamily: FB,
        fontSize:   '0.78rem',
      },

      // ── Buttons ───────────────────────────────────────────────────────────
      formButtonPrimary: {
        borderRadius:  '0px',
        background:    t.primary,
        color:         t.primaryFg,
        fontFamily:    FM,
        fontSize:      '0.58rem',
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        fontWeight:    400,
        border:        `1px solid ${t.primary}`,
        boxShadow:     'none',
        padding:       '0.75rem 1.5rem',
        marginTop:     '0.4rem',
      },
      formButtonReset: {
        fontFamily: FB,
        fontSize:   '0.82rem',
        color:      t.textSub,
      },

      // ── Social / OAuth buttons ────────────────────────────────────────────
      socialButtonsBlockButton: {
        borderRadius: '0px',
        border:       `1px solid ${t.border}`,
        background:   t.input,
        boxShadow:    'none',
        color:        t.text,
      },
      socialButtonsBlockButtonText: {
        fontFamily: FB,
        fontSize:   '0.82rem',
        color:      t.text,
      },

      // ── Divider ───────────────────────────────────────────────────────────
      dividerRow: {
        marginTop:    '1rem',
        marginBottom: '1rem',
      },
      dividerLine: {
        background: t.borderSoft,
      },
      dividerText: {
        fontFamily:    FM,
        fontSize:      '0.52rem',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color:         t.textMuted,
      },

      // ── Footer ────────────────────────────────────────────────────────────
      footer: {
        background:   t.bg,
        borderTop:    `1px solid ${t.borderSoft}`,
        marginTop:    '0.5rem',
        paddingTop:   '1.2rem',
      },
      footerActionText: {
        fontFamily: FB,
        fontSize:   '0.82rem',
        color:      t.textSub,
      },
      footerActionLink: {
        fontFamily: FB,
        fontSize:   '0.82rem',
        color:      t.gold,
      },

      // ── Misc ──────────────────────────────────────────────────────────────
      identityPreviewText: {
        fontFamily: FB,
        color:      t.text,
      },
      identityPreviewEditButton: {
        fontFamily: FB,
        color:      t.gold,
      },
      otpCodeFieldInput: {
        borderRadius: '0px',
        borderColor:  t.border,
        background:   t.input,
        color:        t.text,
        fontFamily:   FB,
      },
      formResendCodeLink: {
        color: t.gold,
      },
      badge: {
        background:    t.panelBg,
        color:         t.textSub,
        fontFamily:    FM,
        fontSize:      '0.5rem',
        letterSpacing: '0.08em',
        borderRadius:  '0px',
      },
      alertText: {
        fontFamily: FB,
        fontSize:   '0.82rem',
      },
    },
  }
}

// ── Theme-aware wrapper: MutationObserver watches html.dark class changes ──
function ThemeAwareClerkProvider({ children }) {
  const [isDark, setIsDark] = useState(
    () => document.documentElement.classList.contains('dark')
  )

  useEffect(() => {
    const obs = new MutationObserver(() =>
      setIsDark(document.documentElement.classList.contains('dark'))
    )
    obs.observe(document.documentElement, {
      attributes:      true,
      attributeFilter: ['class'],
    })
    return () => obs.disconnect()
  }, [])

  return React.createElement(
    ClerkProvider,
    { publishableKey, appearance: makeAppearance(isDark) },
    children
  )
}

createRoot(document.getElementById('root')).render(
  clerkReady
    ? React.createElement(ThemeAwareClerkProvider, null, React.createElement(App))
    : React.createElement(App)
)
