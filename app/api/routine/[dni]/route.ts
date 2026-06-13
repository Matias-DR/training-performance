import mongoose from 'mongoose'

import { NextResponse } from 'next/server'
import { z } from 'zod'

import type {
  Client,
  Exercise,
  ExerciseGroup,
  ExercisePerformance,
  Scheme,
  SchemePerformance,
  Session,
} from '@/domain/routine'

import {
  MONGODB_CLIENTS_COLLECTION,
  MONGODB_EXERCISES_COLLECTION,
  MONGODB_ROUTINES_COLLECTION,
} from '@/lib/constants'
import { connectMongo, getDb } from '@/lib/db'

interface Params {
  dni: string
}

const schema = z.string().trim().min(1)

type RawScheme = {
  sets: number
  repetitions: number
  weight?: number
}

type RawExercise = {
  exercise?: string
  schemes: RawScheme[]
}

type RawSessionDay = {
  objectives?: Record<string, RawExercise[]>
  performed?: Record<string, RawExercise[]>
}

type RawRoutineData = {
  routineId?: string
  startDate?: unknown
  endDate?: unknown
  active?: boolean
  sessions?: Record<string, Record<string, RawSessionDay>>
}

type RoutineExerciseNode = {
  exerciseId: string
  items?: RoutineExerciseNode[]
}

type RoutineDocSession = {
  weeks: number[]
  days: number[]
  exercises: RoutineExerciseNode[]
}

const OBJECT_ID_PATTERN = /^[a-f0-9]{24}$/i

