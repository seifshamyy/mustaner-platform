/**
 * Mustaner courses in two languages. The platform's own fields hold the
 * English; the Arabic lives beside Mustaner's course facts in the course's
 * `extra_metadata.mustaner.ar` (a free-form field the platform provides for
 * integrations, so no schema change), keyed by the ids of the things it
 * translates:
 *
 *   {
 *     name, description, about,
 *     learnings: { [learning id]: text },
 *     facts:     { audience, delivery, schedule, stack, capstone },
 *     chapters:  { [chapter_uuid]: name },
 *     lessons:   { [activity_uuid]: name },
 *   }
 *
 * The website reads the same shape (site/lib/lms.ts). Anything without an
 * Arabic entry falls back to the English.
 */

export type ArabicFacts = Partial<Record<(typeof TRANSLATABLE_FACTS)[number], string>>

export type CourseArabic = {
  name?: string
  description?: string
  about?: string
  learnings?: Record<string, string>
  facts?: ArabicFacts
  chapters?: Record<string, string>
  lessons?: Record<string, string>
}

/** Course facts that are words (the rest — hours, sessions, ids — read the same in both languages). */
export const TRANSLATABLE_FACTS = ['audience', 'delivery', 'schedule', 'stack', 'capstone'] as const

export type Learning = { id: string; text: string; emoji?: string }

const isRecord = (v: unknown): v is Record<string, unknown> => Boolean(v) && typeof v === 'object' && !Array.isArray(v)
const text = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

function strings(v: unknown): Record<string, string> {
  if (!isRecord(v)) return {}
  const out: Record<string, string> = {}
  for (const [k, value] of Object.entries(v)) if (text(value)) out[k] = text(value)
  return out
}

/** The Arabic copy stored on a course, tidied (empty entries dropped). */
export function readArabic(course: { extra_metadata?: unknown } | null | undefined): CourseArabic {
  const mustaner = isRecord(course?.extra_metadata) ? course!.extra_metadata.mustaner : undefined
  const ar = isRecord(mustaner) ? mustaner.ar : undefined
  if (!isRecord(ar)) return {}
  return {
    name: text(ar.name) || undefined,
    description: text(ar.description) || undefined,
    about: text(ar.about) || undefined,
    learnings: strings(ar.learnings),
    facts: strings(ar.facts) as ArabicFacts,
    chapters: strings(ar.chapters),
    lessons: strings(ar.lessons),
  }
}

/** The course's `extra_metadata` with its Arabic replaced, everything else kept as it was. */
export function withArabic(extraMetadata: unknown, ar: CourseArabic): Record<string, unknown> {
  const base = isRecord(extraMetadata) ? extraMetadata : {}
  const mustaner = isRecord(base.mustaner) ? base.mustaner : {}
  const clean: CourseArabic = {
    ...(text(ar.name) && { name: text(ar.name) }),
    ...(text(ar.description) && { description: text(ar.description) }),
    ...(text(ar.about) && { about: text(ar.about) }),
    learnings: strings(ar.learnings),
    facts: strings(ar.facts) as ArabicFacts,
    chapters: strings(ar.chapters),
    lessons: strings(ar.lessons),
  }
  return { ...base, mustaner: { ...mustaner, ar: clean } }
}

/** The course's learnings, as the platform stores them (a JSON string of {id, text, emoji}). */
export function parseLearnings(raw: unknown): Learning[] {
  let list: unknown = raw
  if (typeof raw === 'string') {
    try {
      list = JSON.parse(raw)
    } catch {
      return raw.trim() ? [{ id: '0', text: raw.trim() }] : []
    }
  }
  if (!Array.isArray(list)) return []
  return list
    .map((item, i): Learning | null => {
      if (typeof item === 'string') return item.trim() ? { id: String(i), text: item.trim() } : null
      if (!isRecord(item) || !text(item.text)) return null
      return { id: text(item.id) || String(i), text: text(item.text), emoji: typeof item.emoji === 'string' ? item.emoji : undefined }
    })
    .filter((l): l is Learning => l !== null)
}

/** Is this interface language Arabic? ("ar", "ar-EG", …) */
export const isArabic = (lang: string | undefined | null) => Boolean(lang && lang.toLowerCase().startsWith('ar'))

/**
 * A course as a learner reads it in `lang`: in Arabic, the Arabic copy where
 * there is one (name, description, about, learnings, chapter and lesson
 * names), English elsewhere. Returns the same object when nothing changes.
 */
export function localizeCourse<T extends Record<string, any>>(course: T, lang: string | undefined | null): T {
  if (!course || !isArabic(lang)) return course
  const ar = readArabic(course)
  const hasAny =
    ar.name || ar.description || ar.about || Object.keys(ar.learnings ?? {}).length || Object.keys(ar.chapters ?? {}).length || Object.keys(ar.lessons ?? {}).length
  if (!hasAny) return course

  const out: Record<string, any> = { ...course }
  if (ar.name) out.name = ar.name
  if (ar.description) out.description = ar.description
  if (ar.about) out.about = ar.about
  if (Object.keys(ar.learnings ?? {}).length && course.learnings) {
    const translated = parseLearnings(course.learnings).map((l) => ({ ...l, text: ar.learnings?.[l.id] ?? l.text }))
    out.learnings = typeof course.learnings === 'string' ? JSON.stringify(translated) : translated
  }
  if (Array.isArray(course.chapters)) {
    out.chapters = course.chapters.map((chapter: any) => ({
      ...chapter,
      name: ar.chapters?.[chapter?.chapter_uuid] ?? chapter?.name,
      activities: Array.isArray(chapter?.activities)
        ? chapter.activities.map((a: any) => ({ ...a, name: ar.lessons?.[a?.activity_uuid] ?? a?.name }))
        : chapter?.activities,
    }))
  }
  return out as T
}

/** One lesson's name in `lang`, given the course it belongs to. */
export function lessonName(course: unknown, activity: { activity_uuid?: string; name?: string } | null | undefined, lang: string | undefined | null): string {
  const name = activity?.name ?? ''
  if (!isArabic(lang) || !activity?.activity_uuid) return name
  return readArabic(course as { extra_metadata?: unknown }).lessons?.[activity.activity_uuid] ?? name
}
