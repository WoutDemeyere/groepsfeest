import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { RouterProvider } from '@tanstack/react-router'
import 'tldraw/tldraw.css'
import './styles/global.module.css'
import { appTheme } from './config/theme.config'
import { router } from './router'

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  </StrictMode>
)
