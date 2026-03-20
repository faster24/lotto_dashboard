import { describe, expect, it, beforeEach } from 'vitest'
import { uiStoreStorageKey, useUiStore } from './uiStore.ts'

describe('useUiStore', () => {
  beforeEach(() => {
    useUiStore.persist.clearStorage()
    useUiStore.setState({
      themeMode: 'dark',
      isSidebarOpen: false,
      density: 'comfortable',
    })
  })

  it('defaults to dark mode', () => {
    expect(useUiStore.getState().themeMode).toBe('dark')
  })

  it('toggles theme mode', () => {
    useUiStore.getState().toggleTheme()
    expect(useUiStore.getState().themeMode).toBe('light')
  })

  it('persists selected theme in storage', async () => {
    useUiStore.getState().setThemeMode('light')
    const saved = (await useUiStore.persist
      .getOptions()
      .storage?.getItem(uiStoreStorageKey)) as { state: { themeMode: string } } | null
    expect(saved?.state.themeMode).toBe('light')
  })
})
