import React from 'react'

/**
 * Full-page message for a surface this deployment does not include (the
 * Enterprise-only superadmin console).
 *
 * Kept separate from EELicenseError, which is an inline banner for a failing
 * licence check and names environment variables and pod logs — operator
 * debugging detail that does not belong on a page any anonymous visitor to an
 * OSS deployment can load.
 */
export default function EERequiredScreen() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-white px-6">
      <div className="text-center max-w-md">
        <img src="/illustrations/not-found.webp" alt="" className="mx-auto mb-6 h-56 w-auto" />
        <h1 className="text-2xl font-bold text-neutral-950 mb-2">This page isn&apos;t available.</h1>
        <p className="text-neutral-600 text-sm leading-relaxed">
          It is not part of this platform.
        </p>
      </div>
    </div>
  )
}
