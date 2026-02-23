import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Returns a short relative time string (e.g. "6 seconds ago", "2 minutes ago"). */
export function formatRelativeTime(date: Date): string {
  const now = new Date()
  const secs = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (secs < 60) return secs <= 1 ? "1 second ago" : `${secs} seconds ago`
  const mins = Math.floor(secs / 60)
  if (mins < 60) return mins === 1 ? "1 minute ago" : `${mins} minutes ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return hours === 1 ? "1 hour ago" : `${hours} hours ago`
  const days = Math.floor(hours / 24)
  return days === 1 ? "1 day ago" : `${days} days ago`
}
