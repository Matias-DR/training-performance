import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatURL(url: string, parameters?: object) {
  if (!parameters || Object.entries(parameters).length === 0) return url

  let formattedUrl = url
  const searchParams = new URLSearchParams()

  Object.entries(parameters).forEach(([key, _value]) => {
    const placeholder = `{${key}}`

    if (_value === null || _value === undefined) return

    const value = _value instanceof Date ? _value.toISOString() : String(_value)

    if (formattedUrl.includes(placeholder)) {
      formattedUrl = formattedUrl.replace(placeholder, String(value))
    } else {
      searchParams.append(key, String(value))
    }
  })

  const queryString = searchParams.toString()
  if (queryString !== '') {
    formattedUrl += formattedUrl.includes('?') ? '&' : '?'
    formattedUrl += queryString
  }

  return formattedUrl
}

export const NumberFormat = (
  value: number,
  options?: Intl.NumberFormatOptions,
) => new Intl.NumberFormat('es-AR', options).format(value)
