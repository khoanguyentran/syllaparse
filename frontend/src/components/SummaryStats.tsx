'use client'

import { Assignment } from '@/types'
import { getUpcomingAssignments, getOverdueAssignments } from '@/utils/helpers'
import { AlertCircle, Clock, CheckCircle, BookOpen, TrendingUp, Calendar } from 'lucide-react'

interface SummaryStatsProps {
  assignments: Assignment[]
}

export default function SummaryStats({ assignments }: SummaryStatsProps) {
  const totalAssignments = assignments.length
  const overdueAssignments = getOverdueAssignments(assignments)
  const dueSoonAssignments = getUpcomingAssignments(assignments, 7)
  const highPriorityAssignments = assignments.filter(a => a.priority === 'high')
  const completedAssignments = assignments.filter(a => a.completed) // Assuming we add completed field later
  const upcomingExams = assignments.filter(a => a.type === 'exam' && new Date(a.dueDate) > new Date())

  const stats = [
    {
      label: 'Total Assignments',
      value: totalAssignments,
      icon: BookOpen,
      color: 'bg-blue-100 text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      label: 'Due Soon (7 days)',
      value: dueSoonAssignments.length,
      icon: Clock,
      color: 'bg-orange-100 text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      label: 'High Priority',
      value: highPriorityAssignments.length,
      icon: AlertCircle,
      color: 'bg-red-100 text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      label: 'Upcoming Exams',
      value: upcomingExams.length,
      icon: TrendingUp,
      color: 'bg-purple-100 text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      label: 'Overdue',
      value: overdueAssignments.length,
      icon: AlertCircle,
      color: 'bg-red-100 text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      label: 'Completed',
      value: completedAssignments.length,
      icon: CheckCircle,
      color: 'bg-green-100 text-green-600',
      bgColor: 'bg-green-50'
    }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {stats.map((stat, index) => {
        const IconComponent = stat.icon
        return (
          <div 
            key={index}
            className={`bg-white p-4 rounded-lg shadow-sm border border-gray-200 ${stat.bgColor}`}
          >
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <IconComponent className="w-5 h-5" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
