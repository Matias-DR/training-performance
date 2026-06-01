import type { HTMLAttributes } from 'react'

import { ModeToggle } from '@/components/layout/theme/toggle'
import { cn } from '@/lib/utils'

export default function Header({
  className,
  ...rest
}: HTMLAttributes<HTMLElement>) {
  return (
    <header
      className={cn(
        className,
        'p-4 flex justify-end sticky top-0 z-10 bg-background',
      )}
      {...rest}
    >
      <ModeToggle />
    </header>
  )
}
