'use client'

import { useState, useEffect } from 'react'
import { BookOpen, Download, FileText } from 'lucide-react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import SummaryStats from '@/components/stats/SummaryStats'
import SyllabusViewer from '@/components/stats/SyllabusViewer'
import SyllabusHistory from '@/components/general/SyllabusHistory'
import LectureTimes from '@/components/stats/LectureTimes'
import CalendarExport from '@/components/general/CalendarExport'
import { Assignment, Exam, BackendAssignment, BackendExam, Lecture } from '@/types'
import Exams from '@/components/stats/Exams'
import Assignments from '@/components/stats/Assignments'
import AppHeader from '@/components/general/AppHeader'
import api from '@/utils/api'

export default function StatsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [lectures, setLectures] = useState<Lecture[]>([])
  const [fileSummary, setFileSummary] = useState<string>('')
  const [courseName, setCourseName] = useState<string>('')
  const [selectedLectures, setSelectedLectures] = useState<Lecture[]>([])
  const [selectedAssignments, setSelectedAssignments] = useState<Assignment[]>([])
  const [selectedExams, setSelectedExams] = useState<Exam[]>([])
  const [authError, setAuthError] = useState<string | null>(null)
  const [googleId, setGoogleId] = useState<string | null>(null)
  const [currentFileId, setCurrentFileId] = useState<number | null>(null)
  const [isLoadingSyllabus, setIsLoadingSyllabus] = useState(false)
  const [isAutoLoading, setIsAutoLoading] = useState(false)

  useEffect(() => {
    const fileId = searchParams.get('fileId')
    if (fileId && !currentFileId) {
      const numericFileId = parseInt(fileId)
      if (!isNaN(numericFileId)) {
        setCurrentFileId(numericFileId)
        loadSyllabusData(numericFileId)
      }
    }
  }, [searchParams, currentFileId])

  // Auto-load most recent syllabus when user is authenticated
  useEffect(() => {
    const loadMostRecentSyllabus = async () => {
      if (googleId && !currentFileId) {
        console.log('Auto-loading most recent syllabus...')
        setIsAutoLoading(true)
        try {
          const response = await api.getFiles(undefined, googleId)
          if (response.ok) {
            const data = await response.json()
            const files = data.files || []
            if (files.length > 0) {
              // Load the most recent file (first in the list)
              const mostRecentFile = files[0]
              console.log('Auto-loading most recent file:', mostRecentFile.file_id)
              await loadSyllabusData(mostRecentFile.file_id)
            }
          }
        } catch (error) {
          console.error('Error auto-loading most recent syllabus:', error)
        } finally {
          setIsAutoLoading(false)
        }
      }
    }

    loadMostRecentSyllabus()
  }, [googleId, currentFileId])

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
    
    // Clear previous data immediately when loading new syllabus
    setAssignments([])
    setExams([])
    setLectures([])
    setFileSummary('')
    setSelectedLectures([])
    
    setCurrentFileId(fileId)
    
    try {
      // Load assignments, exams, and lectures separately
      console.log('Loading assignments from backend...')
      const assignmentsResponse = await api.getAssignmentsByFile(fileId)
      console.log('Assignments response status:', assignmentsResponse.status)
      
      const examsResponse = await api.getExamsByFile(fileId)
      console.log('Exams response status:', examsResponse.status)
      
      const lecturesResponse = await api.getLecturesByFile(fileId)
      console.log('Lectures response status:', lecturesResponse.status)
      
      // Process assignments
      if (assignmentsResponse.ok) {
        const assignmentsData = await assignmentsResponse.json()
        console.log('Assignments data received:', assignmentsData)
        
        if (assignmentsData && assignmentsData.length > 0) {
          const assignmentsList: Assignment[] = assignmentsData.map((assignment: BackendAssignment) => ({
            id: assignment.id.toString(),
            title: assignment.description,
            dueDate: assignment.due_date,
            description: assignment.description,
            course: undefined,
            location: undefined
          }))
          setAssignments(assignmentsList)
          console.log('Assignments set:', assignmentsList)
        } else {
          console.log('No assignments data received, setting empty array')
          setAssignments([])
        }
      } else {
        console.warn('Failed to load assignments:', assignmentsResponse.status)
        setAssignments([])
      }
      
      // Process exams
      if (examsResponse.ok) {
        const examsData = await examsResponse.json()
        console.log('Exams data received:', examsData)
        
        if (examsData && examsData.length > 0) {
          const examsList: Exam[] = examsData.map((exam: BackendExam) => ({
            id: exam.id.toString(),
            title: exam.description,
            examDate: exam.exam_date,
            description: exam.description,
            course: undefined,
            location: undefined
          }))
          setExams(examsList)
          console.log('Exams set:', examsList)
        } else {
          console.log('No exams data received, setting empty array')
          setExams([])
        }
      } else {
        console.warn('Failed to load exams:', examsResponse.status)
        setExams([])
      }
      
      // Process lectures
      if (lecturesResponse.ok) {
        const lecturesData = await lecturesResponse.json()
        console.log('Lectures data received:', lecturesData)
        
        if (lecturesData && lecturesData.length > 0) {
          setLectures(lecturesData)
          console.log('Lectures set:', lecturesData)
        } else {
          console.log('No lectures data received, setting empty array')
          setLectures([])
        }
      } else {
        console.warn('Failed to load lectures:', lecturesResponse.status)
        setLectures([])
      }
      
      // Load syllabus content (summary)
      console.log('Loading summary from backend...')
      const summaryResponse = await api.getSummaryByFile(fileId)
      console.log('Summary response status:', summaryResponse.status)
      
      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json()
        console.log('Summary data received:', summaryData)
        if (summaryData && summaryData.summary) {
          setFileSummary(summaryData.summary)
          
          // Extract course name from summary text
          const summaryText = summaryData.summary
          const courseMatch = summaryText.match(/Course:\s*([^\n]+)/i)
          if (courseMatch && courseMatch[1] && courseMatch[1].trim() !== 'N/A') {
            setCourseName(courseMatch[1].trim())
          } else {
            setCourseName('')
          }
        } else {
          console.log('No summary data received, setting empty content')
          setFileSummary('')
          setCourseName('')
        }
      } else {
        console.warn('Failed to load summary:', summaryResponse.status)
        console.log('Setting empty syllabus content')
        setFileSummary('')
        setCourseName('')
      }
      
    } catch (error) {
      console.error('Error loading syllabus data:', error)
      setAuthError('Failed to load syllabus data')
      setAssignments([])
      setExams([])
      setLectures([])
      setFileSummary('')
      setCourseName('')
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
      setExams([])
      setLectures([])
      setFileSummary('')
      setSelectedLectures([])
    } else {
      console.log('Syllabus selected from history:', fileId)
      setCurrentFileId(fileId)
      
      // Update URL with file ID
      const params = new URLSearchParams(searchParams.toString())
      params.set('fileId', fileId.toString())
      router.replace(`/stats?${params.toString()}`, { scroll: false })
      
      // Load the syllabus data
      loadSyllabusData(fileId)
    }
  }

  // Handle lecture selection
  const handleLectureSelect = (lectures: Lecture[]) => {
    setSelectedLectures(lectures)
  }

  // Handle assignment selection
  const handleAssignmentSelect = (assignments: Assignment[]) => {
    setSelectedAssignments(assignments)
  }

  // Handle exam selection
  const handleExamSelect = (exams: Exam[]) => {
    setSelectedExams(exams)
  }

  // Handle export completion
  const handleExportComplete = () => {
    // Reset selections after successful export
    setSelectedLectures([])
    setSelectedAssignments([])
    setSelectedExams([])
  }



  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <AppHeader onGoogleIdChange={handleGoogleIdChange} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Syllabus History and Summary Stats */}
        <div className="space-y-6">
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
          
          {currentFileId && <SummaryStats assignments={assignments} exams={exams} lectures={lectures} fileId={currentFileId} />}
        </div>

        {/* Auto-loading indicator */}
        {isAutoLoading && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading most recent syllabus...</p>
            </div>
          </div>
        )}

        {/* Two Column Layout - Left: Syllabus & Calendar Export, Right: Lectures & Assignments */}
        {!isAutoLoading && currentFileId && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mt-8">
            {/* Left Column - Syllabus Viewer & Calendar Export */}
            <div className="space-y-6">
              {/* Syllabus Viewer */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      <FileText className="w-5 h-5 inline mr-2 text-blue-600" />
                      Syllabus Content
                    </h3>
                    <button
                      onClick={() => {
                        const blob = new Blob([fileSummary], { type: 'text/plain' })
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
                <div className="p-6 min-h-[400px]">
                  <SyllabusViewer
                    content={fileSummary}
                    pdfFile={null}
                  />
                </div>
              </div>

              {/* Calendar Export */}
              <CalendarExport
                selectedLectures={selectedLectures}
                selectedAssignments={selectedAssignments}
                selectedExams={selectedExams}
                onExportComplete={handleExportComplete}
              />
            </div>

            {/* Right Column - Lecture Times & Academic Tasks */}
            <div className="space-y-6">
              {/* Lecture Times */}
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

              {/* Academic Tasks Section */}
              <div className="space-y-6">
                {/* Exams Component */}
                <Exams
                  fileId={currentFileId}
                  onExamSelect={handleExamSelect}
                  selectedExams={selectedExams}
                />

                {/* Assignments Component */}
                <Assignments
                  fileId={currentFileId}
                  onAssignmentSelect={handleAssignmentSelect}
                  selectedAssignments={selectedAssignments}
                />
              </div>
            </div>
          </div>
        )}

        {/* Upload New Syllabus Button */}
        <div className="text-center mt-8">
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Upload New Syllabus
          </Link>
        </div>

        {/* Empty State */}
        {!isAutoLoading && !currentFileId && (
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No syllabus selected
            </h3>
            <p className="text-gray-600">
              Choose a syllabus from your history or upload a new one to view assignments and exams
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
