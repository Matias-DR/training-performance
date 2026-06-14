'use client'

import {
  Area,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import type { WeekDataPoint } from '@/lib/performance-metrics'

interface LoadPerformanceChartProps {
  weeks: WeekDataPoint[]
  /** When true, renders the planned load Area (grey background) */
  hasPlanned: boolean
}

const chartConfig = {
  planned: {
    label: 'Carga planificada',
    color: 'hsl(var(--muted-foreground) / 0.25)',
  },
  performance: {
    label: 'Rendimiento',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig

export function LoadPerformanceChart({
  weeks,
  hasPlanned,
}: LoadPerformanceChartProps) {
  return (
    <ChartContainer config={chartConfig} className='min-h-[280px] w-full'>
      <ComposedChart
        data={weeks}
        margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
      >
        <CartesianGrid strokeDasharray='3 3' vertical={false} />

        <XAxis
          dataKey='week'
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(v: number) => `S${v}`}
        />

        {/* Left axis: planned load % */}
        <YAxis
          yAxisId='left'
          orientation='left'
          domain={[0, 100]}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(v: number) => `${v}%`}
          hide={!hasPlanned}
        />

        {/* Right axis: performance % */}
        <YAxis
          yAxisId='right'
          orientation='right'
          domain={[0, 100]}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(v: number) => `${v}%`}
        />

        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) => (
                <span>
                  {typeof value === 'number' ? value.toFixed(1) : value}%
                </span>
              )}
              labelFormatter={(label) => `Semana ${label}`}
            />
          }
        />

        <ChartLegend content={<ChartLegendContent />} />

        {hasPlanned && (
          <Area
            yAxisId='left'
            type='monotone'
            dataKey='planned'
            fill='var(--color-planned)'
            stroke='var(--color-planned)'
            strokeWidth={1}
            fillOpacity={1}
            dot={false}
            activeDot={false}
            connectNulls={false}
          />
        )}

        <Line
          yAxisId='right'
          type='monotone'
          dataKey='performance'
          stroke='var(--color-performance)'
          strokeWidth={2}
          dot={{ r: 3, fill: 'var(--color-performance)' }}
          activeDot={{ r: 5 }}
          connectNulls={false}
        />
      </ComposedChart>
    </ChartContainer>
  )
}
