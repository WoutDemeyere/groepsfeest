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
    fontSize: 17,
    h1: { fontSize: '2.6rem', fontWeight: 700 },
    h2: { fontSize: '1.45rem', fontWeight: 600 },
    h5: { fontSize: '1.35rem', fontWeight: 600 },
    h6: { fontSize: '1.2rem', fontWeight: 600 },
    subtitle1: { fontSize: '1.02rem' },
    subtitle2: { fontSize: '0.95rem' },
    body1: { fontSize: '0.98rem' },
    body2: { fontSize: '0.95rem' },
    button: { fontSize: '0.95rem', textTransform: 'none' }
  },
  components: {
    MuiInputBase: {
      styleOverrides: {
        root: { fontSize: '0.98rem' },
        input: { fontSize: '0.98rem' }
      }
    },
    MuiInputLabel: {
      styleOverrides: {
        root: { fontSize: '0.95rem' }
      }
    },
    MuiSelect: {
      styleOverrides: {
        select: { fontSize: '0.98rem' }
      }
    },
    MuiMenuItem: {
      styleOverrides: {
        root: { fontSize: '0.95rem' }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: { fontSize: '0.95rem' }
      }
    },
    MuiStepLabel: {
      styleOverrides: {
        label: { fontSize: '0.85rem' }
      }
    }
  }
})
