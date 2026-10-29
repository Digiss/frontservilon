import { NextResponse } from 'next/server'
import { listNotifications } from '@/lib/backend'
import { backendErrorResponse } from '@/lib/backend-http'

export async function GET(request: Request) {
  try {
    return NextResponse.json(await listNotifications(request))
  } catch (error) {
    return backendErrorResponse(error)
  }
}
