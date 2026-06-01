import type { Exercise, Scheme, SchemePerformance } from '@/domain/routine'

function formatObjective<Id extends string, SchemeType extends Scheme[]>({
  exercise,
}: {
  exercise: Exercise<Id, SchemeType>
}) {
  return exercise.schemes.length > 1
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
  return exercise.schemes.length > 1
    ? exercise.schemes.reduce(
        (acc, scheme, index) =>
          `${acc}${index > 0 ? ' + ' : ''}${scheme.sets}×${scheme.repetitions}×${scheme.weight}kg`,
        '',
      )
    : `${exercise.schemes[0].sets}×${exercise.schemes[0].repetitions}×${exercise.schemes[0].weight}kg`
}

export { formatObjective, formatPerformance }
