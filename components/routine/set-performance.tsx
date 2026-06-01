import { zodResolver } from '@hookform/resolvers/zod'
import { TrashIcon } from 'lucide-react'
import { useMemo } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { Fragment } from 'react/jsx-runtime'
import { z } from 'zod'

import type { PostPerformanceProps } from '@/controllers/routine'
import type { QueryKeys } from '@/domain'
import type { Exercise, ExercisePerformance } from '@/domain/routine'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useSetPerformance } from '@/hooks/routine'
import { cn } from '@/lib/utils'

export type Props = {
  exercises: Pick<Exercise, '_id' | 'name'>[]
  name: string
  performance?: ExercisePerformance[]
  postPerformanceParams: PostPerformanceProps['params']
}

const schema = z.object({
  performed: z.array(
    z.object({
      _id: z.string(),
      sets: z.number().int().min(1),
      repetitions: z.number().int().min(1),
      weight: z.number().min(0),
    }),
  ),
})

export default function SetPerformance({
  queryKeys,
  name,
  exercises,
  performance,
  postPerformanceParams: params,
  asChild = true,
  ...rest
}: Parameters<typeof DialogTrigger>[number] & QueryKeys & Props) {
  const { mutate: setPerformance, isPending: isSetPerformancePending } =
    useSetPerformance({
      params,
      queryKeys,
    })

  const defaultPerformed = useMemo<PostPerformanceProps['body']['performed']>(
    () =>
      performance?.flatMap((exercise) =>
        exercise.schemes.map((scheme) => ({
          _id: exercise._id,
          sets: scheme.sets,
          repetitions: scheme.repetitions,
          weight: scheme.weight,
        })),
      ) ?? [],
    [performance],
  )

  const form = useForm<PostPerformanceProps['body']>({
    resolver: zodResolver(schema),
    defaultValues: { performed: defaultPerformed },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'performed',
  })

  const items = useMemo(
    () =>
      exercises.map((exercise) => ({
        label: exercise.name,
        value: exercise._id,
      })),
    [],
  )

  const isCompoundExercise = items.length > 1

  return (
    <Dialog>
      <DialogTrigger asChild={asChild} {...rest}>
        <Button size='xs'>Ingresar resultados</Button>
      </DialogTrigger>
      <DialogContent className='max-lg:max-w-[75svw]! max-h-[95svh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>{name}</DialogTitle>
          <DialogDescription>
            Ingrese el número de repeticiones realizadas y el peso utilizado en
            cada serie.
          </DialogDescription>
        </DialogHeader>
        {isCompoundExercise ? (
          <Select
            value={''}
            onValueChange={(item) =>
              append({ _id: item, sets: 0, repetitions: 0, weight: 0 })
            }
          >
            <SelectTrigger asChild>
              <Button className='ml-auto'>Agregar Series</Button>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {items.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        ) : (
          <Button
            onClick={() =>
              append({
                _id: items[0]?.value,
                sets: 0,
                repetitions: 0,
                weight: 0,
              })
            }
            className='ml-auto'
          >
            Agregar Series
          </Button>
        )}

        <ScrollArea className='-mr-2 pr-2'>
          <form
            id={`performance-${name}-form`}
            onSubmit={form.handleSubmit((body) => setPerformance({ body }))}
            className='flex flex-wrap gap-4 max-h-[45svh]'
          >
            {fields.map((field, index) => {
              const setsFieldState = form.getFieldState(
                `performed.${index}.sets`,
              )
              const repetitionsFieldState = form.getFieldState(
                `performed.${index}.repetitions`,
              )
              const weightFieldState = form.getFieldState(
                `performed.${index}.weight`,
              )

              return (
                <div
                  key={field.id}
                  className={cn(
                    'relative lg:hidden flex flex-col p-4 border rounded-md',
                    !isCompoundExercise && 'py-2',
                  )}
                >
                  <Button
                    type='button'
                    size='icon'
                    variant='destructive'
                    onClick={() => remove(index)}
                    className='absolute top-0 right-0 w-auto h-auto bg-transparent! p-1'
                  >
                    <TrashIcon />
                  </Button>
                  {isCompoundExercise ? (
                    <Fragment>
                      <p className='min-h-max pb-2 max-w-45'>
                        {items.find((item) => item.value === field._id)?.label}
                      </p>
                      <Separator />
                    </Fragment>
                  ) : null}
                  <Controller
                    control={form.control}
                    name={`performed.${index}.sets`}
                    render={({ field, fieldState }) => (
                      <Field
                        data-invalid={fieldState.invalid}
                        className='flex-row'
                      >
                        <FieldLabel htmlFor={field.name}>Series</FieldLabel>
                        <Input
                          {...field}
                          id={field.name}
                          value={(field.value as number) ?? ''}
                          type='number'
                          placeholder='4'
                          onChange={(e) =>
                            field.onChange(
                              e.target.valueAsNumber != null &&
                                !Number.isNaN(e.target.valueAsNumber)
                                ? e.target.valueAsNumber
                                : '',
                            )
                          }
                          className='max-w-20'
                        />
                        {setsFieldState.invalid ? (
                          <FieldError errors={[setsFieldState.error]} />
                        ) : null}
                      </Field>
                    )}
                  />
                  <Controller
                    control={form.control}
                    name={`performed.${index}.repetitions`}
                    render={({ field, fieldState }) => (
                      <Field
                        data-invalid={fieldState.invalid}
                        className='flex-row'
                      >
                        <FieldLabel htmlFor={field.name}>Reps</FieldLabel>
                        <Input
                          {...field}
                          id={field.name}
                          value={(field.value as number) ?? ''}
                          type='number'
                          placeholder='4'
                          onChange={(e) =>
                            field.onChange(
                              e.target.valueAsNumber != null &&
                                !Number.isNaN(e.target.valueAsNumber)
                                ? e.target.valueAsNumber
                                : '',
                            )
                          }
                          className='max-w-20'
                        />
                        {repetitionsFieldState.invalid ? (
                          <FieldError errors={[repetitionsFieldState.error]} />
                        ) : null}
                      </Field>
                    )}
                  />
                  <Controller
                    control={form.control}
                    name={`performed.${index}.weight`}
                    render={({ field, fieldState }) => (
                      <Field
                        data-invalid={fieldState.invalid}
                        className='flex-row'
                      >
                        <FieldLabel htmlFor={field.name}>Peso (KG)</FieldLabel>
                        <Input
                          {...field}
                          id={field.name}
                          value={(field.value as number) ?? ''}
                          type='number'
                          placeholder='10'
                          onChange={(e) =>
                            field.onChange(
                              e.target.valueAsNumber != null &&
                                !Number.isNaN(e.target.valueAsNumber)
                                ? e.target.valueAsNumber
                                : '',
                            )
                          }
                          className='max-w-20'
                        />
                        {weightFieldState.invalid ? (
                          <FieldError errors={[weightFieldState.error]} />
                        ) : null}
                      </Field>
                    )}
                  />
                </div>
              )
            })}

            <Table className='max-lg:hidden'>
              <TableHeader className='sticky top-0 bg-card'>
                <TableRow>
                  {isCompoundExercise ? <TableHead>Ejercicio</TableHead> : null}
                  <TableHead>Series</TableHead>
                  <TableHead>Reps</TableHead>
                  <TableHead>Peso</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field, index) => {
                  const setsFieldState = form.getFieldState(
                    `performed.${index}.sets`,
                  )
                  const repetitionsFieldState = form.getFieldState(
                    `performed.${index}.repetitions`,
                  )
                  const weightFieldState = form.getFieldState(
                    `performed.${index}.weight`,
                  )

                  return (
                    <Fragment key={field.id}>
                      <TableRow>
                        {isCompoundExercise ? (
                          <TableCell>
                            {
                              items.find((item) => item.value === field._id)
                                ?.label
                            }
                          </TableCell>
                        ) : null}
                        <TableCell>
                          <Controller
                            control={form.control}
                            name={`performed.${index}.sets`}
                            render={({ field, fieldState }) => (
                              <Field data-invalid={fieldState.invalid}>
                                <Input
                                  {...field}
                                  value={(field.value as number) ?? ''}
                                  type='number'
                                  placeholder='4'
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.valueAsNumber != null &&
                                        !Number.isNaN(e.target.valueAsNumber)
                                        ? e.target.valueAsNumber
                                        : '',
                                    )
                                  }
                                />
                              </Field>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <Controller
                            control={form.control}
                            name={`performed.${index}.repetitions`}
                            render={({ field, fieldState }) => (
                              <Field data-invalid={fieldState.invalid}>
                                <Input
                                  {...field}
                                  value={(field.value as number) ?? ''}
                                  type='number'
                                  placeholder='4'
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.valueAsNumber != null &&
                                        !Number.isNaN(e.target.valueAsNumber)
                                        ? e.target.valueAsNumber
                                        : '',
                                    )
                                  }
                                />
                              </Field>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <Controller
                            control={form.control}
                            name={`performed.${index}.weight`}
                            render={({ field, fieldState }) => (
                              <Field data-invalid={fieldState.invalid}>
                                <Input
                                  {...field}
                                  value={(field.value as number) ?? ''}
                                  type='number'
                                  placeholder='10'
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.valueAsNumber != null &&
                                        !Number.isNaN(e.target.valueAsNumber)
                                        ? e.target.valueAsNumber
                                        : '',
                                    )
                                  }
                                />
                              </Field>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            type='button'
                            size='icon'
                            variant='destructive'
                            onClick={() => remove(index)}
                          >
                            <TrashIcon />
                          </Button>
                        </TableCell>
                      </TableRow>
                      {setsFieldState.invalid ||
                      repetitionsFieldState.invalid ||
                      weightFieldState.invalid ? (
                        <TableRow>
                          <TableCell>
                            <FieldError errors={[setsFieldState.error]} />
                          </TableCell>
                          <TableCell>
                            <FieldError
                              errors={[repetitionsFieldState.error]}
                            />
                          </TableCell>
                          <TableCell>
                            <FieldError errors={[weightFieldState.error]} />
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </Fragment>
                  )
                })}
              </TableBody>
            </Table>
          </form>
        </ScrollArea>
        <DialogFooter>
          <Button
            form={`performance-${name}-form`}
            disabled={
              !form.formState.isDirty ||
              !form.formState.isValid ||
              isSetPerformancePending
            }
            className='w-full'
          >
            Guardar cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
