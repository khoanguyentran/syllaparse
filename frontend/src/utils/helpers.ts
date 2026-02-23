import { format, parseISO, isAfter, isBefore, addDays, differenceInDays } from 'date-fns'
import { Assignment } from '@/types'

export const formatDate = (dateString: string, formatString: string = 'PPP') => {
  try {
    return format(parseISO(dateString), formatString)
  } catch {
    return 'Invalid date'
  }
}

export const getDueStatus = (dueDate: string) => {
  const now = new Date()
  const due = parseISO(dueDate)
  
  if (isAfter(now, due)) {
    return { 
      status: 'overdue', 
      color: 'text-red-600', 
      bg: 'bg-red-50',
      days: Math.abs(differenceInDays(now, due))
    }
  } else if (isBefore(now, addDays(due, 7))) {
    return { 
      status: 'due-soon', 
      color: 'text-orange-600', 
      bg: 'bg-orange-50',
      days: differenceInDays(due, now)
    }
  } else {
    return { 
      status: 'upcoming', 
      color: 'text-green-600', 
      bg: 'bg-green-50',
      days: differenceInDays(due, now)
    }
  }
}

export const sortAssignmentsByDate = (assignments: Assignment[]) => {
  return [...assignments].sort((a, b) => 
    parseISO(a.date).getTime() - parseISO(b.date).getTime()
  )
}
