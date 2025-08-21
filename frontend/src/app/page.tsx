'use client'

import { useState, useMemo } from 'react'
import { Calendar, BookOpen, Download, FileText, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'
import { Assignment, FilterOptions } from '@/types'
import { filterAssignments, sortAssignmentsByDate } from '@/utils/helpers'
import FileUpload from '@/components/FileUpload'
import SummaryStats from '@/components/SummaryStats'
import AssignmentFilters from '@/components/AssignmentFilters'
import AssignmentCard from '@/components/AssignmentCard'
import SyllabusViewer from '@/components/SyllabusViewer'

export default function HomePage() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filters, setFilters] = useState<FilterOptions>({})
  const [syllabusContent, setSyllabusContent] = useState<string>('')
  const [selectedAssignments, setSelectedAssignments] = useState<Set<string>>(new Set())

  // Placeholder API call for parsing syllabus
  const parseSyllabus = async (file: File) => {
    setIsUploading(true)
    setUploadProgress(0)
    
    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 10
      })
    }, 200)

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    clearInterval(progressInterval)
    setUploadProgress(100)
    
    // Mock parsed data - focused on assignments and exams with dates
    const mockAssignments: Assignment[] = [
      {
        id: '1',
        title: 'Midterm Exam',
        type: 'exam',
        dueDate: '2024-12-15T14:00:00Z',
        description: 'Comprehensive exam covering chapters 1-8. Bring calculator and #2 pencils.',
        course: 'Computer Science 101',
        priority: 'high',
        weight: 25,
        location: 'Room 201, Science Building',
        materials: ['Calculator', '#2 Pencils', 'Student ID']
      },
      {
        id: '2',
        title: 'Programming Assignment 3',
        type: 'homework',
        dueDate: '2024-12-10T23:59:00Z',
        description: 'Implement a binary search tree with insertion and deletion operations. Submit via GitHub.',
        course: 'Computer Science 101',
        priority: 'medium',
        weight: 15
      },
      {
        id: '3',
        title: 'Final Project',
        type: 'project',
        dueDate: '2024-12-20T23:59:00Z',
        description: 'Build a complete web application using React and Node.js. Include documentation and testing.',
        course: 'Computer Science 101',
        priority: 'high',
        weight: 30
      },
      {
        id: '4',
        title: 'Weekly Quiz 5',
        type: 'quiz',
        dueDate: '2024-12-08T23:59:00Z',
        description: 'Quiz on database normalization concepts. 20 multiple choice questions.',
        course: 'Computer Science 101',
        priority: 'low',
        weight: 5
      },
      {
        id: '5',
        title: 'Research Paper',
        type: 'homework',
        dueDate: '2024-12-12T23:59:00Z',
        description: 'Write a 10-page research paper on modern web development frameworks.',
        course: 'Web Development 201',
        priority: 'medium',
        weight: 20
      },
      {
        id: '6',
        title: 'Group Presentation',
        type: 'presentation',
        dueDate: '2024-12-18T14:00:00Z',
        description: 'Present your group project findings to the class. 15 minutes per group.',
        course: 'Web Development 201',
        priority: 'medium',
        weight: 15,
        location: 'Room 105, Technology Center'
      }
    ]
    
    // Mock syllabus content
    const mockSyllabusContent = `
# Computer Science 101 - Fall 2024

## Course Information
- **Instructor**: Dr. Jane Smith
- **Office**: Room 301, Science Building
- **Email**: jsmith@university.edu
- **Office Hours**: Tuesdays 2-4 PM

## Course Description
This course introduces fundamental concepts in computer science including algorithms, data structures, and programming principles.

## Grading
- Midterm Exam: 25%
- Final Project: 30%
- Programming Assignments: 30%
- Quizzes: 15%

## Schedule
- Week 1-4: Introduction to Programming
- Week 5-8: Data Structures
- Week 9-12: Algorithms
- Week 13-16: Final Project

## Important Dates
- Midterm Exam: December 15, 2024
- Final Project Due: December 20, 2024
- Programming Assignment 3: December 10, 2024
- Weekly Quiz 5: December 8, 2024
    `
    
    setAssignments(mockAssignments)
    setSyllabusContent(mockSyllabusContent)
    setSelectedAssignments(new Set()) // Reset selections
    setIsUploading(false)
    setUploadProgress(0)
  }

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
  }

  const handleUpload = () => {
    if (selectedFile) {
      parseSyllabus(selectedFile)
    }
  }

  const handleFiltersChange = (newFilters: FilterOptions) => {
    setFilters(newFilters)
  }

  const handleAssignmentToggle = (assignmentId: string) => {
    setSelectedAssignments(prev => {
      const newSet = new Set(prev)
      if (newSet.has(assignmentId)) {
        newSet.delete(assignmentId)
      } else {
        newSet.add(assignmentId)
      }
      return newSet
    })
  }

  const handleExportSelected = () => {
    if (selectedAssignments.size === 0) return
    
    const selectedAssignmentObjects = assignments.filter(a => selectedAssignments.has(a.id))
    const icsContent = generateICSContent(selectedAssignmentObjects)
    const blob = new Blob([icsContent], { type: 'text/calendar' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `selected-assignments-${format(new Date(), 'yyyy-MM-dd')}.ics`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleSelectAll = () => {
    if (selectedAssignments.size === filteredAssignments.length) {
      setSelectedAssignments(new Set())
    } else {
      setSelectedAssignments(new Set(filteredAssignments.map(a => a.id)))
    }
  }

  // Filter and sort assignments
  const filteredAssignments = useMemo(() => {
    let filtered = filterAssignments(assignments, filters)
    return sortAssignmentsByDate(filtered)
  }, [assignments, filters])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Syllaparse</h1>
                <p className="text-sm text-gray-600">Extract assignments and exams with dates</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Calendar className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-600">
                {format(new Date(), 'EEEE, MMMM d, yyyy')}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* File Upload Section */}
        {assignments.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <FileUpload
              onFileSelect={handleFileSelect}
              onUpload={handleUpload}
              selectedFile={selectedFile}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
            />
          </div>
        )}

        {/* Two Column Layout */}
        {assignments.length > 0 && (
          <div className="space-y-6">
            {/* Summary Stats */}
            <SummaryStats assignments={assignments} />

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Left Column - Syllabus Viewer */}
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">
                        <FileText className="w-5 h-5 inline mr-2 text-blue-600" />
                        Syllabus Content
                      </h3>
                      <button
                        onClick={() => {
                          const blob = new Blob([syllabusContent], { type: 'text/plain' })
                          const url = URL.createObjectURL(blob)
                          const a = document.createElement('a')
                          a.href = url
                          a.download = 'syllabus.txt'
                          a.click()
                          URL.revokeObjectURL(url)
                        }}
                        className="inline-flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </button>
                    </div>
                  </div>
                  <div className="p-6 min-h-[700px]">
                    <SyllabusViewer 
                      content={syllabusContent} 
                      pdfFile={selectedFile}
                    />
                  </div>
                </div>
              </div>

              {/* Right Column - Assignments */}
              <div className="space-y-6">
                {/* Filters */}
                <AssignmentFilters 
                  assignments={assignments}
                  onFiltersChange={handleFiltersChange}
                />

                {/* Selection Controls */}
                {filteredAssignments.length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={handleSelectAll}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          {selectedAssignments.size === filteredAssignments.length ? 'Deselect All' : 'Select All'}
                        </button>
                        <span className="text-sm text-gray-600">
                          {selectedAssignments.size} of {filteredAssignments.length} selected
                        </span>
                      </div>
                      
                      {selectedAssignments.size > 0 && (
                        <button
                          onClick={handleExportSelected}
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Calendar className="w-4 h-4 mr-2" />
                          Export {selectedAssignments.size} to Calendar
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Assignments List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">
                        <Calendar className="w-5 h-5 inline mr-2 text-green-600" />
                        Assignments & Exams ({filteredAssignments.length})
                      </h3>
                      {filters.searchQuery && (
                        <p className="text-sm text-gray-600">
                          Showing results for "{filters.searchQuery}"
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {filteredAssignments.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                      {filteredAssignments.map((assignment) => (
                        <AssignmentCard
                          key={assignment.id}
                          assignment={assignment}
                          showActions={false}
                          isSelected={selectedAssignments.has(assignment.id)}
                          onClick={() => handleAssignmentToggle(assignment.id)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <BookOpen className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No assignments found
                      </h3>
                      <p className="text-gray-600">
                        {filters.searchQuery 
                          ? `No assignments match "${filters.searchQuery}"`
                          : 'Try adjusting your filters or upload a new syllabus'
                        }
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Upload New Syllabus Button */}
            <div className="text-center">
              <button
                onClick={() => {
                  setAssignments([])
                  setSelectedFile(null)
                  setFilters({})
                  setSyllabusContent('')
                  setSelectedAssignments(new Set())
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Upload New Syllabus
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {assignments.length === 0 && !isUploading && !selectedFile && (
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No assignments yet
            </h3>
            <p className="text-gray-600">
              Upload a syllabus to extract assignments and exams with important dates
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

// Helper function to generate ICS content for multiple assignments
function generateICSContent(assignments: Assignment[]): string {
  const events = assignments.map(assignment => {
    const startDate = new Date(assignment.dueDate)
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000) // 1 hour duration
    
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    }
    
    const description = assignment.description || ''
    const location = assignment.location || ''
    
    return `BEGIN:VEVENT
UID:${assignment.id}@syllaparse.com
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:${assignment.title}
DESCRIPTION:${description.replace(/\n/g, '\\n')}
LOCATION:${location}
PRIORITY:${assignment.priority === 'high' ? '1' : assignment.priority === 'medium' ? '5' : '9'}
STATUS:NEEDS-ACTION
END:VEVENT`
  }).join('\n')
  
  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Syllaparse//Calendar Export//EN
${events}
END:VCALENDAR`
}
