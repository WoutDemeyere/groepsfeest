import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { RouterProvider } from '@tanstack/react-router'
import 'tldraw/tldraw.css'
import './styles/global.module.css'
import { appTheme } from './config/theme.config'
import { router } from './router'

const redirectParam = new URLSearchParams(window.location.search).get('redirect')
if (redirectParam) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  const nextPath = decodeURIComponent(redirectParam)
  const next = `${base}${nextPath.startsWith('/') ? '' : '/'}${nextPath}`
  window.history.replaceState(null, '', next)
}

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  </StrictMode>
)
