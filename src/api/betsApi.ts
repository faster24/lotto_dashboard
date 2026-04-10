import { apiBlobRequest, apiRequest } from '../lib/apiClient.ts'
import type {
  BetAdminStatusUpdatePayload,
  BetItemData,
  BetListData,
  BetPayoutPayload,
  BetRefundPayload,
  BetStorePayload,
  BetUpdatePayload,
} from '../types/api.ts'

interface ListBetParams {
  page: number
  pageSize: number
}

const buildQuery = (params: ListBetParams) =>
  `?page=${encodeURIComponent(params.page)}&page_size=${encodeURIComponent(params.pageSize)}`

const buildStoreFormData = (payload: BetStorePayload) => {
  const formData = new FormData()
  formData.append('pay_slip_image', payload.paySlipImage)
  formData.append('bet_type', payload.betType)
  formData.append('target_opentime', payload.targetOpenTime)
  formData.append('amount', String(payload.amount))
  payload.betNumbers.forEach((number, index) => {
    formData.append(`bet_numbers[${index}]`, String(number))
  })
  return formData
}

const buildPayoutFormData = (payload: BetPayoutPayload | BetRefundPayload) => {
  const formData = new FormData()
  formData.append('payout_proof_image', payload.payoutProofImage)
  if (payload.payoutReference) {
    formData.append('payout_reference', payload.payoutReference)
  }
  if (payload.payoutNote) {
    formData.append('payout_note', payload.payoutNote)
  }
  return formData
}

export const betsApi = {
  list: (token: string, params: ListBetParams) =>
    apiRequest<BetListData>(`/bets${buildQuery(params)}`, {
      method: 'GET',
      token,
    }),

  listAdmin: (token: string, params: ListBetParams) =>
    apiRequest<BetListData>(`/admin/bets${buildQuery(params)}`, {
      method: 'GET',
      token,
    }),

  create: (token: string, payload: BetStorePayload) =>
    apiRequest<BetItemData>('/bets', {
      method: 'POST',
      token,
      body: buildStoreFormData(payload),
    }),

  getById: (token: string, betId: string) =>
    apiRequest<BetItemData>(`/bets/${betId}`, {
      method: 'GET',
      token,
    }),

  getAdminById: (token: string, betId: string) =>
    apiRequest<BetItemData>(`/admin/bets/${betId}`, {
      method: 'GET',
      token,
    }),

  update: (token: string, betId: string, payload: BetUpdatePayload) =>
    apiRequest<BetItemData>(`/bets/${betId}`, {
      method: 'PUT',
      token,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bet_type: payload.betType,
        target_opentime: payload.targetOpenTime,
        amount: payload.amount,
        bet_numbers: payload.betNumbers,
      }),
    }),

  remove: (token: string, betId: string) =>
    apiRequest<null>(`/bets/${betId}`, {
      method: 'DELETE',
      token,
    }),

  updateAdminStatus: (
    token: string,
    betId: string,
    payload: BetAdminStatusUpdatePayload,
  ) =>
    apiRequest<BetItemData>(`/admin/bets/${betId}/status`, {
      method: 'PATCH',
      token,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: payload.status }),
    }),

  payout: (token: string, betId: string, payload: BetPayoutPayload) =>
    apiRequest<BetItemData>(`/admin/bets/${betId}/payout`, {
      method: 'POST',
      token,
      body: buildPayoutFormData(payload),
    }),

  refund: (token: string, betId: string, payload: BetRefundPayload) =>
    apiRequest<BetItemData>(`/admin/bets/${betId}/refund`, {
      method: 'POST',
      token,
      body: buildPayoutFormData(payload),
    }),

  downloadPaySlip: (token: string, betId: string) =>
    apiBlobRequest(`/bets/${betId}/pay-slip`, token),

  downloadPayoutProof: (token: string, betId: string) =>
    apiBlobRequest(`/bets/${betId}/payout-proof`, token),
}
