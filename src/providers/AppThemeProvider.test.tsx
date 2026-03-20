import { render, screen } from '@testing-library/react'
import { act } from 'react'
import { describe, expect, it, beforeEach } from 'vitest'
import { useTheme } from '@mui/material/styles'
import { AppThemeProvider } from './AppThemeProvider.tsx'
import { useUiStore } from '../stores/uiStore.ts'

function ThemeModeProbe() {
  const theme = useTheme()
  return <div>{theme.palette.mode}</div>
}

describe('AppThemeProvider', () => {
  beforeEach(() => {
    useUiStore.setState({
      themeMode: 'dark',
      isSidebarOpen: false,
      density: 'comfortable',
    })
  })

  it('renders dark mode by default', () => {
    render(
      <AppThemeProvider>
        <ThemeModeProbe />
      </AppThemeProvider>,
    )
    expect(screen.getByText('dark')).toBeInTheDocument()
  })

  it('updates palette mode when store changes', () => {
    render(
      <AppThemeProvider>
        <ThemeModeProbe />
      </AppThemeProvider>,
    )
    act(() => {
      useUiStore.getState().setThemeMode('light')
    })
    expect(screen.getByText('light')).toBeInTheDocument()
  })
})
