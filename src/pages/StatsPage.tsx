import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined'
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link as RouterLink, useSearchParams } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { analyticsApi } from '../api/analyticsApi.ts'
import { ApiError } from '../lib/apiClient.ts'
import { useAuthStore } from '../stores/authStore.ts'
import type {
  AnalyticsDailyTrendsData,
  AnalyticsFilters,
  AnalyticsKpisData,
  AnalyticsPayoutsData,
  AnalyticsSettlementRunsData,
  AnalyticsStatusDistributionData,
  AnalyticsTopNumbersData,
  BetType,
  TargetOpenTime,
} from '../types/api.ts'
import { betTypes, targetOpenTimes } from '../constants/betOptions.ts'

type PresetRange = '7d' | '30d' | '90d'

interface SectionState<TData> {
  loading: boolean
  data: TData | null
  error: string | null
}

const toDateInput = (value: Date) => value.toISOString().slice(0, 10)

const buildPresetRange = (preset: PresetRange) => {
  const to = new Date()
  const from = new Date(to)
  if (preset === '7d') from.setDate(to.getDate() - 6)
  if (preset === '30d') from.setDate(to.getDate() - 29)
  if (preset === '90d') from.setDate(to.getDate() - 89)
  return { from: toDateInput(from), to: toDateInput(to) }
}

const parseIntOrUndefined = (value: string) => {
  if (!value.trim()) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}


