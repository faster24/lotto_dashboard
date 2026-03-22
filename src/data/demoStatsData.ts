import type {
  AnalyticsDailyTrendsData,
  AnalyticsKpisData,
  AnalyticsPayoutsData,
  AnalyticsSettlementRunsData,
  AnalyticsStatusDistributionData,
  AnalyticsTopNumbersData,
} from '../types/api.ts'

export const demoKpisData: AnalyticsKpisData = {
  kpis: {
    total_bets: 1328,
    unique_bettors: 486,
    total_turnover: '9425000',
    accepted_count: 1201,
    rejected_count: 51,
    refunded_count: 76,
    won_count: 314,
    lost_count: 903,
    void_count: 111,
    paid_out_count: 287,
  },
}

export const demoDailyTrendsData: AnalyticsDailyTrendsData = {
  daily_trends: [
    { date: '2026-03-16', bet_count: 188, turnover: '1180000', won_count: 45, lost_count: 130, refund_count: 13, paid_out_count: 39 },
    { date: '2026-03-17', bet_count: 201, turnover: '1275000', won_count: 51, lost_count: 134, refund_count: 16, paid_out_count: 42 },
    { date: '2026-03-18', bet_count: 176, turnover: '1120000', won_count: 39, lost_count: 125, refund_count: 12, paid_out_count: 35 },
    { date: '2026-03-19', bet_count: 214, turnover: '1365000', won_count: 59, lost_count: 139, refund_count: 16, paid_out_count: 51 },
    { date: '2026-03-20', bet_count: 196, turnover: '1240000', won_count: 48, lost_count: 133, refund_count: 15, paid_out_count: 44 },
    { date: '2026-03-21', bet_count: 182, turnover: '1155000', won_count: 40, lost_count: 129, refund_count: 13, paid_out_count: 38 },
    { date: '2026-03-22', bet_count: 171, turnover: '1090000', won_count: 32, lost_count: 113, refund_count: 26, paid_out_count: 38 },
  ],
}

export const demoStatusDistributionData: AnalyticsStatusDistributionData = {
  status_distribution: {
    total_bets: 1328,
    status: [
      { value: 'ACCEPTED', count: 1201, percentage: 90.44 },
      { value: 'REJECTED', count: 51, percentage: 3.84 },
      { value: 'REFUNDED', count: 76, percentage: 5.72 },
    ],
    bet_result_status: [
      { value: 'WON', count: 314, percentage: 23.64 },
      { value: 'LOST', count: 903, percentage: 68.0 },
      { value: 'VOID', count: 111, percentage: 8.36 },
    ],
    payout_status: [
      { value: 'PENDING', count: 41, percentage: 12.15 },
      { value: 'PAID_OUT', count: 297, percentage: 87.85 },
    ],
  },
}

export const demoPayoutsData: AnalyticsPayoutsData = {
  payouts: {
    payout_count: 297,
    paid_out_total_amount: '2367000',
    avg_payout_per_bet: '7969.70',
    by_admin: [
      { admin_user_id: 1, admin_name: 'Ops Admin', payout_count: 124, paid_out_total_amount: '964000' },
      { admin_user_id: 2, admin_name: 'Night Shift', payout_count: 93, paid_out_total_amount: '754000' },
      { admin_user_id: 3, admin_name: 'Weekend Desk', payout_count: 80, paid_out_total_amount: '649000' },
    ],
    daily_timeline: [
      { date: '2026-03-16', payout_count: 39, paid_out_total_amount: '294000' },
      { date: '2026-03-17', payout_count: 42, paid_out_total_amount: '318000' },
      { date: '2026-03-18', payout_count: 35, paid_out_total_amount: '276000' },
      { date: '2026-03-19', payout_count: 51, paid_out_total_amount: '411000' },
      { date: '2026-03-20', payout_count: 44, paid_out_total_amount: '347000' },
      { date: '2026-03-21', payout_count: 38, paid_out_total_amount: '308000' },
      { date: '2026-03-22', payout_count: 48, paid_out_total_amount: '413000' },
    ],
  },
}

export const demoTopNumbersData: AnalyticsTopNumbersData = {
  top_numbers: [
    { number: 17, bet_frequency: 88, distinct_user_count: 53, total_stake: '542000' },
    { number: 42, bet_frequency: 84, distinct_user_count: 49, total_stake: '519000' },
    { number: 66, bet_frequency: 79, distinct_user_count: 47, total_stake: '488000' },
    { number: 11, bet_frequency: 74, distinct_user_count: 44, total_stake: '451000' },
    { number: 29, bet_frequency: 71, distinct_user_count: 40, total_stake: '432000' },
    { number: 90, bet_frequency: 68, distinct_user_count: 39, total_stake: '410000' },
    { number: 3, bet_frequency: 63, distinct_user_count: 37, total_stake: '385000' },
    { number: 58, bet_frequency: 60, distinct_user_count: 33, total_stake: '364000' },
  ],
}

export const demoSettlementRunsData: AnalyticsSettlementRunsData = {
  settlement_runs: {
    total_runs: 12,
    completed_runs: 11,
    pending_runs: 1,
    summary_totals: {
      processed: 1328,
      won: 314,
      lost: 903,
    },
    runs: [
      {
        history_id: 'hist_20260322_1630',
        stock_date: '2026-03-22',
        open_time: '16:30:00',
        twod: '48',
        settled_at: '2026-03-22 16:35:12',
        created_at: '2026-03-22 16:30:05',
        summary: { processed: 171, won: 32, lost: 113 },
      },
      {
        history_id: 'hist_20260322_1201',
        stock_date: '2026-03-22',
        open_time: '12:01:00',
        twod: '07',
        settled_at: '2026-03-22 12:05:44',
        created_at: '2026-03-22 12:01:04',
        summary: { processed: 164, won: 29, lost: 119 },
      },
      {
        history_id: 'hist_20260321_1630',
        stock_date: '2026-03-21',
        open_time: '16:30:00',
        twod: '90',
        settled_at: '2026-03-21 16:34:52',
        created_at: '2026-03-21 16:30:06',
        summary: { processed: 182, won: 40, lost: 129 },
      },
      {
        history_id: 'hist_20260321_1201',
        stock_date: '2026-03-21',
        open_time: '12:01:00',
        twod: '24',
        settled_at: null,
        created_at: '2026-03-21 12:01:08',
        summary: {},
      },
    ],
  },
}
