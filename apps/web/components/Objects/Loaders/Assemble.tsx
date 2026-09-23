import { MONOGRAM, MONOGRAM_BLOCKS, WORDMARK, WORDMARK_BLOCKS, WORDMARK_COLOURS, writingOrder } from './wordmark'

const WORDMARK_ORDER = writingOrder(WORDMARK_BLOCKS)
const MONOGRAM_ORDER = writingOrder(MONOGRAM_BLOCKS)

type Props = {
  /** The whole word, or just «م» where there is no room for it. */
  shape?: 'wordmark' | 'monogram'
  /** Rendered height in px; the width follows the shape. */
  height?: number
  /** Brand colours, or white for use on a coloured button. */
  tone?: 'brand' | 'white'
  label: string
  className?: string
}

/**
 * The loader: «مستنير» writes itself block by block, right to left, then fades
 * and writes again. Held still for people who prefer reduced motion.
 */
export default function Assemble({ shape = 'wordmark', height = 40, tone = 'brand', label, className = '' }: Props) {
  const box = shape === 'wordmark' ? WORDMARK : MONOGRAM
  const blocks = shape === 'wordmark' ? WORDMARK_BLOCKS : MONOGRAM_BLOCKS
  const order = shape === 'wordmark' ? WORDMARK_ORDER : MONOGRAM_ORDER
  // The monogram is the wordmark's right end, which the logo paints blue.
  const fill = (i: number) => (tone === 'white' ? '#fff' : shape === 'wordmark' ? WORDMARK_COLOURS[i] : 'var(--color-blue-600)')

  return (
    <svg
      className={`mst-assemble mst-assemble--${shape} ${className}`.trim()}
      viewBox={`0 0 ${box.width} ${box.height}`}
      height={height}
      width={(height * box.width) / box.height}
      role="img"
      aria-label={label}
    >
      {blocks.map(([x, y, w, h], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} fill={fill(i)} style={{ ['--i' as string]: order[i] }} />
      ))}
    </svg>
  )
}
