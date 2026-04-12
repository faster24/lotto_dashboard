import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { authApi } from '../api/authApi.ts'
import { ApiError } from '../lib/apiClient.ts'
import { useAuthStore } from '../stores/authStore.ts'

export function ManageAccountPage() {
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)
  const signIn = useAuthStore((state) => state.signIn)

  const [email, setEmail] = useState(user?.email ?? '')
  const [emailSubmitting, setEmailSubmitting] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSubmitting, setPasswordSubmitting] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  })

  const handleUpdateEmail = async () => {
    if (!token) return
    if (!email.trim()) {
      setEmailError('Email is required.')
      return
    }
    try {
      setEmailSubmitting(true)
      setEmailError(null)
      const response = await authApi.updateAccount(token, { email: email.trim() })
      if (response.data?.user && token) {
        signIn(token, response.data.user)
      }
      setSnackbar({ open: true, message: 'Email updated.' })
    } catch (requestError) {
      setEmailError(requestError instanceof ApiError ? requestError.message : 'Failed to update email.')
    } finally {
      setEmailSubmitting(false)
    }
  }

  const handleUpdatePassword = async () => {
    if (!token) return
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All password fields are required.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.')
      return
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.')
      return
    }
    try {
      setPasswordSubmitting(true)
      setPasswordError(null)
      await authApi.updateAccount(token, {
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setSnackbar({ open: true, message: 'Password updated.' })
    } catch (requestError) {
      setPasswordError(requestError instanceof ApiError ? requestError.message : 'Failed to update password.')
    } finally {
      setPasswordSubmitting(false)
    }
  }

  return (
    <Stack spacing={3}>
      <Box
        component="section"
        sx={{
          p: { xs: 2, md: 2.5 },
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          background:
            'linear-gradient(130deg, rgba(37,99,235,0.08) 0%, rgba(59,130,246,0.05) 55%, rgba(15,23,42,0.06) 100%)',
        }}
      >
        <Typography variant="h4">My Account</Typography>
        <Typography variant="body2" color="text.secondary">
          Update your admin email and password.
        </Typography>
      </Box>

      {/* Profile Info */}
      <Card variant="outlined">
        <CardContent>
          <Stack spacing={0.5}>
            <Typography variant="h6" fontWeight={700}>
              Profile
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Current account information.
            </Typography>
          </Stack>
          <Divider sx={{ my: 2 }} />
          <Stack
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
              gap: 1.5,
            }}
          >
            <Box>
              <Typography variant="caption" color="text.secondary">Name</Typography>
              <Typography fontWeight={500}>{user?.name ?? '—'}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Username</Typography>
              <Typography fontWeight={500}>{user?.username ?? '—'}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Email</Typography>
              <Typography fontWeight={500}>{user?.email ?? '—'}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Roles</Typography>
              <Typography fontWeight={500}>{user?.roles?.join(', ') || '—'}</Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Update Email */}
      <Card variant="outlined">
        <CardContent>
          <Stack spacing={0.5}>
            <Typography variant="h6" fontWeight={700}>
              Update Email
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Change the email address for this admin account.
            </Typography>
          </Stack>
          <Divider sx={{ my: 2 }} />
          <Stack spacing={2} maxWidth={480}>
            {emailError && <Alert severity="error">{emailError}</Alert>}
            <TextField
              size="small"
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Box>
              <Button
                variant="contained"
                onClick={() => void handleUpdateEmail()}
                disabled={emailSubmitting || email === user?.email}
              >
                {emailSubmitting ? 'Saving…' : 'Update Email'}
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Update Password */}
      <Card variant="outlined">
        <CardContent>
          <Stack spacing={0.5}>
            <Typography variant="h6" fontWeight={700}>
              Change Password
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Requires your current password to confirm.
            </Typography>
          </Stack>
          <Divider sx={{ my: 2 }} />
          <Stack spacing={2} maxWidth={480}>
            {passwordError && <Alert severity="error">{passwordError}</Alert>}
            <TextField
              size="small"
              label="Current Password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
            />
            <TextField
              size="small"
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              helperText="Minimum 8 characters."
            />
            <TextField
              size="small"
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
            <Box>
              <Button
                variant="contained"
                onClick={() => void handleUpdatePassword()}
                disabled={passwordSubmitting}
              >
                {passwordSubmitting ? 'Saving…' : 'Change Password'}
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={2500}
        onClose={() => setSnackbar({ open: false, message: '' })}
        message={snackbar.message}
      />
    </Stack>
  )
}
