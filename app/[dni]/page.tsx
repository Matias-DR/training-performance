'use client'

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  FrownIcon,
  LoaderCircleIcon,
} from 'lucide-react'
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import type { GetRoutineProps } from '@/controllers/routine'
import type { Session } from '@/domain/routine'

import Exercise from '@/components/routine/excercise'
import SetDNI, { useSetDNIAsPathParam } from '@/components/set-dni'

import { Button } from '@/components/ui/button'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { keys, useGetClient } from '@/hooks/routine'
import { cn } from '@/lib/utils'

export default function ClientHome() {
  const routeParams = useParams<{ dni: string }>()
  const dni = useMemo(() => String(routeParams.dni || ''), [routeParams])

  const [params, setParams] = useState<GetRoutineProps['params']>({ dni })
  const [session, setSession] = useState<Pick<Session, 'week' | 'day'>>({
    week: 1,
    day: 1,
  })

  useEffect(() => {
    setParams((p) => (p.dni === dni ? p : { ...p, dni }))
  }, [dni])

  const clientQueryKey = keys.routine(params)
  const {
    data: client,
    isLoading: isClientLoading,
    isFetching: isClientFetching,
  } = useGetClient({ queryKey: clientQueryKey, params })

  const { setDNIAsPathParam } = useSetDNIAsPathParam()

  const sessions = useMemo(
    () =>
      client?.routine.sessions.find(
        (routineSession) =>
          routineSession.week === session.week &&
          routineSession.day === session.day,
      ),
    [session.day, session.week, client],
  )

  const navigation = useMemo(() => {
    let hasNextWeek = false
    let hasPreviousWeek = false
    let hasNextDay = false
    let hasPreviousDay = false

    for (const routineSession of client?.routine.sessions ?? []) {
      if (routineSession.week === session.week + 1) hasNextWeek = true
      if (routineSession.week === session.week - 1) hasPreviousWeek = true
      if (
        routineSession.week === session.week &&
        routineSession.day === session.day + 1
      )
        hasNextDay = true
      if (
        routineSession.week === session.week &&
        routineSession.day === session.day - 1
      )
        hasPreviousDay = true
      if (hasNextWeek && hasPreviousWeek && hasNextDay && hasPreviousDay) break
    }

    return {
      hasNext: { week: hasNextWeek, day: hasNextDay },
      hasPrevious: { week: hasPreviousWeek, day: hasPreviousDay },
    }
  }, [client, session])

  return (
    <main
      className={cn(
        'p-6',
        isClientFetching && 'pointer-events-none',
        isClientFetching &&
          !isClientLoading &&
          'pointer-events-none opacity-85',
      )}
    >
      {isClientLoading ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant='icon'>
              <LoaderCircleIcon className='animate-spin' />
            </EmptyMedia>
            <EmptyTitle>¡Bienvenido!</EmptyTitle>
            <EmptyDescription>Estamos buscando tu rutina</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : !client?.routine.sessions.length ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant='icon'>
              <FrownIcon />
            </EmptyMedia>
            <EmptyTitle>No te encontramos ninguna rutina asignada</EmptyTitle>
            <EmptyDescription>
              Contacta a tu entrenador/a para asignarte una rutina
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <SetDNI onSubmit={setDNIAsPathParam} />
          </EmptyContent>
        </Empty>
      ) : (
        <div className='flex flex-col gap-6'>
          <div className='w-full sm:sticky sm:top-4 sm:z-10 max-w-full sm:max-w-xl flex justify-evenly gap-2 lg:gap-4 mx-auto'>
            <article className='flex gap-2 lg:gap-4 items-center'>
              <Button
                size='icon'
                disabled={!navigation.hasPrevious.week}
                onClick={() =>
                  setSession(({ week, day }) => ({
                    week: week > 1 ? week - 1 : week,
                    day,
                  }))
                }
                className='max-sm:hidden'
              >
                <ChevronLeftIcon />
              </Button>
              <Button
                size='icon-xs'
                disabled={!navigation.hasPrevious.week}
                onClick={() =>
                  setSession(({ week, day }) => ({
                    week: week > 1 ? week - 1 : week,
                    day,
                  }))
                }
                className='sm:hidden'
              >
                <ChevronLeftIcon />
              </Button>
              <header>
                <h2 className='lg:min-w-24 text-center space-x-1 lg:space-x-2'>
                  <span className='text-muted-foreground'>SEMANA</span>
                  <span className='font-bold'>{session.week}</span>
                </h2>
              </header>
              <Button
                size='icon'
                disabled={!navigation.hasNext.week}
                onClick={() =>
                  setSession(({ week, day }) => ({
                    week: week + 1,
                    day,
                  }))
                }
                className='max-sm:hidden'
              >
                <ChevronRightIcon />
              </Button>
              <Button
                size='icon-xs'
                disabled={!navigation.hasNext.week}
                onClick={() =>
                  setSession(({ week, day }) => ({
                    week: week + 1,
                    day,
                  }))
                }
                className='sm:hidden'
              >
                <ChevronRightIcon />
              </Button>
            </article>
            <article className='flex gap-2 lg:gap-4 items-center'>
              <Button
                size='icon'
                disabled={!navigation.hasPrevious.day}
                onClick={() =>
                  setSession(({ week, day }) => ({
                    week,
                    day: day - 1,
                  }))
                }
                className='max-sm:hidden'
              >
                <ChevronLeftIcon />
              </Button>
              <Button
                size='icon-xs'
                disabled={!navigation.hasPrevious.day}
                onClick={() =>
                  setSession(({ week, day }) => ({
                    week,
                    day: day - 1,
                  }))
                }
                className='sm:hidden'
              >
                <ChevronLeftIcon />
              </Button>
              <header>
                <h2 className='lg:min-w-24 text-center space-x-1 lg:space-x-2'>
                  <span className='text-muted-foreground'>DÍA</span>
                  <span className='font-bold'>{session.day}</span>
                </h2>
              </header>
              <Button
                size='icon'
                disabled={!navigation.hasNext.day}
                onClick={() =>
                  setSession(({ week, day }) => ({
                    week,
                    day: day + 1,
                  }))
                }
                className='max-sm:hidden'
              >
                <ChevronRightIcon />
              </Button>
              <Button
                size='icon-xs'
                disabled={!navigation.hasNext.day}
                onClick={() =>
                  setSession(({ week, day }) => ({
                    week,
                    day: day + 1,
                  }))
                }
                className='sm:hidden'
              >
                <ChevronRightIcon />
              </Button>
            </article>
          </div>

          <div className='max-lg:hidden'>
            <div className='columns-2 xl:columns-3 2xl:columns-4 gap-4 space-y-4'>
              {sessions?.exercises.map((exercise) => (
                <Exercise
                  key={exercise._id}
                  queryKeys={[clientQueryKey]}
                  exercise={exercise}
                  postPerformanceParams={{
                    dni: params.dni,
                    routine: client.routine._id,
                    week: session.week,
                    day: session.day,
                    group: exercise._id,
                  }}
                  className='break-inside-avoid'
                />
              ))}
            </div>
          </div>

          <Carousel className='lg:hidden max-w-full sm:max-w-sm mx-auto'>
            <CarouselContent>
              {sessions?.exercises.map((exercise) => (
                <CarouselItem key={exercise._id}>
                  <Exercise
                    queryKeys={[clientQueryKey]}
                    exercise={exercise}
                    postPerformanceParams={{
                      dni: params.dni,
                      routine: client.routine._id,
                      week: session.week,
                      day: session.day,
                      group: exercise._id,
                    }}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className='max-sm:hidden' />
            <CarouselNext className='max-sm:hidden' />
          </Carousel>
        </div>
      )}
    </main>
  )
}
