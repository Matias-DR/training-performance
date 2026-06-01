import type { HTMLAttributes } from 'react'

import { Fragment } from 'react/jsx-runtime'

import type { QueryKeys } from '@/domain'
import type { ExerciseGroup } from '@/domain/routine'
import SetPerformance, {
  type Props as SetPerformanceProps,
} from './set-performance'

import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { formatObjective, formatPerformance } from './helpers'

export interface Props {
  exercise: ExerciseGroup
}

export default function ExerciseComponent({
  queryKeys,
  exercise,
  postPerformanceParams,
  className,
  ...rest
}: HTMLAttributes<HTMLElement> &
  QueryKeys &
  Props &
  Pick<SetPerformanceProps, 'postPerformanceParams'>) {
  const { objectives, performance } = exercise

  return (
    <article
      className={cn(
        'flex flex-col gap-2 p-4 bg-card border rounded-md',
        className,
      )}
      {...rest}
    >
      <header>
        <h3>{exercise.name}</h3>
      </header>
      <Separator />
      <section aria-labelledby='objetivo-title' className='flex gap-2 flex-col'>
        {objectives.length > 1 ? (
          <Table>
            <TableCaption className='mt-0 text-xs text-right'>
              Objetivo: Series × Reps
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className='ps-0 h-min py-1'>Ejercicio</TableHead>
                <TableHead className='pe-0 h-min py-1 text-right'>
                  Objetivo<sup>*</sup>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {objectives.map((exercise) => (
                <TableRow key={exercise._id}>
                  <TableCell className='ps-0 py-1'>{exercise.name}</TableCell>
                  <TableCell className='pe-0 py-1 text-right'>
                    {formatObjective({ exercise })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Table>
            <TableCaption className='mt-0 text-xs text-right'>
              Series × Reps
            </TableCaption>
            <TableBody>
              <TableRow>
                <TableCell className='ps-0 py-1'>Objetivo</TableCell>
                <TableCell className='pe-0 py-1 text-right'>
                  {formatObjective({ exercise: objectives[0] })}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        )}
      </section>
      <Separator />
      <SetPerformance
        queryKeys={queryKeys}
        name={exercise.name}
        exercises={objectives.map(({ _id, name }) => ({ _id, name }))}
        performance={performance}
        postPerformanceParams={postPerformanceParams}
        className='ml-auto'
      />
      {performance == null ? null : (
        <Fragment>
          <Separator />
          <section
            aria-labelledby='total-title'
            className='flex gap-2 flex-col'
          >
            <h4 id='total-title'>Realizado</h4>
            {performance.length > 0 ? (
              performance.length > 1 ? (
                <Table>
                  <TableCaption className='mt-0 text-xs text-right'>
                    Rendimiento: Series × Reps × Peso(KG)
                  </TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead className='ps-0 h-min py-1'>
                        Ejercicio
                      </TableHead>
                      <TableHead className='h-min py-1 text-center max-[460px]:hidden'>
                        Series
                      </TableHead>
                      <TableHead className='pe-0 h-min py-1 text-right'>
                        Rendimiento<sup>*</sup>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {performance.map((exercise) => (
                      <TableRow key={exercise._id}>
                        <TableCell className='ps-0 py-1 whitespace-normal'>
                          {exercise.name}
                        </TableCell>
                        <TableCell className='py-1 text-center max-[460px]:hidden'>
                          {exercise.schemes.reduce(
                            (acc, scheme) => acc + scheme.sets,
                            0,
                          )}
                        </TableCell>
                        <TableCell className='pe-0 py-1 text-right whitespace-normal'>
                          {formatPerformance({ exercise })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Table>
                  <TableCaption className='mt-0 text-xs text-right'>
                    Rendimiento: Series × Reps × Peso(KG)
                  </TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead className='h-min py-1 max-[460px]:hidden'>
                        Series
                      </TableHead>
                      <TableHead className='pe-0 h-min py-1 text-right'>
                        Rendimiento<sup>*</sup>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className='pe-0 py-1'>
                        {performance[0]?.schemes.reduce(
                          (acc, scheme) => acc + scheme.sets,
                          0,
                        )}
                      </TableCell>
                      <TableCell className='pe-0 py-1 text-right'>
                        {formatPerformance({ exercise: performance[0] })}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )
            ) : null}
          </section>
        </Fragment>
      )}
    </article>
  )
}
