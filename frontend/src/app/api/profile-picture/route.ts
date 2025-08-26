import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const imageUrl = searchParams.get('url')
    
    console.log('Profile picture proxy request:', { imageUrl, url: request.url })
    
    if (!imageUrl) {
      console.error('No image URL provided')
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 })
    }
    
    // Validate that the URL is from Google's domain
    if (!imageUrl.includes('googleusercontent.com')) {
      console.error('Invalid image URL domain:', imageUrl)
      return NextResponse.json({ error: 'Invalid image URL' }, { status: 400 })
    }
    
    console.log('Fetching image from:', imageUrl)
    
    // For now, let's try a simple approach - just redirect to the original URL
    // This will help us test if the issue is with our proxy or with the original URL
    console.log('Redirecting to original URL for now')
    
    return NextResponse.redirect(imageUrl, 302)
    
    // TODO: Uncomment this when we fix the fetch issue
    /*
    // Fetch the image from Google
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ProfilePictureProxy/1.0)',
        'Accept': 'image/*',
      },
      cache: 'no-cache',
    })
    
    console.log('Google response status:', response.status)
    
    if (!response.ok) {
      console.error('Failed to fetch image from Google:', response.status, response.statusText)
      throw new Error(`Failed to fetch image: ${response.status}`)
    }
    
    const contentType = response.headers.get('content-type')
    console.log('Content type:', contentType)
    
    if (!contentType || !contentType.startsWith('image/')) {
      console.error('Invalid content type:', contentType)
      return NextResponse.json({ error: 'Invalid content type' }, { status: 400 })
    }
    
    const imageBuffer = await response.arrayBuffer()
    console.log('Image buffer size:', imageBuffer.byteLength)
    
    // Return the image with appropriate headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
    */
  } catch (error) {
    console.error('Error proxying profile picture:', error)
    return NextResponse.json(
      { error: 'Failed to load profile picture', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
