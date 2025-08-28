import { format, parseISO, isAfter, isBefore, addDays, differenceInDays } from 'date-fns'
import { Assignment } from '@/types'

export const formatDate = (dateString: string, formatString: string = 'PPP') => {
  try {
    return format(parseISO(dateString), formatString)
  } catch {
    return 'Invalid date'
  }
}

export const formatTime = (dateString: string) => {
  try {
    return format(parseISO(dateString), 'p')
  } catch {
    return 'Invalid time'
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
    parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime()
  )
}

export const filterAssignments = (
  assignments: Assignment[], 
  filters: { 
    course?: string
    searchQuery?: string
  }
) => {
  return assignments.filter(assignment => {
    if (filters.course && assignment.course !== filters.course) return false
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      const matches = 
        assignment.title.toLowerCase().includes(query) ||
        assignment.description?.toLowerCase().includes(query) ||
        assignment.course?.toLowerCase().includes(query)
      if (!matches) return false
    }
    return true
  })
}

export const getUpcomingAssignments = (assignments: Assignment[], days: number = 7) => {
  const now = new Date()
  const futureDate = addDays(now, days)
  
  return assignments.filter(assignment => {
    const dueDate = parseISO(assignment.dueDate)
    return isAfter(dueDate, now) && isBefore(dueDate, futureDate)
  })
}

export const getOverdueAssignments = (assignments: Assignment[]) => {
  const now = new Date()
  return assignments.filter(assignment => 
    isAfter(now, parseISO(assignment.dueDate))
  )
}
