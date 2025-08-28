'use client'

import { Assignment, Exam } from '@/types'
import { Calendar, BookOpen, TrendingUp, PieChart } from 'lucide-react'

interface SummaryStatsProps {
  assignments: Assignment[]
  exams: Exam[]
}

export default function SummaryStats({ assignments, exams }: SummaryStatsProps) {
  const totalAssignments = assignments.length
  const totalExams = exams.length
  const totalDays = 7 // Monday through Sunday
  
  // Calculate simple counts
  const totalItems = totalAssignments + totalExams
  const assignmentPercentage = totalItems > 0 ? Math.round((totalAssignments / totalItems) * 100) : 0
  const examPercentage = totalItems > 0 ? Math.round((totalExams / totalItems) * 100) : 0

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
          {assignmentPercentage > 0 && (
            <div className="flex flex-col items-center text-center">
              <span className="text-lg font-bold text-gray-900">{assignmentPercentage}%</span>
              <span className="text-xs text-gray-600">Assignments</span>
            </div>
          )}
          {examPercentage > 0 && (
            <div className="flex flex-col items-center text-center">
              <span className="text-lg font-bold text-gray-900">{examPercentage}%</span>
              <span className="text-xs text-gray-600">Exams</span>
            </div>
          )}
          
          {/* Show message if no assignments or exams */}
          {totalItems === 0 && (
            <div className="text-center py-2">
              <p className="text-sm text-gray-500">No assignments or exams yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
