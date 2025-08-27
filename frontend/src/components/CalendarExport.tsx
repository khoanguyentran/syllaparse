'use client'

import { useState } from 'react'
import { Calendar, Download, CheckCircle, AlertCircle } from 'lucide-react'
import { Lecture, AssignmentExam, CalendarEvent } from '@/types'

interface CalendarExportProps {
  selectedLectures: Lecture[]
  selectedAssignments: AssignmentExam[]
  onExportComplete: () => void
}

export default function CalendarExport({ 
  selectedLectures, 
  selectedAssignments, 
  onExportComplete 
}: CalendarExportProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [exportMessage, setExportMessage] = useState('')

  const totalItems = selectedLectures.length + selectedAssignments.length

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

    // Create events for selected assignments/exams
    selectedAssignments.forEach(assignment => {
      const dueDate = new Date(assignment.parsed_date)
      const eventStart = new Date(dueDate)
      eventStart.setHours(9, 0, 0, 0) // Set to 9 AM on due date
      
      const eventEnd = new Date(dueDate)
      eventEnd.setHours(10, 0, 0, 0) // Set to 10 AM on due date
      
      events.push({
        summary: `${assignment.type === 'exam' ? 'Exam' : 'Assignment'}: ${assignment.description}`,
        description: `Due: ${assignment.description}`,
        start: {
          dateTime: eventStart.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: eventEnd.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
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

    setIsExporting(true)
    setExportStatus('idle')
    setExportMessage('')

    try {
      const events = createCalendarEvents()
      
      // Create a calendar file in iCal format
      const icalContent = generateICalContent(events)
      const blob = new Blob([icalContent], { type: 'text/calendar' })
      const url = URL.createObjectURL(blob)
      
      // Create download link
      const a = document.createElement('a')
      a.href = url
      a.download = 'syllabus-events.ics'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setExportStatus('success')
      setExportMessage(`Successfully exported ${events.length} events to calendar file`)
      onExportComplete()
      
    } catch (error) {
      setExportStatus('error')
      setExportMessage('Failed to export calendar events. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const generateICalContent = (events: CalendarEvent[]): string => {
    const now = new Date()
    const icalHeader = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Syllaparse//Calendar Export//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH'
    ].join('\r\n')

    const icalEvents = events.map(event => {
      const eventLines = [
        'BEGIN:VEVENT',
        `UID:${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        `DTSTAMP:${now.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        `DTSTART:${event.start.dateTime.replace(/[-:]/g, '').split('.')[0]}Z`,
        `DTEND:${event.end.dateTime.replace(/[-:]/g, '').split('.')[0]}Z`,
        `SUMMARY:${event.summary}`,
        `DESCRIPTION:${event.description}`,
        event.location ? `LOCATION:${event.location}` : '',
        'END:VEVENT'
      ].filter(line => line !== '')
      
      return eventLines.join('\r\n')
    }).join('\r\n')

    const icalFooter = 'END:VCALENDAR'

    return [icalHeader, icalEvents, icalFooter].join('\r\n')
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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          <Calendar className="w-5 h-5 inline mr-2 text-blue-600" />
          Export to Calendar
        </h3>
        {totalItems > 0 && (
          <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
            {totalItems} selected
          </span>
        )}
      </div>

      <div className="space-y-4">
        <div className="text-sm text-gray-600">
          <p>Export selected lectures and assignments to your calendar:</p>
          <ul className="mt-2 space-y-1">
            {selectedLectures.length > 0 && (
              <li>• {selectedLectures.length} lecture/discussion times (recurring weekly)</li>
            )}
            {selectedAssignments.length > 0 && (
              <li>• {selectedAssignments.length} assignments/exams (due dates)</li>
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

        <button
          onClick={exportToGoogleCalendar}
          disabled={isExporting || totalItems === 0}
          className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors ${
            isExporting || totalItems === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
          }`}
        >
          {isExporting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Exporting...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Export to Calendar (.ics)</span>
            </>
          )}
        </button>

        <div className="text-xs text-gray-500 text-center">
          <p>Download an .ics file that you can import into Google Calendar, Outlook, or any calendar app</p>
        </div>
      </div>
    </div>
  )
}
