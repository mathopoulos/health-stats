import { NextRequest, NextResponse } from "next/server";

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    return NextResponse.json({ 
      success: true,
      message: "API endpoint initialized"
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 