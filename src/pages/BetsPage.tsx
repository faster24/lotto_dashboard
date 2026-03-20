import AddOutlinedIcon from '@mui/icons-material/AddOutlined'
import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined'
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
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
import { Link as RouterLink } from 'react-router-dom'
import { betsApi } from '../api/betsApi.ts'
import { ApiError } from '../lib/apiClient.ts'
import { useAuthStore } from '../stores/authStore.ts'
import type { Bet, BetAdminStatus, BetType } from '../types/api.ts'
import {
  adminTransitions,
  getAdminTransitionLabel,
  isAdminTransitionAllowed,
} from '../utils/betTransitions.ts'

const pageSizeOptions = [10, 20, 50]

export function BetsPage() {
  const token = useAuthStore((state) => state.token)
  const isAdmin = useAuthStore((state) => state.isAdmin)
  const [bets, setBets] = useState<Bet[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusActionLoading, setStatusActionLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchText, setSearchText] = useState('')
  const [betTypeFilter, setBetTypeFilter] = useState<'ALL' | BetType>('ALL')
  const [statusDialog, setStatusDialog] = useState<{
    open: boolean
    bet: Bet | null
    nextStatus: BetAdminStatus | null
  }>({ open: false, bet: null, nextStatus: null })

  const loadBets = useCallback(async () => {
    if (!token) return
    try {
      setLoading(true)
      setError(null)
      const response = await betsApi.listAdmin(token, { page, pageSize })
      setBets(response.data?.bets ?? [])
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setError(requestError.message)
      } else {
        setError('Failed to load bets.')
      }
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, token])

  useEffect(() => {
    void loadBets()
  }, [loadBets])

  const visibleBets = useMemo(() => {
  return bets.filter((bet) => {
      if (betTypeFilter !== 'ALL' && bet.bet_type !== betTypeFilter) return false
      if (!searchText.trim()) return true
      const query = searchText.trim().toLowerCase()
      return (
        bet.id.toLowerCase().includes(query) ||
        bet.status.toLowerCase().includes(query) ||
        bet.bet_result_status.toLowerCase().includes(query)
      )
    })
  }, [betTypeFilter, bets, searchText])

  const openStatusDialog = (bet: Bet, nextStatus: BetAdminStatus) => {
    setStatusDialog({ open: true, bet, nextStatus })
  }

  const closeStatusDialog = () => {
    setStatusDialog({ open: false, bet: null, nextStatus: null })
  }

  const confirmStatusUpdate = async () => {
    if (!token || !statusDialog.bet || !statusDialog.nextStatus) return
    try {
      setStatusActionLoading(true)
      setError(null)
      const response = await betsApi.updateAdminStatus(token, statusDialog.bet.id, {
        status: statusDialog.nextStatus,
      })
      const updatedBet = response.data?.bet
      if (updatedBet) {
        setBets((previousBets) =>
          previousBets.map((item) => (item.id === updatedBet.id ? updatedBet : item)),
        )
      } else {
        await loadBets()
      }
      closeStatusDialog()
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setError(requestError.message)
      } else {
        setError('Failed to update bet status.')
      }
    } finally {
      setStatusActionLoading(false)
    }
  }

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1.5}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', md: 'center' }}
      >
        <Box>
          <Typography variant="h4">Bets</Typography>
          <Typography color="text.secondary">
            Admin list and review actions from `/admin/bets`.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.25}>
          <Button
            component={RouterLink}
            to="/bets/new"
            variant="contained"
            startIcon={<AddOutlinedIcon />}
            disabled={isAdmin}
          >
            Create Bet
          </Button>
          <Button
            component={RouterLink}
            to="/bets/payout-queue"
            variant="outlined"
            startIcon={<PaidOutlinedIcon />}
          >
            Payout Queue
          </Button>
          <Button
            variant="outlined"
            onClick={() => void loadBets()}
            startIcon={<RefreshOutlinedIcon />}
          >
            Refresh
          </Button>
        </Stack>
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
        <TextField
          size="small"
          placeholder="Search by UUID or status"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlinedIcon />
              </InputAdornment>
            ),
          }}
          fullWidth
        />
        <Select
          size="small"
          value={betTypeFilter}
          onChange={(event) => setBetTypeFilter(event.target.value as 'ALL' | BetType)}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="ALL">All Bet Types</MenuItem>
          <MenuItem value="2D">2D</MenuItem>
          <MenuItem value="3D">3D</MenuItem>
        </Select>
        <Select
          size="small"
          value={String(pageSize)}
          onChange={(event) => {
            setPage(1)
            setPageSize(Number(event.target.value))
          }}
          sx={{ minWidth: 140 }}
        >
          {pageSizeOptions.map((option) => (
            <MenuItem key={option} value={String(option)}>
              {option} / page
            </MenuItem>
          ))}
        </Select>
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}

      {loading ? (
        <Stack direction="row" spacing={1} alignItems="center">
          <CircularProgress size={20} />
          <Typography>Loading bets…</Typography>
        </Stack>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Bet ID</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Target</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Result</TableCell>
                <TableCell>Payout</TableCell>
                <TableCell>Admin Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visibleBets.map((bet) => (
                <TableRow key={bet.id} hover>
                  <TableCell sx={{ fontFamily: '"Roboto Mono", monospace' }}>
                    {bet.id.slice(0, 8)}…
                  </TableCell>
                  <TableCell>{bet.bet_type}</TableCell>
                  <TableCell>{bet.target_opentime}</TableCell>
                  <TableCell>{bet.total_amount}</TableCell>
                  <TableCell>
                    <Chip label={bet.status} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Chip label={bet.bet_result_status} size="small" />
                  </TableCell>
                  <TableCell>
                    <Chip label={bet.payout_status} size="small" color="secondary" />
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5}>
                      {adminTransitions.map((transition) => (
                        <Button
                          key={transition}
                          size="small"
                          variant="outlined"
                          onClick={() => openStatusDialog(bet, transition)}
                          disabled={!isAdminTransitionAllowed(bet, transition)}
                        >
                          {getAdminTransitionLabel(transition)}
                        </Button>
                      ))}
                    </Stack>
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      component={RouterLink}
                      to={`/bets/${bet.id}`}
                      size="small"
                      startIcon={<VisibilityOutlinedIcon />}
                    >
                      View
                    </Button>
                    <Button
                      component={RouterLink}
                      to={`/bets/${bet.id}?action=payout`}
                      size="small"
                      color="inherit"
                    >
                      Payout
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {visibleBets.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    No bets found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Stack direction="row" spacing={1} justifyContent="flex-end">
        <Button
          variant="outlined"
          disabled={page === 1 || loading}
          onClick={() => setPage((currentPage) => currentPage - 1)}
        >
          Previous
        </Button>
        <Typography sx={{ px: 1, alignSelf: 'center' }}>Page {page}</Typography>
        <Button
          variant="outlined"
          disabled={loading || bets.length < pageSize}
          onClick={() => setPage((currentPage) => currentPage + 1)}
        >
          Next
        </Button>
      </Stack>

      <Dialog open={statusDialog.open} onClose={closeStatusDialog} fullWidth maxWidth="xs">
        <DialogTitle>Confirm Status Update</DialogTitle>
        <DialogContent>
          <Typography>
            Update bet <code>{statusDialog.bet?.id ?? '-'}</code> to{' '}
            <strong>
              {statusDialog.nextStatus ? getAdminTransitionLabel(statusDialog.nextStatus) : '-'}
            </strong>
            ?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This calls <code>PATCH /admin/bets/{'{bet}'}/status</code>.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeStatusDialog} disabled={statusActionLoading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => void confirmStatusUpdate()}
            disabled={statusActionLoading}
          >
            {statusActionLoading ? 'Updating…' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
