import type { Bet, BetAdminStatus } from '../types/api.ts'

const isRefunded = (bet: Bet) =>
  bet.status === 'REFUNDED' || bet.payout_status === 'REFUNDED'

export function isAdminTransitionAllowed(bet: Bet, status: BetAdminStatus): boolean {
  if (isRefunded(bet)) return false
  switch (status) {
    case 'ACCEPTED':
    case 'REJECTED':
      return bet.status === 'PENDING'
    case 'REFUNDED':
      return bet.payout_status !== 'PAID_OUT'
  }
}

export function getAdminTransitionLabel(status: BetAdminStatus): string {
  switch (status) {
    case 'ACCEPTED':
      return 'Accept'
    case 'REJECTED':
      return 'Reject'
    case 'REFUNDED':
      return 'Refund'
  }
}

export const adminTransitions: BetAdminStatus[] = ['ACCEPTED', 'REJECTED', 'REFUNDED']
