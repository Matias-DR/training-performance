import { useQuery } from '@tanstack/react-query'

import type { QueryKey, UseQueryOptions } from '@/domain/index'

import {
  getPerformanceChart,
  type GetPerformanceChartProps,
  PERFORMANCE_ENDPOINTS,
} from '@/controllers/performance'

export const performanceKeys = {
  chart: (params: GetPerformanceChartProps['params']) => [
    PERFORMANCE_ENDPOINTS.performanceChart,
    params,
  ],
}

export function useGetPerformanceChart({
  params,
  queryKey,
  ...rest
}: UseQueryOptions<typeof getPerformanceChart> &
  Partial<QueryKey> &
  GetPerformanceChartProps) {
  return useQuery({
    queryKey: queryKey ?? performanceKeys.chart(params),
    queryFn: () => getPerformanceChart({ params }),
    ...rest,
  })
}
