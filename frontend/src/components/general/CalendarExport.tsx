'use client'

import { useState, useEffect } from 'react'
import { Calendar, CheckCircle, AlertCircle, Plus } from 'lucide-react'
import { Lecture, Assignment, Exam, CalendarEvent } from '@/types'

interface CalendarExportProps {
  selectedLectures: Lecture[]
  selectedAssignments: Assignment[]
  selectedExams: Exam[]
  onExportComplete: () => void
}

export default function CalendarExport({ 
  selectedLectures, 
  selectedAssignments, 
  selectedExams,
  onExportComplete 
}: CalendarExportProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [exportMessage, setExportMessage] = useState('')
  const [hasGoogleAccess, setHasGoogleAccess] = useState(false)
  const [isCheckingAccess, setIsCheckingAccess] = useState(true)

  const totalItems = selectedLectures.length + selectedAssignments.length + selectedExams.length

  // Check if user has Google Calendar access
  useEffect(() => {
    const checkGoogleAccess = async () => {
      try {
        // Check if we have a valid Google access token
        const token = localStorage.getItem('google_access_token')
        if (token) {
          // Verify token is still valid by making a test API call
          const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          setHasGoogleAccess(response.ok)
        } else {
          setHasGoogleAccess(false)
        }
      } catch (error) {
        setHasGoogleAccess(false)
      } finally {
        setIsCheckingAccess(false)
      }
    }

    checkGoogleAccess()
  }, [])

  const createCalendarEvents = (): CalendarEvent[] => {
    const events: CalendarEvent[] = []
    const now = new Date()
    const currentYear = now.getFullYear()

    // Create events for selected lectures (recurring weekly)
    selectedLectures.forEach(lecture => {
      const startDate = new Date(lecture.start_date)
      const endDate = new Date(lecture.end_date)
      
      // Create weekly recurring events
      let currentDate = new Date(startDate)
      while (currentDate <= endDate) {
        // Set to the correct day of week
        const targetDay = (lecture.day + 1) % 7 // Convert 0-6 (Mon-Sun) to 1-7 (Sun-Sat)
        const daysToAdd = (targetDay - currentDate.getDay() + 7) % 7
        currentDate.setDate(currentDate.getDate() + daysToAdd)
        
        if (currentDate <= endDate) {
          const startTime = new Date(`2000-01-01T${lecture.start_time}`)
          const endTime = new Date(`2000-01-01T${lecture.end_time}`)
          
          const eventStart = new Date(currentDate)
          eventStart.setHours(startTime.getHours(), startTime.getMinutes())
          
          const eventEnd = new Date(currentDate)
          eventEnd.setHours(endTime.getHours(), endTime.getMinutes())
          
          events.push({
            summary: `Lecture: ${lecture.location || 'Class'}`,
            description: `Weekly lecture session`,
            start: {
              dateTime: eventStart.toISOString(),
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            end: {
              dateTime: eventEnd.toISOString(),
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            location: lecture.location || undefined
          })
          
          // Move to next week
          currentDate.setDate(currentDate.getDate() + 7)
        }
      }
    })

    // Create events for selected assignments
    selectedAssignments.forEach(assignment => {
      const dueDate = new Date(assignment.dueDate)
      const eventStart = new Date(dueDate)
      eventStart.setHours(9, 0, 0, 0) // Set to 9 AM on due date
      
      const eventEnd = new Date(dueDate)
      eventEnd.setHours(10, 0, 0, 0) // Set to 10 AM on due date
      
      events.push({
        summary: `Assignment: ${assignment.title}`,
        description: `Due: ${assignment.description || assignment.title}`,
        start: {
          dateTime: eventStart.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: eventEnd.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        location: assignment.location || undefined
      })
    })

    // Create events for selected exams
    selectedExams.forEach(exam => {
      const examDate = new Date(exam.examDate)
      const eventStart = new Date(examDate)
      eventStart.setHours(9, 0, 0, 0) // Set to 9 AM on exam date
      
      const eventEnd = new Date(examDate)
      eventEnd.setHours(11, 0, 0, 0) // Set to 11 AM on exam date (2 hour duration)
      
      events.push({
        summary: `Exam: ${exam.title}`,
        description: `Exam: ${exam.description || exam.title}`,
        start: {
          dateTime: eventStart.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: eventEnd.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        location: exam.location || undefined
      })
    })

    return events
  }

  const exportToGoogleCalendar = async () => {
    if (totalItems === 0) {
      setExportStatus('error')
      setExportMessage('Please select at least one lecture or assignment to export')
      return
    }

    if (!hasGoogleAccess) {
      setExportStatus('error')
      setExportMessage('Google Calendar access required. Please sign in with Google and grant calendar permissions.')
      return
    }

    setIsExporting(true)
    setExportStatus('idle')
    setExportMessage('')

    try {
      const events = createCalendarEvents()
      const token = localStorage.getItem('google_access_token')
      
      if (!token) {
        throw new Error('No Google access token found')
      }

      // Create events in Google Calendar
      let successCount = 0
      let errorCount = 0

      for (const event of events) {
        try {
          const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              summary: event.summary,
              description: event.description,
              start: event.start,
              end: event.end,
              location: event.location,
              reminders: {
                useDefault: false,
                overrides: [
                  { method: 'popup', minutes: 30 },
                  { method: 'email', minutes: 60 }
                ]
              }
            })
          })

          if (response.ok) {
            successCount++
          } else {
            errorCount++
          }
        } catch (error) {
          errorCount++
        }
      }

      if (errorCount === 0) {
        setExportStatus('success')
        setExportMessage(`Successfully added ${successCount} events to your Google Calendar!`)
        onExportComplete()
      } else if (successCount > 0) {
        setExportStatus('success')
        setExportMessage(`Added ${successCount} events to Google Calendar. ${errorCount} events failed.`)
        onExportComplete()
      } else {
        setExportStatus('error')
        setExportMessage('Failed to add events to Google Calendar. Please try again.')
      }
      
    } catch (error) {
      setExportStatus('error')
      setExportMessage('Failed to export calendar events. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const requestGoogleAccess = () => {
    // This would typically trigger the Google OAuth flow
    // For now, we'll show a message to the user
    setExportStatus('error')
    setExportMessage('Please sign in with Google and grant calendar permissions to use this feature.')
  }

  const getStatusIcon = () => {
    switch (exportStatus) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />
      default:
        return <Calendar className="w-5 h-5 text-blue-600" />
    }
  }

  const getStatusColor = () => {
    switch (exportStatus) {
      case 'success':
        return 'text-green-600'
      case 'error':
        return 'text-red-600'
      default:
        return 'text-blue-600'
    }
  }

  if (isCheckingAccess) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Checking Google Calendar access...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          <Calendar className="w-5 h-5 inline mr-2 text-blue-600" />
          Add to Google Calendar
        </h3>
        {totalItems > 0 && (
          <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
            {totalItems} selected
          </span>
        )}
      </div>

      <div className="space-y-4">
        <div className="text-sm text-gray-600">
          <p>Add selected lectures and assignments directly to your Google Calendar:</p>
          <ul className="mt-2 space-y-1">
            {selectedLectures.length > 0 && (
              <li>• {selectedLectures.length} lecture/discussion times (recurring weekly)</li>
            )}
            {selectedAssignments.length > 0 && (
              <li>• {selectedAssignments.length} assignments (due dates)</li>
            )}
            {selectedExams.length > 0 && (
              <li>• {selectedExams.length} exams (exam dates)</li>
            )}
          </ul>
        </div>

        {exportStatus !== 'idle' && (
          <div className={`flex items-center space-x-2 p-3 rounded-lg ${
            exportStatus === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            {getStatusIcon()}
            <span className={`text-sm font-medium ${getStatusColor()}`}>
              {exportMessage}
            </span>
          </div>
        )}

        {!hasGoogleAccess ? (
          <div className="space-y-3">
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                <span className="text-sm text-yellow-800">
                  Google Calendar access required
                </span>
              </div>
            </div>
            <button
              onClick={requestGoogleAccess}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <Calendar className="w-4 h-4" />
              <span>Connect Google Calendar</span>
            </button>
          </div>
        ) : (
          <button
            onClick={exportToGoogleCalendar}
            disabled={isExporting || totalItems === 0}
            className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors ${
              isExporting || totalItems === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
            }`}
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Adding to Calendar...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Add to Google Calendar</span>
              </>
            )}
          </button>
        )}

        <div className="text-xs text-gray-500 text-center">
          <p>
            {hasGoogleAccess 
              ? "Events will be added directly to your primary Google Calendar with reminders"
              : "Sign in with Google and grant calendar permissions to add events directly"
            }
          </p>
        </div>
      </div>
    </div>
  )
}
