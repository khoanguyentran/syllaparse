'use client'

import { useState } from 'react'
import { Assignment } from '@/types'
import { Search, Filter, X } from 'lucide-react'
import clsx from 'clsx'

interface AssignmentFiltersProps {
  assignments: Assignment[]
  onFiltersChange: (filters: {
    course?: string
    type?: Assignment['type']
    priority?: Assignment['priority']
    searchQuery?: string
  }) => void
}

export default function AssignmentFilters({ assignments, onFiltersChange }: AssignmentFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [filters, setFilters] = useState({
    course: '',
    type: '' as Assignment['type'] | '',
    priority: '' as Assignment['priority'] | '',
    searchQuery: ''
  })

  // Get unique values for filter options
  const courses = Array.from(new Set(assignments.map(a => a.course).filter(Boolean)))
  const types = Array.from(new Set(assignments.map(a => a.type)))
  const priorities = Array.from(new Set(assignments.map(a => a.priority)))

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    
    // Convert empty strings to undefined for the API
    const apiFilters = {
      course: newFilters.course || undefined,
      type: newFilters.type || undefined,
      priority: newFilters.priority || undefined,
      searchQuery: newFilters.searchQuery || undefined
    }
    
    onFiltersChange(apiFilters)
  }

  const clearFilters = () => {
    const clearedFilters = {
      course: '',
      type: '' as Assignment['type'] | '',
      priority: '' as Assignment['priority'] | '',
      searchQuery: ''
    }
    setFilters(clearedFilters)
    onFiltersChange({})
  }

  const hasActiveFilters = Object.values(filters).some(value => value !== '')

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-medium text-gray-900">Filters</h3>
          {hasActiveFilters && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
              {Object.values(filters).filter(v => v !== '').length} active
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center space-x-1"
            >
              <X className="w-4 h-4" />
              <span>Clear all</span>
            </button>
          )}
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search assignments..."
            value={filters.searchQuery}
            onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Course Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course
            </label>
            <select
              value={filters.course}
              onChange={(e) => handleFilterChange('course', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Courses</option>
              {courses.map((course) => (
                <option key={course} value={course}>
                  {course}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assignment Type
            </label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Types</option>
              {types.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Priorities</option>
              {priorities.map((priority) => (
                <option key={priority} value={priority}>
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Active Filter Tags */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
          {filters.course && (
            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full flex items-center space-x-1">
              <span>Course: {filters.course}</span>
              <button
                onClick={() => handleFilterChange('course', '')}
                className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          
          {filters.type && (
            <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full flex items-center space-x-1">
              <span>Type: {filters.type}</span>
              <button
                onClick={() => handleFilterChange('type', '')}
                className="ml-1 hover:bg-green-200 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          
          {filters.priority && (
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full flex items-center space-x-1">
              <span>Priority: {filters.priority}</span>
              <button
                onClick={() => handleFilterChange('priority', '')}
                className="ml-1 hover:bg-yellow-200 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          
          {filters.searchQuery && (
            <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full flex items-center space-x-1">
              <span>Search: "{filters.searchQuery}"</span>
              <button
                onClick={() => handleFilterChange('searchQuery', '')}
                className="ml-1 hover:bg-purple-200 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  )
}
