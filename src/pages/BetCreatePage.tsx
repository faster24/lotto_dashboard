import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined'
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { betsApi } from '../api/betsApi.ts'
import { ApiError } from '../lib/apiClient.ts'
import { useAuthStore } from '../stores/authStore.ts'
import type { BetType, TargetOpenTime } from '../types/api.ts'
import { betTypes, targetOpenTimes } from '../constants/betOptions.ts'

const parseNumberList = (raw: string) =>
  raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => Number(item))
    .filter((number) => Number.isInteger(number) && number >= 0 && number <= 255)

export function BetCreatePage() {
  const navigate = useNavigate()
  const token = useAuthStore((state) => state.token)
  const [betType, setBetType] = useState<BetType>('2D')
  const [targetOpenTime, setTargetOpenTime] = useState<TargetOpenTime>('11:00:00')
  const [amount, setAmount] = useState('100')
  const [numbersInput, setNumbersInput] = useState('12,18')
  const [paySlipImage, setPaySlipImage] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] ?? null
    setPaySlipImage(selectedFile)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (!token) {
      setError('Missing access token. Please login again.')
      return
    }

    const parsedAmount = Number(amount)
    const parsedNumbers = parseNumberList(numbersInput)

    if (!paySlipImage) {
      setError('Pay slip image is required.')
      return
    }
    if (!Number.isInteger(parsedAmount) || parsedAmount < 1) {
      setError('Amount must be an integer greater than or equal to 1.')
      return
    }
    if (parsedNumbers.length === 0) {
      setError('Enter at least one valid number between 0 and 255.')
      return
    }

    try {
      setSubmitting(true)
      const response = await betsApi.create(token, {
        paySlipImage,
        betType,
        targetOpenTime,
        amount: parsedAmount,
        betNumbers: [...new Set(parsedNumbers)],
      })

      const createdBetId = response.data?.bet.id
      if (!createdBetId) {
        setError('Bet was created but response was missing bet ID.')
        return
      }

      navigate(`/bets/${createdBetId}`, { replace: true })
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setError(requestError.message)
      } else {
        setError('Unable to create bet.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h4">Create Bet</Typography>
          <Typography color="text.secondary">
            Submits `multipart/form-data` to `POST /bets`.
          </Typography>
        </Box>
        <Button
          component={RouterLink}
          to="/bets"
          variant="outlined"
          startIcon={<ArrowBackOutlinedIcon />}
        >
          Back to Bets
        </Button>
      </Stack>

      <Card>
        <CardContent>
          <Stack component="form" spacing={2} onSubmit={handleSubmit}>
            {error && <Alert severity="error">{error}</Alert>}

            <TextField
              select
              label="Bet Type"
              value={betType}
              onChange={(event) => setBetType(event.target.value as BetType)}
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
              value={targetOpenTime}
              onChange={(event) =>
                setTargetOpenTime(event.target.value as TargetOpenTime)
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
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />

            <TextField
              label="Bet Numbers (comma separated)"
              value={numbersInput}
              onChange={(event) => setNumbersInput(event.target.value)}
              placeholder="12,18,25"
              helperText="Unique numbers between 0 and 255."
            />

            <Button
              component="label"
              variant="outlined"
              startIcon={<CloudUploadOutlinedIcon />}
            >
              {paySlipImage ? paySlipImage.name : 'Upload Pay Slip'}
              <input hidden type="file" accept="image/*" onChange={handleFileChange} />
            </Button>

            <Button type="submit" variant="contained" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create Bet'}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  )
}
