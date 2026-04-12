import AddOutlinedIcon from '@mui/icons-material/AddOutlined'
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined'
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
import { useCallback, useEffect, useState } from 'react'
import { adminBankSettingsApi } from '../api/adminBankSettingsApi.ts'
import { ApiError } from '../lib/apiClient.ts'
import { useAuthStore } from '../stores/authStore.ts'
import type { AdminBankSetting, AdminBankSettingWritePayload, BankCurrency } from '../types/api.ts'

const currencyOptions: BankCurrency[] = ['THB', 'MMK']

const emptyForm = (): AdminBankSettingWritePayload => ({
  bank_name: '',
  account_holder_name: '',
  account_number: '',
  is_active: true,
  is_primary: false,
  currency: 'MMK',
})

const formatDateTime = (value: string | null) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

export function AdminBankSettingsPage() {
  const token = useAuthStore((state) => state.token)

  const [rows, setRows] = useState<AdminBankSetting[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const [createDialog, setCreateDialog] = useState(false)
  const [createForm, setCreateForm] = useState<AdminBankSettingWritePayload>(emptyForm())
  const [createSubmitting, setCreateSubmitting] = useState(false)

  const [editDialog, setEditDialog] = useState<{ open: boolean; row: AdminBankSetting | null }>({
    open: false,
    row: null,
  })
  const [editForm, setEditForm] = useState<AdminBankSettingWritePayload>(emptyForm())
  const [editSubmitting, setEditSubmitting] = useState(false)

  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; row: AdminBankSetting | null }>({
    open: false,
    row: null,
  })
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  })

  const load = useCallback(async () => {
    if (!token) return
    try {
      setLoading(true)
      setError(null)
      const response = await adminBankSettingsApi.list(token)
      setRows(response.data?.admin_bank_settings ?? [])
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Failed to load bank settings.')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    void load()
  }, [load])

  const openCreate = () => {
    setCreateForm(emptyForm())
    setFormError(null)
    setCreateDialog(true)
  }

  const submitCreate = async () => {
    if (!token) return
    if (!createForm.bank_name.trim() || !createForm.account_holder_name.trim() || !createForm.account_number.trim()) {
      setFormError('Bank name, account holder, and account number are required.')
      return
    }
    try {
      setCreateSubmitting(true)
      setFormError(null)
      await adminBankSettingsApi.create(token, createForm)
      setSnackbar({ open: true, message: 'Bank setting created.' })
      setCreateDialog(false)
      await load()
    } catch (requestError) {
      setFormError(requestError instanceof ApiError ? requestError.message : 'Failed to create bank setting.')
    } finally {
      setCreateSubmitting(false)
    }
  }

  const openEdit = (row: AdminBankSetting) => {
    setEditForm({
      bank_name: row.bank_name,
      account_holder_name: row.account_holder_name,
      account_number: row.account_number,
      is_active: row.is_active,
      is_primary: row.is_primary,
      currency: row.currency,
    })
    setFormError(null)
    setEditDialog({ open: true, row })
  }

  const submitEdit = async () => {
    if (!token || !editDialog.row) return
    if (!editForm.bank_name.trim() || !editForm.account_holder_name.trim() || !editForm.account_number.trim()) {
      setFormError('Bank name, account holder, and account number are required.')
      return
    }
    try {
      setEditSubmitting(true)
      setFormError(null)
      await adminBankSettingsApi.update(token, editDialog.row.id, editForm)
      setSnackbar({ open: true, message: 'Bank setting updated.' })
      setEditDialog({ open: false, row: null })
      await load()
    } catch (requestError) {
      setFormError(requestError instanceof ApiError ? requestError.message : 'Failed to update bank setting.')
    } finally {
      setEditSubmitting(false)
    }
  }

  const submitDelete = async () => {
    if (!token || !deleteDialog.row) return
    try {
      setDeleteSubmitting(true)
      setFormError(null)
      await adminBankSettingsApi.remove(token, deleteDialog.row.id)
      setSnackbar({ open: true, message: 'Bank setting deleted.' })
      setDeleteDialog({ open: false, row: null })
      await load()
    } catch (requestError) {
      setFormError(requestError instanceof ApiError ? requestError.message : 'Failed to delete bank setting.')
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
          borderColor: 'primary.light',
          background:
            'linear-gradient(130deg, rgba(37,99,235,0.08) 0%, rgba(59,130,246,0.05) 55%, rgba(15,23,42,0.06) 100%)',
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          spacing={1.5}
          alignItems={{ xs: 'stretch', sm: 'center' }}
        >
          <Box>
            <Typography variant="h4">Bank Information</Typography>
            <Typography variant="body2" color="text.secondary">
              Manage admin bank settings from <code>/admin/bank-settings</code>.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<RefreshOutlinedIcon />} onClick={() => void load()} disabled={loading}>
              Refresh
            </Button>
            <Button variant="contained" startIcon={<AddOutlinedIcon />} onClick={openCreate}>
              Add Bank
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {error && <Alert severity="error">{error}</Alert>}

      <Card variant="outlined">
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Bank Name</TableCell>
                  <TableCell>Account Holder</TableCell>
                  <TableCell>Account Number</TableCell>
                  <TableCell>Currency</TableCell>
                  <TableCell>Flags</TableCell>
                  <TableCell>Updated At</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row, index) => (
                  <TableRow
                    key={row.id}
                    hover
                    sx={{ transition: 'background-color 180ms ease' }}
                  >
                    <TableCell>{index + 1}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{row.bank_name}</TableCell>
                    <TableCell>{row.account_holder_name}</TableCell>
                    <TableCell sx={{ fontFamily: '"Roboto Mono", monospace' }}>
                      {row.account_number}
                    </TableCell>
                    <TableCell>
                      <Chip label={row.currency} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        {row.is_active && <Chip label="active" size="small" color="success" variant="outlined" />}
                        {row.is_primary && <Chip label="primary" size="small" color="primary" variant="outlined" />}
                        {!row.is_active && !row.is_primary && <Typography variant="caption" color="text.disabled">—</Typography>}
                      </Stack>
                    </TableCell>
                    <TableCell>{formatDateTime(row.updated_at)}</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button size="small" variant="outlined" startIcon={<EditOutlinedIcon />} onClick={() => openEdit(row)}>
                          Edit
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          startIcon={<DeleteOutlineOutlinedIcon />}
                          onClick={() => { setFormError(null); setDeleteDialog({ open: true, row }) }}
                        >
                          Delete
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && rows.length === 0 && (
                  <TableRow>
                    <TableCell align="center" colSpan={8}>
                      No bank settings found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createDialog} onClose={() => setCreateDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add Bank Setting</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          {formError && <Alert severity="error">{formError}</Alert>}
          <BankSettingForm form={createForm} onChange={setCreateForm} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog(false)} disabled={createSubmitting}>Cancel</Button>
          <Button variant="contained" onClick={() => void submitCreate()} disabled={createSubmitting}>
            {createSubmitting ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, row: null })} fullWidth maxWidth="sm">
        <DialogTitle>Edit Bank Setting</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          {formError && <Alert severity="error">{formError}</Alert>}
          <BankSettingForm form={editForm} onChange={setEditForm} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false, row: null })} disabled={editSubmitting}>Cancel</Button>
          <Button variant="contained" onClick={() => void submitEdit()} disabled={editSubmitting}>
            {editSubmitting ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, row: null })} fullWidth maxWidth="xs">
        <DialogTitle>Delete Bank Setting</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 1 }}>{formError}</Alert>}
          <Typography>
            Delete <strong>{deleteDialog.row?.bank_name ?? '-'}</strong> ({deleteDialog.row?.account_number ?? '-'})?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, row: null })} disabled={deleteSubmitting}>Cancel</Button>
          <Button variant="contained" color="error" onClick={() => void submitDelete()} disabled={deleteSubmitting}>
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

