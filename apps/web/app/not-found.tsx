import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

// The route's language is unknown here, so the page speaks both.
export default function NotFound() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-white px-6 py-16 text-center">
      <img src="/brand/lockup.png" alt="Mustaner — مستنير" className="h-14 w-auto" />
      <img src="/illustrations/not-found.webp" alt="" className="mt-10 h-56 w-auto" />
      <h1 className="mt-8 text-3xl font-extrabold text-neutral-950">This page is not on the grid.</h1>
      <p className="mt-2 text-2xl font-bold text-neutral-800" lang="ar" dir="rtl">
        هذه الصفحة ليست على الشبكة.
      </p>
      <p className="mt-4 max-w-md text-base text-neutral-600">
        The link may be old, or the page has moved.
        <span className="block" lang="ar" dir="rtl">
          ربما الرابط قديم، أو نُقلت الصفحة.
        </span>
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex h-12 items-center gap-2 rounded-[3px] bg-blue-600 px-6 text-base font-semibold text-white transition-colors hover:bg-blue-700"
      >
        Back to home · العودة للرئيسية
        <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
      </Link>
    </main>
  )
}
