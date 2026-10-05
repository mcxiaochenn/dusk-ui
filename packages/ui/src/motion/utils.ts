import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** 合并 className，Tailwind 冲突以最后传入的为准。 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}