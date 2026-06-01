import axios from 'axios'

import type {
  Client,
  Exercise,
  ExercisePerformance,
  Routine,
  SchemePerformance,
  Session,
} from '@/domain/routine'

import { formatURL } from '@/lib/utils'

export const ENDPOINTS = {
  routine: '/api/routine/{dni}',
  performance: '/api/performance',
} as const

export interface GetRoutineProps {
  params: Pick<Client, 'dni'>
}

export async function getClient({ params }: GetRoutineProps) {
  const { data } = await axios.get<Client>(formatURL(ENDPOINTS.routine, params))
  return data
}

export interface PostPerformanceProps {
  params: Pick<Client, 'dni'> &
    Pick<Session, 'week' | 'day'> & {
      routine: Routine['_id']
      group: string
    }

  body: {
    performed: Array<SchemePerformance & Pick<Exercise, '_id'>>
  }
}

export async function postPerformance({ params, body }: PostPerformanceProps) {
  const { data } = await axios.post<ExercisePerformance>(
    formatURL(ENDPOINTS.performance, params),
    body,
  )
  return data
}
