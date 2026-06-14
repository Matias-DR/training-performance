/**
 * Pure performance-metrics helpers (no DB / IO).
 *
 * e1RM formula: Epley — weight * (1 + reps / 30)
 * Accuracy degrades above ~12 reps; acceptable for strength rep ranges.
 */

// ---------------------------------------------------------------------------
// Raw input shapes (match the DB document structure)
// ---------------------------------------------------------------------------

export type RawScheme = {
  sets: number
  repetitions: number
  weight?: number
}

export type RawExercise = {
  /** exerciseId for the top-level group or the nested exercise */
  exercise?: string
  schemes: RawScheme[]
}

export type RawSessionDay = {
  performed?: Record<string, RawExercise[]>
}

export type RawAssignment = {
  routineId?: string
  startDate?: unknown
  endDate?: unknown
  active?: boolean
  systemId?: string
  sessions?: Record<string, Record<string, RawSessionDay>>
}

export type SystemDistributionEntry = {
  week: number
  load: number
}

// ---------------------------------------------------------------------------
// Output shapes
// ---------------------------------------------------------------------------

export type WeekDataPoint = {
  week: number
  performance: number
  planned?: number
}

export type RoutineChartData = {
  key: string
  routineName: string
  active: boolean
  startDate?: string
  weeks: WeekDataPoint[]
}

// ---------------------------------------------------------------------------
// e1RM — Epley formula
// ---------------------------------------------------------------------------

export function calcE1RM(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0
  return weight * (1 + reps / 30)
}

// ---------------------------------------------------------------------------
// Historical best e1RM per exerciseId across ALL assignments
// ---------------------------------------------------------------------------

/**
 * Scans all assignments' performed sessions to compute the all-time best
 * e1RM for every exercise encountered, keyed by exerciseId.
 */
export function computeHistoricalBestE1RM(
  allAssignments: RawAssignment[],
): Map<string, number> {
  const best = new Map<string, number>()

  for (const assignment of allAssignments) {
    for (const week of Object.values(assignment.sessions ?? {})) {
      for (const day of Object.values(week)) {
        for (const [groupId, exercises] of Object.entries(
          day.performed ?? {},
        )) {
          for (const exercise of exercises) {
            const exerciseId = exercise.exercise ?? groupId

            for (const scheme of exercise.schemes) {
              if (!scheme.weight || scheme.weight <= 0) continue

              const e1rm = calcE1RM(scheme.weight, scheme.repetitions)
              const current = best.get(exerciseId) ?? 0

              if (e1rm > current) {
                best.set(exerciseId, e1rm)
              }
            }
          }
        }
      }
    }
  }

  return best
}

// ---------------------------------------------------------------------------
// Per-week, per-exercise metrics for a single assignment
// ---------------------------------------------------------------------------

type ExerciseWeekMetrics = {
  weeklyBestE1RM: number
  volume: number // tonnage = Σ(sets * reps * weight)
}

/**
 * For each week in the assignment, computes per-exercise weeklyBestE1RM
 * and volume (tonnage = sets * reps * weight).
 *
 * Returns a nested map: weekNumber → exerciseId → metrics
 */
export function computeExerciseWeekMetrics(
  assignment: RawAssignment,
): Map<number, Map<string, ExerciseWeekMetrics>> {
  const weekMap = new Map<number, Map<string, ExerciseWeekMetrics>>()

  for (const [weekKey, days] of Object.entries(assignment.sessions ?? {})) {
    const weekNum = parseInt(weekKey, 10)
    if (Number.isNaN(weekNum)) continue

    if (!weekMap.has(weekNum)) {
      weekMap.set(weekNum, new Map())
    }

    const exerciseMap = weekMap.get(weekNum)!

    for (const day of Object.values(days)) {
      for (const [groupId, exercises] of Object.entries(day.performed ?? {})) {
        for (const exercise of exercises) {
          const exerciseId = exercise.exercise ?? groupId

          for (const scheme of exercise.schemes) {
            if (!scheme.weight || scheme.weight <= 0) continue

            const e1rm = calcE1RM(scheme.weight, scheme.repetitions)
            const tonnage = scheme.sets * scheme.repetitions * scheme.weight

            const current = exerciseMap.get(exerciseId)

            if (!current) {
              exerciseMap.set(exerciseId, {
                weeklyBestE1RM: e1rm,
                volume: tonnage,
              })
            } else {
              exerciseMap.set(exerciseId, {
                weeklyBestE1RM: Math.max(current.weeklyBestE1RM, e1rm),
                volume: current.volume + tonnage,
              })
            }
          }
        }
      }
    }
  }

  return weekMap
}

