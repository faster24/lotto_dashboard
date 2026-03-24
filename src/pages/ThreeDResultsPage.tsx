import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined'
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Select,
  Snackbar,
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
import { threeDResultsApi } from '../api/threeDResultsApi.ts'
import { ApiError } from '../lib/apiClient.ts'
import { useAuthStore } from '../stores/authStore.ts'
import type { ThreeDResult } from '../types/api.ts'

const pageSizeOptions = [10, 20, 50]
const threeDigitPattern = /^\d{3}$/

const formatDateTime = (value: string | null) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

export function ThreeDResultsPage() {
  const token = useAuthStore((state) => state.token)
  const isAdmin = useAuthStore((state) => state.isAdmin)

  const [latest, setLatest] = useState<ThreeDResult | null>(null)
  const [latestLoading, setLatestLoading] = useState(false)
  const [latestError, setLatestError] = useState<string | null>(null)

  const [rows, setRows] = useState<ThreeDResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [stockDateInput, setStockDateInput] = useState('')
  const [search3DInput, setSearch3DInput] = useState('')
  const [stockDateFilter, setStockDateFilter] = useState<string | undefined>(undefined)

  const [saveStockDate, setSaveStockDate] = useState('')
  const [saveThreed, setSaveThreed] = useState('')
  const [saveSubmitting, setSaveSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [editDialog, setEditDialog] = useState<{ open: boolean; row: ThreeDResult | null }>({
    open: false,
    row: null,
  })
  const [editStockDate, setEditStockDate] = useState('')
  const [editThreed, setEditThreed] = useState('')
  const [editSubmitting, setEditSubmitting] = useState(false)

  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; row: ThreeDResult | null }>({
    open: false,
    row: null,
  })
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  })

  const loadLatest = useCallback(async () => {
    if (!token) return
    try {
      setLatestLoading(true)
      setLatestError(null)
      const response = await threeDResultsApi.getLatest(token)
      setLatest(response.data?.three_d_result ?? null)
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setLatestError(requestError.message)
      } else {
        setLatestError('Failed to load latest 3D result.')
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
      const response = await threeDResultsApi.list(token, {
        page,
        pageSize,
        stockDate: stockDateFilter,
      })
      setRows(response.data?.three_d_results ?? [])
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setError(requestError.message)
      } else {
        setError('Failed to load 3D result history.')
      }
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, stockDateFilter, token])

  useEffect(() => {
    void loadLatest()
  }, [loadLatest])

  useEffect(() => {
    void loadHistory()
  }, [loadHistory])

  const visibleRows = useMemo(() => {
    const query = search3DInput.trim()
    if (!query) return rows
    return rows.filter(
      (row) => row.threed.includes(query) || row.stock_date.includes(query),
    )
  }, [rows, search3DInput])

  const hasNextPage = useMemo(() => rows.length >= pageSize, [pageSize, rows.length])

  const applyFilters = () => {
    setPage(1)
    setStockDateFilter(stockDateInput || undefined)
  }

  const resetFilters = () => {
    setStockDateInput('')
    setSearch3DInput('')
    setStockDateFilter(undefined)
    setPage(1)
    setPageSize(20)
  }

  const validateThreed = (value: string) => threeDigitPattern.test(value.trim())
  const isSaveFormValid = saveStockDate.trim() !== '' && validateThreed(saveThreed)

  const saveByDate = async () => {
    if (!token) return
    const normalized = saveThreed.trim()
    if (!saveStockDate || !validateThreed(normalized)) {
      setFormError('Stock date and a 3-digit 3D value are required.')
      return
    }
    try {
      setSaveSubmitting(true)
      setFormError(null)
      await threeDResultsApi.saveByDate(token, {
        stockDate: saveStockDate,
        threed: normalized,
      })
      setSnackbar({ open: true, message: '3D result saved successfully.' })
      setSaveStockDate('')
      setSaveThreed('')
      await Promise.all([loadLatest(), loadHistory()])
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setFormError(requestError.message)
      } else {
        setFormError('Unable to save 3D result.')
      }
    } finally {
      setSaveSubmitting(false)
    }
  }

  const openEditDialog = (row: ThreeDResult) => {
    setEditDialog({ open: true, row })
    setEditStockDate(row.stock_date)
    setEditThreed(row.threed)
    setFormError(null)
  }

  const submitEdit = async () => {
    if (!token || !editDialog.row) return
    const normalized = editThreed.trim()
    if (!editStockDate || !validateThreed(normalized)) {
      setFormError('Stock date and a 3-digit 3D value are required.')
      return
    }
    try {
      setEditSubmitting(true)
      setFormError(null)
      await threeDResultsApi.update(token, editDialog.row.id, {
        stockDate: editStockDate,
        threed: normalized,
      })
      setSnackbar({ open: true, message: '3D result updated.' })
      setEditDialog({ open: false, row: null })
      await Promise.all([loadLatest(), loadHistory()])
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setFormError(requestError.message)
      } else {
        setFormError('Unable to update 3D result.')
      }
    } finally {
      setEditSubmitting(false)
    }
  }

  const submitDelete = async () => {
    if (!token || !deleteDialog.row) return
    try {
      setDeleteSubmitting(true)
      setFormError(null)
      await threeDResultsApi.remove(token, deleteDialog.row.id)
      setSnackbar({ open: true, message: '3D result deleted.' })
      setDeleteDialog({ open: false, row: null })
      await Promise.all([loadLatest(), loadHistory()])
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setFormError(requestError.message)
      } else {
        setFormError('Unable to delete 3D result.')
      }
    } finally {
      setDeleteSubmitting(false)
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
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          spacing={1.5}
          alignItems={{ xs: 'stretch', sm: 'center' }}
        >
          <Box>
            <Typography variant="h4">3D Results</Typography>
            <Typography variant="body2" color="text.secondary">
              Historical data from <code>/three-d-results</code> with admin actions on{' '}
              <code>/admin/three-d-results*</code>.
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
      </Paper>

      {!isAdmin && (
        <Alert severity="info">
          Admin claim is not detected in token claims. Actions are still enabled and API
          permissions will be enforced server-side.
        </Alert>
      )}
      {formError && <Alert severity="error">{formError}</Alert>}

      <Card variant="outlined">
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
            <Box sx={{ minWidth: 220 }}>
              <Typography variant="overline" color="text.secondary">
                Latest 3D
              </Typography>
              <Typography variant="h5" sx={{ fontFamily: '"Roboto Mono", monospace' }}>
                {latestLoading ? '…' : latest?.threed ?? '--'}
              </Typography>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flexWrap="wrap">
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Stock Date
                </Typography>
                <Typography variant="body2">{latest?.stock_date ?? '-'}</Typography>
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

      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Save 3D Result by Date
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr auto' },
                gap: 1.5,
                alignItems: { xs: 'stretch', md: 'start' },
              }}
            >
              <TextField
                size="small"
                label="Stock Date"
                type="date"
                value={saveStockDate}
                onChange={(event) => setSaveStockDate(event.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                size="small"
                label="3D Value"
                value={saveThreed}
                onChange={(event) => setSaveThreed(event.target.value)}
                inputProps={{ inputMode: 'numeric', pattern: '\\d{3}', maxLength: 3 }}
                helperText="Exactly 3 digits (e.g. 123)"
                fullWidth
              />
              <Button
                variant="contained"
                startIcon={<SaveOutlinedIcon />}
                onClick={() => void saveByDate()}
                disabled={saveSubmitting || !isSaveFormValid}
                sx={{
                  minWidth: { md: 140 },
                  height: 40,
                  alignSelf: { xs: 'stretch', md: 'flex-start' },
                }}
              >
                {saveSubmitting ? 'Saving…' : 'Save'}
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Card variant="outlined">
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
              <TextField
                size="small"
                label="Search 3D/Date"
                value={search3DInput}
                onChange={(event) => setSearch3DInput(event.target.value)}
              />
              <Select
                size="small"
                value={String(pageSize)}
                onChange={(event) => {
                  setPage(1)
                  setPageSize(Number(event.target.value))
                }}
                sx={{ minWidth: 140 }}
              >
                {pageSizeOptions.map((size) => (
                  <MenuItem key={size} value={String(size)}>
                    {size}
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
                    <TableCell>ID</TableCell>
                    <TableCell>Stock Date</TableCell>
                    <TableCell>3D</TableCell>
                    <TableCell>Updated At</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visibleRows.map((row) => (
                    <TableRow
                      key={row.id}
                      hover
                      sx={{
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                        transition: 'background-color 180ms ease',
                      }}
                    >
                      <TableCell>{row.id}</TableCell>
                      <TableCell>{row.stock_date}</TableCell>
                      <TableCell sx={{ fontFamily: '"Roboto Mono", monospace', fontWeight: 700 }}>
                        {row.threed}
                      </TableCell>
                      <TableCell>{formatDateTime(row.updated_at)}</TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<EditOutlinedIcon />}
                            onClick={() => openEditDialog(row)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<DeleteOutlineOutlinedIcon />}
                            onClick={() => setDeleteDialog({ open: true, row })}
                          >
                            Delete
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!loading && visibleRows.length === 0 && (
                    <TableRow>
                      <TableCell align="center" colSpan={5}>
                        No 3D results found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Page {page} • Showing {visibleRows.length} row{visibleRows.length === 1 ? '' : 's'}
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

      <Dialog
        open={editDialog.open}
        onClose={() => setEditDialog({ open: false, row: null })}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Edit 3D Result</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 1 }}>
          <TextField
            size="small"
            label="Stock Date"
            type="date"
            value={editStockDate}
            onChange={(event) => setEditStockDate(event.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            size="small"
            label="3D Value"
            value={editThreed}
            onChange={(event) => setEditThreed(event.target.value)}
            inputProps={{ inputMode: 'numeric', pattern: '\\d{3}', maxLength: 3 }}
            helperText="Exactly 3 digits"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false, row: null })} disabled={editSubmitting}>
            Cancel
          </Button>
          <Button variant="contained" onClick={() => void submitEdit()} disabled={editSubmitting}>
            {editSubmitting ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, row: null })}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Delete 3D Result</DialogTitle>
        <DialogContent>
          <Typography>
            Delete result <code>{deleteDialog.row?.id ?? '-'}</code> for{' '}
            <strong>{deleteDialog.row?.stock_date ?? '-'}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, row: null })} disabled={deleteSubmitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => void submitDelete()}
            disabled={deleteSubmitting}
          >
            {deleteSubmitting ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={2200}
        onClose={() => setSnackbar({ open: false, message: '' })}
        message={snackbar.message}
      />
    </Stack>
  )
}
