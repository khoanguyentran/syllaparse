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

// Python backend URL
const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000'

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
    const pythonResponse = await fetch(`${PYTHON_BACKEND_URL}/files/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        google_id: googleId,
        filename: file.name,
        filepath: publicUrl,  // Send complete GCS public URL
        file_size: file.size,
        content_type: file.type,
      }),
    })

    if (!pythonResponse.ok) {
      const errorData = await pythonResponse.json()
      console.error('Python backend error:', errorData)
      // Even if Python backend fails, we still have the file in GCS
      // You might want to handle this differently based on your requirements
    }

    // Return success response
    return NextResponse.json({
      message: 'File uploaded successfully',
      filename: file.name,
      filepath: publicUrl,  // Return complete GCS public URL
      file_size: file.size,
      upload_date: new Date().toISOString(),
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to upload file',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
