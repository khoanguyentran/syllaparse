'use client'

import { Assignment } from '@/types'
import { Calendar, BookOpen, TrendingUp, PieChart } from 'lucide-react'

interface SummaryStatsProps {
  assignments: Assignment[]
}

export default function SummaryStats({ assignments }: SummaryStatsProps) {
  const totalAssignments = assignments.length
  const totalExams = assignments.filter(a => a.type === 'exam').length
  const totalDays = 7 // Monday through Sunday
  
  // Calculate grade breakdown based on assignment types
  const homeworkAssignments = assignments.filter(a => a.type === 'homework')
  const examAssignments = assignments.filter(a => a.type === 'exam')
  const projectAssignments = assignments.filter(a => a.type === 'project')
  const quizAssignments = assignments.filter(a => a.type === 'quiz')
  const labAssignments = assignments.filter(a => a.type === 'lab')
  const presentationAssignments = assignments.filter(a => a.type === 'presentation')
  
  // Calculate percentages (assuming equal weight if not specified)
  const totalWeighted = assignments.length
  const homeworkPercentage = totalWeighted > 0 ? Math.round((homeworkAssignments.length / totalWeighted) * 100) : 0
  const examPercentage = totalWeighted > 0 ? Math.round((examAssignments.length / totalWeighted) * 100) : 0
  const projectPercentage = totalWeighted > 0 ? Math.round((projectAssignments.length / totalWeighted) * 100) : 0
  const quizPercentage = totalWeighted > 0 ? Math.round((quizAssignments.length / totalWeighted) * 100) : 0
  const labPercentage = totalWeighted > 0 ? Math.round((labAssignments.length / totalWeighted) * 100) : 0
  const presentationPercentage = totalWeighted > 0 ? Math.round((presentationAssignments.length / totalWeighted) * 100) : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {/* Left three boxes - uniform UI styling */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 bg-blue-50">
        <div className="flex flex-col items-center text-center">
          <div className="p-2 rounded-lg bg-blue-100 text-blue-600 mb-2">
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
          <p className="text-sm font-medium text-gray-600">Days of Week</p>
          <p className="text-2xl font-bold text-gray-900">{totalDays}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 bg-purple-50">
        <div className="flex flex-col items-center text-center">
          <div className="p-2 rounded-lg bg-purple-100 text-purple-600 mb-2">
            <BookOpen className="w-5 h-5" />
          </div>
          <p className="text-sm font-medium text-gray-600">Total Assignments</p>
          <p className="text-2xl font-bold text-gray-900">{totalAssignments}</p>
        </div>
      </div>

      {/* Right big box - Grade Breakdown centered and stretched horizontally */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 bg-orange-50 md:col-span-2">
        <div className="flex items-center justify-center mb-4">
          <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
            <PieChart className="w-5 h-5" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-600">Grade Breakdown</p>
          </div>
        </div>
        
        {/* Centered horizontal layout for grade breakdown */}
        <div className="flex flex-wrap gap-6 justify-center">
          {homeworkPercentage > 0 && (
            <div className="flex flex-col items-center text-center">
              <span className="text-lg font-bold text-gray-900">{homeworkPercentage}%</span>
              <span className="text-xs text-gray-600">Homework</span>
            </div>
          )}
          {examPercentage > 0 && (
            <div className="flex flex-col items-center text-center">
              <span className="text-lg font-bold text-gray-900">{examPercentage}%</span>
              <span className="text-xs text-gray-600">Exams</span>
            </div>
          )}
          {projectPercentage > 0 && (
            <div className="flex flex-col items-center text-center">
              <span className="text-lg font-bold text-gray-900">{projectPercentage}%</span>
              <span className="text-xs text-gray-600">Projects</span>
            </div>
          )}
          {quizPercentage > 0 && (
            <div className="flex flex-col items-center text-center">
              <span className="text-lg font-bold text-gray-900">{quizPercentage}%</span>
              <span className="text-xs text-gray-600">Quizzes</span>
            </div>
          )}
          {labPercentage > 0 && (
            <div className="flex flex-col items-center text-center">
              <span className="text-lg font-bold text-gray-900">{labPercentage}%</span>
              <span className="text-xs text-gray-600">Labs</span>
            </div>
          )}
          {presentationPercentage > 0 && (
            <div className="flex flex-col items-center text-center">
              <span className="text-lg font-bold text-gray-900">{presentationPercentage}%</span>
              <span className="text-xs text-gray-600">Presentations</span>
            </div>
          )}
          
          {/* Show message if no assignments */}
          {totalAssignments === 0 && (
            <div className="text-center py-2">
              <p className="text-sm text-gray-500">No assignments yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
