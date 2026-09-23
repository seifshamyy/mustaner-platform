import '../styles/globals.css'
import React from 'react'
import Providers from '@components/Providers'
import { Kufam } from 'next/font/google'

// Kufam is the one typeface of the product, in both scripts: it is the face the
// Mustaner identity is set in, and it carries Arabic and Latin in a single
// design, so a mixed Arabic/English screen never switches typefaces mid-line.
// It is a variable font (wght 400-900), so no weight list is needed; light
// weights (font-light, font-extralight) render at 400.
//
// One instance serves both roles: --font-default for every script, and
// --font-arabic, which globals.css forces whenever the UI is Arabic.
const kufam = Kufam({
  subsets: ['arabic', 'latin'],
  display: 'swap',
  variable: '--font-default',
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // `dir` is deliberately absent from the <html> below. React only reconciles
  // attributes present in its virtual tree, so leaving it out means React never
  // clobbers what dir-init.js wrote before paint. `lang="en"` stays as the
  // no-JS baseline for crawlers; the script overwrites it for everyone else.
  return (
    <html
      className={kufam.variable}
      lang="en"
      suppressHydrationWarning
    >
      <head>
        {/* Synchronous script — sets <html lang/dir> before body paints so an
            RTL locale never flashes an LTR layout. Must run first. */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="/dir-init.js" />
        {/* Synchronous script — blocks parsing to guarantee window.__RUNTIME_CONFIG__ exists before any JS runs.
            Next.js <Script strategy="beforeInteractive"> is not truly blocking in all browsers (Safari). */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="/runtime-config.js" />
        {/* Prevent white flash on embed routes: set html+body bg before body is painted.
            Reads the optional ?bgcolor param (hex-validated) or defaults to dark. */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="/embed-bg.js" />
      </head>
      <body suppressHydrationWarning>
        <Providers>
          <main className="animate-fade-in">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}