interface BankSettingFormProps {
  form: AdminBankSettingWritePayload
  onChange: (form: AdminBankSettingWritePayload) => void
}

function BankSettingForm({ form, onChange }: BankSettingFormProps) {
  const set = (patch: Partial<AdminBankSettingWritePayload>) => onChange({ ...form, ...patch })

  return (
    <>
      <TextField
        size="small"
        label="Bank Name"
        value={form.bank_name}
        onChange={(e) => set({ bank_name: e.target.value })}
        required
      />
      <TextField
        size="small"
        label="Account Holder Name"
        value={form.account_holder_name}
        onChange={(e) => set({ account_holder_name: e.target.value })}
        required
      />
      <TextField
        size="small"
        label="Account Number"
        value={form.account_number}
        onChange={(e) => set({ account_number: e.target.value })}
        required
      />
      <Select
        size="small"
        value={form.currency}
        onChange={(e) => set({ currency: e.target.value as BankCurrency })}
      >
        {currencyOptions.map((c) => (
          <MenuItem key={c} value={c}>{c}</MenuItem>
        ))}
      </Select>
      <Stack direction="row" spacing={2}>
        <FormControlLabel
          control={<Switch checked={form.is_active ?? true} onChange={(e) => set({ is_active: e.target.checked })} />}
          label="Active"
        />
        <FormControlLabel
          control={<Switch checked={form.is_primary ?? false} onChange={(e) => set({ is_primary: e.target.checked })} />}
          label="Primary"
        />
      </Stack>
    </>
  )
}
