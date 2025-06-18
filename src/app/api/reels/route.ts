import { NextRequest, NextResponse } from 'next/server';
import { createReel, getAllReels, getReelById, updateReel, deleteReel } from '@/lib/reel-manager';
// Note: VideoFile and DirectorInfo types are available if needed for function parameters

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (id) {
      const reel = getReelById(id);
      if (!reel) {
        return NextResponse.json({ error: 'Reel not found' }, { status: 404 });
      }
      return NextResponse.json(reel);
    }
    
    const reels = getAllReels();
    return NextResponse.json(reels);
  } catch (error) {
    console.error('Error fetching reels:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { videos, title, description, directorInfo, editState } = body;
    
    if (!videos || !Array.isArray(videos) || videos.length === 0) {
      return NextResponse.json({ error: 'Videos array is required' }, { status: 400 });
    }
    
    const newReel = createReel(videos, title, description, directorInfo, editState);
    return NextResponse.json(newReel, { status: 201 });
  } catch (error) {
    console.error('Error creating reel:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'Reel ID is required' }, { status: 400 });
    }
    
    const updatedReel = updateReel(id, updates);
    
    if (!updatedReel) {
      return NextResponse.json({ error: 'Reel not found' }, { status: 404 });
    }
    
    return NextResponse.json(updatedReel);
  } catch (error) {
    console.error('Error updating reel:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get the ID from the query parameters
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Reel ID is required' }, { status: 400 });
    }
    
    // Delete the reel and check if it was successful
    const success = deleteReel(id);
    
    if (!success) {
      return NextResponse.json({ error: 'Reel not found' }, { status: 404 });
    }
    
    // Return success response
    return NextResponse.json({ success: true, message: 'Reel deleted successfully' });
  } catch (error) {
    console.error('Error deleting reel:', error);
    return NextResponse.json({ error: 'Failed to delete reel' }, { status: 500 });
  }
}
