'use client'

import { Assignment } from '@/types'
import { formatDate, formatTime, getDueStatus } from '@/utils/helpers'
import { Calendar, Clock, MapPin, BookOpen, AlertCircle, Download, CheckCircle } from 'lucide-react'
import clsx from 'clsx'

interface AssignmentCardProps {
  assignment: Assignment
  onEdit?: (assignment: Assignment) => void
  onDelete?: (id: string) => void
  onExportToCalendar?: (assignment: Assignment) => void
  showActions?: boolean
  isSelected?: boolean
  onClick?: () => void
}

export default function AssignmentCard({ 
  assignment, 
  onEdit, 
  onDelete, 
  onExportToCalendar,
  showActions = false,
  isSelected = false,
  onClick
}: AssignmentCardProps) {
  return (
    <div 
      className={clsx(
        "bg-white border-l-4 transition-all duration-200 hover:shadow-md cursor-pointer border-l-gray-300",
        isSelected && "ring-2 ring-blue-500 ring-opacity-50 bg-blue-50",
        onClick && "hover:bg-gray-50"
      )}
      onClick={onClick}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">
              📋
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                  {assignment.description}
                </h3>
                {isSelected && (
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                )}
              </div>

            </div>
          </div>
          
          {showActions && (
            <div className="flex items-center space-x-2">
              {onExportToCalendar && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onExportToCalendar(assignment)
                  }}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Export to Google Calendar"
                >
                  <Download className="w-4 h-4" />
                </button>
              )}
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(assignment)
                  }}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit assignment"
                >
                  <BookOpen className="w-4 h-4" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(assignment.id.toString())
                  }}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete assignment"
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
              Due: {formatDate(assignment.date)}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              {formatTime(assignment.date)}
            </span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className={clsx(
            "px-2 py-1 text-xs font-medium rounded-full",
            getDueStatus(assignment.date).bg,
            getDueStatus(assignment.date).color
          )}>
            Assignment
          </span>
        </div>
      </div>
    </div>
  )
}
