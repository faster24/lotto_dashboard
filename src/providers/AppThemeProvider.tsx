import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { useMemo, type PropsWithChildren } from 'react'
import { useUiStore } from '../stores/uiStore.ts'
import type { ThemeMode } from '../types/dashboard.ts'

const getTheme = (mode: ThemeMode) =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: mode === 'dark' ? '#ffffff' : '#111111',
      },
      secondary: {
        main: mode === 'dark' ? '#c7c7c7' : '#3d3d3d',
      },
      background: {
        default: mode === 'dark' ? '#0b0b0b' : '#f5f5f5',
        paper: mode === 'dark' ? '#121212' : '#ffffff',
      },
      text: {
        primary: mode === 'dark' ? '#f5f5f5' : '#0f0f0f',
        secondary: mode === 'dark' ? '#c2c2c2' : '#575757',
      },
      divider: mode === 'dark' ? '#262626' : '#d9d9d9',
    },
    shape: { borderRadius: 12 },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: { fontWeight: 600 },
      h2: { fontWeight: 600 },
      h3: { fontWeight: 600 },
      h4: { fontWeight: 600 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            minWidth: 320,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            border: '1px solid',
            borderColor: mode === 'dark' ? '#262626' : '#e2e2e2',
          },
        },
      },
    },
  })

export function AppThemeProvider({ children }: PropsWithChildren) {
  const themeMode = useUiStore((state) => state.themeMode)
  const theme = useMemo(() => getTheme(themeMode), [themeMode])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  )
}
