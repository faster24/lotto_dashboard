import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined'
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from 'react'
import { Link as RouterLink, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { betsApi } from '../api/betsApi.ts'
import { ApiError } from '../lib/apiClient.ts'
import { useAuthStore } from '../stores/authStore.ts'
import type { Bet, BetAdminStatus, BetType, TargetOpenTime } from '../types/api.ts'
import { betTypes, targetOpenTimes } from '../constants/betOptions.ts'
import {
  adminTransitions,
  getAdminTransitionLabel,
  isAdminTransitionAllowed,
} from '../utils/betTransitions.ts'

interface PreviewState {
  title: string
  objectUrl: string
  contentType: string
}

const parseNumberList = (raw: string) =>
  raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => Number(item))
    .filter((number) => Number.isInteger(number) && number >= 0 && number <= 255)

export function BetDetailPage() {
  const { betId = '' } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = useAuthStore((state) => state.token)
  const isAdmin = useAuthStore((state) => state.isAdmin)
  const [bet, setBet] = useState<Bet | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewState, setPreviewState] = useState<PreviewState | null>(null)
  const [statusDialog, setStatusDialog] = useState<{
    open: boolean
    action: BetAdminStatus | null
  }>({ open: false, action: null })
  const [statusActionLoading, setStatusActionLoading] = useState(false)

  const [editBetType, setEditBetType] = useState<BetType>('2D')
  const [editTargetOpenTime, setEditTargetOpenTime] = useState<TargetOpenTime>('11:00:00')
  const [editAmount, setEditAmount] = useState('1')
  const [editNumbers, setEditNumbers] = useState('')

  const [payoutFile, setPayoutFile] = useState<File | null>(null)
  const [payoutReference, setPayoutReference] = useState('')
  const [payoutNote, setPayoutNote] = useState('')

  const shouldShowPayoutForm = searchParams.get('action') === 'payout'

  const refreshBet = useCallback(async () => {
    if (!token || !betId) return
    try {
      setLoading(true)
      setError(null)
      const response = await betsApi.getById(token, betId)
      const responseBet = response.data?.bet ?? null
      setBet(responseBet)
      if (responseBet) {
        setEditBetType(responseBet.bet_type)
        setEditTargetOpenTime(responseBet.target_opentime)
        setEditAmount(String(responseBet.amount))
        setEditNumbers(responseBet.bet_numbers.map((entry) => entry.number).join(','))
      }
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setError(requestError.message)
      } else {
        setError('Failed to load bet.')
      }
    } finally {
      setLoading(false)
    }
  }, [betId, token])

  useEffect(() => {
    void refreshBet()
  }, [refreshBet])

  useEffect(() => {
    return () => {
      if (previewState) {
        URL.revokeObjectURL(previewState.objectUrl)
      }
    }
  }, [previewState])

  const betNumbersText = useMemo(
    () => bet?.bet_numbers.map((entry) => entry.number).join(', ') ?? '-',
    [bet],
  )

  const openPreview = async (type: 'pay-slip' | 'payout-proof') => {
    if (!token || !bet) return
    try {
      setError(null)
      const response =
        type === 'pay-slip'
          ? await betsApi.downloadPaySlip(token, bet.id)
          : await betsApi.downloadPayoutProof(token, bet.id)

      const objectUrl = URL.createObjectURL(response.blob)
      setPreviewState({
        title: type === 'pay-slip' ? 'Pay Slip Preview' : 'Payout Proof Preview',
        objectUrl,
        contentType: response.contentType,
      })
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setError(requestError.message)
      } else {
        setError('Unable to preview image.')
      }
    }
  }

  const closePreview = () => {
    if (previewState) {
      URL.revokeObjectURL(previewState.objectUrl)
    }
    setPreviewState(null)
  }

  const handleUpdate = async () => {
    if (!token || !bet) return
    const parsedAmount = Number(editAmount)
    const parsedNumbers = parseNumberList(editNumbers)
    if (!Number.isInteger(parsedAmount) || parsedAmount < 1) {
      setError('Amount must be a valid integer.')
      return
    }
    if (parsedNumbers.length === 0) {
      setError('Enter at least one valid number.')
      return
    }
    try {
      setSubmitting(true)
      setError(null)
      const response = await betsApi.update(token, bet.id, {
        betType: editBetType,
        targetOpenTime: editTargetOpenTime,
        amount: parsedAmount,
        betNumbers: [...new Set(parsedNumbers)],
      })
      if (response.data?.bet) {
        setBet(response.data.bet)
      }
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setError(requestError.message)
      } else {
        setError('Unable to update bet.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!token || !bet) return
    try {
      setSubmitting(true)
      setError(null)
      await betsApi.remove(token, bet.id)
      navigate('/bets', { replace: true })
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setError(requestError.message)
      } else {
        setError('Unable to delete bet.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const openStatusDialog = (action: BetAdminStatus) => {
    setStatusDialog({ open: true, action })
  }

  const closeStatusDialog = () => {
    setStatusDialog({ open: false, action: null })
  }

  const confirmStatusUpdate = async () => {
    if (!token || !bet || !statusDialog.action) return
    try {
      setStatusActionLoading(true)
      setError(null)
      const response = await betsApi.updateAdminStatus(token, bet.id, {
        status: statusDialog.action,
      })
      if (response.data?.bet) {
        setBet(response.data.bet)
      }
      closeStatusDialog()
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setError(requestError.message)
      } else {
        setError('Unable to update bet status.')
      }
    } finally {
      setStatusActionLoading(false)
    }
  }

  const handlePayoutFile = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] ?? null
    setPayoutFile(selectedFile)
  }

  const handlePayout = async () => {
    if (!token || !bet || !payoutFile) {
      setError('Payout proof image is required.')
      return
    }
    try {
      setSubmitting(true)
      setError(null)
      const response = await betsApi.payout(token, bet.id, {
        payoutProofImage: payoutFile,
        payoutReference: payoutReference.trim() || undefined,
        payoutNote: payoutNote.trim() || undefined,
      })
      if (response.data?.bet) {
        setBet(response.data.bet)
      }
      setPayoutFile(null)
      setPayoutReference('')
      setPayoutNote('')
      setSearchParams({})
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setError(requestError.message)
      } else {
        setError('Unable to payout this bet.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (!betId) {
    return <Alert severity="error">Missing bet ID.</Alert>
  }

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h4">Bet Detail</Typography>
          <Typography color="text.secondary">
            UUID: <code>{betId}</code>
          </Typography>
        </Box>
        <Button component={RouterLink} to="/bets" variant="outlined">
          Back to Bets
        </Button>
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}
      {loading && <Typography>Loading bet…</Typography>}

      {bet && (
        <>
          <Card>
            <CardContent>
              <Stack spacing={1.5}>
                <Typography variant="h6">Current Bet Status</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip label={`Review: ${bet.status}`} />
                  <Chip label={`Result: ${bet.bet_result_status}`} />
                  <Chip label={`Payout: ${bet.payout_status}`} color="secondary" />
                </Stack>
                <Typography>Type: {bet.bet_type}</Typography>
                <Typography>Target Open Time: {bet.target_opentime}</Typography>
                <Typography>Amount: {bet.total_amount}</Typography>
                <Typography>Numbers: {betNumbersText}</Typography>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    startIcon={<VisibilityOutlinedIcon />}
                    onClick={() => void openPreview('pay-slip')}
                    disabled={!bet.pay_slip.exists}
                  >
                    Preview Pay Slip
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadOutlinedIcon />}
                    onClick={() => void openPreview('payout-proof')}
                    disabled={!bet.payout_proof.exists}
                  >
                    Preview Payout Proof
                  </Button>
                  {!isAdmin && (
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteOutlineOutlinedIcon />}
                      onClick={() => void handleDelete()}
                      disabled={submitting}
                    >
                      Delete
                    </Button>
                  )}
                </Stack>
                </Stack>
              </CardContent>
            </Card>

          {isAdmin && bet && (
            <Card>
              <CardContent>
                <Stack spacing={1.25}>
                  <Typography variant="h6">Admin Review</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Available actions call <code>PATCH /admin/bets/{'{bet}'}/status</code>. Buttons are
                    disabled unless the document allows the transition.
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {adminTransitions.map((transition) => (
                      <Button
                        key={transition}
                        variant="contained"
                        color={
                          transition === 'ACCEPTED'
                            ? 'success'
                            : transition === 'REJECTED'
                              ? 'error'
                              : 'warning'
                        }
                        onClick={() => openStatusDialog(transition)}
                        disabled={!isAdminTransitionAllowed(bet, transition) || statusActionLoading}
                      >
                        {getAdminTransitionLabel(transition)}
                      </Button>
                    ))}
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          )}

          {!isAdmin && (
            <Card>
              <CardContent>
                <Stack spacing={2}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <EditOutlinedIcon />
                    <Typography variant="h6">Edit Bet</Typography>
                  </Stack>
                  <TextField
                    select
                    label="Bet Type"
                    value={editBetType}
                    onChange={(event) => setEditBetType(event.target.value as BetType)}
                  >
                    {betTypes.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    select
                    label="Target Open Time"
                    value={editTargetOpenTime}
                    onChange={(event) =>
                      setEditTargetOpenTime(event.target.value as TargetOpenTime)
                    }
                  >
                    {targetOpenTimes.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    label="Amount"
                    type="number"
                    inputProps={{ min: 1, step: 1 }}
                    value={editAmount}
                    onChange={(event) => setEditAmount(event.target.value)}
                  />
                  <TextField
                    label="Numbers (comma separated)"
                    value={editNumbers}
                    onChange={(event) => setEditNumbers(event.target.value)}
                  />
                  <Button variant="contained" onClick={() => void handleUpdate()} disabled={submitting}>
                    Save Changes
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <PaidOutlinedIcon />
                  <Typography variant="h6">Payout Action</Typography>
                </Stack>
                {!isAdmin && (
                  <Alert severity="info">
                    Admin claim is not detected; API may reject payout, but action is enabled for UI testing.
                  </Alert>
                )}
                {bet.bet_result_status !== 'WON' || bet.payout_status !== 'PENDING' ? (
                  <Alert severity="warning">
                    This bet is not in `WON + PENDING` state. API may return conflict/validation errors.
                  </Alert>
                ) : null}
                {shouldShowPayoutForm ? (
                  <>
                    <Button component="label" variant="outlined">
                      {payoutFile ? payoutFile.name : 'Upload Payout Proof'}
                      <input hidden type="file" accept="image/*" onChange={handlePayoutFile} />
                    </Button>
                    <TextField
                      label="Payout Reference"
                      value={payoutReference}
                      onChange={(event) => setPayoutReference(event.target.value)}
                    />
                    <TextField
                      label="Payout Note"
                      value={payoutNote}
                      onChange={(event) => setPayoutNote(event.target.value)}
                      multiline
                      minRows={3}
                    />
                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="contained"
                        onClick={() => void handlePayout()}
                        disabled={submitting}
                      >
                        Submit Payout
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => setSearchParams({})}
                        disabled={submitting}
                      >
                        Cancel
                      </Button>
                    </Stack>
                  </>
                ) : (
                  <Button
                    variant="contained"
                    onClick={() => setSearchParams({ action: 'payout' })}
                  >
                    Open Payout Form
                  </Button>
                )}
              </Stack>
            </CardContent>
          </Card>
        </>
      )}

      <Dialog open={previewState !== null} onClose={closePreview} maxWidth="md" fullWidth>
        <DialogTitle>{previewState?.title}</DialogTitle>
        <DialogContent>
          {previewState && previewState.contentType.startsWith('image/') ? (
            <Box
              component="img"
              src={previewState.objectUrl}
              alt={previewState.title}
              sx={{ width: '100%', height: 'auto', borderRadius: 1 }}
            />
          ) : (
            <Alert severity="info">Preview is available only for image files.</Alert>
          )}
          {previewState && (
            <Button
              sx={{ mt: 2 }}
              href={previewState.objectUrl}
              download
              startIcon={<DownloadOutlinedIcon />}
            >
              Download File
            </Button>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={statusDialog.open} onClose={closeStatusDialog} fullWidth maxWidth="xs">
        <DialogTitle>Confirm Status Update</DialogTitle>
        <DialogContent>
          <Typography>
            Update bet <code>{bet?.id ?? '-'}</code> to{' '}
            <strong>
              {statusDialog.action ? getAdminTransitionLabel(statusDialog.action) : '-'}
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
