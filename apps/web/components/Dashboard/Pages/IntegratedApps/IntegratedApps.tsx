'use client'
import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  ArrowSquareOut,
  ArrowsClockwise,
  CaretDown,
  CaretUp,
  CheckCircle,
  DotsThree,
  PencilSimple,
  Plus,
  SquaresFour,
  Trash,
  WarningCircle,
} from '@phosphor-icons/react'
import { Breadcrumbs } from '@components/Objects/Breadcrumbs/Breadcrumbs'
import { Button } from '@components/ui/button'
import { Input } from '@components/ui/input'
import { Label } from '@components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { SiteError, useSiteApi, type AppCheck, type IntegratedApp } from '@services/integrations/apps'

export const APPS_QUERY_KEY = ['mustaner', 'integrated-apps'] as const

const host = (url: string) => {
  try {
    return new URL(url).host
  } catch {
    return url
  }
}

/** An app's picture: its own icon, or its first letter. */
export function AppIcon({ app, size = 40 }: { app: { name: string; icon: string | null } | 'editor'; size?: number }) {
  const box = { width: size, height: size }
  if (app === 'editor') {
    return <img src="/brand/mark.png" alt="" style={box} className="rounded-[3px] shrink-0 object-contain" />
  }
  if (app.icon) {
    return (
      <span style={box} className="shrink-0 rounded-md bg-white ring-1 ring-neutral-200 flex items-center justify-center overflow-hidden">
        <img src={app.icon} alt="" className="w-[70%] h-[70%] object-contain" />
      </span>
    )
  }
  return (
    <span style={box} className="shrink-0 rounded-md bg-neutral-100 text-neutral-600 font-semibold flex items-center justify-center uppercase">
      {app.name.trim().charAt(0) || '·'}
    </span>
  )
}

export function useErrorText() {
  const { t } = useTranslation()
  return (err: unknown) => {
    const code = err instanceof SiteError ? err.code : 'failed'
    const known = ['site_unavailable', 'not_configured', 'https_only', 'bad_url', 'not_found']
    const key = known.includes(code) ? code : code === 'platform_unavailable' || code === 'storage_unavailable' ? 'site_unavailable' : 'failed'
    return t(`dashboard.integrated_apps.${key}`)
  }
}

/** Open an app: inside the dashboard when it allows it, otherwise in a new tab. */
export function appHref(app: IntegratedApp) {
  return `/dash/apps/${app.id}`
}

