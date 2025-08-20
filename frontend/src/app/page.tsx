'use client'

import { useState, useMemo } from 'react'
import { Calendar, BookOpen } from 'lucide-react'
import { format } from 'date-fns'
import { Assignment, FilterOptions } from '@/types'
import { filterAssignments, sortAssignmentsByDate } from '@/utils/helpers'
import FileUpload from '@/components/FileUpload'
import SummaryStats from '@/components/SummaryStats'
import AssignmentFilters from '@/components/AssignmentFilters'
import AssignmentCard from '@/components/AssignmentCard'

export default function HomePage() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filters, setFilters] = useState<FilterOptions>({})

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
    
    // Mock parsed data - in real app this would come from backend
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
    
    setAssignments(mockAssignments)
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
                <p className="text-sm text-gray-600">Parse your syllabus, organize your life</p>
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

        {/* Assignments Display */}
        {assignments.length > 0 && (
          <div className="space-y-6">
            {/* Summary Stats */}
            <SummaryStats assignments={assignments} />

            {/* Filters */}
            <AssignmentFilters 
              assignments={assignments}
              onFiltersChange={handleFiltersChange}
            />

            {/* Assignments List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Assignments ({filteredAssignments.length})
                  </h3>
                  {filters.searchQuery && (
                    <p className="text-sm text-gray-600">
                      Showing results for "{filters.searchQuery}"
                    </p>
                  )}
                </div>
              </div>
              
              {filteredAssignments.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                  {filteredAssignments.map((assignment) => (
                    <AssignmentCard
                      key={assignment.id}
                      assignment={assignment}
                      showActions={false}
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

            {/* Upload New Syllabus Button */}
            <div className="text-center">
              <button
                onClick={() => {
                  setAssignments([])
                  setSelectedFile(null)
                  setFilters({})
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
              Upload a syllabus to get started and see all your upcoming assignments
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
