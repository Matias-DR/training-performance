/** biome-ignore-all lint/suspicious/noExplicitAny: <any> */

import type {
  UseMutationOptions as UseMO,
  UseQueryOptions as UseQO,
} from '@tanstack/react-query'

export interface QueryKey {
  queryKey: unknown[]
}

export interface QueryKeys {
  queryKeys: Array<QueryKey['queryKey']>
}

export type UseQueryOptions<
  TQueryFnData extends (...args: any) => any,
  TData extends (...args: any) => any = TQueryFnData,
  TError = Error,
> = Omit<
  UseQO<Awaited<ReturnType<TQueryFnData>>, TError, Awaited<ReturnType<TData>>>,
  'queryKey' | 'queryFn'
>

export type UseMutationOptions<
  TData extends (...args: any) => any,
  TVariables extends (...args: any) => any = TData,
  TError = Error,
  TContext = unknown,
> = Omit<
  UseMO<
    Awaited<ReturnType<TData>>,
    TError,
    Parameters<TVariables>[number],
    TContext
  >,
  'mutationKey' | 'mutationFn'
>
