'use client'

import { useState, useEffect } from 'react'
import { BookOpen } from 'lucide-react'
import { useRouter } from 'next/navigation'
import FileUpload from '@/components/general/FileUpload'
import AppHeader from '@/components/general/AppHeader'
import SyllabusHistory from '@/components/general/SyllabusHistory'
import api from '@/utils/api'

export default function Home() {
  const router = useRouter()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [authError, setAuthError] = useState<string | null>(null)
  const [googleId, setGoogleId] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [currentFileId, setCurrentFileId] = useState<number | null>(null)
  const [isCancelled, setIsCancelled] = useState(false)

  // Handle Google ID changes from GoogleSignIn component
  const handleGoogleIdChange = (newGoogleId: string | null) => {
    setGoogleId(newGoogleId)
    setAuthError(null)
  }

  const isAuthenticated = (): boolean => {
    return googleId !== null
  }

  const parseSyllabus = async (file: File) => {
    setIsUploading(true)
    setUploadProgress(0)

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 50) { 
            clearInterval(progressInterval)
            return 50
          }
          return prev + 10
        })
      }, 200)

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

      const fileId = uploadResult.file_id
      console.log('File ID received:', fileId)
      
      setCurrentFileId(fileId)
      
      console.log('Waiting for parsing to complete...')
      
      let parsingComplete = false
      let attempts = 0
      const maxAttempts = 60 
      
      while (!parsingComplete && attempts < maxAttempts) {
        try {
          console.log('Checking parsing status for fileId:', fileId)
          const statusResponse = await api.getParsingStatus(fileId)
          if (statusResponse.ok) {
            const statusData = await statusResponse.json()
            console.log('Parsing status:', statusData)
            
            if (statusData.progress) {
              const realProgress = parseInt(statusData.progress)
              const parsingProgress = (realProgress / 100) * 50
              const combinedProgress = 50 + parsingProgress
              setUploadProgress(combinedProgress)
            }
            
            if (statusData.status === 'completed') {
              parsingComplete = true
              console.log('Parsing completed successfully')
              setUploadProgress(100) 
            } else if (statusData.status === 'failed') {
              throw new Error(`Parsing failed: ${statusData.message}`)
            } else if (statusData.status === 'cancelled') {
              console.log('Parsing was cancelled')
              setIsCancelled(true)
              setIsUploading(false)
              setUploadProgress(0)
              setCurrentFileId(null)
              setSelectedFile(null)
              return // Exit early on cancellation
            } else {
              console.log('Parsing in progress, waiting...')
              await new Promise(resolve => setTimeout(resolve, 5000)) 
              attempts++
            }
          } else {
            console.warn('Failed to get parsing status, retrying...')
            await new Promise(resolve => setTimeout(resolve, 5000))
            attempts++
          }
        } catch (statusError) {
          console.warn('Error checking parsing status:', statusError)
          await new Promise(resolve => setTimeout(resolve, 5000))
          attempts++
        }
      }
      
      if (!parsingComplete) {
        throw new Error('Parsing timed out after 5 minutes')
      }
      
      console.log('Parsing completed, redirecting to stats page...')
      router.push(`/stats?fileId=${fileId}`)
      
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

  const handleCancel = async () => {
    if (currentFileId) {
      try {
        await api.cancelParsing(currentFileId)
        console.log('Parsing cancelled on backend')
      } catch (error) {
        console.error('Failed to cancel parsing on backend:', error)
      }
    }
    
    setIsCancelled(true)
    setIsUploading(false)
    setUploadProgress(0)
    setCurrentFileId(null)
    setSelectedFile(null)
  }

  const handleOldSyllabusSelect = (fileId: number) => {
    if (fileId === 0) {
      setCurrentFileId(null)
    } else {
      console.log('Syllabus selected from history:', fileId)
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
                  currentFileId={currentFileId || undefined}
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
              selectedFile={selectedFile}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
              disabled={!isAuthenticated()}
            />
            

          </div>
        </div>

        {/* Empty State */}
        {!isUploading && !selectedFile && (
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
