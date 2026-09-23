'use client'
import React from 'react'
import Link from 'next/link'
import { getOrgLogoMediaDirectory, getOrgAuthBackgroundMediaDirectory } from '@services/media/media'
import { getUriWithOrg } from '@services/config/config'

interface AuthMobileHeaderProps {
  org: any
}

export default function AuthMobileHeader({ org }: AuthMobileHeaderProps) {
  const authBranding = org?.config?.config?.customization?.auth_branding || org?.config?.config?.general?.auth_branding || {}
  const {
    background_type = 'gradient',
    background_image = '',
    unsplash_photographer_name = '',
    unsplash_photographer_url = '',
    unsplash_photo_url = '',
  } = authBranding
  const UNSPLASH_UTM = '?utm_source=Mustaner&utm_medium=referral'
  const withUtm = (url: string) => (url ? `${url}${UNSPLASH_UTM}` : '')

  const getBackgroundStyle = (): React.CSSProperties => {
    if (background_type === 'gradient' || !background_image) {
      return { background: '#ffffff' }
    }
    if (background_type === 'custom' && background_image) {
      return {
        backgroundImage: `url(${getOrgAuthBackgroundMediaDirectory(org?.org_uuid, background_image)})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    }
    if (background_type === 'unsplash' && background_image) {
      return {
        backgroundImage: `url(${background_image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    }
    return { background: '#ffffff' }
  }

  const hasCustomBackground = background_type !== 'gradient' && background_image

  return (
    <div
      className={`relative flex items-center gap-4 px-5 py-4 overflow-hidden ${hasCustomBackground ? '' : 'border-b border-neutral-200'}`}
      style={getBackgroundStyle()}
    >
      {hasCustomBackground && (
        <div className="absolute inset-0 bg-black/30" />
      )}

      <Link prefetch href={getUriWithOrg(org?.slug, '/')} className="relative z-10">
        <div className="w-10 h-10 rounded-lg ring-1 ring-inset ring-neutral-200 bg-white flex items-center justify-center overflow-hidden shrink-0">
          {org?.logo_image ? (
            <img
              src={getOrgLogoMediaDirectory(org.org_uuid, org.logo_image)}
              alt={org.name}
              className="w-full h-full object-contain p-1.5"
            />
          ) : (
            <img src="/brand/mark.png" alt="Mustaner" className="w-full h-full object-contain" />
          )}
        </div>
      </Link>

      <span className={`relative z-10 font-semibold text-lg truncate ${hasCustomBackground ? 'text-white' : 'text-neutral-900'}`}>
        {org?.name || 'Mustaner'}
      </span>

      {/* Unsplash attribution (required by Unsplash API guidelines) */}
      {background_type === 'unsplash' && background_image && unsplash_photographer_name && (
        <span className="relative z-10 ms-auto text-[10px] leading-tight text-white/70 truncate max-w-[45%] text-end">
          Photo by{' '}
          <a
            href={withUtm(unsplash_photographer_url) || withUtm(unsplash_photo_url)}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            {unsplash_photographer_name}
          </a>
          {' '}on{' '}
          <a
            href={`https://unsplash.com/${UNSPLASH_UTM}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Unsplash
          </a>
        </span>
      )}
    </div>
  )
}
