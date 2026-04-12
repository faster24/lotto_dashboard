export interface ApiEnvelope<TData> {
  message: string
  data: TData | null
  errors: Record<string, string[]> | Record<string, unknown> | null
}

export interface User {
  id: number
  name: string
  username: string | null
  email: string
  role: 'user' | 'vip' | null
  roles: string[]
  is_banned: boolean
  banned_at: string | null
  created_at: string
  updated_at: string
}

export interface AdminAssignUserRolePayload {
  role: 'user' | 'vip'
}

export type WalletBankName = 'KBZ' | 'AYA' | 'CB' | 'UAB' | 'YOMA' | 'OTHER'

export interface WalletBankInfo {
  bank_name: WalletBankName
  account_name: string
  account_number: string
}

export interface AdminUser extends User {
  bank_info: WalletBankInfo | null
}

export interface BetUserWithWallet extends User {
  wallet: WalletBankInfo | null
}

export interface AuthData {
  user: User
  token: string
}

export interface AdminUserListData {
  users: User[]
}

export interface AdminUserDetailData {
  user: AdminUser
}

export interface BetNumber {
  id: string
  bet_id: string
  number: number
  created_at: string
  updated_at: string
}

export interface BetFileMeta {
  exists: boolean
  download_url: string | null
  file_name: string | null
  mime_type: string | null
  size: number | null
}

export type BetType = '2D' | '3D'
export type TargetOpenTime = '11:00:00' | '12:01:00' | '15:00:00' | '16:30:00'
export type BetStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'REFUNDED'
export type BetResultStatus = 'OPEN' | 'WON' | 'LOST' | 'VOID'
export type PayoutStatus = 'PENDING' | 'PAID_OUT' | 'REFUNDED'
export type BetAdminStatus = 'ACCEPTED' | 'REJECTED' | 'REFUNDED'

