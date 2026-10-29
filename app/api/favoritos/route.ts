import { NextResponse } from 'next/server'
import { addFavorite, listFavoriteIds, removeFavorite } from '@/lib/backend'
import { backendErrorResponse } from '@/lib/backend-http'

export async function GET(request: Request) {
  try {
    return NextResponse.json(await listFavoriteIds(request))
  } catch (error) {
    return backendErrorResponse(error)
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { jobId: number }
    if (!Number.isInteger(body.jobId)) return NextResponse.json({ error: 'jobId inválido.' }, { status: 400 })
    return NextResponse.json(await addFavorite(request, body.jobId), { status: 201 })
  } catch (error) {
    return backendErrorResponse(error)
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json() as { jobId: number }
    if (!Number.isInteger(body.jobId)) return NextResponse.json({ error: 'jobId inválido.' }, { status: 400 })
    await removeFavorite(request, body.jobId)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return backendErrorResponse(error)
  }
}
