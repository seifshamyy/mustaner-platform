// Square-Kufic wordmark «مستنير», traced from the official logo into its 25
// blocks: [x, y, width, height] in a 536×125 box.
export const WORDMARK = { width: 536, height: 125 } as const

type Block = readonly [number, number, number, number]

export const WORDMARK_BLOCKS: ReadonlyArray<Block> = [
  [233, 1, 18, 17], [269, 0, 267, 19], [0, 1, 214, 18], [159, 36, 18, 17], [233, 36, 18, 18],
  [36, 36, 53, 18], [447, 36, 71, 18], [125, 36, 18, 36], [197, 36, 18, 36], [322, 36, 17, 36],
  [357, 36, 18, 36], [482, 54, 18, 18], [71, 54, 18, 18], [447, 54, 17, 18], [393, 36, 18, 36],
  [268, 36, 18, 36], [0, 19, 21, 70], [71, 72, 340, 17], [429, 72, 71, 17], [518, 73, 18, 33],
  [36, 54, 18, 53], [144, 106, 392, 19], [0, 107, 54, 18], [72, 108, 17, 17], [107, 108, 18, 17],
]

// The monogram: the wordmark's right end, «م» inside its frame.
const MONOGRAM_X = 420
export const MONOGRAM = { width: WORDMARK.width - MONOGRAM_X, height: WORDMARK.height } as const
export const MONOGRAM_BLOCKS: ReadonlyArray<Block> = WORDMARK_BLOCKS.filter(([x, , w]) => x + w > MONOGRAM_X).map(
  ([x, y, w, h]) => [Math.max(x, MONOGRAM_X) - MONOGRAM_X, y, x + w - Math.max(x, MONOGRAM_X), h] as const,
)

/**
 * Each block's rank when the word is written: rightmost edge first, because
 * «مستنير» is written right to left; blocks sharing an edge go top to bottom.
 */
export function writingOrder(blocks: ReadonlyArray<Block>): number[] {
  return blocks
    .map((b, index) => ({ index, right: b[0] + b[2], top: b[1] }))
    .sort((a, b) => b.right - a.right || a.top - b.top)
    .reduce<number[]>((ranks, item, rank) => {
      ranks[item.index] = rank
      return ranks
    }, [])
}

const GREEN = [0, 122, 87]
const TEAL = [0, 105, 126]
const BLUE = [0, 85, 172]

const rgb = (c: number[]) => `rgb(${c.join(',')})`
const mix = (a: number[], b: number[], t: number) => rgb(a.map((v, i) => Math.round(v + (b[i] - v) * t)))

/** Where a point falls on the logo's ramp: green, then teal, then blue, left to right. */
function rampAt(t: number): string {
  if (t <= 0.3) return rgb(GREEN)
  if (t <= 0.52) return mix(GREEN, TEAL, (t - 0.3) / 0.22)
  if (t <= 0.74) return mix(TEAL, BLUE, (t - 0.52) / 0.22)
  return rgb(BLUE)
}

/** Each wordmark block in the colour the logo gives its centre. */
export const WORDMARK_COLOURS = WORDMARK_BLOCKS.map(([x, , w]) => rampAt((x + w / 2) / WORDMARK.width))
