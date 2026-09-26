'use client'
import React, { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Sparkle, FloppyDisk } from '@phosphor-icons/react'
import { useCourse, useCourseDispatch } from '@components/Contexts/CourseContext'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import useAdminStatus from '@components/Hooks/useAdminStatus'
import { Button } from '@components/ui/button'
import { Input } from '@components/ui/input'
import { Textarea } from '@components/ui/textarea'
import { updateCourse } from '@services/courses/courses'
import { SiteError, useSiteApi } from '@services/integrations/apps'
import {
  TRANSLATABLE_FACTS,
  parseLearnings,
  readArabic,
  withArabic,
  type CourseArabic,
} from '@services/mustaner/bilingual'
import { queryKeys } from '@/lib/query/keys'
import { cn } from '@/lib/utils'

/** One row: the English as reference, the Arabic to edit. */
type Row = { key: string; label: string; english: string; long?: boolean }
type Group = { title: string; rows: Row[]; nested?: boolean }

// The AI is asked for at most this many strings at a time.
const BATCH = 60

/** "chapters.chapter_x" → ["chapters", "chapter_x"]; "name" → ["name", ""]. */
const split = (key: string): [string, string] => {
  const dot = key.indexOf('.')
  return dot < 0 ? [key, ''] : [key.slice(0, dot), key.slice(dot + 1)]
}

const get = (ar: CourseArabic, key: string): string => {
  const [head, id] = split(key)
  if (!id) return ((ar as Record<string, unknown>)[head] as string) ?? ''
  return ((ar as Record<string, Record<string, string> | undefined>)[head]?.[id]) ?? ''
}

const set = (ar: CourseArabic, key: string, value: string): CourseArabic => {
  const [head, id] = split(key)
  if (!id) return { ...ar, [head]: value }
  const bucket = { ...((ar as Record<string, Record<string, string> | undefined>)[head] ?? {}) }
  bucket[id] = value
  return { ...ar, [head]: bucket }
}

/**
 * The course in Arabic: what learners see when the platform is in Arabic and
 * what the website shows on /ar. Each English field sits beside its Arabic;
 * empty Arabic falls back to English. The AI can fill every empty field in one
 * go, for review before saving.
 */
