import React from 'react'
import { cn } from '@/lib/utils'

/**
 * Artwork for a list that loaded successfully and has nothing in it. The
 * heading, guidance and call to action stay in the caller's HTML — the art
 * carries no text — and it is decorative, so screen readers skip it.
 */
export type EmptyKind =
  | 'courses'
  | 'search'
  | 'community'
  | 'library'
  | 'podcasts'
  | 'boards'
  | 'playgrounds'
  | 'assignments'

const ART: Record<EmptyKind, string> = {
  courses: '/illustrations/empty-courses.webp',
  search: '/illustrations/empty-search.webp',
  community: '/illustrations/empty-community.webp',
  library: '/illustrations/empty-library.webp',
  podcasts: '/illustrations/empty-podcasts.webp',
  boards: '/illustrations/empty-boards.webp',
  playgrounds: '/illustrations/empty-playgrounds.webp',
  assignments: '/illustrations/empty-assignments.webp',
}

export default function EmptyIllustration({
  kind,
  size = 'md',
  className,
}: {
  kind: EmptyKind
  size?: 'sm' | 'md'
  className?: string
}) {
  return (
    <img
      src={ART[kind]}
      alt=""
      aria-hidden="true"
      loading="lazy"
      className={cn('mx-auto w-auto select-none', size === 'sm' ? 'h-28' : 'h-40', 'mb-5', className)}
    />
  )
}
