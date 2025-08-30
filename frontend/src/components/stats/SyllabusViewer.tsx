'use client'

import { useState } from 'react'
import { FileText, Eye, List } from 'lucide-react'
import clsx from 'clsx'

interface SyllabusViewerProps {
  content: string
  pdfFile?: File | null
}

export default function SyllabusViewer({ content, pdfFile }: SyllabusViewerProps) {
  const [viewMode, setViewMode] = useState<'pdf' | 'summary'>(pdfFile ? 'pdf' : 'summary')

  // Generate PDF blob URL for viewing
  const getPdfUrl = () => {
    if (!pdfFile) return null
    return URL.createObjectURL(pdfFile)
  }

  const pdfUrl = getPdfUrl()

  // Clean up blob URL when component unmounts
  const cleanupPdfUrl = () => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl)
    }
  }

  // Simple markdown-like rendering for syllabus content
  const renderContent = (text: string) => {
    if (!text) return <p className="text-gray-500 italic">No syllabus content available</p>
    
    return text.split('\n').map((line, index) => {
      // Handle headers
      if (line.startsWith('# ')) {
        return <h1 key={index} className="text-2xl font-bold text-gray-900 mb-4">{line.substring(2)}</h1>
      }
      if (line.startsWith('## ')) {
        return <h2 key={index} className="text-xl font-semibold text-gray-800 mb-3 mt-6">{line.substring(3)}</h2>
      }
      if (line.startsWith('### ')) {
        return <h3 key={index} className="text-lg font-medium text-gray-700 mb-2 mt-4">{line.substring(4)}</h3>
      }
      
      // Handle bullet points
      if (line.startsWith('- ')) {
        return <li key={index} className="text-gray-700 mb-1 ml-4">{line.substring(2)}</li>
      }
      
      // Handle bold text
      if (line.includes('**')) {
        const parts = line.split('**')
        return (
          <p key={index} className="text-gray-700 mb-2">
            {parts.map((part, partIndex) => 
              partIndex % 2 === 1 ? 
                <strong key={partIndex} className="font-semibold">{part}</strong> : 
                part
            )}
          </p>
        )
      }
      
      // Handle empty lines
      if (line.trim() === '') {
        return <div key={index} className="h-2"></div>
      }
      
      // Regular text
      return <p key={index} className="text-gray-700 mb-2">{line}</p>
    })
  }

  return (
    <div className="space-y-4">
      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-medium text-gray-700">View Mode</span>
        </div>
        
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('pdf')}
            className={clsx(
              "flex items-center space-x-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
              viewMode === 'pdf'
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            <Eye className="w-4 h-4" />
            <span>PDF</span>
          </button>
          
          <button
            onClick={() => setViewMode('summary')}
            className={clsx(
              "flex items-center space-x-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
              viewMode === 'summary'
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            <List className="w-4 h-4" />
            <span>Summary</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-gray-50 rounded-lg border border-gray-200">
        {viewMode === 'pdf' ? (
          <div className="h-[600px]">
            {pdfFile ? (
              <iframe
                src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                className="w-full h-full rounded-lg"
                title="Syllabus PDF Viewer"
                onLoad={cleanupPdfUrl}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No PDF file available</p>
                  <p className="text-sm text-gray-400">Switch to Summary view for parsed content</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 h-[600px] overflow-y-auto custom-scrollbar">
            {renderContent(content)}
          </div>
        )}
      </div>

      {/* View Mode Info */}
      <div className="text-xs text-gray-500 text-center">
        {viewMode === 'pdf' 
          ? 'Viewing original PDF document'
          : 'Viewing summarized content'
        }
      </div>
    </div>
  )
}
