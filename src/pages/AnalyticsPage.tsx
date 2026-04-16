import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
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
  Typography,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { analyticsApi } from '../api/analyticsApi.ts'
import { useAuthStore } from '../stores/authStore.ts'
import type {
  AnalyticsDailyTrendsData,
  AnalyticsKpisData,
  AnalyticsStatusDistributionData,
  AnalyticsTopNumbersData,
  BetType,
} from '../types/api.ts'

type PresetRange = '7d' | '30d' | '90d'

const pieColors = ['#4caf50', '#f44336', '#ff9800', '#9e9e9e']

const toDateInput = (value: Date) => value.toISOString().slice(0, 10)

const buildPresetRange = (preset: PresetRange) => {
  const to = new Date()
  const from = new Date(to)
  if (preset === '7d') from.setDate(to.getDate() - 6)
  if (preset === '30d') from.setDate(to.getDate() - 29)
  if (preset === '90d') from.setDate(to.getDate() - 89)
  return { from: toDateInput(from), to: toDateInput(to) }
}

const formatMMK = (value: number) =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value)

export function AnalyticsPage() {
  const theme = useTheme()
  const token = useAuthStore((state) => state.token)

  const [preset, setPreset] = useState<PresetRange>('30d')
  const [betType, setBetType] = useState<BetType | 'ALL'>('ALL')

  const [kpisData, setKpisData] = useState<AnalyticsKpisData | null>(null)
  const [trendsData, setTrendsData] = useState<AnalyticsDailyTrendsData | null>(null)
  const [statusData, setStatusData] = useState<AnalyticsStatusDistributionData | null>(null)
  const [topNumbersData, setTopNumbersData] = useState<AnalyticsTopNumbersData | null>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filters = useMemo(() => {
    const { from, to } = buildPresetRange(preset)
    return {
      dateFrom: from,
      dateTo: to,
      betType: betType === 'ALL' ? undefined : betType,
    }
  }, [preset, betType])

  const fetchAll = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const [kpis, trends, status, topNumbers] = await Promise.all([
        analyticsApi.getKpis(token, filters),
        analyticsApi.getDailyTrends(token, filters),
        analyticsApi.getStatusDistribution(token, filters),
        analyticsApi.getTopNumbers(token, { ...filters, limit: 10 }),
      ])
      setKpisData(kpis)
      setTrendsData(trends)
      setStatusData(status)
      setTopNumbersData(topNumbers)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }, [token, filters])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const kpiCards = useMemo(() => {
    if (!kpisData) return []
    const { kpis } = kpisData
    return [
      { label: 'Total Bets', value: kpis.total_bets.toLocaleString() },
      { label: 'Unique Bettors', value: kpis.unique_bettors.toLocaleString() },
      { label: 'Total Turnover', value: `${formatMMK(kpis.total_turnover)} MMK` },
      { label: 'Paid Out', value: kpis.paid_out_count.toLocaleString() },
    ]
  }, [kpisData])

  const resultDistributionData = useMemo(() => {
    if (!statusData) return []
    return statusData.status_distribution.bet_result_status.map((item) => ({
      name: item.value,
      value: item.count,
      percentage: item.percentage,
    }))
  }, [statusData])

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1.5}
        alignItems={{ xs: 'stretch', md: 'center' }}
        justifyContent="space-between"
      >
        <Box>
          <Typography variant="h4">Analytics Overview</Typography>
          <Typography variant="body2" color="text.secondary">
            Live betting analytics from the API.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          onClick={fetchAll}
          startIcon={<RefreshOutlinedIcon />}
          disabled={loading}
        >
          Refresh
        </Button>
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
        <Select
          size="small"
          value={preset}
          onChange={(e) => setPreset(e.target.value as PresetRange)}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="7d">Last 7 days</MenuItem>
          <MenuItem value="30d">Last 30 days</MenuItem>
          <MenuItem value="90d">Last 90 days</MenuItem>
        </Select>
        <Select
          size="small"
          value={betType}
          onChange={(e) => setBetType(e.target.value as BetType | 'ALL')}
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="ALL">All types</MenuItem>
          <MenuItem value="2D">2D</MenuItem>
          <MenuItem value="3D">3D</MenuItem>
        </Select>
      </Stack>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {error && <Alert severity="error">{error}</Alert>}

      {!loading && !error && kpisData && (
        <>
          <Grid container spacing={2}>
            {kpiCards.map((card) => (
              <Grid key={card.label} size={{ xs: 12, sm: 6, lg: 3 }}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">
                      {card.label}
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{ mt: 1, fontFamily: '"Roboto Mono", monospace' }}
                    >
                      {card.value}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, lg: 8 }}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6">Daily Bets & Turnover</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Bet count and turnover trend for the selected period.
                  </Typography>
                  <Box sx={{ width: '100%', height: 320 }}>
                    <ResponsiveContainer>
                      <LineChart data={trendsData?.daily_trends ?? []}>
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="bet_count"
                          name="Bets"
                          stroke={theme.palette.text.primary}
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="turnover"
                          name="Turnover"
                          stroke={theme.palette.text.secondary}
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, lg: 4 }}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6">Bet Result Distribution</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Breakdown by result status.
                  </Typography>
                  <Box sx={{ width: '100%', height: 320 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={resultDistributionData}
                          dataKey="value"
                          nameKey="name"
                          outerRadius={110}
                          label={({ name, percentage }) =>
                            `${name} ${Number(percentage).toFixed(1)}%`
                          }
                        >
                          {resultDistributionData.map((entry, index) => (
                            <Cell
                              key={`cell-${entry.name}`}
                              fill={pieColors[index % pieColors.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [value, 'Count']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, lg: 6 }}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6">Top 10 Bet Numbers</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Most frequently bet numbers by bet count.
                  </Typography>
                  <Box sx={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                      <BarChart data={topNumbersData?.top_numbers ?? []}>
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                        <XAxis dataKey="number" tick={{ fontSize: 11 }} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="bet_frequency" name="Bets" fill={theme.palette.text.secondary} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, lg: 6 }}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6">Top Numbers Detail</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Bet frequency, unique bettors and total stake per number.
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Number</TableCell>
                          <TableCell align="right">Bets</TableCell>
                          <TableCell align="right">Users</TableCell>
                          <TableCell align="right">Total Stake</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(topNumbersData?.top_numbers ?? []).map((row) => (
                          <TableRow key={row.number} hover>
                            <TableCell sx={{ fontFamily: '"Roboto Mono", monospace', fontWeight: 600 }}>
                              {row.number}
                            </TableCell>
                            <TableCell align="right">{row.bet_frequency.toLocaleString()}</TableCell>
                            <TableCell align="right">{row.distinct_user_count.toLocaleString()}</TableCell>
                            <TableCell align="right" sx={{ fontFamily: '"Roboto Mono", monospace' }}>
                              {formatMMK(parseFloat(row.total_stake))}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Stack>
  )
}
