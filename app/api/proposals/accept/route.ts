import { NextResponse } from 'next/server'
import {
  authBackendErrorResponse,
  requestServilonBackend,
  servilonBackendResponse,
} from '@/lib/auth-backend'

export async function POST(request: Request) {
  let payload: { ProposalId?: number }
  try {
    payload = await request.json() as typeof payload
  } catch {
    return NextResponse.json({ error: 'O corpo da solicitação deve ser um JSON válido.' }, { status: 400 })
  }

  if (!payload || !Number.isInteger(payload.ProposalId) || !payload.ProposalId || payload.ProposalId < 1) {
    return NextResponse.json({ error: 'ProposalId deve ser um inteiro positivo.' }, { status: 400 })
  }

  try {
    const response = await requestServilonBackend(request, '/api/Proposal/AcceptProposal', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    return servilonBackendResponse(response)
  } catch (error) {
    return authBackendErrorResponse(error)
  }
}
