/**
 * Color contrast utilities for accessible text on dynamic backgrounds.
 * Uses WCAG 2.1 relative luminance to decide light vs dark foreground.
 */

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return null
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null
  return { r, g, b }
}

/** WCAG 2.1 relative luminance */
function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

/** Returns true when the background is light enough to need dark text */
export function isLightColor(hex: string): boolean {
  const rgb = hexToRgb(hex)
  if (!rgb) return false
  return relativeLuminance(rgb.r, rgb.g, rgb.b) > 0.4
}

/**
 * Tailwind class sets for menu elements on a dynamic primary-color background.
 *
 * - No primaryColor, or white (the default bar) → the Mustaner theme
 * - Dark primaryColor → white foreground
 * - Light primaryColor → dark foreground with subtle overlays
 */
export function getMenuColorClasses(primaryColor: string) {
  if (!primaryColor || /^#?f{3}(f{3})?$/i.test(primaryColor.trim())) {
    return {
      text: 'text-gray-700',
      textMuted: 'text-gray-500',
      hoverBg: 'hover:bg-gray-100',
      iconBtn: 'hover:bg-blue-600/[0.06] hover:text-blue-700 text-gray-600',
      searchBg:
        'bg-white text-black placeholder:text-black/40 focus:ring-black/5 focus:border-black/20 nice-shadow',
      searchIcon:
        'text-black/40 group-focus-within:text-black/60',
      signUpBtn: 'bg-blue-600 text-white hover:bg-blue-700',
      profileHover: 'hover:bg-gray-50',
      profileName: 'text-gray-900',
      profileMuted: 'text-gray-500',
      logoFilter: 'none',
      navLink: 'text-gray-700 hover:text-blue-700 hover:bg-blue-600/[0.06]',
      navLinkActive: 'text-blue-700 bg-blue-600/[0.06]',
      navIcon: 'text-gray-400 group-hover:text-blue-600',
      navIconActive: 'text-blue-600',
    }
  }

  const light = isLightColor(primaryColor)

  if (light) {
    return {
      text: 'text-gray-900',
      textMuted: 'text-gray-700',
      hoverBg: 'hover:bg-black/10',
      iconBtn: 'hover:bg-black/10 text-gray-800',
      searchBg:
        'bg-black/10 text-gray-900 placeholder:text-gray-600 focus:ring-black/10 focus:border-black/20',
      searchIcon:
        'text-gray-600 group-focus-within:text-gray-800',
      signUpBtn: 'bg-gray-900 text-white hover:bg-gray-800',
      profileHover: 'hover:bg-black/10',
      profileName: 'text-gray-900',
      profileMuted: 'text-gray-700',
      logoFilter: 'none',
      navLink: 'text-gray-900 hover:bg-black/10',
      navLinkActive: 'text-gray-900 bg-black/10',
      navIcon: 'text-gray-700',
      navIconActive: 'text-gray-900',
    }
  }

  return {
    text: 'text-white',
    textMuted: 'text-white/70',
    hoverBg: 'hover:bg-white/10',
    iconBtn: 'hover:bg-white/10 text-white',
    searchBg:
      'bg-white/20 text-white placeholder:text-white/60 focus:ring-white/20 focus:border-white/30',
    searchIcon:
      'text-white/60 group-focus-within:text-white/80',
    signUpBtn: 'bg-white text-gray-900 hover:bg-gray-100',
    profileHover: 'hover:bg-white/10',
    profileName: 'text-white',
    profileMuted: 'text-white/70',
    logoFilter: 'brightness(0) invert(1)',
    navLink: 'text-white hover:bg-white/10',
    navLinkActive: 'text-white bg-white/15',
    navIcon: 'text-white/70',
    navIconActive: 'text-white',
  }
}
