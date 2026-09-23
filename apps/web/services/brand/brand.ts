import { getConfig } from '@services/config/config'

/**
 * Mustaner's identity, in one place, for the few surfaces that name the
 * company rather than the organization (help menus, support links, fallbacks
 * when an organization has no name or logo of its own).
 */

export const BRAND_NAME = 'Mustaner'
export const BRAND_NAME_AR = 'مستنير'
export const SUPPORT_EMAIL = 'contact@mustaner.com'

/** The Mustaner website, when this deployment is configured with one. */
export function getSiteUrl(path = ''): string | null {
  const base = getConfig('NEXT_PUBLIC_MUSTANER_SITE_URL').trim().replace(/\/+$/, '')
  return base ? `${base}${path}` : null
}

/**
 * Feedback is relayed to the error-reporting service; without one configured
 * it would be silently dropped, so the entry point is only offered when it
 * can actually reach someone.
 */
export function isFeedbackEnabled(): boolean {
  return Boolean(getConfig('NEXT_PUBLIC_LEARNHOUSE_SENTRY_DSN').trim())
}