// ---------------------------------------------------------------------------
// Volume-weighted weekly performance %
// ---------------------------------------------------------------------------

/**
 * Computes the volume-weighted performance % for a single week across all
 * exercises that have a historical best e1RM.
 *
 * Formula: Σ(perf% * volume) / Σ(volume)
 * where perf% = weeklyBestE1RM / historicalBestE1RM * 100
 *
 * Returns undefined if there is no data for the week.
 */
export function computeWeeklyPerformance(
  weekExercises: Map<string, ExerciseWeekMetrics>,
  historicalBest: Map<string, number>,
): number | undefined {
  let weightedPerfSum = 0
  let totalVolume = 0

  for (const [exerciseId, metrics] of weekExercises) {
    const histBest = historicalBest.get(exerciseId)

    if (!histBest || histBest <= 0) continue
    if (metrics.volume <= 0) continue

    const perfPct = (metrics.weeklyBestE1RM / histBest) * 100

    weightedPerfSum += perfPct * metrics.volume
    totalVolume += metrics.volume
  }

  if (totalVolume === 0) return undefined

  return weightedPerfSum / totalVolume
}

// ---------------------------------------------------------------------------
// Planned load mapping from system distribution
// ---------------------------------------------------------------------------

/**
 * Builds a map from week number to planned load % from a system distribution.
 * Weeks with no matching entry → not present in the map.
 */
export function buildPlannedLoadMap(
  distribution: SystemDistributionEntry[],
): Map<number, number> {
  const map = new Map<number, number>()

  for (const entry of distribution) {
    map.set(entry.week, entry.load)
  }

  return map
}

// ---------------------------------------------------------------------------
// Main aggregation: weeks data for a single assignment
// ---------------------------------------------------------------------------

/**
 * Computes the full chart data for one routine assignment.
 *
 * @param key - the assignment key (routineId_startDate)
 * @param routineName - resolved routine name
 * @param assignment - raw assignment document
 * @param historicalBest - pre-computed historical best e1RM per exerciseId
 * @param systemDistribution - optional planned load distribution entries
 */
export function computeRoutineChartData(
  key: string,
  routineName: string,
  assignment: RawAssignment,
  historicalBest: Map<string, number>,
  systemDistribution?: SystemDistributionEntry[],
): RoutineChartData {
  const exerciseWeekMetrics = computeExerciseWeekMetrics(assignment)
  const plannedMap = systemDistribution
    ? buildPlannedLoadMap(systemDistribution)
    : undefined

  // Collect all week numbers from the assignment sessions
  const weekNumbers = Array.from(exerciseWeekMetrics.keys()).sort(
    (a, b) => a - b,
  )

  const weeks: WeekDataPoint[] = []

  for (const week of weekNumbers) {
    const weekExercises = exerciseWeekMetrics.get(week)!
    const performance = computeWeeklyPerformance(weekExercises, historicalBest)

    if (performance === undefined) continue

    const point: WeekDataPoint = {
      week,
      performance: Math.round(performance * 10) / 10,
    }

    if (plannedMap) {
      const planned = plannedMap.get(week)
      if (planned !== undefined) {
        point.planned = planned
      }
    }

    weeks.push(point)
  }

  const startDate =
    assignment.startDate != null ? String(assignment.startDate) : undefined

  return {
    key,
    routineName,
    active: assignment.active ?? false,
    startDate,
    weeks,
  }
}