export default function EditCourseArabic() {
  const { t } = useTranslation()
  const course = useCourse() as any
  const dispatch = useCourseDispatch()
  const session = useLHSession() as any
  const queryClient = useQueryClient()
  const api = useSiteApi()
  const { canManageOrg } = useAdminStatus()
  const structure = course.courseStructure

  const saved = useMemo(() => readArabic(structure), [structure])
  const [ar, setAr] = useState<CourseArabic>(saved)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [translating, setTranslating] = useState(false)

  // Take the stored Arabic once the course has loaded (and after each save), unless there are edits.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!dirty) setAr(saved)
  }, [saved, dirty])

  const groups: Group[] = useMemo(() => {
    if (!structure?.course_uuid) return []
    const facts = (structure.extra_metadata?.mustaner ?? {}) as Record<string, unknown>
    const L = (k: string, d: string) => t(`dashboard.courses.arabic.${k}`, { defaultValue: d })
    const out: Group[] = [
      {
        title: L('course', 'Course'),
        rows: [
          { key: 'name', label: L('name', 'Name'), english: structure.name ?? '' },
          { key: 'description', label: L('description', 'Description'), english: structure.description ?? '' },
          { key: 'about', label: L('about', 'About'), english: structure.about ?? '', long: true },
        ],
      },
    ]
    const learnings = parseLearnings(structure.learnings)
    if (learnings.length) {
      out.push({
        title: L('learnings', "What you'll learn"),
        rows: learnings.map((l, i) => ({ key: `learnings.${l.id}`, label: `${i + 1}`, english: l.text })),
      })
    }
    const factRows = TRANSLATABLE_FACTS.filter((k) => typeof facts[k] === 'string' && (facts[k] as string).trim()).map((k) => ({
      key: `facts.${k}`,
      label: L(`fact_${k}`, k),
      english: facts[k] as string,
      long: k === 'capstone',
    }))
    if (factRows.length) out.push({ title: L('details', 'Program details'), rows: factRows })
    for (const [i, chapter] of (structure.chapters ?? []).entries()) {
      out.push({
        title: `${L('chapter', 'Chapter')} ${i + 1}`,
        nested: true,
        rows: [
          { key: `chapters.${chapter.chapter_uuid}`, label: L('chapter_name', 'Chapter name'), english: chapter.name ?? '' },
          ...(chapter.activities ?? []).map((a: any, j: number) => ({
            key: `lessons.${a.activity_uuid}`,
            label: `${L('lesson', 'Lesson')} ${j + 1}`,
            english: a.name ?? '',
          })),
        ],
      })
    }
    return out
  }, [structure, t])

  const rows = groups.flatMap((g) => g.rows).filter((r) => r.english.trim())
  const done = rows.filter((r) => get(ar, r.key).trim()).length

  const edit = (key: string, value: string) => {
    setAr((prev) => set(prev, key, value))
    setDirty(true)
  }

  const save = async () => {
    setSaving(true)
    const extra = withArabic(structure.extra_metadata, ar)
    try {
      const res: any = await updateCourse(structure.course_uuid, { extra_metadata: extra }, session?.data?.tokens?.access_token)
      if (res && res.success === false) throw new Error(res.HTTPmessage || 'failed')
      // Keep the editor's copy in step, so a later save from another tab carries the Arabic too.
      dispatch({ type: 'setCourseStructure', payload: { ...structure, extra_metadata: extra } })
      const clean = String(structure.course_uuid).replace('course_', '')
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.meta(clean) })
      queryClient.invalidateQueries({ queryKey: ['course', clean, 'meta', 'withUnpublished'] })
      setDirty(false)
      toast.success(t('dashboard.courses.arabic.saved', { defaultValue: 'Arabic version saved' }))
    } catch {
      toast.error(t('dashboard.courses.arabic.save_failed', { defaultValue: 'Could not save. Try again.' }))
    } finally {
      setSaving(false)
    }
  }

  const translate = async () => {
    const missing = rows.filter((r) => !get(ar, r.key).trim())
    if (!missing.length) return
    setTranslating(true)
    const loading = toast.loading(t('dashboard.courses.arabic.translating', { defaultValue: 'Translating…' }))
    let filled = 0
    try {
      for (let i = 0; i < missing.length; i += BATCH) {
        const items = Object.fromEntries(missing.slice(i, i + BATCH).map((r) => [r.key, r.english]))
        const { translations } = await api<{ translations: Record<string, string> }>('translate', { method: 'POST', body: { items } })
        setAr((prev) => {
          let next = prev
          // Fill only what is still empty: anything typed meanwhile wins.
          for (const [key, value] of Object.entries(translations)) if (!get(next, key).trim()) next = set(next, key, value)
          return next
        })
        filled += Object.keys(translations).length
      }
      setDirty(true)
      toast.success(t('dashboard.courses.arabic.translated', { defaultValue: '{{count}} fields translated. Review, then save.', count: filled }), { id: loading })
    } catch (err) {
      const code = err instanceof SiteError ? err.code : 'failed'
      const message =
        code === 'not_configured'
          ? t('dashboard.courses.arabic.ai_not_configured', { defaultValue: 'AI translation is not set up yet.' })
          : code === 'rate_limited'
            ? t('dashboard.courses.arabic.ai_rate_limited', { defaultValue: 'Too many translations in a row. Wait a few minutes.' })
            : t('dashboard.courses.arabic.ai_failed', { defaultValue: 'The translation did not come through. Try again.' })
      if (filled) setDirty(true)
      toast.error(message, { id: loading })
    } finally {
      setTranslating(false)
    }
  }

  if (!structure?.course_uuid || course.isLoading) {
    return (
      <div className="px-4 sm:px-10 py-6">
        <div className="bg-white rounded-xl shadow-xs p-6 animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-48" />
          <div className="h-10 bg-gray-100 rounded-lg w-full" />
          <div className="h-10 bg-gray-100 rounded-lg w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="h-full">
      <div className="h-6" />
      <div className="px-4 sm:px-10 pb-10">
        <div className="bg-white rounded-xl shadow-xs">
          <div className="sticky top-0 z-10 flex flex-wrap items-center gap-3 justify-between px-6 py-4 bg-white/95 backdrop-blur border-b border-gray-100 rounded-t-xl">
            <div className="min-w-0">
              <h2 className="font-bold text-lg text-gray-900">{t('dashboard.courses.arabic.title', { defaultValue: 'Arabic version' })}</h2>
              <p className="text-sm text-gray-500">
                {t('dashboard.courses.arabic.subtitle', {
                  defaultValue: 'Shown when the platform is in Arabic and on the website in Arabic. Empty fields show the English.',
                })}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-medium text-gray-500 tabular-nums me-1">
                {t('dashboard.courses.arabic.progress', { defaultValue: '{{done}} of {{total}} translated', done, total: rows.length })}
              </span>
              {canManageOrg && (
                <Button variant="outline" size="sm" onClick={translate} disabled={translating || saving || done === rows.length}>
                  <Sparkle size={14} weight="fill" />
                  {t('dashboard.courses.arabic.translate', { defaultValue: 'Translate empty fields with AI' })}
                </Button>
              )}
              <Button size="sm" onClick={save} disabled={!dirty || saving || translating} className="bg-black text-white hover:bg-black/90">
                <FloppyDisk size={14} weight="fill" />
                {saving ? t('dashboard.courses.arabic.saving', { defaultValue: 'Saving…' }) : t('dashboard.courses.arabic.save', { defaultValue: 'Save' })}
              </Button>
            </div>
          </div>

          <div className="p-6 space-y-8">
            {groups.map((group) => (
              <section key={group.title} className={cn('space-y-3', group.nested && 'rounded-lg border border-gray-100 p-4')}>
                <h3 className="text-sm font-semibold text-gray-800">{group.title}</h3>
                <div className="hidden md:grid grid-cols-2 gap-4 text-[11px] font-medium uppercase tracking-wider text-gray-400">
                  <span>English</span>
                  <span className="text-end" dir="rtl" lang="ar">العربية</span>
                </div>
                {group.rows.map((row) => {
                  const value = get(ar, row.key)
                  const id = `ar-${row.key}`
                  return (
                    <div key={row.key} className="grid md:grid-cols-2 gap-2 md:gap-4 items-start">
                      <div className="min-w-0">
                        <label htmlFor={id} className="block text-xs font-medium text-gray-500 mb-1">
                          {row.label}
                        </label>
                        <p dir="ltr" className={cn('text-sm text-gray-700 bg-gray-50 rounded-md px-3 py-2 break-words', row.long && 'whitespace-pre-line')}>
                          {row.english || '—'}
                        </p>
                      </div>
                      <div className="md:pt-5">
                        {row.long ? (
                          <Textarea
                            id={id}
                            dir="rtl"
                            lang="ar"
                            value={value}
                            placeholder={row.english}
                            onChange={(e) => edit(row.key, e.target.value)}
                            className="min-h-[120px] bg-white"
                            disabled={!row.english.trim()}
                          />
                        ) : (
                          <Input
                            id={id}
                            dir="rtl"
                            lang="ar"
                            value={value}
                            placeholder={row.english}
                            onChange={(e) => edit(row.key, e.target.value)}
                            className="bg-white"
                            disabled={!row.english.trim()}
                          />
                        )}
                      </div>
                    </div>
                  )
                })}
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
