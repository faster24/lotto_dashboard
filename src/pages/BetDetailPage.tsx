import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined'
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined'
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
  Tab,
  Tabs,
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
import type { Bet, BetAdminStatus } from '../types/api.ts'
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

const formatDateTime = (value: string | null) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

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

  const [payoutFile, setPayoutFile] = useState<File | null>(null)
  const [payoutReference, setPayoutReference] = useState('')
  const [payoutNote, setPayoutNote] = useState('')

  const [refundFile, setRefundFile] = useState<File | null>(null)
  const [refundReference, setRefundReference] = useState('')
  const [refundNote, setRefundNote] = useState('')
  const [refundPreviewUrl, setRefundPreviewUrl] = useState<string | null>(null)

  const [actionTab, setActionTab] = useState<'payout' | 'refund'>(
    searchParams.get('action') === 'refund' ? 'refund' : 'payout',
  )

  const refreshBet = useCallback(async () => {
    if (!token || !betId) return
    try {
      setLoading(true)
      setError(null)
      const response = await betsApi.getById(token, betId)
      setBet(response.data?.bet ?? null)
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

  useEffect(() => {
    const param = searchParams.get('action')
    setActionTab(param === 'refund' ? 'refund' : 'payout')
  }, [searchParams])

  useEffect(() => {
    return () => {
      if (refundPreviewUrl) {
        URL.revokeObjectURL(refundPreviewUrl)
      }
    }
  }, [refundPreviewUrl])

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

  const handleActionTabChange = (_event: unknown, value: 'payout' | 'refund') => {
    setActionTab(value)
    setSearchParams(value === 'payout' ? {} : { action: value })
  }

  const openStatusDialog = (action: BetAdminStatus) => {
    if (action === 'REFUNDED') {
      setActionTab('refund')
      setSearchParams({ action: 'refund' })
      return
    }
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

  const resetRefundForm = () => {
    if (refundPreviewUrl) {
      URL.revokeObjectURL(refundPreviewUrl)
      setRefundPreviewUrl(null)
    }
    setRefundFile(null)
    setRefundReference('')
    setRefundNote('')
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

  const handleRefund = async () => {
    if (!token || !bet || !refundFile) {
      setError('Refund proof image is required.')
      return
    }
    try {
      setSubmitting(true)
      setError(null)
      const response = await betsApi.refund(token, bet.id, {
        payoutProofImage: refundFile,
        payoutReference: refundReference.trim() || undefined,
        payoutNote: refundNote.trim() || undefined,
      })
      if (response.data?.bet) {
        setBet(response.data.bet)
      }
      resetRefundForm()
      setSearchParams({})
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setError(requestError.message)
      } else {
        setError('Unable to refund this bet.')
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

          <Card>
            <CardContent>
              <Stack spacing={1.5}>
                <Typography variant="h6">Bettor Profile</Typography>
                {bet.user ? (
                  <>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} useFlexGap flexWrap="wrap">
                      <Stack spacing={0.5}>
                        <Typography variant="caption" color="text.secondary">
                          User ID
                        </Typography>
                        <Typography>{bet.user.id}</Typography>
                      </Stack>
                      <Stack spacing={0.5}>
                        <Typography variant="caption" color="text.secondary">
                          Name
                        </Typography>
                        <Typography>{bet.user.name}</Typography>
                      </Stack>
                      <Stack spacing={0.5}>
                        <Typography variant="caption" color="text.secondary">
                          Username
                        </Typography>
                        <Typography>{bet.user.username ?? '-'}</Typography>
                      </Stack>
                      <Stack spacing={0.5}>
                        <Typography variant="caption" color="text.secondary">
                          Email
                        </Typography>
                        <Typography>{bet.user.email}</Typography>
                      </Stack>
                      <Stack spacing={0.5}>
                        <Typography variant="caption" color="text.secondary">
                          Status
                        </Typography>
                        <Typography>{bet.user.is_banned ? 'Banned' : 'Active'}</Typography>
                      </Stack>
                      <Stack spacing={0.5}>
                        <Typography variant="caption" color="text.secondary">
                          Registered At
                        </Typography>
                        <Typography>{formatDateTime(bet.user.created_at)}</Typography>
                      </Stack>
                    </Stack>

                    <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1.5, p: 1.5 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Wallet Bank Info
                      </Typography>
                      {bet.user.wallet ? (
                        <Stack
                          direction={{ xs: 'column', md: 'row' }}
                          spacing={3}
                          useFlexGap
                          flexWrap="wrap"
                        >
                          <Stack spacing={0.5}>
                            <Typography variant="caption" color="text.secondary">
                              Bank
                            </Typography>
                            <Typography>{bet.user.wallet.bank_name}</Typography>
                          </Stack>
                          <Stack spacing={0.5}>
                            <Typography variant="caption" color="text.secondary">
                              Account Name
                            </Typography>
                            <Typography>{bet.user.wallet.account_name}</Typography>
                          </Stack>
                          <Stack spacing={0.5}>
                            <Typography variant="caption" color="text.secondary">
                              Account Number
                            </Typography>
                            <Typography sx={{ fontFamily: '"Roboto Mono", monospace' }}>
                              {bet.user.wallet.account_number}
                            </Typography>
                          </Stack>
                        </Stack>
                      ) : (
                        <Typography color="text.secondary">No wallet bank info found.</Typography>
                      )}
                    </Box>
                  </>
                ) : (
                  <Alert severity="info">User profile is not available for this bet.</Alert>
                )}
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

          <Card>
            <CardContent>
              <Tabs value={actionTab} onChange={handleActionTabChange} aria-label="payout or refund tabs">
                <Tab label="Payout" value="payout" />
                <Tab label="Refund" value="refund" />
              </Tabs>

              {actionTab === 'payout' && (
                <Stack spacing={2} sx={{ mt: 2 }}>
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
                      disabled={submitting || !payoutFile}
                    >
                      Submit Payout
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setPayoutFile(null)
                        setPayoutReference('')
                        setPayoutNote('')
                        setSearchParams({})
                        setActionTab('payout')
                      }}
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                  </Stack>
                </Stack>
              )}

              {actionTab === 'refund' && (
                <Stack spacing={2} sx={{ mt: 2 }}>
                  {!isAdminTransitionAllowed(bet, 'REFUNDED') && (
                    <Alert severity="warning">
                      Refund is unavailable because this bet is already refunded or paid out.
                    </Alert>
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
                  />
                  <TextField
                    label="Refund Note"
                    value={refundNote}
                    onChange={(event) => setRefundNote(event.target.value)}
                    multiline
                    minRows={3}
                  />
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="contained"
                      onClick={() => void handleRefund()}
                      disabled={submitting || !refundFile || !isAdminTransitionAllowed(bet, 'REFUNDED')}
                    >
                      Submit Refund
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        resetRefundForm()
                        setSearchParams({})
                        setActionTab('payout')
                      }}
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    Refund uploads reuse the payout proof slot; preview/download remains under Payout Proof.
                  </Typography>
                </Stack>
              )}
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
