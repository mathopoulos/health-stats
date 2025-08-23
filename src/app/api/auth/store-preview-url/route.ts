import { NextRequest, NextResponse } from 'next/server';
import { storePreviewUrl, getPreviewUrl } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { key, previewUrl } = await request.json();
    
    if (!key || !previewUrl) {
      return NextResponse.json({ error: 'Key and previewUrl are required' }, { status: 400 });
    }
    
    // Store the preview URL using the shared cache
    storePreviewUrl(key, previewUrl);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error storing preview URL:', error);
    return NextResponse.json({ error: 'Failed to store preview URL' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const key = url.searchParams.get('key');
  
  if (!key) {
    return NextResponse.json({ error: 'Key is required' }, { status: 400 });
  }
  
  const previewUrl = getPreviewUrl(key);
  
  return NextResponse.json({ previewUrl });
}
