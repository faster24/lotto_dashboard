import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
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
import { twoDResultsApi } from '../api/twoDResultsApi.ts'
import { targetOpenTimes } from '../constants/betOptions.ts'
import { ApiError } from '../lib/apiClient.ts'
import { useAuthStore } from '../stores/authStore.ts'
import type { TwoDResult } from '../types/api.ts'

const pageSizeOptions = [10, 20, 50]

const formatDateTime = (value: string | null) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

export function TwoDResultsPage() {
  const token = useAuthStore((state) => state.token)

  const [latest, setLatest] = useState<TwoDResult | null>(null)
  const [latestLoading, setLatestLoading] = useState(false)
  const [latestError, setLatestError] = useState<string | null>(null)

  const [rows, setRows] = useState<TwoDResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const [stockDateInput, setStockDateInput] = useState('')
  const [openTimeInput, setOpenTimeInput] = useState<'ALL' | string>('ALL')
  const [historyIdInput, setHistoryIdInput] = useState('')

  const [filters, setFilters] = useState<{
    stockDate?: string
    openTime?: string
    historyId?: string
  }>({})

  const loadLatest = useCallback(async () => {
    if (!token) return
    try {
      setLatestLoading(true)
      setLatestError(null)
      const response = await twoDResultsApi.getLatest(token)
      setLatest(response.data?.two_d_result ?? null)
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setLatestError(requestError.message)
      } else {
        setLatestError('Failed to load latest 2D result.')
      }
    } finally {
      setLatestLoading(false)
    }
  }, [token])

  const loadHistory = useCallback(async () => {
    if (!token) return
    try {
      setLoading(true)
      setError(null)
      const response = await twoDResultsApi.list(token, {
        page,
        pageSize,
        stockDate: filters.stockDate,
        openTime: filters.openTime,
        historyId: filters.historyId,
      })
      setRows(response.data?.two_d_results ?? [])
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setError(requestError.message)
      } else {
        setError('Failed to load 2D result history.')
      }
    } finally {
      setLoading(false)
    }
  }, [filters.historyId, filters.openTime, filters.stockDate, page, pageSize, token])

  useEffect(() => {
    void loadLatest()
  }, [loadLatest])

  useEffect(() => {
    void loadHistory()
  }, [loadHistory])

  const applyFilters = () => {
    setPage(1)
    setFilters({
      stockDate: stockDateInput || undefined,
      openTime: openTimeInput === 'ALL' ? undefined : openTimeInput,
      historyId: historyIdInput.trim() || undefined,
    })
  }

  const resetFilters = () => {
    setStockDateInput('')
    setOpenTimeInput('ALL')
    setHistoryIdInput('')
    setPage(1)
    setPageSize(20)
    setFilters({})
  }

  const hasNextPage = useMemo(() => rows.length >= pageSize, [pageSize, rows.length])

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        spacing={1.5}
        alignItems={{ xs: 'stretch', sm: 'center' }}
      >
        <Box>
          <Typography variant="h4">2D Results</Typography>
          <Typography variant="body2" color="text.secondary">
            Live and historical 2D results from <code>/two-d-results</code>.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshOutlinedIcon />}
          onClick={() => {
            void loadLatest()
            void loadHistory()
          }}
          disabled={loading || latestLoading}
        >
          Refresh
        </Button>
      </Stack>

      <Card>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
            <Box sx={{ minWidth: 220 }}>
              <Typography variant="overline" color="text.secondary">
                Latest Result
              </Typography>
              <Typography variant="h5" sx={{ fontFamily: '"Roboto Mono", monospace' }}>
                {latestLoading ? '…' : latest?.twod ?? '--'}
              </Typography>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flexWrap="wrap">
              <Box>
                <Typography variant="caption" color="text.secondary">
                  History ID
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: '"Roboto Mono", monospace' }}>
                  {latest?.history_id ?? '-'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Stock Date
                </Typography>
                <Typography variant="body2">{latest?.stock_date ?? '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Open Time
                </Typography>
                <Typography variant="body2">{latest?.open_time ?? '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Updated
                </Typography>
                <Typography variant="body2">{formatDateTime(latest?.updated_at ?? null)}</Typography>
              </Box>
            </Stack>
          </Stack>
          {latestError && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              {latestError}
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.5}>
              <TextField
                size="small"
                label="Stock Date"
                type="date"
                value={stockDateInput}
                onChange={(event) => setStockDateInput(event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <Select
                size="small"
                value={openTimeInput}
                onChange={(event) => setOpenTimeInput(event.target.value)}
                sx={{ minWidth: 180 }}
              >
                <MenuItem value="ALL">All Open Times</MenuItem>
                {targetOpenTimes.map((openTime) => (
                  <MenuItem key={openTime} value={openTime}>
                    {openTime}
                  </MenuItem>
                ))}
              </Select>
              <TextField
                size="small"
                label="History ID"
                value={historyIdInput}
                onChange={(event) => setHistoryIdInput(event.target.value)}
              />
              <Select
                size="small"
                value={String(pageSize)}
                onChange={(event) => {
                  setPage(1)
                  setPageSize(Number(event.target.value))
                }}
                sx={{ minWidth: 120 }}
              >
                {pageSizeOptions.map((size) => (
                  <MenuItem key={size} value={String(size)}>
                    {size} / page
                  </MenuItem>
                ))}
              </Select>
            </Stack>

            <Stack direction="row" spacing={1}>
              <Button variant="contained" startIcon={<SearchOutlinedIcon />} onClick={applyFilters}>
                Apply Filters
              </Button>
              <Button variant="outlined" onClick={resetFilters}>
                Reset
              </Button>
            </Stack>

            {error && <Alert severity="error">{error}</Alert>}

            <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>History ID</TableCell>
                    <TableCell>Stock Date</TableCell>
                    <TableCell>Stock Datetime</TableCell>
                    <TableCell>Open Time</TableCell>
                    <TableCell>2D</TableCell>
                    <TableCell>Set Index</TableCell>
                    <TableCell>Value</TableCell>
                    <TableCell>Created At</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow
                      key={`${row.history_id}-${row.id}`}
                      hover
                      sx={{
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                        transition: 'background-color 200ms ease',
                      }}
                    >
                      <TableCell sx={{ fontFamily: '"Roboto Mono", monospace' }}>
                        {row.history_id}
                      </TableCell>
                      <TableCell>{row.stock_date ?? '-'}</TableCell>
                      <TableCell>{formatDateTime(row.stock_datetime)}</TableCell>
                      <TableCell>{row.open_time ?? '-'}</TableCell>
                      <TableCell sx={{ fontFamily: '"Roboto Mono", monospace' }}>
                        {row.twod ?? '-'}
                      </TableCell>
                      <TableCell>{row.set_index ?? '-'}</TableCell>
                      <TableCell>{row.value ?? '-'}</TableCell>
                      <TableCell>{formatDateTime(row.created_at)}</TableCell>
                    </TableRow>
                  ))}
                  {!loading && rows.length === 0 && (
                    <TableRow>
                      <TableCell align="center" colSpan={8}>
                        No 2D results found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Page {page} • Showing {rows.length} row{rows.length === 1 ? '' : 's'}
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                  disabled={loading || page === 1}
                >
                  Prev
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setPage((currentPage) => currentPage + 1)}
                  disabled={loading || !hasNextPage}
                >
                  Next
                </Button>
              </Stack>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  )
}
