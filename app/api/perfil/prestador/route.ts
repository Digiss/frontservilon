import { NextResponse } from 'next/server'
import { convertClientToProvider } from '@/lib/backend'
import { backendErrorResponse } from '@/lib/backend-http'

export async function POST(request: Request) {
  try {
    const body = await request.json() as { CPF?: string }
    const user = await convertClientToProvider(request, body.CPF ?? '')
    return NextResponse.json({ user })
  } catch (error) {
    return backendErrorResponse(error)
  }
}
