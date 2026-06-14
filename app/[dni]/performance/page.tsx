'use client'

import { FrownIcon, LoaderCircleIcon } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useMemo, useState } from 'react'

import { LoadPerformanceChart } from '@/components/performance/load-performance-chart'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useGetPerformanceChart } from '@/hooks/performance'
import type { RoutineChartData } from '@/lib/performance-metrics'

export default function PerformancePage() {
  const routeParams = useParams<{ dni: string }>()
  const dni = useMemo(() => String(routeParams.dni || ''), [routeParams])

  const [selectedKey, setSelectedKey] = useState<string | undefined>(undefined)

  const { data, isLoading } = useGetPerformanceChart({
    params: { dni },
  })

  // Derive the effective selection: use state or fall back to the first routine
  const effectiveKey = selectedKey ?? data?.routines[0]?.key

  const activeRoutines = useMemo(
    () => data?.routines.filter((r) => r.active) ?? [],
    [data],
  )

  const historicalRoutines = useMemo(
    () => data?.routines.filter((r) => !r.active) ?? [],
    [data],
  )

  const selectedRoutine: RoutineChartData | undefined = useMemo(
    () => data?.routines.find((r) => r.key === effectiveKey),
    [data, effectiveKey],
  )

  const hasPlanned = useMemo(
    () => selectedRoutine?.weeks.some((w) => w.planned !== undefined) ?? false,
    [selectedRoutine],
  )

  if (isLoading) {
    return (
      <main className='p-6'>
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant='icon'>
              <LoaderCircleIcon className='animate-spin' />
            </EmptyMedia>
            <EmptyTitle>Cargando rendimiento</EmptyTitle>
            <EmptyDescription>
              Estamos calculando tu progreso...
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </main>
    )
  }

  if (!data?.routines.length) {
    return (
      <main className='p-6'>
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant='icon'>
              <FrownIcon />
            </EmptyMedia>
            <EmptyTitle>Sin datos de rendimiento</EmptyTitle>
            <EmptyDescription>
              Completá algunas sesiones para ver tu progreso
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </main>
    )
  }

  return (
    <main className='p-6'>
      <div className='flex flex-col gap-6 max-w-4xl mx-auto'>
        <header className='flex flex-col gap-1'>
          <h1 className='text-xl font-semibold'>Rendimiento</h1>
          <p className='text-sm text-muted-foreground'>
            Carga planificada vs. rendimiento realizado por semana
          </p>
        </header>

        <Select value={effectiveKey} onValueChange={setSelectedKey}>
          <SelectTrigger className='w-full sm:w-72'>
            <SelectValue placeholder='Seleccioná una rutina' />
          </SelectTrigger>
          <SelectContent>
            {activeRoutines.length > 0 && (
              <SelectGroup>
                <SelectLabel>Activa</SelectLabel>
                {activeRoutines.map((routine) => (
                  <SelectItem key={routine.key} value={routine.key}>
                    {routine.routineName}
                  </SelectItem>
                ))}
              </SelectGroup>
            )}
            {historicalRoutines.length > 0 && (
              <SelectGroup>
                <SelectLabel>Historial</SelectLabel>
                {historicalRoutines.map((routine) => (
                  <SelectItem key={routine.key} value={routine.key}>
                    {routine.routineName}
                  </SelectItem>
                ))}
              </SelectGroup>
            )}
          </SelectContent>
        </Select>

        {selectedRoutine && selectedRoutine.weeks.length > 0 ? (
          <div className='flex flex-col gap-4'>
            <div className='flex items-center gap-2 flex-wrap'>
              <span className='text-sm font-medium'>
                {selectedRoutine.routineName}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  selectedRoutine.active
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {selectedRoutine.active ? 'Activa' : 'Historial'}
              </span>
              {!hasPlanned && (
                <span className='text-xs text-muted-foreground'>
                  Sin sistema de carga asignado
                </span>
              )}
            </div>

            <LoadPerformanceChart
              weeks={selectedRoutine.weeks}
              hasPlanned={hasPlanned}
            />
          </div>
        ) : selectedRoutine ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant='icon'>
                <FrownIcon />
              </EmptyMedia>
              <EmptyTitle>Sin datos para esta rutina</EmptyTitle>
              <EmptyDescription>
                Completá algunas sesiones para ver el rendimiento de esta rutina
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : null}
      </div>
    </main>
  )
}
