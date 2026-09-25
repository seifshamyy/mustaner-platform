'use client'
import { useCallback, useEffect, useRef } from 'react'
import { useAuth } from '@components/Contexts/AuthContext'
import { getSiteUrl } from '@services/brand/brand'

/**
 * Integrated apps live on the Mustaner website (its own storage, not the
 * platform's). The dashboard calls the website's /api/lms endpoints with the
 * signed-in Admin's platform token; the website confirms with the platform
 * that the token belongs to an Admin of this organization.
 */

export type IntegratedApp = {
  id: number
  name: string
  url: string
  frames: boolean
  icon: string | null
  checkedAt: string
}

export type AppCheck = {
  status: 'frames' | 'new_tab' | 'unreachable'
  url: string
  reason: string
  title: string
  icon: string | null
}

export type EditorSession = { session: string; expiresIn: number; url: string }

export class SiteError extends Error {
  code: string
  status: number
  constructor(code: string, status: number) {
    super(code)
    this.code = code
    this.status = status
  }
}

export const siteOrigin = (): string | null => {
  const url = getSiteUrl()
  try {
    return url ? new URL(url).origin : null
  } catch {
    return null
  }
}

/** A call to the website on behalf of the signed-in Admin; a stale token is refreshed and the call tried once more. */
export function useSiteApi() {
  // useAuth() hands out new functions on every render; keep the latest in a ref
  // so this caller stays the same function and never re-triggers effects.
  const auth = useAuth()
  const latest = useRef(auth)
  useEffect(() => {
    latest.current = auth
  })

  return useCallback(
    async <T,>(path: string, init?: { method?: string; body?: unknown }): Promise<T> => {
      const base = getSiteUrl('/api/lms/')
      if (!base) throw new SiteError('not_configured', 0)
      const send = async (token: string | null) => {
        try {
          return await fetch(base + path, {
            method: init?.method ?? 'GET',
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
              ...(init?.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
            },
            body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
            cache: 'no-store',
          })
        } catch {
          throw new SiteError('site_unavailable', 0)
        }
      }
      let res = await send(await latest.current.getAccessToken())
      if (res.status === 401) res = await send(await latest.current.refreshSession(true))
      const body = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) throw new SiteError(body.error ?? 'failed', res.status)
      return body as T
    },
    [],
  )
}
