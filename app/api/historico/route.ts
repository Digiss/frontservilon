import { NextResponse } from 'next/server'
import { listHistory } from '@/lib/backend'
import { backendErrorResponse } from '@/lib/backend-http'
import type { HistoryType } from '@/lib/api'

const historyTypes: HistoryType[] = ['concluidos', 'andamento', 'avaliacoes', 'profissionais']

export async function GET(request: Request) {
  try {
    const type = new URL(request.url).searchParams.get('tipo') || 'concluidos'
    if (!historyTypes.includes(type as HistoryType)) {
      return NextResponse.json({ error: 'Tipo de histórico inválido.' }, { status: 400 })
    }
    return NextResponse.json(await listHistory(request, type))
  } catch (error) {
    return backendErrorResponse(error)
  }
}
