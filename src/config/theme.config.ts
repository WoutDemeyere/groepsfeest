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
    fontSize: 12,
    h1: { fontSize: '1.65rem', fontWeight: 700 },
    h2: { fontSize: '0.95rem', fontWeight: 600 },
    h5: { fontSize: '0.86rem', fontWeight: 600 },
    h6: { fontSize: '0.8rem', fontWeight: 600 },
    subtitle1: { fontSize: '0.69rem' },
    subtitle2: { fontSize: '0.66rem' },
    body1: { fontSize: '0.68rem' },
    body2: { fontSize: '0.66rem' },
    button: { fontSize: '0.66rem', textTransform: 'none' }
  },
  components: {
    MuiInputBase: {
      styleOverrides: {
        root: { fontSize: '0.68rem' },
        input: { fontSize: '0.68rem' }
      }
    },
    MuiInputLabel: {
      styleOverrides: {
        root: { fontSize: '0.66rem' }
      }
    },
    MuiSelect: {
      styleOverrides: {
        select: { fontSize: '0.68rem' }
      }
    },
    MuiMenuItem: {
      styleOverrides: {
        root: { fontSize: '0.66rem' }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: { fontSize: '0.66rem' }
      }
    },
    MuiStepLabel: {
      styleOverrides: {
        label: { fontSize: '0.6rem' }
      }
    }
  }
})
