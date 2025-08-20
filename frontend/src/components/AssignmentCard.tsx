'use client'

import { Assignment } from '@/types'
import { formatDate, formatTime, getDueStatus, getPriorityColor, getTypeIcon, getTypeLabel } from '@/utils/helpers'
import { Calendar, Clock, MapPin, BookOpen, AlertCircle } from 'lucide-react'
import clsx from 'clsx'

interface AssignmentCardProps {
  assignment: Assignment
  onEdit?: (assignment: Assignment) => void
  onDelete?: (id: string) => void
  showActions?: boolean
}

export default function AssignmentCard({ 
  assignment, 
  onEdit, 
  onDelete, 
  showActions = false 
}: AssignmentCardProps) {
  const dueStatus = getDueStatus(assignment.dueDate)

  const getStatusIcon = () => {
    switch (dueStatus.status) {
      case 'overdue':
        return <AlertCircle className="w-4 h-4 text-red-600" />
      case 'due-soon':
        return <Clock className="w-4 h-4 text-orange-600" />
      default:
        return <Calendar className="w-4 h-4 text-green-600" />
    }
  }

  const getStatusText = () => {
    switch (dueStatus.status) {
      case 'overdue':
        return `Overdue by ${dueStatus.days} day${dueStatus.days !== 1 ? 's' : ''}`
      case 'due-soon':
        return `Due in ${dueStatus.days} day${dueStatus.days !== 1 ? 's' : ''}`
      default:
        return `Due in ${dueStatus.days} day${dueStatus.days !== 1 ? 's' : ''}`
    }
  }

  return (
    <div className={clsx(
      "bg-white rounded-lg border transition-all duration-200 hover:shadow-md",
      dueStatus.status === 'overdue' ? 'border-red-200' : 'border-gray-200'
    )}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">
              {getTypeIcon(assignment.type)}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                {assignment.title}
              </h3>
              {assignment.course && (
                <p className="text-sm text-gray-600">{assignment.course}</p>
              )}
            </div>
          </div>
          
          {showActions && (
            <div className="flex items-center space-x-2">
              {onEdit && (
                <button
                  onClick={() => onEdit(assignment)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(assignment.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <AlertCircle className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Description */}
        {assignment.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {assignment.description}
          </p>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              {formatDate(assignment.dueDate)}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              {formatTime(assignment.dueDate)}
            </span>
          </div>

          {assignment.location && (
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                {assignment.location}
              </span>
            </div>
          )}

          {assignment.weight && (
            <div className="flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                {assignment.weight}% of grade
              </span>
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className={clsx(
            "px-2 py-1 text-xs font-medium rounded-full border",
            getPriorityColor(assignment.priority)
          )}>
            {assignment.priority.charAt(0).toUpperCase() + assignment.priority.slice(1)} Priority
          </span>
          
          <span className={clsx(
            "px-2 py-1 text-xs font-medium rounded-full",
            dueStatus.bg,
            dueStatus.color
          )}>
            {getTypeLabel(assignment.type)}
          </span>
        </div>

        {/* Status Bar */}
        <div className={clsx(
          "flex items-center justify-between p-3 rounded-lg",
          dueStatus.bg
        )}>
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className={clsx("text-sm font-medium", dueStatus.color)}>
              {getStatusText()}
            </span>
          </div>
          
          {assignment.materials && assignment.materials.length > 0 && (
            <div className="text-xs text-gray-500">
              {assignment.materials.length} material{assignment.materials.length !== 1 ? 's' : ''} required
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
