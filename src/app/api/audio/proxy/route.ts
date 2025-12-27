import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const audioUrl = searchParams.get('url')

    if (!audioUrl) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Only allow Deezer CDN URLs for security
    if (!audioUrl.includes('dzcdn.net')) {
      return NextResponse.json({ error: 'Invalid audio URL' }, { status: 400 })
    }

    // Fetch audio from Deezer CDN
    const response = await fetch(audioUrl)

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch audio' },
        { status: response.status }
      )
    }

    const audioBuffer = await response.arrayBuffer()

    // Return audio with proper headers
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    })
  } catch (error) {
    console.error('Audio proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to proxy audio' },
      { status: 500 }
    )
  }
}
