import { NextResponse } from 'next/server'
import { listMessages, sendMessage } from '@/lib/backend'
import { backendErrorResponse } from '@/lib/backend-http'
import type { ChatMessage } from '@/lib/api'

export async function GET(request: Request) {
  try {
    const conversationId = new URL(request.url).searchParams.get('conversationId') || ''
    return NextResponse.json(await listMessages(request, conversationId))
  } catch (error) {
    return backendErrorResponse(error)
  }
}

export async function POST(request: Request) {
  try {
    return NextResponse.json(await sendMessage(request, await request.json() as Omit<ChatMessage, 'id' | 'createdAt' | 'status'>), { status: 201 })
  } catch (error) {
    return backendErrorResponse(error)
  }
}
