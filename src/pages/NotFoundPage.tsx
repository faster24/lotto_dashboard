import { Box, Button, Stack, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <Stack
      spacing={2}
      sx={{
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
      }}
    >
      <Typography variant="h2">404</Typography>
      <Typography variant="body1" color="text.secondary" align="center">
        The page does not exist.
      </Typography>
      <Box>
        <Button component={RouterLink} to="/bets" variant="contained">
          Back to bets
        </Button>
      </Box>
    </Stack>
  )
}
