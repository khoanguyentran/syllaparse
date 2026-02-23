'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, History, Trash2, Eye, Calendar } from 'lucide-react'
import { SyllabusFile } from '@/types'
import api from '@/utils/api'

interface SyllabusHistoryProps {
  googleId: string | null
  onSyllabusSelect: (fileId: string | null) => void
  activeFileId?: string
}

export default function SyllabusHistory({ 
  googleId, 
  onSyllabusSelect, 
  activeFileId 
}: SyllabusHistoryProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [syllabusFiles, setSyllabusFiles] = useState<SyllabusFile[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (googleId && isOpen) {
      loadSyllabusHistory()
    }
  }, [googleId, isOpen])

  const loadSyllabusHistory = async () => {
    if (!googleId) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await api.getFiles(undefined, googleId)
      if (!response.ok) {
        throw new Error('Failed to load syllabus history')
      }
      
      const data = await response.json()
      setSyllabusFiles(data.files || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load syllabus history')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteSyllabus = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this syllabus? This action cannot be undone.')) {
      return
    }
    
    try {
      const response = await api.deleteFile(fileId)
      if (!response.ok) {
        throw new Error('Failed to delete syllabus')
      }
      
      setSyllabusFiles(prev => prev.filter(file => file.file_id !== fileId))
      
      if (activeFileId === fileId) {
        onSyllabusSelect(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete syllabus')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getCurrentSyllabusName = () => {
    if (!activeFileId) return 'Select Syllabus'
    const currentFile = syllabusFiles.find(file => file.file_id === activeFileId)
    return currentFile ? currentFile.filename : 'Select Syllabus'
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <div className="flex items-center space-x-2">
          <History className="w-4 h-4 text-gray-500" />
          <span className="truncate">{getCurrentSyllabusName()}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2">Loading...</p>
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-500">
              <p>{error}</p>
              <button
                onClick={loadSyllabusHistory}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Try again
              </button>
            </div>
          ) : syllabusFiles.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <p>No syllabus files found</p>
            </div>
          ) : (
            <div className="py-2">
              {syllabusFiles.map((file) => (
                <div
                  key={file.file_id}
                  className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-l-4 ${
                    activeFileId === file.file_id 
                      ? 'border-l-blue-500 bg-blue-50' 
                      : 'border-l-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div 
                      className="flex-1 min-w-0"
                      onClick={() => {
                        onSyllabusSelect(file.file_id)
                        setIsOpen(false)
                      }}
                    >
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.filename}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 whitespace-nowrap">
                        Uploaded {formatDate(file.upload_date)}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-2">
                      <button
                        onClick={() => {
                          onSyllabusSelect(file.file_id)
                          setIsOpen(false)
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="View this syllabus"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSyllabus(file.file_id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete this syllabus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}