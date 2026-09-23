'use client'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { getOrgLogoMediaDirectory, getOrgAuthBackgroundMediaDirectory } from '@services/media/media'
import { getUriWithOrg } from '@services/config/config'
import { cn } from '@/lib/utils'

interface AuthBrandingPanelProps {
  org: any
  welcomeText?: string
  // No-org (apex) panel copy — shown as the first slide's heading.
  title?: string
  subtitle?: string
}

// Slides are data: the artwork carries no text, so headings and body copy stay
// translatable HTML in fixed positions — changing slides never reflows the form.
const SLIDES = [
  {
    key: 'learn',
    art: '/illustrations/auth-learn.webp',
    title: 'Learn the work that grows a business.',
    body: 'Practical programs in strategy, growth and AI automation.',
  },
  {
    key: 'build',
    art: '/illustrations/auth-build.webp',
    title: 'Build systems, not slides.',
    body: 'Every program ends with work you can use: a plan, a workflow, a system.',
  },
  {
    key: 'lead',
    art: '/illustrations/auth-lead.webp',
    title: 'From operations to strategy.',
    body: 'Frameworks and simulations built from real client work across Egypt and the Middle East.',
  },
] as const

const SLIDE_MS = 6500

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}

export default function AuthBrandingPanel({ org, welcomeText, title, subtitle }: AuthBrandingPanelProps) {
  const { t } = useTranslation()
  const authBranding = org?.config?.config?.customization?.auth_branding || org?.config?.config?.general?.auth_branding || {}
  const {
    welcome_message = '',
    background_type = 'gradient',
    background_image = '',
    text_color = 'light',
    unsplash_photographer_name = '',
    unsplash_photographer_url = '',
    unsplash_photo_url = '',
  } = authBranding
  const UNSPLASH_UTM = '?utm_source=Mustaner&utm_medium=referral'
  const withUtm = (url: string) => (url ? `${url}${UNSPLASH_UTM}` : '')

  // An org that chose its own photo keeps it; everyone else gets the
  // illustrated Mustaner panel.
  const photo =
    background_type === 'custom' && background_image
      ? getOrgAuthBackgroundMediaDirectory(org?.org_uuid, background_image)
      : background_type === 'unsplash' && background_image
        ? background_image
        : null

  const displayMessage = welcome_message || welcomeText || ''

  if (photo) {
    return (
      <PhotoPanel
        org={org}
        photo={photo}
        textColor={text_color}
        message={displayMessage}
        attribution={
          background_type === 'unsplash' && unsplash_photographer_name
            ? {
                name: unsplash_photographer_name,
                url: withUtm(unsplash_photographer_url) || withUtm(unsplash_photo_url),
                home: `https://unsplash.com/${UNSPLASH_UTM}`,
              }
            : null
        }
      />
    )
  }

  return (
    <IllustratedPanel
      org={org}
      message={displayMessage}
      firstTitle={!org ? title : undefined}
      firstBody={!org ? subtitle : undefined}
      t={t}
    />
  )
}

function OrgMark({ org, className }: { org: any; className?: string }) {
  const src = org?.logo_image ? getOrgLogoMediaDirectory(org.org_uuid, org.logo_image) : '/brand/lockup.png'
  const img = <img src={src} alt={org?.name || 'Mustaner'} className={cn('h-12 w-auto object-contain', className)} />
  return org?.slug ? (
    <Link prefetch href={getUriWithOrg(org.slug, '/')} className="inline-block">
      {img}
    </Link>
  ) : (
    img
  )
}