export function StatsPage() {
  const token = useAuthStore((state) => state.token)
  const [searchParams, setSearchParams] = useSearchParams()
  const [forbidden, setForbidden] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [isDemoMode, setIsDemoMode] = useState(false)

  const initialPreset = (searchParams.get('preset') as PresetRange | null) ?? '30d'
  const initialRange = buildPresetRange(initialPreset)

  const [preset, setPreset] = useState<PresetRange>(initialPreset)
  const [dateFrom, setDateFrom] = useState(searchParams.get('date_from') ?? initialRange.from)
  const [dateTo, setDateTo] = useState(searchParams.get('date_to') ?? initialRange.to)
  const [targetOpenTime, setTargetOpenTime] = useState<TargetOpenTime | 'ALL'>(
    (searchParams.get('target_opentime') as TargetOpenTime | null) ?? 'ALL',
  )
  const [betType, setBetType] = useState<BetType | 'ALL'>(
    (searchParams.get('bet_type') as BetType | null) ?? 'ALL',
  )
  const [limit, setLimit] = useState(searchParams.get('limit') ?? '20')
  const [adminUserId, setAdminUserId] = useState(searchParams.get('admin_user_id') ?? '')

  const [kpiState, setKpiState] = useState<SectionState<AnalyticsKpisData>>({
    loading: false,
    data: null,
    error: null,
  })
  const [dailyState, setDailyState] = useState<SectionState<AnalyticsDailyTrendsData>>({
    loading: false,
    data: null,
    error: null,
  })
  const [statusState, setStatusState] = useState<SectionState<AnalyticsStatusDistributionData>>({
    loading: false,
    data: null,
    error: null,
  })
  const [payoutState, setPayoutState] = useState<SectionState<AnalyticsPayoutsData>>({
    loading: false,
    data: null,
    error: null,
  })
  const [topState, setTopState] = useState<SectionState<AnalyticsTopNumbersData>>({
    loading: false,
    data: null,
    error: null,
  })
  const [settlementState, setSettlementState] = useState<SectionState<AnalyticsSettlementRunsData>>({
    loading: false,
    data: null,
    error: null,
  })

  const analyticsFilters = useMemo<AnalyticsFilters>(
    () => ({
      dateFrom,
      dateTo,
      targetOpenTime: targetOpenTime === 'ALL' ? undefined : targetOpenTime,
      betType: betType === 'ALL' ? undefined : betType,
      limit: parseIntOrUndefined(limit),
      adminUserId: parseIntOrUndefined(adminUserId),
    }),
    [adminUserId, betType, dateFrom, dateTo, limit, targetOpenTime],
  )

  const runAnalytics = useCallback(async () => {
    if (!token) {
      setIsDemoMode(true)
      setKpiState({ loading: false, data: null, error: null })
      setDailyState({ loading: false, data: null, error: null })
      setStatusState({ loading: false, data: null, error: null })
      setPayoutState({ loading: false, data: null, error: null })
      setTopState({ loading: false, data: null, error: null })
      setSettlementState({ loading: false, data: null, error: null })
      return
    }
    setForbidden(false)
    setIsDemoMode(false)
    setKpiState((state) => ({ ...state, loading: true, error: null }))
    setDailyState((state) => ({ ...state, loading: true, error: null }))
    setStatusState((state) => ({ ...state, loading: true, error: null }))
    setPayoutState((state) => ({ ...state, loading: true, error: null }))
    setTopState((state) => ({ ...state, loading: true, error: null }))
    setSettlementState((state) => ({ ...state, loading: true, error: null }))

    const requests = [
      analyticsApi.getKpis(token, analyticsFilters),
      analyticsApi.getDailyTrends(token, analyticsFilters),
      analyticsApi.getStatusDistribution(token, analyticsFilters),
      analyticsApi.getPayouts(token, analyticsFilters),
      analyticsApi.getTopNumbers(token, analyticsFilters),
      analyticsApi.getSettlementRuns(token, analyticsFilters),
    ] as const

    const results = await Promise.allSettled(requests)

    const markForbidden = (error: unknown) => {
      if (error instanceof ApiError) {
        if (error.status === 403) setForbidden(true)
      }
    }

    const [kpiRes, dailyRes, statusRes, payoutRes, topRes, settlementRes] = results

    const hasRejectedSection = results.some((result) => result.status === 'rejected')
    setIsDemoMode(hasRejectedSection)
    if (kpiRes.status === 'rejected') markForbidden(kpiRes.reason)
    if (dailyRes.status === 'rejected') markForbidden(dailyRes.reason)
    if (statusRes.status === 'rejected') markForbidden(statusRes.reason)
    if (payoutRes.status === 'rejected') markForbidden(payoutRes.reason)
    if (topRes.status === 'rejected') markForbidden(topRes.reason)
    if (settlementRes.status === 'rejected') markForbidden(settlementRes.reason)

    setKpiState({
      loading: false,
      data: kpiRes.status === 'fulfilled' ? kpiRes.value.data : null,
      error: kpiRes.status === 'rejected' ? String(kpiRes.reason) : null,
    })
    setDailyState({
      loading: false,
      data: dailyRes.status === 'fulfilled' ? dailyRes.value.data : null,
      error: dailyRes.status === 'rejected' ? String(dailyRes.reason) : null,
    })
    setStatusState({
      loading: false,
      data: statusRes.status === 'fulfilled' ? statusRes.value.data : null,
      error: statusRes.status === 'rejected' ? String(statusRes.reason) : null,
    })
    setPayoutState({
      loading: false,
      data: payoutRes.status === 'fulfilled' ? payoutRes.value.data : null,
      error: payoutRes.status === 'rejected' ? String(payoutRes.reason) : null,
    })
    setTopState({
      loading: false,
      data: topRes.status === 'fulfilled' ? topRes.value.data : null,
      error: topRes.status === 'rejected' ? String(topRes.reason) : null,
    })
    setSettlementState({
      loading: false,
      data: settlementRes.status === 'fulfilled' ? settlementRes.value.data : null,
      error: settlementRes.status === 'rejected' ? String(settlementRes.reason) : null,
    })
  }, [analyticsFilters, token])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void runAnalytics()
    }, 0)
    return () => {
      window.clearTimeout(timer)
    }
  }, [runAnalytics])

  const applyFilters = () => {
    const nextParams = new URLSearchParams()
    nextParams.set('preset', preset)
    nextParams.set('date_from', dateFrom)
    nextParams.set('date_to', dateTo)
    if (targetOpenTime !== 'ALL') nextParams.set('target_opentime', targetOpenTime)
    if (betType !== 'ALL') nextParams.set('bet_type', betType)
    if (limit.trim()) nextParams.set('limit', limit)
    if (adminUserId.trim()) nextParams.set('admin_user_id', adminUserId)
    setSearchParams(nextParams)
    void runAnalytics()
  }

  const resetFilters = () => {
    const range = buildPresetRange('30d')
    setPreset('30d')
    setDateFrom(range.from)
    setDateTo(range.to)
    setTargetOpenTime('ALL')
    setBetType('ALL')
    setLimit('20')
    setAdminUserId('')
    setSearchParams(new URLSearchParams({ preset: '30d', date_from: range.from, date_to: range.to }))
  }

  const dailyChart = (dailyState.data?.daily_trends ?? []).map((entry) => ({
    ...entry,
    turnoverNumber: Number(entry.turnover),
  }))

  const payoutTimeline = (payoutState.data?.payouts.daily_timeline ?? []).map((entry) => ({
    ...entry,
    amountNumber: Number(entry.paid_out_total_amount),
  }))

  const topNumberChart = (topState.data?.top_numbers ?? []).map((entry) => ({
    number: String(entry.number),
    frequency: entry.bet_frequency,
  }))

  const distributionChart = [
    ...(statusState.data?.status_distribution.status ?? []).map((item) => ({
      bucket: `Review:${item.value}`,
      count: item.count,
    })),
    ...(statusState.data?.status_distribution.bet_result_status ?? []).map((item) => ({
      bucket: `Result:${item.value}`,
      count: item.count,
    })),
    ...(statusState.data?.status_distribution.payout_status ?? []).map((item) => ({
      bucket: `Payout:${item.value}`,
      count: item.count,
    })),
  ]

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1.5}>
        <Box>
          <Typography variant="h4">Stats</Typography>
          <Typography color="text.secondary">Admin analytics from `/admin/analytics/*`.</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<FilterAltOutlinedIcon />}
            onClick={() => setShowAdvanced((value) => !value)}
          >
            {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
          </Button>
          <Button variant="outlined" startIcon={<RefreshOutlinedIcon />} onClick={() => void runAnalytics()}>
            Refresh
          </Button>
          <Button component={RouterLink} to="/bets" variant="outlined">
            Back to Bets
          </Button>
        </Stack>
      </Stack>

      {forbidden && (
        <Alert severity="warning">
          You are authenticated but do not have analytics access (`403`). Stats page stays visible for graceful recovery testing.
        </Alert>
      )}
      {isDemoMode && (
        <Alert severity="warning">
          Some analytics sections failed to load. Check your connection or permissions.
        </Alert>
      )}

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
              <Select
                size="small"
                value={preset}
                onChange={(event) => {
                  const nextPreset = event.target.value as PresetRange
                  const range = buildPresetRange(nextPreset)
                  setPreset(nextPreset)
                  setDateFrom(range.from)
                  setDateTo(range.to)
                }}
                sx={{ minWidth: 160 }}
              >
                <MenuItem value="7d">Last 7 days</MenuItem>
                <MenuItem value="30d">Last 30 days</MenuItem>
                <MenuItem value="90d">Last 90 days</MenuItem>
              </Select>
              <TextField
                size="small"
                label="Date From"
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                size="small"
                label="Date To"
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Stack>

            {showAdvanced && (
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                <Select
                  size="small"
                  value={targetOpenTime}
                  onChange={(event) =>
                    setTargetOpenTime(event.target.value as TargetOpenTime | 'ALL')
                  }
                  sx={{ minWidth: 180 }}
                >
                  <MenuItem value="ALL">All Open Times</MenuItem>
                  {targetOpenTimes.map((time) => (
                    <MenuItem key={time} value={time}>
                      {time}
                    </MenuItem>
                  ))}
                </Select>
                <Select
                  size="small"
                  value={betType}
                  onChange={(event) => setBetType(event.target.value as BetType | 'ALL')}
                  sx={{ minWidth: 140 }}
                >
                  <MenuItem value="ALL">All Bet Types</MenuItem>
                  {betTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
                <TextField
                  size="small"
                  label="Top Number Limit"
                  type="number"
                  inputProps={{ min: 1, max: 100 }}
                  value={limit}
                  onChange={(event) => setLimit(event.target.value)}
                />
                <TextField
                  size="small"
                  label="Admin User ID"
                  type="number"
                  value={adminUserId}
                  onChange={(event) => setAdminUserId(event.target.value)}
                />
              </Stack>
            )}

            <Stack direction="row" spacing={1}>
              <Button variant="contained" onClick={applyFilters}>
                Apply Filters
              </Button>
              <Button variant="outlined" onClick={resetFilters}>
                Reset
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        {kpiState.error && <Grid size={12}><Alert severity="error">{kpiState.error}</Alert></Grid>}
        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <Card><CardContent><Typography variant="body2">Total Bets</Typography><Typography variant="h4">{kpiState.loading ? '…' : (kpiState.data?.kpis.total_bets ?? 0)}</Typography></CardContent></Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <Card><CardContent><Typography variant="body2">Unique Bettors</Typography><Typography variant="h4">{kpiState.loading ? '…' : (kpiState.data?.kpis.unique_bettors ?? 0)}</Typography></CardContent></Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <Card><CardContent><Typography variant="body2">Turnover</Typography><Typography variant="h4">{kpiState.loading ? '…' : (kpiState.data?.kpis.total_turnover ?? '0')}</Typography></CardContent></Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <Card><CardContent><Typography variant="body2">Paid Out</Typography><Typography variant="h4">{kpiState.loading ? '…' : (kpiState.data?.kpis.paid_out_count ?? 0)}</Typography></CardContent></Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h6">Daily Trends</Typography>
              {dailyState.error && <Alert severity="error" sx={{ mt: 1 }}>{dailyState.error}</Alert>}
              <Box sx={{ height: 280, mt: 1 }}>
                <ResponsiveContainer>
                  <LineChart data={dailyChart}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="bet_count" stroke="#ffffff" dot={false} />
                    <Line type="monotone" dataKey="turnoverNumber" stroke="#9e9e9e" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6">Status Distribution</Typography>
              {statusState.error && <Alert severity="error" sx={{ mt: 1 }}>{statusState.error}</Alert>}
              <Box sx={{ height: 280, mt: 1 }}>
                <ResponsiveContainer>
                  <BarChart data={distributionChart}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                    <XAxis dataKey="bucket" interval={0} angle={-20} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#bdbdbd" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6">Payout Timeline</Typography>
              {payoutState.error && <Alert severity="error" sx={{ mt: 1 }}>{payoutState.error}</Alert>}
              <Box sx={{ height: 260, mt: 1 }}>
                <ResponsiveContainer>
                  <LineChart data={payoutTimeline}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="payout_count" stroke="#ffffff" dot={false} />
                    <Line type="monotone" dataKey="amountNumber" stroke="#9e9e9e" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6">Top Numbers</Typography>
              {topState.error && <Alert severity="error" sx={{ mt: 1 }}>{topState.error}</Alert>}
              <Box sx={{ height: 260, mt: 1 }}>
                <ResponsiveContainer>
                  <BarChart data={topNumberChart}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                    <XAxis dataKey="number" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="frequency" fill="#9e9e9e" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={12}>
          <Card>
            <CardContent>
              <Typography variant="h6">Settlement Runs</Typography>
              {settlementState.error && <Alert severity="error" sx={{ mt: 1 }}>{settlementState.error}</Alert>}
              <Stack direction="row" spacing={1} sx={{ my: 1 }}>
                <Paper variant="outlined" sx={{ p: 1.5 }}><Typography variant="caption">Total</Typography><Typography variant="h6">{settlementState.data?.settlement_runs.total_runs ?? 0}</Typography></Paper>
                <Paper variant="outlined" sx={{ p: 1.5 }}><Typography variant="caption">Completed</Typography><Typography variant="h6">{settlementState.data?.settlement_runs.completed_runs ?? 0}</Typography></Paper>
                <Paper variant="outlined" sx={{ p: 1.5 }}><Typography variant="caption">Pending</Typography><Typography variant="h6">{settlementState.data?.settlement_runs.pending_runs ?? 0}</Typography></Paper>
              </Stack>
              <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>History ID</TableCell>
                      <TableCell>Stock Date</TableCell>
                      <TableCell>Open Time</TableCell>
                      <TableCell>2D</TableCell>
                      <TableCell>Settled At</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(settlementState.data?.settlement_runs.runs ?? []).map((run) => (
                      <TableRow key={run.history_id}>
                        <TableCell sx={{ fontFamily: '"Roboto Mono", monospace' }}>{run.history_id}</TableCell>
                        <TableCell>{run.stock_date ?? '-'}</TableCell>
                        <TableCell>{run.open_time ?? '-'}</TableCell>
                        <TableCell>{run.twod ?? '-'}</TableCell>
                        <TableCell>{run.settled_at ?? '-'}</TableCell>
                      </TableRow>
                    ))}
                    {!settlementState.loading &&
                      (settlementState.data?.settlement_runs.runs.length ?? 0) === 0 && (
                        <TableRow>
                          <TableCell align="center" colSpan={5}>
                            No settlement runs.
                          </TableCell>
                        </TableRow>
                      )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  )
}
