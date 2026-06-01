import { NextResponse } from 'next/server'
import { z } from 'zod'

import { MONGODB_CLIENTS_COLLECTION } from '@/lib/constants'

import { connectMongo, getDb } from '@/lib/db'

const schema = z.object({
  dni: z.string().trim().min(1),
  routine: z.string().trim().min(1),
  week: z.number().int().positive(),
  day: z.number().int().positive(),
  group: z.string().trim().min(1),

  performed: z.array(
    z.object({
      _id: z.string(),
      sets: z.number().int().min(1),
      repetitions: z.number().int().min(1),
      weight: z.number().min(0),
    }),
  ),
})

export async function POST(request: Request) {
  const url = new URL(request.url)

  const body = await request.json()

  const parsed = schema.safeParse({
    dni: url.searchParams.get('dni'),
    routine: url.searchParams.get('routine'),
    week: Number(url.searchParams.get('week')),
    day: Number(url.searchParams.get('day')),
    group: url.searchParams.get('group'),
    performed: body.performed,
  })

  if (!parsed.success) {
    return NextResponse.json(z.treeifyError(parsed.error), {
      status: 400,
    })
  }

  const { dni, routine, week, day, group, performed } = parsed.data

  const grouped = Object.values(
    performed.reduce<
      Record<
        string,
        {
          exercise?: string
          schemes: {
            sets: number
            repetitions: number
            weight: number
          }[]
        }
      >
    >((acc, item) => {
      const key = item._id

      if (!acc[key]) {
        acc[key] = {
          exercise: key,
          schemes: [],
        }
      }

      acc[key].schemes.push({
        sets: item.sets,
        repetitions: item.repetitions,
        weight: item.weight,
      })

      return acc
    }, {}),
  )

  const payload =
    grouped.length === 1 && grouped[0]?.exercise === group
      ? grouped.map(({ schemes }) => ({
          schemes,
        }))
      : grouped

  await connectMongo()

  const db = getDb()

  const clients = db.collection(MONGODB_CLIENTS_COLLECTION || 'clients')

  const result = await clients.updateOne(
    {
      dni,
    },
    {
      $set: {
        [`routines.${routine}.sessions.${week}.${day}.performed.${group}`]:
          payload,
      },
    },
  )

  if (!result.matchedCount) {
    return NextResponse.json(null, {
      status: 404,
    })
  }

  return NextResponse.json({
    success: true,
  })
}