export interface Bet {
  id: string
  user_id: number
  user: BetUserWithWallet | null
  bet_slip: string
  bet_type: BetType
  target_opentime: TargetOpenTime
  stock_date: string
  amount: number
  total_amount: string
  status: BetStatus
  bet_result_status: BetResultStatus
  payout_status: PayoutStatus
  paid_out_at: string | null
  paid_out_by_user_id: number | null
  payout_reference: string | null
  payout_note: string | null
  placed_at: string | null
  settled_at: string | null
  settled_result_history_id: string | null
  bet_numbers: BetNumber[]
  pay_slip: BetFileMeta
  payout_proof: BetFileMeta
  created_at: string
  updated_at: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface BetStorePayload {
  paySlipImage: File
  betType: BetType
  targetOpenTime: TargetOpenTime
  amount: number
  betNumbers: number[]
}

export interface BetUpdatePayload {
  betType?: BetType
  targetOpenTime?: TargetOpenTime
  amount?: number
  betNumbers?: number[]
}

export interface BetPayoutPayload {
  payoutProofImage: File
  payoutReference?: string
  payoutNote?: string
}

export type BetRefundPayload = BetPayoutPayload

export interface BetAdminStatusUpdatePayload {
  status: BetAdminStatus
}

export interface BetListData {
  bets: Bet[]
}

export interface BetItemData {
  bet: Bet
}

export interface TwoDResult {
  id: number
  history_id: string
  stock_date: string | null
  stock_datetime: string | null
  open_time: string | null
  twod: string | null
  set_index: string | null
  value: string | null
  payload: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface TwoDResultListData {
  two_d_results: TwoDResult[]
}

export interface TwoDResultItemData {
  two_d_result: TwoDResult | null
}

export interface ThreeDResult {
  id: number
  stock_date: string
  threed: string
  created_at: string
  updated_at: string
}

export interface ThreeDResultListData {
  three_d_results: ThreeDResult[]
}

export interface ThreeDResultItemData {
  three_d_result: ThreeDResult | null
}

export interface ThreeDResultWritePayload {
  stockDate: string
  threed: string
}

export interface OddSetting {
  id: number
  bet_type: BetType
  odd: string
  is_active: boolean
  user_type: 'user' | 'vip' | null
  currency: string | null
  created_at: string
  updated_at: string
}

export interface OddSettingListData {
  odd_settings: OddSetting[]
}

export interface OddSettingItemData {
  odd_setting: OddSetting | null
}

export interface OddSettingWritePayload {
  betType: BetType
  odd: number
  isActive?: boolean
}

export type BankCurrency = 'THB' | 'MMK'

export interface AdminBankSetting {
  id: number
  bank_name: string
  account_holder_name: string
  account_number: string
  is_active: boolean
  is_primary: boolean
  currency: BankCurrency
  created_at: string
  updated_at: string
}

export interface AdminBankSettingListData {
  admin_bank_settings: AdminBankSetting[]
}

export interface AdminBankSettingItemData {
  admin_bank_setting: AdminBankSetting | null
}

export interface AdminBankSettingWritePayload {
  bank_name: string
  account_holder_name: string
  account_number: string
  is_active?: boolean
  is_primary?: boolean
  currency: BankCurrency
}

export interface AdminAccountUpdatePayload {
  email?: string
  current_password?: string
  password?: string
  password_confirmation?: string
}

export interface AnalyticsFilters {
  dateFrom?: string
  dateTo?: string
  targetOpenTime?: TargetOpenTime
  betType?: BetType
  adminUserId?: number
  limit?: number
}

export interface AnalyticsKpis {
  total_bets: number
  unique_bettors: number
  total_turnover: string
  accepted_count: number
  rejected_count: number
  refunded_count: number
  won_count: number
  lost_count: number
  void_count: number
  paid_out_count: number
}

export interface AnalyticsKpisData {
  kpis: AnalyticsKpis
}

export interface AnalyticsDailyTrendItem {
  date: string
  bet_count: number
  turnover: string
  won_count: number
  lost_count: number
  refund_count: number
  paid_out_count: number
}

export interface AnalyticsDailyTrendsData {
  daily_trends: AnalyticsDailyTrendItem[]
}

export interface AnalyticsBucketItem {
  value: string
  count: number
  percentage: number
}

export interface AnalyticsStatusDistribution {
  total_bets: number
  status: AnalyticsBucketItem[]
  bet_result_status: AnalyticsBucketItem[]
  payout_status: AnalyticsBucketItem[]
}

export interface AnalyticsStatusDistributionData {
  status_distribution: AnalyticsStatusDistribution
}

export interface AnalyticsPayoutByAdminItem {
  admin_user_id: number | null
  admin_name: string | null
  payout_count: number
  paid_out_total_amount: string
}

export interface AnalyticsPayoutTimelineItem {
  date: string
  payout_count: number
  paid_out_total_amount: string
}

export interface AnalyticsPayouts {
  payout_count: number
  paid_out_total_amount: string
  avg_payout_per_bet: string
  by_admin: AnalyticsPayoutByAdminItem[]
  daily_timeline: AnalyticsPayoutTimelineItem[]
}

export interface AnalyticsPayoutsData {
  payouts: AnalyticsPayouts
}

export interface AnalyticsTopNumberItem {
  number: number
  bet_frequency: number
  distinct_user_count: number
  total_stake: string
}

export interface AnalyticsTopNumbersData {
  top_numbers: AnalyticsTopNumberItem[]
}

export interface AnalyticsSettlementRunItem {
  history_id: string
  stock_date: string | null
  open_time: string | null
  twod: string | null
  settled_at: string | null
  created_at: string
  summary: Record<string, unknown>
}

export interface AnalyticsSettlementRuns {
  total_runs: number
  completed_runs: number
  pending_runs: number
  summary_totals: {
    processed: number
    won: number
    lost: number
  }
  runs: AnalyticsSettlementRunItem[]
}

export interface AnalyticsSettlementRunsData {
  settlement_runs: AnalyticsSettlementRuns
}
