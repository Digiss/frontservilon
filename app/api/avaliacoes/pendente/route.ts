import { NextResponse } from 'next/server'
import { markReviewPending } from '@/lib/backend'
import { backendErrorResponse } from '@/lib/backend-http'

export async function POST(request: Request) {
  try {
    const body = await request.json() as { jobId: number }
    return NextResponse.json(await markReviewPending(request, body.jobId))
  } catch (error) {
    return backendErrorResponse(error)
  }
}
