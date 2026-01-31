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
    fontSize: 19,
    h1: { fontSize: '2.9rem', fontWeight: 700 },
    h2: { fontSize: '1.6rem', fontWeight: 600 },
    h5: { fontSize: '1.5rem', fontWeight: 600 },
    h6: { fontSize: '1.3rem', fontWeight: 600 },
    subtitle1: { fontSize: '1.1rem' },
    subtitle2: { fontSize: '1rem' },
    body1: { fontSize: '1.05rem' },
    body2: { fontSize: '1rem' },
    button: { fontSize: '1rem', textTransform: 'none' }
  },
  components: {
    MuiInputBase: {
      styleOverrides: {
        root: { fontSize: '1.05rem' },
        input: { fontSize: '1.05rem' }
      }
    },
    MuiInputLabel: {
      styleOverrides: {
        root: { fontSize: '1rem' }
      }
    },
    MuiSelect: {
      styleOverrides: {
        select: { fontSize: '1.05rem' }
      }
    },
    MuiMenuItem: {
      styleOverrides: {
        root: { fontSize: '1rem' }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: { fontSize: '1rem' }
      }
    },
    MuiStepLabel: {
      styleOverrides: {
        label: { fontSize: '0.95rem' }
      }
    }
  }
})
