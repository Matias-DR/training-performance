import type { Exercise, Scheme, SchemePerformance } from '@/domain/routine'

function formatObjective<Id extends string, SchemeType extends Scheme[]>({
  exercise,
}: {
  exercise: Exercise<Id, SchemeType>
}) {
  if (exercise.schemes.length === 0) return '—'

  return exercise.schemes.length !== 1
    ? exercise.schemes.reduce(
        (acc, scheme, index) =>
          `${acc}${index > 0 ? ' + ' : ''}${scheme.sets}×${scheme.repetitions}`,
        '',
      )
    : `${exercise.schemes[0].sets}×${exercise.schemes[0].repetitions}`
}

function formatPerformance<
  Id extends string,
  SchemeType extends SchemePerformance[],
>({ exercise }: { exercise: Exercise<Id, SchemeType> }) {
  if (exercise.schemes.length === 0) return '—'

  return exercise.schemes.length !== 1
    ? exercise.schemes.reduce(
        (acc, scheme, index) =>
          `${acc}${index > 0 ? ' + ' : ''}${scheme.sets}×${scheme.repetitions}×${scheme.weight}kg`,
        '',
      )
    : `${exercise.schemes[0].sets}×${exercise.schemes[0].repetitions}×${exercise.schemes[0].weight}kg`
}

// Hoisted outside function to avoid recreation on every call (js-hoist-regexp).
// Anchored to the youtube.com/watch path so non-YouTube urls carrying a `v=`
// query param (e.g. vimeo.com/page?v=...) fall through to the null fallback.
const YOUTUBE_WATCH_RE = /youtube\.com\/watch\?(?:[^#]*&)?v=([a-zA-Z0-9_-]{11})/
const YOUTUBE_SHORT_RE = /youtu\.be\/([a-zA-Z0-9_-]{11})/
const YOUTUBE_EMBED_RE =
  /youtube(?:-nocookie)?\.com\/(?:embed|shorts)\/([a-zA-Z0-9_-]{11})/

function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null

  try {
    let match: RegExpMatchArray | null

    match = url.match(YOUTUBE_SHORT_RE)
    if (match) return `https://www.youtube-nocookie.com/embed/${match[1]}`

    match = url.match(YOUTUBE_EMBED_RE)
    if (match) return `https://www.youtube-nocookie.com/embed/${match[1]}`

    match = url.match(YOUTUBE_WATCH_RE)
    if (match) return `https://www.youtube-nocookie.com/embed/${match[1]}`

    return null
  } catch {
    return null
  }
}

export { formatObjective, formatPerformance, getYouTubeEmbedUrl }
