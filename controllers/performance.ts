import axios from 'axios'

import type { RoutineChartData } from '@/lib/performance-metrics'
import { formatURL } from '@/lib/utils'

export const PERFORMANCE_ENDPOINTS = {
  performanceChart: '/api/performance-chart/{dni}',
} as const

export interface GetPerformanceChartProps {
  params: {
    dni: string
  }
}

export type PerformanceChartResponse = {
  routines: RoutineChartData[]
}

export async function getPerformanceChart({
  params,
}: GetPerformanceChartProps): Promise<PerformanceChartResponse> {
  const { data } = await axios.get<PerformanceChartResponse>(
    formatURL(PERFORMANCE_ENDPOINTS.performanceChart, params),
  )
  return data
}
