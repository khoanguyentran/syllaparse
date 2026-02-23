'use client'

import { useState, useEffect } from 'react'
import { FileText, CheckCircle, Calendar, Clock, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { Exam } from '@/types'
import api from '@/utils/api'
import { formatDate as formatDateHelper } from '@/utils/helpers'

interface ExamsProps {
  fileId: string | null
  onExamSelect: (exams: Exam[]) => void
  selectedExams: Exam[]
}

export default function Exams({ 
  fileId,
  onExamSelect,
  selectedExams
}: ExamsProps) {
  const [exams, setExams] = useState<Exam[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    if (fileId) {
      loadExams()
    } else {
      setExams([])
    }
  }, [fileId])

  const loadExams = async () => {
    if (!fileId) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await api.getExamsByFile(fileId)
      if (!response.ok) {
        throw new Error('Failed to load exams')
      }
      
      const data = await response.json()
      setExams(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load exams')
    } finally {
      setIsLoading(false)
    }
  }



  const formatDate = (dateString: string) => {
    return formatDateHelper(dateString, 'MMM d, yyyy')
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

  const handleExamToggle = (exam: Exam) => {
    const isSelected = selectedExams.some(e => e.id === exam.id)
    
    if (isSelected) {
      onExamSelect(selectedExams.filter(e => e.id !== exam.id))
    } else {
      onExamSelect([...selectedExams, exam])
    }
  }

  const handleSelectAll = () => {
    if (selectedExams.length === exams.length) {
      // If all are selected, deselect all
      onExamSelect([])
    } else {
      // Select all exams
      onExamSelect([...exams])
    }
  }



  if (!fileId) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Select a syllabus to view exams</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-red-50 to-orange-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01-2 2z" />
              </svg>
            </div>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="flex items-center space-x-2 hover:bg-red-100 rounded-lg p-2 transition-colors"
            >
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Exams & Tests</h3>
                <p className="text-sm text-gray-600">Important exams, prelims, and finals</p>
              </div>
              {isCollapsed ? (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              )}
            </button>
          </div>

          {exams.length > 0 && !isCollapsed && (
            <button
              onClick={handleSelectAll}
              className="px-3 py-1 text-xs font-medium text-red-600 bg-red-100 hover:bg-red-200 rounded-full transition-colors"
            >
              {selectedExams.length === exams.length ? 'Deselect All' : 'Select All'}
            </button>
          )}

        </div>
      </div>

      {!isCollapsed && (
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading exams...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              <p>{error}</p>
              <button
                onClick={loadExams}
                className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
              >
                Try again
              </button>
            </div>
          ) : exams.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-sm text-gray-500">No exams found for this syllabus</p>
            </div>
          ) : (
            <div className="space-y-6 p-2">
              {exams.map((exam) => {
                const isSelected = selectedExams.some(e => e.id === exam.id)
                
                return (
                  <div
                    key={exam.id}
                    className={`border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer m-1 ${
                      isSelected ? 'ring-2 ring-red-500 ring-opacity-50 bg-red-50 border-red-300' : ''
                    }`}
                    onClick={() => handleExamToggle(exam)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="text-2xl">📝</div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium text-gray-900 line-clamp-2">
                                {exam.description}
                              </h4>
                              {isSelected && (
                                <CheckCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span className="whitespace-nowrap">Exam Date: {formatDate(exam.date)}</span>
                          </div>
                          {exam.time_due && (
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>Exam Time: {formatTime(exam.time_due)}</span>
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
