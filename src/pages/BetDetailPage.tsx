import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined'
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined'
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined'
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    IconButton,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Snackbar,
    Tab,
    Tabs,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material'
import {
    useCallback,
    useEffect,
    useMemo,
    useState,
    type ChangeEvent,
} from 'react'
import {
    Link as RouterLink,
    useLocation,
    useNavigate,
    useParams,
    useSearchParams,
} from 'react-router-dom'
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

const isPayoutActionAllowed = (bet: Bet) =>
    bet.status === 'ACCEPTED' &&
    bet.bet_result_status === 'WON' &&
    bet.payout_status === 'PENDING'

const formatBetId = (id: string) => `${id.slice(0, 8)}…${id.slice(-6)}`

const getReviewStatusChipColor = (status: Bet['status']) => {
    if (status === 'ACCEPTED') return 'success'
    if (status === 'REJECTED' || status === 'REFUNDED') return 'error'
    return 'warning'
}

const getResultStatusChipColor = (status: Bet['bet_result_status']) => {
    if (status === 'WON') return 'success'
    if (status === 'LOST') return 'error'
    return 'warning'
}

const getPayoutStatusChipColor = (status: Bet['payout_status']) => {
    if (status === 'PAID_OUT') return 'success'
    if (status === 'REFUNDED') return 'error'
    return 'warning'
}

