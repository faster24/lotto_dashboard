import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import {
  Alert,
  Button,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { betsApi } from '../api/betsApi.ts'
import { ApiError } from '../lib/apiClient.ts'
import { useAuthStore } from '../stores/authStore.ts'
import type { Bet } from '../types/api.ts'

const isPayoutEligible = (bet: Bet) =>
  bet.bet_result_status === 'WON' && bet.payout_status === 'PENDING'

export function PayoutQueuePage() {
  const token = useAuthStore((state) => state.token)
  const isAdmin = useAuthStore((state) => state.isAdmin)
  const [bets, setBets] = useState<Bet[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadBets = async () => {
      if (!token) return
      try {
        setLoading(true)
        setError(null)
        const response = await betsApi.list(token, { page: 1, pageSize: 100 })
        const payoutCandidates = (response.data?.bets ?? []).filter(isPayoutEligible)
        setBets(payoutCandidates)
      } catch (requestError) {
        if (requestError instanceof ApiError) {
          setError(requestError.message)
        } else {
          setError('Unable to load payout queue.')
        }
      } finally {
        setLoading(false)
      }
    }

    void loadBets()
  }, [token])

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h4">Payout Queue</Typography>
        <Button component={RouterLink} to="/bets" variant="outlined">
          Back to Bets
        </Button>
      </Stack>

      {!isAdmin && (
        <Alert severity="info">
          Admin claim is not detected, but payout page remains available for UI checks.
        </Alert>
      )}
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
                <TableCell sx={{ fontFamily: '"Roboto Mono", monospace' }}>
                  {bet.id.slice(0, 8)}…
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
                    startIcon={<PaidOutlinedIcon />}
                    size="small"
                  >
                    Payout
                  </Button>
                  <Button
                    component={RouterLink}
                    to={`/bets/${bet.id}`}
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
                  No winning bets pending payout.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  )
}
