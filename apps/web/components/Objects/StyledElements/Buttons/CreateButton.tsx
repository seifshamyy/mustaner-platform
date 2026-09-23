import { Plus } from '@phosphor-icons/react'

/**
 * The "New course / New podcast / New board…" action, drawn once. Callers keep
 * their own element (a button, or a face inside a link or dialog trigger) and
 * apply `createButtonClass`; `CreateButtonLabel` supplies the content.
 */
export const createButtonClass =
  'group my-auto inline-flex h-9 shrink-0 items-center gap-2.5 rounded-[3px] bg-blue-600 ps-4 pe-2 text-xs font-bold text-white ' +
  'transition-colors duration-150 hover:bg-blue-700 motion-reduce:transition-none ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ' +
  'disabled:cursor-not-allowed disabled:opacity-50'

export function CreateButtonLabel({ label }: { label: string }) {
  return (
    <>
      <span>{label}</span>
      <span
        aria-hidden="true"
        className="grid size-5 place-items-center rounded-[2px] bg-white/15 transition-transform duration-200 group-hover:rotate-90 motion-reduce:transition-none"
      >
        <Plus size={12} weight="bold" />
      </span>
    </>
  )
}
