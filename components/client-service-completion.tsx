'use client'

import { useEffect, useMemo, useState } from 'react'
import { api, type Role, type ServiceRecord, type WorkStatus } from '@/lib/api'
import { ReviewScreen } from './review-screen'

function normalized(value: string) {
  return value.trim().toLocaleLowerCase('pt-BR')
}

export function ClientServiceCompletion({
  service: initialService,
  role,
  onBack,
  onUpdated,
}: {
  service: ServiceRecord
  role: Role
  onBack: () => void
  onUpdated: () => void
}) {
  const [service, setService] = useState(initialService)
  const [statuses, setStatuses] = useState<WorkStatus[] | null>(null)
  const [nextStatusId, setNextStatusId] = useState<number | null>(null)
  const [participantNames, setParticipantNames] = useState<{ clientName: string; freelancerName: string } | null>(null)
  const [participantNamesError, setParticipantNamesError] = useState('')
  const [reviewOpen, setReviewOpen] = useState(false)
  const [hasReview, setHasReview] = useState<boolean | null>(null)
  const [loadingReview, setLoadingReview] = useState(false)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    let active = true
    api.getWorkStatuses()
      .then(items => { if (active) setStatuses(items) })
      .catch(reason => {
        if (active) setError(reason instanceof Error ? reason.message : 'Não foi possível carregar os status do serviço.')
      })
    return () => { active = false }
  }, [])

  useEffect(() => {
    let active = true
    api.getServiceParticipantNames(service.clientId, service.freelancerId)
      .then(names => { if (active) setParticipantNames(names) })
      .catch(reason => {
        if (active) setParticipantNamesError(reason instanceof Error
          ? reason.message
          : 'Não foi possível carregar os nomes dos participantes.')
      })
    return () => { active = false }
  }, [service.clientId, service.freelancerId])

  useEffect(() => {
    if (role !== 'cliente' || normalized(service.status) !== 'finalizado') return
    let active = true
    setLoadingReview(true)
    api.getServiceReviews(service.id)
      .then(reviews => { if (active) setHasReview(reviews.length > 0) })
      .catch(reason => {
        if (active) setError(reason instanceof Error ? reason.message : 'Não foi possível consultar a avaliação.')
      })
      .finally(() => { if (active) setLoadingReview(false) })
    return () => { active = false }
  }, [role, service.id, service.status])

  const statusByName = useMemo(() => {
    const map = new Map<string, WorkStatus>()
    for (const status of statuses || []) map.set(normalized(status.statusName), status)
    return map
  }, [statuses])
  const statusName = normalized(service.status)
  const provider = role === 'prestador'
  const isAwaitingApproval = statusName === 'aguardando aprovação'
  const isFinalized = statusName === 'finalizado' || statusName === 'concluído'
  const isCancelled = statusName === 'cancelado'
  const finalStatus = statusByName.get('finalizado')
  const completionStatus = finalStatus || statusByName.get('concluído')
  const initialStatus = statusName === 'não iniciado' || statusName === 'aberto'
  const providerStatusOptions = useMemo(() => {
    if (!statuses || isAwaitingApproval || isFinalized || isCancelled) return []

    return statuses.filter(status => {
      const name = normalized(status.statusName)
      if (status.id === service.workStatusId || name === 'aguardando aprovação') return false
      if (initialStatus) return name === 'em andamento' || name === 'cancelado'
      if (name === 'finalizado' || name === 'concluído') return status.id === completionStatus?.id
      if (statusName === 'em andamento') return name === 'pausado' || name === 'cancelado'
      if (statusName === 'pausado') return name === 'em andamento' || name === 'cancelado'
      return name !== 'aberto' && name !== 'não iniciado'
    })
  }, [statuses, isAwaitingApproval, isFinalized, isCancelled, service.workStatusId, completionStatus, initialStatus, statusName])
  const selectedProviderStatus = providerStatusOptions.find(status => status.id === nextStatusId)
  const dateLimit = service.dateLimit
    ? new Date(`${service.dateLimit.slice(0, 10)}T00:00:00`).toLocaleDateString('pt-BR')
    : 'Não informado'

  useEffect(() => {
    setNextStatusId(null)
  }, [service.id, service.workStatusId])

  const updateStatus = async (workStatusId: number) => {
    setUpdating(true)
    setError('')
    try {
      await api.updateServiceStatus(service.id, workStatusId)
      const [updated] = await api.getServiceHistory(service.id)
      if (!updated) throw new Error('O serviço não apareceu no histórico após a atualização.')
      setService(updated)
      setNextStatusId(null)
      setHasReview(null)
      onUpdated()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível atualizar o serviço.')
    } finally {
      setUpdating(false)
    }
  }

  if (reviewOpen) {
    return <ReviewScreen
      serviceId={service.id}
      providerName={participantNames?.freelancerName || `Prestador #${service.freelancerId}`}
      onBack={() => setReviewOpen(false)}
      onSubmitted={() => { setHasReview(true); onUpdated() }}
    />
  }

  return <section className={`rounded-2xl border p-4 ${provider ? 'border-white/10 bg-[#111827] text-white' : 'border-black/10 bg-[#effbf2] text-black'}`}>
    <button onClick={onBack} className={`mb-4 text-[11px] font-bold ${provider ? 'text-[#35d878]' : 'text-[#087a39]'}`}>← Voltar</button>
    <div className="flex items-start justify-between gap-3">
      <div>
        <span className={`text-[10px] font-bold uppercase tracking-wide ${provider ? 'text-[#35d878]' : 'text-[#087a39]'}`}>Serviço #{service.id}</span>
        <h2 className="mt-1 text-[18px] font-extrabold">{service.title}</h2>
      </div>
      <span className="rounded-full bg-current/10 px-2 py-1 text-[10px] font-bold">{service.status}</span>
    </div>
    {service.description && <p className="mt-4 text-[11px] leading-relaxed opacity-75">{service.description}</p>}
    <div className="mt-4 grid grid-cols-2 gap-2">
      <div className="rounded-xl bg-current/5 p-3"><span className="block text-[9px] opacity-55">Valor acordado</span><strong className="mt-1 block text-[12px]">{service.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></div>
      <div className="rounded-xl bg-current/5 p-3"><span className="block text-[9px] opacity-55">Prazo</span><strong className="mt-1 block text-[12px]">{dateLimit}</strong></div>
      <div className="rounded-xl bg-current/5 p-3"><span className="block text-[9px] opacity-55">Cliente</span><strong className="mt-1 block text-[12px]">{participantNames?.clientName || `#${service.clientId}`}</strong></div>
      <div className="rounded-xl bg-current/5 p-3"><span className="block text-[9px] opacity-55">Prestador</span><strong className="mt-1 block text-[12px]">{participantNames?.freelancerName || `#${service.freelancerId}`}</strong></div>
    </div>
    {participantNamesError && <p role="status" className="mt-2 text-[9px] opacity-60">Não foi possível carregar os nomes; exibindo os IDs. {participantNamesError}</p>}
    {error && <p role="alert" className="mt-3 rounded-xl bg-red-500/10 p-3 text-[11px] text-red-600">{error}</p>}

    {provider && !isAwaitingApproval && !isFinalized && !isCancelled && <>
      {statuses === null
        ? !error && <p className="mt-4 rounded-xl bg-current/5 p-3 text-[10px] opacity-70">Carregando opções de status...</p>
        : providerStatusOptions.length
          ? <div className="mt-4 space-y-2">
            <label className="block text-[10px] font-bold">
              Alterar status do serviço
              <select
                value={nextStatusId ?? ''}
                onChange={event => setNextStatusId(event.target.value ? Number(event.target.value) : null)}
                disabled={updating}
                className="mt-1 w-full rounded-xl border border-current/15 bg-transparent px-3 py-3 text-[11px]"
              >
                <option value="">Selecione o próximo status</option>
                {providerStatusOptions.map(status => <option key={status.id} value={status.id}>{status.statusName}</option>)}
              </select>
            </label>
            <button
              disabled={updating || selectedProviderStatus === undefined}
              onClick={() => { if (selectedProviderStatus) void updateStatus(selectedProviderStatus.id) }}
              className="w-full rounded-xl bg-[#35d878] px-4 py-3 text-[11px] font-bold text-black disabled:opacity-50"
            >
              {updating
                ? 'Atualizando...'
                : selectedProviderStatus && normalized(selectedProviderStatus.statusName) === 'em andamento'
                  ? initialStatus ? 'Iniciar serviço' : 'Retomar serviço'
                  : selectedProviderStatus && ['finalizado', 'concluído'].includes(normalized(selectedProviderStatus.statusName))
                    ? normalized(selectedProviderStatus.statusName) === 'finalizado' ? 'Solicitar aprovação' : 'Marcar como concluído'
                    : selectedProviderStatus ? `Atualizar para ${selectedProviderStatus.statusName}` : 'Atualizar status'}
            </button>
          </div>
          : <p className="mt-4 rounded-xl bg-current/5 p-3 text-[10px] opacity-70">
            Não há outros status disponíveis para este serviço.
          </p>}
    </>}
    {provider && isAwaitingApproval && <p className="mt-4 rounded-xl bg-current/5 p-3 text-[10px] opacity-70">O serviço está aguardando a aprovação do cliente.</p>}

    {!provider && isAwaitingApproval && finalStatus && <button
      disabled={updating}
      onClick={() => { void updateStatus(finalStatus.id) }}
      className="mt-4 w-full rounded-xl bg-[#087a39] px-4 py-3 text-[11px] font-bold text-white disabled:opacity-50"
    >
      {updating ? 'Confirmando...' : 'Concluir serviço'}
    </button>}
    {!provider && !isAwaitingApproval && !isFinalized && !isCancelled && <p className="mt-4 rounded-xl bg-current/5 p-3 text-[10px] opacity-70">O botão de conclusão será liberado quando o prestador solicitar a aprovação.</p>}
    {!provider && isCancelled && <p className="mt-4 rounded-xl bg-current/5 p-3 text-[10px] opacity-70">Este serviço foi cancelado.</p>}
    {!provider && isFinalized && <div className="mt-4">
      {loadingReview || hasReview === null
        ? <p className="text-[10px] opacity-65">Verificando avaliação...</p>
        : hasReview
          ? <p className="rounded-xl bg-current/5 p-3 text-[10px]">Serviço concluído e avaliação enviada.</p>
          : <button onClick={() => setReviewOpen(true)} className="w-full rounded-xl bg-[#087a39] px-4 py-3 text-[11px] font-bold text-white">Avaliar prestador</button>}
    </div>}
    {service.startDate && <p className="mt-3 text-[9px] opacity-55">Início registrado pela API: {new Date(service.startDate).toLocaleString('pt-BR')}</p>}
    {provider && service.startDate && statusName === 'em andamento' && <p className="mt-2 text-[10px] opacity-65"></p>}
  </section>
}
