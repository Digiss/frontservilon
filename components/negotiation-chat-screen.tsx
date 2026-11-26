'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { api, type Negotiation, type NegotiationMessage, type Role, type ServiceRecord } from '@/lib/api'

function formatPrice(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function NegotiationChatScreen({
  negotiation,
  postTitle,
  role,
  onBack,
  onUpdated,
}: {
  negotiation: Negotiation
  postTitle: string
  role: Role
  onBack: () => void
  onUpdated: () => void
}) {
  const [messages, setMessages] = useState<NegotiationMessage[] | null>(null)
  const [isMessageActive, setIsMessageActive] = useState(negotiation.isMessageActive)
  const [text, setText] = useState('')
  const [price, setPrice] = useState('')
  const [deliveryDays, setDeliveryDays] = useState('')
  const [proposalOpen, setProposalOpen] = useState(false)
  const [counteringProposalId, setCounteringProposalId] = useState<number | null>(null)
  const [locallySupersededProposalIds, setLocallySupersededProposalIds] = useState<Set<number>>(() => new Set())
  const [sending, setSending] = useState(false)
  const [acceptingProposalId, setAcceptingProposalId] = useState<number | null>(null)
  const [acceptedService, setAcceptedService] = useState<{ proposalId: number; serviceId: number } | null>(null)
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[] | null>(null)
  const [error, setError] = useState('')
  const refreshing = useRef(false)
  const messageHistory = useRef<NegotiationMessage[]>([])
  const dark = role === 'prestador'
  const ownerRole = negotiation.postOwnerProfileId === 1 ? 'cliente' : 'prestador'
  const isPostOwner = role === ownerRole
  const canSend = isMessageActive || isPostOwner || messages?.length === 0
  const currentMessages = messages || []
  const proposalMessages = currentMessages.filter(
    (message): message is NegotiationMessage & { proposal: NonNullable<NegotiationMessage['proposal']> } =>
      message.proposal !== null,
  )
  const latestProposalMessage = proposalMessages.at(-1)
  const isProposalAccepted = (proposalId: number) =>
    acceptedService?.proposalId === proposalId ||
    Boolean(serviceRecords?.some(service => service.proposalId === proposalId))
  const hasAcceptedProposal = acceptedService !== null ||
    proposalMessages.some(message => isProposalAccepted(message.proposal.id))
  const activeProposalMessage = hasAcceptedProposal ? undefined : latestProposalMessage
  const hasPendingProposal = activeProposalMessage !== undefined
  const canCreateProposal = canSend && serviceRecords !== null && !hasAcceptedProposal && !hasPendingProposal
  const canRespondToProposal = canSend &&
    serviceRecords !== null &&
    !hasAcceptedProposal &&
    activeProposalMessage !== undefined &&
    !activeProposalMessage.isMine &&
    !locallySupersededProposalIds.has(activeProposalMessage.proposal.id)
  const isProposalSuperseded = (proposalId: number) =>
    locallySupersededProposalIds.has(proposalId) ||
    (latestProposalMessage !== undefined && latestProposalMessage.proposal.id !== proposalId)
  const accent = dark ? 'text-[#35d878]' : 'text-[#087a39]'
  const panel = dark ? 'bg-[#111827]' : 'bg-[#effbf2]'

  const markReceivedAsRead = useCallback(async (items: NegotiationMessage[]) => {
    const unread = items.filter(message => !message.isMine && !message.readAt)
    if (!unread.length) return
    const lastUnreadId = Math.max(...unread.map(message => message.messageId))
    await api.markNegotiationMessagesRead(negotiation.id, lastUnreadId)
    onUpdated()
  }, [negotiation.id, onUpdated])

  const refresh = useCallback(async (initial = false) => {
    if (refreshing.current) return
    refreshing.current = true
    try {
      const current = messageHistory.current
      const afterMessageId = initial ? undefined : current.at(-1)?.messageId
      const [messagesResult, servicesResult] = await Promise.allSettled([
        api.getNegotiationMessages(negotiation.id, afterMessageId),
        api.getServiceHistory(),
      ])
      if (messagesResult.status === 'rejected') throw messagesResult.reason
      const result = messagesResult.value
      setIsMessageActive(result.isMessageActive)
      const knownIds = new Set(current.map(message => message.messageId))
      const updated = initial
        ? result.history
        : [...current, ...result.history.filter(message => !knownIds.has(message.messageId))]
      messageHistory.current = updated
      setMessages(updated)
      if (servicesResult.status === 'fulfilled') {
        setServiceRecords(servicesResult.value)
        const accepted = [...updated].reverse().find(message =>
          message.proposal && servicesResult.value.some(service => service.proposalId === message.proposal?.id),
        )
        if (accepted?.proposal) {
          const service = servicesResult.value.find(item => item.proposalId === accepted.proposal?.id)
          if (service) setAcceptedService({ proposalId: service.proposalId, serviceId: service.id })
        }
      } else {
        setError(servicesResult.reason instanceof Error
          ? servicesResult.reason.message
          : 'Não foi possível verificar os serviços criados a partir das propostas.')
      }
      await markReceivedAsRead(result.history)
      if (servicesResult.status === 'fulfilled') setError('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível atualizar a conversa.')
    } finally {
      refreshing.current = false
    }
  }, [markReceivedAsRead, negotiation.id])

  useEffect(() => {
    messageHistory.current = []
    setMessages(null)
    setIsMessageActive(negotiation.isMessageActive)
    setServiceRecords(null)
    setAcceptedService(null)
    setProposalOpen(false)
    setCounteringProposalId(null)
    setLocallySupersededProposalIds(new Set())
    setError('')
    void refresh(true)
    const timer = window.setInterval(() => { void refresh() }, 4000)
    return () => window.clearInterval(timer)
  }, [negotiation.id, refresh])

  const sendText = async () => {
    const content = text.trim()
    if (!content || !canSend || sending) return
    setSending(true)
    setError('')
    try {
      await api.sendNegotiationMessage(negotiation.id, content)
      setText('')
      await refresh(true)
      onUpdated()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível enviar a mensagem.')
    } finally {
      setSending(false)
    }
  }

  const openNewProposal = () => {
    setCounteringProposalId(null)
    setPrice('')
    setDeliveryDays('')
    setProposalOpen(true)
    setError('')
  }

  const openCounterProposal = (message: NegotiationMessage) => {
    if (!message.proposal || !canRespondToProposal || activeProposalMessage?.proposal.id !== message.proposal.id) return
    setCounteringProposalId(message.proposal.id)
    setPrice(String(message.proposal.price))
    setDeliveryDays(String(message.proposal.deliveryDate))
    setProposalOpen(true)
    setError('')
  }

  const closeProposalForm = () => {
    setProposalOpen(false)
    setCounteringProposalId(null)
  }

  const sendProposal = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const amount = Number(price.replace(',', '.'))
    const days = Number(deliveryDays)
    const isCounterProposal = counteringProposalId !== null
    const canSubmit = isCounterProposal
      ? canRespondToProposal && activeProposalMessage?.proposal.id === counteringProposalId
      : canCreateProposal
    if (!canSubmit) {
      setError(hasAcceptedProposal
        ? 'Esta negociação já foi aceita.'
        : hasPendingProposal
          ? 'Esta proposta já não está disponível para resposta.'
          : 'Não foi possível verificar o status das propostas; tente novamente.')
      return
    }
    if (!Number.isFinite(amount) || amount <= 0 || !Number.isInteger(days) || days < 1 || sending) {
      setError('Informe um preço positivo e um prazo inteiro de pelo menos 1 dia.')
      return
    }
    setSending(true)
    setError('')
    try {
      await api.createProposal(negotiation.id, amount, days)
      if (counteringProposalId !== null) {
        setLocallySupersededProposalIds(current => new Set(current).add(counteringProposalId))
      }
      setPrice('')
      setDeliveryDays('')
      closeProposalForm()
      await refresh(true)
      onUpdated()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível enviar a proposta.')
    } finally {
      setSending(false)
    }
  }

  const acceptProposal = async (proposalId: number) => {
    if (!canRespondToProposal || activeProposalMessage?.proposal.id !== proposalId) {
      setError('Esta proposta já foi substituída ou não está mais disponível para aceite.')
      return
    }
    setAcceptingProposalId(proposalId)
    setError('')
    try {
      const serviceId = await api.acceptProposal(proposalId)
      setAcceptedService({ proposalId, serviceId })
      await refresh(true)
      onUpdated()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível aceitar a proposta.')
    } finally {
      setAcceptingProposalId(null)
    }
  }

  return <section className="flex min-h-[70vh] flex-col">
    <header className="mb-4 flex items-start justify-between border-b border-current/15 pb-4">
      <div className="min-w-0">
        <h1 className="truncate text-[17px] font-extrabold">{postTitle}</h1>
        <p className="mt-1 text-[10px] opacity-60">
          {isMessageActive ? 'Negociação · Chat aberto' : 'Negociação · Aguardando resposta'}
        </p>
      </div>
      <button onClick={onBack} className={`ml-3 shrink-0 text-[11px] font-bold ${accent}`}>Voltar</button>
    </header>

    {error && <p role="alert" className="mb-3 rounded-xl bg-red-500/10 p-3 text-[11px] text-red-600">{error}</p>}
    {acceptedService && <div role="status" className="mb-3 rounded-xl bg-green-500/10 p-3 text-[11px] text-green-700">
      Proposta aceita. O serviço #{acceptedService.serviceId} foi criado.
    </div>}

    {!isMessageActive && <p className={`mb-3 rounded-xl p-3 text-[10px] ${panel} opacity-75`}>
      {isPostOwner
        ? 'Você é responsável pelo post. Responda com uma mensagem ou proposta para abrir o chat.'
        : currentMessages.length === 0
          ? 'Envie a mensagem inicial para começar a negociação.'
        : 'Aguardando o responsável pelo post responder. Você poderá continuar a conversa depois.'}
    </p>}

    <div aria-live="polite" className="flex-1 space-y-3 overflow-y-auto pb-4">
      {messages === null
        ? <p className="rounded-xl bg-current/5 p-4 text-center text-[10px] opacity-60">Carregando mensagens...</p>
        : currentMessages.length
          ? currentMessages.map(message => <article
            key={message.messageId}
            className={`max-w-[88%] rounded-2xl px-3 py-2 text-[11px] ${message.isMine ? `ml-auto ${dark ? 'bg-[#123f2c]' : 'bg-[#d5f2dd]'}` : 'bg-current/10'}`}
          >
            {message.proposal
              ? <div>
                <strong className="block text-[10px]">
                  {proposalMessages.findIndex(item => item.messageId === message.messageId) > 0 ? 'Contraproposta' : 'Proposta'}
                </strong>
                <p className="mt-1">Preço: {formatPrice(message.proposal.price)}</p>
                <p>Prazo: {message.proposal.deliveryDate} dia(s)</p>
                {isProposalAccepted(message.proposal.id) && <p className="mt-2 text-[10px] font-bold text-green-700">
                  Aceita{acceptedService?.proposalId === message.proposal.id ? ` · serviço #${acceptedService.serviceId}` : ''}
                </p>}
                {!isProposalAccepted(message.proposal.id) && hasAcceptedProposal && <p className="mt-2 text-[10px] opacity-60">Negociação encerrada por outra proposta aceita.</p>}
                {!isProposalAccepted(message.proposal.id) && !hasAcceptedProposal && isProposalSuperseded(message.proposal.id) &&
                  <p className="mt-2 text-[10px] opacity-60">
                    {locallySupersededProposalIds.has(message.proposal.id) ? 'Contraproposta enviada; atualizando a conversa.' : 'Substituída por uma contraproposta.'}
                  </p>}
                {!isProposalAccepted(message.proposal.id) &&
                  !hasAcceptedProposal &&
                  !isProposalSuperseded(message.proposal.id) &&
                  message.isMine &&
                  <p className="mt-2 text-[10px] opacity-60">Aguardando resposta à sua proposta.</p>}
                {!isProposalAccepted(message.proposal.id) &&
                  !hasAcceptedProposal &&
                  !isProposalSuperseded(message.proposal.id) &&
                  !message.isMine &&
                  canRespondToProposal &&
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      disabled={acceptingProposalId !== null || sending}
                      onClick={() => { void acceptProposal(message.proposal!.id) }}
                      className="rounded-lg bg-[#087a39] px-3 py-2 text-[10px] font-bold text-white disabled:opacity-50"
                    >
                      {acceptingProposalId === message.proposal.id ? 'Aceitando...' : 'Aceitar proposta'}
                    </button>
                    <button
                      disabled={sending || acceptingProposalId !== null}
                      onClick={() => openCounterProposal(message)}
                      className={`rounded-lg border border-current/20 px-3 py-2 text-[10px] font-bold ${accent} disabled:opacity-50`}
                    >
                      Fazer contraproposta
                    </button>
                  </div>}
                {!isProposalAccepted(message.proposal.id) &&
                  !hasAcceptedProposal &&
                  !isProposalSuperseded(message.proposal.id) &&
                  !message.isMine &&
                  serviceRecords === null &&
                  <p className="mt-2 text-[10px] opacity-60">Verificando o status da proposta...</p>}
              </div>
              : <p className="whitespace-pre-wrap">{message.content || 'Mensagem sem texto'}</p>}
            <time className="mt-1 block text-right text-[9px] opacity-50">
              {new Date(message.createdAt).toLocaleString('pt-BR')}
              {message.isMine ? message.readAt ? ' · Lida' : ' · Enviada' : ''}
            </time>
          </article>)
          : <p className="rounded-xl border border-dashed border-current/20 p-5 text-center text-[10px] opacity-60">Ainda não há mensagens nesta negociação.</p>}
    </div>

    {canSend && <div className="space-y-2 border-t border-current/10 pt-3">
      {hasPendingProposal && <p role="status" className={`rounded-xl p-3 text-[10px] ${panel}`}>
        {activeProposalMessage?.isMine
          ? 'Sua proposta está aguardando resposta.'
          : locallySupersededProposalIds.has(activeProposalMessage?.proposal.id ?? -1)
            ? 'Contraproposta enviada. Atualizando a conversa...'
            : 'Você pode aceitar ou fazer uma contraproposta na proposta recebida.'}
      </p>}
      {proposalOpen && <form onSubmit={event => { void sendProposal(event) }} className={`space-y-2 rounded-xl p-3 ${panel}`}>
        <h2 className="text-[11px] font-bold">{counteringProposalId !== null ? 'Fazer contraproposta' : 'Enviar proposta'}</h2>
        <label className="block text-[10px]">Preço
          <input value={price} onChange={event => setPrice(event.target.value)} type="number" min="0.01" step="0.01" required className="mt-1 w-full rounded-lg border border-current/15 bg-transparent p-2 text-[11px]" />
        </label>
        <label className="block text-[10px]">Prazo em dias
          <input value={deliveryDays} onChange={event => setDeliveryDays(event.target.value.replace(/\D/g, ''))} type="number" min="1" step="1" required className="mt-1 w-full rounded-lg border border-current/15 bg-transparent p-2 text-[11px]" />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button type="submit" disabled={sending} className="rounded-lg bg-[#087a39] p-2 text-[10px] font-bold text-white disabled:opacity-50">{sending ? 'Enviando...' : counteringProposalId !== null ? 'Enviar contraproposta' : 'Enviar proposta'}</button>
          <button type="button" onClick={closeProposalForm} className="rounded-lg border border-current/20 p-2 text-[10px] font-bold">Voltar</button>
        </div>
      </form>}
      {!proposalOpen && <div className="flex gap-2">
        {canCreateProposal && <button type="button" onClick={openNewProposal} disabled={sending} aria-label="Criar proposta" className={`shrink-0 rounded-xl border border-current/20 px-3 text-[10px] font-bold ${accent} disabled:opacity-50`}>Proposta</button>}
        <textarea
          value={text}
          onChange={event => setText(event.target.value)}
          maxLength={1000}
          rows={2}
          placeholder="Escreva uma mensagem..."
          className="min-w-0 flex-1 resize-y rounded-xl border border-current/15 bg-transparent px-3 py-2 text-[11px] outline-none"
        />
        <button type="button" onClick={() => { void sendText() }} disabled={sending || !text.trim()} className="rounded-xl bg-[#087a39] px-3 text-[10px] font-bold text-white disabled:opacity-50">
          {sending ? '...' : 'Enviar'}
        </button>
      </div>}
    </div>}
  </section>
}
