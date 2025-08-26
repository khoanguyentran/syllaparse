import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { googleUser } = body

    if (!googleUser || !googleUser.id || !googleUser.email || !googleUser.name) {
      return NextResponse.json(
        { error: 'Invalid Google user data' },
        { status: 400 }
      )
    }

    // Call your Python backend to handle Google authentication
    const pythonBackendUrl = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000'
    
    const response = await fetch(`${pythonBackendUrl}/auth/google/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        google_id: googleUser.id,
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Python backend auth error:', errorData)
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: response.status }
      )
    }

    const authResult = await response.json()
    
    // Return the authentication result
    return NextResponse.json({
      success: true,
      user: authResult.user,
      message: authResult.message,
      is_new_user: authResult.is_new_user
    })

  } catch (error) {
    console.error('Google auth error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
