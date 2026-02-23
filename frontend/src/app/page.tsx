'use client'

import { useState } from 'react'
import { BookOpen } from 'lucide-react'
import { useRouter } from 'next/navigation'
import FileUpload from '@/components/general/FileUpload'
import AppHeader from '@/components/general/AppHeader'
import SyllabusHistory from '@/components/general/SyllabusHistory'
import api from '@/utils/api'

export default function Home() {
  const router = useRouter()
  const [authError, setAuthError] = useState<string | null>(null)
  const [googleId, setGoogleId] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [activeFile, setActiveFile] = useState<File | null>(null)
  // The database file ID of the currentdf active syllabus
  const [activeFileId, setActiveFileId] = useState<string | null>(null)

  const handleGoogleIdChange = (newGoogleId: string | null) => {
    setGoogleId(newGoogleId)
    setAuthError(null)
  }

  const isAuthenticated = (): boolean => {
    return googleId !== null
  }

  const parseSyllabus = async (file: File) => {
    setIsUploading(true)

    try {
      if (!googleId) {
        setAuthError('User not authenticated. Please sign in with Google first.')
        return
      }
      
      const response = await api.uploadFile(file, googleId)
      const uploadResult = await response.json().catch(() => ({}))

      if (!response.ok) {
        const message = uploadResult?.details ?? uploadResult?.error ?? 'Failed to upload file'
        throw new Error(message)
      }

      const fileId = uploadResult.file_id
      if (!fileId) {
        throw new Error(uploadResult?.error ?? 'Server did not return a file ID')
      }
      setActiveFileId(fileId)
      router.push(`/stats?fileId=${fileId}`)
    } catch (error) {
      console.error('Error uploading file:', error)
      setAuthError(error instanceof Error ? error.message : 'Failed to upload file. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileSelect = (file: File) => {
    setActiveFile(file)
    setAuthError(null)
  }

  const handleUpload = () => {
    if (activeFile) {
      parseSyllabus(activeFile)
    }
  }

  const handleCancel = () => {
    setIsUploading(false)
    setActiveFileId(null)
    setActiveFile(null)
  }

  const handleOldSyllabusSelect = (fileId: string | null) => {
    if (!fileId) {
      setActiveFileId(null)
    } else {
      console.log('Syllabus selected from history:', fileId)
      setActiveFileId(fileId)
      router.push(`/stats?fileId=${fileId}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <AppHeader onGoogleIdChange={handleGoogleIdChange} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Previous syllabus uploads */}
          {isAuthenticated() && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  <BookOpen className="w-5 h-5 inline mr-2 text-blue-600" />
                  Previous Syllabi
                </h3>
              </div>
              
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Access your previously uploaded syllabi and their extracted assignments, exams, and lecture schedules.
                </p>
                
                <SyllabusHistory
                  googleId={googleId}
                  onSyllabusSelect={handleOldSyllabusSelect}
                  activeFileId={activeFileId || undefined}
                />
              </div>
            </div>
          )}

          {/* Upload Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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
              onCancel={handleCancel}
              activeFile={activeFile}
              isUploading={isUploading}
              disabled={!isAuthenticated()}
            />
            

          </div>
        </div>

        {/* Empty State */}
        {!isUploading && !activeFile && (
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Ready to parse your syllabus
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
