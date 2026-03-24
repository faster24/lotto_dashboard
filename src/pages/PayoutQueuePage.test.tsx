import { act } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { PayoutQueuePage } from './PayoutQueuePage.tsx'
import { useAuthStore } from '../stores/authStore.ts'
import { ApiError } from '../lib/apiClient.ts'
import type { Bet } from '../types/api.ts'

const listMock = vi.fn()
const listAdminMock = vi.fn()

vi.mock('../api/betsApi.ts', () => ({
  betsApi: {
    list: (...args: unknown[]) => listMock(...args),
    listAdmin: (...args: unknown[]) => listAdminMock(...args),
  },
}))

const makeBet = (overrides: Partial<Bet> = {}): Bet => ({
  id: '11111111-1111-1111-1111-111111111111',
  user_id: 1,
  user: null,
  bet_slip: '22222222-2222-2222-2222-222222222222',
  bet_type: '2D',
  target_opentime: '11:00:00',
  stock_date: '2026-03-23',
  amount: 1000,
  total_amount: '1000.00',
  status: 'ACCEPTED',
  bet_result_status: 'WON',
  payout_status: 'PENDING',
  paid_out_at: null,
  paid_out_by_user_id: null,
  payout_reference: null,
  payout_note: null,
  placed_at: null,
  settled_at: null,
  settled_result_history_id: null,
  bet_numbers: [],
  pay_slip: {
    exists: false,
    download_url: null,
    file_name: null,
    mime_type: null,
    size: null,
  },
  payout_proof: {
    exists: false,
    download_url: null,
    file_name: null,
    mime_type: null,
    size: null,
  },
  created_at: '2026-03-23T00:00:00Z',
  updated_at: '2026-03-23T00:00:00Z',
  ...overrides,
})

const shortId = (id: string) => `${id.slice(0, 8)}…${id.slice(-6)}`

describe('PayoutQueuePage', () => {
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

  it('loads from admin endpoint and shows only ACCEPTED + WON + PENDING bets', async () => {
    const eligible = makeBet({
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      status: 'ACCEPTED',
      bet_result_status: 'WON',
      payout_status: 'PENDING',
    })
    const pendingReview = makeBet({
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      status: 'PENDING',
      bet_result_status: 'WON',
      payout_status: 'PENDING',
    })
    const openResult = makeBet({
      id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      status: 'ACCEPTED',
      bet_result_status: 'OPEN',
      payout_status: 'PENDING',
    })
    const alreadyPaid = makeBet({
      id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
      status: 'ACCEPTED',
      bet_result_status: 'WON',
      payout_status: 'PAID_OUT',
    })

    listAdminMock.mockResolvedValue({
      data: { bets: [eligible, pendingReview, openResult, alreadyPaid] },
    })

    render(
      <MemoryRouter>
        <PayoutQueuePage />
      </MemoryRouter>,
    )

    await waitFor(() =>
      expect(listAdminMock).toHaveBeenCalledWith('admin-token', { page: 1, pageSize: 100 }),
    )
    expect(listMock).not.toHaveBeenCalled()

    expect(await screen.findByText(shortId(eligible.id))).toBeInTheDocument()
    expect(screen.queryByText(shortId(pendingReview.id))).not.toBeInTheDocument()
    expect(screen.queryByText(shortId(openResult.id))).not.toBeInTheDocument()
    expect(screen.queryByText(shortId(alreadyPaid.id))).not.toBeInTheDocument()
  })

  it('clears stale queue data and shows admin access error when reload fails', async () => {
    const eligible = makeBet({
      id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
      status: 'ACCEPTED',
      bet_result_status: 'WON',
      payout_status: 'PENDING',
    })
    listAdminMock
      .mockResolvedValueOnce({ data: { bets: [eligible] } })
      .mockRejectedValueOnce(new ApiError('Forbidden', 403, null))

    render(
      <MemoryRouter>
        <PayoutQueuePage />
      </MemoryRouter>,
    )

    expect(await screen.findByText(shortId(eligible.id))).toBeInTheDocument()

    await act(async () => {
      useAuthStore.setState({ token: 'admin-token-2' })
    })

    expect(await screen.findByText('Payout queue requires admin access.')).toBeInTheDocument()
    expect(screen.queryByText(shortId(eligible.id))).not.toBeInTheDocument()
    expect(screen.getByText('No accepted winning bets pending payout.')).toBeInTheDocument()
  })
})
