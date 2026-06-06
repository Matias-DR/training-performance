'use client'

import SetDNI, { useSetDNIAsPathParam } from '@/components/set-dni'

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { UserSearchIcon } from 'lucide-react'

export default function Home() {
  const { setDNIAsPathParam, isLoading } = useSetDNIAsPathParam()

  return (
    <main className='p-6'>
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant='icon'>
            <UserSearchIcon />
          </EmptyMedia>
          <EmptyTitle>Training Performance</EmptyTitle>
          <EmptyDescription>
            Accedé a través del enlace que tu entrenador/a te dió para que
            podamos buscar tu rutina
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <SetDNI onSubmit={setDNIAsPathParam} isLoading={isLoading} />
        </EmptyContent>
      </Empty>
    </main>
  )
}
