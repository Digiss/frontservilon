import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/backend'
import { backendErrorResponse } from '@/lib/backend-http'

export async function GET(request: Request) {
  try {
    return NextResponse.json({ user: await getCurrentUser(request) })
  } catch (error) {
    return backendErrorResponse(error)
  }
}
