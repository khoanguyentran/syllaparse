'use client'

import { useState, useEffect } from 'react'
import { FileText, CheckCircle, Calendar, Clock, BookOpen, ChevronDown, ChevronUp } from 'lucide-react'
import { BackendAssignment, Assignment } from '@/types'
import api from '@/utils/api'

interface AssignmentsProps {
  fileId: number | null
  onAssignmentSelect: (assignments: Assignment[]) => void
  selectedAssignments: Assignment[]
}

export default function Assignments({ 
  fileId,
  onAssignmentSelect,
  selectedAssignments
}: AssignmentsProps) {
  const [assignments, setAssignments] = useState<BackendAssignment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    if (fileId) {
      loadAssignments()
    } else {
      setAssignments([])
    }
  }, [fileId])

  const loadAssignments = async () => {
    if (!fileId) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await api.getAssignmentsByFile(fileId)
      if (!response.ok) {
        throw new Error('Failed to load assignments')
      }
      
      const data = await response.json()
      setAssignments(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assignments')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (timeString: string | null) => {
    if (!timeString) return null
    try {
      // timeString format is "HH:MM:SS" from backend
      const [hours, minutes] = timeString.split(':')
      const hour = parseInt(hours, 10)
      const minute = parseInt(minutes, 10)
      
      // Convert to 12-hour format
      const period = hour >= 12 ? 'PM' : 'AM'
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
      
      return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`
    } catch {
      return timeString
    }
  }

  const handleAssignmentToggle = (assignment: BackendAssignment) => {
    // Convert to Assignment format for selection
    const assignmentForSelection: Assignment = {
      id: assignment.id.toString(),
      title: assignment.description,
      dueDate: assignment.due_date,
      description: assignment.description,
      course: undefined,
      location: undefined
    }

    const isSelected = selectedAssignments.some(a => a.id === assignmentForSelection.id)
    
    if (isSelected) {
      onAssignmentSelect(selectedAssignments.filter(a => a.id !== assignmentForSelection.id))
    } else {
      onAssignmentSelect([...selectedAssignments, assignmentForSelection])
    }
  }

  const handleSelectAll = () => {
    if (selectedAssignments.length === assignments.length) {
      // If all are selected, deselect all
      onAssignmentSelect([])
    } else {
      // Select all assignments
      const allAssignments: Assignment[] = assignments.map((assignment) => ({
        id: assignment.id.toString(),
        title: assignment.description,
        dueDate: assignment.due_date,
        description: assignment.description,
        course: undefined,
        location: undefined
      }))
      onAssignmentSelect(allAssignments)
    }
  }



  if (!fileId) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center text-gray-500">
          <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Select a syllabus to view assignments</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="flex items-center space-x-2 hover:bg-blue-100 rounded-lg p-2 transition-colors"
            >
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Assignments & Projects</h3>
                <p className="text-sm text-gray-600">Homework, projects, and coursework</p>
              </div>
              {isCollapsed ? (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              )}
            </button>
          </div>

          {assignments.length > 0 && !isCollapsed && (
            <button
              onClick={handleSelectAll}
              className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-100 hover:bg-blue-200 rounded-full transition-colors"
            >
              {selectedAssignments.length === assignments.length ? 'Deselect All' : 'Select All'}
            </button>
          )}

        </div>
      </div>

      {!isCollapsed && (
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading assignments...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              <p>{error}</p>
              <button
                onClick={loadAssignments}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Try again
              </button>
            </div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <p className="text-sm text-gray-500">No assignments found for this syllabus</p>
            </div>
          ) : (
            <div className="space-y-6 max-h-[700px] overflow-y-auto p-2">
              {assignments.map((assignment) => {
                const isSelected = selectedAssignments.some(a => a.id === assignment.id.toString())
                
                return (
                  <div
                    key={assignment.id}
                    className={`border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer m-1 ${
                      isSelected ? 'ring-2 ring-blue-500 ring-opacity-50 bg-blue-50 border-blue-300' : ''
                    }`}
                    onClick={() => handleAssignmentToggle(assignment)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="text-2xl">📚</div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium text-gray-900 line-clamp-2">
                                {assignment.description}
                              </h4>
                              {isSelected && (
                                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>Due Date: {formatDate(assignment.due_date)}</span>
                          </div>
                          {assignment.due_time && (
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>Due Time: {formatTime(assignment.due_time)}</span>
                            </div>
                          )}

                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
