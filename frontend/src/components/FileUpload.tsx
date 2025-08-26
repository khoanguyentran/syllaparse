'use client'

import { useState, useCallback } from 'react'
import { Upload, FileText, X } from 'lucide-react'
import clsx from 'clsx'

interface FileUploadProps {
  onFileSelect: (file: File) => void
  onUpload: () => void
  selectedFile: File | null
  isUploading: boolean
  uploadProgress: number
  acceptedTypes?: string[]
  maxSize?: number // in MB
  disabled?: boolean // New prop for authentication state
}

export default function FileUpload({
  onFileSelect,
  onUpload,
  selectedFile,
  isUploading,
  uploadProgress,
  acceptedTypes = ['.pdf'],
  maxSize = 10,
  disabled = false
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validateFile = (file: File): string | null => {
    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!acceptedTypes.includes(fileExtension)) {
      return `File type not supported. Please upload: ${acceptedTypes.join(', ')}`
    }

    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      return `File size too large. Maximum size: ${maxSize}MB`
    }

    return null
  }

  const handleFileSelect = (file: File) => {
    setError(null)
    const validationError = validateFile(file)
    
    if (validationError) {
      setError(validationError)
      return
    }
    
    onFileSelect(file)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const removeFile = () => {
    onFileSelect(null as any)
    setError(null)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="w-full">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Upload className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Upload Your Syllabus
        </h2>
        <p className="text-gray-600 mb-6">
          Upload a PDF syllabus and we'll extract all the important dates and assignments
        </p>
        
        <div className="max-w-md mx-auto">
          <div
            className={clsx(
              "flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200",
              isDragOver
                ? "border-blue-400 bg-blue-50"
                : "border-gray-300 bg-gray-50 hover:bg-gray-100"
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className={clsx(
                  "w-8 h-8 mb-2 transition-colors",
                  isDragOver ? "text-blue-500" : "text-gray-400"
                )} />
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">
                  {acceptedTypes.join(', ')} files, max {maxSize}MB
                </p>
              </div>
              <input 
                type="file" 
                className="hidden" 
                accept={acceptedTypes.join(',')}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileSelect(file)
                }}
              />
            </label>
          </div>
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
          
          {selectedFile && !error && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-blue-600">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={removeFile}
                  className="p-1 hover:bg-blue-100 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-blue-600" />
                </button>
              </div>
            </div>
          )}
          
          <button
            onClick={onUpload}
            disabled={!selectedFile || isUploading || !!error}
            className={clsx(
              "mt-4 w-full px-4 py-2 rounded-lg font-medium transition-colors",
              selectedFile && !isUploading && !error
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            )}
          >
            {isUploading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing... {uploadProgress}%</span>
              </div>
            ) : (
              "Parse Syllabus"
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
