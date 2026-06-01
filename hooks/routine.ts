import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type {
  QueryKey,
  QueryKeys,
  UseMutationOptions,
  UseQueryOptions,
} from '@/domain/index'
import type { Client } from '@/domain/routine'

import {
  ENDPOINTS,
  getClient,
  type GetRoutineProps,
  postPerformance,
  type PostPerformanceProps,
} from '@/controllers/routine'

export const keys = {
  routine: (params: GetRoutineProps['params']) => [ENDPOINTS.routine, params],
  performance: (params: PostPerformanceProps['params']) => [
    ENDPOINTS.performance,
    params,
  ],
}

export function useGetClient({
  params,
  queryKey,
  ...rest
}: UseQueryOptions<typeof getClient> & Partial<QueryKey> & GetRoutineProps) {
  return useQuery({
    queryKey: keys.routine(params),
    queryFn: () => getClient({ params }),
    ...rest,
  })
}

export function useSetPerformance({
  params,
  queryKeys,
  ...rest
}: UseMutationOptions<
  typeof postPerformance,
  ({
    body,
  }: Pick<PostPerformanceProps, 'body'>) => ReturnType<typeof postPerformance>
> &
  Pick<PostPerformanceProps, 'params'> &
  QueryKeys) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: keys.performance(params),

    mutationFn: ({ body }: Pick<PostPerformanceProps, 'body'>) =>
      postPerformance({ params, body }),

    onMutate: async ({ body }) => {
      const routineKey = keys.routine({
        dni: params.dni,
      })

      await queryClient.cancelQueries({
        queryKey: routineKey,
      })

      const previous = queryClient.getQueryData<Client>(routineKey)

      queryClient.setQueryData<Client>(routineKey, (current) => {
        if (!current) return current

        return {
          ...current,
          routine: {
            ...current.routine,
            sessions: current.routine.sessions.map((session) => {
              if (session.week !== params.week || session.day !== params.day) {
                return session
              }

              return {
                ...session,
                exercises: session.exercises.map((exerciseGroup) => {
                  if (exerciseGroup._id !== params.group) {
                    return exerciseGroup
                  }

                  const performance = Object.values(
                    body.performed.reduce<
                      Record<
                        string,
                        {
                          _id: string
                          name: string
                          schemes: Array<{
                            sets: number
                            repetitions: number
                            weight: number
                          }>
                        }
                      >
                    >((acc, item) => {
                      if (!acc[item._id]) {
                        const objective = exerciseGroup.objectives.find(
                          (e) => e._id === item._id,
                        )

                        acc[item._id] = {
                          _id: item._id,
                          name: objective?.name ?? '',
                          schemes: [],
                        }
                      }

                      acc[item._id].schemes.push({
                        sets: item.sets,
                        repetitions: item.repetitions,
                        weight: item.weight,
                      })

                      return acc
                    }, {}),
                  )

                  return {
                    ...exerciseGroup,
                    performance,
                  }
                }),
              }
            }),
          },
        }
      })

      return { previous }
    },

    onError: (_error, _variables, context: any) => {
      if (context?.previous) {
        queryClient.setQueryData(
          keys.routine({
            dni: params.dni,
          }),
          context.previous,
        )
      }
    },

    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: keys.routine({
          dni: params.dni,
        }),
      })

      await queryClient.invalidateQueries({
        queryKey: keys.performance(params),
      })
    },

    ...rest,
  })
}
