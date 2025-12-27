import { NextResponse } from 'next/server'

interface DeezerTrackResponse {
  id: number
  title: string
  preview: string
  artist: {
    name: string
  }
  album: {
    title: string
    cover_medium: string
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const trackId = searchParams.get('id')

    if (!trackId) {
      return NextResponse.json(
        { error: 'Track ID is required' },
        { status: 400 }
      )
    }

    // Validate trackId format (should be numeric)
    if (!/^\d+$/.test(trackId)) {
      return NextResponse.json(
        { error: 'Invalid track ID format' },
        { status: 400 }
      )
    }

    // Fetch track info from Deezer API
    const response = await fetch(`https://api.deezer.com/track/${trackId}`)

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch track from Deezer' },
        { status: response.status }
      )
    }

    const data: DeezerTrackResponse = await response.json()

    // Check if track has a preview
    if (!data.preview) {
      return NextResponse.json(
        { error: 'No preview available for this track' },
        { status: 404 }
      )
    }

    // Return simplified track info
    return NextResponse.json({
      id: data.id,
      title: data.title,
      artist: data.artist.name,
      album: data.album.title,
      preview: data.preview,
      cover: data.album.cover_medium,
    })
  } catch (error) {
    console.error('Deezer API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch track info' },
      { status: 500 }
    )
  }
}