export default function IntegratedApps() {
  const { t } = useTranslation()
  const api = useSiteApi()
  const queryClient = useQueryClient()
  const errorText = useErrorText()
  const [editing, setEditing] = useState<IntegratedApp | 'new' | null>(null)
  const [removing, setRemoving] = useState<IntegratedApp | null>(null)

  const { data: apps, isLoading, error, refetch } = useQuery({
    queryKey: APPS_QUERY_KEY,
    queryFn: () => api<IntegratedApp[]>('apps'),
    retry: false,
  })
  const refresh = () => queryClient.invalidateQueries({ queryKey: APPS_QUERY_KEY })

  const move = async (index: number, by: -1 | 1) => {
    if (!apps) return
    const order = apps.map((a) => a.id)
    ;[order[index], order[index + by]] = [order[index + by], order[index]]
    queryClient.setQueryData(APPS_QUERY_KEY, order.map((id) => apps.find((a) => a.id === id)!))
    try {
      await api('apps/order', { method: 'PUT', body: { ids: order } })
    } catch (err) {
      toast.error(errorText(err))
    }
    refresh()
  }

  const recheck = async (app: IntegratedApp) => {
    const loading = toast.loading(t('dashboard.integrated_apps.checking'))
    try {
      const updated = await api<IntegratedApp>(`apps/${app.id}/check`, { method: 'POST', body: {} })
      toast.success(
        t(updated.frames ? 'dashboard.integrated_apps.now_opens_inside' : 'dashboard.integrated_apps.still_new_tab', { name: updated.name }),
        { id: loading },
      )
      refresh()
    } catch (err) {
      toast.error(errorText(err), { id: loading })
    }
  }

  const remove = async (app: IntegratedApp) => {
    try {
      await api(`apps/${app.id}`, { method: 'DELETE' })
      toast.success(t('dashboard.integrated_apps.removed', { name: app.name }))
      setRemoving(null)
      refresh()
    } catch (err) {
      toast.error(errorText(err))
    }
  }

  return (
    <div className="h-full w-full bg-[#f8f8f8] flex flex-col">
      <div className="ps-4 pe-4 sm:ps-10 sm:pe-10 tracking-tight bg-[#fcfbfc] z-10 nice-shadow flex-shrink-0 relative">
        <div className="pt-6 pb-4">
          <Breadcrumbs items={[{ label: t('dashboard.integrated_apps.title'), href: '/dash/apps', icon: <SquaresFour size={14} /> }]} />
        </div>
        <div className="my-2 py-2 pb-6 flex items-end justify-between gap-4">
          <div className="flex flex-col space-y-1 min-w-0">
            <div className="pt-3 flex font-bold text-3xl sm:text-4xl tracking-tighter truncate">{t('dashboard.integrated_apps.title')}</div>
            <div className="flex font-medium text-gray-400 text-md">{t('dashboard.integrated_apps.subtitle')}</div>
          </div>
          <Button onClick={() => setEditing('new')} className="bg-black text-white hover:bg-black/90 shrink-0">
            <Plus size={16} weight="bold" />
            {t('dashboard.integrated_apps.add_app')}
          </Button>
        </div>
      </div>
      <div className="h-6 flex-shrink-0" />

      <div className="sm:mx-10 mx-0 mb-10 bg-white rounded-xl nice-shadow p-3 sm:p-4">
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {/* The website editor is always first: it is part of the platform. */}
          <Link
            href="/dash/apps/website"
            className="group flex items-center gap-3 rounded-lg border border-neutral-100 p-3 hover:border-neutral-200 hover:bg-neutral-50 transition-colors"
          >
            <AppIcon app="editor" />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="font-semibold text-neutral-900 truncate">{t('common.website_editor')}</span>
                <span className="text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 shrink-0">
                  {t('dashboard.integrated_apps.built_in')}
                </span>
              </span>
              <span className="block text-sm text-neutral-500 truncate">{t('dashboard.integrated_apps.website_editor_description')}</span>
            </span>
          </Link>

          {isLoading &&
            [0, 1].map((i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border border-neutral-100 p-3 animate-pulse">
                <div className="w-10 h-10 rounded-md bg-neutral-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-28 rounded bg-neutral-100" />
                  <div className="h-3 w-40 rounded bg-neutral-100" />
                </div>
              </div>
            ))}

          {apps?.map((app, i) => (
            <div
              key={app.id}
              className="group relative flex items-center gap-3 rounded-lg border border-neutral-100 p-3 hover:border-neutral-200 hover:bg-neutral-50 transition-colors"
            >
              {app.frames ? (
                <Link href={appHref(app)} className="absolute inset-0 rounded-lg" aria-label={app.name} />
              ) : (
                <a href={app.url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 rounded-lg" aria-label={app.name} />
              )}
              <AppIcon app={app} />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="font-semibold text-neutral-900 truncate">{app.name}</span>
                  {!app.frames && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-500 shrink-0">
                      <ArrowSquareOut size={10} weight="bold" />
                      {t('dashboard.integrated_apps.new_tab_badge')}
                    </span>
                  )}
                </span>
                <span className="block text-sm text-neutral-500 truncate" dir="ltr">
                  {host(app.url)}
                </span>
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label={t('dashboard.integrated_apps.edit')}
                    className="relative z-10 p-1.5 rounded-md text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                  >
                    <DotsThree size={20} weight="bold" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onSelect={() => setEditing(app)}>
                    <PencilSimple size={16} weight="fill" />
                    {t('dashboard.integrated_apps.edit')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => recheck(app)}>
                    <ArrowsClockwise size={16} weight="bold" />
                    {t('dashboard.integrated_apps.check_again')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => window.open(app.url, '_blank', 'noopener,noreferrer')}>
                    <ArrowSquareOut size={16} weight="bold" />
                    {t('dashboard.integrated_apps.open_new_tab')}
                  </DropdownMenuItem>
                  {(i > 0 || i < apps.length - 1) && <DropdownMenuSeparator />}
                  {i > 0 && (
                    <DropdownMenuItem onSelect={() => move(i, -1)}>
                      <CaretUp size={16} weight="bold" />
                      {t('dashboard.integrated_apps.move_up')}
                    </DropdownMenuItem>
                  )}
                  {i < apps.length - 1 && (
                    <DropdownMenuItem onSelect={() => move(i, 1)}>
                      <CaretDown size={16} weight="bold" />
                      {t('dashboard.integrated_apps.move_down')}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => setRemoving(app)} className="text-red-600 focus:text-red-700">
                    <Trash size={16} weight="fill" />
                    {t('dashboard.integrated_apps.remove')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>

        {error ? (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
            <span>{errorText(error)}</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              {t('dashboard.integrated_apps.retry')}
            </Button>
          </div>
        ) : apps && apps.length === 0 ? (
          <p className="mt-3 rounded-lg bg-neutral-50 px-4 py-3 text-sm text-neutral-500">{t('dashboard.integrated_apps.empty')}</p>
        ) : null}
      </div>

      <AppDialog editing={editing} onClose={() => setEditing(null)} onSaved={refresh} />

      <Dialog open={removing !== null} onOpenChange={(open) => !open && setRemoving(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>{t('dashboard.integrated_apps.remove_title', { name: removing?.name ?? '' })}</DialogTitle>
            <DialogDescription>{t('dashboard.integrated_apps.remove_description')}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="px-6 pb-6">
            <Button variant="outline" onClick={() => setRemoving(null)}>
              {t('dashboard.integrated_apps.cancel')}
            </Button>
            <Button variant="destructive" onClick={() => removing && remove(removing)}>
              {t('dashboard.integrated_apps.remove')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/** Add or edit an app. The address is checked as soon as it is pasted or typed. */
function AppDialog({ editing, onClose, onSaved }: { editing: IntegratedApp | 'new' | null; onClose: () => void; onSaved: () => void }) {
  const { t } = useTranslation()
  const api = useSiteApi()
  const router = useRouter()
  const errorText = useErrorText()
  const [url, setUrl] = useState('')
  const [name, setName] = useState('')
  const [check, setCheck] = useState<AppCheck | null>(null)
  const [checking, setChecking] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const latest = useRef('')

  const existing = editing && editing !== 'new' ? editing : null

  useEffect(() => {
    if (!editing) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUrl(existing?.url ?? '')
    setName(existing?.name ?? '')
    setCheck(null)
    setProblem(null)
    setSaving(false)
    latest.current = existing?.url ?? ''
  }, [editing, existing])

  const runCheck = async (value: string) => {
    const trimmed = value.trim()
    latest.current = trimmed
    setProblem(null)
    setCheck(null)
    if (!trimmed || (existing && trimmed === existing.url)) return
    setChecking(true)
    try {
      const result = await api<AppCheck>('apps/check', { method: 'POST', body: { url: trimmed } })
      if (latest.current === trimmed) setCheck(result)
    } catch (err) {
      if (latest.current === trimmed) setProblem(errorText(err))
    } finally {
      if (latest.current === trimmed) setChecking(false)
    }
  }

  // Check shortly after typing stops.
  useEffect(() => {
    if (!editing) return
    const timer = setTimeout(() => {
      if (url.trim() !== latest.current) runCheck(url)
    }, 700)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, editing])

  const save = async () => {
    setSaving(true)
    try {
      let saved: IntegratedApp
      if (existing) {
        const body: { name?: string; url?: string } = {}
        if (name.trim() && name.trim() !== existing.name) body.name = name.trim()
        if (url.trim() && url.trim() !== existing.url) body.url = url.trim()
        saved = Object.keys(body).length ? await api<IntegratedApp>(`apps/${existing.id}`, { method: 'PUT', body }) : existing
        toast.success(t('dashboard.integrated_apps.saved'))
      } else {
        saved = await api<IntegratedApp>('apps', { method: 'POST', body: { name: name.trim(), url: url.trim() } })
        toast.success(t('dashboard.integrated_apps.added', { name: saved.name }))
      }
      onSaved()
      onClose()
      if (!existing && saved.frames) router.push(appHref(saved))
    } catch (err) {
      setProblem(errorText(err))
      setSaving(false)
    }
  }

  const canSave = !saving && !checking && url.trim() !== '' && !problem && (existing ? true : check !== null)

  return (
    <Dialog open={editing !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>{t(existing ? 'dashboard.integrated_apps.edit_title' : 'dashboard.integrated_apps.add_title')}</DialogTitle>
          <DialogDescription>{t('dashboard.integrated_apps.add_description')}</DialogDescription>
        </DialogHeader>
        <form
          className="px-6 pb-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (canSave) save()
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="app-url">{t('dashboard.integrated_apps.url_label')}</Label>
            <Input
              id="app-url"
              dir="ltr"
              inputMode="url"
              autoComplete="off"
              placeholder="https://"
              value={url}
              autoFocus
              onChange={(e) => setUrl(e.target.value)}
              onPaste={(e) => {
                const pasted = e.clipboardData.getData('text')
                if (pasted) {
                  e.preventDefault()
                  setUrl(pasted.trim())
                  runCheck(pasted)
                }
              }}
              onBlur={() => url.trim() !== latest.current && runCheck(url)}
            />
            <CheckLine checking={checking} check={check} problem={problem} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="app-name">{t('dashboard.integrated_apps.name_label')}</Label>
            <Input
              id="app-name"
              value={name}
              maxLength={60}
              placeholder={check?.title || t('dashboard.integrated_apps.name_placeholder')}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t('dashboard.integrated_apps.cancel')}
            </Button>
            <Button type="submit" disabled={!canSave} className="bg-black text-white hover:bg-black/90">
              {t(existing ? 'dashboard.integrated_apps.save' : 'dashboard.integrated_apps.add')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function CheckLine({ checking, check, problem }: { checking: boolean; check: AppCheck | null; problem: string | null }) {
  const { t } = useTranslation()
  if (checking) {
    return (
      <p className="flex items-center gap-2 text-sm text-neutral-500">
        <ArrowsClockwise size={14} weight="bold" className="animate-spin" />
        {t('dashboard.integrated_apps.checking')}
      </p>
    )
  }
  if (problem) {
    return (
      <p className="flex items-center gap-2 text-sm text-red-600" role="alert">
        <WarningCircle size={16} weight="fill" />
        {problem}
      </p>
    )
  }
  if (!check) return null
  const inside = check.status === 'frames'
  return (
    <p className={cn('flex items-start gap-2 text-sm', inside ? 'text-green-700' : 'text-amber-700')} role="status">
      {check.icon ? (
        <img src={check.icon} alt="" className="w-4 h-4 mt-0.5 object-contain shrink-0" />
      ) : inside ? (
        <CheckCircle size={16} weight="fill" className="mt-0.5 shrink-0" />
      ) : (
        <ArrowSquareOut size={16} weight="bold" className="mt-0.5 shrink-0" />
      )}
      <span>
        {t(
          inside
            ? 'dashboard.integrated_apps.opens_inside'
            : check.status === 'unreachable'
              ? 'dashboard.integrated_apps.unreachable'
              : 'dashboard.integrated_apps.opens_new_tab',
        )}
      </span>
    </p>
  )
}
