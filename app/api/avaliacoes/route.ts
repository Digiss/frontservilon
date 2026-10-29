import { NextResponse } from 'next/server'
import { listReviews, submitReview } from '@/lib/backend'
import { backendErrorResponse } from '@/lib/backend-http'

export async function GET() {
  try {
    return NextResponse.json(await listReviews())
  } catch (error) {
    return backendErrorResponse(error)
  }
}

export async function POST(request: Request) {
  try {
    return NextResponse.json(await submitReview(request, await request.json()), { status: 201 })
  } catch (error) {
    return backendErrorResponse(error)
  }
}
