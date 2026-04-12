import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined'
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined'
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined'
import UndoOutlinedIcon from '@mui/icons-material/UndoOutlined'
import MoreVertIcon from '@mui/icons-material/MoreVert'
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
  IconButton,
  InputAdornment,
  MenuItem,
  Menu,
  Paper,
  Select,
  Tooltip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Snackbar,
} from '@mui/material'
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined'
import { useCallback, useDeferredValue, useEffect, useMemo, useState, type ChangeEvent, type MouseEvent } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { betsApi } from '../api/betsApi.ts'
import { ApiError } from '../lib/apiClient.ts'
import { useAuthStore } from '../stores/authStore.ts'
import type { Bet, BetAdminStatus, BetStatus, BetType } from '../types/api.ts'
import {
  getAdminTransitionLabel,
  isAdminTransitionAllowed,
} from '../utils/betTransitions.ts'

const pageSizeOptions = [10, 20, 50]
const formatBetId = (betId: string) => `${betId.slice(0, 8)}…${betId.slice(-6)}`
const getReviewChipColor = (status: Bet['status']) => {
  if (status === 'ACCEPTED') return 'success'
  if (status === 'REJECTED' || status === 'REFUNDED') return 'error'
  return 'warning'
}

export function BetsPage() {
  const token = useAuthStore((state) => state.token)
  const navigate = useNavigate()
  const [bets, setBets] = useState<Bet[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusActionLoading, setStatusActionLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchText, setSearchText] = useState('')
  const deferredSearchText = useDeferredValue(searchText)
  const [betTypeFilter, setBetTypeFilter] = useState<'ALL' | BetType>('ALL')
  const [statusFilter, setStatusFilter] = useState<'ALL' | BetStatus>('ALL')
  const [statusDialog, setStatusDialog] = useState<{
    open: boolean
    bet: Bet | null
    nextStatus: BetAdminStatus | null
  }>({ open: false, bet: null, nextStatus: null })
  const [refundDialog, setRefundDialog] = useState<{ open: boolean; bet: Bet | null }>(
    { open: false, bet: null },
  )
  const [refundFile, setRefundFile] = useState<File | null>(null)
  const [refundPreviewUrl, setRefundPreviewUrl] = useState<string | null>(null)
  const [refundReference, setRefundReference] = useState('')
  const [refundNote, setRefundNote] = useState('')
  const [refundSubmitting, setRefundSubmitting] = useState(false)
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(null)
  const [actionMenuBet, setActionMenuBet] = useState<Bet | null>(null)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  })

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

  useEffect(() => {
    return () => {
      if (refundPreviewUrl) {
        URL.revokeObjectURL(refundPreviewUrl)
      }
    }
  }, [refundPreviewUrl])

  const visibleBets = useMemo(() => {
    return bets.filter((bet) => {
      if (betTypeFilter !== 'ALL' && bet.bet_type !== betTypeFilter) return false
      if (statusFilter !== 'ALL' && bet.status !== statusFilter) return false
      if (!deferredSearchText.trim()) return true
      const query = deferredSearchText.trim().toLowerCase()
      return (
        bet.id.toLowerCase().includes(query) ||
        bet.status.toLowerCase().includes(query) ||
        bet.bet_result_status.toLowerCase().includes(query)
      )
    })
  }, [betTypeFilter, bets, deferredSearchText, statusFilter])

  const isPayoutEligible = (bet: Bet) =>
    bet.bet_result_status === 'WON' && bet.payout_status === 'PENDING'

  const quickStats = useMemo(() => {
    const pendingReviewCount = bets.filter((bet) => bet.status === 'PENDING').length
    const acceptedCount = bets.filter((bet) => bet.status === 'ACCEPTED').length
    const payoutQueueCount = bets.filter(isPayoutEligible).length
    return { pendingReviewCount, acceptedCount, payoutQueueCount }
  }, [bets])

  const openRefundDialog = (bet: Bet) => {
    if (refundPreviewUrl) {
      URL.revokeObjectURL(refundPreviewUrl)
      setRefundPreviewUrl(null)
    }
    setRefundDialog({ open: true, bet })
    setRefundFile(null)
    setRefundReference('')
    setRefundNote('')
  }

  const closeRefundDialog = () => {
    if (refundPreviewUrl) {
      URL.revokeObjectURL(refundPreviewUrl)
      setRefundPreviewUrl(null)
    }
    setRefundDialog({ open: false, bet: null })
    setRefundFile(null)
    setRefundReference('')
    setRefundNote('')
  }

  const openStatusDialog = (bet: Bet, nextStatus: BetAdminStatus) => {
    if (nextStatus === 'REFUNDED') {
      openRefundDialog(bet)
      return
    }
    setStatusDialog({ open: true, bet, nextStatus })
  }

  const closeStatusDialog = () => {
    setStatusDialog({ open: false, bet: null, nextStatus: null })
  }

  const openActionMenu = (event: MouseEvent<HTMLElement>, bet: Bet) => {
    setActionMenuAnchor(event.currentTarget)
    setActionMenuBet(bet)
  }

  const closeActionMenu = () => {
    setActionMenuAnchor(null)
    setActionMenuBet(null)
  }

  const copyBetId = async (betId: string) => {
    try {
      await navigator.clipboard.writeText(betId)
      setSnackbar({ open: true, message: 'Bet ID copied' })
    } catch {
      setSnackbar({ open: true, message: 'Unable to copy Bet ID' })
    }
  }

  const handleRefundFile = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] ?? null
    if (refundPreviewUrl) {
      URL.revokeObjectURL(refundPreviewUrl)
      setRefundPreviewUrl(null)
    }
    setRefundFile(selectedFile)
    if (selectedFile) {
      setRefundPreviewUrl(URL.createObjectURL(selectedFile))
    }
  }

  const submitRefund = async () => {
    if (!token || !refundDialog.bet || !refundFile) {
      setError('Refund proof is required.')
      return
    }
    if (!isAdminTransitionAllowed(refundDialog.bet, 'REFUNDED')) {
      setError('Refund is not allowed for this bet.')
      return
    }
    try {
      setRefundSubmitting(true)
      setError(null)
      const response = await betsApi.refund(token, refundDialog.bet.id, {
        payoutProofImage: refundFile,
        payoutReference: refundReference.trim() || undefined,
        payoutNote: refundNote.trim() || undefined,
      })
      const updatedBet = response.data?.bet
      if (updatedBet) {
        setBets((previousBets) =>
          previousBets.map((item) => (item.id === updatedBet.id ? updatedBet : item)),
        )
      } else {
        await loadBets()
      }
      closeRefundDialog()
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setError(requestError.message)
      } else {
        setError('Failed to refund bet.')
      }
    } finally {
      setRefundSubmitting(false)
    }
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
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 2, md: 2.5 },
          borderColor: 'info.light',
          background:
            'linear-gradient(130deg, rgba(37,99,235,0.14) 0%, rgba(59,130,246,0.06) 45%, rgba(249,115,22,0.12) 100%)',
        }}
      >
        <Stack spacing={2}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={1.5}
            justifyContent="space-between"
            alignItems={{ xs: 'stretch', md: 'center' }}
          >
            <Box>
              <Typography variant="h4">Bets</Typography>
              <Typography color="text.secondary">
                Admin list and review actions from <code>/admin/bets</code>.
              </Typography>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
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

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
              gap: 1,
            }}
          >
            <Paper variant="outlined" sx={{ p: 1.25, borderRadius: 1.5 }}>
              <Typography variant="caption" color="text.secondary">Pending Review</Typography>
              <Typography variant="h6" fontWeight={700}>{quickStats.pendingReviewCount}</Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 1.25, borderRadius: 1.5 }}>
              <Typography variant="caption" color="text.secondary">Accepted Bets</Typography>
              <Typography variant="h6" fontWeight={700}>{quickStats.acceptedCount}</Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 1.25, borderRadius: 1.5 }}>
              <Typography variant="caption" color="text.secondary">Payout Candidates</Typography>
              <Typography variant="h6" fontWeight={700}>{quickStats.payoutQueueCount}</Typography>
            </Paper>
          </Box>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 1.5 }}>
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
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as 'ALL' | BetStatus)}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="ALL">All Statuses</MenuItem>
            <MenuItem value="PENDING">Pending</MenuItem>
            <MenuItem value="ACCEPTED">Accepted</MenuItem>
            <MenuItem value="REJECTED">Rejected</MenuItem>
            <MenuItem value="REFUNDED">Refunded</MenuItem>
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
      </Paper>

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
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visibleBets.map((bet) => (
                <TableRow
                  key={bet.id}
                  hover
                  sx={{
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                    transition: 'background-color 180ms ease',
                  }}
                >
                  <TableCell sx={{ minWidth: 220 }}>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Tooltip title={bet.id} arrow>
                        <Typography
                          component="code"
                          sx={{
                            fontFamily: '"Roboto Mono", monospace',
                            whiteSpace: 'nowrap',
                            fontSize: 13,
                            letterSpacing: 0.2,
                          }}
                        >
                          {formatBetId(bet.id)}
                        </Typography>
                      </Tooltip>
                      <Tooltip title="Copy full Bet ID" arrow>
                        <IconButton
                          size="small"
                          onClick={() => void copyBetId(bet.id)}
                          aria-label={`copy bet id ${bet.id}`}
                        >
                          <ContentCopyOutlinedIcon fontSize="inherit" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                  <TableCell>{bet.bet_type}</TableCell>
                  <TableCell>{bet.target_opentime}</TableCell>
                  <TableCell>{bet.total_amount}</TableCell>
                  <TableCell>
                    <Chip label={bet.status} size="small" color={getReviewChipColor(bet.status)} variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Chip label={bet.bet_result_status} size="small" />
                  </TableCell>
                  <TableCell>
                    <Chip label={bet.payout_status} size="small" color="secondary" />
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" justifyContent="flex-end" spacing={1} alignItems="center">
                      <Button
                        component={RouterLink}
                        to={
                          isPayoutEligible(bet)
                            ? `/bets/${bet.id}?action=payout`
                            : `/bets/${bet.id}`
                        }
                        state={{ bet }}
                        size="small"
                        variant="contained"
                        color={isPayoutEligible(bet) ? 'secondary' : 'primary'}
                        startIcon={
                          isPayoutEligible(bet) ? <PaidOutlinedIcon fontSize="small" /> : <VisibilityOutlinedIcon />
                        }
                      >
                        {isPayoutEligible(bet) ? 'Payout' : 'View'}
                      </Button>
                      <Tooltip title="All actions" arrow>
                        <span>
                          <IconButton
                            size="small"
                            onClick={(event) => openActionMenu(event, bet)}
                            aria-label="actions menu"
                          >
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {visibleBets.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center">
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

      <Dialog open={refundDialog.open} onClose={closeRefundDialog} fullWidth maxWidth="sm">
        <DialogTitle>Refund bet {refundDialog.bet?.id.slice(0, 8) ?? '-'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Alert severity="info">Refund marks the bet as REFUNDED and requires proof.</Alert>
          {!refundDialog.bet || isAdminTransitionAllowed(refundDialog.bet, 'REFUNDED') ? null : (
            <Alert severity="warning">Refund is not allowed for this bet.</Alert>
          )}
          <Box
            component="label"
            sx={{
              border: '1px dashed',
              borderColor: 'divider',
              p: 2,
              borderRadius: 1,
              textAlign: 'center',
              cursor: 'pointer',
              bgcolor: 'background.paper',
            }}
          >
            <input hidden type="file" accept="image/*" onChange={handleRefundFile} />
            {refundPreviewUrl ? (
              <Box
                component="img"
                src={refundPreviewUrl}
                alt="Refund proof preview"
                sx={{ width: '100%', height: 'auto', maxHeight: 260, objectFit: 'contain' }}
              />
            ) : (
              <Typography>Click or drop to upload refund proof (required)</Typography>
            )}
            {refundFile && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {refundFile.name} • {(refundFile.size / 1024).toFixed(1)} KB
              </Typography>
            )}
          </Box>
          <TextField
            label="Refund Reference"
            value={refundReference}
            onChange={(event) => setRefundReference(event.target.value)}
            fullWidth
          />
          <TextField
            label="Refund Note"
            value={refundNote}
            onChange={(event) => setRefundNote(event.target.value)}
            multiline
            minRows={3}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeRefundDialog} disabled={refundSubmitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => void submitRefund()}
            disabled={
              refundSubmitting ||
              !refundFile ||
              !refundDialog.bet ||
              !isAdminTransitionAllowed(refundDialog.bet, 'REFUNDED')
            }
          >
            {refundSubmitting ? 'Submitting…' : 'Submit Refund'}
          </Button>
        </DialogActions>
      </Dialog>

      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={closeActionMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem
          onClick={() => {
            if (actionMenuBet) {
              closeActionMenu()
              navigate(`/bets/${actionMenuBet.id}`, { state: { bet: actionMenuBet } })
            }
          }}
        >
          <VisibilityOutlinedIcon fontSize="small" style={{ marginRight: 8 }} />
          View
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (actionMenuBet) {
              closeActionMenu()
              navigate(`/bets/${actionMenuBet.id}?action=payout`, { state: { bet: actionMenuBet } })
            }
          }}
          disabled={!(actionMenuBet && isPayoutEligible(actionMenuBet))}
        >
          <PaidOutlinedIcon fontSize="small" style={{ marginRight: 8 }} />
          Payout
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (actionMenuBet) {
              void copyBetId(actionMenuBet.id)
            }
            closeActionMenu()
          }}
        >
          <ContentCopyOutlinedIcon fontSize="small" style={{ marginRight: 8 }} />
          Copy Bet ID
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (actionMenuBet) openStatusDialog(actionMenuBet, 'ACCEPTED')
            closeActionMenu()
          }}
          disabled={!(actionMenuBet && isAdminTransitionAllowed(actionMenuBet, 'ACCEPTED'))}
        >
          <CheckCircleOutlineOutlinedIcon fontSize="small" style={{ marginRight: 8 }} />
          Accept
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (actionMenuBet) openStatusDialog(actionMenuBet, 'REJECTED')
            closeActionMenu()
          }}
          disabled={!(actionMenuBet && isAdminTransitionAllowed(actionMenuBet, 'REJECTED'))}
        >
          <BlockOutlinedIcon fontSize="small" style={{ marginRight: 8 }} />
          Reject
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (actionMenuBet) openStatusDialog(actionMenuBet, 'REFUNDED')
            closeActionMenu()
          }}
          disabled={!(actionMenuBet && isAdminTransitionAllowed(actionMenuBet, 'REFUNDED'))}
        >
          <UndoOutlinedIcon fontSize="small" style={{ marginRight: 8 }} />
          Refund
        </MenuItem>
      </Menu>

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

      <Snackbar
        open={snackbar.open}
        autoHideDuration={2000}
        onClose={() => setSnackbar({ open: false, message: '' })}
        message={snackbar.message}
      />
    </Stack>
  )
}
