import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined'
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import PersonOffOutlinedIcon from '@mui/icons-material/PersonOffOutlined'
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import UndoOutlinedIcon from '@mui/icons-material/UndoOutlined'
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
  Divider,
  Drawer,
  IconButton,
  InputAdornment,
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
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { usersApi } from '../api/usersApi.ts'
import { ApiError } from '../lib/apiClient.ts'
import { useAuthStore } from '../stores/authStore.ts'
import type { AdminUser, User } from '../types/api.ts'

const pageSizeOptions = [10, 20, 50]

type ActionType = 'ban' | 'unban' | 'delete'

const toStatusLabel = (user: User) => (user.is_banned ? 'Banned' : 'Active')

const statusColor = (user: User) => (user.is_banned ? 'error' : 'success')

const isAdminUser = (user: User) => user.roles.includes('admin')

const roleChipProps = (user: User): { label: string; color: 'default' | 'warning' | 'error' | 'primary' } => {
  if (isAdminUser(user)) return { label: 'admin', color: 'error' }
  if (user.role === 'vip') return { label: 'vip', color: 'warning' }
  if (user.role === 'user') return { label: 'user', color: 'primary' }
  return { label: '—', color: 'default' }
}

const formatDateTime = (value: string | null) => {
  if (!value) return 'N/A'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

export function UsersPage() {
  const token = useAuthStore((state) => state.token)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [selectedUserDetail, setSelectedUserDetail] = useState<AdminUser | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<ActionType | null>(null)
  const [pendingRole, setPendingRole] = useState<'user' | 'vip' | null>(null)
  const [roleLoading, setRoleLoading] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; action: ActionType | null }>({
    open: false,
    action: null,
  })
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  })

  const loadUsers = useCallback(async () => {
    if (!token) return
    try {
      setLoading(true)
      setError(null)
      const response = await usersApi.listAdmin(token, { page, pageSize: rowsPerPage })
      setUsers(response.data?.users ?? [])
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setError(requestError.message)
      } else {
        setError('Failed to load users.')
      }
    } finally {
      setLoading(false)
    }
  }, [page, rowsPerPage, token])

  const loadUserDetail = useCallback(
    async (userId: number) => {
      if (!token) return
      try {
        setDetailLoading(true)
        setDetailError(null)
        const response = await usersApi.getAdminDetail(token, userId)
        const user = response.data?.user ?? null
        setSelectedUserDetail(user)
        setPendingRole(user?.role ?? null)
      } catch (requestError) {
        if (requestError instanceof ApiError) {
          setDetailError(requestError.message)
        } else {
          setDetailError('Failed to load user detail.')
        }
      } finally {
        setDetailLoading(false)
      }
    },
    [token],
  )

  useEffect(() => {
    void loadUsers()
  }, [loadUsers])

  useEffect(() => {
    if (!detailOpen || selectedUserId === null) return
    void loadUserDetail(selectedUserId)
  }, [detailOpen, loadUserDetail, selectedUserId])

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return users

    return users.filter((user) => {
      const searchable = `${user.email} ${user.username ?? ''}`.toLowerCase()
      return searchable.includes(normalizedQuery)
    })
  }, [query, users])

  const openDetail = (userId: number) => {
    setSelectedUserId(userId)
    setSelectedUserDetail(null)
    setDetailError(null)
    setDetailOpen(true)
  }

  const closeDetail = () => {
    setDetailOpen(false)
    setSelectedUserId(null)
    setSelectedUserDetail(null)
    setDetailError(null)
    setActionLoading(null)
  }

  const openConfirm = (action: ActionType) => {
    setConfirmDialog({ open: true, action })
  }

  const closeConfirm = () => {
    if (actionLoading) return
    setConfirmDialog({ open: false, action: null })
  }

  const removeUserFromList = (userId: number) => {
    setUsers((previousUsers) => previousUsers.filter((user) => user.id !== userId))
  }

  const handleAssignRole = async () => {
    if (!token || selectedUserId === null || !pendingRole) return
    try {
      setRoleLoading(true)
      setDetailError(null)
      const response = await usersApi.assignRole(token, selectedUserId, pendingRole)
      const updated = response.data?.user ?? null
      setSelectedUserDetail(updated)
      setPendingRole(updated?.role ?? null)
      setUsers((prev) =>
        prev.map((u) => (u.id === selectedUserId ? { ...u, role: updated?.role ?? u.role } : u)),
      )
      setSnackbar({ open: true, message: 'Role updated successfully.' })
    } catch (requestError) {
      setDetailError(requestError instanceof ApiError ? requestError.message : 'Failed to update role.')
    } finally {
      setRoleLoading(false)
    }
  }

  const performAction = async () => {
    if (!token || selectedUserId === null || !confirmDialog.action) return

    const action = confirmDialog.action
    try {
      setActionLoading(action)
      setError(null)

      if (action === 'ban') {
        await usersApi.ban(token, selectedUserId)
        setSnackbar({ open: true, message: 'User banned successfully.' })
      } else if (action === 'unban') {
        await usersApi.unban(token, selectedUserId)
        setSnackbar({ open: true, message: 'User unbanned successfully.' })
      } else {
        await usersApi.remove(token, selectedUserId)
        setSnackbar({ open: true, message: 'User deleted successfully.' })
      }

      removeUserFromList(selectedUserId)
      closeDetail()
      setConfirmDialog({ open: false, action: null })
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setDetailError(requestError.message)
      } else {
        setDetailError('Failed to update user.')
      }
    } finally {
      setActionLoading(null)
    }
  }

  const confirmText =
    confirmDialog.action === 'ban'
      ? 'Ban this user and revoke all active tokens?'
      : confirmDialog.action === 'unban'
        ? 'Unban this user?'
        : 'Soft delete this user? This cannot be undone from this dashboard.'

  const paginationCount =
    users.length === rowsPerPage ? page * rowsPerPage + 1 : (page - 1) * rowsPerPage + users.length

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        spacing={1.5}
        alignItems={{ xs: 'stretch', sm: 'center' }}
      >
        <Box>
          <Typography variant="h4">Users</Typography>
          <Typography variant="body2" color="text.secondary">
            Active user accounts from <code>/admin/users</code>.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshOutlinedIcon />}
          onClick={() => void loadUsers()}
          disabled={loading}
        >
          Refresh
        </Button>
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}

      <TextField
        size="small"
        value={query}
        onChange={(event) => {
          setPage(1)
          setQuery(event.target.value)
        }}
        placeholder="Search by email or username"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchOutlinedIcon />
            </InputAdornment>
          ),
        }}
      />

      <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Email</TableCell>
              <TableCell>Username</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                    <CircularProgress size={18} />
                    <Typography variant="body2">Loading users...</Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow
                  key={user.id}
                  hover
                  onClick={() => openDetail(user.id)}
                  sx={{
                    cursor: 'pointer',
                    '&:hover .view-user-action': {
                      opacity: 1,
                  },
                }}
              >
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.username ?? 'N/A'}</TableCell>
                  <TableCell>
                    {(() => { const p = roleChipProps(user); return <Chip size="small" label={p.label} color={p.color} variant="outlined" /> })()}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={toStatusLabel(user)}
                      color={statusColor(user)}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell sx={{ fontFamily: '"Roboto Mono", monospace' }}>
                    {formatDateTime(user.created_at)}
                  </TableCell>
                  <TableCell align="right" onClick={(event) => event.stopPropagation()}>
                    <IconButton
                      className="view-user-action"
                      size="small"
                      onClick={() => openDetail(user.id)}
                      sx={{ opacity: { xs: 1, sm: 0 }, transition: 'opacity 180ms ease' }}
                      aria-label="view user detail"
                    >
                      <VisibilityOutlinedIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
            {!loading && filteredUsers.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={paginationCount}
        page={page - 1}
        onPageChange={(_, newPage) => setPage(newPage + 1)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(event) => {
          setRowsPerPage(Number(event.target.value))
          setPage(1)
        }}
        rowsPerPageOptions={pageSizeOptions}
      />

      <Drawer
        anchor="right"
        open={detailOpen}
        onClose={closeDetail}
        PaperProps={{
          sx: { width: { xs: '100%', sm: 420 }, p: 3, gap: 2 },
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">User detail</Typography>
          <IconButton onClick={closeDetail} aria-label="close user detail">
            <CloseOutlinedIcon fontSize="small" />
          </IconButton>
        </Stack>
        <Divider />

        {detailLoading ? (
          <Stack direction="row" spacing={1} alignItems="center">
            <CircularProgress size={18} />
            <Typography variant="body2">Loading detail...</Typography>
          </Stack>
        ) : null}

        {detailError && <Alert severity="error">{detailError}</Alert>}

        {!detailLoading && !detailError && selectedUserDetail ? (
          <Stack spacing={2.25}>
            <Stack spacing={0.5}>
              <Typography variant="caption" color="text.secondary">
                Profile
              </Typography>
              <Typography variant="body1">{selectedUserDetail.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedUserDetail.email}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Username: {selectedUserDetail.username ?? 'N/A'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Status: {toStatusLabel(selectedUserDetail)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Banned at: {formatDateTime(selectedUserDetail.banned_at)}
              </Typography>
            </Stack>

            <Divider />

            <Stack spacing={0.75}>
              <Typography variant="caption" color="text.secondary">
                Role
              </Typography>
              {isAdminUser(selectedUserDetail) ? (
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip label="admin" color="error" size="small" variant="outlined" />
                  <Stack direction="row" spacing={0.5} alignItems="center" color="text.disabled">
                    <LockOutlinedIcon sx={{ fontSize: 14 }} />
                    <Typography variant="caption">Admin accounts cannot be reassigned</Typography>
                  </Stack>
                </Stack>
              ) : (
                <Stack direction="row" spacing={1} alignItems="center">
                  <Tooltip title={!pendingRole ? 'No role set on this account yet' : ''} placement="top">
                    <Select
                      size="small"
                      value={pendingRole ?? ''}
                      onChange={(event) => setPendingRole(event.target.value as 'user' | 'vip')}
                      disabled={roleLoading}
                      sx={{ minWidth: 100 }}
                    >
                      <MenuItem value="user">user</MenuItem>
                      <MenuItem value="vip">vip</MenuItem>
                    </Select>
                  </Tooltip>
                  <Button
                    variant="contained"
                    size="small"
                    disableElevation
                    disabled={roleLoading || !pendingRole || pendingRole === selectedUserDetail.role}
                    onClick={() => void handleAssignRole()}
                  >
                    {roleLoading ? <CircularProgress size={14} color="inherit" /> : 'Save'}
                  </Button>
                  {selectedUserDetail.role && pendingRole !== selectedUserDetail.role && (
                    <Typography variant="caption" color="text.secondary">
                      was: <strong>{selectedUserDetail.role}</strong>
                    </Typography>
                  )}
                </Stack>
              )}
            </Stack>

            <Divider />

            <Stack spacing={0.5}>
              <Typography variant="caption" color="text.secondary">
                Bank info
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Bank: {selectedUserDetail.bank_info?.bank_name ?? 'N/A'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Account name: {selectedUserDetail.bank_info?.account_name ?? 'N/A'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Account number: {selectedUserDetail.bank_info?.account_number ?? 'N/A'}
              </Typography>
            </Stack>

            <Divider />

            {isAdminUser(selectedUserDetail) ? (
              <Alert severity="info" icon={<LockOutlinedIcon fontSize="small" />}>
                Admin accounts cannot be banned or deleted from this dashboard.
              </Alert>
            ) : (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                {selectedUserDetail.is_banned ? (
                  <Button
                    variant="outlined"
                    startIcon={<UndoOutlinedIcon />}
                    onClick={() => openConfirm('unban')}
                    disabled={actionLoading !== null}
                  >
                    Unban user
                  </Button>
                ) : (
                  <Button
                    color="warning"
                    variant="outlined"
                    startIcon={<PersonOffOutlinedIcon />}
                    onClick={() => openConfirm('ban')}
                    disabled={actionLoading !== null}
                  >
                    Ban user
                  </Button>
                )}
                <Button
                  color="error"
                  variant="outlined"
                  startIcon={<DeleteOutlineOutlinedIcon />}
                  onClick={() => openConfirm('delete')}
                  disabled={actionLoading !== null}
                >
                  Delete user
                </Button>
              </Stack>
            )}
          </Stack>
        ) : null}
      </Drawer>

      <Dialog open={confirmDialog.open} onClose={closeConfirm} fullWidth maxWidth="xs">
        <DialogTitle>Confirm action</DialogTitle>
        <DialogContent>
          <Typography variant="body2">{confirmText}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirm} disabled={actionLoading !== null}>
            Cancel
          </Button>
          <Button
            onClick={() => void performAction()}
            color={confirmDialog.action === 'delete' ? 'error' : 'primary'}
            variant="contained"
            disabled={actionLoading !== null}
          >
            {actionLoading ? 'Working...' : 'Confirm'}
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
