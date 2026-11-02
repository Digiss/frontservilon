'use client'

import { useState } from 'react'
import { api, type Job } from '@/lib/api'
import { ReviewScreen } from './review-screen'

export function ClientServiceCompletion({ job, onBack }: { job: Job; onBack: () => void }) {
  const [reviewOpen, setReviewOpen] = useState(false)
  const [status, setStatus] = useState(job.status)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState(false)
  if (reviewOpen) return <ReviewScreen jobId={job.id} providerId={job.providerId || 0} providerName={job.provider} onBack={() => { setReviewOpen(false); onBack() }} />

  const dueDate = job.dueDate || job.duration || 'Não informado'
  const price = job.salaryMin === job.salaryMax ? `R$ ${job.salaryMin.toLocaleString('pt-BR')}` : `R$ ${job.salaryMin.toLocaleString('pt-BR')}–${job.salaryMax.toLocaleString('pt-BR')}`
  const updateStatus = async (nextStatus: Job['status']) => {
    setUpdating(true)
    setError('')
    try {
      await api.updateJobStatus(job.id, nextStatus)
      setStatus(nextStatus)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível atualizar o trabalho.')
    } finally {
      setUpdating(false)
    }
  }
  const confirmCompletion = async () => {
    setUpdating(true)
    setError('')
    try {
      await api.confirmClientCompletion(job.id)
      setReviewOpen(true)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível confirmar a conclusão.')
    } finally {
      setUpdating(false)
    }
  }

  return <section className="rounded-2xl border border-black/10 bg-[#effbf2] p-4 text-black">
    <button onClick={onBack} className="mb-4 text-[11px] font-bold text-[#087a39]">← Voltar</button>
    <div className="flex items-start justify-between gap-3"><div><span className="text-[10px] font-bold uppercase tracking-wide text-[#087a39]">{job.category} · {job.subSector}</span><h2 className="mt-1 text-[18px] font-extrabold">{job.title}</h2></div><span className="rounded-full bg-[#d5f2dd] px-2 py-1 text-[10px] font-bold text-[#087a39]">{status}</span></div>
    <p className="mt-4 text-[11px] leading-relaxed opacity-75">{job.description}</p>
    <div className="mt-4 grid grid-cols-2 gap-2"><div className="rounded-xl bg-black/5 p-3"><span className="block text-[9px] opacity-55">Valor</span><strong className="mt-1 block text-[12px]">{price}</strong></div><div className="rounded-xl bg-black/5 p-3"><span className="block text-[9px] opacity-55">Entrega</span><strong className="mt-1 block text-[12px]">{dueDate}</strong></div><div className="rounded-xl bg-black/5 p-3"><span className="block text-[9px] opacity-55">Pessoa responsável</span><strong className="mt-1 block text-[12px]">{job.provider || 'A definir'}</strong></div><div className="rounded-xl bg-black/5 p-3"><span className="block text-[9px] opacity-55">Status atual</span><strong className="mt-1 block text-[12px]">{job.clientConfirmedAt ? job.reviewPending ? 'Avaliação pendente' : 'Concluído e avaliado' : status}</strong></div></div>
    <div className="mt-4 rounded-xl border border-black/10 p-3"><p className="text-[9px] font-bold uppercase tracking-wide text-[#087a39]">Responsável pelo serviço</p><p className="mt-1 text-[11px]">{job.provider || 'Prestador ainda não definido'}</p><p className="mt-1 text-[10px] opacity-60">Setor: {job.category} · {job.subSector}</p></div>
    {error && <p role="alert" className="mt-3 rounded-xl bg-red-500/10 p-3 text-[11px] text-red-600">{error}</p>}
    {/* Validações de estado da interface temporariamente comentadas para teste; o backend mantém suas regras. */}
    {/* job.clientConfirmedAt ? job.reviewPending
      ? <button onClick={() => setReviewOpen(true)} className="mt-4 w-full rounded-xl bg-[#087a39] px-4 py-3 text-[11px] font-bold text-white">Continuar avaliação</button>
      : <p className="mt-4 rounded-xl bg-black/5 p-3 text-[11px]">Conclusão confirmada. A avaliação enviada fica disponível no seu histórico.</p>
      : <>
        {job.providerCompletedAt
          ? <button disabled={updating} onClick={() => { void confirmCompletion() }} className="mt-4 w-full rounded-xl bg-[#087a39] px-4 py-3 text-[11px] font-bold text-white disabled:opacity-50">{updating ? 'Confirmando...' : 'Confirmar conclusão e avaliar'}</button>
          : <p className="mt-4 rounded-xl bg-black/5 p-3 text-[11px]">O prestador precisa marcar o serviço como concluído antes da confirmação do cliente.</p>}
        {job.providerUserId && status === 'Em andamento' && <button disabled={updating} onClick={() => { void updateStatus('Pausado') }} className="mt-2 w-full rounded-xl border border-[#087a39] px-4 py-3 text-[11px] font-bold text-[#087a39] disabled:opacity-50">Pausar trabalho</button>}
        {(status === 'Não iniciado' || status === 'Em análise' || status === 'Pausado' || status === 'Em planejamento' || status === 'Em andamento') && <button disabled={updating} onClick={() => { if (window.confirm('Tem certeza que deseja cancelar este trabalho?')) void updateStatus('Cancelado') }} className="mt-2 w-full rounded-xl border border-red-500/30 px-4 py-3 text-[11px] font-bold text-red-600 disabled:opacity-50">Cancelar trabalho</button>}
      </>} */}
    <button onClick={() => setReviewOpen(true)} className="mt-4 w-full rounded-xl bg-[#087a39] px-4 py-3 text-[11px] font-bold text-white">Continuar avaliação</button>
    <button disabled={updating} onClick={() => { void confirmCompletion() }} className="mt-4 w-full rounded-xl bg-[#087a39] px-4 py-3 text-[11px] font-bold text-white disabled:opacity-50">{updating ? 'Confirmando...' : 'Confirmar conclusão e avaliar'}</button>
    <button disabled={updating} onClick={() => { void updateStatus('Pausado') }} className="mt-2 w-full rounded-xl border border-[#087a39] px-4 py-3 text-[11px] font-bold text-[#087a39] disabled:opacity-50">Pausar trabalho</button>
    <button disabled={updating} onClick={() => { /* if (window.confirm('Tem certeza que deseja cancelar este trabalho?')) */ void updateStatus('Cancelado') }} className="mt-2 w-full rounded-xl border border-red-500/30 px-4 py-3 text-[11px] font-bold text-red-600 disabled:opacity-50">Cancelar trabalho</button>
  </section>
}
