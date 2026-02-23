import { NextRequest, NextResponse } from 'next/server'
import { Storage } from '@google-cloud/storage'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'

// Initialize Google Cloud Storage
const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
})

const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME || 'syllaparse-syllabus-files'
const bucket = storage.bucket(bucketName)

// Public API URL
const publicApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const googleId = formData.get('googleId') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      )
    }

    if (!googleId) {
      return NextResponse.json(
        { error: 'Google ID is required' },
        { status: 400 }
      )
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only PDF files are allowed' },
        { status: 400 }
      )
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const fileExtension = path.extname(file.name)
    const uniqueFilename = `${uuidv4()}${fileExtension}`
    const gcsPath = `uploads/${uniqueFilename}`

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Google Cloud Storage
    const gcsFile = bucket.file(gcsPath)
    await gcsFile.save(buffer, {
      metadata: {
        contentType: file.type,
        metadata: {
          originalFilename: file.name,
          googleId: googleId,
          uploadDate: new Date().toISOString(),
        },
      },
    })

    const publicUrl = `https://storage.googleapis.com/${bucketName}/${gcsPath}`

    // Call Python backend to store file metadata
    const pythonResponse = await fetch(`${publicApiUrl}/files/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        google_id: googleId,
        filename: file.name,
        filepath: publicUrl,
        file_size: file.size,
        content_type: file.type,
      }),
    })

    if (!pythonResponse.ok) {
      const errorData = await pythonResponse.json()
      console.error('Python backend error:', errorData)
      throw new Error(`Python backend failed: ${errorData.message || 'Unknown error'}`)
    }

    const pythonData = await pythonResponse.json()
    console.log('Python backend response:', pythonData)
    
    if (!pythonData.file_id) {
      throw new Error('Python backend did not return file_id')
    }

    return NextResponse.json({
      message: 'File uploaded successfully',
      filename: file.name,
      filepath: publicUrl, 
      file_size: file.size,
      upload_date: new Date().toISOString(),
      file_id: pythonData.file_id, 
    })

  } catch (error: unknown) {
    console.error('Upload error:', error)

    // User-friendly message for Google Cloud billing disabled
    const err = error as { response?: { data?: string; status?: number }; message?: string }
    const rawMessage = typeof err?.response?.data === 'string' ? err.response.data : err?.message ?? ''
    const isBillingDisabled =
      err?.response?.status === 403 &&
      (rawMessage.includes('billing account') ||
        rawMessage.includes('accountDisabled') ||
        rawMessage.includes('disabled in state closed'))

    const userMessage = isBillingDisabled
      ? 'Google Cloud Storage is unavailable: the billing account for this project is disabled. Re-enable billing in Google Cloud Console (Billing) or use a project with an active billing account.'
      : (error instanceof Error ? error.message : 'Unknown error')

    return NextResponse.json(
      {
        error: 'Failed to upload file',
        details: userMessage,
      },
      { status: 500 }
    )
  }
}
