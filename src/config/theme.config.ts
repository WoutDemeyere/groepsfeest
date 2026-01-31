import { createTheme } from '@mui/material'

export const appTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#7c8bff' },
    background: {
      default: '#1a1a2e',
      paper: 'rgba(10, 12, 28, 0.7)'
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255,255,255,0.75)'
    }
  },
  shape: { borderRadius: 16 },
  typography: {
    fontFamily: "'Manrope', system-ui, sans-serif",
    h1: { fontSize: '2rem', fontWeight: 700 },
    h2: { fontSize: '1.1rem', fontWeight: 600 }
  }
})
