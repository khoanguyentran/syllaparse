'use client'

import { useState, useMemo, useEffect } from 'react'
import { Calendar, BookOpen, Download, FileText, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'
import { useSearchParams, useRouter } from 'next/navigation'
import FileUpload from '@/components/FileUpload'
import GoogleSignIn from '@/components/GoogleSignIn'
import SummaryStats from '@/components/SummaryStats'
import SyllabusViewer from '@/components/SyllabusViewer'
import AssignmentCard from '@/components/AssignmentCard'
import AssignmentFilters from '@/components/AssignmentFilters'
import SyllabusHistory from '@/components/SyllabusHistory'
import LectureTimes from '@/components/LectureTimes'
import CalendarExport from '@/components/CalendarExport'
import { Assignment, FilterOptions, AssignmentExam, Lecture, SyllabusFile } from '@/types'
import { filterAssignments, sortAssignmentsByDate } from '@/utils/helpers'
import api from '@/utils/api'

// Mock data for now
const mockAssignments = [
  { 
    id: '1', 
    title: 'Research Paper', 
    dueDate: '2024-02-15', 
    type: 'homework' as const, 
    description: 'Write a 10-page research paper on AI ethics',
    priority: 'high' as const
  },
  { 
    id: '2', 
    title: 'Midterm Exam', 
    dueDate: '2024-03-01', 
    type: 'exam' as const, 
    description: 'Covers chapters 1-5',
    priority: 'high' as const
  },
  { 
    id: '3', 
    title: 'Group Project', 
    dueDate: '2024-03-20', 
    type: 'project' as const, 
    description: 'Collaborative project on machine learning applications',
    priority: 'medium' as const
  },
]

const mockSyllabusContent = `
    Course: Introduction to Artificial Intelligence
    Instructor: Dr. Smith
    Semester: Spring 2024

    Course Objectives:
    - Understand fundamental AI concepts
    - Learn machine learning algorithms
    - Apply AI techniques to real-world problems

    Grading:
    - Assignments: 40%
    - Exams: 40%
    - Participation: 20%
`

export default function Home() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [filters, setFilters] = useState<FilterOptions>({})
  const [syllabusContent, setSyllabusContent] = useState<string>('')
  const [selectedAssignments, setSelectedAssignments] = useState<Set<string>>(new Set())
  const [authError, setAuthError] = useState<string | null>(null)
  const [googleId, setGoogleId] = useState<string | null>(null)
  const [hasUploadedFile, setHasUploadedFile] = useState(false)
  const [isRestoring, setIsRestoring] = useState(true)
  
  // New state for enhanced functionality
  const [currentFileId, setCurrentFileId] = useState<number | null>(null)
  const [realAssignments, setRealAssignments] = useState<AssignmentExam[]>([])
  const [selectedLectures, setSelectedLectures] = useState<Lecture[]>([])
  const [syllabusFiles, setSyllabusFiles] = useState<SyllabusFile[]>([])
  const [isLoadingSyllabus, setIsLoadingSyllabus] = useState(false)

  // Check URL params on mount to restore state
  useEffect(() => {
    const view = searchParams.get('view')
    console.log('URL restoration effect - view:', view, 'isRestoring:', isRestoring)
    
    if (view === 'stats' && isRestoring) {
      // Only restore state if we're actually restoring from URL and haven't loaded real data
      if (assignments.length === 0 && !currentFileId) {
        console.log('Restoring mock data from URL')
        setAssignments(mockAssignments)
        setSyllabusContent(mockSyllabusContent)
        setHasUploadedFile(true)
      }
    }
    
    if (isRestoring) {
      setIsRestoring(false)
    }
  }, [searchParams, isRestoring, assignments.length, currentFileId])

  // Load syllabus history when user is authenticated
  useEffect(() => {
    if (googleId && hasUploadedFile) {
      // Syllabus history will be loaded when the dropdown is opened
    }
  }, [googleId, hasUploadedFile])

  // Debug effect to monitor state changes
  useEffect(() => {
    console.log('State changed - hasUploadedFile:', hasUploadedFile, 'currentFileId:', currentFileId, 'assignments.length:', assignments.length)
  }, [hasUploadedFile, currentFileId, assignments.length])

  // Update URL when view changes
  const updateURL = (view: 'upload' | 'stats') => {
    console.log('updateURL called with:', view)
    const params = new URLSearchParams(searchParams.toString())
    if (view === 'stats') {
      params.set('view', 'stats')
    } else {
      params.delete('view')
    }
    const newURL = `?${params.toString()}`
    console.log('New URL:', newURL)
    router.replace(newURL, { scroll: false })
  }

  // Handle Google ID changes from GoogleSignIn component
  const handleGoogleIdChange = (newGoogleId: string | null) => {
    setGoogleId(newGoogleId)
    setAuthError(null)
  }

  // Helper function to check if user is authenticated
  const isAuthenticated = (): boolean => {
    return googleId !== null
  }

  // Load real data from backend when syllabus is selected
  const loadSyllabusData = async (fileId: number) => {
    if (!fileId) return
    
    console.log('loadSyllabusData called with fileId:', fileId)
    setIsLoadingSyllabus(true)
    setCurrentFileId(fileId)
    
    try {
      // Load assignments/exams
      console.log('Loading assignments from backend...')
      const assignmentsResponse = await api.getAssignmentsExamsByFile(fileId)
      console.log('Assignments response status:', assignmentsResponse.status)
      
      if (assignmentsResponse.ok) {
        const assignmentsData = await assignmentsResponse.json()
        console.log('Assignments data received:', assignmentsData)
        setRealAssignments(assignmentsData)
        
        if (assignmentsData && assignmentsData.length > 0) {
          // Convert to frontend Assignment format for compatibility
          const convertedAssignments: Assignment[] = assignmentsData.map((ae: AssignmentExam) => ({
            id: ae.id.toString(),
            title: ae.description,
            type: ae.type === 'exam' ? 'exam' : 'homework',
            dueDate: ae.parsed_date,
            description: ae.description,
            priority: 'medium' as const,
            weight: undefined,
            location: undefined,
            materials: undefined,
            completed: false
          }))
          setAssignments(convertedAssignments)
          console.log('Converted assignments set:', convertedAssignments)
        } else {
          console.log('No assignments data received, using mock data')
          setAssignments(mockAssignments)
        }
      } else {
        console.warn('Failed to load assignments:', assignmentsResponse.status)
        // Fall back to mock data
        setRealAssignments([])
        setAssignments(mockAssignments)
      }
      
      // Load syllabus content (summary)
      console.log('Loading summary from backend...')
      const summaryResponse = await api.getSummaryByFile(fileId)
      console.log('Summary response status:', summaryResponse.status)
      
      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json()
        console.log('Summary data received:', summaryData)
        if (summaryData && summaryData.summary) {
          setSyllabusContent(summaryData.summary)
        } else {
          console.log('No summary data received, using mock data')
          setSyllabusContent(mockSyllabusContent)
        }
      } else {
        console.warn('Failed to load summary:', summaryResponse.status)
        console.log('Using mock syllabus content')
        setSyllabusContent(mockSyllabusContent)
      }
      
      // Don't set hasUploadedFile or update URL here since it's already done in parseSyllabus
      
    } catch (error) {
      console.error('Error loading syllabus data:', error)
      setAuthError('Failed to load syllabus data')
      // Fall back to mock data
      setAssignments(mockAssignments)
      setSyllabusContent(mockSyllabusContent)
      // Don't set hasUploadedFile or update URL here since it's already done in parseSyllabus
    } finally {
      setIsLoadingSyllabus(false)
    }
  }

  // Handle syllabus selection from history
  const handleSyllabusSelect = (fileId: number) => {
    if (fileId === 0) {
      // Reset to no selection
      setCurrentFileId(null)
      setAssignments([])
      setRealAssignments([])
      setSyllabusContent('')
      setSelectedAssignments(new Set())
      setSelectedLectures([])
      setHasUploadedFile(false)
      updateURL('upload')
    } else {
      loadSyllabusData(fileId)
    }
  }

  // Handle lecture selection
  const handleLectureSelect = (lectures: Lecture[]) => {
    setSelectedLectures(lectures)
  }

  // Handle export completion
  const handleExportComplete = () => {
    // Reset selections after successful export
    setSelectedAssignments(new Set())
    setSelectedLectures([])
  }

  const parseSyllabus = async (file: File) => {
    setIsUploading(true)
    setUploadProgress(0)

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      // Upload file to Next.js API route (which uploads to GCS and calls Python backend)
      if (!googleId) {
        setAuthError('User not authenticated. Please sign in with Google first.')
        return
      }
      
      const response = await api.uploadFile(file, googleId)
      
      if (!response.ok) {
        throw new Error('Failed to upload file')
      }

      const uploadResult = await response.json()
      console.log('File uploaded successfully:', uploadResult)

      clearInterval(progressInterval)
      setUploadProgress(100)

      // Get the file ID from the upload response
      const fileId = uploadResult.file_id
      console.log('File ID received:', fileId)
      
      // Set the current file ID and mark as uploaded immediately
      console.log('Setting state for stats view...')
      setCurrentFileId(fileId)
      setHasUploadedFile(true)
      
      // Update URL immediately after state change
      console.log('Calling updateURL...')
      updateURL('stats')
      
      // Load the parsed data from the backend
      try {
        console.log('Attempting to load syllabus data from backend...')
        await loadSyllabusData(fileId)
        console.log('Successfully loaded syllabus data from backend')
      } catch (loadError) {
        console.error('Error loading syllabus data:', loadError)
        // Fall back to mock data if loading fails
        console.log('Falling back to mock data...')
        setAssignments(mockAssignments)
        setSyllabusContent(mockSyllabusContent)
        setAuthError('File uploaded but failed to load parsed data. Using sample data.')
      }
      
    } catch (error) {
      console.error('Error uploading file:', error)
      setAuthError('Failed to upload file. Please try again.')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    setAuthError(null)
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
              <GoogleSignIn onGoogleIdChange={handleGoogleIdChange} />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {isRestoring && (
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 animate-spin">
              <BookOpen className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Loading...
            </h3>
          </div>
        )}

        {/* File Upload Section */}
        {!isRestoring && !hasUploadedFile && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            {authError && (
              <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm text-red-800">{authError}</p>
                <button
                  onClick={() => setAuthError(null)}
                  className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                >
                  Dismiss
                </button>
              </div>
            )}
            
            {!isAuthenticated() && (
              <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  Please sign in with Google to upload files
                </p>
              </div>
            )}
            
            <FileUpload
              onFileSelect={handleFileSelect}
              onUpload={handleUpload}
              selectedFile={selectedFile}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
              disabled={!isAuthenticated()}
            />
            

          </div>
        )}

        {/* Two Column Layout */}
        {!isRestoring && hasUploadedFile && (
          <div className="space-y-6">
            {/* Syllabus History and Summary Stats */}
            <div className="space-y-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    <BookOpen className="w-5 h-5 inline mr-2 text-blue-600" />
                    Syllabus History
                  </h3>
                </div>
                <SyllabusHistory
                  googleId={googleId}
                  onSyllabusSelect={handleSyllabusSelect}
                  currentFileId={currentFileId || undefined}
                />
              </div>
              
              <SummaryStats assignments={assignments} />
            </div>

            {/* Three Column Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
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

              {/* Middle Column - Lecture Times */}
              <div className="space-y-6">
                {isLoadingSyllabus ? (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-gray-600">Loading syllabus data...</p>
                    </div>
                  </div>
                ) : (
                  <LectureTimes
                    fileId={currentFileId}
                    onLectureSelect={handleLectureSelect}
                    selectedLectures={selectedLectures}
                  />
                )}
              </div>

              {/* Right Column - Assignments & Calendar Export */}
              <div className="space-y-6">
                {/* Calendar Export */}
                <CalendarExport
                  selectedLectures={selectedLectures}
                  selectedAssignments={realAssignments.filter(ae => 
                    selectedAssignments.has(ae.id.toString())
                  )}
                  onExportComplete={handleExportComplete}
                />

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
                    </div>
                  </div>
                )}

                {/* Assignments List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-5 h-5 text-green-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          Assignments & Exams ({filteredAssignments.length})
                        </h3>
                      </div>
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
                  setHasUploadedFile(false) // Reset uploaded file state
                  setCurrentFileId(null)
                  setRealAssignments([])
                  setSelectedLectures([])
                  updateURL('upload') // Redirect to upload page
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
        {!isRestoring && !hasUploadedFile && !isUploading && !selectedFile && (
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