export function BetDetailPage() {
    const { betId = '' } = useParams()
    const [searchParams, setSearchParams] = useSearchParams()
    const location = useLocation()
    const locationState = location.state as { bet?: Bet } | null
    const stateBet = locationState?.bet ?? null
    const navigate = useNavigate()
    const token = useAuthStore((state) => state.token)
    const isAdmin = useAuthStore((state) => state.isAdmin)
    const [bet, setBet] = useState<Bet | null>(() =>
        stateBet && stateBet.id === betId ? stateBet : null,
    )
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
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({
        open: false,
        message: '',
    })

    const refreshBet = useCallback(async () => {
        if (!token || !betId) return
        try {
            setLoading(true)
            setError(null)
            const response = isAdmin
                ? await betsApi.getAdminById(token, betId)
                : await betsApi.getById(token, betId)
            if (import.meta.env.DEV) {
                console.log('[BetDetailPage] bet detail payload', response)
            }
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
    }, [betId, isAdmin, token])

    useEffect(() => {
        void refreshBet()
    }, [refreshBet])

    useEffect(() => {
        if (error && import.meta.env.DEV) {
            console.error('[BetDetailPage] request error', error)
        }
    }, [error])

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
        () => bet?.bet_numbers.map((entry) => String(entry.number).padStart(2, '0')).join(', ') ?? '-',
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

    const copyBetId = async () => {
        try {
            await navigator.clipboard.writeText(betId)
            setSnackbar({ open: true, message: 'Bet ID copied' })
        } catch {
            setSnackbar({ open: true, message: 'Unable to copy Bet ID' })
        }
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
        if (!isPayoutActionAllowed(bet)) {
            setError('Payout is only available for ACCEPTED + WON bets that are pending payout.')
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
            <Card
                variant="outlined"
                sx={{
                    borderColor: 'info.light',
                    background:
                        'linear-gradient(135deg, rgba(14,165,233,0.12) 0%, rgba(56,189,248,0.06) 45%, rgba(249,115,22,0.10) 100%)',
                }}
            >
                <CardContent>
                    <Stack
                        direction={{ xs: 'column', md: 'row' }}
                        justifyContent="space-between"
                        alignItems={{ xs: 'flex-start', md: 'center' }}
                        spacing={2}
                    >
                        <Stack spacing={0.75}>
                            <Typography variant="h4">Bet Detail</Typography>
                            <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                                <Typography variant="body2" color="text.secondary">
                                    Bet ID:
                                </Typography>
                                <Tooltip title={betId} arrow>
                                    <Typography
                                        component="code"
                                        sx={{
                                            fontFamily: '"Roboto Mono", monospace',
                                            bgcolor: 'background.paper',
                                            px: 1,
                                            py: 0.5,
                                            borderRadius: 1,
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            fontSize: 13,
                                        }}
                                    >
                                        {formatBetId(betId)}
                                    </Typography>
                                </Tooltip>
                                <Tooltip title="Copy full Bet ID" arrow>
                                    <IconButton size="small" onClick={() => void copyBetId()} aria-label={`copy bet id ${betId}`}>
                                        <ContentCopyOutlinedIcon fontSize="inherit" />
                                    </IconButton>
                                </Tooltip>
                            </Stack>
                        </Stack>
                        <Stack direction="row" spacing={1}>
                            <Button
                                variant="outlined"
                                startIcon={<RefreshOutlinedIcon />}
                                onClick={() => void refreshBet()}
                                disabled={loading}
                            >
                                Refresh
                            </Button>
                            <Button component={RouterLink} to="/bets" variant="outlined">
                                Back to Bets
                            </Button>
                        </Stack>
                    </Stack>
                </CardContent>
            </Card>

            {loading && <Typography>Loading bet…</Typography>}

            {bet && (
                <>
                    <Card variant="outlined">
                        <CardContent>
                            <Stack spacing={2}>
                                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                    Current Bet Status
                                </Typography>
                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                    <Chip
                                        label={`Review: ${bet.status}`}
                                        color={getReviewStatusChipColor(bet.status)}
                                        variant="outlined"
                                    />
                                    <Chip label={`Result: ${bet.bet_result_status}`} color={getResultStatusChipColor(bet.bet_result_status)} />
                                    <Chip label={`Payout: ${bet.payout_status}`} color={getPayoutStatusChipColor(bet.payout_status)} />
                                </Stack>
                                <Box
                                    sx={{
                                        display: 'grid',
                                        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
                                        gap: 1.25,
                                    }}
                                >
                                    <Box sx={{ p: 1.5, borderRadius: 1.5, border: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}>
                                        <Typography variant="caption" color="text.secondary">Bet Type</Typography>
                                        <Typography fontWeight={600}>{bet.bet_type}</Typography>
                                    </Box>
                                    <Box sx={{ p: 1.5, borderRadius: 1.5, border: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}>
                                        <Typography variant="caption" color="text.secondary">Target Open Time</Typography>
                                        <Typography fontWeight={600}>{bet.target_opentime}</Typography>
                                    </Box>
                                    <Box sx={{ p: 1.5, borderRadius: 1.5, border: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}>
                                        <Typography variant="caption" color="text.secondary">Amount</Typography>
                                        <Typography fontWeight={600}>{bet.total_amount}</Typography>
                                    </Box>
                                    <Box sx={{ p: 1.5, borderRadius: 1.5, border: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}>
                                        <Typography variant="caption" color="text.secondary">Numbers</Typography>
                                        <Typography fontWeight={600} sx={{ wordBreak: 'break-word' }}>{betNumbersText}</Typography>
                                    </Box>
                                </Box>
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
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

                    <Card variant="outlined">
                        <CardContent>
                            <Stack spacing={2}>
                                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                    Bettor Profile
                                </Typography>
                                {bet.user ? (
                                    <>
                                        <Box
                                            sx={{
                                                display: 'grid',
                                                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' },
                                                gap: 1.5,
                                            }}
                                        >
                                            <Stack spacing={0.5} sx={{ p: 1.5, borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}>
                                                <Typography variant="caption" color="text.secondary">
                                                    Username
                                                </Typography>
                                                <Typography>{bet.user.username ?? '-'}</Typography>
                                            </Stack>
                                            <Stack spacing={0.5} sx={{ p: 1.5, borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}>
                                                <Typography variant="caption" color="text.secondary">
                                                    Email
                                                </Typography>
                                                <Typography>{bet.user.email}</Typography>
                                            </Stack>
                                            <Stack spacing={0.5} sx={{ p: 1.5, borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}>
                                                <Typography variant="caption" color="text.secondary">
                                                    Registered At
                                                </Typography>
                                                <Typography>{formatDateTime(bet.user.created_at)}</Typography>
                                            </Stack>
                                        </Box>

                                        <Box
                                            sx={{
                                                border: 1,
                                                borderColor: 'info.light',
                                                borderRadius: 1.5,
                                                p: 1.75,
                                                background:
                                                    'linear-gradient(135deg, rgba(14,165,233,0.06) 0%, rgba(56,189,248,0.04) 100%)',
                                            }}
                                        >
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
                        <Card variant="outlined" sx={{ borderColor: 'warning.light' }}>
                            <CardContent>
                                <Stack spacing={1.25}>
                                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                        Admin Review
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Available actions call <code>PATCH /admin/bets/{'{bet}'}/status</code>. Buttons are
                                        disabled unless the document allows the transition.
                                    </Typography>
                                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
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

                    <Card variant="outlined">
                        <CardContent>
                            <Tabs value={actionTab} onChange={handleActionTabChange} aria-label="payout or refund tabs">
                                <Tab label="Payout" value="payout" />
                                <Tab label="Refund" value="refund" />
                            </Tabs>

                            {actionTab === 'payout' && (
                                <Stack spacing={2} sx={{ mt: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
                                    {!isPayoutActionAllowed(bet) ? (
                                        <Alert severity="warning">
                                            Payout is available only when review status is <code>ACCEPTED</code>, result is{' '}
                                            <code>WON</code>, and payout status is <code>PENDING</code>.
                                        </Alert>
                                    ) : (
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
                                        </>
                                    )}
                                </Stack>
                            )}

                            {actionTab === 'refund' && (
                                <Stack spacing={2} sx={{ mt: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
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

            <Snackbar
                open={snackbar.open}
                autoHideDuration={2000}
                onClose={() => setSnackbar({ open: false, message: '' })}
                message={snackbar.message}
            />

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
