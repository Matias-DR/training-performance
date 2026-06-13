'use client'

import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
  keepPreviousData,
} from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { toast } from 'sonner'

import Header from '@/components/layout/header'
import ThemeProvider from '@/components/layout/theme/provider'

export interface Props {
  children: React.ReactNode
}

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (query.meta?.skipGlobalError) return
      if (error instanceof AxiosError && error.status)
        toast.error('Ah ocurrido un error al obtener la información.')
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      if (mutation.options.meta?.skipGlobalError) return
      if (error instanceof AxiosError && error.status)
        toast.error('Ah ocurrido un error al realizar la acción.')
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: false,
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
      placeholderData: keepPreviousData,
    },
    mutations: {
      retry: 1,
    },
  },
})

export default function Layout({ children }: Props) {
  return (
    <ThemeProvider
      attribute='class'
      defaultTheme='black'
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <Header className='border-b-2' />
        {children}
      </QueryClientProvider>
    </ThemeProvider>
  )
}