export async function GET(_request: Request, ctx: { params: Promise<Params> }) {
  const { dni: clientParam } = await ctx.params

  const parsedDni = schema.safeParse(clientParam)

  if (!parsedDni.success) {
    return NextResponse.json(null, { status: 400 })
  }

  const dni = parsedDni.data

  await connectMongo()

  const db = getDb()

  const clients = db.collection(MONGODB_CLIENTS_COLLECTION || 'clients')

  const exercisesCollection = db.collection(
    MONGODB_EXERCISES_COLLECTION || 'exercises',
  )

  const routinesCollection = db.collection(
    MONGODB_ROUTINES_COLLECTION || 'routines',
  )

  const client = await clients.findOne({ dni })

  if (!client) {
    return NextResponse.json(null, { status: 404 })
  }

  const rawRoutines = Object.entries(client.routines || {}) as Array<
    [string, RawRoutineData]
  >

  const now = Date.now()

  const toTime = (value: unknown) =>
    value ? new Date(value as string | number | Date).getTime() : Number.NaN

  const activeRoutines = rawRoutines.filter(([, routine]) => routine.active)

  // Prefer the routine whose date range contains today.
  const currentRoutine = activeRoutines.find(([, routine]) => {
    const start = toTime(routine.startDate)
    const end = toTime(routine.endDate)

    return (
      !Number.isNaN(start) && start <= now && (Number.isNaN(end) || now <= end)
    )
  })

  // Fallback: most recently started active routine.
  const mostRecentRoutine = [...activeRoutines].sort(
    ([, a], [, b]) => toTime(b.startDate) - toTime(a.startDate),
  )[0]

  const activeRoutine = currentRoutine ?? mostRecentRoutine ?? rawRoutines[0]

  if (!activeRoutine) {
    return NextResponse.json(
      {
        dni: client.dni,
        name: client.name,
        routine: {
          _id: '',
          sessions: [],
        },
      } satisfies Client,
      { status: 200 },
    )
  }

  const [routineId, rawRoutineData] = activeRoutine

  // The routines map is keyed by `{routineObjectId}_{startDate}`, so the real
  // ObjectId is the key prefix (the `routineId` field is not always present).
  const routineObjectId = rawRoutineData.routineId ?? routineId.split('_')[0]

  if (!OBJECT_ID_PATTERN.test(routineObjectId)) {
    return NextResponse.json(null, { status: 404 })
  }

  const routineDoc = await routinesCollection.findOne({
    _id: new mongoose.Types.ObjectId(routineObjectId),
  })

  if (!routineDoc) {
    return NextResponse.json(null, { status: 404 })
  }

  const exerciseIds = new Set<string>()

  const routineSessions = (routineDoc.sessions ?? []) as RoutineDocSession[]

  const collectExerciseIds = (nodes: RoutineExerciseNode[] = []) => {
    for (const node of nodes) {
      if (node.exerciseId) {
        exerciseIds.add(node.exerciseId)
      }

      collectExerciseIds(node.items)
    }
  }

  for (const session of routineSessions) {
    collectExerciseIds(session.exercises)
  }

  for (const week of Object.values(rawRoutineData.sessions ?? {})) {
    for (const day of Object.values(week)) {
      for (const [groupId, exercises] of Object.entries(day.objectives ?? {})) {
        exerciseIds.add(groupId)

        for (const exercise of exercises) {
          if (exercise.exercise) {
            exerciseIds.add(exercise.exercise)
          }
        }
      }

      for (const [groupId, exercises] of Object.entries(day.performed ?? {})) {
        exerciseIds.add(groupId)

        for (const exercise of exercises) {
          if (exercise.exercise) {
            exerciseIds.add(exercise.exercise)
          }
        }
      }
    }
  }

  const exerciseDocs = await exercisesCollection
    .find({
      _id: {
        $in: Array.from(exerciseIds).map(
          (id) => new mongoose.Types.ObjectId(id),
        ),
      },
    })
    .toArray()

  const exerciseMap = new Map<
    string,
    {
      _id: string
      name: string
    }
  >(
    exerciseDocs.map((exercise) => [
      String(exercise._id),
      {
        _id: String(exercise._id),
        name: exercise.name,
      },
    ]),
  )

  const sessions: Session[] = []

  for (const routineSession of routineSessions) {
    const groupIds = routineSession.exercises.map((node) => node.exerciseId)

    // A routine-doc session describes a set of weeks and days; expand the
    // cartesian product into one output Session per (week, day) pair.
    for (const week of routineSession.weeks ?? []) {
      for (const day of routineSession.days ?? []) {
        const dayData = rawRoutineData.sessions?.[String(week)]?.[String(day)]

        const exercises: ExerciseGroup[] = groupIds.map((groupId) => {
          const group = exerciseMap.get(groupId)

          const rawObjectives = dayData?.objectives?.[groupId] ?? []

          const rawPerformance = dayData?.performed?.[groupId] ?? []

          const objectives: Exercise[] = rawObjectives.map(
            (exercise, index) => {
              const nestedExerciseId = exercise.exercise ?? groupId

              const nestedExercise = exerciseMap.get(nestedExerciseId)

              return {
                _id: nestedExerciseId,
                name: nestedExercise?.name ?? `Exercise ${index + 1}`,
                schemes: exercise.schemes.map(
                  (scheme): Scheme => ({
                    sets: scheme.sets,
                    repetitions: scheme.repetitions,
                  }),
                ),
              }
            },
          )

          const performance: ExercisePerformance[] = rawPerformance.map(
            (exercise, index) => {
              const nestedExerciseId = exercise.exercise ?? groupId

              const nestedExercise = exerciseMap.get(nestedExerciseId)

              return {
                _id: nestedExerciseId,
                name: nestedExercise?.name ?? `Exercise ${index + 1}`,
                schemes: exercise.schemes.map(
                  (scheme): SchemePerformance => ({
                    sets: scheme.sets,
                    repetitions: scheme.repetitions,
                    weight: scheme.weight ?? 0,
                  }),
                ),
              }
            },
          )

          return {
            _id: groupId,
            name: group?.name ?? 'Exercise Group',
            objectives,
            performance,
          }
        })

        sessions.push({ week, day, exercises })
      }
    }
  }

  const response: Client = {
    dni: client.dni,
    name: client.name,
    routine: {
      _id: routineId,
      sessions,
    },
  }

  return NextResponse.json(response)
}
