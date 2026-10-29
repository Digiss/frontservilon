import { NextResponse } from 'next/server'
import { getSessionCookie, login } from '@/lib/backend'
import { backendErrorResponse } from '@/lib/backend-http'

export async function POST(request: Request) {
  try {
    const user = await login(await request.json())
    const response = NextResponse.json({ user })
    response.headers.append('Set-Cookie', getSessionCookie(user.id))
    return response
  } catch (error) {
    return backendErrorResponse(error)
  }
}
