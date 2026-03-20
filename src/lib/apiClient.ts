import type { ApiEnvelope } from '../types/api.ts'

const defaultBaseUrl = 'http://localhost:8000/api/v1'

const baseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? defaultBaseUrl

export class ApiError extends Error {
  status: number
  payload: unknown

  constructor(message: string, status: number, payload: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: BodyInit | null
  token?: string | null
  headers?: Record<string, string>
}

const safeJson = async (response: Response) => {
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    return null
  }
  return response.json()
}

export async function apiRequest<TData>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<ApiEnvelope<TData>> {
  const { method = 'GET', body = null, token, headers = {} } = options
  const requestHeaders: Record<string, string> = { ...headers }
  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: requestHeaders,
    body,
  })

  const payload = await safeJson(response)

  if (!response.ok) {
    const message =
      typeof payload === 'object' &&
      payload !== null &&
      'message' in payload &&
      typeof payload.message === 'string'
        ? payload.message
        : `Request failed with status ${response.status}`
    throw new ApiError(message, response.status, payload)
  }

  return payload as ApiEnvelope<TData>
}

export async function apiBlobRequest(
  path: string,
  token: string,
): Promise<{ blob: Blob; contentType: string }> {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    const payload = await safeJson(response)
    const message =
      typeof payload === 'object' &&
      payload !== null &&
      'message' in payload &&
      typeof payload.message === 'string'
        ? payload.message
        : `Download failed with status ${response.status}`
    throw new ApiError(message, response.status, payload)
  }

  const blob = await response.blob()
  return {
    blob,
    contentType: response.headers.get('content-type') ?? 'application/octet-stream',
  }
}
