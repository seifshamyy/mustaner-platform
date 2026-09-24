/**
 * Which sign-in methods an organization accepts.
 *
 * Mirrors `allowed_auth_methods` in src/services/orgs/auth_policy.py, including
 * its two "unrestricted" cases: an absent list and an empty one. The empty case
 * matters — a mis-saved policy must not render a login page with no way in.
 *
 * The backend refuses a disallowed sign-in at /auth/login, /auth/oauth and the
 * magic-link endpoints; this module only decides what the login page bothers to
 * render. It is a convenience, never the enforcement.
 */

import { getConfig } from '@services/config/config'

export const ALL_AUTH_METHODS = ['password', 'magic_login', 'google', 'sso'] as const

export type AuthMethod = (typeof ALL_AUTH_METHODS)[number]

/**
 * The methods this org allows, read from the public org config.
 *
 * `org` is the payload of GET /orgs/slug/{slug}. On the org-less apex there is
 * no org, so nothing is restricted.
 */
export function getAllowedAuthMethods(org: any): Set<AuthMethod> {
  const configured = org?.config?.config?.admin_toggles?.security?.allowed_auth_methods

  const allowed = Array.isArray(configured) ? ALL_AUTH_METHODS.filter((m) => configured.includes(m)) : []
  // Absent or empty (or entirely unrecognised) list = unrestricted, matching the backend.
  const orgMethods = allowed.length === 0 ? [...ALL_AUTH_METHODS] : allowed

  // Only offer what this deployment can complete: Google needs OAuth
  // credentials and a login link needs an email service, so until they are set
  // up those buttons would lead nowhere. Never narrows to nothing.
  const offered = deploymentAuthMethods()
  const usable = offered ? orgMethods.filter((m) => offered.has(m)) : orgMethods
  return new Set(usable.length > 0 ? usable : orgMethods)
}

/**
 * NEXT_PUBLIC_MUSTANER_AUTH_METHODS: the sign-in methods this deployment has
 * set up, comma-separated (e.g. "password" today, "password,google" once
 * Google credentials exist). Unset = no deployment limit.
 */
function deploymentAuthMethods(): Set<AuthMethod> | null {
  const raw = getConfig('NEXT_PUBLIC_MUSTANER_AUTH_METHODS').trim()
  if (!raw) return null
  return new Set(
    raw
      .split(',')
      .map((m) => m.trim())
      .filter((m): m is AuthMethod => (ALL_AUTH_METHODS as readonly string[]).includes(m)),
  )
}

export function isAuthMethodAllowed(org: any, method: AuthMethod): boolean {
  return getAllowedAuthMethods(org).has(method)
}
