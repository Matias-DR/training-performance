import mongoose from 'mongoose'

import { NextResponse } from 'next/server'
import { z } from 'zod'

import {
  MONGODB_CLIENTS_COLLECTION,
  MONGODB_ROUTINES_COLLECTION,
  MONGODB_SYSTEMS_COLLECTION,
} from '@/lib/constants'
import { connectMongo, getDb } from '@/lib/db'
import {
  computeHistoricalBestE1RM,
  computeRoutineChartData,
  type RawAssignment,
  type RoutineChartData,
  type SystemDistributionEntry,
} from '@/lib/performance-metrics'

interface Params {
  dni: string
}

const schema = z.string().trim().min(1)

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

  const clientsCollection = db.collection(
    MONGODB_CLIENTS_COLLECTION || 'clients',
  )

  const routinesCollection = db.collection(
    MONGODB_ROUTINES_COLLECTION || 'routines',
  )

  const systemsCollection = db.collection(
    MONGODB_SYSTEMS_COLLECTION || 'systems',
  )

  const client = await clientsCollection.findOne({ dni })

  if (!client) {
    return NextResponse.json(null, { status: 404 })
  }

  const rawRoutinesMap = (client.routines ?? {}) as Record<string, unknown>

  // Cast each assignment value to the shape our helpers expect
  const assignments = Object.entries(rawRoutinesMap).map(([key, value]) => ({
    key,
    assignment: value as RawAssignment,
  }))

  if (assignments.length === 0) {
    return NextResponse.json({ routines: [] })
  }

  // Compute historical best e1RM across ALL assignments
  const historicalBest = computeHistoricalBestE1RM(
    assignments.map(({ assignment }) => assignment),
  )

  // Resolve routine names: collect unique routineObjectIds
  const routineIdSet = new Set<string>()

  for (const { key, assignment } of assignments) {
    const routineObjectId = assignment.routineId ?? key.split('_')[0]

    if (OBJECT_ID_PATTERN.test(routineObjectId)) {
      routineIdSet.add(routineObjectId)
    }
  }

  const routineDocs = await routinesCollection
    .find({
      _id: {
        $in: Array.from(routineIdSet).map(
          (id) => new mongoose.Types.ObjectId(id),
        ),
      },
    })
    .toArray()

  const routineNameMap = new Map<string, string>(
    routineDocs.map((doc) => [String(doc._id), doc.name as string]),
  )

  // Resolve systems: collect unique systemIds
  const systemIdSet = new Set<string>()

  for (const { assignment } of assignments) {
    if (assignment.systemId && OBJECT_ID_PATTERN.test(assignment.systemId)) {
      systemIdSet.add(assignment.systemId)
    }
  }

  const systemDocs =
    systemIdSet.size > 0
      ? await systemsCollection
          .find({
            _id: {
              $in: Array.from(systemIdSet).map(
                (id) => new mongoose.Types.ObjectId(id),
              ),
            },
          })
          .toArray()
      : []

  const systemDistributionMap = new Map<string, SystemDistributionEntry[]>(
    systemDocs.map((doc) => [
      String(doc._id),
      (doc.distribution ?? []) as SystemDistributionEntry[],
    ]),
  )

  // Build chart data per assignment
  const routines: RoutineChartData[] = []

  for (const { key, assignment } of assignments) {
    const routineObjectId = assignment.routineId ?? key.split('_')[0]

    const routineName = OBJECT_ID_PATTERN.test(routineObjectId)
      ? (routineNameMap.get(routineObjectId) ?? 'Routine')
      : 'Routine'

    const systemDistribution = assignment.systemId
      ? systemDistributionMap.get(assignment.systemId)
      : undefined

    const chartData = computeRoutineChartData(
      key,
      routineName,
      assignment,
      historicalBest,
      systemDistribution,
    )

    routines.push(chartData)
  }

  // Sort: active first, then by startDate descending
  routines.sort((a, b) => {
    if (a.active !== b.active) return a.active ? -1 : 1

    const aTime = a.startDate ? new Date(a.startDate).getTime() : 0
    const bTime = b.startDate ? new Date(b.startDate).getTime() : 0

    return bTime - aTime
  })

  return NextResponse.json({ routines })
}
