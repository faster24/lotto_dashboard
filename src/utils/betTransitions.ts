import type { Bet, BetAdminStatus } from '../types/api.ts'

export function isAdminTransitionAllowed(bet: Bet, status: BetAdminStatus): boolean {
  switch (status) {
    case 'ACCEPTED':
    case 'REJECTED':
      return bet.status === 'PENDING'
    case 'REFUNDED':
      return bet.status !== 'REFUNDED' && bet.payout_status !== 'PAID_OUT'
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
