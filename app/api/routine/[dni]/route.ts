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
  startDate?: unknown
  endDate?: unknown
  active?: boolean
  sessions?: Record<string, Record<string, RawSessionDay>>
}

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

  const activeRoutine =
    rawRoutines.find(([, routine]) => routine.active) ?? rawRoutines[0]

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

  const routineDoc = await routinesCollection.findOne({
    _id: new mongoose.Types.ObjectId(routineId),
  })

  if (!routineDoc) {
    return NextResponse.json(null, { status: 404 })
  }

  const exerciseIds = new Set<string>()

  for (const session of routineDoc.sessions ?? []) {
    for (const groupId of session.exercises ?? []) {
      exerciseIds.add(groupId)
    }
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

  const sessions: Session[] = (routineDoc.sessions ?? []).map(
    (session: { week: number; day: number; exercises: string[] }) => {
      const dayData =
        rawRoutineData.sessions?.[String(session.week)]?.[String(session.day)]

      const exercises: ExerciseGroup[] = session.exercises.map((groupId) => {
        const group = exerciseMap.get(groupId)

        const rawObjectives = dayData?.objectives?.[groupId] ?? []

        const rawPerformance = dayData?.performed?.[groupId] ?? []

        const objectives: Exercise[] = rawObjectives.map((exercise, index) => {
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
        })

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

      return {
        week: session.week,
        day: session.day,
        exercises,
      }
    },
  )

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
