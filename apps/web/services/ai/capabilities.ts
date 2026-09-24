import { getConfig } from '@services/config/config'

/**
 * AI features that need more than the configured text provider. Image
 * generation and text-to-speech run only on Google's API, so a deployment
 * without a Google key cannot serve them. Their entry points are hidden rather
 * than offered and left to fail.
 */
export type AICapability = 'images' | 'speech'

/**
 * NEXT_PUBLIC_MUSTANER_AI_UNAVAILABLE lists what this deployment cannot serve,
 * comma-separated (e.g. "images,speech"). Unset = everything is available.
 */
export function isAICapabilityAvailable(capability: AICapability): boolean {
  const unavailable = getConfig('NEXT_PUBLIC_MUSTANER_AI_UNAVAILABLE')
    .split(',')
    .map((c) => c.trim())
  return !unavailable.includes(capability)
}
