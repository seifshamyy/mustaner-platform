'use client'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ArrowSquareOut, ArrowsClockwise } from '@phosphor-icons/react'
import { Button } from '@components/ui/button'
import { toast } from 'react-hot-toast'
import { siteOrigin, useSiteApi, type EditorSession, type IntegratedApp } from '@services/integrations/apps'
import { APPS_QUERY_KEY, AppIcon, useErrorText } from './IntegratedApps'

// Pages run inside the dashboard can use the page, forms, pop-ups and downloads,
// but can never navigate the dashboard itself away.
const SANDBOX =
  'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads allow-modals'

// The messages the website editor and the dashboard exchange (see the website's StudioEmbed).
const ASK = 'mustaner:editor-pass-needed'
const GIVE = 'mustaner:editor-pass'

function Bar({ icon, name, children }: { icon: React.ReactNode; name: string; children?: React.ReactNode }) {
  const { t } = useTranslation()
  return (
    <div className="h-14 shrink-0 flex items-center gap-3 px-3 sm:px-4 bg-white border-b border-neutral-200">
      <Link
        href="/dash/apps"
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm font-medium text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
      >
        <ArrowLeft size={16} weight="bold" className="rtl:rotate-180" />
        <span className="hidden sm:inline">{t('dashboard.integrated_apps.all_apps')}</span>
      </Link>
      <span className="w-px h-5 bg-neutral-200" />
      {icon}
      <span className="font-semibold text-neutral-900 truncate min-w-0 flex-1">{name}</span>
      {children}
    </div>
  )
}

function Frame({ src, title }: { src: string; title: string }) {
  return <iframe src={src} title={title} sandbox={SANDBOX} referrerPolicy="strict-origin-when-cross-origin" className="flex-1 w-full border-0 bg-white" />
}

function Message({ text, action }: { text: string; action?: React.ReactNode }) {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="bg-white rounded-xl nice-shadow px-6 py-5 max-w-md text-center space-y-3">
        <p className="text-sm text-neutral-600">{text}</p>
        {action}
      </div>
    </div>
  )
}

const frameShell = 'flex flex-col w-full h-[calc(100dvh-6rem)] lg:h-screen bg-[#f8f8f8]'

/** The website editor, signed in with the Admin's platform sign-in (no password). */
export function WebsiteEditorFrame() {
  const { t } = useTranslation()
  const api = useSiteApi()
  const errorText = useErrorText()
  const frame = useRef<HTMLIFrameElement>(null)
  const [opened, setOpened] = useState<{ src: string; url: string } | null>(null)
  const [error, setError] = useState<unknown>(null)
  const site = siteOrigin()

  const pass = useCallback(() => api<EditorSession>('editor-session', { method: 'POST', body: {} }), [api])

  const open = useCallback(() => {
    setError(null)
    pass()
      .then((s) => setOpened({ src: `${s.url}?embed=lms#pass=${encodeURIComponent(s.session)}`, url: s.url }))
      .catch(setError)
  }, [pass])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetching the pass is the external system here
    open()
  }, [open])

  // The editor asks for a fresh pass when its pass runs out; answer only the editor itself.
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (!site || e.origin !== site || e.source !== frame.current?.contentWindow) return
      if ((e.data as { type?: unknown })?.type !== ASK) return
      pass()
        .then((s) => frame.current?.contentWindow?.postMessage({ type: GIVE, session: s.session }, site))
        .catch(() => {})
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [pass, site])

  // In its own tab the pass signs the editor in with its usual cookie.
  const openInTab = async () => {
    const tab = window.open('about:blank', '_blank')
    try {
      const s = await pass()
      if (tab) {
        tab.opener = null
        tab.location.href = `${s.url}#pass=${encodeURIComponent(s.session)}`
      }
    } catch (err) {
      tab?.close()
      toast.error(errorText(err))
    }
  }

  return (
    <div className={frameShell}>
      <Bar icon={<AppIcon app="editor" size={28} />} name={t('common.website_editor')}>
        <Button variant="outline" size="sm" onClick={openInTab} disabled={!opened}>
          <ArrowSquareOut size={14} weight="bold" />
          <span className="hidden sm:inline">{t('dashboard.integrated_apps.open_new_tab')}</span>
        </Button>
      </Bar>
      {error ? (
        <Message
          text={errorText(error)}
          action={
            <Button variant="outline" size="sm" onClick={open}>
              {t('dashboard.integrated_apps.retry')}
            </Button>
          }
        />
      ) : opened ? (
        <iframe
          ref={frame}
          key={opened.src}
          src={opened.src}
          title={t('common.website_editor')}
          sandbox={SANDBOX}
          referrerPolicy="strict-origin-when-cross-origin"
          className="flex-1 w-full border-0 bg-white"
        />
      ) : (
        <Message text={t('dashboard.integrated_apps.opening')} />
      )}
    </div>
  )
}

/** One of the organization's own apps. */
export function CustomAppFrame({ id }: { id: number }) {
  const { t } = useTranslation()
  const api = useSiteApi()
  const errorText = useErrorText()
  const queryClient = useQueryClient()
  const { data: apps, error, refetch } = useQuery({
    queryKey: APPS_QUERY_KEY,
    queryFn: () => api<IntegratedApp[]>('apps'),
    retry: false,
  })
  const app = apps?.find((a) => a.id === id)

  const recheck = async () => {
    if (!app) return
    const loading = toast.loading(t('dashboard.integrated_apps.checking'))
    try {
      const updated = await api<IntegratedApp>(`apps/${app.id}/check`, { method: 'POST', body: {} })
      toast.success(
        t(updated.frames ? 'dashboard.integrated_apps.now_opens_inside' : 'dashboard.integrated_apps.still_new_tab', { name: updated.name }),
        { id: loading },
      )
      queryClient.invalidateQueries({ queryKey: APPS_QUERY_KEY })
    } catch (err) {
      toast.error(errorText(err), { id: loading })
    }
  }

  if (error || (apps && !app)) {
    return (
      <div className={frameShell}>
        <Bar icon={null} name={t('dashboard.integrated_apps.title')} />
        <Message
          text={error ? errorText(error) : t('dashboard.integrated_apps.not_found')}
          action={
            error ? (
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                {t('dashboard.integrated_apps.retry')}
              </Button>
            ) : undefined
          }
        />
      </div>
    )
  }
  if (!app) {
    return (
      <div className={frameShell}>
        <Bar icon={null} name="" />
        <Message text={t('dashboard.integrated_apps.opening')} />
      </div>
    )
  }

  const newTab = (
    <Button asChild variant="outline" size="sm">
      <a href={app.url} target="_blank" rel="noopener noreferrer">
        <ArrowSquareOut size={14} weight="bold" />
        <span className="hidden sm:inline">{t('dashboard.integrated_apps.open_new_tab')}</span>
      </a>
    </Button>
  )

  return (
    <div className={frameShell}>
      <Bar icon={<AppIcon app={app} size={28} />} name={app.name}>
        <Button variant="ghost" size="sm" onClick={recheck} aria-label={t('dashboard.integrated_apps.check_again')}>
          <ArrowsClockwise size={14} weight="bold" />
          <span className="hidden md:inline">{t('dashboard.integrated_apps.check_again')}</span>
        </Button>
        {newTab}
      </Bar>
      {app.frames ? (
        <Frame key={app.url} src={app.url} title={app.name} />
      ) : (
        <Message text={t('dashboard.integrated_apps.opens_new_tab')} action={newTab} />
      )}
    </div>
  )
}
