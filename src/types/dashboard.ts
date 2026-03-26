export type ThemeMode = 'light' | 'dark'
export type UiDensity = 'comfortable' | 'compact'
export type NavModule =
  | 'bets'
  | 'create-bet'
  | 'payout-queue'
  | 'stats'
  | 'results-2d'
  | 'results-3d'
  | 'odds-settings'
  | 'users'
export type UserRole = 'Admin' | 'Editor' | 'Analyst'
export type UserStatus = 'Active' | 'Invited' | 'Suspended'

export interface KpiMetric {
  id: string
  label: string
  value: number
  unit?: string
  changePct: number
}

export interface TrendPoint {
  period: string
  revenue: number
  sessions: number
}

export interface CategoryMetric {
  category: string
  value: number
}

export interface FunnelStage {
  stage: string
  users: number
}

export interface ActivityItem {
  id: string
  action: string
  module: string
  owner: string
  timestamp: string
}

export interface UserRecord {
  id: string
  name: string
  email: string
  role: UserRole
  status: UserStatus
  lastActive: string
}

export interface SettingsSeed {
  organizationName: string
  contactEmail: string
  timezone: string
}

export interface DashboardData {
  kpis: KpiMetric[]
  trendSeries: TrendPoint[]
  channelMix: CategoryMetric[]
  funnel: FunnelStage[]
  activity: ActivityItem[]
  users: UserRecord[]
  settings: SettingsSeed
}

export interface AnalyticsFilters {
  dateRange: '7d' | '30d' | '90d'
  segment: 'all' | 'new' | 'returning'
  channel: 'all' | 'organic' | 'paid' | 'partner'
}
