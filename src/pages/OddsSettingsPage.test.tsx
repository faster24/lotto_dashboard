import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { OddsSettingsPage } from './OddsSettingsPage.tsx'
import { useAuthStore } from '../stores/authStore.ts'

const listMock = vi.fn()
const createMock = vi.fn()
const updateMock = vi.fn()
const removeMock = vi.fn()

vi.mock('../api/oddSettingsApi.ts', () => ({
  oddSettingsApi: {
    list: (...args: unknown[]) => listMock(...args),
    create: (...args: unknown[]) => createMock(...args),
    update: (...args: unknown[]) => updateMock(...args),
    remove: (...args: unknown[]) => removeMock(...args),
  },
}))

describe('OddsSettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.persist.clearStorage()
    useAuthStore.setState({
      isAuthenticated: true,
      user: null,
      token: 'admin-token',
      isAdmin: true,
    })
  })

  it('loads odd settings list', async () => {
    listMock.mockResolvedValue({
      data: {
        odd_settings: [
          {
            id: 1,
            bet_type: '2D',
            odd: '80.00',
            is_active: true,
            created_at: '2026-03-25T00:00:00Z',
            updated_at: '2026-03-25T00:00:00Z',
          },
        ],
      },
    })

    render(<OddsSettingsPage />)

    expect(await screen.findByText('80.00')).toBeInTheDocument()
    expect(listMock).toHaveBeenCalledWith('admin-token')
  })

  it('creates a new setting when selected bet type does not exist', async () => {
    const user = userEvent.setup()
    listMock
      .mockResolvedValueOnce({
        data: {
          odd_settings: [
            {
              id: 2,
              bet_type: '3D',
              odd: '500.00',
              is_active: true,
              created_at: '2026-03-25T00:00:00Z',
              updated_at: '2026-03-25T00:00:00Z',
            },
          ],
        },
      })
      .mockResolvedValueOnce({
        data: {
          odd_settings: [
            {
              id: 2,
              bet_type: '3D',
              odd: '500.00',
              is_active: true,
              created_at: '2026-03-25T00:00:00Z',
              updated_at: '2026-03-25T00:00:00Z',
            },
            {
              id: 3,
              bet_type: '2D',
              odd: '90',
              is_active: true,
              created_at: '2026-03-25T00:00:00Z',
              updated_at: '2026-03-25T00:00:00Z',
            },
          ],
        },
      })
    createMock.mockResolvedValue({ data: { odd_setting: null } })

    render(<OddsSettingsPage />)

    const oddInput = await screen.findByLabelText('Odd')
    await user.type(oddInput, '90')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() =>
      expect(createMock).toHaveBeenCalledWith('admin-token', {
        betType: '2D',
        odd: 90,
        isActive: true,
      }),
    )
    expect(updateMock).not.toHaveBeenCalled()
  })

  it('upserts by updating existing row when bet type already exists', async () => {
    const user = userEvent.setup()
    listMock
      .mockResolvedValueOnce({
        data: {
          odd_settings: [
            {
              id: 1,
              bet_type: '2D',
              odd: '80.00',
              is_active: true,
              created_at: '2026-03-25T00:00:00Z',
              updated_at: '2026-03-25T00:00:00Z',
            },
          ],
        },
      })
      .mockResolvedValueOnce({
        data: {
          odd_settings: [
            {
              id: 1,
              bet_type: '2D',
              odd: '95',
              is_active: true,
              created_at: '2026-03-25T00:00:00Z',
              updated_at: '2026-03-25T00:00:00Z',
            },
          ],
        },
      })
    updateMock.mockResolvedValue({ data: { odd_setting: null } })

    render(<OddsSettingsPage />)

    const oddInput = await screen.findByLabelText('Odd')
    await user.type(oddInput, '95')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() =>
      expect(updateMock).toHaveBeenCalledWith('admin-token', 1, {
        betType: '2D',
        odd: 95,
        isActive: true,
      }),
    )
    expect(createMock).not.toHaveBeenCalled()
  })

  it('shows non-admin warning', async () => {
    listMock.mockResolvedValue({ data: { odd_settings: [] } })
    useAuthStore.setState({ isAdmin: false })

    render(<OddsSettingsPage />)

    expect(
      await screen.findByText(
        'Admin claim is not detected in token claims. Actions are still enabled and API permissions will be enforced server-side.',
      ),
    ).toBeInTheDocument()
  })
})
