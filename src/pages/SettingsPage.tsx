import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { useDataStore } from '../stores/dataStore.ts'
import { useUiStore } from '../stores/uiStore.ts'
import type { ThemeMode, UiDensity } from '../types/dashboard.ts'

export function SettingsPage() {
  const settingsSeed = useDataStore((state) => state.data?.settings)
  const themeMode = useUiStore((state) => state.themeMode)
  const setThemeMode = useUiStore((state) => state.setThemeMode)
  const density = useUiStore((state) => state.density)
  const setDensity = useUiStore((state) => state.setDensity)

  const [organizationName, setOrganizationName] = useState(
    settingsSeed?.organizationName ?? 'Lotto HQ',
  )
  const [contactEmail, setContactEmail] = useState(
    settingsSeed?.contactEmail ?? 'ops@lottohq.com',
  )
  const [timezone, setTimezone] = useState(settingsSeed?.timezone ?? 'Asia/Bangkok')
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4">Settings</Typography>
        <Typography variant="body2" color="text.secondary">
          Configure organization profile and UI preferences.
        </Typography>
      </Box>

      {saved && <Alert severity="success">Settings saved locally.</Alert>}

      <Card>
        <CardContent>
          <Typography variant="h6">Organization</Typography>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              label="Organization name"
              value={organizationName}
              onChange={(event) => setOrganizationName(event.target.value)}
            />
            <TextField
              label="Contact email"
              type="email"
              value={contactEmail}
              onChange={(event) => setContactEmail(event.target.value)}
            />
            <TextField
              label="Timezone"
              value={timezone}
              onChange={(event) => setTimezone(event.target.value)}
            />
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6">Appearance</Typography>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={themeMode === 'dark'}
                  onChange={(event) =>
                    setThemeMode((event.target.checked ? 'dark' : 'light') as ThemeMode)
                  }
                />
              }
              label="Dark mode"
            />
            <FormControl size="small" sx={{ maxWidth: 240 }}>
              <InputLabel id="density-label">Density</InputLabel>
              <Select
                labelId="density-label"
                label="Density"
                value={density}
                onChange={(event) =>
                  setDensity(event.target.value as UiDensity)
                }
              >
                <MenuItem value="comfortable">Comfortable</MenuItem>
                <MenuItem value="compact">Compact</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6">Access Control</Typography>
          <Divider sx={{ my: 2 }} />
          <Alert severity="info">
            Role-aware route gating is scaffolded in UI only. Backend auth integration
            is intentionally out of scope for v1.
          </Alert>
        </CardContent>
      </Card>

      <Box>
        <Button variant="contained" startIcon={<SaveOutlinedIcon />} onClick={handleSave}>
          Save settings
        </Button>
      </Box>
    </Stack>
  )
}