function IllustratedPanel({
  org,
  message,
  firstTitle,
  firstBody,
  t,
}: {
  org: any
  message: string
  firstTitle?: string
  firstBody?: string
  t: (key: string, opts?: any) => string
}) {
  const reduced = useReducedMotion()
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  const next = useCallback(() => setIndex((i) => (i + 1) % SLIDES.length), [])

  useEffect(() => {
    if (reduced || paused) return
    timer.current = setInterval(() => {
      if (document.visibilityState === 'visible') next()
    }, SLIDE_MS)
    return () => {
      if (timer.current) clearInterval(timer.current)
    }
  }, [reduced, paused, next])

  return (
    <div className="relative h-full w-full">
      <div
        className="absolute inset-16 overflow-hidden rounded-[3px] border border-neutral-200 bg-neutral-100"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        {/* The square grid the Kufic wordmark is drawn on. */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(0,85,172,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,85,172,0.06) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            maskImage: 'linear-gradient(to bottom, black 55%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 55%, transparent 100%)',
          }}
        />

        <div className="relative z-10 flex h-full flex-col p-10">
          <div className="flex items-start justify-between gap-6">
            <OrgMark org={org} />
            {message && <p className="max-w-[16rem] text-end text-sm leading-relaxed text-neutral-600">{message}</p>}
          </div>

          {/* One stable art viewport: slides cross-fade inside it. */}
          <div className="relative my-6 min-h-0 flex-1">
            {SLIDES.map((slide, i) => (
              <img
                key={slide.key}
                src={slide.art}
                alt=""
                aria-hidden="true"
                className={cn(
                  'absolute inset-0 h-full w-full object-contain transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none',
                  i === index ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
                )}
              />
            ))}
          </div>

          <div className="relative" aria-live="polite">
            {SLIDES.map((slide, i) => {
              const title = i === 0 && firstTitle ? firstTitle : t(`auth.slides.${slide.key}.title`, { defaultValue: slide.title })
              const body = i === 0 && firstBody ? firstBody : t(`auth.slides.${slide.key}.body`, { defaultValue: slide.body })
              return (
                <div
                  key={slide.key}
                  aria-hidden={i !== index}
                  className={cn(
                    'transition-opacity duration-500 motion-reduce:transition-none',
                    i === index ? 'relative opacity-100' : 'pointer-events-none absolute inset-x-0 top-0 opacity-0'
                  )}
                >
                  <h2 className="text-[28px] font-extrabold leading-tight text-neutral-950">{title}</h2>
                  <p className="mt-2 max-w-md text-base leading-relaxed text-neutral-600">{body}</p>
                </div>
              )
            })}
          </div>

          <div className="mt-6 flex items-center gap-2" role="tablist" aria-label={t('auth.slides.label', { defaultValue: 'Highlights' })}>
            {SLIDES.map((slide, i) => (
              <button
                key={slide.key}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`${i + 1} / ${SLIDES.length}`}
                onClick={() => setIndex(i)}
                className={cn(
                  'h-2.5 w-2.5 rounded-[2px] transition-colors',
                  i === index ? 'bg-blue-600' : 'bg-neutral-300 hover:bg-neutral-400'
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function PhotoPanel({
  org,
  photo,
  textColor,
  message,
  attribution,
}: {
  org: any
  photo: string
  textColor: string
  message: string
  attribution: { name: string; url: string; home: string } | null
}) {
  const light = textColor === 'light'
  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-16 overflow-hidden rounded-[3px]">
        <div
          className="absolute inset-0"
          style={{ backgroundImage: `url(${photo})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 flex h-full flex-col items-center justify-center p-10 text-center">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-[3px] bg-white p-3">
            <OrgMark org={org} className="h-full w-full" />
          </div>
          <h1 className={cn('mt-6 text-3xl font-black', light ? 'text-white' : 'text-neutral-900')}>{org?.name || 'Mustaner'}</h1>
          {message && (
            <p className={cn('mt-2 max-w-sm text-lg leading-relaxed', light ? 'text-white/80' : 'text-neutral-600')}>
              {message}
            </p>
          )}
          {attribution && (
            <div className={cn('absolute bottom-3 start-4 end-4 text-[11px] leading-tight', light ? 'text-white/70' : 'text-neutral-700')}>
              Photo by{' '}
              <a href={attribution.url} target="_blank" rel="noopener noreferrer" className="underline">
                {attribution.name}
              </a>{' '}
              on{' '}
              <a href={attribution.home} target="_blank" rel="noopener noreferrer" className="underline">
                Unsplash
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
