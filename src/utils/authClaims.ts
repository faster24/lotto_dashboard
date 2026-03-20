interface TokenClaims {
  role?: string
  is_admin?: boolean
  admin?: boolean
  permissions?: string[]
  [key: string]: unknown
}

const decodeBase64Url = (value: string) => {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
  return atob(padded)
}

export const parseTokenClaims = (token: string | null): TokenClaims | null => {
  if (!token) return null
  const segments = token.split('.')
  if (segments.length < 2) return null
  try {
    const raw = decodeBase64Url(segments[1])
    const parsed = JSON.parse(raw) as TokenClaims
    return parsed
  } catch {
    return null
  }
}

export const isAdminFromClaims = (claims: TokenClaims | null) => {
  if (!claims) return false
  if (claims.is_admin === true || claims.admin === true) return true
  if (typeof claims.role === 'string' && claims.role.toLowerCase().includes('admin')) {
    return true
  }
  if (Array.isArray(claims.permissions)) {
    return claims.permissions.some((permission) =>
      permission.toLowerCase().includes('admin'),
    )
  }
  return false
}
