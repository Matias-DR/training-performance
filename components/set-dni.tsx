'use client'

import type { FormHTMLAttributes } from 'react'

import z from 'zod'

import { Controller, useForm } from 'react-hook-form'

import { cn } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Button } from './ui/button'
import { Field, FieldError, FieldLabel } from './ui/field'
import { Input } from './ui/input'

const schema = z.object({
  dni: z.string().trim().regex(/^\d+$/, 'Solo números'),
})
type Schema = z.infer<typeof schema>

export interface Props {
  onSubmit: (values: Schema) => void
}

export default function SetDNI({
  onSubmit,
  className,
  ...rest
}: Omit<FormHTMLAttributes<HTMLFormElement>, 'onSubmit'> & Props) {
  const form = useForm<Schema>({
    resolver: zodResolver(schema),
    defaultValues: { dni: '' },
  })

  return (
    <form
      id='dni-form'
      onSubmit={form.handleSubmit(onSubmit)}
      className={cn('flex flex-col gap-2', className)}
      {...rest}
    >
      <Controller
        name='dni'
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor='dni-form-field'>
              o podés ingresar tu DNI para buscarla nuevamente
            </FieldLabel>
            <Input
              {...field}
              id='dni-form-title'
              aria-invalid={fieldState.invalid}
              placeholder='XXXXXXXX'
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Button
        type='submit'
        disabled={form.formState.isSubmitting || !form.formState.isValid}
      >
        Buscar
      </Button>
    </form>
  )
}

export const useSetDNIAsPathParam = () => {
  const { push } = useRouter()

  function setDNIAsPathParam(values: Schema) {
    push(`/${values.dni}`)
  }

  return { setDNIAsPathParam }
}
