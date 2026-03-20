import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined'
import TrendingDownOutlinedIcon from '@mui/icons-material/TrendingDownOutlined'
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  Grid,
  InputLabel,
  LinearProgress,
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
import { useAnalyticsStore } from '../stores/analyticsStore.ts'
import { useDataStore } from '../stores/dataStore.ts'
import type { KpiMetric } from '../types/dashboard.ts'

const pieColors = ['#f5f5f5', '#d9d9d9', '#a8a8a8', '#6a6a6a']

const formatKpi = (metric: KpiMetric) => {
  if (metric.unit === '$') {
    return `${metric.unit}${metric.value.toLocaleString()}`
  }
  if (metric.unit === '%') {
    return `${metric.value.toFixed(1)}${metric.unit}`
  }
  return metric.value.toLocaleString()
}

export function AnalyticsPage() {
  const theme = useTheme()
  const { filters, resetFilters, setChannel, setDateRange, setSegment } =
    useAnalyticsStore()
  const { data, status, error } = useDataStore()

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1.5}
        alignItems={{ xs: 'stretch', md: 'center' }}
        justifyContent="space-between"
      >
        <Box>
          <Typography variant="h4">Business Performance</Typography>
          <Typography variant="body2" color="text.secondary">
            Monochrome analytics overview with filterable metrics.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            onClick={resetFilters}
            startIcon={<RefreshOutlinedIcon />}
          >
            Reset filters
          </Button>
          <Chip label="Mock Data Source" variant="outlined" />
        </Stack>
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="date-range-label">Date range</InputLabel>
          <Select
            labelId="date-range-label"
            label="Date range"
            value={filters.dateRange}
            onChange={(event) => setDateRange(event.target.value as '7d' | '30d' | '90d')}
          >
            <MenuItem value="7d">Last 7 days</MenuItem>
            <MenuItem value="30d">Last 30 days</MenuItem>
            <MenuItem value="90d">Last 90 days</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="segment-label">Segment</InputLabel>
          <Select
            labelId="segment-label"
            label="Segment"
            value={filters.segment}
            onChange={(event) =>
              setSegment(event.target.value as 'all' | 'new' | 'returning')
            }
          >
            <MenuItem value="all">All users</MenuItem>
            <MenuItem value="new">New users</MenuItem>
            <MenuItem value="returning">Returning users</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="channel-label">Channel</InputLabel>
          <Select
            labelId="channel-label"
            label="Channel"
            value={filters.channel}
            onChange={(event) =>
              setChannel(event.target.value as 'all' | 'organic' | 'paid' | 'partner')
            }
          >
            <MenuItem value="all">All channels</MenuItem>
            <MenuItem value="organic">Organic</MenuItem>
            <MenuItem value="paid">Paid</MenuItem>
            <MenuItem value="partner">Partner</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {status === 'loading' && <LinearProgress aria-label="loading dashboard data" />}
      {status === 'error' && <Alert severity="error">{error ?? 'Unknown error'}</Alert>}

      {status === 'success' && data && (
        <>
          <Grid container spacing={2}>
            {data.kpis.map((metric) => {
              const isPositive = metric.changePct >= 0
              return (
                <Grid key={metric.id} size={{ xs: 12, sm: 6, lg: 3 }}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">
                        {metric.label}
                      </Typography>
                      <Typography
                        variant="h4"
                        sx={{ mt: 1, fontFamily: '"Roboto Mono", monospace' }}
                      >
                        {formatKpi(metric)}
                      </Typography>
                      <Stack
                        direction="row"
                        spacing={0.5}
                        alignItems="center"
                        sx={{ mt: 1 }}
                      >
                        {isPositive ? (
                          <TrendingUpOutlinedIcon
                            sx={{ fontSize: 18 }}
                            color="success"
                          />
                        ) : (
                          <TrendingDownOutlinedIcon
                            sx={{ fontSize: 18 }}
                            color="error"
                          />
                        )}
                        <Typography
                          variant="body2"
                          color={isPositive ? 'success.main' : 'error.main'}
                          sx={{ fontFamily: '"Roboto Mono", monospace' }}
                        >
                          {Math.abs(metric.changePct).toFixed(1)}%
                        </Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              )
            })}
          </Grid>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, lg: 8 }}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6">Revenue & Sessions Trend</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Weekly performance trend for the selected period.
                  </Typography>
                  <Box sx={{ width: '100%', height: 320 }}>
                    <ResponsiveContainer>
                      <LineChart data={data.trendSeries}>
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                        <XAxis dataKey="period" />
                        <YAxis />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="revenue"
                          stroke={theme.palette.text.primary}
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="sessions"
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
                  <Typography variant="h6">Channel Mix</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Distribution by acquisition source.
                  </Typography>
                  <Box sx={{ width: '100%', height: 320 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={data.channelMix}
                          dataKey="value"
                          nameKey="category"
                          outerRadius={110}
                          label
                        >
                          {data.channelMix.map((entry) => (
                            <Cell
                              key={`channel-${entry.category}`}
                              fill={pieColors[data.channelMix.indexOf(entry) % pieColors.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
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
                  <Typography variant="h6">Conversion Funnel</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Stage-by-stage drop-off across conversion flow.
                  </Typography>
                  <Box sx={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                      <BarChart data={data.funnel}>
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                        <XAxis dataKey="stage" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="users" fill={theme.palette.text.secondary} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, lg: 6 }}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6">Recent Activity</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Administrative actions across modules.
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Action</TableCell>
                          <TableCell>Module</TableCell>
                          <TableCell>Owner</TableCell>
                          <TableCell>Timestamp</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {data.activity.map((row) => (
                          <TableRow key={row.id} hover>
                            <TableCell>{row.action}</TableCell>
                            <TableCell>{row.module}</TableCell>
                            <TableCell>{row.owner}</TableCell>
                            <TableCell sx={{ fontFamily: '"Roboto Mono", monospace' }}>
                              {row.timestamp}
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
