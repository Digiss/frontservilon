import { NextResponse } from 'next/server'
import { markNotificationRead } from '@/lib/backend'
import { backendErrorResponse } from '@/lib/backend-http'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    return NextResponse.json(await markNotificationRead(request, id))
  } catch (error) {
    return backendErrorResponse(error)
  }
}
