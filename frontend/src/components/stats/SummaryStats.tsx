'use client'

import { useState, useEffect } from 'react'
import { Assignment, Exam, Lecture } from '@/types'
import { Calendar, BookOpen, TrendingUp, PieChart } from 'lucide-react'
import api from '@/utils/api'

interface GradingCategory {
  name: string
  weight: number
  description?: string
}

interface GradingBreakdown {
  categories: GradingCategory[]
  confidence?: number
  total_weight?: number
}

interface SummaryStatsProps {
  assignments: Assignment[]
  exams: Exam[]
  lectures: Lecture[]
  fileId: string | null
}

export default function SummaryStats({ assignments, exams, lectures, fileId }: SummaryStatsProps) {
  const [gradingBreakdown, setGradingBreakdown] = useState<GradingBreakdown | null>(null)
  const [isLoadingGrading, setIsLoadingGrading] = useState(false)

  const totalAssignments = assignments.length
  const totalExams = exams.length
  
  // Calculate unique days of the week the class meets (lecture sessions only)
  const lectureDays = lectures
    .filter(lecture => lecture.type === 'lecture' || !lecture.type) // Include lectures and undefined types
    .map(lecture => lecture.day)
  const uniqueLectureDays = new Set(lectureDays)
  const totalDaysOfWeek = uniqueLectureDays.size

  // Load grading breakdown from backend
  useEffect(() => {
    if (fileId) {
      setIsLoadingGrading(true)
      const loadGradingBreakdown = async () => {
        try {
          const response = await api.getGradingBreakdown(fileId)
          if (response.ok) {
            const data = await response.json()
            setGradingBreakdown(data.grading)
          } else {
            setGradingBreakdown(null)
          }
        } catch (error) {
          console.error('Error loading grading breakdown:', error)
          setGradingBreakdown(null)
        } finally {
          setIsLoadingGrading(false)
        }
      }
      loadGradingBreakdown()
    } else {
      setGradingBreakdown(null)
    }
  }, [fileId])
  
  // Calculate grade breakdown - use real data if available, otherwise fallback to estimates
  const hasAssignments = totalAssignments > 0
  const hasExams = totalExams > 0
  
  let gradingCategories: GradingCategory[] = []
  
  if (gradingBreakdown && gradingBreakdown.categories && gradingBreakdown.categories.length > 0) {
    // Use real grading data from syllabus
    gradingCategories = gradingBreakdown.categories
  } else {
    // Fallback to estimated weights when no grading data is available
    if (hasAssignments && hasExams) {
      gradingCategories = [
        { name: 'Assignments', weight: 35, description: 'Estimated weight' },
        { name: 'Exams', weight: 60, description: 'Estimated weight' },
        { name: 'Participation', weight: 5, description: 'Estimated weight' }
      ]
    } else if (hasAssignments && !hasExams) {
      gradingCategories = [
        { name: 'Assignments', weight: 85, description: 'Estimated weight' },
        { name: 'Participation', weight: 15, description: 'Estimated weight' }
      ]
    } else if (!hasAssignments && hasExams) {
      gradingCategories = [
        { name: 'Exams', weight: 90, description: 'Estimated weight' },
        { name: 'Participation', weight: 10, description: 'Estimated weight' }
      ]
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {/* Left three boxes - uniform UI styling */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 bg-blue-50">
        <div className="flex flex-col items-center text-center">
          <div className="p-2 rounded-lg bg-blue-100 text-blue-600 mb-2">
            <BookOpen className="w-5 h-5" />
          </div>
          <p className="text-sm font-medium text-gray-600">Total Assignments</p>
          <p className="text-2xl font-bold text-gray-900">{totalAssignments}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 bg-orange-50">
        <div className="flex flex-col items-center text-center">
          <div className="p-2 rounded-lg bg-orange-100 text-orange-600 mb-2">
            <TrendingUp className="w-5 h-5" />
          </div>
          <p className="text-sm font-medium text-gray-600">Total Exams</p>
          <p className="text-2xl font-bold text-gray-900">{totalExams}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 bg-green-50">
        <div className="flex flex-col items-center text-center">
          <div className="p-2 rounded-lg bg-green-100 text-green-600 mb-2">
            <Calendar className="w-5 h-5" />
          </div>
          <p className="text-sm font-medium text-gray-600">Lectures Per Week</p>
          <p className="text-2xl font-bold text-gray-900">{totalDaysOfWeek}</p>
        </div>
      </div>

      {/* Right big box - Grade Breakdown centered and stretched horizontally */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 bg-orange-50 md:col-span-2">
        <div className="flex items-center justify-center mb-3">
          <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
            <PieChart className="w-5 h-5" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-600">Grade Breakdown</p>
          </div>
        </div>
        
        {/* Centered horizontal layout for grade breakdown */}
        <div className="flex flex-wrap gap-4 justify-center">
          {isLoadingGrading ? (
            <div className="text-center py-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600 mx-auto"></div>
              <p className="text-xs text-gray-500 mt-1">Loading grading data...</p>
            </div>
          ) : gradingCategories.length > 0 ? (
            gradingCategories.map((category, index) => {
              // Color mapping for different category types
              const getColor = (name: string) => {
                const lowerName = name.toLowerCase()
                if (lowerName.includes('assignment') || lowerName.includes('homework') || lowerName.includes('project')) {
                  return 'text-blue-600'
                } else if (lowerName.includes('exam') || lowerName.includes('test') || lowerName.includes('midterm') || lowerName.includes('final') || lowerName.includes('prelim')) {
                  return 'text-orange-600'
                } else if (lowerName.includes('participation') || lowerName.includes('attendance')) {
                  return 'text-green-600'
                } else if (lowerName.includes('quiz')) {
                  return 'text-purple-600'
                } else if (lowerName.includes('lab')) {
                  return 'text-yellow-600'
                } else {
                  return 'text-gray-600'
                }
              }

              return (
                <div key={index} className="flex flex-col items-center text-center">
                  <span className={`text-lg font-bold ${getColor(category.name)}`}>
                    {category.weight}%
                  </span>
                  <span className="text-xs text-gray-600">{category.name}</span>
                </div>
              )
            })
          ) : (
            <div className="text-center py-2">
              <p className="text-sm text-gray-500">Upload syllabus to see grade breakdown</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
