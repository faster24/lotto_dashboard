import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
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
  FormControlLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Switch,
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
import { oddSettingsApi } from '../api/oddSettingsApi.ts'
import { ApiError } from '../lib/apiClient.ts'
import { useAuthStore } from '../stores/authStore.ts'
import type { BetType, OddSetting } from '../types/api.ts'

const betTypeOptions: BetType[] = ['2D', '3D']

const userTypeChip = (userType: 'user' | 'vip' | null) => {
  if (userType === 'vip') return <Chip label="vip" color="warning" size="small" variant="outlined" />
  if (userType === 'user') return <Chip label="user" color="primary" size="small" variant="outlined" />
  return <Chip label="—" color="default" size="small" variant="outlined" />
}

const formatDateTime = (value: string | null) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

const parseOdd = (value: string): number | null => {
  const normalized = value.trim()
  if (!normalized) return null
  const parsed = Number(normalized)
  if (Number.isNaN(parsed) || parsed < 0) return null
  return parsed
}

export function OddsSettingsPage() {
  const token = useAuthStore((state) => state.token)

  const [rows, setRows] = useState<OddSetting[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [searchInput, setSearchInput] = useState('')
  const [betTypeFilterInput, setBetTypeFilterInput] = useState<'ALL' | BetType>('ALL')
  const [activeFilterInput, setActiveFilterInput] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')
  const [userTypeFilterInput, setUserTypeFilterInput] = useState<'ALL' | 'user' | 'vip'>('ALL')

  const [searchFilter, setSearchFilter] = useState('')
  const [betTypeFilter, setBetTypeFilter] = useState<'ALL' | BetType>('ALL')
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')
  const [userTypeFilter, setUserTypeFilter] = useState<'ALL' | 'user' | 'vip'>('ALL')

  const [editDialog, setEditDialog] = useState<{ open: boolean; row: OddSetting | null }>({
    open: false,
    row: null,
  })
  const [editBetType, setEditBetType] = useState<BetType>('2D')
  const [editOdd, setEditOdd] = useState('')
  const [editIsActive, setEditIsActive] = useState(true)
  const [editSubmitting, setEditSubmitting] = useState(false)

  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; row: OddSetting | null }>({
    open: false,
    row: null,
  })
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)

  const [formError, setFormError] = useState<string | null>(null)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  })

  const loadOddSettings = useCallback(async () => {
    if (!token) return
    try {
      setLoading(true)
      setError(null)
      const response = await oddSettingsApi.list(token)
      setRows(response.data?.odd_settings ?? [])
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setError(requestError.message)
      } else {
        setError('Failed to load odd settings.')
      }
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    void loadOddSettings()
  }, [loadOddSettings])

  const visibleRows = useMemo(() => {
    const query = searchFilter.trim().toLowerCase()
    return rows.filter((row) => {
      if (betTypeFilter !== 'ALL' && row.bet_type !== betTypeFilter) return false
      if (activeFilter === 'ACTIVE' && !row.is_active) return false
      if (activeFilter === 'INACTIVE' && row.is_active) return false
      if (userTypeFilter !== 'ALL' && row.user_type !== userTypeFilter) return false
      if (!query) return true
      return (
        row.bet_type.toLowerCase().includes(query) ||
        row.odd.toLowerCase().includes(query)
      )
    })
  }, [activeFilter, betTypeFilter, rows, searchFilter, userTypeFilter])

  const applyFilters = () => {
    setSearchFilter(searchInput)
    setBetTypeFilter(betTypeFilterInput)
    setActiveFilter(activeFilterInput)
    setUserTypeFilter(userTypeFilterInput)
  }

  const resetFilters = () => {
    setSearchInput('')
    setBetTypeFilterInput('ALL')
    setActiveFilterInput('ALL')
    setUserTypeFilterInput('ALL')
    setSearchFilter('')
    setBetTypeFilter('ALL')
    setActiveFilter('ALL')
    setUserTypeFilter('ALL')
  }

  const openEditDialog = (row: OddSetting) => {
    setEditDialog({ open: true, row })
    setEditBetType(row.bet_type)
    setEditOdd(row.odd)
    setEditIsActive(row.is_active)
    setFormError(null)
  }

  const submitEdit = async () => {
    if (!token || !editDialog.row) return
    const oddValue = parseOdd(editOdd)
    if (oddValue === null) {
      setFormError('Odd must be a number greater than or equal to 0.')
      return
    }
    try {
      setEditSubmitting(true)
      setFormError(null)
      await oddSettingsApi.update(token, editDialog.row.id, {
        betType: editBetType,
        odd: oddValue,
        isActive: editIsActive,
      })
      setSnackbar({ open: true, message: 'Odd setting updated.' })
      setEditDialog({ open: false, row: null })
      await loadOddSettings()
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setFormError(requestError.message)
      } else {
        setFormError('Unable to update odd setting.')
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
      await oddSettingsApi.remove(token, deleteDialog.row.id)
      setSnackbar({ open: true, message: 'Odd setting deleted.' })
      setDeleteDialog({ open: false, row: null })
      await loadOddSettings()
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setFormError(requestError.message)
      } else {
        setFormError('Unable to delete odd setting.')
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
          borderColor: 'success.light',
          background:
            'linear-gradient(130deg, rgba(2,6,23,0.09) 0%, rgba(34,197,94,0.11) 55%, rgba(15,23,42,0.09) 100%)',
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          spacing={1.5}
          alignItems={{ xs: 'stretch', sm: 'center' }}
        >
          <Box>
            <Typography variant="h4">Odds Settings</Typography>
            <Typography variant="body2" color="text.secondary">
              Manage odd settings from <code>/odd-settings</code> with admin write actions on{' '}
              <code>/admin/odd-settings*</code>.
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<RefreshOutlinedIcon />}
            onClick={() => void loadOddSettings()}
            disabled={loading}
          >
            Refresh
          </Button>
        </Stack>
      </Paper>

      {formError && <Alert severity="error">{formError}</Alert>}
      {error && <Alert severity="error">{error}</Alert>}

      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.5}>
              <TextField
                size="small"
                label="Search Bet Type/Odd"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
              />
              <Select
                size="small"
                value={betTypeFilterInput}
                onChange={(event) => setBetTypeFilterInput(event.target.value as 'ALL' | BetType)}
                sx={{ minWidth: 170 }}
              >
                <MenuItem value="ALL">All Bet Types</MenuItem>
                {betTypeOptions.map((betType) => (
                  <MenuItem key={betType} value={betType}>
                    {betType}
                  </MenuItem>
                ))}
              </Select>
              <Select
                size="small"
                value={activeFilterInput}
                onChange={(event) =>
                  setActiveFilterInput(event.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')
                }
                sx={{ minWidth: 170 }}
              >
                <MenuItem value="ALL">All Statuses</MenuItem>
                <MenuItem value="ACTIVE">Active</MenuItem>
                <MenuItem value="INACTIVE">Inactive</MenuItem>
              </Select>
              <Select
                size="small"
                value={userTypeFilterInput}
                onChange={(event) =>
                  setUserTypeFilterInput(event.target.value as 'ALL' | 'user' | 'vip')
                }
                sx={{ minWidth: 150 }}
              >
                <MenuItem value="ALL">All User Types</MenuItem>
                <MenuItem value="user">user</MenuItem>
                <MenuItem value="vip">vip</MenuItem>
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

            <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Bet Type</TableCell>
                    <TableCell>Odd</TableCell>
                    <TableCell>User Type</TableCell>
                    <TableCell>Currency</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Updated At</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visibleRows.map((row, index) => (
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
                      <TableCell>{index + 1}</TableCell>
                      <TableCell sx={{ fontFamily: '"Roboto Mono", monospace', fontWeight: 700 }}>
                        {row.bet_type}
                      </TableCell>
                      <TableCell sx={{ fontFamily: '"Roboto Mono", monospace' }}>
                        {row.odd}
                      </TableCell>
                      <TableCell>{userTypeChip(row.user_type)}</TableCell>
                      <TableCell sx={{ fontFamily: '"Roboto Mono", monospace' }}>
                        {row.currency ?? '—'}
                      </TableCell>
                      <TableCell>{row.is_active ? 'Active' : 'Inactive'}</TableCell>
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
                      <TableCell align="center" colSpan={8}>
                        No odd settings found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        </CardContent>
      </Card>

      <Dialog
        open={editDialog.open}
        onClose={() => setEditDialog({ open: false, row: null })}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Edit Odd Setting</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 1 }}>
          <Select
            size="small"
            value={editBetType}
            onChange={(event) => setEditBetType(event.target.value as BetType)}
            inputProps={{ 'aria-label': 'Edit bet type' }}
          >
            {betTypeOptions.map((betType) => (
              <MenuItem key={betType} value={betType}>
                {betType}
              </MenuItem>
            ))}
          </Select>
          <TextField
            size="small"
            label="Odd"
            value={editOdd}
            onChange={(event) => setEditOdd(event.target.value)}
            inputProps={{ inputMode: 'decimal' }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={editIsActive}
                onChange={(event) => setEditIsActive(event.target.checked)}
              />
            }
            label="Active"
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
        <DialogTitle>Delete Odd Setting</DialogTitle>
        <DialogContent>
          <Typography>
            Delete odd setting <code>{deleteDialog.row?.id ?? '-'}</code> for{' '}
            <strong>{deleteDialog.row?.bet_type ?? '-'}</strong>?
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
        autoHideDuration={2500}
        onClose={() => setSnackbar({ open: false, message: '' })}
        message={snackbar.message}
      />
    </Stack>
  )
}
