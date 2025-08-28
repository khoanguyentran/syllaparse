'use client'

import { useState, useEffect } from 'react'
import { Clock, MapPin, Calendar, CheckCircle } from 'lucide-react'
import { Lecture } from '@/types'
import api from '@/utils/api'

interface LectureTimesProps {
  fileId: number | null
  onLectureSelect: (lectures: Lecture[]) => void
  selectedLectures: Lecture[]
}

export default function LectureTimes({ 
  fileId, 
  onLectureSelect, 
  selectedLectures 
}: LectureTimesProps) {
  const [lectures, setLectures] = useState<Lecture[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (fileId) {
      loadLectures()
    } else {
      setLectures([])
    }
  }, [fileId])

  const loadLectures = async () => {
    if (!fileId) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await api.getLecturesByFile(fileId)
      if (!response.ok) {
        throw new Error('Failed to load lecture times')
      }
      
      const data = await response.json()
      setLectures(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load lecture times')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLectureToggle = (lecture: Lecture) => {
    const isSelected = selectedLectures.some(l => l.id === lecture.id)
    
    if (isSelected) {
      onLectureSelect(selectedLectures.filter(l => l.id !== lecture.id))
    } else {
      onLectureSelect([...selectedLectures, lecture])
    }
  }

  const handleSelectAll = () => {
    if (selectedLectures.length === lectures.length) {
      // If all are selected, deselect all
      onLectureSelect([])
    } else {
      // Select all lectures
      onLectureSelect([...lectures])
    }
  }

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getDayName = (day: number) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    return days[day] || 'Unknown'
  }

  const groupLecturesByDay = () => {
    const grouped: { [key: string]: Lecture[] } = {}
    
    lectures.forEach(lecture => {
      const dayName = getDayName(lecture.day)
      if (!grouped[dayName]) {
        grouped[dayName] = []
      }
      grouped[dayName].push(lecture)
    })
    
    return grouped
  }

  if (!fileId) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center text-gray-500">
          <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Select a syllabus to view lecture times</p>
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
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Course Schedule</h3>
              <p className="text-sm text-gray-600">Weekly class times and locations</p>
            </div>
          </div>

          {lectures.length > 0 && (
            <button
              onClick={handleSelectAll}
              className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-100 hover:bg-blue-200 rounded-full transition-colors"
            >
              {selectedLectures.length === lectures.length ? 'Deselect All' : 'Select All'}
            </button>
          )}
        </div>
      </div>

      <div className="p-6">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading lecture times...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            <p>{error}</p>
            <button
              onClick={loadLectures}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Try again
            </button>
          </div>
        ) : lectures.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No lecture times found for this syllabus</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupLecturesByDay()).map(([dayName, dayLectures]) => (
              <div key={dayName} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h4 className="font-medium text-gray-900">{dayName}</h4>
                </div>
                
                <div className="divide-y divide-gray-200">
                  {dayLectures.map((lecture) => {
                    const isSelected = selectedLectures.some(l => l.id === lecture.id)
                    
                    return (
                      <div
                        key={lecture.id}
                        className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                          isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                        }`}
                        onClick={() => handleLectureToggle(lecture)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center space-x-2">
                                <Clock className="w-4 h-4 text-gray-500" />
                                <span className="text-sm font-medium text-gray-900">
                                  {formatTime(lecture.start_time)} - {formatTime(lecture.end_time)}
                                </span>
                                {/* Session Type Badge */}
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  lecture.type === 'lab' 
                                    ? 'bg-green-100 text-green-800' 
                                    : lecture.type === 'discussion' 
                                    ? 'bg-purple-100 text-purple-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {lecture.type === 'lab' ? 'Lab' : 
                                   lecture.type === 'discussion' ? 'Discussion' : 'Lecture'}
                                </span>
                              </div>
                              
                              {lecture.location && (
                                <div className="flex items-center space-x-1">
                                  <MapPin className="w-3 h-3 text-gray-400" />
                                  <span className="text-xs text-gray-500">{lecture.location}</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3" />
                                <span>
                                  {formatDate(lecture.start_date)} - {formatDate(lecture.end_date)}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="ml-4">
                            {isSelected ? (
                              <CheckCircle className="w-5 h-5 text-blue-600" />
                            ) : (
                              <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
