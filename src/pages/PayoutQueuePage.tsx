import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined'
import {
  Alert,
  Button,
  Chip,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { betsApi } from '../api/betsApi.ts'
import { ApiError } from '../lib/apiClient.ts'
import { useAuthStore } from '../stores/authStore.ts'
import type { Bet } from '../types/api.ts'

const isPayoutEligible = (bet: Bet) =>
  bet.status === 'ACCEPTED' &&
  bet.bet_result_status === 'WON' &&
  bet.payout_status === 'PENDING'
const formatBetId = (betId: string) => `${betId.slice(0, 8)}…${betId.slice(-6)}`

export function PayoutQueuePage() {
  const token = useAuthStore((state) => state.token)
  const [bets, setBets] = useState<Bet[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  })

  useEffect(() => {
    const loadBets = async () => {
      if (!token) return
      try {
        setLoading(true)
        setError(null)
        const response = await betsApi.listAdmin(token, { page: 1, pageSize: 100 })
        const payoutCandidates = (response.data?.bets ?? []).filter(isPayoutEligible)
        setBets(payoutCandidates)
      } catch (requestError) {
        setBets([])
        if (requestError instanceof ApiError) {
          if (requestError.status === 401 || requestError.status === 403) {
            setError('Payout queue requires admin access.')
          } else {
            setError(requestError.message)
          }
        } else {
          setError('Unable to load payout queue.')
        }
      } finally {
        setLoading(false)
      }
    }

    void loadBets()
  }, [token])

  const copyBetId = async (betId: string) => {
    try {
      await navigator.clipboard.writeText(betId)
      setSnackbar({ open: true, message: 'Bet ID copied' })
    } catch {
      setSnackbar({ open: true, message: 'Unable to copy Bet ID' })
    }
  }

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h4">Payout Queue</Typography>
        <Button component={RouterLink} to="/bets" variant="outlined">
          Back to Bets
        </Button>
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}
      {loading && <Typography>Loading payout queue…</Typography>}

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Bet ID</TableCell>
              <TableCell>Bet Type</TableCell>
              <TableCell>Total Amount</TableCell>
              <TableCell>Result</TableCell>
              <TableCell>Payout</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {bets.map((bet) => (
              <TableRow key={bet.id} hover>
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
                <TableCell>{bet.total_amount}</TableCell>
                <TableCell>
                  <Chip label={bet.bet_result_status} />
                </TableCell>
                <TableCell>
                  <Chip label={bet.payout_status} color="secondary" />
                </TableCell>
                <TableCell align="right">
                  <Button
                    component={RouterLink}
                    to={`/bets/${bet.id}?action=payout`}
                    state={{ bet }}
                    startIcon={<PaidOutlinedIcon />}
                    size="small"
                  >
                    Payout
                  </Button>
                  <Button
                    component={RouterLink}
                    to={`/bets/${bet.id}`}
                    state={{ bet }}
                    startIcon={<VisibilityOutlinedIcon />}
                    size="small"
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!loading && bets.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No accepted winning bets pending payout.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={2000}
        onClose={() => setSnackbar({ open: false, message: '' })}
        message={snackbar.message}
      />
    </Stack>
  )
}
